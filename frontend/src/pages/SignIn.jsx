import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()

  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [sessionExpired, setSessionExpired] =
    useState(false)

  // -------------------------
  // CHECK SESSION EXPIRATION
  // -------------------------

  useEffect(() => {
    if (location.state?.sessionExpired) {
      setSessionExpired(true)

      // Remove the state so refreshing the page
      // does not repeatedly show the message.
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      )
    }
  }, [location])

  // -------------------------
  // SIGN IN
  // -------------------------

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSessionExpired(false)
    setLoading(true)

    try {
      // -------------------------
      // SIGN IN
      // -------------------------

      const response = await fetch(
        'http://127.0.0.1:8000/auth/signin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Sign in failed'
        )
      }

      // -------------------------
      // STORE TOKEN
      // -------------------------

      login(data.access_token)

      // -------------------------
      // GET CURRENT USER
      // -------------------------

      const meResponse = await fetch(
        'http://127.0.0.1:8000/auth/me',
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      )

      const userData =
        await meResponse.json()

      if (!meResponse.ok) {
        throw new Error(
          userData.detail ||
            'Failed to load user information'
        )
      }

      // -------------------------
      // ROLE-BASED REDIRECT
      // -------------------------

      if (userData.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/courses')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">

        <p className="eyebrow">
          DATACALIPER TRAINING
        </p>

        <h1>
          Sign in
        </h1>

        <p className="auth-description">
          Continue your learning journey.
        </p>

        {sessionExpired && (
          <div className="auth-error">
            Session expired. Please sign in again.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
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
            placeholder="you@example.com"
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
            placeholder="Enter your password"
            required
          />

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}

          <Link to="/signup">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}

export default SignIn