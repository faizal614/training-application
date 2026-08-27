import { useEffect, useState } from 'react'

function CourseList() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollingCourseId, setEnrollingCourseId] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/courses/'
        )

        if (!response.ok) {
          throw new Error('Failed to load courses')
        }

        const data = await response.json()
        setCourses(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    async function fetchEnrolledCourses() {
      const token = localStorage.getItem('access_token')

      if (!token) {
        return
      }

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/courses/enrolled/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          return
        }

        const data = await response.json()

        setEnrolledCourses(
          data.map((course) => course.course_id)
        )
      } catch {
        // Ignore enrollment lookup errors here.
      }
    }

    fetchEnrolledCourses()
  }, [])

  const handleEnroll = async (courseId) => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Please sign in before enrolling in a course.')
      return
    }

    setError('')
    setEnrollingCourseId(courseId)

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/courses/${courseId}/enroll`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to enroll in course'
        )
      }

      setEnrolledCourses((previous) => [
        ...previous,
        courseId,
      ])
    } catch (error) {
      setError(error.message)
    } finally {
      setEnrollingCourseId(null)
    }
  }

  if (loading) {
    return <p>Loading courses...</p>
  }

  if (error && courses.length === 0) {
    return <p>{error}</p>
  }

  if (courses.length === 0) {
    return <p>No courses available.</p>
  }

  return (
    <>
      {error && (
        <p className="course-error">
          {error}
        </p>
      )}

      <div className="course-list">
        {courses.map((course) => {
          const isEnrolled = enrolledCourses.includes(course.id)
          const isEnrolling = enrollingCourseId === course.id

          return (
            <article
              className="course-card"
              key={course.id}
            >
              <p className="course-card__number">
                COURSE {String(course.id).padStart(2, '0')}
              </p>

              <h3>{course.title}</h3>

              <p>{course.description}</p>

              <button
                className="course-enroll-button"
                onClick={() => handleEnroll(course.id)}
                disabled={isEnrolled || isEnrolling}
              >
                {isEnrolled
                  ? 'Enrolled'
                  : isEnrolling
                    ? 'Enrolling...'
                    : 'Enroll'}
              </button>
            </article>
          )
        })}
      </div>
    </>
  )
}

export default CourseList