import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function InstructorDashboard() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  // =========================================================
  // DATA
  // =========================================================

  const [dashboard, setDashboard] = useState(null)

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      if (!isAuthenticated || !token) {
        setError(
          'Please sign in as an instructor to access the dashboard.'
        )

        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await apiFetch(
          '/instructor/dashboard',
          {},
          handleSessionExpired
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail ||
              'Failed to load instructor dashboard'
          )
        }

        setDashboard(data)
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

    loadDashboard()
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

        <section className="page-intro">

          <p className="eyebrow">
            INSTRUCTOR / DASHBOARD
          </p>

          <h1>
            Instructor Dashboard
          </h1>

          <p className="page-description">
            Loading your dashboard...
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
          INTRO
      ===================================================== */}

      <section className="page-intro">

        <p className="eyebrow">
          INSTRUCTOR / DASHBOARD
        </p>

        <h1>
          Instructor Dashboard
        </h1>

        <p className="page-description">
          Manage your assigned training courses
          and monitor learner activity.
        </p>

      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          style={{
            border: '1px solid #d00',
            background: '#fff5f5',
            padding: '16px',
            marginBottom: '30px',
            color: '#b00000',
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          DASHBOARD CONTENT
      ===================================================== */}

      {!error && dashboard && (
        <>
          {/* =================================================
              WELCOME
          ================================================= */}

          <section
            style={{
              border: '1px solid #222',
              padding: '30px',
              marginBottom: '35px',
              background: '#fff',
            }}
          >

            <p className="eyebrow">
              WELCOME
            </p>

            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '36px',
                fontWeight: '400',
                margin: '0 0 10px',
              }}
            >
              Hello,{' '}
              {dashboard.instructor?.name || 'Instructor'}
            </h2>

            <p
              style={{
                margin: 0,
                color: '#555',
                fontSize: '16px',
              }}
            >
              Here is an overview of your assigned
              training courses.
            </p>

          </section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section
            style={{
              marginBottom: '45px',
            }}
          >

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '18px',
              }}
            >

              {/* COURSE COUNT */}

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
                    margin: '5px 0 8px',
                  }}
                >
                  {
                    dashboard.summary?.course_count ??
                    0
                  }
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                  }}
                >
                  Courses assigned to you.
                </p>

              </article>

              {/* MODULE COUNT */}

              <article
                style={{
                  border: '1px solid #222',
                  padding: '25px',
                  background: '#fff',
                }}
              >

                <p className="eyebrow">
                  MODULES
                </p>

                <h3
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '42px',
                    fontWeight: '400',
                    margin: '5px 0 8px',
                  }}
                >
                  {
                    dashboard.summary?.module_count ??
                    0
                  }
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                  }}
                >
                  Modules across your courses.
                </p>

              </article>

              {/* LEARNER COUNT */}

              <article
                style={{
                  border: '1px solid #222',
                  padding: '25px',
                  background: '#fff',
                }}
              >

                <p className="eyebrow">
                  LEARNERS
                </p>

                <h3
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '42px',
                    fontWeight: '400',
                    margin: '5px 0 8px',
                  }}
                >
                  {
                    dashboard.summary?.learner_count ??
                    0
                  }
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                  }}
                >
                  Learners enrolled in your courses.
                </p>

              </article>

              {/* QUIZ ATTEMPTS */}

              <article
                style={{
                  border: '1px solid #222',
                  padding: '25px',
                  background: '#fff',
                }}
              >

                <p className="eyebrow">
                  QUIZ ACTIVITY
                </p>

                <h3
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '42px',
                    fontWeight: '400',
                    margin: '5px 0 8px',
                  }}
                >
                  {
                    dashboard.summary
                      ?.quiz_attempt_count ?? 0
                  }
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                  }}
                >
                  Quiz attempts across your courses.
                </p>

              </article>

            </div>

          </section>

          {/* =================================================
              MY COURSES
          ================================================= */}

          <section>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '20px',
                marginBottom: '20px',
              }}
            >

              <div>

                <p className="eyebrow">
                  COURSE MANAGEMENT
                </p>

                <h2
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '36px',
                    fontWeight: '400',
                    margin: 0,
                  }}
                >
                  My Courses
                </h2>

              </div>

              <span
                style={{
                  color: '#555',
                  whiteSpace: 'nowrap',
                }}
              >
                {
                  dashboard.courses?.length ?? 0
                }{' '}
                {
                  dashboard.courses?.length === 1
                    ? 'course'
                    : 'courses'
                }
              </span>

            </div>

            {/* =================================================
                NO COURSES
            ================================================= */}

            {!dashboard.courses ||
              dashboard.courses.length === 0 ? (
                <div
                  style={{
                    border: '1px solid #222',
                    padding: '35px',
                    background: '#fff',
                  }}
                >

                  <p className="eyebrow">
                    NO ASSIGNMENTS
                  </p>

                  <h3
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '28px',
                      fontWeight: '400',
                      margin: '0 0 10px',
                    }}
                  >
                    No courses assigned
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: '#555',
                    }}
                  >
                    You do not have any courses assigned
                    to you yet. Contact an administrator
                    to receive a course assignment.
                  </p>

                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >

                  {dashboard.courses.map(
                    (course, index) => (
                      <article
                        key={course.assignment_id}
                        style={{
                          border: '1px solid #222',
                          padding: '25px',
                          background: '#fff',
                        }}
                      >

                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            alignItems: 'flex-start',
                            gap: '30px',
                          }}
                        >

                          {/* COURSE INFORMATION */}

                          <div
                            style={{
                              display: 'flex',
                              gap: '20px',
                              flex: 1,
                            }}
                          >

                            <div
                              style={{
                                width: '52px',
                                height: '52px',
                                border:
                                  '1px solid #222',
                                display: 'flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'center',
                                flexShrink: 0,
                                fontSize: '13px',
                                letterSpacing: '1px',
                              }}
                            >
                              {String(
                                index + 1
                              ).padStart(2, '0')}
                            </div>

                            <div>

                              <p
                                className="eyebrow"
                                style={{
                                  marginBottom:
                                    '6px',
                                }}
                              >
                                COURSE
                              </p>

                              <h3
                                style={{
                                  fontFamily:
                                    'Georgia, serif',
                                  fontSize: '30px',
                                  fontWeight: '400',
                                  margin:
                                    '0 0 8px',
                                }}
                              >
                                {
                                  course.course_title
                                }
                              </h3>

                              <p
                                style={{
                                  margin:
                                    '0 0 14px',
                                  color: '#555',
                                  lineHeight: '1.6',
                                }}
                              >
                                {
                                  course.course_description ||
                                  'No course description available.'
                                }
                              </p>

                              {/* COURSE META */}

                              <div
                                style={{
                                  display: 'flex',
                                  gap: '25px',
                                  flexWrap: 'wrap',
                                  fontSize:
                                    '14px',
                                }}
                              >

                                <span>
                                  <strong>
                                    Modules:
                                  </strong>{' '}
                                  {
                                    course.module_count
                                  }
                                </span>

                                <span>
                                  <strong>
                                    Learners:
                                  </strong>{' '}
                                  {
                                    course.learner_count
                                  }
                                </span>

                                <span>
                                  <strong>
                                    Quiz attempts:
                                  </strong>{' '}
                                  {
                                    course.quiz_attempt_count
                                  }
                                </span>

                              </div>

                            </div>

                          </div>

                          {/* COURSE ACTION */}

                          <div
                            style={{
                              flexShrink: 0,
                            }}
                          >

                            <Link
                              to={`/instructor/course/${course.course_id}`}
                              className="auth-button"
                              style={{
                                display:
                                  'inline-block',
                                textDecoration:
                                  'none',
                              }}
                            >
                              Manage Course
                            </Link>

                          </div>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

          </section>

        </>
      )}

      {/* =====================================================
          FOOTER NAVIGATION
      ===================================================== */}

      <div
        style={{
          marginTop: '45px',
          paddingTop: '25px',
          borderTop: '1px solid #ddd',
          display: 'flex',
          gap: '25px',
          flexWrap: 'wrap',
        }}
      >

      </div>

    </main>
  )
}

export default InstructorDashboard