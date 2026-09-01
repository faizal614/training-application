import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../utils/api'

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState('All Categories')

  // =========================================================
  // LOAD ENROLLED COURSES
  // =========================================================

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await apiFetch(
          '/courses/enrolled/me'
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail ||
              'Failed to load courses'
          )
        }

        setCourses(
          Array.isArray(data)
            ? data
            : []
        )
      } catch (error) {
        setError(error.message)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // =========================================================
  // GET CATEGORIES
  // =========================================================

  const categories = [
    'All Categories',
    ...Array.from(
      new Set(
        courses
          .map((course) => course.category)
          .filter(Boolean)
      )
    ),
  ]

  // =========================================================
  // FILTER COURSES
  // =========================================================

  const filteredCourses = courses.filter((course) => {
    const searchValue =
      searchTerm.trim().toLowerCase()

    const matchesSearch =
      !searchValue ||
      course.title
        ?.toLowerCase()
        .includes(searchValue) ||
      course.description
        ?.toLowerCase()
        .includes(searchValue)

    const matchesCategory =
      selectedCategory === 'All Categories' ||
      course.category === selectedCategory

    return (
      matchesSearch &&
      matchesCategory
    )
  })

  // =========================================================
  // COURSE DISPLAY NUMBERS
  // =========================================================
  //
  // The database ID is NOT used as the visible course number.
  //
  // Example:
  //
  // Database IDs:
  // 1, 7, 8
  //
  // Display:
  // COURSE 1
  // COURSE 2
  // COURSE 3
  //
  // =========================================================

  const courseDisplayNumbers = new Map(
    courses.map((course, index) => [
      course.course_id,
      index + 1,
    ])
  )

  // =========================================================
  // FORMAT DEADLINE
  // =========================================================

  const formatDeadline = (date) => {
    if (!date) {
      return 'No deadline'
    }

    const parsedDate =
      new Date(date)

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return 'Invalid deadline'
    }

    return parsedDate.toLocaleString(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    )
  }

  // =========================================================
  // GET DEADLINE STATUS
  // =========================================================

  const getDeadlineStatus = (date) => {
    if (!date) {
      return {
        label: 'No deadline',
        type: 'none',
      }
    }

    const deadlineDate =
      new Date(date)

    if (
      Number.isNaN(
        deadlineDate.getTime()
      )
    ) {
      return {
        label: 'Invalid deadline',
        type: 'none',
      }
    }

    const now = new Date()

    // -------------------------------------------------------
    // OVERDUE
    // -------------------------------------------------------

    if (
      deadlineDate.getTime() <
      now.getTime()
    ) {
      return {
        label: 'Overdue',
        type: 'overdue',
      }
    }

    // -------------------------------------------------------
    // START OF TODAY
    // -------------------------------------------------------

    const todayStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )

    // -------------------------------------------------------
    // START OF TOMORROW
    // -------------------------------------------------------

    const tomorrowStart =
      new Date(todayStart)

    tomorrowStart.setDate(
      tomorrowStart.getDate() + 1
    )

    // -------------------------------------------------------
    // DUE TODAY
    // -------------------------------------------------------

    if (
      deadlineDate.getTime() <
      tomorrowStart.getTime()
    ) {
      return {
        label: 'Due today',
        type: 'today',
      }
    }

    // -------------------------------------------------------
    // DAYS REMAINING
    // -------------------------------------------------------

    const difference =
      deadlineDate.getTime() -
      todayStart.getTime()

    const days = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    )

    // -------------------------------------------------------
    // DUE TOMORROW / UPCOMING
    // -------------------------------------------------------

    return {
      label:
        days === 1
          ? 'Due tomorrow'
          : `Due in ${days} days`,
      type: 'upcoming',
    }
  }

  // =========================================================
  // DEADLINE STATUS STYLE
  // =========================================================

  const getDeadlineStatusStyle = (
    type
  ) => {
    if (type === 'overdue') {
      return {
        color: '#b00000',
        fontWeight: '700',
      }
    }

    if (type === 'today') {
      return {
        color: '#8a5200',
        fontWeight: '700',
      }
    }

    if (type === 'upcoming') {
      return {
        color: '#111',
        fontWeight: '600',
      }
    }

    return {
      color: '#777',
      fontWeight: '400',
    }
  }

  // =========================================================
  // CHECK COURSE COMPLETION
  // =========================================================
  //
  // The backend should return:
  //
  // completed: true
  //
  // when all modules in the course are completed.
  //
  // We also support progress_percentage === 100
  // as a fallback.
  //
  // =========================================================

  const isCourseCompleted = (course) => {
    return (
      course.completed === true ||
      Number(course.progress_percentage) === 100
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
          LEARNING PLATFORM
        </p>

        <h1>
          Courses
        </h1>

        <p className="page-description">
          Build practical skills through structured training,
          assessments, and guided learning.
        </p>

      </section>

      {/* =====================================================
          COURSES
      ===================================================== */}

      <section className="course-placeholder">

        <p className="eyebrow">
          COURSES
        </p>

        <h2>
          Available courses
        </h2>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (
          <p>
            Loading courses...
          </p>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        {/* ===================================================
            NO COURSES
        =================================================== */}

        {!loading &&
          !error &&
          courses.length === 0 && (
            <p>
              No courses are available yet.
            </p>
          )}

        {/* ===================================================
            SEARCH / CATEGORY FILTER
        =================================================== */}

        {!loading &&
          !error &&
          courses.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                margin: '32px 0',
              }}
            >

              {/* SEARCH */}

              <div
                style={{
                  flex: '1 1 300px',
                }}
              >

                <label
                  htmlFor="course-search"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Search Courses
                </label>

                <input
                  id="course-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search by title or description"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 12px',
                    border: '1px solid #111111',
                    borderRadius: 0,
                    background: '#ffffff',
                    color: '#111111',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />

              </div>

              {/* CATEGORY */}

              <div
                style={{
                  flex: '0 1 260px',
                }}
              >

                <label
                  htmlFor="course-category"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Category
                </label>

                <select
                  id="course-category"
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(
                      event.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 12px',
                    border: '1px solid #111111',
                    borderRadius: 0,
                    background: '#ffffff',
                    color: '#111111',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                >

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>
          )}

        {/* ===================================================
            FILTERED COURSE COUNT
        =================================================== */}

        {!loading &&
          !error &&
          courses.length > 0 && (
            <p
              style={{
                marginBottom: '24px',
                color: '#555',
                fontSize: '14px',
              }}
            >
              Showing {filteredCourses.length}{' '}
              {filteredCourses.length === 1
                ? 'course'
                : 'courses'}
            </p>
          )}

        {/* ===================================================
            NO MATCHING COURSES
        =================================================== */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length === 0 && (
            <p>
              No courses match your search
              or selected category.
            </p>
          )}

        {/* ===================================================
            COURSE LIST
        =================================================== */}

        {!loading &&
          !error &&
          filteredCourses.length > 0 && (
            <div className="course-list">

              {filteredCourses.map(
                (course) => {

                  const completed =
                    isCourseCompleted(course)

                  const deadlineStatus =
                    getDeadlineStatus(
                      course.deadline
                    )

                  return (
                    <article
                      key={course.course_id}
                      className="course-card"
                    >

                      {/* COURSE NUMBER */}

                      <p className="eyebrow">
                        COURSE{' '}
                        {courseDisplayNumbers.get(
                          course.course_id
                        )}
                      </p>

                      {/* COURSE TITLE */}

                      <h3>
                        {course.title}
                      </h3>

                      {/* CATEGORY */}

                      {course.category && (
                        <p
                          style={{
                            margin: '0 0 16px',
                            fontSize: '12px',
                            fontWeight: '700',
                            letterSpacing: '1px',
                            textTransform:
                              'uppercase',
                          }}
                        >
                          {course.category}
                        </p>
                      )}

                      {/* DESCRIPTION */}

                      <p>
                        {course.description}
                      </p>

                      {/* =================================================
                          COMPLETED COURSE
                      ================================================= */}

                      {completed ? (
                        <div
                          style={{
                            margin:
                              '20px 0',
                            padding:
                              '18px 16px',
                            border:
                              '1px solid #111',
                            background:
                              '#f7f7f7',
                          }}
                        >

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
                            COURSE STATUS
                          </div>

                          <div
                            style={{
                              fontSize:
                                '16px',
                              fontWeight:
                                '700',
                              textTransform:
                                'uppercase',
                              letterSpacing:
                                '1px',
                            }}
                          >
                            Completed
                          </div>

                        </div>
                      ) : (

                        /* =================================================
                            DEADLINE
                        ================================================= */

                        <div
                          style={{
                            margin:
                              '20px 0',
                            padding:
                              '14px 16px',
                            border:
                              '1px solid #ddd',
                            background:
                              '#fafafa',
                          }}
                        >

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
                            DEADLINE
                          </div>

                          <div
                            style={{
                              fontSize:
                                '15px',
                              fontWeight:
                                '600',
                            }}
                          >
                            {formatDeadline(
                              course.deadline
                            )}
                          </div>

                          <div
                            style={{
                              fontSize:
                                '13px',
                              marginTop:
                                '5px',
                              ...getDeadlineStatusStyle(
                                deadlineStatus.type
                              ),
                            }}
                          >
                            {
                              deadlineStatus.label
                            }
                          </div>

                        </div>
                      )}

                      {/* =================================================
                          VIEW COURSE
                      ================================================= */}

                      <Link
                        to={`/courses/${course.course_id}`}
                        className="auth-button"
                      >
                        View course
                      </Link>

                    </article>
                  )
                }
              )}

            </div>
          )}

      </section>

    </main>
  )
}

export default Courses