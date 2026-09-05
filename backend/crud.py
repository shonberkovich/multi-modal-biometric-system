"""CRUD utility functions for the biometric system database."""
import hashlib
import uuid
from typing import Optional, Sequence

from sqlalchemy.orm import Session

from database import PersonDirectory, IdentityMap, RawData, FeatureVector, MethodRetrievalVector


def create_person(db: Session, national_id: str, full_name: str) -> PersonDirectory:
    """Create a new Person_directory + Identity_map row and return the person."""
    person = PersonDirectory(random_id=str(uuid.uuid4()))
    db.add(person)
    db.flush()

    identity = IdentityMap(
        random_id=person.random_id,
        national_id=national_id,
        full_name=full_name,
        name_norm=full_name.strip().lower(),
    )
    db.add(identity)
    db.commit()
    db.refresh(person)
    return person


def get_person_by_national_id(db: Session, national_id: str) -> Optional[PersonDirectory]:
    identity = db.query(IdentityMap).filter(IdentityMap.national_id == national_id).first()
    return identity.person if identity else None


def get_all_persons(db: Session) -> Sequence[PersonDirectory]:
    return db.query(PersonDirectory).all()


def save_raw_data(
    db: Session,
    random_id: str,
    capture: str,
    ext: str,
    content: bytes,
    store_bytes: bool = True,
) -> RawData:
    """Persist a raw captured file's metadata (and optionally its bytes)."""
    raw = RawData(
        random_id=random_id,
        capture=capture,
        ext=ext,
        sha256=hashlib.sha256(content).hexdigest(),
        byte_size=len(content),
        image_bytes=content if store_bytes else None,
    )
    db.add(raw)
    db.commit()
    db.refresh(raw)
    return raw


def save_feature_vector(db: Session, random_id: str, method: str, vector: list) -> FeatureVector:
    """Insert or update the feature vector for a given person + method."""
    existing = (
        db.query(FeatureVector)
        .filter(FeatureVector.random_id == random_id, FeatureVector.method == method)
        .first()
    )
    if existing:
        existing.vector = vector
        existing.dim = len(vector)
        db.commit()
        db.refresh(existing)
        return existing

    fv = FeatureVector(random_id=random_id, method=method, vector=vector, dim=len(vector))
    db.add(fv)
    db.commit()
    db.refresh(fv)
    return fv


def get_feature_vector(db: Session, random_id: str, method: str) -> Optional[FeatureVector]:
    return (
        db.query(FeatureVector)
        .filter(FeatureVector.random_id == random_id, FeatureVector.method == method)
        .first()
    )


def get_all_feature_vectors_for_method(db: Session, method: str) -> Sequence[FeatureVector]:
    """Retrieve every stored feature vector for a given method (for verification/matching)."""
    return db.query(FeatureVector).filter(FeatureVector.method == method).all()


def save_retrieval_vector(
    db: Session,
    random_id: str,
    method: str,
    vector_type: str,
    vector_kind: str,
    dim: int,
    distance_metric: str = "cosine",
    metadata_json: Optional[dict] = None,
    vector_512: Optional[list] = None,
    vector_768: Optional[list] = None,
    vector_blob: Optional[bytes] = None,
) -> MethodRetrievalVector:
    existing = (
        db.query(MethodRetrievalVector)
        .filter(
            MethodRetrievalVector.random_id == random_id,
            MethodRetrievalVector.method == method,
            MethodRetrievalVector.vector_type == vector_type,
        )
        .first()
    )
    if existing:
        existing.vector_kind = vector_kind
        existing.dim = dim
        existing.distance_metric = distance_metric
        existing.metadata_json = metadata_json
        existing.vector_512 = vector_512
        existing.vector_768 = vector_768
        existing.vector_blob = vector_blob
        db.commit()
        db.refresh(existing)
        return existing

    mrv = MethodRetrievalVector(
        random_id=random_id,
        method=method,
        vector_type=vector_type,
        vector_kind=vector_kind,
        dim=dim,
        distance_metric=distance_metric,
        metadata_json=metadata_json,
        vector_512=vector_512,
        vector_768=vector_768,
        vector_blob=vector_blob,
    )
    db.add(mrv)
    db.commit()
    db.refresh(mrv)
    return mrv
