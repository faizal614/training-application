import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
  // LOAD COURSES
  // =========================================================

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/courses/'
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail || 'Failed to load courses'
          )
        }

        setCourses(data)
      } catch (error) {
        setError(error.message)
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

  return (
    <main className="main-content">
      <section className="page-intro">
        <p className="eyebrow">
          LEARNING PLATFORM
        </p>

        <h1>Courses</h1>

        <p className="page-description">
          Build practical skills through structured training,
          assessments, and guided learning.
        </p>
      </section>

      <section className="course-placeholder">
        <p className="eyebrow">
          COURSES
        </p>

        <h2>Available courses</h2>

        {loading && (
          <p>
            Loading courses...
          </p>
        )}

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        {!loading && !error && courses.length === 0 && (
          <p>
            No courses are available yet.
          </p>
        )}

        {/* =====================================================
            SEARCH / CATEGORY FILTER
        ===================================================== */}

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

        {/* =====================================================
            FILTERED COURSE COUNT
        ===================================================== */}

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

        {/* =====================================================
            NO MATCHING COURSES
        ===================================================== */}

        {!loading &&
          !error &&
          courses.length > 0 &&
          filteredCourses.length === 0 && (
            <p>
              No courses match your search
              or selected category.
            </p>
          )}

        {/* =====================================================
            COURSE LIST
        ===================================================== */}

        {!loading &&
          !error &&
          filteredCourses.length > 0 && (
            <div className="course-list">
              {filteredCourses.map(
                (course) => (
                  <article
                    key={course.id}
                    className="course-card"
                  >
                    <p className="eyebrow">
                      COURSE {course.id}
                    </p>

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
                          textTransform: 'uppercase',
                        }}
                      >
                        {course.category}
                      </p>
                    )}

                    <p>
                      {course.description}
                    </p>

                    <Link
                      to={`/courses/${course.id}`}
                      className="auth-button"
                    >
                      View course
                    </Link>
                  </article>
                )
              )}
            </div>
          )}
      </section>
    </main>
  )
}

export default Courses