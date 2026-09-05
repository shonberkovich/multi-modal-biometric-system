"""FastAPI application entrypoint for the multi-modal biometric system."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db

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
