import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function CreateInstructor() {
  const navigate = useNavigate()

  const {
    isAuthenticated,
    token,
    handleSessionExpired,
  } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess(null)

    if (!isAuthenticated || !token) {
      setError(
        'Please sign in as an admin to create an instructor.'
      )
      return
    }

    try {
      setLoading(true)

      const params = new URLSearchParams({
        name,
        email,
        password,
      })

      const response = await apiFetch(
        `/admin/instructors?${params.toString()}`,
        {
          method: 'POST',
        },
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Failed to create instructor'
        )
      }

      setSuccess(data)

      setName('')
      setEmail('')
      setPassword('')
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

  return (
    <main className="main-content">

      <section className="page-intro">
        <p className="eyebrow">
          ADMINISTRATION / INSTRUCTORS / CREATE INSTRUCTORS
        </p>

        <h1>
          Create Instructor
        </h1>

        <p className="page-description">
          Create a new instructor account for the
          training platform.
        </p>
      </section>

      <section className="course-placeholder">

        <p className="eyebrow">
          INSTRUCTOR ACCOUNT
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          <label htmlFor="name">
            Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Instructor name"
            required
          />

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="instructor@example.com"
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Create a password"
            required
            minLength={6}
          />

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          {success && (
            <div className="quiz-result quiz-result--passed">

              <p className="eyebrow">
                INSTRUCTOR CREATED
              </p>

              <h2>
                Instructor account created
              </h2>

              <p>
                Name:{' '}
                <strong>
                  {success.name}
                </strong>
              </p>

              <p>
                Email:{' '}
                <strong>
                  {success.email}
                </strong>
              </p>

              <p>
                Role:{' '}
                <strong>
                  {success.role}
                </strong>
              </p>

            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Creating Instructor...'
              : 'Create Instructor'}
          </button>

        </form>

        <p>
          <Link to="/admin/instructors/manage">
            ← Back to instructor management
          </Link>
        </p>

      </section>

    </main>
  )
}

export default CreateInstructor