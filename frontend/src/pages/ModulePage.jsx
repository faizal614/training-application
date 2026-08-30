import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'

function ModulePage() {
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
  // MODULE
  // =========================================================

  const [module, setModule] = useState(null)
  const [modules, setModules] = useState([])
  const [content, setContent] = useState([])

  // =========================================================
  // PROGRESS
  // =========================================================

  const [moduleCompleted, setModuleCompleted] =
    useState(false)

  const [courseCompleted, setCourseCompleted] =
    useState(false)

  const [nextModule, setNextModule] =
    useState(null)

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // =========================================================
  // LOAD MODULE
  // =========================================================

  useEffect(() => {
    const loadModule = async () => {
      try {
        setLoading(true)
        setError('')

        // ---------------------------------------------------
        // CHECK LOGIN
        // ---------------------------------------------------

        if (!isAuthenticated || !token) {
          setError(
            'Please sign in to access this module.'
          )

          setLoading(false)
          return
        }

        // ===================================================
        // GET COURSE MODULES
        // ===================================================

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

        const currentModuleIndex =
          modulesData.findIndex(
            (item) =>
              item.id === Number(moduleId)
          )

        if (currentModuleIndex === -1) {
          throw new Error(
            'Module not found'
          )
        }

        const foundModule =
          modulesData[currentModuleIndex]

        setModule(foundModule)

        // ---------------------------------------------------
        // FIND NEXT MODULE
        // ---------------------------------------------------

        const followingModule =
          modulesData[
            currentModuleIndex + 1
          ] || null

        setNextModule(followingModule)

        // ===================================================
        // GET MODULE CONTENT
        // ===================================================

        const contentResponse =
          await apiFetch(
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

        // ===================================================
        // GET COURSE PROGRESS
        // ===================================================

        const progressResponse =
          await apiFetch(
            `/courses/${courseId}/progress`,
            {},
            handleSessionExpired
          )

        const progressData =
          await progressResponse.json()

        if (!progressResponse.ok) {
          throw new Error(
            progressData.detail ||
              'Failed to load course progress'
          )
        }

        // ---------------------------------------------------
        // CHECK CURRENT MODULE
        // ---------------------------------------------------

        const currentModuleProgress =
          Array.isArray(progressData.modules)
            ? progressData.modules.find(
                (item) =>
                  item.module_id ===
                  Number(moduleId)
              )
            : null

        const currentModuleCompleted =
          currentModuleProgress?.status ===
          'completed'

        setModuleCompleted(
          currentModuleCompleted
        )

        // ===================================================
        // CHECK COURSE CERTIFICATE
        // ===================================================

        try {
          const certificateResponse =
            await apiFetch(
              '/courses/certificates/me',
              {},
              handleSessionExpired
            )

          // -------------------------------------------------
          // NO CERTIFICATE
          // -------------------------------------------------

          if (
            certificateResponse.status === 404
          ) {
            setCourseCompleted(false)
          } else {
            const certificates =
              await certificateResponse.json()

            if (!certificateResponse.ok) {
              setCourseCompleted(false)
            } else {
              const existingCertificate =
                Array.isArray(certificates)
                  ? certificates.find(
                      (certificate) =>
                        certificate.course_id ===
                        Number(courseId)
                    )
                  : null

              setCourseCompleted(
                Boolean(existingCertificate)
              )
            }
          }
        } catch (certificateError) {
          if (
            certificateError.message ===
            'Session expired. Please sign in again.'
          ) {
            return
          }

          setCourseCompleted(false)
        }

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

    loadModule()
  }, [
    courseId,
    moduleId,
    token,
    isAuthenticated,
    handleSessionExpired,
  ])

  // =========================================================
  // NEXT MODULE
  // =========================================================

  const handleNextModule = () => {
    if (!nextModule) {
      return
    }

    navigate(
      `/courses/${courseId}/modules/${nextModule.id}`
    )
  }

  // =========================================================
  // VIEW CERTIFICATE
  // =========================================================

  const handleViewCertificate = () => {
    navigate(
      `/courses/${courseId}/certificate`
    )
  }

  // =========================================================
  // ATTEMPT QUIZ
  // =========================================================

  const handleAttemptQuiz = () => {
    navigate(
      `/courses/${courseId}/modules/${moduleId}/quiz`
    )
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>
          Loading module...
        </p>
      </main>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <main className="main-content">

        <p className="auth-error">
          {error}
        </p>

        <p>
          <Link
            to={`/courses/${courseId}`}
          >
            ← Back to course
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

      <section className="page-intro">

        <p className="eyebrow">
          MODULE {module.display_order}
        </p>

        <h1>
          {module.title}
        </h1>

      </section>

      {/* =====================================================
          MODULE CONTENT
      ===================================================== */}

      <section className="module-content">

        {content.length === 0 ? (
          <p>
            No training content is available
            for this module yet.
          </p>
        ) : (
          content.map((item) => (
            <article
              key={item.id}
              className="training-content"
            >

              {item.subtitle && (
                <h2>
                  {item.subtitle}
                </h2>
              )}

              {item.content_type ===
                'video' &&
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

      {/* =====================================================
          COMPLETED MODULE
      ===================================================== */}

      {moduleCompleted && (
        <section className="quiz-result quiz-result--passed">

          <p className="eyebrow">
            MODULE COMPLETED
          </p>

          <h2>
            You have completed this module
          </h2>

          {/* -------------------------------------------------
              HAS NEXT MODULE
          ------------------------------------------------- */}

          {nextModule && (
            <>
              <p>
                Congratulations! You have
                successfully completed this
                module.
              </p>

              <p>
                Continue to the next module:
                {' '}
                <strong>
                  {nextModule.title}
                </strong>
              </p>

              <button
                type="button"
                className="auth-button"
                onClick={
                  handleNextModule
                }
              >
                Next Module →
              </button>
            </>
          )}

          {/* -------------------------------------------------
              LAST MODULE
          ------------------------------------------------- */}

          {!nextModule && (
            <>
              <p>
                Congratulations! You have
                completed the final module of
                this course.
              </p>

              <p>
                You have completed all modules.
                Your certificate is ready.
              </p>

              <button
                type="button"
                className="auth-button"
                onClick={
                  handleViewCertificate
                }
              >
                View Certificate
              </button>
            </>
          )}

        </section>
      )}

      {/* =====================================================
          MODULE NOT COMPLETED
      ===================================================== */}

      {!moduleCompleted && (
        <section className="quiz-result">

          <h2>
            Module Complete?
          </h2>

          <p>
            When you are finished studying
            this module, continue to the quiz.
          </p>

          <button
            type="button"
            className="auth-button"
            onClick={
              handleAttemptQuiz
            }
          >
            Attempt Quiz
          </button>

        </section>
      )}

      {/* =====================================================
          BACK
      ===================================================== */}

      <p>
        <Link
          to={`/courses/${courseId}`}
        >
          ← Back to course
        </Link>
      </p>

    </main>
  )
}

export default ModulePage