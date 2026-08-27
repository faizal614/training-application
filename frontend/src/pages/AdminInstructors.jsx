import { Link } from 'react-router-dom'
import InstructorManagement from '../components/admin/InstructorManagement'

function AdminInstructors() {
  return (
    <main className="main-content">

      <section className="page-intro">
        <p className="eyebrow">
          ADMINISTRATION
        </p>

        <h1>
          Instructors
        </h1>

        <p className="page-description">
          Create and manage instructor accounts
          for the training platform.
        </p>
      </section>

      <InstructorManagement />

      <p>
        <Link to="/admin">
          ← Back to admin dashboard
        </Link>
      </p>

    </main>
  )
}

export default AdminInstructors