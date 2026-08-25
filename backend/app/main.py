from fastapi import FastAPI

from backend.app.database import engine
from backend.app.routers.courses import router as courses_router
import backend.app.models

app = FastAPI(title="DataCaliper Training API")
app.include_router(courses_router)

@app.get("/")
def root():
    return {"message": "DataCaliper Training API is running"}


@app.get("/health")
def health_check():
    try:
        with engine.connect():
            return {
                "status": "ok",
                "database": "connected",
            }
    except Exception as exc:
        return {
            "status": "error",
            "database": "connection failed",
            "detail": str(exc),
        }
