import base64

from backend.app.services.email_service import (
    send_email,
)

from backend.app.services.email_templates import (
    account_created_email,
    course_assignment_email,
    quiz_result_email,
    deadline_reminder_email,
    certificate_generated_email,
)


# =========================================================
# ACCOUNT CREATED
# =========================================================

def send_account_created_notification(
    user_name: str,
    user_email: str,
):
    email = account_created_email(
        user_name=user_name,
    )

    return send_email(
        to_email=user_email,
        subject=email["subject"],
        html=email["html"],
    )


# =========================================================
# COURSE ASSIGNMENT
# =========================================================

def send_course_assignment_notification(
    user_name: str,
    user_email: str,
    course_title: str,
    deadline=None,
):
    email = course_assignment_email(
        user_name=user_name,
        course_title=course_title,
        deadline=deadline,
    )

    return send_email(
        to_email=user_email,
        subject=email["subject"],
        html=email["html"],
    )


# =========================================================
# QUIZ RESULT
# =========================================================

def send_quiz_result_notification(
    user_name: str,
    user_email: str,
    quiz_title: str,
    score: float,
    passing_score: int,
    passed: bool,
):
    email = quiz_result_email(
        user_name=user_name,
        quiz_title=quiz_title,
        score=score,
        passing_score=passing_score,
        passed=passed,
    )

    return send_email(
        to_email=user_email,
        subject=email["subject"],
        html=email["html"],
    )


# =========================================================
# DEADLINE REMINDER
# =========================================================

def send_deadline_reminder_notification(
    user_name: str,
    user_email: str,
    course_title: str,
    deadline,
):
    email = deadline_reminder_email(
        user_name=user_name,
        course_title=course_title,
        deadline=deadline,
    )

    return send_email(
        to_email=user_email,
        subject=email["subject"],
        html=email["html"],
    )


# =========================================================
# CERTIFICATE GENERATED
# =========================================================

def send_certificate_notification(
    user_name: str,
    user_email: str,
    course_title: str,
    certificate_pdf: bytes,
    certificate_filename: str,
):
    # -----------------------------------------------------
    # CREATE EMAIL
    # -----------------------------------------------------

    email = certificate_generated_email(
        user_name=user_name,
        course_title=course_title,
    )

    # -----------------------------------------------------
    # CONVERT PDF BYTES TO BASE64
    # -----------------------------------------------------
    #
    # Resend expects attachment content to be Base64
    # encoded when sending raw file content.
    #
    # -----------------------------------------------------

    certificate_base64 = base64.b64encode(
        certificate_pdf
    ).decode("utf-8")

    # -----------------------------------------------------
    # CREATE ATTACHMENT
    # -----------------------------------------------------

    attachments = [
        {
            "filename": certificate_filename,
            "content": certificate_base64,
        }
    ]

    # -----------------------------------------------------
    # SEND EMAIL
    # -----------------------------------------------------

    return send_email(
        to_email=user_email,
        subject=email["subject"],
        html=email["html"],
        attachments=attachments,
    )