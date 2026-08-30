import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../utils/api'

function Progress() {
  // ---------------------------------------------------------
  // DATA
  // ---------------------------------------------------------

  const [learners, setLearners] = useState([])

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  const [expandedLearner, setExpandedLearner] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ---------------------------------------------------------
  // LOAD PROGRESS
  // ---------------------------------------------------------

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await apiFetch(
        '/admin/progress'
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to load learner progress'
        )
      }

      setLearners(
        Array.isArray(data) ? data : []
      )
    } catch (err) {
      setError(err.message)
      setLearners([])
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // TOGGLE LEARNER
  // ---------------------------------------------------------

  const handleToggleLearner = (learnerId) => {
    setExpandedLearner((previous) =>
      previous === learnerId
        ? null
        : learnerId
    )
  }

  // ---------------------------------------------------------
  // FORMAT DATE
  // ---------------------------------------------------------

  const formatDate = (date) => {
    if (!date) {
      return '—'
    }

    return new Date(date).toLocaleString()
  }

  // ---------------------------------------------------------
  // GET LATEST ATTEMPT
  // ---------------------------------------------------------

  const getLatestAttempt = (attempts) => {
    if (!attempts || attempts.length === 0) {
      return null
    }

    return attempts[attempts.length - 1]
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div
      style={{
        maxWidth: '1140px',
        margin: '0 auto',
        padding: '40px 0 80px',
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            letterSpacing: '4px',
            marginBottom: '12px',
          }}
        >
          07
        </div>

        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            fontWeight: '400',
            margin: '0 0 10px',
          }}
        >
          Progress
        </h1>

        <p
          style={{
            fontSize: '17px',
            color: '#555',
            margin: 0,
          }}
        >
          View learner module progress and quiz
          attempts.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          style={{
            border: '1px solid #b00000',
            background: '#fff5f5',
            color: '#b00000',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <p>
          Loading learner progress...
        </p>
      )}

      {/* =====================================================
          NO LEARNERS
      ===================================================== */}

      {!loading &&
        learners.length === 0 &&
        !error && (
          <div
            style={{
              border: '1px solid #ccc',
              padding: '25px',
            }}
          >
            No learners found.
          </div>
        )}

      {/* =====================================================
          LEARNERS
      ===================================================== */}

      {!loading &&
        learners.length > 0 && (
          <section>
            {/* SECTION HEADER */}

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
                Learners
              </h2>

              <span>
                {learners.length}{' '}
                {learners.length === 1
                  ? 'learner'
                  : 'learners'}
              </span>
            </div>

            {/* =============================================
                LEARNER LIST
            ============================================= */}

            <div>
              {learners.map((learner) => {
                const isExpanded =
                  expandedLearner ===
                  learner.learner_id

                return (
                  <div
                    key={learner.learner_id}
                    style={{
                      border: isExpanded
                        ? '2px solid #111'
                        : '1px solid #222',
                      marginBottom: '12px',
                      background: '#fff',
                    }}
                  >
                    {/* ===================================
                        LEARNER DROPDOWN HEADER
                    =================================== */}

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleLearner(
                          learner.learner_id
                        )
                      }
                      style={{
                        width: '100%',
                        border: 'none',
                        background: '#fff',
                        padding: '22px 25px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                        gap: '20px',
                      }}
                    >
                      {/* LEFT */}

                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            letterSpacing: '3px',
                            marginBottom: '7px',
                            color: '#666',
                          }}
                        >
                          LEARNER ID:{' '}
                          {learner.learner_id}
                        </div>

                        <div
                          style={{
                            fontFamily:
                              'Georgia, serif',
                            fontSize: '26px',
                            marginBottom: '6px',
                          }}
                        >
                          {learner.learner_name}
                        </div>

                        <div
                          style={{
                            fontSize: '15px',
                            color: '#555',
                          }}
                        >
                          {learner.learner_email}
                        </div>
                      </div>

                      {/* RIGHT */}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            letterSpacing: '1px',
                          }}
                        >
                          {learner.courses.length}{' '}
                          {learner.courses.length ===
                          1
                            ? 'COURSE'
                            : 'COURSES'}
                        </span>

                        <span
                          style={{
                            fontSize: '20px',
                          }}
                        >
                          {isExpanded
                            ? '▲'
                            : '▼'}
                        </span>
                      </div>
                    </button>

                    {/* ===================================
                        LEARNER DETAILS
                    =================================== */}

                    {isExpanded && (
                      <div
                        style={{
                          borderTop:
                            '1px solid #ddd',
                          padding: '25px',
                        }}
                      >
                        {/* ---------------------------------
                            LEARNER STATUS
                        --------------------------------- */}

                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            alignItems: 'center',
                            marginBottom: '25px',
                            paddingBottom: '20px',
                            borderBottom:
                              '1px solid #eee',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '12px',
                              letterSpacing:
                                '2px',
                            }}
                          >
                            ACCOUNT STATUS
                          </span>

                          <strong>
                            {learner.is_active
                              ? 'ACTIVE'
                              : 'INACTIVE'}
                          </strong>
                        </div>

                        {/* ---------------------------------
                            NO COURSES
                        --------------------------------- */}

                        {learner.courses.length ===
                          0 && (
                          <div
                            style={{
                              padding: '20px',
                              background:
                                '#f7f7f7',
                              border:
                                '1px solid #ddd',
                            }}
                          >
                            This learner has no
                            courses assigned.
                          </div>
                        )}

                        {/* ---------------------------------
                            COURSES
                        --------------------------------- */}

                        {learner.courses.map(
                          (course) => (
                            <div
                              key={
                                course.course_id
                              }
                              style={{
                                border:
                                  '1px solid #222',
                                padding: '25px',
                                marginBottom:
                                  '20px',
                              }}
                            >
                              {/* COURSE HEADER */}

                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent:
                                    'space-between',
                                  alignItems:
                                    'flex-start',
                                  gap: '20px',
                                  marginBottom:
                                    '20px',
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize:
                                        '11px',
                                      letterSpacing:
                                        '3px',
                                      marginBottom:
                                        '8px',
                                    }}
                                  >
                                    COURSE
                                  </div>

                                  <h3
                                    style={{
                                      fontFamily:
                                        'Georgia, serif',
                                      fontSize:
                                        '28px',
                                      fontWeight:
                                        '400',
                                      margin:
                                        '0 0 8px',
                                    }}
                                  >
                                    {
                                      course.course_title
                                    }
                                  </h3>

                                  {course.course_description && (
                                    <p
                                      style={{
                                        color:
                                          '#555',
                                        margin:
                                          0,
                                      }}
                                    >
                                      {
                                        course.course_description
                                      }
                                    </p>
                                  )}
                                </div>

                                <div
                                  style={{
                                    textAlign:
                                      'right',
                                    flexShrink:
                                      0,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize:
                                        '28px',
                                      fontWeight:
                                        '600',
                                    }}
                                  >
                                    {Math.round(
                                      course.progress_percentage
                                    )}
                                    %
                                  </div>

                                  <div
                                    style={{
                                      fontSize:
                                        '13px',
                                      color:
                                        '#555',
                                    }}
                                  >
                                    {
                                      course.completed_modules
                                    }{' '}
                                    /{' '}
                                    {
                                      course.total_modules
                                    }{' '}
                                    modules
                                  </div>
                                </div>
                              </div>

                              {/* ---------------------------------
                                  PROGRESS BAR
                              --------------------------------- */}

                              <div
                                style={{
                                  height: '8px',
                                  background:
                                    '#e5e5e5',
                                  marginBottom:
                                    '20px',
                                }}
                              >
                                <div
                                  style={{
                                    height:
                                      '100%',
                                    width: `${Math.min(
                                      Math.max(
                                        course.progress_percentage,
                                        0
                                      ),
                                      100
                                    )}%`,
                                    background:
                                      '#111',
                                  }}
                                />
                              </div>

                              {/* ---------------------------------
                                  COURSE STATUS
                              --------------------------------- */}

                              <div
                                style={{
                                  marginBottom:
                                    '25px',
                                  padding: '13px 15px',
                                  border:
                                    '1px solid #ddd',
                                  background:
                                    course.completed
                                      ? '#f3f3f3'
                                      : '#fff',
                                }}
                              >
                                <strong>
                                  Course Status:
                                </strong>{' '}
                                {course.completed
                                  ? 'COMPLETED'
                                  : 'IN PROGRESS'}
                              </div>

                              {/* ---------------------------------
                                  MODULE PROGRESS
                              --------------------------------- */}

                              <div>
                                <div
                                  style={{
                                    fontSize:
                                      '11px',
                                    letterSpacing:
                                      '3px',
                                    marginBottom:
                                      '15px',
                                  }}
                                >
                                  MODULE PROGRESS
                                </div>

                                {course.modules.map(
                                  (module) => {
                                    const attempts =
                                      module.quiz
                                        ?.attempts ||
                                      []

                                    const latestAttempt =
                                      getLatestAttempt(
                                        attempts
                                      )

                                    return (
                                      <div
                                        key={
                                          module.module_id
                                        }
                                        style={{
                                          border:
                                            '1px solid #ddd',
                                          marginBottom:
                                            '12px',
                                          padding:
                                            '18px',
                                        }}
                                      >
                                        {/* MODULE HEADER */}

                                        <div
                                          style={{
                                            display:
                                              'flex',
                                            justifyContent:
                                              'space-between',
                                            alignItems:
                                              'center',
                                            gap: '15px',
                                          }}
                                        >
                                          <div>
                                            <div
                                              style={{
                                                fontSize:
                                                  '11px',
                                                letterSpacing:
                                                  '2px',
                                                color:
                                                  '#666',
                                                marginBottom:
                                                  '6px',
                                              }}
                                            >
                                              MODULE{' '}
                                              {
                                                module.display_order
                                              }
                                            </div>

                                            <strong
                                              style={{
                                                fontSize:
                                                  '18px',
                                              }}
                                            >
                                              {
                                                module.module_title
                                              }
                                            </strong>
                                          </div>

                                          <div
                                            style={{
                                              fontWeight:
                                                '600',
                                              fontSize:
                                                '13px',
                                            }}
                                          >
                                            {module.status ===
                                            'completed'
                                              ? '✓ COMPLETED'
                                              : 'PENDING'}
                                          </div>
                                        </div>

                                        {/* COMPLETION DATE */}

                                        {module.completed_at && (
                                          <p
                                            style={{
                                              margin:
                                                '10px 0 0',
                                              color:
                                                '#555',
                                              fontSize:
                                                '14px',
                                            }}
                                          >
                                            Completed:{' '}
                                            {formatDate(
                                              module.completed_at
                                            )}
                                          </p>
                                        )}

                                        {/* --------------------------------
                                            QUIZ
                                        -------------------------------- */}

                                        {module.quiz && (
                                          <div
                                            style={{
                                              borderTop:
                                                '1px solid #eee',
                                              marginTop:
                                                '18px',
                                              paddingTop:
                                                '18px',
                                            }}
                                          >
                                            <div
                                              style={{
                                                display:
                                                  'flex',
                                                justifyContent:
                                                  'space-between',
                                                alignItems:
                                                  'center',
                                                marginBottom:
                                                  '8px',
                                              }}
                                            >
                                              <div>
                                                <div
                                                  style={{
                                                    fontSize:
                                                      '11px',
                                                    letterSpacing:
                                                      '2px',
                                                    color:
                                                      '#666',
                                                    marginBottom:
                                                      '5px',
                                                  }}
                                                >
                                                  QUIZ
                                                </div>

                                                <strong>
                                                  {
                                                    module
                                                      .quiz
                                                      .quiz_title
                                                  }
                                                </strong>
                                              </div>

                                              <div
                                                style={{
                                                  fontSize:
                                                    '13px',
                                                  color:
                                                    '#555',
                                                }}
                                              >
                                                {
                                                  module
                                                    .quiz
                                                    .attempts
                                                    .length
                                                }{' '}
                                                /{' '}
                                                {
                                                  module
                                                    .quiz
                                                    .max_attempts
                                                }{' '}
                                                attempts
                                              </div>
                                            </div>

                                            <p
                                              style={{
                                                margin:
                                                  '8px 0 15px',
                                                color:
                                                  '#555',
                                                fontSize:
                                                  '14px',
                                              }}
                                            >
                                              Passing
                                              score:{' '}
                                              {
                                                module
                                                  .quiz
                                                  .passing_score
                                              }
                                            </p>

                                            {/* NO ATTEMPTS */}

                                            {attempts.length ===
                                              0 && (
                                              <div
                                                style={{
                                                  padding:
                                                    '12px',
                                                  background:
                                                    '#f7f7f7',
                                                  fontSize:
                                                    '14px',
                                                }}
                                              >
                                                No quiz
                                                attempts
                                                yet.
                                              </div>
                                            )}

                                            {/* ATTEMPTS */}

                                            {attempts.length >
                                              0 && (
                                              <div>
                                                {attempts.map(
                                                  (
                                                    attempt,
                                                    index
                                                  ) => (
                                                    <div
                                                      key={
                                                        attempt.attempt_id
                                                      }
                                                      style={{
                                                        display:
                                                          'grid',
                                                        gridTemplateColumns:
                                                          '1fr 1fr 1fr 1.5fr',
                                                        gap:
                                                          '10px',
                                                        alignItems:
                                                          'center',
                                                        borderTop:
                                                          '1px solid #eee',
                                                        padding:
                                                          '11px 0',
                                                        fontSize:
                                                          '14px',
                                                      }}
                                                    >
                                                      <span>
                                                        Attempt{' '}
                                                        {index +
                                                          1}
                                                      </span>

                                                      <span>
                                                        Score:{' '}
                                                        <strong>
                                                          {
                                                            attempt.score
                                                          }
                                                        </strong>
                                                      </span>

                                                      <span
                                                        style={{
                                                          fontWeight:
                                                            '600',
                                                        }}
                                                      >
                                                        {attempt.passed
                                                          ? '✓ PASSED'
                                                          : '✗ FAILED'}
                                                      </span>

                                                      <span
                                                        style={{
                                                          color:
                                                            '#666',
                                                          textAlign:
                                                            'right',
                                                        }}
                                                      >
                                                        {formatDate(
                                                          attempt.attempted_at
                                                        )}
                                                      </span>
                                                    </div>
                                                  )
                                                )}

                                                {/* LATEST ATTEMPT */}

                                                {latestAttempt && (
                                                  <div
                                                    style={{
                                                      marginTop:
                                                        '12px',
                                                      padding:
                                                        '12px 15px',
                                                      background:
                                                        '#f7f7f7',
                                                      border:
                                                        '1px solid #ddd',
                                                      fontSize:
                                                        '14px',
                                                    }}
                                                  >
                                                    <strong>
                                                      Latest
                                                      attempt:
                                                    </strong>{' '}
                                                    Score{' '}
                                                    {
                                                      latestAttempt.score
                                                    }{' '}
                                                    —{' '}
                                                    {latestAttempt.passed
                                                      ? 'Passed'
                                                      : 'Failed'}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

      {/* =====================================================
          BACK
      ===================================================== */}

      <div
        style={{
          marginTop: '30px',
        }}
      >
        <Link to="/admin">
          ← Back to Admin Dashboard
        </Link>
      </div>
    </div>
  )
}

export default Progress