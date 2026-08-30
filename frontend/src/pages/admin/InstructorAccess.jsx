import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function InstructorAccess() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // =========================================================
  // LOAD INSTRUCTORS
  // =========================================================

  useEffect(() => {
    const loadInstructors = async () => {
      if (!isAuthenticated || !token) {
        setError(
          'Please sign in as an admin to manage instructor access.'
        )
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        setSuccess('')

        const response = await apiFetch(
          '/admin/instructors',
          {},
          handleSessionExpired
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail ||
              'Failed to load instructors'
          )
        }

        setInstructors(data)
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

    loadInstructors()
  }, [
    isAuthenticated,
    token,
    handleSessionExpired,
  ])

  // =========================================================
  // UPDATE INSTRUCTOR ACCESS
  // =========================================================

  const handleAccessChange = async (
    instructor
  ) => {
    try {
      setUpdatingId(instructor.id)
      setError('')
      setSuccess('')

      const newStatus =
        !instructor.is_active

      const response = await apiFetch(
        `/admin/instructors/${instructor.id}/access?is_active=${newStatus}`,
        {
          method: 'PATCH',
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to update instructor access'
        )
      }

      setInstructors((previous) =>
        previous.map((item) =>
          item.id === instructor.id
            ? {
                ...item,
                is_active: data.is_active,
              }
            : item
        )
      )

      setSuccess(
        `${instructor.name} is now ${
          data.is_active
            ? 'active'
            : 'inactive'
        }.`
      )
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>
          Loading instructor access...
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
          ADMINISTRATION / INSTRUCTORS
        </p>

        <h1>
          Instructor Access
        </h1>

        <p className="page-description">
          Activate or deactivate instructor
          access to the training platform.
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
          SUCCESS
      ===================================================== */}

      {success && (
        <p>
          {success}
        </p>
      )}

      {/* =====================================================
          INSTRUCTORS
      ===================================================== */}

      <section className="course-placeholder">

        <p className="eyebrow">
          INSTRUCTOR ACCOUNTS
        </p>

        {instructors.length === 0 ? (
          <p>
            No instructors are available.
          </p>
        ) : (
          <div className="course-list">

            {instructors.map(
              (instructor) => (
                <article
                  key={instructor.id}
                  className="course-card"
                >

                  <p className="eyebrow">
                    INSTRUCTOR
                  </p>

                  <h3>
                    {instructor.name}
                  </h3>

                  <p>
                    {instructor.email}
                  </p>

                  <p>
                    Status:{' '}
                    <strong>
                      {instructor.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </strong>
                  </p>

                  <button
                    type="button"
                    className="auth-button"
                    onClick={() =>
                      handleAccessChange(
                        instructor
                      )
                    }
                    disabled={
                      updatingId ===
                      instructor.id
                    }
                  >
                    {updatingId ===
                    instructor.id
                      ? 'Updating...'
                      : instructor.is_active
                        ? 'Deactivate Instructor'
                        : 'Activate Instructor'}
                  </button>

                </article>
              )
            )}

          </div>
        )}

      </section>

      {/* =====================================================
          BACK
      ===================================================== */}

      <p>
        <Link to="/admin/instructors">
          ← Back to Instructor Management
        </Link>
      </p>

    </main>
  )
}

export default InstructorAccess