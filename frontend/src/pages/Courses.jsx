import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

        {!loading && !error && courses.length > 0 && (
          <div className="course-list">
            {courses.map((course) => (
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
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Courses