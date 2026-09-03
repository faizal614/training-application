import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'


// =========================================================
// GOOGLE CALLBACK
// =========================================================

function GoogleCallback() {

  const navigate =
    useNavigate()

  const {
    login,
  } = useAuth()

  const [error, setError] =
    useState('')


  // =========================================================
  // PROCESS GOOGLE CALLBACK
  // =========================================================

  useEffect(() => {

    const handleGoogleCallback =
      async () => {

        try {

          // =================================================
          // GET TOKEN FROM URL
          // =================================================

          const params =
            new URLSearchParams(
              window.location.search
            )

          const googleToken =
            params.get('token')


          // =================================================
          // CHECK TOKEN
          // =================================================

          if (!googleToken) {

            throw new Error(
              'Google authentication token was not found.'
            )
          }


          // =================================================
          // LOGIN THROUGH AUTH CONTEXT
          // =================================================
          //
          // IMPORTANT:
          //
          // Do NOT directly use:
          //
          // localStorage.setItem(...)
          //
          // We use the same login() function as
          // normal email/password authentication.
          //
          // =================================================

          login(
            googleToken
          )


          // =================================================
          // VERIFY TOKEN AND GET CURRENT USER
          // =================================================

          const response =
            await apiFetch(
              '/auth/me'
            )


          const data =
            await response.json()


          // =================================================
          // CHECK RESPONSE
          // =================================================

          if (!response.ok) {

            throw new Error(
              data.detail ||
                'Unable to verify Google authentication.'
            )
          }


          // =================================================
          // REMOVE TOKEN FROM URL
          // =================================================
          //
          // This prevents the JWT from remaining visible
          // in the browser address bar.
          //
          // =================================================

          window.history.replaceState(
            {},
            document.title,
            '/google-callback'
          )


          // =================================================
          // GET ROLE
          // =================================================
          //
          // Your backend normally returns:
          //
          // admin
          // instructor
          // learner
          //
          // Normalize it so this continues working even
          // if the backend returns uppercase values.
          //
          // =================================================

          const role =
            String(
              data.role || ''
            ).toLowerCase()


          // =================================================
          // ADMIN
          // =================================================

          if (
            role === 'admin'
          ) {

            navigate(
              '/admin',
              {
                replace: true,
              }
            )

            return
          }


          // =================================================
          // INSTRUCTOR
          // =================================================

          if (
            role === 'instructor'
          ) {

            navigate(
              '/instructor',
              {
                replace: true,
              }
            )

            return
          }


          // =================================================
          // LEARNER
          // =================================================

          if (
            role === 'learner'
          ) {

            navigate(
              '/courses',
              {
                replace: true,
              }
            )

            return
          }


          // =================================================
          // UNKNOWN ROLE
          // =================================================

          throw new Error(
            'Your account has an invalid user role.'
          )

        } catch (error) {

          console.error(
            'Google callback failed:',
            error
          )


          // -------------------------------------------------
          // REMOVE INVALID TOKEN
          // -------------------------------------------------

          localStorage.removeItem(
            'access_token'
          )


          // -------------------------------------------------
          // SHOW ERROR
          // -------------------------------------------------

          setError(
            error.message ||
              'Google authentication failed.'
          )
        }
      }


    handleGoogleCallback()

  }, [
    login,
    navigate,
  ])


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main
      className="main-content"
    >

      <section
        className="page-intro"
      >

        {!error ? (

          <>
            <p
              className="eyebrow"
            >
              GOOGLE SIGN-IN
            </p>

            <h1>
              Signing you in...
            </h1>

            <p
              className="page-description"
            >
              Please wait while we complete
              your Google authentication.
            </p>
          </>

        ) : (

          <>
            <p
              className="eyebrow"
            >
              GOOGLE SIGN-IN
            </p>

            <h1>
              Sign-in failed
            </h1>

            <p
              className="auth-error"
            >
              {error}
            </p>

            <button
              type="button"
              className="auth-button"
              onClick={() =>
                navigate(
                  '/signin',
                  {
                    replace: true,
                  }
                )
              }
            >
              Back to sign in
            </button>
          </>

        )}

      </section>

    </main>
  )
}


export default GoogleCallback