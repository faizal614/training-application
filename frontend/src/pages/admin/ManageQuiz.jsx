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
  const [randomizeQuestions, setRandomizeQuestions] =
    useState(false)

  // ---------------------------------------------------------
  // EDIT QUIZ STATE
  // ---------------------------------------------------------

  const [editingQuizId, setEditingQuizId] =
    useState(null)

  const [editQuizTitle, setEditQuizTitle] =
    useState('')

  const [editPassingScore, setEditPassingScore] =
    useState(70)

  const [editMaxAttempts, setEditMaxAttempts] =
    useState(3)

  const [editRandomizeQuestions, setEditRandomizeQuestions] =
    useState(false)

  const [savingQuiz, setSavingQuiz] =
    useState(false)

  // ---------------------------------------------------------
  // CREATE QUESTION FORM
  // ---------------------------------------------------------

  const [questionText, setQuestionText] = useState('')
  const [questionOrder, setQuestionOrder] = useState(1)

  // ---------------------------------------------------------
  // EDIT QUESTION STATE
  // ---------------------------------------------------------

  const [editingQuestionId, setEditingQuestionId] =
    useState(null)

  const [editQuestionText, setEditQuestionText] =
    useState('')

  const [editQuestionOrder, setEditQuestionOrder] =
    useState(1)

  const [savingQuestion, setSavingQuestion] =
    useState(false)

  // ---------------------------------------------------------
  // CREATE ANSWER FORM
  // ---------------------------------------------------------

  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [answerText, setAnswerText] = useState('')
  const [answerOrder, setAnswerOrder] = useState(1)
  const [isCorrect, setIsCorrect] = useState(false)

  // ---------------------------------------------------------
  // EDIT ANSWER STATE
  // ---------------------------------------------------------

  const [editingAnswerId, setEditingAnswerId] =
    useState(null)

  const [editAnswerText, setEditAnswerText] =
    useState('')

  const [editAnswerOrder, setEditAnswerOrder] =
    useState(1)

  const [editIsCorrect, setEditIsCorrect] =
    useState(false)

  const [savingAnswer, setSavingAnswer] =
    useState(false)

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

      console.log(
        'Questions API response:',
        data
      )

      setQuestions(data)

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
            randomize_questions: Boolean(
              randomizeQuestions
            ),
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
      setRandomizeQuestions(false)

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
  // START EDITING QUIZ
  // ---------------------------------------------------------

  const handleEditQuiz = (quiz) => {
    setError('')
    setSuccess('')

    setEditingQuizId(quiz.id)

    setEditQuizTitle(quiz.title || '')
    setEditPassingScore(
      quiz.passing_score ?? 70
    )
    setEditMaxAttempts(
      quiz.max_attempts ?? 3
    )
    setEditRandomizeQuestions(
      Boolean(quiz.randomize_questions)
    )
  }

  // ---------------------------------------------------------
  // CANCEL EDITING QUIZ
  // ---------------------------------------------------------

  const handleCancelEditQuiz = () => {
    setEditingQuizId(null)

    setEditQuizTitle('')
    setEditPassingScore(70)
    setEditMaxAttempts(3)
    setEditRandomizeQuestions(false)
  }

  // ---------------------------------------------------------
  // UPDATE QUIZ
  // ---------------------------------------------------------

  const handleUpdateQuiz = async (quizId) => {
    if (!editQuizTitle.trim()) {
      setError('Please enter a quiz title.')
      return
    }

    if (
      Number(editPassingScore) < 0 ||
      Number(editPassingScore) > 100
    ) {
      setError('Passing score must be between 0 and 100.')
      return
    }

    if (Number(editMaxAttempts) < 1) {
      setError('Maximum attempts must be at least 1.')
      return
    }

    try {
      setSavingQuiz(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/quiz/${quizId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editQuizTitle.trim(),
            passing_score: Number(
              editPassingScore
            ),
            max_attempts: Number(
              editMaxAttempts
            ),
            randomize_questions:
              Boolean(editRandomizeQuestions),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to update quiz'
        )
      }

      setQuizzes([data])
      setSelectedQuiz(data)

      setEditingQuizId(null)

      setSuccess('Quiz updated successfully.')

      await loadQuestions(data.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingQuiz(false)
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

      setEditingQuizId(null)

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
      setQuestionOrder(
        updatedQuestions.length + 1
      )

      setSuccess(
        'Question created successfully.'
      )

      setSelectedQuestion(data)

      setAnswerOrder(1)
      setAnswerText('')
      setIsCorrect(false)
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------------------------------------------------------
  // START EDITING QUESTION
  // ---------------------------------------------------------

  const handleEditQuestion = (question) => {
    setError('')
    setSuccess('')

    setEditingQuestionId(question.id)

    setEditQuestionText(
      question.question_text || ''
    )

    setEditQuestionOrder(
      question.display_order ?? 1
    )
  }

  // ---------------------------------------------------------
  // CANCEL EDITING QUESTION
  // ---------------------------------------------------------

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null)

    setEditQuestionText('')
    setEditQuestionOrder(1)
  }

  // ---------------------------------------------------------
  // UPDATE QUESTION
  // ---------------------------------------------------------

  const handleUpdateQuestion = async (
    questionId
  ) => {
    if (!editQuestionText.trim()) {
      setError('Please enter a question.')
      return
    }

    if (Number(editQuestionOrder) < 1) {
      setError(
        'Question display order must be at least 1.'
      )
      return
    }

    try {
      setSavingQuestion(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/questions/${questionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_text:
              editQuestionText.trim(),
            display_order:
              Number(editQuestionOrder),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to update question'
        )
      }

      setEditingQuestionId(null)

      setSuccess(
        'Question updated successfully.'
      )

      if (selectedQuiz) {
        await loadQuestions(selectedQuiz.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingQuestion(false)
    }
  }

  // ---------------------------------------------------------
  // DELETE QUESTION
  // ---------------------------------------------------------

  const handleDeleteQuestion = async (
    questionId
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this question? This will also delete its answers.'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/questions/${questionId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to delete question'
        )
      }

      if (
        selectedQuestion &&
        selectedQuestion.id === questionId
      ) {
        setSelectedQuestion(null)
        setAnswerText('')
        setAnswerOrder(1)
        setIsCorrect(false)
      }

      setEditingQuestionId(null)

      setSuccess(
        'Question deleted successfully.'
      )

      if (selectedQuiz) {
        await loadQuestions(selectedQuiz.id)
      }
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

      setAnswerOrder(
        (previous) => Number(previous) + 1
      )

      setSuccess(
        'Answer created successfully.'
      )

      if (selectedQuiz) {
        await loadQuestions(selectedQuiz.id)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------------------------------------------------------
  // START EDITING ANSWER
  // ---------------------------------------------------------

  const handleEditAnswer = (answer) => {
    setError('')
    setSuccess('')

    setEditingAnswerId(answer.id)

    setEditAnswerText(
      answer.answer_text || ''
    )

    setEditAnswerOrder(
      answer.display_order ?? 1
    )

    setEditIsCorrect(
      Boolean(answer.is_correct)
    )
  }

  // ---------------------------------------------------------
  // CANCEL EDITING ANSWER
  // ---------------------------------------------------------

  const handleCancelEditAnswer = () => {
    setEditingAnswerId(null)

    setEditAnswerText('')
    setEditAnswerOrder(1)
    setEditIsCorrect(false)
  }

  // ---------------------------------------------------------
  // UPDATE ANSWER
  // ---------------------------------------------------------

  const handleUpdateAnswer = async (
    answerId
  ) => {
    if (!editAnswerText.trim()) {
      setError('Please enter an answer.')
      return
    }

    if (Number(editAnswerOrder) < 1) {
      setError(
        'Answer display order must be at least 1.'
      )
      return
    }

    try {
      setSavingAnswer(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/answers/${answerId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answer_text:
              editAnswerText.trim(),
            is_correct:
              Boolean(editIsCorrect),
            display_order:
              Number(editAnswerOrder),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to update answer'
        )
      }

      setEditingAnswerId(null)

      setSuccess(
        'Answer updated successfully.'
      )

      if (selectedQuiz) {
        await loadQuestions(selectedQuiz.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAnswer(false)
    }
  }

  // ---------------------------------------------------------
  // DELETE ANSWER
  // ---------------------------------------------------------

  const handleDeleteAnswer = async (
    answerId
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this answer?'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/answers/${answerId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to delete answer'
        )
      }

      setEditingAnswerId(null)

      setSuccess(
        'Answer deleted successfully.'
      )

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

    const answers = Array.isArray(
      question.answers
    )
      ? question.answers
      : []

    setAnswerOrder(answers.length + 1)

    setAnswerText('')
    setIsCorrect(false)

    setTimeout(() => {
      const element =
        document.getElementById(
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
                setSelectedCourse(
                  event.target.value
                )
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
                setSelectedModule(
                  event.target.value
                )
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
                setQuizTitle(
                  event.target.value
                )
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
                setPassingScore(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          {/* MAX ATTEMPTS */}

          <div style={{ marginBottom: '20px' }}>
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
                setMaxAttempts(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          {/* RANDOMIZE QUESTIONS */}

          <div style={{ marginBottom: '25px' }}>
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
                checked={randomizeQuestions}
                onChange={(event) =>
                  setRandomizeQuestions(
                    event.target.checked
                  )
                }
              />

              <span>
                Randomize Questions
              </span>
            </label>

            <p
              style={{
                margin: '8px 0 0 26px',
                color: '#555',
                fontSize: '14px',
              }}
            >
              Show quiz questions in a different order
              for learners.
            </p>
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
            {quizzes.length === 1
              ? 'quiz'
              : 'quizzes'}
          </span>
        </div>

        {quizLoading && (
          <p>Loading quiz...</p>
        )}

        {!quizLoading &&
          quizzes.length === 0 && (
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

            {editingQuizId === quiz.id ? (
              <>
                {/* EDIT QUIZ TITLE */}

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
                    Quiz Title
                  </label>

                  <input
                    type="text"
                    value={editQuizTitle}
                    onChange={(event) =>
                      setEditQuizTitle(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>

                {/* EDIT PASSING SCORE */}

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
                    Passing Score (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editPassingScore}
                    onChange={(event) =>
                      setEditPassingScore(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>

                {/* EDIT MAX ATTEMPTS */}

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
                    Maximum Attempts
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={editMaxAttempts}
                    onChange={(event) =>
                      setEditMaxAttempts(
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>

                {/* EDIT RANDOMIZATION */}

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
                      checked={
                        editRandomizeQuestions
                      }
                      onChange={(event) =>
                        setEditRandomizeQuestions(
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      Randomize Questions
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={() =>
                    handleUpdateQuiz(quiz.id)
                  }
                  disabled={savingQuiz}
                >
                  {savingQuiz
                    ? 'Saving...'
                    : 'Save Quiz'}
                </button>

                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={
                    handleCancelEditQuiz
                  }
                  disabled={savingQuiz}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
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
                  <strong>
                    Passing Score:
                  </strong>{' '}
                  {quiz.passing_score}%
                </p>

                <p>
                  <strong>
                    Maximum Attempts:
                  </strong>{' '}
                  {quiz.max_attempts}
                </p>

                <p>
                  <strong>
                    Randomize Questions:
                  </strong>{' '}
                  {quiz.randomize_questions
                    ? 'Enabled'
                    : 'Disabled'}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleEditQuiz(quiz)
                  }
                  style={secondaryButtonStyle}
                >
                  Edit Quiz
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteQuiz(
                      quiz.id
                    )
                  }
                  style={dangerButtonStyle}
                >
                  Delete Quiz
                </button>
              </>
            )}
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

              <div
                style={{
                  marginBottom: '25px',
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

                {editingQuestionId ===
                question.id ? (
                  <>
                    {/* EDIT QUESTION */}

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
                        Question
                      </label>

                      <textarea
                        value={
                          editQuestionText
                        }
                        onChange={(event) =>
                          setEditQuestionText(
                            event.target.value
                          )
                        }
                        rows="4"
                        style={textareaStyle}
                      />
                    </div>

                    {/* EDIT QUESTION ORDER */}

                    <div
                      style={{
                        marginBottom: '25px',
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
                        value={
                          editQuestionOrder
                        }
                        onChange={(event) =>
                          setEditQuestionOrder(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </div>

                    <button
                      type="button"
                      style={primaryButtonStyle}
                      onClick={() =>
                        handleUpdateQuestion(
                          question.id
                        )
                      }
                      disabled={savingQuestion}
                    >
                      {savingQuestion
                        ? 'Saving...'
                        : 'Save Question'}
                    </button>

                    <button
                      type="button"
                      style={
                        secondaryButtonStyle
                      }
                      onClick={
                        handleCancelEditQuestion
                      }
                      disabled={savingQuestion}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <h3
                      style={{
                        fontFamily:
                          'Georgia, serif',
                        fontSize: '28px',
                        fontWeight: '400',
                        margin:
                          '0 0 15px',
                      }}
                    >
                      {
                        question.question_text
                      }
                    </h3>

                    <p>
                      <strong>
                        Display Order:
                      </strong>{' '}
                      {
                        question.display_order
                      }
                    </p>

                    <button
                      type="button"
                      style={
                        secondaryButtonStyle
                      }
                      onClick={() =>
                        handleEditQuestion(
                          question
                        )
                      }
                    >
                      Edit Question
                    </button>

                    <button
                      type="button"
                      style={
                        dangerButtonStyle
                      }
                      onClick={() =>
                        handleDeleteQuestion(
                          question.id
                        )
                      }
                    >
                      Delete Question
                    </button>
                  </>
                )}

                {/* ANSWERS */}

                <div
                  style={{
                    borderTop:
                      '1px solid #ddd',
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

                  {Array.isArray(
                    question.answers
                  ) &&
                  question.answers.length >
                    0 ? (
                    question.answers.map(
                      (
                        answer,
                        answerIndex
                      ) => (
                        <div
                          key={
                            answer.id
                          }
                          style={{
                            border:
                              '1px solid #ddd',
                            padding:
                              '14px',
                            marginBottom:
                              '10px',
                          }}
                        >
                          {editingAnswerId ===
                          answer.id ? (
                            <>
                              {/* EDIT ANSWER TEXT */}

                              <div
                                style={{
                                  marginBottom:
                                    '15px',
                                }}
                              >
                                <label
                                  style={{
                                    display:
                                      'block',
                                    fontWeight:
                                      '600',
                                    marginBottom:
                                      '8px',
                                  }}
                                >
                                  Answer
                                </label>

                                <input
                                  type="text"
                                  value={
                                    editAnswerText
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setEditAnswerText(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  style={
                                    inputStyle
                                  }
                                />
                              </div>

                              {/* EDIT ORDER */}

                              <div
                                style={{
                                  marginBottom:
                                    '15px',
                                }}
                              >
                                <label
                                  style={{
                                    display:
                                      'block',
                                    fontWeight:
                                      '600',
                                    marginBottom:
                                      '8px',
                                  }}
                                >
                                  Display Order
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    editAnswerOrder
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setEditAnswerOrder(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  style={
                                    inputStyle
                                  }
                                />
                              </div>

                              {/* EDIT CORRECTNESS */}

                              <div
                                style={{
                                  marginBottom:
                                    '15px',
                                }}
                              >
                                <label
                                  style={{
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    gap: '10px',
                                    cursor:
                                      'pointer',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      editIsCorrect
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setEditIsCorrect(
                                        event
                                          .target
                                          .checked
                                      )
                                    }
                                  />

                                  <span>
                                    This is the
                                    correct
                                    answer
                                  </span>
                                </label>
                              </div>

                              <button
                                type="button"
                                style={
                                  primaryButtonStyle
                                }
                                onClick={() =>
                                  handleUpdateAnswer(
                                    answer.id
                                  )
                                }
                                disabled={
                                  savingAnswer
                                }
                              >
                                {savingAnswer
                                  ? 'Saving...'
                                  : 'Save Answer'}
                              </button>

                              <button
                                type="button"
                                style={
                                  secondaryButtonStyle
                                }
                                onClick={
                                  handleCancelEditAnswer
                                }
                                disabled={
                                  savingAnswer
                                }
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <div
                              style={{
                                display:
                                  'flex',
                                justifyContent:
                                  'space-between',
                                alignItems:
                                  'center',
                                gap: '20px',
                                flexWrap:
                                  'wrap',
                              }}
                            >
                              <span>
                                <strong>
                                  {answerIndex +
                                    1}
                                  .
                                </strong>{' '}
                                {
                                  answer.answer_text
                                }
                              </span>

                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '10px',
                                  flexWrap:
                                    'wrap',
                                }}
                              >
                                <strong
                                  style={{
                                    whiteSpace:
                                      'nowrap',
                                    color:
                                      answer.is_correct ===
                                      true
                                        ? '#087f23'
                                        : answer.is_correct ===
                                          false
                                        ? '#b00000'
                                        : '#555',
                                  }}
                                >
                                  {answer.is_correct ===
                                  true
                                    ? 'Correct'
                                    : answer.is_correct ===
                                      false
                                    ? 'Incorrect'
                                    : 'Correctness not returned'}
                                </strong>

                                <button
  type="button"
  onClick={() =>
    handleEditAnswer(answer)
  }
  style={{
    ...secondaryButtonStyle,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
  }}
>
  Edit Answer
</button>

<button
  type="button"
  onClick={() =>
    handleDeleteAnswer(answer.id)
  }
  style={{
    ...dangerButtonStyle,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
  }}
>
  Delete Answer
</button>
                              </div>
                            </div>
                          )}
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
                    handleSelectQuestion(
                      question
                    )
                  }
                  style={
                    secondaryButtonStyle
                  }
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
                  fontFamily:
                    'Georgia, serif',
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

              <form
                onSubmit={
                  handleCreateAnswer
                }
              >
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
                          event.target
                            .checked
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
                  style={
                    primaryButtonStyle
                  }
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
  marginRight: '10px',
  marginBottom: '10px',
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
  marginRight: '10px',
  marginBottom: '10px',
}

const dangerButtonStyle = {
  background: '#fff',
  color: '#b00000',
  border: '1px solid #b00000',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  marginRight: '10px',
  marginBottom: '10px',
}

export default ManageQuiz