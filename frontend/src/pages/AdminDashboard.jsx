import { Link } from 'react-router-dom'

function AdminDashboard() {
  return (
    <main className="main-content">
      {/* =====================================================
          ADMIN INTRO
      ===================================================== */}

      <section className="page-intro">
        <p className="eyebrow">
          ADMINISTRATION
        </p>

        <h1>
          Admin Dashboard
        </h1>

        <p className="page-description">
          Manage courses, modules, training content,
          quizzes, learners, instructors, and certificates.
        </p>
      </section>

      {/* =====================================================
          ADMIN MANAGEMENT
      ===================================================== */}

      <section className="course-placeholder">
        <p className="eyebrow">
          MANAGEMENT
        </p>

        <div className="course-list">

            {/* -------------------------------------------------
              INSTRUCTORS
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              01
            </p>

            <h3>
              Instructors
            </h3>

            <p>
              Create and manage instructor accounts
              for the training platform.
            </p>

            <Link
              to="/admin/instructors"
              className="auth-button"
            >
              Manage Instructors
            </Link>
          </article>

          {/* -------------------------------------------------
              COURSES
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              02
            </p>

            <h3>
              Courses
            </h3>

            <p>
              Create, update, and manage training
              courses.
            </p>

            <Link
              to="/admin/courses"
              className="auth-button"
            >
              Manage Courses
            </Link>
          </article>

          {/* -------------------------------------------------
              MODULES
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              03
            </p>

            <h3>
              Modules
            </h3>

            <p>
              Manage modules that belong to your
              courses.
            </p>

            <Link
              to="/admin/modules"
              className="auth-button"
            >
              Manage Modules
            </Link>
          </article>

          {/* -------------------------------------------------
              TRAINING CONTENT
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              04
            </p>

            <h3>
              Training Content
            </h3>

            <p>
              Add and manage text and video training
              content.
            </p>

            <Link
              to="/admin/content"
              className="auth-button"
            >
              Manage Content
            </Link>
          </article>

          {/* -------------------------------------------------
              QUIZZES
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              05
            </p>

            <h3>
              Quizzes
            </h3>

            <p>
              Create quizzes and manage their
              questions and answers.
            </p>

            <Link
              to="/admin/quizzes"
              className="auth-button"
            >
              Manage Quizzes
            </Link>
          </article>

          {/* -------------------------------------------------
              LEARNERS
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              06
            </p>

            <h3>
              Learners
            </h3>

            <p>
              Manage learner course assignments
              and access.
            </p>

            <Link
              to="/admin/learners"
              className="auth-button"
            >
              Manage Learners
            </Link>
          </article>

          {/* -------------------------------------------------
              PROGRESS
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              07
            </p>

            <h3>
              Progress
            </h3>

            <p>
              View learner module progress and quiz
              attempts.
            </p>

            <Link
              to="/admin/progress"
              className="auth-button"
            >
              View Progress
            </Link>
          </article>

          {/* -------------------------------------------------
              CERTIFICATES
          ------------------------------------------------- */}

          <article className="course-card">
            <p className="eyebrow">
              08
            </p>

            <h3>
              Certificates
            </h3>

            <p>
              View completed courses and issued
              certificates.
            </p>

            <Link
              to="/admin/certificates"
              className="auth-button"
            >
              View Certificates
            </Link>
          </article>

          

        </div>
      </section>

      {/* =====================================================
          BACK
      ===================================================== */}

      
    </main>
  )
}

export default AdminDashboard