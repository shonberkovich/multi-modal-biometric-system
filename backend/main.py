"""FastAPI application entrypoint for the multi-modal biometric system."""
import os
import tempfile

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import biometrics
import crud
from database import get_db, init_db

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
