import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../utils/api'

function ManageQuiz() {
  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])

  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedModule, setSelectedModule] = useState('')

  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [questions, setQuestions] = useState([])

  const [loading, setLoading] = useState(true)
  const [quizLoading, setQuizLoading] = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ---------------------------------------------------------
  // CREATE QUIZ FORM
  // ---------------------------------------------------------

  const [quizTitle, setQuizTitle] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [maxAttempts, setMaxAttempts] = useState(3)

  // ---------------------------------------------------------
  // CREATE QUESTION FORM
  // ---------------------------------------------------------

  const [questionText, setQuestionText] = useState('')
  const [questionOrder, setQuestionOrder] = useState(1)

  // ---------------------------------------------------------
  // CREATE ANSWER FORM
  // ---------------------------------------------------------

  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [answerText, setAnswerText] = useState('')
  const [answerOrder, setAnswerOrder] = useState(1)
  const [isCorrect, setIsCorrect] = useState(false)

  // ---------------------------------------------------------
  // LOAD COURSES
  // ---------------------------------------------------------

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await apiFetch('/courses')

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to load courses'
        )
      }

      setCourses(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // LOAD MODULES WHEN COURSE CHANGES
  // ---------------------------------------------------------

  useEffect(() => {
    if (!selectedCourse) {
      setModules([])
      setSelectedModule('')
      setQuizzes([])
      setSelectedQuiz(null)
      setQuestions([])
      setSelectedQuestion(null)
      return
    }

    loadModules(selectedCourse)
  }, [selectedCourse])

  const loadModules = async (courseId) => {
    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/courses/${courseId}/modules`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to load modules'
        )
      }

      setModules(data)

      if (data.length > 0) {
        setSelectedModule(String(data[0].id))
      } else {
        setSelectedModule('')
      }
    } catch (err) {
      setError(err.message)
      setModules([])
      setSelectedModule('')
    }
  }

  // ---------------------------------------------------------
  // LOAD QUIZ WHEN MODULE CHANGES
  // ---------------------------------------------------------

  useEffect(() => {
    if (!selectedModule) {
      setQuizzes([])
      setSelectedQuiz(null)
      setQuestions([])
      setSelectedQuestion(null)
      return
    }

    loadQuizForModule(selectedModule)
  }, [selectedModule])

  const loadQuizForModule = async (moduleId) => {
    try {
      setQuizLoading(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/${moduleId}/quiz`
      )

      if (response.status === 404) {
        setQuizzes([])
        setSelectedQuiz(null)
        setQuestions([])
        setSelectedQuestion(null)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to load quiz'
        )
      }

      setQuizzes([data])
      setSelectedQuiz(data)

      await loadQuestions(data.id)
    } catch (err) {
      setError(err.message)
      setQuizzes([])
      setSelectedQuiz(null)
      setQuestions([])
      setSelectedQuestion(null)
    } finally {
      setQuizLoading(false)
    }
  }

  // ---------------------------------------------------------
  // LOAD QUESTIONS
  // ---------------------------------------------------------

  const loadQuestions = async (quizId) => {
    try {
      setQuestionLoading(true)
      setError('')

      const response = await apiFetch(
        `/modules/quizzes/${quizId}/questions`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to load questions'
        )
      }

      // -----------------------------------------------------
      // DEBUG
      // -----------------------------------------------------
      // This lets us verify that the backend is returning
      // is_correct for every answer.
      //
      // You can remove this console.log later.
      // -----------------------------------------------------

      console.log('Questions API response:', data)

      setQuestions(data)

      // Set next question order
      setQuestionOrder(data.length + 1)
    } catch (err) {
      setError(err.message)
      setQuestions([])
    } finally {
      setQuestionLoading(false)
    }
  }

  // ---------------------------------------------------------
  // CREATE QUIZ
  // ---------------------------------------------------------

  const handleCreateQuiz = async (event) => {
    event.preventDefault()

    if (!selectedModule) {
      setError('Please select a module.')
      return
    }

    if (!quizTitle.trim()) {
      setError('Please enter a quiz title.')
      return
    }

    if (
      Number(passingScore) < 0 ||
      Number(passingScore) > 100
    ) {
      setError('Passing score must be between 0 and 100.')
      return
    }

    if (Number(maxAttempts) < 1) {
      setError('Maximum attempts must be at least 1.')
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/${selectedModule}/quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: quizTitle.trim(),
            passing_score: Number(passingScore),
            max_attempts: Number(maxAttempts),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to create quiz'
        )
      }

      setQuizTitle('')
      setPassingScore(70)
      setMaxAttempts(3)

      setQuizzes([data])
      setSelectedQuiz(data)
      setQuestions([])
      setSelectedQuestion(null)

      setSuccess('Quiz created successfully.')

      await loadQuestions(data.id)
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------------------------------------------------------
  // DELETE QUIZ
  // ---------------------------------------------------------

  const handleDeleteQuiz = async (quizId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this quiz? This will also delete its questions and answers.'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/quiz/${quizId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to delete quiz'
        )
      }

      setQuizzes([])
      setSelectedQuiz(null)
      setQuestions([])
      setSelectedQuestion(null)

      setSuccess('Quiz deleted successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------------------------------------------------------
  // CREATE QUESTION
  // ---------------------------------------------------------

  const handleCreateQuestion = async (event) => {
    event.preventDefault()

    if (!selectedQuiz) {
      setError('Please create or select a quiz first.')
      return
    }

    if (!questionText.trim()) {
      setError('Please enter a question.')
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/quizzes/${selectedQuiz.id}/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_text: questionText.trim(),
            display_order: Number(questionOrder),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to create question'
        )
      }

      setQuestionText('')

      const updatedQuestions = [
        ...questions,
        data,
      ]

      setQuestions(updatedQuestions)
      setQuestionOrder(updatedQuestions.length + 1)

      setSuccess('Question created successfully.')

      // Automatically select the new question
      setSelectedQuestion(data)

      // Start answer order at 1
      setAnswerOrder(1)
      setAnswerText('')
      setIsCorrect(false)
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------------------------------------------------------
  // CREATE ANSWER
  // ---------------------------------------------------------

  const handleCreateAnswer = async (event) => {
    event.preventDefault()

    if (!selectedQuestion) {
      setError('Please select a question first.')
      return
    }

    if (!answerText.trim()) {
      setError('Please enter an answer.')
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/questions/${selectedQuestion.id}/answers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answer_text: answerText.trim(),
            is_correct: Boolean(isCorrect),
            display_order: Number(answerOrder),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to create answer'
        )
      }

      setAnswerText('')
      setIsCorrect(false)

      setAnswerOrder((previous) => Number(previous) + 1)

      setSuccess('Answer created successfully.')

      // Refresh questions so the newly-created answer
      // and its correctness value appear immediately.
      if (selectedQuiz) {
        await loadQuestions(selectedQuiz.id)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------------------------------------------------------
  // SELECT QUESTION
  // ---------------------------------------------------------

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question)

    const answers = Array.isArray(question.answers)
      ? question.answers
      : []

    setAnswerOrder(answers.length + 1)

    setAnswerText('')
    setIsCorrect(false)

    // Scroll to the Add Answer section
    setTimeout(() => {
      const element = document.getElementById(
        'add-answer-section'
      )

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 100)
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div
      style={{
        maxWidth: '1140px',
        margin: '0 auto',
        padding: '132px 0 80px',
      }}
    >
      {/* PAGE HEADER */}

      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '12px',
            letterSpacing: '4px',
            marginBottom: '12px',
          }}
        >
          05
        </div>

        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            fontWeight: '400',
            margin: '0 0 10px',
          }}
        >
          Manage Quiz
        </h1>

        <p
          style={{
            fontSize: '17px',
            color: '#555',
            margin: 0,
          }}
        >
          Create and manage quizzes, questions and answers
          for course modules.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            border: '1px solid red',
            background: '#fff5f5',
            color: 'red',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          style={{
            border: '1px solid #222',
            background: '#f7f7f7',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          {success}
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* QUIZ CREATION */}
      {/* --------------------------------------------------- */}

      <section
        style={{
          border: '1px solid #222',
          padding: '30px',
          marginBottom: '40px',
        }}
      >
        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fontWeight: '400',
            marginTop: 0,
          }}
        >
          Add Quiz
        </h2>

        <form onSubmit={handleCreateQuiz}>
          {/* COURSE */}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Course
            </label>

            <select
              value={selectedCourse}
              onChange={(event) =>
                setSelectedCourse(event.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Select course
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* MODULE */}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Module
            </label>

            <select
              value={selectedModule}
              onChange={(event) =>
                setSelectedModule(event.target.value)
              }
              style={inputStyle}
              disabled={!selectedCourse}
            >
              <option value="">
                Select module
              </option>

              {modules.map((module) => (
                <option
                  key={module.id}
                  value={module.id}
                >
                  {module.title}
                </option>
              ))}
            </select>
          </div>

          {/* QUIZ TITLE */}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Quiz Title
            </label>

            <input
              type="text"
              value={quizTitle}
              onChange={(event) =>
                setQuizTitle(event.target.value)
              }
              placeholder="Enter quiz title"
              style={inputStyle}
            />
          </div>

          {/* PASSING SCORE */}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Passing Score (%)
            </label>

            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(event) =>
                setPassingScore(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          {/* MAX ATTEMPTS */}

          <div style={{ marginBottom: '25px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Maximum Attempts
            </label>

            <input
              type="number"
              min="1"
              value={maxAttempts}
              onChange={(event) =>
                setMaxAttempts(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            style={primaryButtonStyle}
            disabled={!selectedModule}
          >
            Create Quiz
          </button>
        </form>
      </section>

      {/* --------------------------------------------------- */}
      {/* EXISTING QUIZ */}
      {/* --------------------------------------------------- */}

      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
            }}
          >
            Existing Quiz
          </h2>

          <span>
            {quizzes.length}{' '}
            {quizzes.length === 1 ? 'quiz' : 'quizzes'}
          </span>
        </div>

        {quizLoading && (
          <p>Loading quiz...</p>
        )}

        {!quizLoading && quizzes.length === 0 && (
          <div
            style={{
              border: '1px solid #ccc',
              padding: '25px',
            }}
          >
            No quiz exists for this module yet.
          </div>
        )}

        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            style={{
              border: '1px solid #222',
              padding: '25px',
              marginBottom: '25px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                letterSpacing: '3px',
                marginBottom: '10px',
              }}
            >
              QUIZ ID: {quiz.id}
            </div>

            <h3
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '30px',
                fontWeight: '400',
                margin: '0 0 20px',
              }}
            >
              {quiz.title}
            </h3>

            <p>
              <strong>Module ID:</strong>{' '}
              {quiz.module_id}
            </p>

            <p>
              <strong>Passing Score:</strong>{' '}
              {quiz.passing_score}%
            </p>

            <p>
              <strong>Maximum Attempts:</strong>{' '}
              {quiz.max_attempts}
            </p>

            <button
              type="button"
              onClick={() =>
                handleDeleteQuiz(quiz.id)
              }
              style={dangerButtonStyle}
            >
              Delete Quiz
            </button>
          </div>
        ))}
      </section>

      {/* --------------------------------------------------- */}
      {/* QUESTION CREATION */}
      {/* --------------------------------------------------- */}

      {selectedQuiz && (
        <>
          <section
            style={{
              border: '1px solid #222',
              padding: '30px',
              marginBottom: '40px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '32px',
                fontWeight: '400',
                marginTop: 0,
              }}
            >
              Add Question
            </h2>

            <form onSubmit={handleCreateQuestion}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  Question
                </label>

                <textarea
                  value={questionText}
                  onChange={(event) =>
                    setQuestionText(
                      event.target.value
                    )
                  }
                  placeholder="Enter question"
                  rows="4"
                  style={textareaStyle}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  Display Order
                </label>

                <input
                  type="number"
                  min="1"
                  value={questionOrder}
                  onChange={(event) =>
                    setQuestionOrder(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                style={primaryButtonStyle}
              >
                Add Question
              </button>
            </form>
          </section>

          {/* ------------------------------------------------ */}
          {/* EXISTING QUESTIONS */}
          {/* ------------------------------------------------ */}

          <section style={{ marginBottom: '40px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '32px',
                  fontWeight: '400',
                  margin: 0,
                }}
              >
                Existing Questions
              </h2>

              <span>
                {questions.length}{' '}
                {questions.length === 1
                  ? 'question'
                  : 'questions'}
              </span>
            </div>

            {questionLoading && (
              <p>Loading questions...</p>
            )}

            {!questionLoading &&
              questions.length === 0 && (
                <div
                  style={{
                    border: '1px solid #ccc',
                    padding: '25px',
                  }}
                >
                  No questions have been added yet.
                </div>
              )}

            {questions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  border: '1px solid #222',
                  padding: '25px',
                  marginBottom: '25px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    letterSpacing: '3px',
                    marginBottom: '10px',
                  }}
                >
                  QUESTION {index + 1} — ID:{' '}
                  {question.id}
                </div>

                <h3
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '28px',
                    fontWeight: '400',
                    margin: '0 0 15px',
                  }}
                >
                  {question.question_text}
                </h3>

                <p>
                  <strong>Display Order:</strong>{' '}
                  {question.display_order}
                </p>

                {/* ANSWERS */}

                <div
                  style={{
                    borderTop: '1px solid #ddd',
                    marginTop: '20px',
                    paddingTop: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      letterSpacing: '3px',
                      marginBottom: '15px',
                    }}
                  >
                    ANSWERS
                  </div>

                  {Array.isArray(question.answers) &&
                  question.answers.length > 0 ? (
                    question.answers.map(
                      (answer, answerIndex) => (
                        <div
                          key={answer.id}
                          style={{
                            border: '1px solid #ddd',
                            padding: '14px',
                            marginBottom: '10px',
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            alignItems: 'center',
                            gap: '20px',
                          }}
                        >
                          <span>
                            <strong>
                              {answerIndex + 1}.
                            </strong>{' '}
                            {answer.answer_text}
                          </span>

                          {/* -------------------------------- */}
                          {/* CORRECTNESS */}
                          {/* -------------------------------- */}

                          <strong
                            style={{
                              whiteSpace: 'nowrap',
                              color:
                                answer.is_correct === true
                                  ? '#087f23'
                                  : answer.is_correct === false
                                  ? '#b00000'
                                  : '#555',
                            }}
                          >
                            {answer.is_correct === true
                              ? 'Correct'
                              : answer.is_correct === false
                              ? 'Incorrect'
                              : 'Correctness not returned'}
                          </strong>
                        </div>
                      )
                    )
                  ) : (
                    <p>
                      No answers added yet.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectQuestion(question)
                  }
                  style={secondaryButtonStyle}
                >
                  Add Answer
                </button>
              </div>
            ))}
          </section>

          {/* ------------------------------------------------ */}
          {/* ADD ANSWER */}
          {/* ------------------------------------------------ */}

          {selectedQuestion && (
            <section
              id="add-answer-section"
              style={{
                border: '1px solid #222',
                padding: '30px',
                marginBottom: '40px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '32px',
                  fontWeight: '400',
                  marginTop: 0,
                }}
              >
                Add Answer
              </h2>

              <p>
                Adding an answer to Question ID:{' '}
                <strong>
                  {selectedQuestion.id}
                </strong>
              </p>

              <form onSubmit={handleCreateAnswer}>
                {/* ANSWER TEXT */}

                <div
                  style={{
                    marginBottom: '20px',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}
                  >
                    Answer
                  </label>

                  <input
                    type="text"
                    value={answerText}
                    onChange={(event) =>
                      setAnswerText(
                        event.target.value
                      )
                    }
                    placeholder="Enter answer"
                    style={inputStyle}
                  />
                </div>

                {/* DISPLAY ORDER */}

                <div
                  style={{
                    marginBottom: '20px',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}
                  >
                    Display Order
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={answerOrder}
                    onChange={(event) =>
                      setAnswerOrder(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>

                {/* CORRECT ANSWER */}

                <div
                  style={{
                    marginBottom: '25px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isCorrect}
                      onChange={(event) =>
                        setIsCorrect(
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      This is the correct answer
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  style={primaryButtonStyle}
                >
                  Add Answer
                </button>
              </form>
            </section>
          )}
        </>
      )}

      {/* BACK */}

      <Link to="/admin">
        ← Back to Admin Dashboard
      </Link>
    </div>
  )
}

// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px',
  border: '1px solid #aaa',
  fontSize: '16px',
  background: '#fff',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
}

const primaryButtonStyle = {
  background: '#111',
  color: '#fff',
  border: '1px solid #111',
  padding: '13px 22px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  background: '#fff',
  color: '#111',
  border: '1px solid #111',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  marginTop: '15px',
}

const dangerButtonStyle = {
  background: '#fff',
  color: '#b00000',
  border: '1px solid #b00000',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

export default ManageQuiz