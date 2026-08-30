import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../utils/api'

function Certificates() {
  // ---------------------------------------------------------
  // DATA
  // ---------------------------------------------------------

  const [certificates, setCertificates] = useState([])

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  const [loading, setLoading] = useState(true)

  // ---------------------------------------------------------
  // MESSAGES
  // ---------------------------------------------------------

  const [error, setError] = useState('')

  // ---------------------------------------------------------
  // VIEW STATE
  // ---------------------------------------------------------

  const [openCertificate, setOpenCertificate] =
    useState(null)

  // ---------------------------------------------------------
  // LOAD CERTIFICATES
  // ---------------------------------------------------------

  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await apiFetch(
        '/admin/certificates'
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to load certificates'
        )
      }

      setCertificates(
        Array.isArray(data) ? data : []
      )
    } catch (err) {
      setError(err.message)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // FORMAT DATE
  // ---------------------------------------------------------

  const formatDate = (date) => {
    if (!date) {
      return '—'
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString()
  }

  // ---------------------------------------------------------
  // TOGGLE CERTIFICATE
  // ---------------------------------------------------------

  const toggleCertificate = (certificateId) => {
    setOpenCertificate((current) =>
      current === certificateId
        ? null
        : certificateId
    )
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div
      style={{
        maxWidth: '1140px',
        margin: '0 auto',
        padding: '40px 0 80px',
      }}
    >
      {/* ---------------------------------------------------
          PAGE HEADER
      --------------------------------------------------- */}

      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '12px',
            letterSpacing: '4px',
            marginBottom: '12px',
          }}
        >
          08
        </div>

        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            fontWeight: '400',
            margin: '0 0 10px',
          }}
        >
          Certificates
        </h1>

        <p
          style={{
            fontSize: '17px',
            color: '#555',
            margin: 0,
          }}
        >
          View completed courses and issued certificates.
        </p>
      </div>

      {/* ---------------------------------------------------
          ERROR
      --------------------------------------------------- */}

      {error && (
        <div
          style={{
            border: '1px solid red',
            background: '#fff5f5',
            color: 'red',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* ---------------------------------------------------
          CERTIFICATE COUNT
      --------------------------------------------------- */}

      {!loading && !error && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
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
            Issued Certificates
          </h2>

          <span>
            {certificates.length}{' '}
            {certificates.length === 1
              ? 'certificate'
              : 'certificates'}
          </span>
        </div>
      )}

      {/* ---------------------------------------------------
          LOADING
      --------------------------------------------------- */}

      {loading && (
        <p>Loading certificates...</p>
      )}

      {/* ---------------------------------------------------
          NO CERTIFICATES
      --------------------------------------------------- */}

      {!loading &&
        !error &&
        certificates.length === 0 && (
          <div
            style={{
              border: '1px solid #ccc',
              padding: '30px',
            }}
          >
            No certificates have been issued yet.
          </div>
        )}

      {/* ---------------------------------------------------
          CERTIFICATES
      --------------------------------------------------- */}

      {!loading &&
        !error &&
        certificates.length > 0 && (
          <section>
            {certificates.map((certificate) => {
              const isOpen =
                openCertificate === certificate.id

              return (
                <div
                  key={certificate.id}
                  style={{
                    border: '1px solid #222',
                    marginBottom: '16px',
                  }}
                >
                  {/* ------------------------------------------------
                      COLLAPSED CERTIFICATE HEADER
                  ------------------------------------------------ */}

                  <div
                    style={{
                      padding: '24px',
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      gap: '30px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          letterSpacing: '3px',
                          marginBottom: '8px',
                        }}
                      >
                        CERTIFICATE
                      </div>

                      <h3
                        style={{
                          fontFamily:
                            'Georgia, serif',
                          fontSize: '28px',
                          fontWeight: '400',
                          margin: '0 0 8px',
                        }}
                      >
                        {
                          certificate.course_name
                        }
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: '#555',
                        }}
                      >
                        <strong>
                          Learner:
                        </strong>{' '}
                        {
                          certificate.learner_name
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleCertificate(
                          certificate.id
                        )
                      }
                      style={{
                        background: '#111',
                        color: '#fff',
                        border: '1px solid #111',
                        padding: '13px 20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isOpen
                        ? 'Hide Certificate'
                        : 'View Certificate'}
                    </button>
                  </div>

                  {/* ------------------------------------------------
                      CERTIFICATE DETAILS
                  ------------------------------------------------ */}

                  {isOpen && (
                    <div
                      style={{
                        borderTop:
                          '1px solid #ddd',
                        padding: '30px 24px',
                        background: '#fafafa',
                      }}
                    >
                      <div
                        style={{
                          border:
                            '1px solid #222',
                          background: '#fff',
                          padding: '40px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            letterSpacing: '4px',
                            marginBottom: '18px',
                          }}
                        >
                          DATACALIPER TRAINING
                        </div>

                        <h3
                          style={{
                            fontFamily:
                              'Georgia, serif',
                            fontSize: '38px',
                            fontWeight: '400',
                            margin:
                              '0 0 25px',
                          }}
                        >
                          Certificate of Completion
                        </h3>

                        <p
                          style={{
                            margin:
                              '0 0 10px',
                            color: '#555',
                          }}
                        >
                          This certificate is proudly
                          presented to
                        </p>

                        <div
                          style={{
                            fontFamily:
                              'Georgia, serif',
                            fontSize: '30px',
                            margin:
                              '15px 0 25px',
                          }}
                        >
                          {
                            certificate.learner_name
                          }
                        </div>

                        <p
                          style={{
                            margin:
                              '0 0 10px',
                            color: '#555',
                          }}
                        >
                          for successfully completing
                        </p>

                        <div
                          style={{
                            fontFamily:
                              'Georgia, serif',
                            fontSize: '25px',
                            margin:
                              '15px 0 30px',
                          }}
                        >
                          {
                            certificate.course_name
                          }
                        </div>

                        {/* ----------------------------------------
                            CERTIFICATE INFORMATION
                        ---------------------------------------- */}

                        <div
                          style={{
                            borderTop:
                              '1px solid #ddd',
                            paddingTop: '25px',
                            display: 'grid',
                            gridTemplateColumns:
                              '1fr 1fr',
                            gap: '20px',
                            textAlign: 'left',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '11px',
                                letterSpacing:
                                  '2px',
                                marginBottom:
                                  '6px',
                              }}
                            >
                              LEARNER EMAIL
                            </div>

                            <div>
                              {
                                certificate.learner_email
                              }
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: '11px',
                                letterSpacing:
                                  '2px',
                                marginBottom:
                                  '6px',
                              }}
                            >
                              FINAL SCORE
                            </div>

                            <div>
                              {
                                certificate.final_score
                              }%
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: '11px',
                                letterSpacing:
                                  '2px',
                                marginBottom:
                                  '6px',
                              }}
                            >
                              COMPLETION DATE
                            </div>

                            <div>
                              {formatDate(
                                certificate.completion_date
                              )}
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: '11px',
                                letterSpacing:
                                  '2px',
                                marginBottom:
                                  '6px',
                              }}
                            >
                              CERTIFICATE NUMBER
                            </div>

                            <div>
                              {
                                certificate.certificate_number
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )}

      {/* ---------------------------------------------------
          BACK
      --------------------------------------------------- */}

      <div style={{ marginTop: '30px' }}>
        <Link to="/admin">
          ← Back to Admin Dashboard
        </Link>
      </div>
    </div>
  )
}

export default Certificates