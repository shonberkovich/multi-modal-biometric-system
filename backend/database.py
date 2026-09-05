"""
Database setup and ORM schema for the multi-modal biometric system.

Tables:
    Person_directory          - random_id (PK, UUID) -> created_at
    Identity_map              - random_id (PK/FK) -> national_id, full_name, name_norm, created_at
    Raw_data                  - captured raw biometric files (image/audio/video bytes + metadata)
    Feature_vectors           - per-person, per-method extracted feature vectors
    Method_retrieval_vectors  - per-method retrieval-optimized vector storage (512d/768d/blob)
"""
import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    DateTime,
    LargeBinary,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./biometric.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class PersonDirectory(Base):
    __tablename__ = "person_directory"

    random_id = Column(String, primary_key=True, default=_uuid)
    created_at = Column(DateTime, default=_now, nullable=False)

    identity = relationship("IdentityMap", back_populates="person", uselist=False)
    raw_data = relationship("RawData", back_populates="person")
    feature_vectors = relationship("FeatureVector", back_populates="person")
    retrieval_vectors = relationship("MethodRetrievalVector", back_populates="person")


class IdentityMap(Base):
    __tablename__ = "identity_map"

    random_id = Column(String, ForeignKey("person_directory.random_id"), primary_key=True)
    national_id = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    name_norm = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    person = relationship("PersonDirectory", back_populates="identity")


class RawData(Base):
    __tablename__ = "raw_data"

    # Composite PK (random_id, capture): a person has one raw capture per
    # biometric method (5 total), mirroring the Feature_vectors table's
    # (random_id, method) composite key below.
    random_id = Column(String, ForeignKey("person_directory.random_id"), primary_key=True)
    capture = Column(String, primary_key=True)  # "face", "voice", "palm", "gait", "fingerprint"
    ext = Column(String, nullable=False)  # file extension, e.g. "jpg", "wav", "mp4"
    sha256 = Column(String, nullable=False)
    byte_size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=_now, nullable=False)
    image_bytes = Column(LargeBinary, nullable=True)

    person = relationship("PersonDirectory", back_populates="raw_data")


class FeatureVector(Base):
    __tablename__ = "feature_vectors"

    random_id = Column(String, ForeignKey("person_directory.random_id"), primary_key=True)
    method = Column(String, primary_key=True)  # "face" | "voice" | "palm" | "gait" | "fingerprint"
    vector = Column(JSON, nullable=True)
    dim = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    person = relationship("PersonDirectory", back_populates="feature_vectors")


class MethodRetrievalVector(Base):
    __tablename__ = "method_retrieval_vectors"

    random_id = Column(String, ForeignKey("person_directory.random_id"), primary_key=True)
    method = Column(String, primary_key=True)
    vector_type = Column(String, primary_key=True)  # e.g. "raw" | "quantized"
    vector_kind = Column(String, nullable=False)  # e.g. "embedding"
    dim = Column(Integer, nullable=False)
    distance_metric = Column(String, nullable=False, default="cosine")
    metadata_json = Column(JSON, nullable=True)
    vector_512 = Column(JSON, nullable=True)
    vector_768 = Column(JSON, nullable=True)
    vector_blob = Column(LargeBinary, nullable=True)

    person = relationship("PersonDirectory", back_populates="retrieval_vectors")


def init_db() -> None:
    """Create all tables if they do not already exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
