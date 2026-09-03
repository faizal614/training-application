import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'

function CourseDetails() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const {
    token,
    isAuthenticated,
    handleSessionExpired,
  } = useAuth()

  // -------------------------
  // COURSE
  // -------------------------

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])

  // -------------------------
  // COURSE DISPLAY NUMBER
  // -------------------------
  //
  // This is the visible course number.
  //
  // It matches the numbering used
  // on the Courses page.
  //
  // Database ID is NOT used here.
  //
  // Example:
  //
  // Database IDs:
  // 17, 22, 31
  //
  // Display:
  // COURSE 1
  // COURSE 2
  // COURSE 3
  //
  // -------------------------

  const [courseDisplayNumber, setCourseDisplayNumber] =
    useState(null)

  // -------------------------
  // ENROLLMENT
  // -------------------------

  const [enrolled, setEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)

  // -------------------------
  // PROGRESS
  // -------------------------

  const [progress, setProgress] = useState(null)

  // -------------------------
  // CERTIFICATE
  // -------------------------

  const [certificate, setCertificate] = useState(null)

  // -------------------------
  // GENERAL
  // -------------------------

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================================
  // LOAD COURSE
  // =========================================================

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true)
        setError('')

        // ---------------------------------------------------
        // COURSE
        // ---------------------------------------------------

        const courseResponse = await apiFetch(
          `/courses/${courseId}`,
          {},
          handleSessionExpired
        )

        const courseData = await courseResponse.json()

        if (!courseResponse.ok) {
          throw new Error(
            courseData.detail || 'Failed to load course'
          )
        }

        setCourse(courseData)

        // ---------------------------------------------------
        // MODULES
        // ---------------------------------------------------

        const modulesResponse = await apiFetch(
          `/courses/${courseId}/modules`,
          {},
          handleSessionExpired
        )

        const modulesData = await modulesResponse.json()

        if (!modulesResponse.ok) {
          throw new Error(
            modulesData.detail || 'Failed to load modules'
          )
        }

        setModules(modulesData)

        // ---------------------------------------------------
        // GET COURSE DISPLAY NUMBER
        // ---------------------------------------------------
        //
        // Use the exact same course ordering as
        // pages/Courses.jsx.
        //
        // Courses.jsx numbers courses based on
        // their position in /courses/enrolled/me.
        //
        // We do the same here.
        // ---------------------------------------------------

        const coursesResponse = await apiFetch(
          '/courses/enrolled/me',
          {},
          handleSessionExpired
        )

        const coursesData =
          await coursesResponse.json()

        if (!coursesResponse.ok) {
          throw new Error(
            coursesData.detail ||
              'Failed to load courses'
          )
        }

        if (Array.isArray(coursesData)) {
          const currentCourseIndex =
            coursesData.findIndex(
              (item) =>
                Number(item.course_id) ===
                Number(courseId)
            )

          if (currentCourseIndex !== -1) {
            setCourseDisplayNumber(
              currentCourseIndex + 1
            )
          }
        }

        // ---------------------------------------------------
        // NOT LOGGED IN
        // ---------------------------------------------------

        if (!isAuthenticated || !token) {
          setEnrolled(false)
          setProgress(null)
          setCertificate(null)
          return
        }

        // ---------------------------------------------------
        // CHECK ENROLLMENT
        // ---------------------------------------------------

        const enrolledResponse = await apiFetch(
          '/courses/enrolled/me',
          {},
          handleSessionExpired
        )

        const enrolledData =
          await enrolledResponse.json()

        if (!enrolledResponse.ok) {
          throw new Error(
            enrolledData.detail ||
              'Failed to check enrollment'
          )
        }

        const isEnrolled =
          enrolledData.some(
            (item) =>
              item.course_id === Number(courseId)
          )

        setEnrolled(isEnrolled)

        // ---------------------------------------------------
        // GET PROGRESS
        // ---------------------------------------------------

        if (isEnrolled) {
          const progressResponse = await apiFetch(
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

          setProgress(progressData)
        }

        // ---------------------------------------------------
        // GET CERTIFICATE
        // ---------------------------------------------------

        const certificateResponse = await apiFetch(
          '/courses/certificates/me',
          {},
          handleSessionExpired
        )

        const certificatesData =
          await certificateResponse.json()

        if (!certificateResponse.ok) {
          throw new Error(
            certificatesData.detail ||
              'Failed to load certificates'
          )
        }

        const existingCertificate =
          certificatesData.find(
            (item) =>
              item.course_id === Number(courseId)
          )

        if (existingCertificate) {
          setCertificate(existingCertificate)
          setEnrolled(true)
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

    fetchCourseData()
  }, [
    courseId,
    token,
    isAuthenticated,
    handleSessionExpired,
  ])

  // =========================================================
  // ENROLL
  // =========================================================

  const handleEnroll = async () => {
    if (!isAuthenticated || !token) {
      setError(
        'Please sign in to enroll in a course.'
      )
      return
    }

    try {
      setEnrolling(true)
      setError('')

      const response = await apiFetch(
        `/courses/${courseId}/enroll`,
        {
          method: 'POST',
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to enroll in course'
        )
      }

      setEnrolled(true)

      // Reload progress after enrollment.
      const progressResponse = await apiFetch(
        `/courses/${courseId}/progress`,
        {},
        handleSessionExpired
      )

      const progressData =
        await progressResponse.json()

      if (progressResponse.ok) {
        setProgress(progressData)
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
      setEnrolling(false)
    }
  }

  // =========================================================
  // CHECK WHETHER MODULE IS UNLOCKED
  // =========================================================

  const isModuleUnlocked = (moduleIndex) => {
    // Not enrolled = everything locked.
    if (!enrolled) {
      return false
    }

    // First module is always unlocked after enrollment.
    if (moduleIndex === 0) {
      return true
    }

    // If we don't have progress yet, keep it locked.
    if (!progress || !progress.modules) {
      return false
    }

    const previousModule =
      progress.modules[moduleIndex - 1]

    return (
      previousModule &&
      previousModule.status === 'completed'
    )
  }

  // =========================================================
  // CHECK WHETHER MODULE IS COMPLETED
  // =========================================================

  const isModuleCompleted = (moduleId) => {
    if (!progress || !progress.modules) {
      return false
    }

    const moduleProgress =
      progress.modules.find(
        (item) =>
          item.module_id === moduleId
      )

    return (
      moduleProgress &&
      moduleProgress.status === 'completed'
    )
  }

  // =========================================================
  // OPEN MODULE
  // =========================================================

  const handleModuleClick = (
    module,
    moduleIndex
  ) => {
    if (!isModuleUnlocked(moduleIndex)) {
      return
    }

    navigate(
      `/courses/${courseId}/modules/${module.id}`
    )
  }

  // =========================================================
  // COURSE COMPLETED
  // =========================================================

  const courseCompleted =
    Boolean(certificate)

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>Loading course...</p>
      </main>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !course) {
    return (
      <main className="main-content">
        <p className="auth-error">
          {error}
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
  // MAIN PAGE
  // =========================================================

  return (
    <main className="main-content">

      {/* =====================================================
          COURSE INTRO
      ===================================================== */}

      <section className="page-intro">

        <p className="eyebrow">
          COURSE{' '}
          {courseDisplayNumber !== null
            ? courseDisplayNumber
            : ''}
        </p>

        <h1>
          {course.title}
        </h1>

        <p className="page-description">
          {course.description}
        </p>

        {/* ---------------------------------------------------
            NOT ENROLLED
        --------------------------------------------------- */}

        {!enrolled &&
          !courseCompleted && (
            <button
              type="button"
              className="auth-button"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling
                ? 'Enrolling...'
                : 'Enroll in Course'}
            </button>
          )}

        {/* ---------------------------------------------------
            ENROLLED
        --------------------------------------------------- */}

        {enrolled &&
          !courseCompleted && (
            <p>
              <strong>
                You are enrolled in this course.
              </strong>
            </p>
          )}

        {/* ---------------------------------------------------
            COMPLETED
        --------------------------------------------------- */}

        {courseCompleted && (
          <section className="quiz-result quiz-result--passed">

            <p className="eyebrow">
              COURSE COMPLETED
            </p>

            <h2>
              You have completed this course
            </h2>

            <p>
              Congratulations! Your certificate
              is ready.
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

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

      </section>

      {/* =====================================================
          PROGRESS
      ===================================================== */}

      {enrolled && progress && (
        <section className="course-learning">

          <p className="eyebrow">
            YOUR PROGRESS
          </p>

          <h2>
            {Math.round(
              progress.progress_percentage
            )}%
          </h2>

          <p>
            {progress.completed_modules} of{' '}
            {progress.total_modules}{' '}
            modules completed.
          </p>

        </section>
      )}

      {/* =====================================================
          MODULE LIST
      ===================================================== */}

      <section className="course-learning">

        <p className="eyebrow">
          COURSE CONTENT
        </p>

        <h2>
          Modules
        </h2>

        {modules.length === 0 ? (
          <p>
            No modules are available for
            this course yet.
          </p>
        ) : (
          <div className="module-list">

            {modules.map(
              (module, index) => {

                const unlocked =
                  isModuleUnlocked(index)

                const completed =
                  isModuleCompleted(
                    module.id
                  )

                return (
                  <button
                    key={module.id}
                    type="button"
                    className={
                      `module-item ${
                        !unlocked
                          ? 'module-item--locked'
                          : ''
                      }`
                    }
                    onClick={() =>
                      handleModuleClick(
                        module,
                        index
                      )
                    }
                    disabled={!unlocked}
                  >

                    <span>
                      {module.display_order}.
                    </span>

                    <span>
                      {module.title}
                    </span>

                    <span>
                      {completed
                        ? '✓ COMPLETED'
                        : unlocked
                        ? '🔓'
                        : '🔒'}
                    </span>

                  </button>
                )
              }
            )}

          </div>
        )}

      </section>

      {/* =====================================================
          CERTIFICATE
      ===================================================== */}

      {courseCompleted &&
        certificate && (
          <section className="quiz-result quiz-result--passed">

            <p className="eyebrow">
              YOUR CERTIFICATE
            </p>

            <h2>
              Certificate Available
            </h2>

            <p>
              Certificate Number:{' '}
              <strong>
                {
                  certificate.certificate_number
                }
              </strong>
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
              View / Download Certificate
            </button>

          </section>
        )}

      {/* =====================================================
          BACK
      ===================================================== */}

      <p>
        <Link to="/courses">
          ← Back to courses
        </Link>
      </p>

    </main>
  )
}

export default CourseDetails