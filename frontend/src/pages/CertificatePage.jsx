import { useEffect, useState } from 'react'
import {
  Link,
  useParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'

function CertificatePage() {
  const { courseId } = useParams()

  const {
    token,
    handleSessionExpired,
  } = useAuth()

  const [certificate, setCertificate] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // =========================================================
  // LOAD CERTIFICATE
  // =========================================================

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        setLoading(true)
        setError('')

        const response =
          await apiFetch(
            '/courses/certificates/me',
            {},
            handleSessionExpired
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.detail ||
              'Failed to load certificate'
          )
        }

        const existingCertificate =
          data.find(
            (item) =>
              item.course_id ===
              Number(courseId)
          )

        if (!existingCertificate) {
          throw new Error(
            'Certificate not found'
          )
        }

        setCertificate(
          existingCertificate
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
        setLoading(false)
      }
    }

    loadCertificate()
  }, [
    courseId,
    token,
    handleSessionExpired,
  ])

  // =========================================================
  // VIEW CERTIFICATE
  // =========================================================

  const handleViewCertificate = async () => {
    try {
      setError('')

      const response =
        await apiFetch(
          `/courses/${courseId}/certificate/download`,
          {},
          handleSessionExpired
        )

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          data.detail ||
            'Failed to view certificate'
        )
      }

      const blob =
        await response.blob()

      const url =
        window.URL.createObjectURL(blob)

      window.open(
        url,
        '_blank'
      )

      setTimeout(() => {
        window.URL.revokeObjectURL(
          url
        )
      }, 60000)
    } catch (error) {
      setError(error.message)
    }
  }

  // =========================================================
  // DOWNLOAD CERTIFICATE
  // =========================================================

  const handleDownloadCertificate =
    async () => {
      try {
        setError('')

        const response =
          await apiFetch(
            `/courses/${courseId}/certificate/download`,
            {},
            handleSessionExpired
          )

        if (!response.ok) {
          const data =
            await response.json()

          throw new Error(
            data.detail ||
              'Failed to download certificate'
          )
        }

        const blob =
          await response.blob()

        const url =
          window.URL.createObjectURL(
            blob
          )

        const link =
          document.createElement('a')

        link.href = url

        link.download =
          `certificate-${certificate.certificate_number}.pdf`

        document.body.appendChild(link)

        link.click()

        link.remove()

        window.URL.revokeObjectURL(
          url
        )
      } catch (error) {
        setError(error.message)
      }
    }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="main-content">
        <p>
          Loading certificate...
        </p>
      </main>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !certificate) {
    return (
      <main className="main-content">

        <p className="auth-error">
          {error ||
            'Certificate not found.'}
        </p>

        <Link
          to={`/courses/${courseId}`}
        >
          ← Back to course
        </Link>

      </main>
    )
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="main-content">

      <section className="page-intro">

        <p className="eyebrow">
          COURSE COMPLETED
        </p>

        <h1>
          Congratulations!
        </h1>

        <p>
          You have successfully completed
          this course.
        </p>

      </section>

      <section className="quiz-result quiz-result--passed">

        <p className="eyebrow">
          YOUR CERTIFICATE
        </p>

        <h2>
          Certificate Available
        </h2>

        <p>
          Participant:{' '}
          <strong>
            {certificate.participant_name}
          </strong>
        </p>

        <p>
          Course:{' '}
          <strong>
            {certificate.course_name}
          </strong>
        </p>

        <p>
          Final Score:{' '}
          <strong>
            {certificate.final_score}%
          </strong>
        </p>

        <p>
          Certificate Number:{' '}
          <strong>
            {
              certificate.certificate_number
            }
          </strong>
        </p>

        <div className="certificate-actions">

          <button
            type="button"
            className="auth-button"
            onClick={
              handleViewCertificate
            }
          >
            View Certificate
          </button>

          <button
            type="button"
            className="auth-button"
            onClick={
              handleDownloadCertificate
            }
          >
            Download Certificate
          </button>

        </div>

      </section>

      <p>
        <Link
          to={`/courses/${courseId}`}
        >
          ← Back to course
        </Link>
      </p>

    </main>
  )
}

export default CertificatePage