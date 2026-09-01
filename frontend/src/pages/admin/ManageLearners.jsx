import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../../utils/api'

function ManageLearners() {
  // =========================================================
  // DATA
  // =========================================================

  const [learners, setLearners] = useState([])
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])

  // =========================================================
  // SELECTION
  // =========================================================

  const [selectedLearner, setSelectedLearner] =
    useState(null)

  const [selectedCourse, setSelectedCourse] =
    useState('')

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] =
    useState(true)

  const [courseLoading, setCourseLoading] =
    useState(true)

  const [assignmentLoading, setAssignmentLoading] =
    useState(true)

  const [savingAccess, setSavingAccess] =
    useState(null)

  const [assigningCourse, setAssigningCourse] =
    useState(false)

  const [deletingLearner, setDeletingLearner] =
    useState(null)

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  // =========================================================
  // LOAD INITIAL DATA
  // =========================================================

  useEffect(() => {
    loadLearners()
    loadCourses()
    loadAssignments()
  }, [])

  // =========================================================
  // LOAD LEARNERS
  // =========================================================

  const loadLearners = async () => {
    try {
      setLoading(true)
      setError('')

      const response =
        await apiFetch('/admin/learners')

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to load learners'
        )
      }

      setLearners(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (err) {
      setError(err.message)
      setLearners([])
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // LOAD COURSES
  // =========================================================

  const loadCourses = async () => {
    try {
      setCourseLoading(true)

      const response =
        await apiFetch('/courses')

      const data =
        await response.json()

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
    } catch (err) {
      setError(err.message)
      setCourses([])
    } finally {
      setCourseLoading(false)
    }
  }

  // =========================================================
  // LOAD COURSE ASSIGNMENTS
  // =========================================================

  const loadAssignments = async () => {
    try {
      setAssignmentLoading(true)

      const response =
        await apiFetch(
          '/admin/learners/courses'
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to load learner course assignments'
        )
      }

      setAssignments(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (err) {
      setError(err.message)
      setAssignments([])
    } finally {
      setAssignmentLoading(false)
    }
  }

  // =========================================================
  // SELECT / DESELECT LEARNER
  // =========================================================

  const handleSelectLearner = (learner) => {
    // -------------------------------------------------------
    // Clicking the currently selected learner closes
    // the management section.
    // -------------------------------------------------------

    if (
      selectedLearner &&
      selectedLearner.id === learner.id
    ) {
      setSelectedLearner(null)
      setSelectedCourse('')
      setError('')
      setSuccess('')
      return
    }

    // -------------------------------------------------------
    // Select new learner.
    // -------------------------------------------------------

    setSelectedLearner(learner)
    setSelectedCourse('')
    setError('')
    setSuccess('')
  }

  // =========================================================
  // UPDATE LEARNER ACCESS
  // =========================================================

  const handleToggleAccess = async (learner) => {
    const newStatus =
      !learner.is_active

    const action =
      newStatus
        ? 'activate'
        : 'deactivate'

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${learner.name}'s access?`
      )

    if (!confirmed) {
      return
    }

    try {
      setSavingAccess(learner.id)
      setError('')
      setSuccess('')

      const response =
        await apiFetch(
          `/admin/learners/${learner.id}/access?is_active=${newStatus}`,
          {
            method: 'PATCH',
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            `Failed to ${action} learner access`
        )
      }

      // -----------------------------------------------------
      // Update learner in list.
      // -----------------------------------------------------

      setLearners(
        (previousLearners) =>
          previousLearners.map(
            (item) =>
              item.id === learner.id
                ? {
                    ...item,
                    is_active:
                      data.is_active,
                  }
                : item
          )
      )

      // -----------------------------------------------------
      // Update selected learner if necessary.
      // -----------------------------------------------------

      if (
        selectedLearner &&
        selectedLearner.id === learner.id
      ) {
        setSelectedLearner(
          (previous) => ({
            ...previous,
            is_active:
              data.is_active,
          })
        )
      }

      setSuccess(
        `Learner access ${
          newStatus
            ? 'activated'
            : 'deactivated'
        } successfully.`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAccess(null)
    }
  }

  // =========================================================
  // DELETE LEARNER
  // =========================================================

  const handleDeleteLearner = async (
    learner
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${learner.name}?\n\n` +
        `This will delete the learner account, course assignments, ` +
        `module progress, and quiz attempts.\n\n` +
        `This action cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingLearner(learner.id)
      setError('')
      setSuccess('')

      const response =
        await apiFetch(
          `/admin/learners/${learner.id}`,
          {
            method: 'DELETE',
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to delete learner'
        )
      }

      // -----------------------------------------------------
      // Remove learner from UI.
      // -----------------------------------------------------

      setLearners(
        (previousLearners) =>
          previousLearners.filter(
            (item) =>
              item.id !== learner.id
          )
      )

      // -----------------------------------------------------
      // Remove learner's assignments from UI.
      // -----------------------------------------------------

      setAssignments(
        (previousAssignments) =>
          previousAssignments.filter(
            (assignment) =>
              Number(
                assignment.learner_id
              ) !==
              Number(learner.id)
          )
      )

      // -----------------------------------------------------
      // Clear selected learner if deleted.
      // -----------------------------------------------------

      if (
        selectedLearner &&
        selectedLearner.id === learner.id
      ) {
        setSelectedLearner(null)
        setSelectedCourse('')
      }

      setSuccess(
        `${learner.name} was deleted successfully.`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingLearner(null)
    }
  }

  // =========================================================
  // ASSIGN COURSE
  // =========================================================

  const handleAssignCourse = async (
    event,
    learner
  ) => {
    event.preventDefault()

    if (!learner) {
      setError(
        'Please select a learner first.'
      )
      return
    }

    if (!selectedCourse) {
      setError(
        'Please select a course.'
      )
      return
    }

    try {
      setAssigningCourse(true)
      setError('')
      setSuccess('')

      const response =
        await apiFetch(
          `/admin/courses/${selectedCourse}/learners`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              learner_id:
                learner.id,
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to assign course'
        )
      }

      setSelectedCourse('')

      setSuccess(
        `Course assigned to ${learner.name} successfully.`
      )

      await loadAssignments()
    } catch (err) {
      setError(err.message)
    } finally {
      setAssigningCourse(false)
    }
  }

  // =========================================================
  // GET COURSES FOR LEARNER
  // =========================================================

  const getLearnerAssignments = (
    learnerId
  ) => {
    return assignments.filter(
      (assignment) =>
        Number(
          assignment.learner_id
        ) === Number(learnerId)
    )
  }

  // =========================================================
  // CHECK IF COURSE ALREADY ASSIGNED
  // =========================================================

  const isCourseAssigned = (
    learnerId,
    courseId
  ) => {
    return assignments.some(
      (assignment) =>
        Number(
          assignment.learner_id
        ) === Number(learnerId) &&
        Number(
          assignment.course_id
        ) === Number(courseId)
    )
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        maxWidth: '1140px',
        margin: '0 auto',
        padding: '112px 0 80px',
      }}
    >
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

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
          06
        </div>

        <h1
          style={{
            fontFamily:
              'Georgia, serif',
            fontSize: '52px',
            fontWeight: '400',
            margin:
              '0 0 10px',
          }}
        >
          Manage Learners
        </h1>

        <p
          style={{
            fontSize: '17px',
            color: '#555',
            margin: 0,
          }}
        >
          Manage learner access and
          assign courses.
        </p>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          style={{
            border:
              '1px solid red',
            background:
              '#fff5f5',
            color: 'red',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (
        <div
          style={{
            border:
              '1px solid #222',
            background:
              '#f7f7f7',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          {success}
        </div>
      )}

      {/* ===================================================
          LEARNERS
      =================================================== */}

      <section
        style={{
          marginBottom: '40px',
        }}
      >
        {/* -------------------------------------------------
            SECTION HEADER
        ------------------------------------------------- */}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontFamily:
                'Georgia, serif',
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

        {/* -------------------------------------------------
            LOADING
        ------------------------------------------------- */}

        {loading && (
          <p>
            Loading learners...
          </p>
        )}

        {/* -------------------------------------------------
            EMPTY
        ------------------------------------------------- */}

        {!loading &&
          learners.length === 0 && (
            <div
              style={{
                border:
                  '1px solid #ccc',
                padding: '25px',
              }}
            >
              No learners found.
            </div>
          )}

        {/* -------------------------------------------------
            LEARNER LIST
        ------------------------------------------------- */}

        {!loading &&
          learners.map(
            (learner) => {
              const learnerCourses =
                getLearnerAssignments(
                  learner.id
                )

              const isSelected =
                selectedLearner &&
                selectedLearner.id ===
                  learner.id

              return (
                <div
                  key={learner.id}
                  style={{
                    border:
                      isSelected
                        ? '2px solid #111'
                        : '1px solid #222',
                    padding: '25px',
                    marginBottom: '20px',
                  }}
                >
                  {/* =======================================
                      LEARNER INFORMATION + ACTIONS
                  ======================================= */}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'flex-start',
                      gap: '30px',
                    }}
                  >
                    {/* ---------------------------------------
                        LEARNER INFORMATION
                    --------------------------------------- */}

                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          letterSpacing:
                            '3px',
                          marginBottom:
                            '10px',
                        }}
                      >
                        LEARNER ID:{' '}
                        {learner.id}
                      </div>

                      <h3
                        style={{
                          fontFamily:
                            'Georgia, serif',
                          fontSize:
                            '30px',
                          fontWeight:
                            '400',
                          margin:
                            '0 0 10px',
                        }}
                      >
                        {learner.name}
                      </h3>

                      <p
                        style={{
                          margin:
                            '0 0 8px',
                        }}
                      >
                        <strong>
                          Email:
                        </strong>{' '}
                        {learner.email}
                      </p>

                      <p
                        style={{
                          margin: 0,
                        }}
                      >
                        <strong>
                          Status:
                        </strong>{' '}
                        {learner.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </p>
                    </div>

                    {/* ---------------------------------------
                        LEARNER ACTIONS
                    --------------------------------------- */}

                    <div
                      style={{
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        gap: '10px',
                        alignItems:
                          'flex-end',
                      }}
                    >
                      {/* ACCESS */}

                      <button
                        type="button"
                        disabled={
                          savingAccess ===
                            learner.id ||
                          deletingLearner ===
                            learner.id
                        }
                        onClick={() =>
                          handleToggleAccess(
                            learner
                          )
                        }
                        style={
                          learner.is_active
                            ? dangerButtonStyle
                            : primaryButtonStyle
                        }
                      >
                        {savingAccess ===
                        learner.id
                          ? 'Saving...'
                          : learner.is_active
                          ? 'Deactivate Access'
                          : 'Activate Access'}
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        disabled={
                          deletingLearner ===
                            learner.id ||
                          savingAccess ===
                            learner.id
                        }
                        onClick={() =>
                          handleDeleteLearner(
                            learner
                          )
                        }
                        style={
                          learner.is_active
                            ? dangerButtonStyle
                            : primaryButtonStyle
                        }
                      >
                        {deletingLearner ===
                        learner.id
                          ? 'Deleting...'
                          : 'Delete Learner'}
                      </button>
                    </div>
                  </div>

                  {/* =======================================
                      ASSIGNED COURSES
                  ======================================= */}

                  <div
                    style={{
                      borderTop:
                        '1px solid #ddd',
                      marginTop:
                        '25px',
                      paddingTop:
                        '20px',
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          '12px',
                        letterSpacing:
                          '3px',
                        marginBottom:
                          '15px',
                      }}
                    >
                      ASSIGNED COURSES
                    </div>

                    {assignmentLoading ? (
                      <p>
                        Loading
                        courses...
                      </p>
                    ) : learnerCourses.length ===
                      0 ? (
                      <p>
                        No courses
                        assigned.
                      </p>
                    ) : (
                      learnerCourses.map(
                        (
                          assignment
                        ) => (
                          <div
                            key={
                              assignment.assignment_id
                            }
                            style={{
                              border:
                                '1px solid #ddd',
                              padding:
                                '14px',
                              marginBottom:
                                '10px',
                            }}
                          >
                            <strong>
                              {
                                assignment.course_title
                              }
                            </strong>

                            {assignment.course_description && (
                              <p
                                style={{
                                  margin:
                                    '6px 0 0',
                                  color:
                                    '#555',
                                }}
                              >
                                {
                                  assignment.course_description
                                }
                              </p>
                            )}
                          </div>
                        )
                      )
                    )}
                  </div>

                  {/* =======================================
                      MANAGE LEARNER BUTTON
                  ======================================= */}

                  <button
                    type="button"
                    onClick={() =>
                      handleSelectLearner(
                        learner
                      )
                    }
                    disabled={
                      deletingLearner ===
                      learner.id
                    }
                    style={
                      isSelected
                        ? selectedButtonStyle
                        : secondaryButtonStyle
                    }
                  >
                    {isSelected
                      ? 'Close Management'
                      : 'Manage Learner'}
                  </button>

                  {/* =======================================
                      INLINE ASSIGN COURSE
                  ======================================= */}

                  {isSelected && (
                    <section
                      style={{
                        borderTop:
                          '1px solid #222',
                        marginTop:
                          '25px',
                        paddingTop:
                          '25px',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily:
                            'Georgia, serif',
                          fontSize:
                            '28px',
                          fontWeight:
                            '400',
                          margin:
                            '0 0 10px',
                        }}
                      >
                        Assign Course
                      </h3>

                      <p>
                        Assigning a
                        course to:{' '}
                        <strong>
                          {
                            learner.name
                          }
                        </strong>
                      </p>

                      <form
                        onSubmit={(
                          event
                        ) =>
                          handleAssignCourse(
                            event,
                            learner
                          )
                        }
                      >
                        {/* ---------------------------------
                            COURSE SELECT
                        --------------------------------- */}

                        <div
                          style={{
                            marginBottom:
                              '25px',
                          }}
                        >
                          <label
                            style={{
                              display:
                                'block',
                              fontWeight:
                                '600',
                              marginBottom:
                                '8px',
                            }}
                          >
                            Course
                          </label>

                          <select
                            value={
                              selectedCourse
                            }
                            onChange={(
                              event
                            ) =>
                              setSelectedCourse(
                                event
                                  .target
                                  .value
                              )
                            }
                            style={
                              inputStyle
                            }
                            disabled={
                              courseLoading ||
                              assigningCourse
                            }
                          >
                            <option value="">
                              Select
                              course
                            </option>

                            {courses.map(
                              (
                                course
                              ) => {
                                const assigned =
                                  isCourseAssigned(
                                    learner.id,
                                    course.id
                                  )

                                return (
                                  <option
                                    key={
                                      course.id
                                    }
                                    value={
                                      course.id
                                    }
                                    disabled={
                                      assigned
                                    }
                                  >
                                    {
                                      course.title
                                    }

                                    {assigned
                                      ? ' — Already assigned'
                                      : ''}
                                  </option>
                                )
                              }
                            )}
                          </select>
                        </div>

                        {/* ---------------------------------
                            ASSIGN BUTTON
                        --------------------------------- */}

                        <button
                          type="submit"
                          style={
                            primaryButtonStyle
                          }
                          disabled={
                            assigningCourse ||
                            courseLoading ||
                            !selectedCourse
                          }
                        >
                          {assigningCourse
                            ? 'Assigning...'
                            : 'Assign Course'}
                        </button>
                      </form>
                    </section>
                  )}
                </div>
              )
            }
          )}
      </section>

      {/* ===================================================
          COURSE ASSIGNMENT OVERVIEW
      =================================================== */}

      <section
        style={{
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontFamily:
                'Georgia, serif',
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
            }}
          >
            Course Assignments
          </h2>

          <span>
            {assignments.length}{' '}
            {assignments.length === 1
              ? 'assignment'
              : 'assignments'}
          </span>
        </div>

        {assignmentLoading && (
          <p>
            Loading assignments...
          </p>
        )}

        {!assignmentLoading &&
          assignments.length === 0 && (
            <div
              style={{
                border:
                  '1px solid #ccc',
                padding: '25px',
              }}
            >
              No course assignments
              found.
            </div>
          )}

        {!assignmentLoading &&
          assignments.length > 0 && (
            <div
              style={{
                border:
                  '1px solid #222',
              }}
            >
              {assignments.map(
                (
                  assignment,
                  index
                ) => (
                  <div
                    key={
                      assignment.assignment_id
                    }
                    style={{
                      padding:
                        '18px 20px',
                      borderBottom:
                        index <
                        assignments.length -
                          1
                          ? '1px solid #ddd'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          '600',
                        marginBottom:
                          '6px',
                      }}
                    >
                      {
                        assignment.learner_name
                      }
                    </div>

                    <div
                      style={{
                        color:
                          '#555',
                        marginBottom:
                          '6px',
                      }}
                    >
                      {
                        assignment.learner_email
                      }
                    </div>

                    <div>
                      <strong>
                        Course:
                      </strong>{' '}
                      {
                        assignment.course_title
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </section>

      {/* ===================================================
          BACK
      =================================================== */}

      <Link to="/admin">
        ← Back to Admin Dashboard
      </Link>
    </div>
  )
}

// =========================================================
// STYLES
// =========================================================

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px',
  border: '1px solid #aaa',
  fontSize: '16px',
  background: '#fff',
}

const primaryButtonStyle = {
  background: '#111',
  color: '#fff',
  border: '1px solid #111',
  padding: '13px 22px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  background: '#fff',
  color: '#111',
  border: '1px solid #111',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  marginTop: '20px',
}

const selectedButtonStyle = {
  background: '#111',
  color: '#fff',
  border: '1px solid #111',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  marginTop: '20px',
}

const dangerButtonStyle = {
  background: '#fff',
  color: '#b00000',
  border: '1px solid #b00000',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

const deleteButtonStyle = {
  background: '#b00000',
  color: '#fff',
  border: '1px solid #b00000',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

export default ManageLearners