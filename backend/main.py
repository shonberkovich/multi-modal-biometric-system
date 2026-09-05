"""FastAPI application entrypoint for the multi-modal biometric system."""
import os
import tempfile

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import biometrics
import crud
from database import IdentityMap, get_db, init_db

app = FastAPI(title="Multi-Modal Biometric System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}


def _file_extension(upload: UploadFile) -> str:
    return os.path.splitext(upload.filename or "")[1].lstrip(".") or "bin"


async def _save_and_extract(db: Session, random_id: str, method: str, upload: UploadFile) -> list:
    """Persist the raw upload, then run QA + feature extraction on it.

    Raises biometrics.QAFailure / biometrics.ExtractionFailure on failure.
    """
    content = await upload.read()
    ext = _file_extension(upload)
    crud.save_raw_data(db, random_id, capture=method, ext=ext, content=content)

    fd, tmp_path = tempfile.mkstemp(suffix=f".{ext}")
    os.close(fd)
    try:
        with open(tmp_path, "wb") as f:
            f.write(content)
        return biometrics.extract_vector(method, tmp_path)
    finally:
        os.unlink(tmp_path)


@app.post("/enroll")
async def enroll(
    national_id: str = Form(...),
    full_name: str = Form(...),
    face: UploadFile = File(...),
    voice: UploadFile = File(...),
    palm: UploadFile = File(...),
    gait: UploadFile = File(...),
    fingerprint: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Enroll a new person: 5 biometric captures -> QA -> extract -> save."""
    if crud.get_person_by_national_id(db, national_id):
        raise HTTPException(status_code=409, detail="national_id is already enrolled")

    uploads = {"face": face, "voice": voice, "palm": palm, "gait": gait, "fingerprint": fingerprint}
    person = crud.create_person(db, national_id=national_id, full_name=full_name)

    try:
        for method, upload in uploads.items():
            vector = await _save_and_extract(db, person.random_id, method, upload)
            crud.save_feature_vector(db, person.random_id, method, vector)
            crud.save_retrieval_vector(
                db,
                person.random_id,
                method,
                vector_type="raw",
                vector_kind="embedding",
                dim=len(vector),
                vector_512=vector if len(vector) == 512 else None,
                vector_768=vector if len(vector) == 768 else None,
            )
    except biometrics.QAFailure as exc:
        crud.delete_person(db, person.random_id)
        raise HTTPException(status_code=422, detail=f"QA check failed for '{method}': {exc}")
    except biometrics.ExtractionFailure as exc:
        crud.delete_person(db, person.random_id)
        raise HTTPException(status_code=422, detail=f"Feature extraction failed for '{method}': {exc}")

    return {
        "random_id": person.random_id,
        "national_id": national_id,
        "full_name": full_name,
        "methods_enrolled": list(uploads.keys()),
    }


@app.post("/verify/single")
async def verify_single(
    method: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Verify a single biometric capture against every enrolled identity.

    Runs the QA filter, extracts the capture's feature vector, and compares
    it via cosine similarity against every stored vector for that method,
    returning the closest match (if any) and whether it clears the
    per-method match threshold.
    """
    if method not in biometrics.METHODS:
        raise HTTPException(status_code=400, detail=f"Unknown method: {method}")

    content = await file.read()
    ext = _file_extension(file)
    fd, tmp_path = tempfile.mkstemp(suffix=f".{ext}")
    os.close(fd)
    try:
        with open(tmp_path, "wb") as f:
            f.write(content)
        try:
            query_vector = biometrics.extract_vector(method, tmp_path)
        except biometrics.QAFailure as exc:
            raise HTTPException(status_code=422, detail=f"QA check failed: {exc}")
        except biometrics.ExtractionFailure as exc:
            raise HTTPException(status_code=422, detail=f"Feature extraction failed: {exc}")
    finally:
        os.unlink(tmp_path)

    stored = crud.get_all_feature_vectors_for_method(db, method)
    candidates = [(fv.random_id, fv.vector) for fv in stored]
    best_id, score = biometrics.best_match(query_vector, candidates)

    threshold = biometrics.MATCH_THRESHOLDS[method]
    matched = best_id is not None and score >= threshold

    result = {"method": method, "matched": matched, "score": score}
    if matched:
        identity = db.get(IdentityMap, best_id)
        result["random_id"] = best_id
        result["national_id"] = identity.national_id if identity else None
        result["full_name"] = identity.full_name if identity else None
    return result


def _identity_summary(db: Session, random_id: str) -> dict:
    identity = db.get(IdentityMap, random_id)
    return {
        "random_id": random_id,
        "national_id": identity.national_id if identity else None,
        "full_name": identity.full_name if identity else None,
    }


@app.post("/verify/fusion")
async def verify_fusion(
    face: UploadFile = File(...),
    voice: UploadFile = File(...),
    palm: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Verify by fusing Face, Voice and Palm captures.

    Returns both a Majority Voting result (2-out-of-3 independent
    single-method matches) and a Weighted Vector Fusion result
    (V_fused = [w_f*V_f, w_v*V_v, w_p*V_p], matched against every
    enrolled person who has all three methods on file).
    """
    uploads = {"face": face, "voice": voice, "palm": palm}
    query_vectors = {}

    for method, upload in uploads.items():
        content = await upload.read()
        ext = _file_extension(upload)
        fd, tmp_path = tempfile.mkstemp(suffix=f".{ext}")
        os.close(fd)
        try:
            with open(tmp_path, "wb") as f:
                f.write(content)
            try:
                query_vectors[method] = biometrics.extract_vector(method, tmp_path)
            except biometrics.QAFailure as exc:
                raise HTTPException(status_code=422, detail=f"QA check failed for '{method}': {exc}")
            except biometrics.ExtractionFailure as exc:
                raise HTTPException(status_code=422, detail=f"Feature extraction failed for '{method}': {exc}")
        finally:
            os.unlink(tmp_path)

    # --- Sub-task A: Majority Voting (2 out of 3) ---
    per_method_result = {}
    for method in biometrics.FUSION_METHODS:
        stored = crud.get_all_feature_vectors_for_method(db, method)
        candidates = [(fv.random_id, fv.vector) for fv in stored]
        best_id, score = biometrics.best_match(query_vectors[method], candidates)
        matched = best_id is not None and score >= biometrics.MATCH_THRESHOLDS[method]
        per_method_result[method] = {"random_id": best_id, "score": score, "matched": matched}

    fused_matched, winning_id = biometrics.majority_vote(
        {m: (r["random_id"], r["matched"]) for m, r in per_method_result.items()}
    )
    majority_result = {"matched": fused_matched, "per_method": per_method_result}
    if fused_matched:
        majority_result.update(_identity_summary(db, winning_id))

    # --- Sub-task B: Weighted Vector Fusion ---
    query_fused = biometrics.build_fused_vector(query_vectors)

    per_person_vectors: dict = {}
    for method in biometrics.FUSION_METHODS:
        for fv in crud.get_all_feature_vectors_for_method(db, method):
            per_person_vectors.setdefault(fv.random_id, {})[method] = fv.vector

    fusion_candidates = [
        (random_id, biometrics.build_fused_vector(methods))
        for random_id, methods in per_person_vectors.items()
        if set(biometrics.FUSION_METHODS).issubset(methods)
    ]
    fusion_best_id, fusion_score = biometrics.best_match(query_fused, fusion_candidates)
    fusion_matched = fusion_best_id is not None and fusion_score >= biometrics.FUSION_MATCH_THRESHOLD

    fusion_result = {"matched": fusion_matched, "score": fusion_score}
    if fusion_matched:
        fusion_result.update(_identity_summary(db, fusion_best_id))

    return {"majority_vote": majority_result, "weighted_fusion": fusion_result}
