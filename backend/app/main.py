import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from backend.app.database import engine

import backend.app.models

from backend.app.routers.auth import (
    router as auth_router,
)

from backend.app.routers.courses import (
    router as courses_router,
)

from backend.app.routers.modules import (
    router as modules_router,
)

from backend.app.routers.quizzes import (
    router as quizzes_router,
)

from backend.app.routers.training_content import (
    router as training_content_router,
)

from backend.app.routers.certificates import (
    router as certificates_router,
)

from backend.app.routers.admin import (
    router as admin_router,
)

from backend.app.routers.instructor import (
    router as instructor_router,
)

from backend.app.services.deadline_reminder import (
    process_deadline_reminders,
)


# =========================================================
# DEADLINE REMINDER BACKGROUND TASK
# =========================================================

async def deadline_reminder_loop():
    """
    Runs the deadline reminder checker once every minute.
    """

    while True:

        try:

            # -------------------------------------------------
            # Run synchronous database/email work in a worker
            # thread so it does not block FastAPI.
            # -------------------------------------------------

            await asyncio.to_thread(
                process_deadline_reminders
            )

        except asyncio.CancelledError:

            # -------------------------------------------------
            # Application is shutting down.
            # -------------------------------------------------

            raise

        except Exception as error:

            print(
                "Deadline reminder background task error: "
                f"{error}"
            )

        # -----------------------------------------------------
        # Wait one minute before checking again.
        # -----------------------------------------------------

        await asyncio.sleep(60)


# =========================================================
# APPLICATION LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # =====================================================
    # STARTUP
    # =====================================================

    reminder_task = asyncio.create_task(
        deadline_reminder_loop()
    )

    print(
        "Deadline reminder service started."
    )

    try:

        yield

    finally:

        # =================================================
        # SHUTDOWN
        # =================================================

        reminder_task.cancel()

        try:

            await reminder_task

        except asyncio.CancelledError:

            pass

        print(
            "Deadline reminder service stopped."
        )


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="DataCaliper Training API",
    lifespan=lifespan,
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    auth_router
)

app.include_router(
    courses_router
)

app.include_router(
    modules_router
)

app.include_router(
    quizzes_router
)

app.include_router(
    training_content_router
)

app.include_router(
    certificates_router
)

app.include_router(
    admin_router
)

app.include_router(
    instructor_router
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message":
        "DataCaliper Training API is running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

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