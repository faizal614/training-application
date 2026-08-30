import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function ManageCourses() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const [courses, setCourses] = useState([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [editingCourseId, setEditingCourseId] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // =========================================================
  // LOAD COURSES
  // =========================================================

  const loadCourses = async () => {
    if (!isAuthenticated || !token) {
      setError(
        'Please sign in as an admin to manage courses.'
      )
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await apiFetch(
        '/courses/',
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to load courses'
        )
      }

      setCourses(data)
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

  useEffect(() => {
    loadCourses()
  }, [
    isAuthenticated,
    token,
    handleSessionExpired,
  ])

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setEditingCourseId(null)
  }

  // =========================================================
  // CREATE / UPDATE COURSE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!title.trim()) {
      setError('Course title is required.')
      return
    }

    try {
      setSaving(true)

      const isEditing =
        editingCourseId !== null

      const url = isEditing
        ? `/courses/${editingCourseId}`
        : '/courses/'

      const method = isEditing
        ? 'PUT'
        : 'POST'

      const response = await apiFetch(
        url,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
          }),
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            `Failed to ${
              isEditing
                ? 'update'
                : 'create'
            } course`
        )
      }

      if (isEditing) {
        setSuccess(
          'Course updated successfully.'
        )
      } else {
        setSuccess(
          'Course created successfully.'
        )
      }

      resetForm()

      await loadCourses()
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // START EDITING
  // =========================================================

  const handleEdit = (course) => {
    setError('')
    setSuccess('')

    setEditingCourseId(course.id)
    setTitle(course.title || '')
    setDescription(
      course.description || ''
    )

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================================================
  // DELETE COURSE
  // =========================================================

  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?`
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      setDeletingId(course.id)

      const response = await apiFetch(
        `/courses/${course.id}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to delete course'
        )
      }

      setSuccess(
        'Course deleted successfully.'
      )

      if (
        editingCourseId === course.id
      ) {
        resetForm()
      }

      await loadCourses()
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setDeletingId(null)
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
            ADMINISTRATION / COURSES
          </p>

          <h1>
            Manage Courses
          </h1>

          <p className="page-description">
            Loading courses...
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
          ADMINISTRATION / COURSES
        </p>

        <h1>
          Manage Courses
        </h1>

        <p className="page-description">
          Create, edit, and delete training
          courses.
        </p>

      </section>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {error && (
        <p className="auth-error">
          {error}
        </p>
      )}

      {success && (
        <p className="auth-error">
          {success}
        </p>
      )}

      {/* =====================================================
          CREATE / EDIT COURSE
      ===================================================== */}

      <section className="course-placeholder">

        <p className="eyebrow">
          {editingCourseId !== null
            ? 'EDIT COURSE'
            : 'CREATE COURSE'}
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          {/* TITLE */}

          <label htmlFor="course-title">
            Course Title
          </label>

          <input
            id="course-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Enter course title"
            required
          />

          {/* DESCRIPTION */}

          <label htmlFor="course-description">
            Description
          </label>

          <textarea
            id="course-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Enter course description"
            rows="5"
          />

          {/* BUTTONS */}

          <button
            type="submit"
            className="auth-button"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingCourseId !== null
                ? 'Update Course'
                : 'Create Course'}
          </button>

          {editingCourseId !== null && (
            <button
              type="button"
              className="auth-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel Edit
            </button>
          )}

        </form>

      </section>

      {/* =====================================================
          COURSE LIST
      ===================================================== */}

      <section className="course-placeholder">

        <p className="eyebrow">
          EXISTING COURSES
        </p>

        {courses.length === 0 ? (
          <p>
            No courses have been created yet.
          </p>
        ) : (
          <div className="course-list">

            {courses.map((course) => (
              <article
                key={course.id}
                className="course-card"
              >

                <p className="eyebrow">
                  COURSE #{course.id}
                </p>

                <h3>
                  {course.title}
                </h3>

                <p>
                  {course.description ||
                    'No description provided.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginTop: '16px',
                  }}
                >

                  {/* EDIT */}

                  <button
                    type="button"
                    className="auth-button"
                    onClick={() =>
                      handleEdit(course)
                    }
                  >
                    Edit
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    className="auth-button"
                    onClick={() =>
                      handleDelete(course)
                    }
                    disabled={
                      deletingId === course.id
                    }
                  >
                    {deletingId === course.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* =====================================================
          BACK
      ===================================================== */}

      <p>
        <Link to="/admin">
          ← Back to Admin Dashboard
        </Link>
      </p>

    </main>
  )
}

export default ManageCourses