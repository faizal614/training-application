import { useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function InstructorManagement() {
  const {
    token,
    isAuthenticated,
    handleSessionExpired,
  } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCreateInstructor = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!isAuthenticated || !token) {
      setError(
        'Please sign in as an administrator.'
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

      setSuccess(
        `Instructor ${data.name} was created successfully.`
      )

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
    <section className="admin-section">

      <p className="eyebrow">
        INSTRUCTOR MANAGEMENT
      </p>

      <h2>
        Create Instructor
      </h2>

      <p className="admin-description">
        Create an instructor account that can
        manage training courses and content.
      </p>

      {error && (
        <p className="auth-error">
          {error}
        </p>
      )}

      {success && (
        <p className="admin-success">
          {success}
        </p>
      )}

      <form
        onSubmit={handleCreateInstructor}
        className="admin-form"
      >

        <label htmlFor="instructor-name">
          Name
        </label>

        <input
          id="instructor-name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Instructor name"
          required
        />

        <label htmlFor="instructor-email">
          Email
        </label>

        <input
          id="instructor-email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="instructor@example.com"
          required
        />

        <label htmlFor="instructor-password">
          Password
        </label>

        <input
          id="instructor-password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="Temporary password"
          required
        />

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

    </section>
  )
}

export default InstructorManagement