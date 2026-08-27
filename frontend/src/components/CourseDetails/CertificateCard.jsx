function CertificateCard({
  certificate,
  certificateError,
  onViewCertificate,
  onDownloadCertificate,
}) {
  if (!certificate && !certificateError) {
    return null
  }

  return (
    <>
      {certificateError && (
        <p className="auth-error">
          {certificateError}
        </p>
      )}

      {certificate && (
        <div className="quiz-result quiz-result--passed">
          <p className="eyebrow">
            COURSE COMPLETED
          </p>

          <h3>
            Certificate Generated
          </h3>

          <p>
            Congratulations,{' '}
            <strong>
              {certificate.participant_name}
            </strong>
            !
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
              {certificate.certificate_number}
            </strong>
          </p>

          <div className="certificate-actions">
            <button
              type="button"
              className="auth-button"
              onClick={onViewCertificate}
            >
              View Certificate
            </button>

            <button
              type="button"
              className="auth-button"
              onClick={onDownloadCertificate}
            >
              Download Certificate
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default CertificateCard