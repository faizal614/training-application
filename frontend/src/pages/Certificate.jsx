import { Link, useParams } from 'react-router-dom'

function Certificate() {
  const { certificateNumber } = useParams()

  return (
    <main className="main-content">
      <section className="page-intro">
        <p className="eyebrow">
          CERTIFICATE
        </p>

        <h1>Certificate</h1>

        <p className="page-description">
          Certificate Number: {certificateNumber}
        </p>
      </section>

      <section className="course-placeholder">
        <h2>Certificate View</h2>

        <p>
          Certificate details will be displayed here.
        </p>

        <p>
          <Link to="/courses">
            ← Back to courses
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Certificate