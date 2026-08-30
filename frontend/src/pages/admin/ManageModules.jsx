import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function ManageModules() {
  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])

  const [selectedCourse, setSelectedCourse] =
    useState('')

  const [title, setTitle] = useState('')
  const [displayOrder, setDisplayOrder] = useState(1)

  const [editingModuleId, setEditingModuleId] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [loadingModules, setLoadingModules] =
    useState(false)

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ---------------------------------------------------------
  // REF FOR CREATE / EDIT SECTION
  // ---------------------------------------------------------

  const moduleFormRef = useRef(null)

  // =========================================================
  // LOAD COURSES
  // =========================================================

  const loadCourses = async () => {
    try {
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

      if (data.length > 0) {
        setSelectedCourse(String(data[0].id))
      }
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    }
  }

  // =========================================================
  // LOAD MODULES
  // =========================================================

  const loadModules = async (courseId) => {
    if (!courseId) {
      setModules([])
      return
    }

    try {
      setLoadingModules(true)
      setError('')

      const response = await apiFetch(
        `/courses/${courseId}/modules`,
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to load modules'
        )
      }

      setModules(data)
    } catch (error) {
      if (
        error.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(error.message)
    } finally {
      setLoadingModules(false)
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setError(
        'Please sign in as an admin to manage modules.'
      )

      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)

      await loadCourses()

      setLoading(false)
    }

    loadData()
  }, [
    isAuthenticated,
    token,
    handleSessionExpired,
  ])

  // =========================================================
  // LOAD MODULES WHEN COURSE CHANGES
  // =========================================================

  useEffect(() => {
    if (selectedCourse) {
      loadModules(selectedCourse)
      resetForm()
    }
  }, [selectedCourse])

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setTitle('')

    setDisplayOrder(
      modules.length + 1
    )

    setEditingModuleId(null)
  }

  // =========================================================
  // CREATE / UPDATE MODULE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!selectedCourse) {
      setError('Please select a course.')
      return
    }

    if (!title.trim()) {
      setError('Module title is required.')
      return
    }

    if (!displayOrder || Number(displayOrder) < 1) {
      setError(
        'Display order must be at least 1.'
      )
      return
    }

    try {
      setSaving(true)

      const isEditing =
        editingModuleId !== null

      const url = isEditing
        ? `/courses/modules/${editingModuleId}`
        : `/courses/${selectedCourse}/modules`

      const method = isEditing
        ? 'PUT'
        : 'POST'

      const response = await apiFetch(
        url,
        {
          method,
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            display_order:
              Number(displayOrder),
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
            } module`
        )
      }

      setSuccess(
        isEditing
          ? 'Module updated successfully.'
          : 'Module created successfully.'
      )

      setEditingModuleId(null)
      setTitle('')

      await loadModules(selectedCourse)

      // Return to the module list after saving.
      setTimeout(() => {
        document
          .getElementById('existing-modules')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 100)
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
  // EDIT MODULE
  // =========================================================

  const handleEdit = (module) => {
    setError('')
    setSuccess('')

    setEditingModuleId(module.id)

    setTitle(module.title || '')

    setDisplayOrder(
      module.display_order || 1
    )

    // Scroll to the actual edit form.
    setTimeout(() => {
      moduleFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 100)
  }

  // =========================================================
  // DELETE MODULE
  // =========================================================

  const handleDelete = async (module) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${module.title}"?`
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      setDeletingId(module.id)

      const response = await apiFetch(
        `/courses/modules/${module.id}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to delete module'
        )
      }

      setSuccess(
        'Module deleted successfully.'
      )

      if (
        editingModuleId === module.id
      ) {
        setEditingModuleId(null)
        setTitle('')
        setDisplayOrder(1)
      }

      await loadModules(selectedCourse)
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
            ADMINISTRATION / MODULES
          </p>

          <h1>
            Manage Modules
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
          ADMINISTRATION / MODULES
        </p>

        <h1>
          Manage Modules
        </h1>

        <p className="page-description">
          Create, edit, and delete modules
          belonging to your courses.
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
        <p
          style={{
            border: '1px solid #222',
            padding: '14px 18px',
            marginBottom: '24px',
            background: '#fafafa',
          }}
        >
          {success}
        </p>
      )}

      {/* =====================================================
          SELECT COURSE
      ===================================================== */}

      <section
        className="course-placeholder"
        style={{
          marginBottom: '30px',
        }}
      >

        <p className="eyebrow">
          SELECT COURSE
        </p>

        {courses.length === 0 ? (
          <div
            style={{
              padding: '20px 0',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#555',
              }}
            >
              No courses are available.
              Create a course first.
            </p>
          </div>
        ) : (
          <div
            style={{
              maxWidth: '650px',
            }}
          >

            <label
              htmlFor="course"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
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
                padding: '14px 16px',
                border: '1px solid #222',
                background: '#fff',
                fontSize: '16px',
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
                color: '#777',
                fontSize: '14px',
                marginTop: '8px',
              }}
            >
              Select a course to manage
              its modules.
            </p>

          </div>
        )}

      </section>

      {/* =====================================================
    CREATE / EDIT MODULE
===================================================== */}

{selectedCourse && (
  <section
    ref={moduleFormRef}
    className="course-placeholder"
    style={{
      marginBottom: '55px',
      scrollMarginTop: '100px',
      padding: '38px 42px 42px',
      border:
        editingModuleId !== null
          ? '1px solid #222'
          : '1px solid #222',
      boxSizing: 'border-box',
    }}
  >

    {/* -------------------------------------------------
        SECTION HEADER
    ------------------------------------------------- */}

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '30px',
        marginBottom: '35px',
      }}
    >

      <div>

        <p
          className="eyebrow"
          style={{
            margin: '0 0 14px',
          }}
        >
          {editingModuleId !== null
            ? 'EDIT MODULE'
            : 'CREATE MODULE'}
        </p>

        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '36px',
            fontWeight: '400',
            lineHeight: '1.15',
            margin: '0 0 10px',
          }}
        >
          {editingModuleId !== null
            ? 'Edit Module'
            : 'Add a New Module'}
        </h2>

        <p
          style={{
            margin: 0,
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.6',
          }}
        >
          {editingModuleId !== null
            ? 'Update the module information below.'
            : 'Create a new module for the selected course.'}
        </p>

      </div>

      {editingModuleId !== null && (
        <span
          style={{
            border: '1px solid #222',
            padding: '9px 14px',
            fontSize: '11px',
            letterSpacing: '2px',
            whiteSpace: 'nowrap',
            marginTop: '4px',
          }}
        >
          EDITING
        </span>
      )}

    </div>

    {/* -------------------------------------------------
        FORM
    ------------------------------------------------- */}

    <form
      onSubmit={handleSubmit}
      className="auth-form"
      style={{
        maxWidth: '760px',
      }}
    >

      {/* -------------------------------------------------
          MODULE TITLE
      ------------------------------------------------- */}

      <div
        style={{
          marginBottom: '28px',
        }}
      >

        <label
          htmlFor="module-title"
          style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '600',
          }}
        >
          Module Title
        </label>

        <input
          id="module-title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Enter module title"
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px 16px',
            fontSize: '16px',
            border: '1px solid #222',
          }}
        />

        <p
          style={{
            margin: '9px 0 0',
            color: '#777',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
        >
          The title learners will see for this module.
        </p>

      </div>

      {/* -------------------------------------------------
          DISPLAY ORDER
      ------------------------------------------------- */}

      <div
        style={{
          marginBottom: '32px',
        }}
      >

        <label
          htmlFor="display-order"
          style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '600',
          }}
        >
          Display Order
        </label>

        <input
          id="display-order"
          type="number"
          min="1"
          value={displayOrder}
          onChange={(event) =>
            setDisplayOrder(
              event.target.value
            )
          }
          required
          style={{
            width: '140px',
            boxSizing: 'border-box',
            padding: '15px 16px',
            fontSize: '16px',
            border: '1px solid #222',
          }}
        />

        <p
          style={{
            margin: '9px 0 0',
            color: '#777',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
        >
          Determines the order in which modules appear
          in the course.
        </p>

      </div>

      {/* -------------------------------------------------
          ACTIONS
      ------------------------------------------------- */}

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          paddingTop: '5px',
        }}
      >

        <button
          type="submit"
          className="auth-button"
          disabled={saving}
          style={{
            minWidth: '150px',
          }}
        >
          {saving
            ? 'Saving...'
            : editingModuleId !== null
              ? 'Update Module'
              : 'Create Module'}
        </button>

        {editingModuleId !== null && (
          <button
            type="button"
            className="auth-button"
            onClick={resetForm}
            disabled={saving}
            style={{
              minWidth: '100px',
            }}
          >
            Cancel
          </button>
        )}

      </div>

    </form>

  </section>
)}

      {/* =====================================================
          EXISTING MODULES
      ===================================================== */}

      {selectedCourse && (
        <section
          id="existing-modules"
          style={{
            scrollMarginTop: '100px',
          }}
        >

          {/* SECTION HEADER */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '20px',
            }}
          >

            <div>

              <p className="eyebrow">
                COURSE CONTENT
              </p>

              <h2
                style={{
                  fontFamily:
                    'Georgia, serif',
                  fontSize: '34px',
                  fontWeight: '400',
                  margin: 0,
                }}
              >
                Modules
              </h2>

            </div>

            {!loadingModules && (
              <span
                style={{
                  color: '#666',
                  fontSize: '14px',
                }}
              >
                {modules.length}{' '}
                {modules.length === 1
                  ? 'module'
                  : 'modules'}
              </span>
            )}

          </div>

          {/* LOADING */}

          {loadingModules ? (
            <div
              style={{
                border:
                  '1px solid #222',
                padding: '30px',
              }}
            >
              <p
                style={{
                  margin: 0,
                }}
              >
                Loading modules...
              </p>
            </div>
          ) : modules.length === 0 ? (

            /* EMPTY STATE */

            <div
              style={{
                border:
                  '1px solid #ccc',
                padding: '35px',
              }}
            >

              <p
                className="eyebrow"
                style={{
                  marginBottom: '10px',
                }}
              >
                NO MODULES
              </p>

              <h3
                style={{
                  fontFamily:
                    'Georgia, serif',
                  fontSize: '28px',
                  fontWeight: '400',
                  margin:
                    '0 0 10px',
                }}
              >
                No modules yet
              </h3>

              <p
                style={{
                  margin: 0,
                  color: '#666',
                }}
              >
                Create the first module
                for this course above.
              </p>

            </div>

          ) : (

            /* MODULE LIST */

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >

              {modules.map((module) => (
                <article
                  key={module.id}
                  style={{
                    border:
                      '1px solid #222',
                    padding:
                      '26px 24px',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'space-between',
                    gap: '25px',
                    background: '#fff',
                  }}
                >

                  {/* MODULE INFO */}

                  <div
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: '20px',
                      minWidth: 0,
                    }}
                  >

                    {/* NUMBER */}

                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        border:
                          '1px solid #222',
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        flexShrink: 0,
                        fontSize: '16px',
                      }}
                    >
                      {String(
                        module.display_order
                      ).padStart(2, '0')}
                    </div>

                    {/* DETAILS */}

                    <div>

                      <p
                        className="eyebrow"
                        style={{
                          marginBottom:
                            '5px',
                        }}
                      >
                        MODULE{' '}
                        {module.display_order}
                      </p>

                      <h3
                        style={{
                          fontFamily:
                            'Georgia, serif',
                          fontSize: '27px',
                          fontWeight: '400',
                          margin:
                            '0 0 5px',
                        }}
                      >
                        {module.title}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: '#777',
                          fontSize: '13px',
                        }}
                      >
                        Module ID:{' '}
                        {module.id}
                      </p>

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      flexShrink: 0,
                    }}
                  >

                    <button
                      type="button"
                      className="auth-button"
                      onClick={() =>
                        handleEdit(
                          module
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="auth-button"
                      onClick={() =>
                        handleDelete(
                          module
                        )
                      }
                      disabled={
                        deletingId ===
                        module.id
                      }
                    >
                      {deletingId ===
                      module.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>
      )}

      {/* =====================================================
          BACK
      ===================================================== */}

      <div
        style={{
          marginTop: '40px',
          paddingTop: '25px',
          borderTop:
            '1px solid #ddd',
        }}
      >
        <Link to="/admin">
          ← Back to Admin Dashboard
        </Link>
      </div>

    </main>
  )
}

export default ManageModules