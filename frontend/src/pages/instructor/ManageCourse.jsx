import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'


function ManageCourse() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const { courseId } = useParams()

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [learners, setLearners] = useState([])

  const [expandedModuleId, setExpandedModuleId] =
    useState(null)

  const [expandedContentModuleId, setExpandedContentModuleId] =
    useState(null)

  const [expandedQuizModuleId, setExpandedQuizModuleId] =
    useState(null)

  const [moduleDetails, setModuleDetails] =
    useState({})

  const [loading, setLoading] = useState(true)
  const [loadingModule, setLoadingModule] =
    useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  // =========================================================
  // LOAD COURSE
  // =========================================================

  const loadCourse = async () => {
    const response = await apiFetch(
      `/instructor/courses/${courseId}`,
      {},
      handleSessionExpired
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'Failed to load course'
      )
    }

    setCourse(data)

    setModules(
      Array.isArray(data.modules)
        ? data.modules
        : []
    )
  }


  // =========================================================
  // LOAD LEARNERS
  // =========================================================

  const loadLearners = async () => {
    const response = await apiFetch(
      `/instructor/courses/${courseId}/learners`,
      {},
      handleSessionExpired
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail ||
          'Failed to load learners'
      )
    }

    setLearners(
      Array.isArray(data)
        ? data
        : []
    )
  }


  // =========================================================
  // LOAD MODULE DETAILS
  // =========================================================

  const loadModuleDetails = async (moduleId) => {
    try {
      setLoadingModule(true)
      setError('')

      const [
        moduleResponse,
        contentResponse,
        quizResponse,
      ] = await Promise.all([
        apiFetch(
          `/courses/modules/${moduleId}`,
          {},
          handleSessionExpired
        ),

        apiFetch(
          `/modules/${moduleId}/content`,
          {},
          handleSessionExpired
        ),

        apiFetch(
          `/modules/${moduleId}/quiz`,
          {},
          handleSessionExpired
        ),
      ])

      const moduleData =
        await moduleResponse.json()

      const contentData =
        await contentResponse.json()

      let quizData = null

      if (quizResponse.ok) {
        quizData =
          await quizResponse.json()
      }

      if (!moduleResponse.ok) {
        throw new Error(
          moduleData.detail ||
            'Failed to load module'
        )
      }

      let questions = []

      if (quizData) {
        const questionsResponse =
          await apiFetch(
            `/modules/quizzes/${quizData.id}/questions`,
            {},
            handleSessionExpired
          )

        if (questionsResponse.ok) {
          questions =
            await questionsResponse.json()
        }
      }

      setModuleDetails((previous) => ({
        ...previous,
        [moduleId]: {
          module: moduleData,

          content: Array.isArray(contentData)
            ? contentData
            : [],

          quiz: quizData,

          questions: Array.isArray(questions)
            ? questions
            : [],
        },
      }))
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setLoadingModule(false)
    }
  }


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setError(
        'Please sign in as an instructor.'
      )

      setLoading(false)

      return
    }

    if (!courseId) {
      setError('Course ID is missing.')

      setLoading(false)

      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        await Promise.all([
          loadCourse(),
          loadLearners(),
        ])
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

    loadData()
  }, [
    isAuthenticated,
    token,
    courseId,
    handleSessionExpired,
  ])


  // =========================================================
  // TOGGLE MODULE
  // =========================================================

  const toggleModule = async (moduleId) => {
    setSuccess('')
    setError('')

    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null)

      setExpandedContentModuleId(null)
      setExpandedQuizModuleId(null)

      return
    }

    setExpandedModuleId(moduleId)

    setExpandedContentModuleId(null)
    setExpandedQuizModuleId(null)

    if (!moduleDetails[moduleId]) {
      await loadModuleDetails(moduleId)
    }
  }


  // =========================================================
  // TOGGLE CONTENT EDITOR
  // =========================================================

  const toggleContentEditor = async (moduleId) => {
    setSuccess('')
    setError('')

    if (expandedModuleId !== moduleId) {
      setExpandedModuleId(moduleId)
    }

    if (expandedContentModuleId === moduleId) {
      setExpandedContentModuleId(null)
      return
    }

    setExpandedContentModuleId(moduleId)

    setExpandedQuizModuleId(null)

    if (!moduleDetails[moduleId]) {
      await loadModuleDetails(moduleId)
    }
  }


  // =========================================================
  // TOGGLE QUIZ EDITOR
  // =========================================================

  const toggleQuizEditor = async (moduleId) => {
    setSuccess('')
    setError('')

    if (expandedModuleId !== moduleId) {
      setExpandedModuleId(moduleId)
    }

    if (expandedQuizModuleId === moduleId) {
      setExpandedQuizModuleId(null)
      return
    }

    setExpandedQuizModuleId(moduleId)

    setExpandedContentModuleId(null)

    if (!moduleDetails[moduleId]) {
      await loadModuleDetails(moduleId)
    }
  }


  // =========================================================
  // UPDATE MODULE
  // =========================================================

  const updateModule = async (moduleId, data) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/courses/modules/${moduleId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            title: data.title,

            display_order: Number(
              data.display_order
            ),
          }),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to update module'
        )
      }

      setSuccess(
        'Module updated successfully.'
      )

      await loadCourse()
      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // UPDATE TRAINING CONTENT
  // =========================================================

  const updateContent = async (
    contentId,
    data,
    moduleId
  ) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/content/${contentId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify(data),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to update training content'
        )
      }

      setSuccess(
        'Training content updated successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // DELETE TRAINING CONTENT
  // =========================================================

  const deleteContent = async (
    contentId,
    moduleId
  ) => {
    if (
      !window.confirm(
        'Delete this training content?'
      )
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/content/${contentId}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to delete content'
        )
      }

      setSuccess(
        'Training content deleted successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // ADD QUIZ
  // =========================================================

  const addQuiz = async (
    moduleId,
    data
  ) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      /*
       * Backend endpoint:
       *
       * POST /modules/{module_id}/quiz
       *
       * The module_id comes from the URL.
       */

      const response = await apiFetch(
        `/modules/${moduleId}/quiz`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            title: data.title,

            passing_score: Number(
              data.passing_score
            ),

            max_attempts: Number(
              data.max_attempts
            ),
          }),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to add quiz'
        )
      }

      setSuccess(
        'Quiz added successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // UPDATE QUIZ
  // =========================================================

  const updateQuiz = async (
    quizId,
    data,
    moduleId
  ) => {
    try {
      setSaving(true)
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
            title: data.title,

            passing_score: Number(
              data.passing_score
            ),

            max_attempts: Number(
              data.max_attempts
            ),
          }),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to update quiz'
        )
      }

      setSuccess(
        'Quiz updated successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // DELETE QUIZ
  // =========================================================

  const deleteQuiz = async (
    quizId,
    moduleId
  ) => {
    if (
      !window.confirm(
        'Delete this quiz and all of its questions?'
      )
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/quiz/${quizId}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to delete quiz'
        )
      }

      setSuccess(
        'Quiz deleted successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // ADD QUESTION
  // =========================================================

  const addQuestion = async (
    quizId,
    data,
    moduleId
  ) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/quizzes/${quizId}/questions`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            question_text:
              data.question_text,

            display_order: Number(
              data.display_order
            ),
          }),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to add question'
        )
      }

      setSuccess(
        'Question added successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // UPDATE QUESTION
  // =========================================================

  const updateQuestion = async (
    questionId,
    data,
    moduleId
  ) => {
    try {
      setSaving(true)
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
              data.question_text,

            display_order: Number(
              data.display_order
            ),
          }),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to update question'
        )
      }

      setSuccess(
        'Question updated successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // DELETE QUESTION
  // =========================================================

  const deleteQuestion = async (
    questionId,
    moduleId
  ) => {
    if (
      !window.confirm(
        'Delete this question and its answers?'
      )
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/questions/${questionId}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to delete question'
        )
      }

      setSuccess(
        'Question deleted successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // ADD ANSWER
  // =========================================================

  const addAnswer = async (
    questionId,
    data,
    moduleId
  ) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/questions/${questionId}/answers`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            answer_text:
              data.answer_text,

            is_correct:
              Boolean(data.is_correct),

            display_order: Number(
              data.display_order
            ),
          }),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to add answer'
        )
      }

      setSuccess(
        'Answer added successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // UPDATE ANSWER
  // =========================================================

  const updateAnswer = async (
    answerId,
    data,
    moduleId
  ) => {
    try {
      setSaving(true)
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
              data.answer_text,

            is_correct:
              Boolean(data.is_correct),

            display_order: Number(
              data.display_order
            ),
          }),
        },

        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to update answer'
        )
      }

      setSuccess(
        'Answer updated successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // DELETE ANSWER
  // =========================================================

  const deleteAnswer = async (
    answerId,
    moduleId
  ) => {
    if (
      !window.confirm(
        'Delete this answer?'
      )
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/answers/${answerId}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result.detail ||
            'Failed to delete answer'
        )
      }

      setSuccess(
        'Answer deleted successfully.'
      )

      await loadModuleDetails(moduleId)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">

        <section className="page-intro">

          <p className="eyebrow">
            INSTRUCTOR / COURSE MANAGEMENT
          </p>

          <h1>
            Manage Course
          </h1>

          <p className="page-description">
            Loading course information...
          </p>

        </section>

      </main>
    )
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="main-content">

      {/* =====================================================
          COURSE HEADER
      ===================================================== */}

      <section className="page-intro">

        <p className="eyebrow">
          INSTRUCTOR / COURSE MANAGEMENT
        </p>

        <h1>
          {course?.course_title ||
            'Manage Course'}
        </h1>

        <p className="page-description">
          {course?.course_description ||
            'Manage the content and learning structure of this course.'}
        </p>

      </section>


      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {error && (
        <div className="manage-message manage-message--error">
          {error}
        </div>
      )}

      {success && (
        <div className="manage-message manage-message--success">
          {success}
        </div>
      )}


      {/* =====================================================
          COURSE OVERVIEW
      ===================================================== */}

      <section className="course-placeholder">

        <p className="eyebrow">
          COURSE OVERVIEW
        </p>

        <div className="manage-overview-grid">

          <article className="course-card">

            <p className="eyebrow">
              MODULES
            </p>

            <h3 className="manage-stat">
              {modules.length}
            </h3>

            <p>
              Modules currently included
              in this course.
            </p>

          </article>


          <article className="course-card">

            <p className="eyebrow">
              ENROLLED MEMBERS
            </p>

            <h3 className="manage-stat">
              {course?.learner_count ?? 0}
            </h3>

            <p>
              Learners currently enrolled
              in this course.
            </p>

          </article>


          <article className="course-card">

            <p className="eyebrow">
              COURSE STATUS
            </p>

            <h3 className="manage-status">
              Active
            </h3>

            <p>
              This course is assigned
              to you for management.
            </p>

          </article>

        </div>

      </section>


      {/* =====================================================
          MODULES
      ===================================================== */}

      <section className="manage-section">

        <div className="manage-section-header">

          <div>

            <p className="eyebrow">
              COURSE CONTENT
            </p>

            <h2>
              Modules
            </h2>

            <p className="manage-description">
              Manage the modules, training
              content, and quizzes belonging
              to this course.
            </p>

          </div>

          <span className="manage-count">
            {modules.length}{' '}
            {modules.length === 1
              ? 'module'
              : 'modules'}
          </span>

        </div>


        {modules.length === 0 ? (

          <div className="manage-empty">

            <p className="eyebrow">
              NO MODULES
            </p>

            <p>
              No modules have been added
              to this course yet.
            </p>

          </div>

        ) : (

          <div className="manage-module-list">

            {modules.map((module, index) => {

              const details =
                moduleDetails[module.module_id]

              const expanded =
                expandedModuleId ===
                module.module_id

              const contentExpanded =
                expandedContentModuleId ===
                module.module_id

              const quizExpanded =
                expandedQuizModuleId ===
                module.module_id

              return (

                <article
                  key={module.module_id}
                  className={`manage-module ${
                    expanded
                      ? 'manage-module--expanded'
                      : ''
                  }`}
                >

                  {/* =================================================
                      MODULE HEADER
                  ================================================= */}

                  <div className="manage-module-header">

                    <div className="manage-module-number">

                      {String(
                        module.display_order ||
                          index + 1
                      ).padStart(2, '0')}

                    </div>


                    <div className="manage-module-info">

                      <p className="eyebrow">

                        MODULE{' '}

                        {module.display_order ||
                          index + 1}

                      </p>

                      <h3>
                        {module.title}
                      </h3>

                      <p>
                        Module ID:{' '}
                        {module.module_id}
                      </p>

                    </div>


                    <button
                      type="button"
                      className="auth-button manage-module-button"
                      onClick={() =>
                        toggleModule(
                          module.module_id
                        )
                      }
                    >
                      {expanded
                        ? 'Close Module'
                        : 'Manage Module'}
                    </button>

                  </div>


                  {/* =================================================
                      MODULE PANEL
                  ================================================= */}

                  {expanded && (

                    <div className="manage-module-panel">

                      {loadingModule ? (

                        <p>
                          Loading module details...
                        </p>

                      ) : details ? (

                        <>

                          {/* =========================================
                              MODULE DETAILS
                          ========================================= */}

                          <ModuleEditor
                            module={details.module}
                            saving={saving}
                            onSave={(data) =>
                              updateModule(
                                module.module_id,
                                data
                              )
                            }
                          />


                          {/* =========================================
                              MANAGEMENT BUTTONS
                          ========================================= */}

                          <div className="manage-module-actions">

                            <button
                              type="button"
                              className="auth-button"
                              onClick={() =>
                                toggleContentEditor(
                                  module.module_id
                                )
                              }
                            >
                              {contentExpanded
                                ? 'Close Content'
                                : 'Edit Content'}
                            </button>


                            <button
                              type="button"
                              className="auth-button"
                              onClick={() =>
                                toggleQuizEditor(
                                  module.module_id
                                )
                              }
                            >
                              {quizExpanded
                                ? 'Close Quiz'
                                : details.quiz
                                  ? 'Edit Quiz'
                                  : 'Add Quiz'}
                            </button>

                          </div>


                          {/* =========================================
                              CONTENT DROPDOWN
                          ========================================= */}

                          {contentExpanded && (

                            <div className="manage-child-dropdown">

                              <ContentEditor
                                content={
                                  details.content
                                }

                                saving={saving}

                                onUpdate={(
                                  contentId,
                                  data
                                ) =>
                                  updateContent(
                                    contentId,
                                    data,
                                    module.module_id
                                  )
                                }

                                onDelete={(
                                  contentId
                                ) =>
                                  deleteContent(
                                    contentId,
                                    module.module_id
                                  )
                                }
                              />

                            </div>

                          )}


                          {/* =========================================
                              QUIZ DROPDOWN
                          ========================================= */}

                          {quizExpanded && (

                            <div className="manage-child-dropdown">

                              <QuizEditor
                                quiz={details.quiz}

                                questions={
                                  details.questions
                                }

                                saving={saving}

                                onAddQuiz={(
                                  data
                                ) =>
                                  addQuiz(
                                    module.module_id,
                                    data
                                  )
                                }

                                onUpdateQuiz={(
                                  quizId,
                                  data
                                ) =>
                                  updateQuiz(
                                    quizId,
                                    data,
                                    module.module_id
                                  )
                                }

                                onDeleteQuiz={(
                                  quizId
                                ) =>
                                  deleteQuiz(
                                    quizId,
                                    module.module_id
                                  )
                                }

                                onAddQuestion={(
                                  quizId,
                                  data
                                ) =>
                                  addQuestion(
                                    quizId,
                                    data,
                                    module.module_id
                                  )
                                }

                                onUpdateQuestion={(
                                  questionId,
                                  data
                                ) =>
                                  updateQuestion(
                                    questionId,
                                    data,
                                    module.module_id
                                  )
                                }

                                onDeleteQuestion={(
                                  questionId
                                ) =>
                                  deleteQuestion(
                                    questionId,
                                    module.module_id
                                  )
                                }

                                onAddAnswer={(
                                  questionId,
                                  data
                                ) =>
                                  addAnswer(
                                    questionId,
                                    data,
                                    module.module_id
                                  )
                                }

                                onUpdateAnswer={(
                                  answerId,
                                  data
                                ) =>
                                  updateAnswer(
                                    answerId,
                                    data,
                                    module.module_id
                                  )
                                }

                                onDeleteAnswer={(
                                  answerId
                                ) =>
                                  deleteAnswer(
                                    answerId,
                                    module.module_id
                                  )
                                }
                              />

                            </div>

                          )}

                        </>

                      ) : (

                        <p>
                          Unable to load module details.
                        </p>

                      )}

                    </div>

                  )}

                </article>

              )
            })}

          </div>

        )}

      </section>


      {/* =====================================================
          LEARNERS
      ===================================================== */}

      <section className="manage-section">

        <div className="manage-section-header">

          <div>

            <p className="eyebrow">
              LEARNER PROGRESS
            </p>

            <h2>
              Learners
            </h2>

            <p className="manage-description">
              View learners enrolled in this
              course and monitor their progress.
            </p>

          </div>

          <span className="manage-count">

            {learners.length}{' '}

            {learners.length === 1
              ? 'learner'
              : 'learners'}

          </span>

        </div>


        {learners.length === 0 ? (

          <div className="manage-empty">

            <p>
              No learners are currently
              enrolled in this course.
            </p>

          </div>

        ) : (

          <div className="learner-list">

            {learners.map((learner) => (

              <LearnerCard
                key={learner.learner_id}
                learner={learner}
              />

            ))}

          </div>

        )}

      </section>


      {/* =====================================================
          BACK
      ===================================================== */}

      <p className="manage-back">

        <Link to="/instructor">
          ← Back to Instructor Dashboard
        </Link>

      </p>

    </main>
  )
}


// ===========================================================
// MODULE EDITOR
// ===========================================================

function ModuleEditor({
  module,
  saving,
  onSave,
}) {
  const [title, setTitle] =
    useState(module.title || '')

  const [displayOrder, setDisplayOrder] =
    useState(
      module.display_order || 1
    )

  return (
    <div className="manage-editor">

      <div className="manage-editor-heading">

        <div>

          <p className="eyebrow">
            MODULE DETAILS
          </p>

          <h3>
            Edit Module
          </h3>

        </div>

      </div>


      <div className="manage-form-grid">

        <div className="manage-field">

          <label>
            Module Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

        </div>


        <div className="manage-field">

          <label>
            Display Order
          </label>

          <input
            type="number"
            min="1"
            value={displayOrder}
            onChange={(event) =>
              setDisplayOrder(
                event.target.value
              )
            }
          />

        </div>

      </div>


      <button
        type="button"
        className="auth-button"
        disabled={saving}
        onClick={() =>
          onSave({
            title,
            display_order: displayOrder,
          })
        }
      >
        {saving
          ? 'Saving...'
          : 'Update Module'}
      </button>

    </div>
  )
}


// ===========================================================
// CONTENT EDITOR
// ===========================================================

function ContentEditor({
  content,
  saving,
  onUpdate,
  onDelete,
}) {
  return (
    <div className="manage-editor">

      <div className="manage-editor-heading">

        <div>

          <p className="eyebrow">
            TRAINING CONTENT
          </p>

          <h3>
            Content
          </h3>

        </div>


        <span className="manage-count">

          {content.length}{' '}

          {content.length === 1
            ? 'item'
            : 'items'}

        </span>

      </div>


      {content.length === 0 ? (

        <p className="manage-muted">
          No training content has been
          added to this module yet.
        </p>

      ) : (

        <div className="content-editor-list">

          {content.map((item) => (

            <ContentItem
              key={item.id}
              item={item}
              saving={saving}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />

          ))}

        </div>

      )}

    </div>
  )
}


// ===========================================================
// CONTENT ITEM
// ===========================================================

function ContentItem({
  item,
  saving,
  onUpdate,
  onDelete,
}) {
  const [title, setTitle] =
    useState(item.title || '')

  const [description, setDescription] =
    useState(item.description || '')

  const [contentType, setContentType] =
    useState(
      item.content_type || 'text'
    )

  const [body, setBody] =
    useState(item.body || '')

  const [videoUrl, setVideoUrl] =
    useState(item.video_url || '')

  const [displayOrder, setDisplayOrder] =
    useState(
      item.display_order || 1
    )

  return (
    <div className="content-editor-item">

      <div className="content-editor-title">

        <span className="eyebrow">
          CONTENT #{item.display_order}
        </span>

      </div>


      <div className="manage-form-grid">

        <div className="manage-field">

          <label>
            Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

        </div>


        <div className="manage-field">

          <label>
            Type
          </label>

          <select
            value={contentType}
            onChange={(event) =>
              setContentType(
                event.target.value
              )
            }
          >

            <option value="text">
              Text
            </option>

            <option value="video">
              Video
            </option>

          </select>

        </div>


        <div className="manage-field">

          <label>
            Display Order
          </label>

          <input
            type="number"
            min="1"
            value={displayOrder}
            onChange={(event) =>
              setDisplayOrder(
                event.target.value
              )
            }
          />

        </div>

      </div>


      <div className="manage-field">

        <label>
          Description
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          rows="3"
        />

      </div>


      {contentType === 'text' ? (

        <div className="manage-field">

          <label>
            Training Body
          </label>

          <textarea
            value={body}
            onChange={(event) =>
              setBody(event.target.value)
            }
            rows="8"
          />

        </div>

      ) : (

        <div className="manage-field">

          <label>
            Video URL
          </label>

          <input
            type="url"
            value={videoUrl}
            onChange={(event) =>
              setVideoUrl(
                event.target.value
              )
            }
          />

        </div>

      )}


      <div className="manage-actions">

        <button
          type="button"
          className="auth-button"
          disabled={saving}
          onClick={() =>
            onUpdate(
              item.id,
              {
                title,
                description,
                content_type: contentType,

                body:
                  contentType === 'text'
                    ? body
                    : null,

                video_url:
                  contentType === 'video'
                    ? videoUrl
                    : null,

                display_order:
                  Number(displayOrder),
              }
            )
          }
        >
          {saving
            ? 'Saving...'
            : 'Update Content'}
        </button>


        <button
          type="button"
          className="auth-button manage-danger-button"
          disabled={saving}
          onClick={() =>
            onDelete(item.id)
          }
        >
          Delete Content
        </button>

      </div>

    </div>
  )
}


// ===========================================================
// QUIZ EDITOR
// ===========================================================

function QuizEditor({
  quiz,
  questions,
  saving,
  onAddQuiz,
  onUpdateQuiz,
  onDeleteQuiz,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
}) {
  // =========================================================
  // NEW QUIZ STATE
  // =========================================================

  const [newQuizTitle, setNewQuizTitle] =
    useState('')

  const [newPassingScore, setNewPassingScore] =
    useState(70)

  const [newMaxAttempts, setNewMaxAttempts] =
    useState(3)


  // =========================================================
  // EXISTING QUIZ STATE
  // =========================================================

  const [title, setTitle] =
    useState(
      quiz?.title || ''
    )

  const [passingScore, setPassingScore] =
    useState(
      quiz?.passing_score ?? 70
    )

  const [maxAttempts, setMaxAttempts] =
    useState(
      quiz?.max_attempts ?? 3
    )


  // =========================================================
  // ADD QUIZ
  // =========================================================

  if (!quiz) {
    return (
      <div className="manage-editor">

        <div className="manage-editor-heading">

          <div>

            <p className="eyebrow">
              ASSESSMENT
            </p>

            <h3>
              Add Quiz
            </h3>

          </div>

        </div>


        <p className="manage-muted">
          This module does not have a quiz yet.
          Create one below.
        </p>


        <div className="manage-form-grid">

          <div className="manage-field">

            <label>
              Quiz Title
            </label>

            <input
              type="text"
              value={newQuizTitle}
              onChange={(event) =>
                setNewQuizTitle(
                  event.target.value
                )
              }
              placeholder="Enter quiz title"
            />

          </div>


          <div className="manage-field">

            <label>
              Passing Score
            </label>

            <input
              type="number"
              min="0"
              max="100"
              value={newPassingScore}
              onChange={(event) =>
                setNewPassingScore(
                  event.target.value
                )
              }
            />

          </div>


          <div className="manage-field">

            <label>
              Maximum Attempts
            </label>

            <input
              type="number"
              min="1"
              value={newMaxAttempts}
              onChange={(event) =>
                setNewMaxAttempts(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        <button
          type="button"
          className="auth-button"
          disabled={
            saving ||
            !newQuizTitle.trim()
          }
          onClick={() =>
            onAddQuiz({
              title: newQuizTitle,
              passing_score:
                newPassingScore,
              max_attempts:
                newMaxAttempts,
            })
          }
        >
          {saving
            ? 'Adding Quiz...'
            : 'Add Quiz'}
        </button>

      </div>
    )
  }


  // =========================================================
  // EXISTING QUIZ
  // =========================================================

  return (
    <div className="manage-editor">

      <div className="manage-editor-heading">

        <div>

          <p className="eyebrow">
            ASSESSMENT
          </p>

          <h3>
            Quiz
          </h3>

        </div>


        <span className="manage-count">

          {questions.length}{' '}

          {questions.length === 1
            ? 'question'
            : 'questions'}

        </span>

      </div>


      {/* =====================================================
          QUIZ DETAILS
      ===================================================== */}

      <div className="manage-form-grid">

        <div className="manage-field">

          <label>
            Quiz Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

        </div>


        <div className="manage-field">

          <label>
            Passing Score
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
          />

        </div>


        <div className="manage-field">

          <label>
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
          />

        </div>

      </div>


      <div className="manage-actions">

        <button
          type="button"
          className="auth-button"
          disabled={saving}
          onClick={() =>
            onUpdateQuiz(
              quiz.id,
              {
                title,

                passing_score:
                  passingScore,

                max_attempts:
                  maxAttempts,
              }
            )
          }
        >
          {saving
            ? 'Saving...'
            : 'Update Quiz'}
        </button>


        <button
          type="button"
          className="auth-button manage-danger-button"
          disabled={saving}
          onClick={() =>
            onDeleteQuiz(quiz.id)
          }
        >
          Delete Quiz
        </button>

      </div>


      {/* =====================================================
          QUESTIONS
      ===================================================== */}

      <div className="quiz-question-list">

        <div className="quiz-question-list-header">

          <p className="eyebrow">
            QUESTIONS
          </p>

        </div>


        {questions.length === 0 ? (

          <p className="manage-muted">
            No questions have been added.
          </p>

        ) : (

          questions.map(
            (question, index) => (

              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                saving={saving}

                onUpdate={
                  onUpdateQuestion
                }

                onDelete={
                  onDeleteQuestion
                }

                onAddAnswer={
                  onAddAnswer
                }

                onUpdateAnswer={
                  onUpdateAnswer
                }

                onDeleteAnswer={
                  onDeleteAnswer
                }

              />

            )
          )

        )}


        {/* =====================================================
            ADD QUESTION
        ===================================================== */}

        <AddQuestionForm
          quizId={quiz.id}
          questions={questions}
          saving={saving}
          onAdd={onAddQuestion}
        />

      </div>

    </div>
  )
}


// ===========================================================
// ADD QUESTION FORM
// ===========================================================

function AddQuestionForm({
  quizId,
  questions,
  saving,
  onAdd,
}) {
  const [questionText, setQuestionText] =
    useState('')

  const [displayOrder, setDisplayOrder] =
    useState(
      questions.length + 1
    )

  const handleSubmit = () => {
    if (!questionText.trim()) {
      return
    }

    onAdd(
      quizId,
      {
        question_text:
          questionText,
        display_order:
          displayOrder,
      }
    )

    setQuestionText('')

    setDisplayOrder(
      questions.length + 2
    )
  }

  return (
    <div className="question-editor">

      <div className="question-editor-heading">

        <div>

          <span className="eyebrow">
            ADD QUESTION
          </span>

        </div>

      </div>


      <div className="manage-field">

        <label>
          Question
        </label>

        <textarea
          value={questionText}
          onChange={(event) =>
            setQuestionText(
              event.target.value
            )
          }
          rows="3"
          placeholder="Enter question"
        />

      </div>


      <div className="manage-form-grid">

        <div className="manage-field">

          <label>
            Display Order
          </label>

          <input
            type="number"
            min="1"
            value={displayOrder}
            onChange={(event) =>
              setDisplayOrder(
                event.target.value
              )
            }
          />

        </div>

      </div>


      <button
        type="button"
        className="auth-button"
        disabled={
          saving ||
          !questionText.trim()
        }
        onClick={handleSubmit}
      >
        {saving
          ? 'Adding Question...'
          : 'Add Question'}
      </button>

    </div>
  )
}


// ===========================================================
// QUESTION EDITOR
// ===========================================================

function QuestionEditor({
  question,
  index,
  saving,
  onUpdate,
  onDelete,
  onAddAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
}) {
  const [questionText, setQuestionText] =
    useState(
      question.question_text || ''
    )

  const [displayOrder, setDisplayOrder] =
    useState(
      question.display_order ||
        index + 1
    )

  return (
    <div className="question-editor">

      <div className="question-editor-heading">

        <div>

          <span className="eyebrow">
            QUESTION {index + 1}
          </span>

        </div>

      </div>


      <div className="manage-field">

        <label>
          Question
        </label>

        <textarea
          value={questionText}
          onChange={(event) =>
            setQuestionText(
              event.target.value
            )
          }
          rows="3"
        />

      </div>


      <div className="manage-form-grid">

        <div className="manage-field">

          <label>
            Display Order
          </label>

          <input
            type="number"
            min="1"
            value={displayOrder}
            onChange={(event) =>
              setDisplayOrder(
                event.target.value
              )
            }
          />

        </div>

      </div>


      <div className="manage-actions">

        <button
          type="button"
          className="auth-button"
          disabled={saving}
          onClick={() =>
            onUpdate(
              question.id,
              {
                question_text:
                  questionText,

                display_order:
                  displayOrder,
              }
            )
          }
        >
          Update Question
        </button>


        <button
          type="button"
          className="auth-button manage-danger-button"
          disabled={saving}
          onClick={() =>
            onDelete(question.id)
          }
        >
          Delete Question
        </button>

      </div>


      {/* =====================================================
          ANSWERS
      ===================================================== */}

      <div className="answer-list">

        <p className="eyebrow">
          ANSWERS
        </p>


        {question.answers?.length === 0 ? (

          <p className="manage-muted">
            No answers.
          </p>

        ) : (

          question.answers?.map(
            (answer) => (

              <AnswerEditor
                key={answer.id}
                answer={answer}
                saving={saving}

                onUpdate={
                  onUpdateAnswer
                }

                onDelete={
                  onDeleteAnswer
                }

              />

            )
          )

        )}


        {/* =====================================================
            ADD ANSWER
        ===================================================== */}

        <AddAnswerForm
          questionId={question.id}
          answers={
            question.answers || []
          }
          saving={saving}
          onAdd={onAddAnswer}
        />

      </div>

    </div>
  )
}


// ===========================================================
// ADD ANSWER FORM
// ===========================================================

function AddAnswerForm({
  questionId,
  answers,
  saving,
  onAdd,
}) {
  const [text, setText] =
    useState('')

  const [isCorrect, setIsCorrect] =
    useState(false)

  const [displayOrder, setDisplayOrder] =
    useState(
      answers.length + 1
    )

  const handleSubmit = () => {
    if (!text.trim()) {
      return
    }

    onAdd(
      questionId,
      {
        answer_text: text,
        is_correct: isCorrect,
        display_order:
          displayOrder,
      }
    )

    setText('')
    setIsCorrect(false)

    setDisplayOrder(
      answers.length + 2
    )
  }

  return (
    <div className="answer-editor">

      <p className="eyebrow">
        ADD ANSWER
      </p>


      <div className="manage-field">

        <label>
          Answer
        </label>

        <input
          type="text"
          value={text}
          onChange={(event) =>
            setText(
              event.target.value
            )
          }
          placeholder="Enter answer"
        />

      </div>


      <div className="answer-editor-bottom">

        <label className="answer-correct">

          <input
            type="checkbox"
            checked={isCorrect}
            onChange={(event) =>
              setIsCorrect(
                event.target.checked
              )
            }
          />

          Correct answer

        </label>


        <input
          className="answer-order"
          type="number"
          min="1"
          value={displayOrder}
          onChange={(event) =>
            setDisplayOrder(
              event.target.value
            )
          }
        />


        <button
          type="button"
          className="auth-button"
          disabled={
            saving ||
            !text.trim()
          }
          onClick={handleSubmit}
        >
          {saving
            ? 'Adding...'
            : 'Add Answer'}
        </button>

      </div>

    </div>
  )
}


// ===========================================================
// ANSWER EDITOR
// ===========================================================

function AnswerEditor({
  answer,
  saving,
  onUpdate,
  onDelete,
}) {
  const [text, setText] =
    useState(
      answer.answer_text || ''
    )

  const [isCorrect, setIsCorrect] =
    useState(
      Boolean(answer.is_correct)
    )

  const [displayOrder, setDisplayOrder] =
    useState(
      answer.display_order || 1
    )

  return (
    <div className="answer-editor">

      <div className="manage-field">

        <label>
          Answer
        </label>

        <input
          type="text"
          value={text}
          onChange={(event) =>
            setText(
              event.target.value
            )
          }
        />

      </div>


      <div className="answer-editor-bottom">

        <label className="answer-correct">

          <input
            type="checkbox"
            checked={isCorrect}
            onChange={(event) =>
              setIsCorrect(
                event.target.checked
              )
            }
          />

          Correct answer

        </label>


        <input
          className="answer-order"
          type="number"
          min="1"
          value={displayOrder}
          onChange={(event) =>
            setDisplayOrder(
              event.target.value
            )
          }
        />


        <button
          type="button"
          className="auth-button"
          disabled={saving}
          onClick={() =>
            onUpdate(
              answer.id,
              {
                answer_text: text,

                is_correct:
                  isCorrect,

                display_order:
                  displayOrder,
              }
            )
          }
        >
          {saving
            ? 'Saving...'
            : 'Update Answer'}
        </button>


        <button
          type="button"
          className="auth-button manage-danger-button"
          disabled={saving}
          onClick={() =>
            onDelete(answer.id)
          }
        >
          Delete Answer
        </button>

      </div>

    </div>
  )
}


// ===========================================================
// LEARNER CARD
// ===========================================================

function LearnerCard({
  learner,
}) {
  const [expanded, setExpanded] =
    useState(false)

  return (
    <article className="learner-card">

      <div className="learner-card-header">

        <div>

          <p className="eyebrow">
            LEARNER
          </p>

          <h3>
            {learner.learner_name}
          </h3>

          <p className="learner-email">
            {learner.learner_email}
          </p>

        </div>


        <div className="learner-progress-summary">

          <strong>
            {learner.progress_percentage}%
          </strong>

          <span>

            {learner.completed_modules}/
            {learner.total_modules}{' '}

            modules

          </span>

        </div>

      </div>


      <div className="progress-bar">

        <div
          className="progress-bar__fill"
          style={{
            width: `${Math.min(
              learner.progress_percentage,
              100
            )}%`,
          }}
        />

      </div>


      <button
        type="button"
        className="learner-details-button"
        onClick={() =>
          setExpanded(!expanded)
        }
      >
        {expanded
          ? 'Hide Progress'
          : 'View Progress'}
      </button>


      {expanded && (

        <div className="learner-module-progress">

          {learner.modules.length === 0 ? (

            <p className="manage-muted">
              No modules available.
            </p>

          ) : (

            learner.modules.map(
              (module) => (

                <div
                  key={module.module_id}
                  className="learner-module-row"
                >

                  <div>

                    <span className="eyebrow">

                      MODULE{' '}

                      {module.display_order}

                    </span>

                    <h4>
                      {module.module_title}
                    </h4>

                  </div>


                  <div className="learner-module-status">

                    <span
                      className={
                        module.status ===
                        'completed'
                          ? 'status-completed'
                          : 'status-pending'
                      }
                    >
                      {module.status}
                    </span>


                    {module.quiz && (

                      <small>

                        {module.quiz.attempts
                          ?.length || 0}{' '}

                        quiz attempt

                        {module.quiz
                          ?.attempts
                          ?.length === 1
                          ? ''
                          : 's'}

                      </small>

                    )}

                  </div>

                </div>

              )
            )

          )}

        </div>

      )}

    </article>
  )
}


export default ManageCourse