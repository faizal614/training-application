from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db
from backend.app.main import app
from backend.app.models.answer import Answer
from backend.app.models.course import Course
from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.models.question import Question
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.user import User, UserRole


def test_learner_can_submit_quiz_successfully(client):
    db = next(get_db())

    test_user = None
    test_course = None
    test_module = None
    test_quiz = None
    test_question = None
    test_answer = None
    test_wrong_answer = None

    try:
        # -------------------------------------------------
        # CREATE TEST LEARNER
        # -------------------------------------------------

        test_user = User(
            name="Quiz Test Learner",
            email="quiztest@resend.dev",
            role=UserRole.LEARNER,
            is_active=True,
        )

        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        # -------------------------------------------------
        # CREATE TEST COURSE
        # -------------------------------------------------

        test_course = Course(
            title="Quiz Test Course",
            description="Course used for quiz testing",
            category="Testing",
        )

        db.add(test_course)
        db.commit()
        db.refresh(test_course)

        # -------------------------------------------------
        # CREATE TEST MODULE
        # -------------------------------------------------

        test_module = Module(
            course_id=test_course.id,
            title="Quiz Test Module",
            description="Module used for quiz testing",
            display_order=1,
        )

        db.add(test_module)
        db.commit()
        db.refresh(test_module)

        # -------------------------------------------------
        # CREATE TEST QUIZ
        # -------------------------------------------------

        test_quiz = Quiz(
            module_id=test_module.id,
            title="Quiz Test",
            passing_score=50,
            max_attempts=3,
            randomize_questions=False,
        )

        db.add(test_quiz)
        db.commit()
        db.refresh(test_quiz)

        # -------------------------------------------------
        # CREATE TEST QUESTION
        # -------------------------------------------------

        test_question = Question(
            quiz_id=test_quiz.id,
            question_text="What is 2 + 2?",
            display_order=1,
        )

        db.add(test_question)
        db.commit()
        db.refresh(test_question)

        # -------------------------------------------------
        # CREATE CORRECT ANSWER
        # -------------------------------------------------

        test_answer = Answer(
            question_id=test_question.id,
            answer_text="4",
            is_correct=True,
            display_order=1,
        )

        db.add(test_answer)

        # -------------------------------------------------
        # CREATE WRONG ANSWER
        # -------------------------------------------------

        test_wrong_answer = Answer(
            question_id=test_question.id,
            answer_text="5",
            is_correct=False,
            display_order=2,
        )

        db.add(test_wrong_answer)

        db.commit()
        db.refresh(test_answer)
        db.refresh(test_wrong_answer)

        # -------------------------------------------------
        # OVERRIDE AUTHENTICATION
        # -------------------------------------------------

        app.dependency_overrides[
            get_current_user
        ] = lambda: test_user

        # -------------------------------------------------
        # SUBMIT QUIZ
        # -------------------------------------------------

        response = client.post(
            f"/modules/quizzes/{test_quiz.id}/submit",
            json={
                "answers": [
                    {
                        "question_id": test_question.id,
                        "answer_id": test_answer.id,
                    }
                ]
            },
        )

        # -------------------------------------------------
        # VERIFY RESPONSE
        # -------------------------------------------------

        assert response.status_code == 200

        data = response.json()

        assert data["score"] == 100
        assert data["passed"] is True
        assert data["passing_score"] == 50

        assert data["attempts_used"] == 1
        assert data["attempts_remaining"] == 2
        assert data["max_attempts"] == 3

        assert data["redo_required"] is False
        assert data["is_last_module"] is True

        # -------------------------------------------------
        # VERIFY ATTEMPT WAS SAVED
        # -------------------------------------------------

        attempt = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == test_user.id,
                QuizAttempt.quiz_id == test_quiz.id,
            )
            .first()
        )

        assert attempt is not None
        assert attempt.score == 100
        assert attempt.passed is True

    finally:
        # -------------------------------------------------
        # CLEAN UP TEST DATA
        # -------------------------------------------------

        # The successful quiz submission creates
        # ModuleProgress, so delete it before deleting
        # the module.
        if (
            test_module is not None
            and test_user is not None
        ):
            db.query(ModuleProgress).filter(
                ModuleProgress.module_id == test_module.id,
                ModuleProgress.user_id == test_user.id,
            ).delete(
                synchronize_session=False
            )

        # Quiz attempts reference the user and quiz.
        if test_user is not None:
            db.query(QuizAttempt).filter(
                QuizAttempt.user_id == test_user.id
            ).delete(
                synchronize_session=False
            )

        # Delete all answers belonging to the test question.
        if test_question is not None:
            db.query(Answer).filter(
                Answer.question_id == test_question.id
            ).delete(
                synchronize_session=False
            )

        # Delete the test question.
        if test_quiz is not None:
            db.query(Question).filter(
                Question.quiz_id == test_quiz.id
            ).delete(
                synchronize_session=False
            )

        # Delete the test quiz.
        if test_quiz is not None:
            db.query(Quiz).filter(
                Quiz.id == test_quiz.id
            ).delete(
                synchronize_session=False
            )

        # Delete the test module.
        if test_module is not None:
            db.query(Module).filter(
                Module.id == test_module.id
            ).delete(
                synchronize_session=False
            )

        # Delete the test course.
        if test_course is not None:
            db.query(Course).filter(
                Course.id == test_course.id
            ).delete(
                synchronize_session=False
            )

        # Delete the test user.
        if test_user is not None:
            db.query(User).filter(
                User.id == test_user.id
            ).delete(
                synchronize_session=False
            )

        db.commit()

        app.dependency_overrides.clear()
        db.close()