import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'

function QuizPage() {
  const {
    courseId,
    moduleId,
  } = useParams()

  const navigate = useNavigate()

  const {
    token,
    isAuthenticated,
    handleSessionExpired,
  } = useAuth()

  // =========================================================
  // QUIZ STATE
  // =========================================================

  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])

  const [selectedAnswers, setSelectedAnswers] =
    useState({})

  // =========================================================
  // RESULT STATE
  // =========================================================

  const [quizResult, setQuizResult] =
    useState(null)

  // =========================================================
  // MODULE STATE
  // =========================================================

  const [modules, setModules] = useState([])
  const [nextModule, setNextModule] = useState(null)
  const [isLastModule, setIsLastModule] =
    useState(false)

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  // =========================================================
  // LOAD QUIZ
  // =========================================================

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true)
        setError('')

        // ---------------------------------------------------
        // CHECK LOGIN
        // ---------------------------------------------------

        if (!isAuthenticated || !token) {
          setError(
            'Please sign in to access this quiz.'
          )

          setLoading(false)
          return
        }

        // ---------------------------------------------------
        // CHECK COURSE COMPLETION
        // ---------------------------------------------------

        const certificateResponse =
          await apiFetch(
            '/courses/certificates/me',
            {},
            handleSessionExpired
          )

        if (
          certificateResponse.status === 404
        ) {
          // No certificates.
          // Continue loading quiz.
        } else {
          const certificates =
            await certificateResponse.json()

          if (certificateResponse.ok) {
            const existingCertificate =
              Array.isArray(certificates)
                ? certificates.find(
                    (certificate) =>
                      certificate.course_id ===
                      Number(courseId)
                  )
                : null

            // -------------------------------------------------
            // COURSE ALREADY COMPLETED
            // -------------------------------------------------

            if (existingCertificate) {
              navigate(
                `/courses/${courseId}/certificate`,
                { replace: true }
              )

              return
            }
          }
        }

        // ---------------------------------------------------
        // GET ALL COURSE MODULES
        // ---------------------------------------------------

        const modulesResponse =
          await apiFetch(
            `/courses/${courseId}/modules`,
            {},
            handleSessionExpired
          )

        const modulesData =
          await modulesResponse.json()

        if (!modulesResponse.ok) {
          throw new Error(
            modulesData.detail ||
              'Failed to load modules'
          )
        }

        setModules(modulesData)

        // ---------------------------------------------------
        // FIND CURRENT MODULE
        // ---------------------------------------------------

        const currentIndex =
          modulesData.findIndex(
            (module) =>
              module.id === Number(moduleId)
          )

        if (currentIndex === -1) {
          throw new Error(
            'Current module could not be found.'
          )
        }

        // ---------------------------------------------------
        // DETERMINE NEXT MODULE
        // ---------------------------------------------------

        const followingModule =
          modulesData[currentIndex + 1] || null

        setNextModule(followingModule)
        setIsLastModule(
          followingModule === null
        )

        // ---------------------------------------------------
        // GET QUIZ
        // ---------------------------------------------------

        const quizResponse =
          await apiFetch(
            `/modules/${moduleId}/quiz`,
            {},
            handleSessionExpired
          )

        if (quizResponse.status === 404) {
          setQuiz(null)
          setQuestions([])
          return
        }

        const quizData =
          await quizResponse.json()

        if (!quizResponse.ok) {
          throw new Error(
            quizData.detail ||
              'Failed to load quiz'
          )
        }

        setQuiz(quizData)

        // ---------------------------------------------------
        // GET QUESTIONS
        // ---------------------------------------------------

        const questionsResponse =
          await apiFetch(
            `/modules/quizzes/${quizData.id}/questions`,
            {},
            handleSessionExpired
          )

        const questionsData =
          await questionsResponse.json()

        if (!questionsResponse.ok) {
          throw new Error(
            questionsData.detail ||
              'Failed to load quiz questions'
          )
        }

        setQuestions(questionsData)

      } catch (error) {
        if (
          error.message ===
          'Session expired. Please sign in again.'
        ) {
          return
        }

        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [
    courseId,
    moduleId,
    token,
    isAuthenticated,
    handleSessionExpired,
    navigate,
  ])

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const handleAnswerChange = (
    questionId,
    answerId
  ) => {
    setSelectedAnswers(
      (previous) => ({
        ...previous,
        [questionId]: answerId,
      })
    )
  }

  // =========================================================
  // SUBMIT QUIZ
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!quiz) {
      return
    }

    if (!isAuthenticated || !token) {
      setError(
        'Please sign in to continue.'
      )
      return
    }

    // -------------------------------------------------------
    // CHECK ANSWERS
    // -------------------------------------------------------

    const unansweredQuestion =
      questions.find(
        (question) =>
          !selectedAnswers[question.id]
      )

    if (unansweredQuestion) {
      setError(
        'Please answer all questions before submitting.'
      )
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const answers =
        questions.map(
          (question) => ({
            question_id: question.id,
            answer_id:
              selectedAnswers[
                question.id
              ],
          })
        )

      const response =
        await apiFetch(
          `/modules/quizzes/${quiz.id}/submit`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              answers,
            }),
          },
          handleSessionExpired
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to submit quiz'
        )
      }

      // -----------------------------------------------------
      // SAVE RESULT
      // -----------------------------------------------------

      setQuizResult(data)

      // -----------------------------------------------------
      // IMPORTANT
      //
      // We DO NOT use:
      //
      // data.is_last_module
      //
      // The frontend already knows whether another module
      // exists because we loaded the course modules above.
      // -----------------------------------------------------

    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // =========================================================
  // NEXT MODULE
  // =========================================================

  const handleNextModule = async () => {
    try {
      setSubmitting(true)
      setError('')

      // -----------------------------------------------------
      // If next module was already determined when the page
      // loaded, use it directly.
      // -----------------------------------------------------

      if (nextModule) {
        navigate(
          `/courses/${courseId}/modules/${nextModule.id}`
        )

        return
      }

      // -----------------------------------------------------
      // FALLBACK
      //
      // If nextModule is not available, reload the module
      // list before deciding.
      // -----------------------------------------------------

      const response =
        await apiFetch(
          `/courses/${courseId}/modules`,
          {},
          handleSessionExpired
        )

      const modulesData =
        await response.json()

      if (!response.ok) {
        throw new Error(
          modulesData.detail ||
            'Failed to load modules'
        )
      }

      const currentIndex =
        modulesData.findIndex(
          (module) =>
            module.id === Number(moduleId)
        )

      if (currentIndex === -1) {
        throw new Error(
          'Current module could not be found.'
        )
      }

      const followingModule =
        modulesData[currentIndex + 1]

      // -----------------------------------------------------
      // THERE IS ANOTHER MODULE
      // -----------------------------------------------------

      if (followingModule) {
        navigate(
          `/courses/${courseId}/modules/${followingModule.id}`
        )

        return
      }

      // -----------------------------------------------------
      // NO NEXT MODULE
      // -----------------------------------------------------

      setIsLastModule(true)

    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // =========================================================
  // COMPLETE COURSE
  // =========================================================

  const handleCompleteCourse = async () => {
    try {
      setSubmitting(true)
      setError('')

      const response =
        await apiFetch(
          `/courses/${courseId}/certificate`,
          {
            method: 'POST',
          },
          handleSessionExpired
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to generate certificate'
        )
      }

      navigate(
        `/courses/${courseId}/certificate`
      )

    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // =========================================================
  // RETRY QUIZ
  // =========================================================

  const handleRetryQuiz = () => {
    setSelectedAnswers({})
    setQuizResult(null)
    setError('')
  }

  // =========================================================
  // REDO MODULE
  // =========================================================

  const handleRedoModule = async () => {
    try {
      setSubmitting(true)
      setError('')

      const response =
        await apiFetch(
          `/modules/${moduleId}/quiz/reset`,
          {
            method: 'POST',
          },
          handleSessionExpired
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to reset quiz attempts'
        )
      }

      navigate(
        `/courses/${courseId}/modules/${moduleId}`
      )

    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>
          Loading quiz...
        </p>
      </main>
    )
  }

  // =========================================================
  // ERROR WITHOUT QUIZ
  // =========================================================

  if (error && !quiz) {
    return (
      <main className="main-content">

        <p className="auth-error">
          {error}
        </p>

        <p>
          <Link
            to={`/courses/${courseId}/modules/${moduleId}`}
          >
            ← Back to module
          </Link>
        </p>

      </main>
    )
  }

  // =========================================================
  // NO QUIZ
  // =========================================================

  if (!quiz) {
    return (
      <main className="main-content">

        <section className="page-intro">

          <p className="eyebrow">
            ASSESSMENT
          </p>

          <h1>
            No Quiz Available
          </h1>

          <p>
            There is no quiz available for
            this module yet.
          </p>

        </section>

        <p>
          <Link
            to={`/courses/${courseId}/modules/${moduleId}`}
          >
            ← Back to module
          </Link>
        </p>

      </main>
    )
  }

  // =========================================================
  // ATTEMPT INFORMATION
  // =========================================================

  const maxAttempts =
    quizResult?.max_attempts ??
    quiz.max_attempts ??
    3

  const attemptsUsed =
    quizResult?.attempts_used

  const attemptsRemaining =
    quizResult?.attempts_remaining

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="main-content">

      {/* =====================================================
          QUIZ HEADER
      ===================================================== */}

      <section className="page-intro">

        <p className="eyebrow">
          ASSESSMENT
        </p>

        <h1>
          {quiz.title}
        </h1>

        <p>
          Maximum attempts:{' '}
          <strong>
            {maxAttempts}
          </strong>
        </p>

        {attemptsUsed !== undefined && (
          <p>
            Attempts used:{' '}
            <strong>
              {attemptsUsed}
            </strong>
          </p>
        )}

      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <p className="auth-error">
          {error}
        </p>
      )}

      {/* =====================================================
          QUIZ FORM
      ===================================================== */}

      {!quizResult && (
        <form
          onSubmit={handleSubmit}
          className="quiz-form"
        >

          {questions.map(
            (
              question,
              questionIndex
            ) => (
              <fieldset
                key={question.id}
                className="quiz-question"
              >

                <legend>
                  {questionIndex + 1}.{' '}
                  {question.question_text}
                </legend>

                {question.answers &&
                  question.answers.map(
                    (answer) => (
                      <label
                        key={answer.id}
                        className="quiz-answer"
                      >

                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={answer.id}
                          checked={
                            selectedAnswers[
                              question.id
                            ] === answer.id
                          }
                          onChange={() =>
                            handleAnswerChange(
                              question.id,
                              answer.id
                            )
                          }
                        />

                        <span>
                          {answer.answer_text}
                        </span>

                      </label>
                    )
                  )}

              </fieldset>
            )
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={submitting}
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Quiz'}
          </button>

        </form>
      )}

      {/* =====================================================
          RESULT
      ===================================================== */}

      {quizResult && (
        <section
          className={
            `quiz-result ${
              quizResult.passed
                ? 'quiz-result--passed'
                : 'quiz-result--failed'
            }`
          }
        >

          <p className="eyebrow">
            QUIZ RESULT
          </p>

          <h2>
            {quizResult.passed
              ? 'Quiz Passed'
              : 'Quiz Not Passed'}
          </h2>

          <p>
            Score:{' '}
            <strong>
              {quizResult.score}%
            </strong>
          </p>

          <p>
            Passing score:{' '}
            <strong>
              {quizResult.passing_score}%
            </strong>
          </p>

          {/* =================================================
              PASSED
          ================================================= */}

          {quizResult.passed && (
            <>

              <p>
                🎉 Congratulations! You have
                completed this module.
              </p>

              {/* =============================================
                  THERE IS ANOTHER MODULE
              ============================================= */}

              {!isLastModule && nextModule && (
                <>

                  <p>
                    The quiz for this module is
                    complete. Continue to the next
                    module.
                  </p>

                  <button
                    type="button"
                    className="auth-button"
                    onClick={
                      handleNextModule
                    }
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Loading...'
                      : 'Next Module →'}
                  </button>

                </>
              )}

              {/* =============================================
                  THIS IS THE FINAL MODULE
              ============================================= */}

              {isLastModule && (
                <>

                  <p>
                    You have completed all
                    modules in this course.
                  </p>

                  <button
                    type="button"
                    className="auth-button"
                    onClick={
                      handleCompleteCourse
                    }
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Generating Certificate...'
                      : 'Complete Course'}
                  </button>

                </>
              )}

            </>
          )}

          {/* =================================================
              FAILED - ATTEMPTS REMAIN
          ================================================= */}

          {!quizResult.passed &&
            attemptsRemaining > 0 && (
              <>

                <p>
                  You have{' '}
                  <strong>
                    {attemptsRemaining}
                  </strong>{' '}
                  attempt
                  {attemptsRemaining !== 1
                    ? 's'
                    : ''}{' '}
                  remaining.
                </p>

                <button
                  type="button"
                  className="auth-button"
                  onClick={
                    handleRetryQuiz
                  }
                  disabled={submitting}
                >
                  Try Again
                </button>

              </>
            )}

          {/* =================================================
              FAILED - ALL ATTEMPTS USED
          ================================================= */}

          {!quizResult.passed &&
            attemptsRemaining === 0 && (
              <>

                <p>
                  You have used all{' '}
                  <strong>
                    {maxAttempts}
                  </strong>{' '}
                  quiz attempts.
                </p>

                <p>
                  Please redo the module before
                  attempting the quiz again.
                </p>

                <button
                  type="button"
                  className="auth-button"
                  onClick={
                    handleRedoModule
                  }
                  disabled={submitting}
                >
                  {submitting
                    ? 'Resetting...'
                    : 'Redo Module'}
                </button>

              </>
            )}

        </section>
      )}

      {/* =====================================================
          BACK TO MODULE
      ===================================================== */}

      <p>
        <Link
          to={`/courses/${courseId}/modules/${moduleId}`}
        >
          ← Back to module
        </Link>
      </p>

    </main>
  )
}

export default QuizPage 