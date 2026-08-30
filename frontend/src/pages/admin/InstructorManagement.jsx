import { Link } from 'react-router-dom'

function InstructorManagement() {
  return (
    <main className="main-content">

      {/* =====================================================
          INSTRUCTOR MANAGEMENT INTRO
      ===================================================== */}

      <section className="page-intro">
        <p className="eyebrow">
          ADMINISTRATION / INSTRUCTORS 
        </p>

        <h1>
          Instructor Management
        </h1>

        <p className="page-description">
          Create and manage instructors, assign courses,
          and control instructor access.
        </p>
      </section>

      {/* =====================================================
          INSTRUCTOR MANAGEMENT
      ===================================================== */}

      <section className="course-placeholder">
        <p className="eyebrow">
          INSTRUCTOR MANAGEMENT
        </p>

        <div className="course-list">

          {/* -------------------------------------------------
              CREATE INSTRUCTOR
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              01
            </p>

            <h3>
              Create Instructor
            </h3>

            <p>
              Create a new instructor account and
              provide the required instructor details.
            </p>

            <Link
              to="/admin/instructors/create"
              className="auth-button"
            >
              Create Instructor
            </Link>
          </article>

          {/* -------------------------------------------------
              MANAGE INSTRUCTORS
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              02
            </p>

            <h3>
              Manage Instructors
            </h3>

            <p>
              View instructor accounts and manage
              their details and access.
            </p>

            <Link
              to="/admin/instructors/manage"
              className="auth-button"
            >
              Manage Instructors
            </Link>
          </article>

          {/* -------------------------------------------------
              ASSIGN COURSES
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              03
            </p>

            <h3>
              Assign Courses
            </h3>

            <p>
              Assign training courses to instructors
              responsible for delivering them.
            </p>

            <Link
              to="/admin/instructors/assign-courses"
              className="auth-button"
            >
              Assign Courses
            </Link>
          </article>

          {/* -------------------------------------------------
              INSTRUCTOR COURSES
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              04
            </p>

            <h3>
              Instructor Courses
            </h3>

            <p>
              View which courses are assigned to
              each instructor.
            </p>

            <Link
              to="/admin/instructors/courses"
              className="auth-button"
            >
              View Assignments
            </Link>
          </article>

          {/* -------------------------------------------------
              INSTRUCTOR ACCESS
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              05
            </p>

            <h3>
              Instructor Access
            </h3>

            <p>
              Manage instructor access to the
              training platform.
            </p>

            <Link
              to="/admin/instructors/access"
              className="auth-button"
            >
              Manage Access
            </Link>
          </article>

        </div>
      </section>

      {/* =====================================================
          BACK TO ADMIN DASHBOARD
      ===================================================== */}

      <p>
        <Link to="/admin">
          ← Back to Admin Dashboard
        </Link>
      </p>

    </main>
  )
}

export default InstructorManagement