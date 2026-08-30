import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function InstructorCourses() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================================
  // LOAD ASSIGNMENTS
  // =========================================================

  useEffect(() => {
    const loadAssignments = async () => {
      if (!isAuthenticated || !token) {
        setError(
          'Please sign in as an admin to view instructor courses.'
        )
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await apiFetch(
          '/admin/instructors/courses',
          {},
          handleSessionExpired
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail ||
              'Failed to load instructor courses'
          )
        }

        setAssignments(data)
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

    loadAssignments()
  }, [
    isAuthenticated,
    token,
    handleSessionExpired,
  ])

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>
          Loading instructor course assignments...
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
          INTRO
      ===================================================== */}

      <section className="page-intro">

        <p className="eyebrow">
          ADMINISTRATION / INSTRUCTORS / INSTRUCTOR COURSES
        </p>

        <h1>
          Instructor Courses
        </h1>

        <p className="page-description">
          View the courses assigned to each instructor.
        </p>

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
          ASSIGNMENTS
      ===================================================== */}

      <section className="course-placeholder">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >

          <div>
            <p className="eyebrow">
              COURSE ASSIGNMENTS
            </p>

            <h2>
              Assigned Courses
            </h2>
          </div>

          <Link
            to="/admin/instructors/assign-courses"
            className="auth-button "
          >
            Assign Course
          </Link>

        </div>

        

        {!error && assignments.length === 0 && (
          <article className="course-card">

            <p className="eyebrow">
              NO ASSIGNMENTS
            </p>

            <h3>
              No course assignments found
            </h3>

            <p>
              There are currently no courses assigned
              to instructors.
            </p>

            <Link
              to="/admin/instructors/assign-courses"
              className="auth-button"
            >
              Assign a Course
            </Link>

          </article>
        )}

        {!error && assignments.length > 0 && (
          <div className="course-list">

            {assignments.map((assignment) => (
              <article
                key={assignment.assignment_id}
                className="course-card"
              >

                <p className="eyebrow">
                  INSTRUCTOR
                </p>

                <h3>
                  {assignment.instructor_name}
                </h3>

                <p>
                  {assignment.instructor_email}
                </p>

                <hr />

                <p className="eyebrow">
                  COURSE
                </p>

                <h3>
                  {assignment.course_title}
                </h3>

                {assignment.course_description && (
                  <p>
                    {assignment.course_description}
                  </p>
                )}

                <p>
                  <strong>
                    Assigned:
                  </strong>{' '}
                  {new Date(
                    assignment.assigned_at
                  ).toLocaleDateString()}
                </p>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="course-placeholder">

        <p className="eyebrow">
          SUMMARY
        </p>

        <div className="course-list">

          <article className="course-card">

            <p className="eyebrow">
              ASSIGNMENTS
            </p>

            <h3>
              {assignments.length}
            </h3>

            <p>
              Total instructor course assignments.
            </p>

          </article>

        </div>

      </section>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      

      <p>
        <Link to="/admin/instructors">
          ← Back to Instructor Management
        </Link>
      </p>

    </main>
  )
}

export default InstructorCourses