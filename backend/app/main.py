from fastapi import FastAPI

from backend.app.database import engine
from backend.app.routers.courses import router as courses_router
from backend.app.routers.modules import router as modules_router
from backend.app.routers.training_content import (
    router as training_content_router,
)
from backend.app.routers.quizzes import router as quizzes_router
from backend.app.routers.certificates import router as certificates_router
import backend.app.models

app = FastAPI(title="DataCaliper Training API")
app.include_router(courses_router)
app.include_router(modules_router)
app.include_router(quizzes_router)
app.include_router(training_content_router)
app.include_router(certificates_router)

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
