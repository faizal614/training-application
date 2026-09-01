def account_created_email(
    user_name: str,
):
    return {
        "subject": "Welcome to DataCaliper Training",
        "html": f"""
        <html>
            <body>
                <h2>Welcome to DataCaliper Training</h2>

                <p>Hello {user_name},</p>

                <p>
                    Your DataCaliper Training account
                    has been created successfully.
                </p>

                <p>
                    You can now sign in and access
                    your assigned training courses.
                </p>

                <p>
                    Regards,<br>
                    DataCaliper Training
                </p>
            </body>
        </html>
        """,
    }


def course_assignment_email(
    user_name: str,
    course_title: str,
    deadline=None,
):
    # ---------------------------------------------------------
    # FORMAT DEADLINE
    # ---------------------------------------------------------

    if deadline:
        formatted_deadline = deadline.strftime(
            "%B %d, %Y at %I:%M %p"
        )

        deadline_html = f"""
        <p>
            <strong>Deadline:</strong>
            {formatted_deadline}
        </p>
        """
    else:
        deadline_html = """
        <p>
            <strong>Deadline:</strong>
            No deadline has been set.
        </p>
        """

    # ---------------------------------------------------------
    # EMAIL
    # ---------------------------------------------------------

    return {
        "subject": (
            f"New Course Assigned: {course_title}"
        ),
        "html": f"""
        <html>
            <body>
                <h2>New Course Assignment</h2>

                <p>Hello {user_name},</p>

                <p>
                    A new course has been assigned
                    to you.
                </p>

                <p>
                    <strong>Course:</strong>
                    {course_title}
                </p>

                {deadline_html}

                <p>
                    Please sign in to DataCaliper Training
                    to begin your training and complete
                    the course before the deadline.
                </p>

                <p>
                    Regards,<br>
                    DataCaliper Training
                </p>
            </body>
        </html>
        """,
    }

def quiz_result_email(
    user_name: str,
    quiz_title: str,
    score: float,
    passing_score: int,
    passed: bool,
):
    if passed:
        result_message = (
            "Congratulations! You passed the quiz."
        )
    else:
        result_message = (
            "You did not pass the quiz."
        )

    return {
        "subject": (
            f"Quiz Result: {quiz_title}"
        ),
        "html": f"""
        <html>
            <body>
                <h2>Quiz Result</h2>

                <p>Hello {user_name},</p>

                <p>
                    Your quiz result is now available.
                </p>

                <p>
                    <strong>Quiz:</strong>
                    {quiz_title}
                </p>

                <p>
                    <strong>Score:</strong>
                    {score}%
                </p>

                <p>
                    <strong>Passing Score:</strong>
                    {passing_score}%
                </p>

                <p>
                    {result_message}
                </p>

                <p>
                    Regards,<br>
                    DataCaliper Training
                </p>
            </body>
        </html>
        """,
    }


def deadline_reminder_email(
    user_name: str,
    course_title: str,
    deadline,
):
    return {
        "subject": (
            f"Deadline Reminder: {course_title}"
        ),
        "html": f"""
        <html>
            <body>
                <h2>Course Deadline Reminder</h2>

                <p>Hello {user_name},</p>

                <p>
                    This is a reminder that your
                    course deadline is approaching.
                </p>

                <p>
                    <strong>Course:</strong>
                    {course_title}
                </p>

                <p>
                    <strong>Deadline:</strong>
                    {deadline}
                </p>

                <p>
                    Please complete the required
                    training before the deadline.
                </p>

                <p>
                    Regards,<br>
                    DataCaliper Training
                </p>
            </body>
        </html>
        """,
    }


def certificate_generated_email(
    user_name: str,
    course_title: str,
):
    return {
        "subject": (
            f"Certificate Generated: {course_title}"
        ),
        "html": f"""
        <html>
            <body>
                <h2>Congratulations!</h2>

                <p>Hello {user_name},</p>

                <p>
                    You have successfully completed
                    the following course:
                </p>

                <p>
                    <strong>{course_title}</strong>
                </p>

                <p>
                    Your course certificate has been
                    generated successfully.
                </p>

                <p>
                    Please sign in to DataCaliper Training
                    to view your certificate.
                </p>

                <p>
                    Regards,<br>
                    DataCaliper Training
                </p>
            </body>
        </html>
        """,
    }