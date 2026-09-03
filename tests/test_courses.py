import pytest

from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db
from backend.app.main import app
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.user import User, UserRole


def test_learner_can_view_course_catalogue(client):
    test_user = User(
        id=999999,
        name="Test Learner",
        email="testlearner@example.com",
        role=UserRole.LEARNER,
        is_active=True,
    )

    app.dependency_overrides[
        get_current_user
    ] = lambda: test_user

    try:
        response = client.get(
            "/courses/enrolled/me"
        )

        assert response.status_code == 200

        data = response.json()

        assert isinstance(data, list)

    finally:
        app.dependency_overrides.clear()


def test_learner_can_enroll_in_course(client):
    db = next(get_db())

    test_user = None

    try:
        # -------------------------------------------------
        # CREATE TEST USER
        # -------------------------------------------------

        test_user = User(
            name="Enrollment Test Learner",
            email="enrollmenttest@example.com",
            role=UserRole.LEARNER,
            is_active=True,
        )

        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        # -------------------------------------------------
        # OVERRIDE CURRENT USER
        # -------------------------------------------------

        app.dependency_overrides[
            get_current_user
        ] = lambda: test_user

        # -------------------------------------------------
        # GET COURSES
        # -------------------------------------------------

        response = client.get("/courses/")

        assert response.status_code == 200

        courses = response.json()

        if not courses:
            pytest.skip(
                "No courses exist in the database"
            )

        course_id = courses[0]["id"]

        # -------------------------------------------------
        # ENROLL
        # -------------------------------------------------

        response = client.post(
            f"/courses/{course_id}/enroll"
        )

        assert response.status_code == 200

        data = response.json()

        # -------------------------------------------------
        # VERIFY RESPONSE
        # -------------------------------------------------

        assert data["message"] == (
            "Successfully enrolled in course"
        )

        assert data["course_id"] == course_id

        assert data["user_id"] == test_user.id

        assert "assignment_id" in data

    finally:
        # -------------------------------------------------
        # REMOVE TEST ASSIGNMENT
        # -------------------------------------------------

        if test_user is not None:
            assignment = (
                db.query(CourseAssignment)
                .filter(
                    CourseAssignment.user_id
                    == test_user.id
                )
                .first()
            )

            if assignment is not None:
                db.delete(assignment)
                db.commit()

            # ---------------------------------------------
            # REMOVE TEST USER
            # ---------------------------------------------

            db.query(User).filter(
                User.id == test_user.id
            ).delete(
                synchronize_session=False
            )

            db.commit()

        # -------------------------------------------------
        # CLEAR DEPENDENCY OVERRIDE
        # -------------------------------------------------

        app.dependency_overrides.clear()

        db.close()

def test_learner_cannot_enroll_in_same_course_twice(client):
    db = next(get_db())

    test_user = None

    try:
        # Create test learner
        test_user = User(
            name="Duplicate Enrollment Test",
            email="duplicateenrollment@example.com",
            role=UserRole.LEARNER,
            is_active=True,
        )

        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        # Treat this user as the logged-in learner
        app.dependency_overrides[
            get_current_user
        ] = lambda: test_user

        # Get an existing course
        response = client.get("/courses/")

        assert response.status_code == 200

        courses = response.json()

        if not courses:
            pytest.skip(
                "No courses exist in the database"
            )

        course_id = courses[0]["id"]

        # First enrollment
        response = client.post(
            f"/courses/{course_id}/enroll"
        )

        assert response.status_code == 200

        # Second enrollment
        response = client.post(
            f"/courses/{course_id}/enroll"
        )

        assert response.status_code == 400

        data = response.json()

        assert data["detail"] == (
            "Already enrolled in this course"
        )

    finally:
        # Remove enrollment
        if test_user is not None:
            assignment = (
                db.query(CourseAssignment)
                .filter(
                    CourseAssignment.user_id
                    == test_user.id
                )
                .first()
            )

            if assignment is not None:
                db.delete(assignment)
                db.commit()

            # Remove test user
            db.query(User).filter(
                User.id == test_user.id
            ).delete(
                synchronize_session=False
            )

            db.commit()

        app.dependency_overrides.clear()
        db.close()

def test_learner_cannot_enroll_in_nonexistent_course(client):
    test_user = User(
        id=999997,
        name="Invalid Course Test Learner",
        email="invalidcourse@example.com",
        role=UserRole.LEARNER,
        is_active=True,
    )

    app.dependency_overrides[
        get_current_user
    ] = lambda: test_user

    try:
        response = client.post(
            "/courses/999999/enroll"
        )

        assert response.status_code == 404

        data = response.json()

        assert data["detail"] == "Course not found"

    finally:
        app.dependency_overrides.clear()

def test_admin_cannot_enroll_in_course(client):
    test_user = User(
        id=999996,
        name="Test Admin",
        email="testadmin@example.com",
        role=UserRole.ADMIN,
        is_active=True,
    )

    app.dependency_overrides[
        get_current_user
    ] = lambda: test_user

    try:
        response = client.post(
            "/courses/1/enroll"
        )

        assert response.status_code == 403

        data = response.json()

        assert data["detail"] == (
            "Only learners can enroll in courses"
        )

    finally:
        app.dependency_overrides.clear()