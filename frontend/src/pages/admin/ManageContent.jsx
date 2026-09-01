import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

function TrainingContent() {
  const {
    isAuthenticated,
    handleSessionExpired,
  } = useAuth()

  // =========================================================
  // COURSE / MODULE / CONTENT STATE
  // =========================================================

  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])
  const [contents, setContents] = useState([])

  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedModule, setSelectedModule] = useState('')

  // =========================================================
  // FORM STATE
  // =========================================================

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('text')
  const [body, setBody] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState(1)

  // =========================================================
  // EDIT STATE
  // =========================================================

  const [editingContentId, setEditingContentId] = useState(null)

  const isEditing = editingContentId !== null

  // =========================================================
  // LOADING / MESSAGE STATE
  // =========================================================

  const [loading, setLoading] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // =========================================================
  // FETCH COURSES
  // =========================================================

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setError('')

      const response = await apiFetch(
        '/courses/',
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to fetch courses'
        )
      }

      setCourses(data)
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to fetch courses'
      )
    }
  }

  // =========================================================
  // COURSE CHANGE
  // =========================================================

  const handleCourseChange = async (event) => {
    const courseId = event.target.value

    setSelectedCourse(courseId)
    setSelectedModule('')
    setModules([])
    setContents([])

    resetForm()

    if (!courseId) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/courses/${courseId}/modules`,
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to fetch modules'
        )
      }

      setModules(data)
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to fetch modules'
      )
    }
  }

  // =========================================================
  // MODULE CHANGE
  // =========================================================

  const handleModuleChange = async (event) => {
    const moduleId = event.target.value

    setSelectedModule(moduleId)
    setContents([])

    resetForm()

    if (!moduleId) {
      return
    }

    await fetchModuleContent(moduleId)
  }

  // =========================================================
  // FETCH EXISTING CONTENT
  // =========================================================

  const fetchModuleContent = async (moduleId) => {
    try {
      setContentLoading(true)
      setError('')

      const response = await apiFetch(
        `/modules/${moduleId}/content`,
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to fetch training content'
        )
      }

      setContents(data)
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to fetch training content'
      )
    } finally {
      setContentLoading(false)
    }
  }

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setContentType('text')
    setBody('')
    setVideoUrl('')
    setDisplayOrder(1)

    setEditingContentId(null)
  }

  // =========================================================
  // EDIT CONTENT
  // =========================================================

  const handleEdit = (content) => {
    setError('')
    setSuccess('')

    setEditingContentId(content.id)

    // Load existing title
    setTitle(content.title || '')

    // Load existing description
    setDescription(content.description || '')

    // Load existing content type
    setContentType(
      content.content_type || 'text'
    )

    // Load existing video URL
    setVideoUrl(
      content.video_url || ''
    )

    // Load existing text body
    setBody(
      content.body || ''
    )

    // Load existing display order
    setDisplayOrder(
      content.display_order || 1
    )

    // Scroll to the form
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit = () => {
    resetForm()
    setError('')
    setSuccess('')
  }

  // =========================================================
  // CREATE / UPDATE CONTENT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCourse) {
      setError(
        'Please select a course'
      )
      return
    }

    if (!selectedModule) {
      setError(
        'Please select a module'
      )
      return
    }

    if (!isAuthenticated) {
      setError(
        'Please sign in to continue.'
      )
      return
    }

    // -------------------------------------------------------
    // VALIDATE TITLE
    // -------------------------------------------------------

    if (!title.trim()) {
      setError(
        'Please enter a content title.'
      )
      return
    }

    // -------------------------------------------------------
    // VALIDATE CONTENT
    // -------------------------------------------------------

    if (
      contentType === 'text' &&
      !body.trim()
    ) {
      setError(
        'Text content requires training content.'
      )
      return
    }

    if (
      contentType === 'video' &&
      !videoUrl.trim()
    ) {
      setError(
        'Video content requires a video URL.'
      )
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // =====================================================
      // IMPORTANT
      // TITLE + DESCRIPTION ARE NOW INCLUDED
      // =====================================================

      const payload = {
        title: title.trim(),

        description:
          description.trim() || null,

        content_type: contentType,

        video_url:
          contentType === 'video'
            ? videoUrl.trim()
            : null,

        body:
          contentType === 'text'
            ? body.trim()
            : null,

        display_order:
          Number(displayOrder),
      }

      // =====================================================
      // UPDATE EXISTING CONTENT
      // =====================================================

      if (isEditing) {
        const response = await apiFetch(
          `/modules/content/${editingContentId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(payload),
          },
          handleSessionExpired
        )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Failed to update training content'
          )
        }

        setSuccess(
          'Training content updated successfully.'
        )

        resetForm()

        await fetchModuleContent(
          selectedModule
        )

        return
      }

      // =====================================================
      // CREATE NEW CONTENT
      // =====================================================

      const response = await apiFetch(
        `/modules/${selectedModule}/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        },
        handleSessionExpired
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to create training content'
        )
      }

      setSuccess(
        'Training content added successfully.'
      )

      resetForm()

      await fetchModuleContent(
        selectedModule
      )
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          (
            isEditing
              ? 'Failed to update training content'
              : 'Failed to create training content'
          )
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // DELETE CONTENT
  // =========================================================

  const handleDelete = async (contentId) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this training content?'
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/modules/content/${contentId}`,
        {
          method: 'DELETE',
        },
        handleSessionExpired
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to delete training content'
        )
      }

      setSuccess(
        'Training content deleted successfully.'
      )

      if (
        editingContentId === contentId
      ) {
        resetForm()
      }

      await fetchModuleContent(
        selectedModule
      )
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to delete training content'
      )
    }
  }

  // =========================================================
  // GET COURSE NAME
  // =========================================================

  const getCourseName = (course) => {
    return (
      course.title ||
      course.name ||
      `Course ${course.id}`
    )
  }

  // =========================================================
  // GET MODULE NAME
  // =========================================================

  const getModuleName = (module) => {
    return (
      module.title ||
      module.name ||
      `Module ${module.id}`
    )
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '132px 28px 80px',
        fontFamily: 'Arial, sans-serif',
        color: '#111',
      }}
    >

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            letterSpacing: '3px',
            marginBottom: '10px',
          }}
        >
          04
        </div>

        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            fontWeight: '400',
            margin: '0 0 12px',
            lineHeight: '1.1',
          }}
        >
          Training Content
        </h1>

        <p
          style={{
            fontSize: '17px',
            color: '#555',
            margin: 0,
          }}
        >
          Add and manage text and video training
          content.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            border: '1px solid red',
            background: '#fff5f5',
            color: 'red',
            padding: '12px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div
          style={{
            border: '1px solid #222',
            background: '#f5f5f5',
            padding: '12px',
            marginBottom: '24px',
          }}
        >
          {success}
        </div>
      )}

      {/* =====================================================
          ADD / EDIT CONTENT
      ====================================================== */}

      <div
        style={{
          border: '1px solid #222',
          padding: '30px',
          marginBottom: '40px',
        }}
      >
        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fontWeight: '400',
            margin: '0 0 28px',
          }}
        >
          {isEditing
            ? 'Edit Training Content'
            : 'Add Training Content'}
        </h2>

        <form onSubmit={handleSubmit}>

          {/* =================================================
              COURSE
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Course
            </label>

            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              style={inputStyle}
            >
              <option value="">
                Select a course
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {getCourseName(course)}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              MODULE
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Module
            </label>

            <select
              value={selectedModule}
              onChange={handleModuleChange}
              disabled={!selectedCourse}
              style={inputStyle}
            >
              <option value="">
                {selectedCourse
                  ? 'Select a module'
                  : 'Select a course first'}
              </option>

              {modules.map((module) => (
                <option
                  key={module.id}
                  value={module.id}
                >
                  {getModuleName(module)}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              TITLE
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter content title"
              style={inputStyle}
            />
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Enter a short description"
              rows="3"
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
            />
          </div>

          {/* =================================================
              CONTENT TYPE
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Content Type
            </label>

            <select
              value={contentType}
              onChange={(event) =>
                setContentType(event.target.value)
              }
              style={inputStyle}
            >
              <option value="text">
                Text
              </option>

              <option value="video">
                Video
              </option>
            </select>
          </div>

          {/* =================================================
              TEXT CONTENT
          ================================================== */}

          {contentType === 'text' && (
            <div
              style={{
                marginBottom: '25px',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                Training Content
              </label>

              <textarea
                value={body}
                onChange={(event) =>
                  setBody(event.target.value)
                }
                placeholder="Enter the training content"
                rows="8"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* =================================================
              VIDEO URL
          ================================================== */}

          {contentType === 'video' && (
            <div
              style={{
                marginBottom: '25px',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                Video URL
              </label>

              <input
                type="url"
                value={videoUrl}
                onChange={(event) =>
                  setVideoUrl(event.target.value)
                }
                placeholder="Enter video URL"
                style={inputStyle}
              />
            </div>
          )}

          {/* =================================================
              DISPLAY ORDER
          ================================================== */}

          <div
            style={{
              marginBottom: '25px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Display Order
            </label>

            <input
              type="number"
              min="1"
              value={displayOrder}
              onChange={(event) =>
                setDisplayOrder(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          {/* =================================================
              BUTTONS
          ================================================== */}

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={buttonStyle}
            >
              {loading
                ? isEditing
                  ? 'Updating...'
                  : 'Adding...'
                : isEditing
                ? 'Update Training Content'
                : 'Add Training Content'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                style={secondaryButtonStyle}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* =====================================================
          EXISTING CONTENT
      ====================================================== */}

      {selectedModule && (
        <div>

          {/* =================================================
              EXISTING CONTENT HEADER
          ================================================== */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
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
              Existing Content
            </h2>

            <span
              style={{
                color: '#555',
                fontSize: '14px',
              }}
            >
              {contents.length} item
              {contents.length !== 1
                ? 's'
                : ''}
            </span>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {contentLoading ? (
            <p>
              Loading training content...
            </p>
          ) : contents.length === 0 ? (
            <div
              style={{
                border: '1px solid #222',
                padding: '25px',
                color: '#555',
              }}
            >
              No training content has been
              added to this module yet.
            </div>
          ) : (

            /* =================================================
               CONTENT LIST
            ================================================== */

            <div
              style={{
                display: 'grid',
                gap: '20px',
              }}
            >
              {contents.map((content) => (

                <div
                  key={content.id}
                  style={{
                    border: '1px solid #222',
                    padding: '25px',
                  }}
                >

                  {/* -----------------------------------------
                      CONTENT ID
                  ------------------------------------------ */}

                  <div
                    style={{
                      fontSize: '12px',
                      letterSpacing: '2px',
                      marginBottom: '10px',
                    }}
                  >
                    CONTENT ID: {content.id}
                  </div>

                  {/* -----------------------------------------
                      TITLE
                  ------------------------------------------ */}

                  <h3
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '28px',
                      fontWeight: '400',
                      margin: '0 0 18px',
                    }}
                  >
                    {content.title ||
                      'Untitled Content'}
                  </h3>

                  {/* -----------------------------------------
                      DESCRIPTION
                  ------------------------------------------ */}

                  <div
                    style={{
                      marginBottom: '18px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        letterSpacing: '2px',
                        fontWeight: '600',
                        marginBottom: '6px',
                      }}
                    >
                      DESCRIPTION
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color: '#555',
                        lineHeight: '1.5',
                      }}
                    >
                      {content.description ||
                        'No description available.'}
                    </p>
                  </div>

                  {/* -----------------------------------------
                      CONTENT TYPE
                  ------------------------------------------ */}

                  <div
                    style={{
                      fontSize: '14px',
                      marginBottom: '12px',
                    }}
                  >
                    <strong>
                      Content Type:
                    </strong>{' '}
                    {content.content_type}
                  </div>

                  {/* -----------------------------------------
                      DISPLAY ORDER
                  ------------------------------------------ */}

                  <div
                    style={{
                      fontSize: '14px',
                      marginBottom: '18px',
                    }}
                  >
                    <strong>
                      Display Order:
                    </strong>{' '}
                    {content.display_order}
                  </div>

                  {/* -----------------------------------------
                      SEPARATOR
                  ------------------------------------------ */}

                  <div
                    style={{
                      borderTop: '1px solid #ddd',
                      paddingTop: '18px',
                    }}
                  >

                    {/* ---------------------------------------
                        TEXT CONTENT
                    ---------------------------------------- */}

                    {content.content_type === 'text' && (
                      <>
                        <div
                          style={{
                            fontSize: '12px',
                            letterSpacing: '2px',
                            fontWeight: '600',
                            marginBottom: '8px',
                          }}
                        >
                          TRAINING CONTENT
                        </div>

                        <div
                          style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6',
                            marginBottom: '22px',
                          }}
                        >
                          {content.body ||
                            'No training content available.'}
                        </div>
                      </>
                    )}

                    {/* ---------------------------------------
                        VIDEO CONTENT
                    ---------------------------------------- */}

                    {content.content_type === 'video' && (
                      <>
                        <div
                          style={{
                            fontSize: '12px',
                            letterSpacing: '2px',
                            fontWeight: '600',
                            marginBottom: '8px',
                          }}
                        >
                          VIDEO
                        </div>

                        {content.video_url ? (
                          <div
                            style={{
                              marginBottom: '22px',
                            }}
                          >
                            <a
                              href={content.video_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Video
                            </a>
                          </div>
                        ) : (
                          <p
                            style={{
                              color: '#555',
                              marginBottom: '22px',
                            }}
                          >
                            No video URL available.
                          </p>
                        )}
                      </>
                    )}

                    {/* ---------------------------------------
                        ACTION BUTTONS
                    ---------------------------------------- */}

                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(content)
                        }
                        style={editButtonStyle}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(content.id)
                        }
                        style={deleteButtonStyle}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          BACK TO ADMIN DASHBOARD
      ====================================================== */}

      <div
        style={{
          marginTop: '50px',
        }}
      >
        <Link to="/admin">
          ← Back to Admin Dashboard
        </Link>
      </div>
    </div>
  )
}

// =========================================================
// STYLES
// =========================================================

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px',
  border: '1px solid #999',
  fontSize: '16px',
  fontFamily: 'Arial, sans-serif',
  background: '#fff',
}

const buttonStyle = {
  background: '#111',
  color: '#fff',
  border: 'none',
  padding: '14px 22px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  background: '#fff',
  color: '#111',
  border: '1px solid #111',
  padding: '13px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

const editButtonStyle = {
  background: '#111',
  color: '#fff',
  border: 'none',
  padding: '11px 20px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
}

const deleteButtonStyle = {
  background: '#111',
  color: '#fff',
  border: 'none',
  padding: '11px 20px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
}

export default TrainingContent