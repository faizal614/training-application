from datetime import datetime
from io import BytesIO
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db
from backend.app.models.certificate import Certificate
from backend.app.models.course import Course
from backend.app.models.module import Module
from backend.app.models.module_progress import (
    ModuleProgress,
    ModuleProgressStatus,
)
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.user import User
from backend.app.schemas.certificate import CertificateResponse


router = APIRouter(
    prefix="/courses",
    tags=["Certificates"],
)


# -------------------------
# GENERATE CERTIFICATE
# -------------------------

@router.post(
    "/{course_id}/certificate",
    response_model=CertificateResponse,
)
def generate_certificate(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    user_id = current_user.id
    user = current_user

    modules = (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .order_by(Module.display_order)
        .all()
    )

    if not modules:
        raise HTTPException(
            status_code=400,
            detail="Course has no modules",
        )

    module_ids = [module.id for module in modules]

    progress_records = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id == user_id,
            ModuleProgress.module_id.in_(module_ids),
        )
        .all()
    )

    completed_module_ids = {
        progress.module_id
        for progress in progress_records
        if progress.status == ModuleProgressStatus.COMPLETED
    }

    if len(completed_module_ids) != len(module_ids):
        raise HTTPException(
            status_code=400,
            detail="All modules must be completed before generating a certificate",
        )

    existing_certificate = (
        db.query(Certificate)
        .filter(
            Certificate.user_id == user_id,
            Certificate.course_id == course_id,
        )
        .first()
    )

    if existing_certificate is not None:
        return existing_certificate

    quizzes = (
        db.query(Quiz)
        .filter(Quiz.module_id.in_(module_ids))
        .all()
    )

    if len(quizzes) != len(module_ids):
        raise HTTPException(
            status_code=400,
            detail="Every module must have a quiz before generating a certificate",
        )

    quiz_ids = [quiz.id for quiz in quizzes]

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.quiz_id.in_(quiz_ids),
            QuizAttempt.passed.is_(True),
        )
        .order_by(QuizAttempt.attempted_at.desc())
        .all()
    )

    highest_scores = {}

    for attempt in attempts:
        current_score = highest_scores.get(attempt.quiz_id)

        if current_score is None or attempt.score > current_score:
            highest_scores[attempt.quiz_id] = attempt.score

    if len(highest_scores) != len(quiz_ids):
        raise HTTPException(
            status_code=400,
            detail="A passed quiz attempt is required for every module",
        )

    final_score = round(
        sum(highest_scores.values()) / len(highest_scores)
    )

    certificate = Certificate(
        certificate_number=f"DC-{uuid4().hex[:12].upper()}",
        user_id=user_id,
        course_id=course_id,
        participant_name=user.name,
        course_name=course.title,
        completion_date=datetime.utcnow(),
        final_score=final_score,
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    return certificate


# -------------------------
# GET MY CERTIFICATES
# -------------------------

@router.get(
    "/certificates/me",
    response_model=list[CertificateResponse],
)
def get_my_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    certificates = (
        db.query(Certificate)
        .filter(
            Certificate.user_id == current_user.id,
        )
        .order_by(Certificate.completion_date.desc())
        .all()
    )

    return certificates


# -------------------------
# DOWNLOAD MY COURSE CERTIFICATE
# -------------------------

@router.get(
    "/{course_id}/certificate/download",
)
def download_certificate(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    certificate = (
        db.query(Certificate)
        .filter(
            Certificate.course_id == course_id,
            Certificate.user_id == current_user.id,
        )
        .first()
    )

    if certificate is None:
        raise HTTPException(
            status_code=404,
            detail="Certificate not found for this course",
        )

    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=A4,
    )

    width, height = A4

    pdf.setTitle(
        f"Certificate - {certificate.certificate_number}"
    )

    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawCentredString(
        width / 2,
        height - 150,
        "Certificate of Completion",
    )

    pdf.setFont("Helvetica", 14)
    pdf.drawCentredString(
        width / 2,
        height - 220,
        "This certificate is proudly presented to",
    )

    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(
        width / 2,
        height - 270,
        certificate.participant_name,
    )

    pdf.setFont("Helvetica", 14)
    pdf.drawCentredString(
        width / 2,
        height - 320,
        "for successfully completing",
    )

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawCentredString(
        width / 2,
        height - 365,
        certificate.course_name,
    )

    pdf.setFont("Helvetica", 12)

    pdf.drawCentredString(
        width / 2,
        height - 430,
        f"Final Score: {certificate.final_score}%",
    )

    pdf.drawCentredString(
        width / 2,
        height - 460,
        f"Completion Date: {certificate.completion_date.date()}",
    )

    pdf.drawCentredString(
        width / 2,
        height - 500,
        f"Certificate Number: {certificate.certificate_number}",
    )

    pdf.showPage()
    pdf.save()

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="certificate-'
                f'{certificate.certificate_number}.pdf"'
            )
        },
    )