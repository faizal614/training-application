import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

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

  // =========================================================
  // MODULE STATE
  // =========================================================

  const [module, setModule] = useState(null)
  const [content, setContent] = useState([])

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================================
  // LOAD MODULE + CONTENT
  // =========================================================

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setLoading(true)
        setError('')

        // -----------------------------------------------------
        // CHECK LOGIN
        // -----------------------------------------------------

        if (!isAuthenticated || !token) {
          setError(
            'Please sign in to access this module.'
          )

          setLoading(false)
          return
        }

        // -----------------------------------------------------
        // GET MODULE
        // -----------------------------------------------------

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

        // -----------------------------------------------------
        // GET MODULE CONTENT
        // -----------------------------------------------------

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

        setContent(
          Array.isArray(contentData)
            ? contentData
            : []
        )
      } catch (error) {
        if (
          error.message ===
          'Session expired. Please sign in again.'
        ) {
          return
        }

        setError(
          error.message ||
            'Failed to load module'
        )
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

  // =========================================================
  // ATTEMPT QUIZ
  // =========================================================

  const handleAttemptQuiz = () => {
    navigate(`/modules/${moduleId}/quiz`)
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>Loading module...</p>
      </main>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

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

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="main-content">

      {/* =====================================================
          MODULE HEADER
      ===================================================== */}

      <section
        className="page-intro"
        style={{
          marginBottom: '0',
          paddingBottom: '0',
        }}
      >

        <p className="eyebrow">
          MODULE {module.display_order}
        </p>

        <h1
          style={{
            marginBottom: '20px',
          }}
        >
          {module.title}
        </h1>

      </section>

      {/* =====================================================
          TRAINING CONTENT
      ===================================================== */}

      <section
        className="module-content"
        style={{
          maxWidth: '900px',
          marginTop: '0',
          paddingTop: '0',
        }}
      >

        {content.length === 0 ? (

          <div
            style={{
              borderTop: '1px solid #222',
              paddingTop: '35px',
            }}
          >
            <p>
              No training content is available
              for this module yet.
            </p>
          </div>

        ) : (

          content.map((item) => (

            <article
              key={item.id}
              className="training-content"
              style={{
                marginBottom: '70px',
              }}
            >

              {/* =================================================
                  CONTENT DESCRIPTION
              ================================================= */}

              {item.description && (
                <p
                  style={{
                    margin: '0 0 30px',
                    padding: 0,
                    fontSize: '18px',
                    lineHeight: '1.7',
                    color: '#666',
                  }}
                >
                  {item.description}
                </p>
              )}

              {/* =================================================
                  VIDEO CONTENT
              ================================================= */}

              {item.content_type === 'video' &&
                item.video_url && (

                  <div
                    style={{
                      marginBottom: '40px',
                    }}
                  >

                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                        border: '1px solid #222',
                      }}
                    >

                      <iframe
                        src={item.video_url}
                        title="Training video"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 0,
                        }}
                      />

                    </div>

                  </div>
                )}

              {/* =================================================
                  TEXT / VIDEO THEORY CONTENT
                  
                  IMPORTANT:
                  body can now be displayed for BOTH
                  text and video content.
              ================================================= */}

              {item.body && (

                <div
                  className="training-body"
                  style={{
                    maxWidth: '850px',
                    fontSize: '18px',
                    lineHeight: '1.8',
                    color: '#111',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: item.body,
                  }}
                />

              )}

              {/* =================================================
                  EMPTY TEXT CONTENT
              ================================================= */}

              {item.content_type === 'text' &&
                !item.body && (

                  <p
                    style={{
                      color: '#666',
                    }}
                  >
                    No training content available.
                  </p>

                )}

              {/* =================================================
                  EMPTY VIDEO CONTENT
              ================================================= */}

              {item.content_type === 'video' &&
                !item.body &&
                !item.video_url && (

                  <p
                    style={{
                      color: '#666',
                    }}
                  >
                    No training video or theory
                    content is available.
                  </p>

                )}

            </article>

          ))
        )}

      </section>

      {/* =====================================================
          QUIZ SECTION
      ===================================================== */}

      <section
        className="quiz-section"
        style={{
          marginTop: '50px',
          paddingTop: '35px',
          borderTop: '1px solid #222',
          maxWidth: '900px',
        }}
      >

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

      {/* =====================================================
          BACK TO COURSE
      ===================================================== */}

      <p
        style={{
          marginTop: '40px',
        }}
      >
        <Link
          to={`/courses/${module.course_id}`}
        >
          ← Back to course
        </Link>
      </p>

    </main>
  )
}

export default ModuleDetails