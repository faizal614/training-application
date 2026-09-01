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

from backend.app.services.notifications import (
    send_certificate_notification,
)


router = APIRouter(
    prefix="/courses",
    tags=["Certificates"],
)


# =========================================================
# CREATE CERTIFICATE PDF
# =========================================================

def create_certificate_pdf(
    certificate: Certificate,
) -> bytes:
    """
    Generate the certificate PDF in memory.

    Returns:
        PDF content as bytes.
    """

    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=A4,
    )

    width, height = A4

    # -----------------------------------------------------
    # PDF TITLE
    # -----------------------------------------------------

    pdf.setTitle(
        f"Certificate - "
        f"{certificate.certificate_number}"
    )

    # -----------------------------------------------------
    # CERTIFICATE HEADING
    # -----------------------------------------------------

    pdf.setFont(
        "Helvetica-Bold",
        24,
    )

    pdf.drawCentredString(
        width / 2,
        height - 150,
        "Certificate of Completion",
    )

    # -----------------------------------------------------
    # PRESENTED TO
    # -----------------------------------------------------

    pdf.setFont(
        "Helvetica",
        14,
    )

    pdf.drawCentredString(
        width / 2,
        height - 220,
        "This certificate is proudly presented to",
    )

    # -----------------------------------------------------
    # PARTICIPANT NAME
    # -----------------------------------------------------

    pdf.setFont(
        "Helvetica-Bold",
        20,
    )

    pdf.drawCentredString(
        width / 2,
        height - 270,
        certificate.participant_name,
    )

    # -----------------------------------------------------
    # COMPLETION TEXT
    # -----------------------------------------------------

    pdf.setFont(
        "Helvetica",
        14,
    )

    pdf.drawCentredString(
        width / 2,
        height - 320,
        "for successfully completing",
    )

    # -----------------------------------------------------
    # COURSE NAME
    # -----------------------------------------------------

    pdf.setFont(
        "Helvetica-Bold",
        18,
    )

    pdf.drawCentredString(
        width / 2,
        height - 365,
        certificate.course_name,
    )

    # -----------------------------------------------------
    # FINAL SCORE
    # -----------------------------------------------------

    pdf.setFont(
        "Helvetica",
        12,
    )

    pdf.drawCentredString(
        width / 2,
        height - 430,
        f"Final Score: {certificate.final_score}%",
    )

    # -----------------------------------------------------
    # COMPLETION DATE
    # -----------------------------------------------------

    pdf.drawCentredString(
        width / 2,
        height - 460,
        (
            "Completion Date: "
            f"{certificate.completion_date.date()}"
        ),
    )

    # -----------------------------------------------------
    # CERTIFICATE NUMBER
    # -----------------------------------------------------

    pdf.drawCentredString(
        width / 2,
        height - 500,
        (
            "Certificate Number: "
            f"{certificate.certificate_number}"
        ),
    )

    # -----------------------------------------------------
    # FINISH PDF
    # -----------------------------------------------------

    pdf.showPage()
    pdf.save()

    buffer.seek(0)

    return buffer.getvalue()


# =========================================================
# GENERATE CERTIFICATE
# =========================================================

@router.post(
    "/{course_id}/certificate",
    response_model=CertificateResponse,
)
def generate_certificate(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND COURSE
    # -----------------------------------------------------

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id
        )
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    user_id = current_user.id
    user = current_user

    # -----------------------------------------------------
    # GET COURSE MODULES
    # -----------------------------------------------------

    modules = (
        db.query(Module)
        .filter(
            Module.course_id == course_id
        )
        .order_by(
            Module.display_order
        )
        .all()
    )

    if not modules:
        raise HTTPException(
            status_code=400,
            detail="Course has no modules",
        )

    module_ids = [
        module.id
        for module in modules
    ]

    # -----------------------------------------------------
    # CHECK MODULE PROGRESS
    # -----------------------------------------------------

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
        if progress.status
        == ModuleProgressStatus.COMPLETED
    }

    if len(completed_module_ids) != len(module_ids):
        raise HTTPException(
            status_code=400,
            detail=(
                "All modules must be completed "
                "before generating a certificate"
            ),
        )

    # -----------------------------------------------------
    # CHECK EXISTING CERTIFICATE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # GET QUIZZES
    # -----------------------------------------------------

    quizzes = (
        db.query(Quiz)
        .filter(
            Quiz.module_id.in_(module_ids)
        )
        .all()
    )

    if len(quizzes) != len(module_ids):
        raise HTTPException(
            status_code=400,
            detail=(
                "Every module must have a quiz "
                "before generating a certificate"
            ),
        )

    quiz_ids = [
        quiz.id
        for quiz in quizzes
    ]

    # -----------------------------------------------------
    # GET PASSED QUIZ ATTEMPTS
    # -----------------------------------------------------

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.quiz_id.in_(quiz_ids),
            QuizAttempt.passed.is_(True),
        )
        .order_by(
            QuizAttempt.attempted_at.desc()
        )
        .all()
    )

    # -----------------------------------------------------
    # FIND HIGHEST SCORE FOR EACH QUIZ
    # -----------------------------------------------------

    highest_scores = {}

    for attempt in attempts:

        current_score = highest_scores.get(
            attempt.quiz_id
        )

        if (
            current_score is None
            or attempt.score > current_score
        ):
            highest_scores[attempt.quiz_id] = (
                attempt.score
            )

    # -----------------------------------------------------
    # MAKE SURE EVERY QUIZ WAS PASSED
    # -----------------------------------------------------

    if len(highest_scores) != len(quiz_ids):
        raise HTTPException(
            status_code=400,
            detail=(
                "A passed quiz attempt is required "
                "for every module"
            ),
        )

    # -----------------------------------------------------
    # CALCULATE FINAL SCORE
    # -----------------------------------------------------

    final_score = round(
        sum(highest_scores.values())
        / len(highest_scores)
    )

    # -----------------------------------------------------
    # CREATE CERTIFICATE
    # -----------------------------------------------------

    certificate = Certificate(
        certificate_number=(
            f"DC-{uuid4().hex[:12].upper()}"
        ),
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

    # =====================================================
    # GENERATE PDF
    # =====================================================

    certificate_pdf = create_certificate_pdf(
        certificate
    )

    certificate_filename = (
        f"certificate-"
        f"{certificate.certificate_number}.pdf"
    )

    # =====================================================
    # SEND CERTIFICATE EMAIL
    # =====================================================
    #
    # The certificate has already been saved successfully.
    #
    # If email sending fails, certificate generation still
    # succeeds.
    #
    # =====================================================

    try:
        send_certificate_notification(
            user_name=user.name,
            user_email=user.email,
            course_title=course.title,
            certificate_pdf=certificate_pdf,
            certificate_filename=certificate_filename,
        )

    except Exception as email_error:
        print(
            "Certificate email failed:",
            email_error,
        )

    # -----------------------------------------------------
    # RETURN CERTIFICATE
    # -----------------------------------------------------

    return certificate


# =========================================================
# GET MY CERTIFICATES
# =========================================================

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
        .order_by(
            Certificate.completion_date.desc()
        )
        .all()
    )

    return certificates


# =========================================================
# DOWNLOAD MY COURSE CERTIFICATE
# =========================================================

@router.get(
    "/{course_id}/certificate/download",
)
def download_certificate(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND CERTIFICATE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # GENERATE PDF
    # -----------------------------------------------------

    certificate_pdf = create_certificate_pdf(
        certificate
    )

    buffer = BytesIO(
        certificate_pdf
    )

    # -----------------------------------------------------
    # RETURN PDF
    # -----------------------------------------------------

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