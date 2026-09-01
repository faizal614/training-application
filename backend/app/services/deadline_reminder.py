from datetime import datetime, timedelta

from backend.app.database import get_db

from backend.app.models.course_assignment import (
    CourseAssignment,
)

from backend.app.models.module import Module

from backend.app.models.module_progress import (
    ModuleProgress,
)

from backend.app.services.notifications import (
    send_deadline_reminder_notification,
)


# =========================================================
# CHECK WHETHER COURSE IS COMPLETED
# =========================================================

def is_course_completed(
    assignment,
    db,
):
    # -----------------------------------------------------
    # GET COURSE MODULES
    # -----------------------------------------------------

    modules = (
        db.query(Module)
        .filter(
            Module.course_id
            == assignment.course_id
        )
        .all()
    )

    # -----------------------------------------------------
    # A COURSE WITH NO MODULES IS NOT COMPLETED
    # -----------------------------------------------------

    if not modules:
        return False

    module_ids = [
        module.id
        for module in modules
    ]

    # -----------------------------------------------------
    # GET LEARNER PROGRESS
    # -----------------------------------------------------

    progress_records = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id
            == assignment.user_id,

            ModuleProgress.module_id.in_(
                module_ids
            ),
        )
        .all()
    )

    # -----------------------------------------------------
    # CREATE PROGRESS LOOKUP
    # -----------------------------------------------------

    progress_by_module = {
        progress.module_id: progress
        for progress in progress_records
    }

    # -----------------------------------------------------
    # CHECK EVERY MODULE
    # -----------------------------------------------------

    for module in modules:

        progress = progress_by_module.get(
            module.id
        )

        if progress is None:
            return False

        if hasattr(
            progress.status,
            "value",
        ):
            status_value = (
                progress.status.value
            )
        else:
            status_value = str(
                progress.status
            )

        if status_value != "completed":
            return False

    # -----------------------------------------------------
    # EVERY MODULE IS COMPLETED
    # -----------------------------------------------------

    return True


# =========================================================
# PROCESS DEADLINE REMINDERS
# =========================================================

def process_deadline_reminders():
    """
    Find learner course assignments whose deadline is
    within the next hour and send the deadline reminder.

    The reminder is sent only once per assignment deadline.

    Completed courses are skipped.
    """

    db = next(get_db())

    try:

        # =================================================
        # CURRENT UTC TIME
        # =================================================

        now = datetime.utcnow()

        # =================================================
        # ONE HOUR FROM NOW
        # =================================================

        one_hour_from_now = (
            now + timedelta(hours=1)
        )

        # =================================================
        # GET UPCOMING ASSIGNMENTS
        # =================================================
        #
        # We intentionally use:
        #
        # deadline > now
        #
        # and:
        #
        # deadline <= one_hour_from_now
        #
        # This means if the application was temporarily
        # unavailable, it can still send the reminder when
        # the deadline is less than one hour away.
        #
        # =================================================

        assignments = (
            db.query(CourseAssignment)
            .filter(
                CourseAssignment.deadline.isnot(None),

                CourseAssignment.deadline > now,

                CourseAssignment.deadline
                <= one_hour_from_now,

                CourseAssignment
                .deadline_reminder_sent_at
                .is_(None),
            )
            .all()
        )

        # =================================================
        # PROCESS ASSIGNMENTS
        # =================================================

        for assignment in assignments:

            # -------------------------------------------------
            # SAFETY CHECK
            # -------------------------------------------------

            if assignment.user is None:
                continue

            if assignment.course is None:
                continue

            learner = assignment.user
            course = assignment.course

            # =================================================
            # CHECK COURSE COMPLETION
            # =================================================

            completed = is_course_completed(
                assignment=assignment,
                db=db,
            )

            # -------------------------------------------------
            # DO NOT SEND REMINDER FOR COMPLETED COURSE
            # -------------------------------------------------

            if completed:

                # -------------------------------------------------
                # Mark reminder as handled so the scheduler does
                # not keep checking this completed assignment.
                # -------------------------------------------------

                assignment.deadline_reminder_sent_at = now

                db.commit()

                continue

            # =================================================
            # SEND EMAIL
            # =================================================

            try:

                send_deadline_reminder_notification(
                    user_name=learner.name,
                    user_email=learner.email,
                    course_title=course.title,
                    deadline=assignment.deadline,
                )

                # =================================================
                # MARK REMINDER AS SENT
                # =================================================

                assignment.deadline_reminder_sent_at = (
                    datetime.utcnow()
                )

                db.commit()

                print(
                    "Deadline reminder sent: "
                    f"{learner.email} - "
                    f"{course.title}"
                )

            except Exception as email_error:

                # -------------------------------------------------
                # Do not mark the reminder as sent if the email
                # failed.
                #
                # The next scheduler run will try again.
                # -------------------------------------------------

                db.rollback()

                print(
                    "Deadline reminder email failed: "
                    f"{learner.email} - "
                    f"{course.title} - "
                    f"{email_error}"
                )

    except Exception as error:

        db.rollback()

        print(
            "Deadline reminder checker failed: "
            f"{error}"
        )

    finally:

        db.close()