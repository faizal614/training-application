import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'


// =========================================================
// API BASE URL
// =========================================================

const API_BASE_URL =
  'http://127.0.0.1:8000'


// =========================================================
// SIGN IN
// =========================================================

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


  // =========================================================
  // CHECK SESSION EXPIRATION
  // =========================================================

  useEffect(() => {
    if (location.state?.sessionExpired) {
      setSessionExpired(true)

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      )
    }
  }, [location])


  // =========================================================
  // GOOGLE SIGN IN
  // =========================================================

  const handleGoogleSignIn = () => {
    setError('')

    window.location.href =
      `${API_BASE_URL}/auth/google/login`
  }


  // =========================================================
  // NORMAL SIGN IN
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSessionExpired(false)
    setLoading(true)

    try {

      // =====================================================
      // SIGN IN
      // =====================================================

      const response = await fetch(
        `${API_BASE_URL}/auth/signin`,
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

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Sign in failed'
        )
      }


      // =====================================================
      // STORE TOKEN
      // =====================================================

      login(
        data.access_token
      )


      // =====================================================
      // GET CURRENT USER
      // =====================================================

      const meResponse =
        await fetch(
          `${API_BASE_URL}/auth/me`,
          {
            headers: {
              Authorization:
                `Bearer ${data.access_token}`,
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


      // =====================================================
      // ROLE-BASED REDIRECT
      // =====================================================

      if (
        userData.role === 'admin'
      ) {
        navigate('/admin')
        return
      }


      if (
        userData.role === 'instructor'
      ) {
        navigate('/instructor')
        return
      }


      if (
        userData.role === 'learner'
      ) {
        navigate('/courses')
        return
      }


      // =====================================================
      // UNKNOWN ROLE
      // =====================================================

      throw new Error(
        'Your account has an invalid user role.'
      )

    } catch (error) {

      setError(
        error.message
      )

    } finally {

      setLoading(false)

    }
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      className="auth-page"
      style={{
        /*
         * Keep the authentication page below
         * the application header.
         */
        minHeight:
          'calc(100vh - 71px)',

        height:
          'calc(100vh - 71px)',

        boxSizing:
          'border-box',

        /*
         * Prevent scrolling on the sign-in page.
         */
        overflow:
          'hidden',

        /*
         * Center the complete authentication
         * container.
         */
        display:
          'flex',

        justifyContent:
          'center',

        alignItems:
          'center',

        /*
         * Horizontal breathing room.
         */
        padding:
          '16px 24px',

        /*
         * Header height.
         */
        marginTop:
          '71px',
      }}
    >

      {/* =====================================================
          AUTH CONTAINER
      ===================================================== */}

      <div
        className="auth-container"
        style={{
          width:
            '100%',

          maxWidth:
            '480px',

          boxSizing:
            'border-box',

          margin:
            '0 auto',
        }}
      >

        {/* ===================================================
            EYEBROW
        =================================================== */}

        <p
          className="eyebrow"
          style={{
            margin:
              '0 0 6px',
          }}
        >
          DATACALIPER TRAINING
        </p>


        {/* ===================================================
            TITLE
        =================================================== */}

        <h1
          style={{
            margin:
              '0 0 8px',

            fontSize:
              '52px',

            lineHeight:
              '1',
          }}
        >
          Sign in
        </h1>


        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        <p
          className="auth-description"
          style={{
            margin:
              '0 0 18px',
          }}
        >
          Continue your learning journey.
        </p>


        {/* ===================================================
            SESSION EXPIRED
        =================================================== */}

        {sessionExpired && (
          <div
            className="auth-error"
            style={{
              marginBottom:
                '10px',
            }}
          >
            Session expired.
            Please sign in again.
          </div>
        )}


        {/* ===================================================
            GOOGLE SSO
        =================================================== */}

        <button
          type="button"
          onClick={
            handleGoogleSignIn
          }
          className="auth-button"
          style={{
            width:
              '100%',

            marginBottom:
              '12px',

            boxSizing:
              'border-box',
          }}
        >
          Sign in with Google
        </button>


        {/* ===================================================
            OR DIVIDER
        =================================================== */}

        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              '12px',

            marginBottom:
              '12px',

            color:
              '#666',

            fontSize:
              '12px',
          }}
        >

          {/* LEFT LINE */}

          <div
            style={{
              flex:
                '1',

              height:
                '1px',

              background:
                '#ddd',
            }}
          />

          {/* OR */}

          <span>
            OR
          </span>

          {/* RIGHT LINE */}

          <div
            style={{
              flex:
                '1',

              height:
                '1px',

              background:
                '#ddd',
            }}
          />

        </div>


        {/* ===================================================
            EMAIL / PASSWORD FORM
        =================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="auth-form"
          style={{
            gap:
              '7px',
          }}
        >

          {/* -------------------------------------------------
              EMAIL
          ------------------------------------------------- */}

          <label
            htmlFor="email"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
          />


          {/* -------------------------------------------------
              PASSWORD
          ------------------------------------------------- */}

          <label
            htmlFor="password"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />


          {/* -------------------------------------------------
              ERROR
          ------------------------------------------------- */}

          {error && (
            <p
              className="auth-error"
              style={{
                margin:
                  '4px 0',
              }}
            >
              {error}
            </p>
          )}


          {/* -------------------------------------------------
              SIGN IN BUTTON
          ------------------------------------------------- */}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
            style={{
              width:
                '100%',

              marginTop:
                '4px',

              boxSizing:
                'border-box',
            }}
          >
            {loading
              ? 'Signing in...'
              : 'Sign in'}
          </button>

        </form>


        {/* ===================================================
            SIGN UP
        =================================================== */}

        <p
          className="auth-footer"
          style={{
            marginTop:
              '10px',

            marginBottom:
              '0',
          }}
        >
          Don't have an account?{' '}

          <Link
            to="/signup"
          >
            Create one
          </Link>
        </p>

      </div>

    </div>
  )
}


export default SignIn