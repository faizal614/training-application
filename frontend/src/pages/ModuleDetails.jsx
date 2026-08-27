import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'

function ModuleDetails() {
  const { moduleId } = useParams()
  const navigate = useNavigate()

  const {
    token,
    isAuthenticated,
    handleSessionExpired,
  } = useAuth()

  // -------------------------
  // MODULE STATE
  // -------------------------

  const [module, setModule] = useState(null)
  const [content, setContent] = useState([])

  // -------------------------
  // LOADING / ERROR
  // -------------------------

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // -------------------------
  // LOAD MODULE + CONTENT
  // -------------------------

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setLoading(true)
        setError('')

        // -------------------------
        // CHECK LOGIN
        // -------------------------

        if (!isAuthenticated || !token) {
          setError(
            'Please sign in to access this module.'
          )

          setLoading(false)
          return
        }

        // -------------------------
        // GET MODULE
        // -------------------------

        const moduleResponse = await apiFetch(
          `/modules/${moduleId}`,
          {},
          handleSessionExpired
        )

        const moduleData =
          await moduleResponse.json()

        if (!moduleResponse.ok) {
          throw new Error(
            moduleData.detail ||
              'Failed to load module'
          )
        }

        setModule(moduleData)

        // -------------------------
        // GET MODULE CONTENT
        // -------------------------

        const contentResponse = await apiFetch(
          `/modules/${moduleId}/content`,
          {},
          handleSessionExpired
        )

        const contentData =
          await contentResponse.json()

        if (!contentResponse.ok) {
          throw new Error(
            contentData.detail ||
              'Failed to load module content'
          )
        }

        setContent(contentData)
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

    fetchModuleData()
  }, [
    moduleId,
    token,
    isAuthenticated,
    handleSessionExpired,
  ])

  // -------------------------
  // ATTEMPT QUIZ
  // -------------------------

  const handleAttemptQuiz = () => {
    navigate(`/modules/${moduleId}/quiz`)
  }

  // -------------------------
  // LOADING
  // -------------------------

  if (loading) {
    return (
      <main className="main-content">
        <p>Loading module...</p>
      </main>
    )
  }

  // -------------------------
  // ERROR
  // -------------------------

  if (error || !module) {
    return (
      <main className="main-content">
        <p className="auth-error">
          {error || 'Module not found'}
        </p>

        <p>
          <Link to="/courses">
            ← Back to courses
          </Link>
        </p>
      </main>
    )
  }

  // -------------------------
  // PAGE
  // -------------------------

  return (
    <main className="main-content">

      {/* -------------------------
          MODULE HEADER
      ------------------------- */}

      <section className="page-intro">

        <p className="eyebrow">
          MODULE {module.display_order}
        </p>

        <h1>
          {module.title}
        </h1>

      </section>

      {/* -------------------------
          TRAINING CONTENT
      ------------------------- */}

      <section className="module-content">

        {content.length === 0 ? (
          <p>
            No training content is
            available for this module yet.
          </p>
        ) : (
          content.map((item) => (
            <article
              key={item.id}
              className="training-content"
            >

              {item.subtitle && (
                <h3>
                  {item.subtitle}
                </h3>
              )}

              {item.content_type === 'video' &&
                item.video_url && (
                  <div className="video-container">
                    <iframe
                      src={item.video_url}
                      title={
                        item.subtitle ||
                        'Training video'
                      }
                      allowFullScreen
                    />
                  </div>
                )}

              {item.body && (
                <div className="training-body">
                  {item.body}
                </div>
              )}

            </article>
          ))
        )}

      </section>

      {/* -------------------------
          QUIZ BUTTON
      ------------------------- */}

      <section className="quiz-section">

        <p className="eyebrow">
          NEXT STEP
        </p>

        <h2>
          Ready for the assessment?
        </h2>

        <p>
          Finish reviewing this module,
          then attempt the quiz.
        </p>

        <button
          type="button"
          className="auth-button"
          onClick={handleAttemptQuiz}
        >
          Attempt Quiz
        </button>

      </section>

      {/* -------------------------
          BACK
      ------------------------- */}

      <p>
        <Link to={`/courses/${module.course_id}`}>
          ← Back to course
        </Link>
      </p>

    </main>
  )
}

export default ModuleDetails