import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function ManageInstructors() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const [instructors, setInstructors] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // -------------------------
  // EDIT STATE
  // -------------------------

  const [editingInstructor, setEditingInstructor] =
    useState(null)

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const [savingEdit, setSavingEdit] =
    useState(false)

  // -------------------------
  // DELETE STATE
  // -------------------------

  const [deletingInstructorId, setDeletingInstructorId] =
    useState(null)

  // =========================================================
  // LOAD INSTRUCTORS
  // =========================================================

  const fetchInstructors = async () => {
    if (!isAuthenticated || !token) {
      setError(
        'Please sign in as an admin to manage instructors.'
      )
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

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

  useEffect(() => {
    fetchInstructors()
  }, [
    isAuthenticated,
    token,
    handleSessionExpired,
  ])

  // =========================================================
  // START EDIT
  // =========================================================

  const handleEditClick = (instructor) => {
    setError('')

    setEditingInstructor(instructor)

    setEditName(instructor.name)
    setEditEmail(instructor.email)
  }

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit = () => {
    setEditingInstructor(null)

    setEditName('')
    setEditEmail('')
  }

  // =========================================================
  // SAVE EDIT
  // =========================================================

  const handleSaveEdit = async (event) => {
    event.preventDefault()

    if (!editingInstructor) {
      return
    }

    if (!editName.trim() || !editEmail.trim()) {
      setError(
        'Name and email are required.'
      )
      return
    }

    try {
      setSavingEdit(true)
      setError('')

      const response = await apiFetch(
        `/admin/instructors/${editingInstructor.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editName.trim(),
            email: editEmail.trim(),
          }),
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to update instructor'
        )
      }

      setInstructors((previous) =>
        previous.map((instructor) =>
          instructor.id === data.id
            ? data
            : instructor
        )
      )

      setEditingInstructor(null)

      setEditName('')
      setEditEmail('')
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setSavingEdit(false)
    }
  }

  // =========================================================
  // DELETE INSTRUCTOR
  // =========================================================

  const handleDeleteInstructor = async (
    instructor
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${instructor.name}?`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingInstructorId(instructor.id)
      setError('')

      const response = await apiFetch(
        `/admin/instructors/${instructor.id}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to delete instructor'
        )
      }

      setInstructors((previous) =>
        previous.filter(
          (item) =>
            item.id !== instructor.id
        )
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
      setDeletingInstructorId(null)
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>
          Loading instructors...
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
          PAGE INTRO
      ===================================================== */}

      <section className="page-intro">

        <p className="eyebrow">
          ADMINISTRATION / INSTRUCTORS / MANAGE INSTRUCTORS
        </p>

        <h1>
          Manage Instructors
        </h1>

        <p className="page-description">
          View and manage instructor accounts
          registered on the training platform.
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
          INSTRUCTOR LIST
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
              INSTRUCTOR ACCOUNTS
            </p>

            <h2>
              Instructors
            </h2>
          </div>

          <Link
            to="/admin/instructors/create"
            className="auth-button"
          >
            Create Instructor
          </Link>

        </div>

        {instructors.length === 0 ? (
          <div className="course-card">

            <p className="eyebrow">
              NO INSTRUCTORS
            </p>

            <h3>
              No instructors found
            </h3>

            <p>
              There are currently no instructor
              accounts available.
            </p>

            <Link
              to="/admin/instructors/create"
              className="auth-button"
            >
              Create Instructor
            </Link>

          </div>
        ) : (
          <div className="course-list">

            {instructors.map((instructor) => {

              const isEditing =
                editingInstructor?.id ===
                instructor.id

              const isDeleting =
                deletingInstructorId ===
                instructor.id

              return (
                <article
                  key={instructor.id}
                  className="course-card"
                >

                  {/* =================================================
                      EDIT FORM
                  ================================================= */}

                  {isEditing ? (
                    <>
                      <p className="eyebrow">
                        EDIT INSTRUCTOR
                      </p>

                      <h3>
                        Edit Instructor
                      </h3>

                      <form
                        onSubmit={
                          handleSaveEdit
                        }
                        className="auth-form"
                      >

                        <label
                          htmlFor={`name-${instructor.id}`}
                        >
                          Name
                        </label>

                        <input
                          id={`name-${instructor.id}`}
                          type="text"
                          value={editName}
                          onChange={(event) =>
                            setEditName(
                              event.target.value
                            )
                          }
                          required
                        />

                        <label
                          htmlFor={`email-${instructor.id}`}
                        >
                          Email
                        </label>

                        <input
                          id={`email-${instructor.id}`}
                          type="email"
                          value={editEmail}
                          onChange={(event) =>
                            setEditEmail(
                              event.target.value
                            )
                          }
                          required
                        />

                        <div
                          style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                        >

                          <button
                            type="submit"
                            className="auth-button"
                            disabled={
                              savingEdit
                            }
                          >
                            {savingEdit
                              ? 'Saving...'
                              : 'Save Changes'}
                          </button>

                          <button
                            type="button"
                            className="auth-button"
                            onClick={
                              handleCancelEdit
                            }
                            disabled={
                              savingEdit
                            }
                          >
                            Cancel
                          </button>

                        </div>

                      </form>
                    </>
                  ) : (
                    <>
                      {/* ===============================================
                          INSTRUCTOR DETAILS
                      =============================================== */}

                      <p className="eyebrow">
                        INSTRUCTOR
                      </p>

                      <h3>
                        {instructor.name}
                      </h3>

                      <p>
                        Email:{' '}
                        <strong>
                          {instructor.email}
                        </strong>
                      </p>

                      <p>
                        Role:{' '}
                        <strong>
                          {instructor.role}
                        </strong>
                      </p>

                      {/* ===============================================
                          ACTIONS
                      =============================================== */}

                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap',
                          marginTop: '24px',
                        }}
                      >

                        <button
                          type="button"
                          className="auth-button"
                          onClick={() =>
                            handleEditClick(
                              instructor
                            )
                          }
                          disabled={isDeleting}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="auth-button"
                          onClick={() =>
                            handleDeleteInstructor(
                              instructor
                            )
                          }
                          disabled={isDeleting}
                        >
                          {isDeleting
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>

                      </div>
                    </>
                  )}

                </article>
              )
            })}

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

export default ManageInstructors