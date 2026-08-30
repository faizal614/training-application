import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function AssignInstructorCourses() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const [instructors, setInstructors] = useState([])
  const [courses, setCourses] = useState([])

  const [selectedInstructor, setSelectedInstructor] =
    useState('')

  const [selectedCourse, setSelectedCourse] =
    useState('')

  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // =========================================================
  // LOAD INSTRUCTORS AND COURSES
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !token) {
        setError(
          'Please sign in as an admin to assign courses.'
        )
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        setSuccess('')

        // -------------------------
        // GET INSTRUCTORS
        // -------------------------

        const instructorsResponse =
          await apiFetch(
            '/admin/instructors',
            {},
            handleSessionExpired
          )

        const instructorsData =
          await instructorsResponse.json()

        if (!instructorsResponse.ok) {
          throw new Error(
            instructorsData.detail ||
              'Failed to load instructors'
          )
        }

        setInstructors(instructorsData)

        // -------------------------
        // GET COURSES
        // -------------------------

        const coursesResponse =
          await apiFetch(
            '/courses',
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

        setCourses(coursesData)
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
    handleSessionExpired,
  ])

  // =========================================================
  // ASSIGN COURSE
  // =========================================================

  const handleAssignCourse = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!selectedInstructor) {
      setError('Please select an instructor.')
      return
    }

    if (!selectedCourse) {
      setError('Please select a course.')
      return
    }

    try {
      setAssigning(true)

      const response = await apiFetch(
        `/admin/courses/${selectedCourse}/instructors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instructor_id:
              Number(selectedInstructor),
          }),
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to assign course'
        )
      }

      setSuccess(
        'Course assigned to instructor successfully.'
      )

      setSelectedInstructor('')
      setSelectedCourse('')
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setAssigning(false)
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
            ADMINISTRATION / INSTRUCTORS
          </p>

          <h1>
            Assign Courses
          </h1>

          <p className="page-description">
            Loading instructors and courses...
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
          PAGE INTRO
      ===================================================== */}

      <section className="page-intro">

        <p className="eyebrow">
          ADMINISTRATION / INSTRUCTORS / ASSIGN COURSES
        </p>

        <h1>
          Assign Courses
        </h1>

        <p className="page-description">
          Assign training courses to instructors
          responsible for delivering them.
        </p>

      </section>

      {/* =====================================================
          STATUS MESSAGES
      ===================================================== */}

      {error && (
        <div
          style={{
            border: '1px solid #c00',
            background: '#fff',
            padding: '16px 18px',
            marginBottom: '28px',
            fontSize: '15px',
          }}
        >
          <strong style={{ color: '#b00000' }}>
            Error
          </strong>

          <p
            style={{
              margin: '6px 0 0',
              color: '#333',
            }}
          >
            {error}
          </p>
        </div>
      )}

      {success && (
        <div
          style={{
            border: '1px solid #222',
            background: '#f7f7f7',
            padding: '16px 18px',
            marginBottom: '28px',
            fontSize: '15px',
          }}
        >
          <strong>
            Assignment successful
          </strong>

          <p
            style={{
              margin: '6px 0 0',
              color: '#444',
            }}
          >
            {success}
          </p>
        </div>
      )}

      {/* =====================================================
          MAIN ASSIGNMENT AREA
      ===================================================== */}

      <section
        style={{
          border: '1px solid #222',
          padding: '34px',
          marginBottom: '40px',
          background: '#fff',
        }}
      >

        {/* HEADER */}

        <div
          style={{
            marginBottom: '30px',
            paddingBottom: '22px',
            borderBottom: '1px solid #ddd',
          }}
        >
          <p className="eyebrow">
            COURSE ASSIGNMENT
          </p>

          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '32px',
              fontWeight: '400',
              margin: '8px 0 8px',
            }}
          >
            Assign a Course
          </h2>

          <p
            style={{
              margin: 0,
              color: '#666',
              fontSize: '15px',
              lineHeight: '1.6',
            }}
          >
            Select an instructor and the course
            they will be responsible for.
          </p>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleAssignCourse}
          style={{
            maxWidth: '720px',
          }}
        >

          {/* -------------------------------------------------
              INSTRUCTOR
          ------------------------------------------------- */}

          <div
            style={{
              marginBottom: '26px',
            }}
          >
            <label
              htmlFor="instructor"
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Instructor
            </label>

            <select
              id="instructor"
              value={selectedInstructor}
              onChange={(event) =>
                setSelectedInstructor(
                  event.target.value
                )
              }
              style={{
                width: '100%',
                padding: '13px 14px',
                border: '1px solid #222',
                background: '#fff',
                fontSize: '15px',
                boxSizing: 'border-box',
              }}
            >
              <option value="">
                Select an instructor
              </option>

              {instructors.map(
                (instructor) => (
                  <option
                    key={instructor.id}
                    value={instructor.id}
                  >
                    {instructor.name} —{' '}
                    {instructor.email}
                  </option>
                )
              )}
            </select>

            <p
              style={{
                fontSize: '13px',
                color: '#777',
                margin: '7px 0 0',
              }}
            >
              Choose the instructor who will
              manage this course.
            </p>
          </div>

          {/* -------------------------------------------------
              COURSE
          ------------------------------------------------- */}

          <div
            style={{
              marginBottom: '30px',
            }}
          >
            <label
              htmlFor="course"
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Course
            </label>

            <select
              id="course"
              value={selectedCourse}
              onChange={(event) =>
                setSelectedCourse(
                  event.target.value
                )
              }
              style={{
                width: '100%',
                padding: '13px 14px',
                border: '1px solid #222',
                background: '#fff',
                fontSize: '15px',
                boxSizing: 'border-box',
              }}
            >
              <option value="">
                Select a course
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

            <p
              style={{
                fontSize: '13px',
                color: '#777',
                margin: '7px 0 0',
              }}
            >
              Choose the training course to assign.
            </p>
          </div>

          {/* -------------------------------------------------
              SUBMIT
          ------------------------------------------------- */}

          <button
            type="submit"
            className="auth-button"
            disabled={
              assigning ||
              instructors.length === 0 ||
              courses.length === 0
            }
            style={{
              minWidth: '170px',
            }}
          >
            {assigning
              ? 'Assigning...'
              : 'Assign Course'}
          </button>

        </form>
      </section>

      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      <section
        style={{
          marginBottom: '40px',
        }}
      >

        <div
          style={{
            marginBottom: '20px',
          }}
        >
          <p className="eyebrow">
            AVAILABLE DATA
          </p>

          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '30px',
              fontWeight: '400',
              margin: '8px 0 0',
            }}
          >
            Assignment Overview
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >

          {/* INSTRUCTORS */}

          <article
            style={{
              border: '1px solid #222',
              padding: '25px',
              background: '#fff',
            }}
          >
            <p className="eyebrow">
              INSTRUCTORS
            </p>

            <h3
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '42px',
                fontWeight: '400',
                margin: '8px 0',
              }}
            >
              {instructors.length}
            </h3>

            <p
              style={{
                margin: 0,
                color: '#666',
                lineHeight: '1.5',
              }}
            >
              Instructor accounts available
              for course assignment.
            </p>
          </article>

          {/* COURSES */}

          <article
            style={{
              border: '1px solid #222',
              padding: '25px',
              background: '#fff',
            }}
          >
            <p className="eyebrow">
              COURSES
            </p>

            <h3
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '42px',
                fontWeight: '400',
                margin: '8px 0',
              }}
            >
              {courses.length}
            </h3>

            <p
              style={{
                margin: 0,
                color: '#666',
                lineHeight: '1.5',
              }}
            >
              Courses currently available
              for assignment.
            </p>
          </article>

        </div>
      </section>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {instructors.length === 0 && (
        <div
          style={{
            border: '1px solid #222',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <strong>
            No instructors available.
          </strong>

          <p
            style={{
              margin: '6px 0 0',
              color: '#666',
            }}
          >
            Create an instructor account before
            assigning courses.
          </p>
        </div>
      )}

      {courses.length === 0 && (
        <div
          style={{
            border: '1px solid #222',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <strong>
            No courses available.
          </strong>

          <p
            style={{
              margin: '6px 0 0',
              color: '#666',
            }}
          >
            Create a course before assigning it
            to an instructor.
          </p>
        </div>
      )}

      {/* =====================================================
          BACK
      ===================================================== */}

      <p
        style={{
          marginTop: '30px',
        }}
      >
        <Link to="/admin/instructors">
          ← Back to Instructor Management
        </Link>
      </p>

    </main>
  )
}

export default AssignInstructorCourses