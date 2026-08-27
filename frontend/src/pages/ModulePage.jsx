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

  const [module, setModule] = useState(null)
  const [content, setContent] = useState([])

  const [courseCompleted, setCourseCompleted] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // =========================================================
  // LOAD MODULE + CHECK COURSE COMPLETION
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

        // ---------------------------------------------------
        // GET COURSE MODULES
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

        const foundModule =
          modulesData.find(
            (item) =>
              item.id === Number(moduleId)
          )

        if (!foundModule) {
          throw new Error(
            'Module not found'
          )
        }

        setModule(foundModule)

        // ---------------------------------------------------
        // GET MODULE CONTENT
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // CHECK WHETHER COURSE IS ALREADY COMPLETED
        // ---------------------------------------------------

        try {
          const certificateResponse =
            await apiFetch(
              '/courses/certificates/me',
              {},
              handleSessionExpired
            )

          // -------------------------------------------------
          // CERTIFICATE NOT FOUND
          // -------------------------------------------------

          if (
            certificateResponse.status === 404
          ) {
            setCourseCompleted(false)
          } else {
            const certificates =
              await certificateResponse.json()

            if (!certificateResponse.ok) {
              // Do not prevent the module from loading
              // if certificate checking fails.
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
          // Certificate checking should never
          // prevent access to module content.

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
  // FINISH MODULE
  // =========================================================

  const handleFinishModule = () => {
    // -------------------------------------------------------
    // SAFETY CHECK
    // -------------------------------------------------------

    if (courseCompleted) {
      navigate(
        `/courses/${courseId}/certificate`
      )
      return
    }

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
          QUIZ SECTION
      ===================================================== */}

      {!courseCompleted && (
        <section className="quiz-result">

          <h2>
            Module Complete?
          </h2>

          <p>
            When you are finished studying this
            module, continue to the quiz.
          </p>

          <button
            type="button"
            className="auth-button"
            onClick={handleFinishModule}
          >
            Attempt Quiz
          </button>

        </section>
      )}

      {/* =====================================================
          COURSE COMPLETED MESSAGE
      ===================================================== */}

      {courseCompleted && (
        <section className="quiz-result quiz-result--passed">

          <p className="eyebrow">
            COURSE COMPLETED
          </p>

          <h2>
            Course Completed
          </h2>

          <p>
            You have already completed this
            course and earned your certificate.
          </p>

          <button
            type="button"
            className="auth-button"
            onClick={() =>
              navigate(
                `/courses/${courseId}/certificate`
              )
            }
          >
            View Certificate
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