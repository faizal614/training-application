import os

import resend
from dotenv import load_dotenv

load_dotenv()


RESEND_API_KEY = os.getenv(
    "RESEND_API_KEY"
)

EMAIL_FROM = os.getenv(
    "EMAIL_FROM",
    "onboarding@resend.dev",
)


if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def send_email(
    to_email: str,
    subject: str,
    html: str,
    attachments=None,
):
    """
    Send a transactional email using Resend.

    Email failures are logged but do not
    break the main application flow.
    """

    if not RESEND_API_KEY:
        print(
            "RESEND_API_KEY is not configured. "
            "Email was not sent."
        )
        return None

    try:

        params = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": html,
        }

        # -------------------------------------------------
        # ADD ATTACHMENTS
        # -------------------------------------------------

        if attachments:
            params["attachments"] = attachments

        # -------------------------------------------------
        # SEND EMAIL
        # -------------------------------------------------

        response = resend.Emails.send(
            params
        )

        print(
            f"Email sent successfully to "
            f"{to_email}: {response}"
        )

        return response

    except Exception as error:

        print(
            f"Failed to send email to "
            f"{to_email}: {error}"
        )

        return None