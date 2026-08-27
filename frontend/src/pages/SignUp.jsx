import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function SignUp() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // =========================================================
  // SIGN UP
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/auth/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Sign up failed'
        )
      }

      // -------------------------------------------------------
      // DO NOT LOG THE USER IN AUTOMATICALLY
      // -------------------------------------------------------
      //
      // The user must sign in after creating the account.
      // Therefore, we do NOT save access_token here.
      //

      // -------------------------------------------------------
      // GO TO SIGN IN
      // -------------------------------------------------------

      navigate('/signin')

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="auth-page">

      <div className="auth-container">

        <p className="eyebrow">
          DATACALIPER TRAINING
        </p>

        <h1>
          Create account
        </h1>

        <p className="auth-description">
          Create your learner account and start learning.
        </p>

        {/* ===================================================
            SIGN UP FORM
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          {/* -------------------------------------------------
              NAME
          ------------------------------------------------- */}

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
            placeholder="Your name"
            required
          />

          {/* -------------------------------------------------
              EMAIL
          ------------------------------------------------- */}

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

          {/* -------------------------------------------------
              PASSWORD
          ------------------------------------------------- */}

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
          />

          {/* -------------------------------------------------
              ERROR
          ------------------------------------------------- */}

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          {/* -------------------------------------------------
              SUBMIT
          ------------------------------------------------- */}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Creating account...'
              : 'Create account'}
          </button>

        </form>

        {/* ===================================================
            SIGN IN LINK
        =================================================== */}

        <p className="auth-footer">

          Already have an account?{' '}

          <Link to="/signin">
            Sign in
          </Link>

        </p>

      </div>

    </div>
  )
}

export default SignUp