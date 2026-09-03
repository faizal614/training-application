import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'


// =========================================================
// AUTH CONTEXT
// =========================================================

const AuthContext = createContext(null)


// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  // -------------------------------------------------------
  // LOAD TOKEN FROM LOCAL STORAGE
  // -------------------------------------------------------

  const [token, setToken] = useState(
    () =>
      localStorage.getItem(
        'access_token'
      )
  )

  const [sessionExpired, setSessionExpired] =
    useState(false)


  // =======================================================
  // AUTHENTICATION STATE
  // =======================================================

  const isAuthenticated =
    Boolean(token)


  // =======================================================
  // LOGIN
  // =======================================================
  //
  // Used by:
  //
  // 1. Email/password sign in
  // 2. Google SSO callback
  //
  // Both authentication methods therefore
  // create exactly the same frontend state.
  //
  // =======================================================

  const login = (accessToken) => {

    if (!accessToken) {
      return
    }

    localStorage.setItem(
      'access_token',
      accessToken
    )

    setToken(
      accessToken
    )

    setSessionExpired(
      false
    )
  }


  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = () => {

    localStorage.removeItem(
      'access_token'
    )

    setToken(null)

    setSessionExpired(
      false
    )

    navigate(
      '/signin',
      {
        replace: true,
      }
    )
  }


  // =======================================================
  // SESSION EXPIRED
  // =======================================================

  const handleSessionExpired = () => {

    localStorage.removeItem(
      'access_token'
    )

    setToken(null)

    setSessionExpired(
      true
    )

    navigate(
      '/signin',
      {
        replace: true,

        state: {
          sessionExpired: true,
        },
      }
    )
  }


  // =======================================================
  // CHECK STORED TOKEN
  // =======================================================

  useEffect(() => {

    const storedToken =
      localStorage.getItem(
        'access_token'
      )

    if (!storedToken) {

      setToken(null)

      return
    }

    setToken(
      storedToken
    )

  }, [])


  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value = {
    token,
    isAuthenticated,
    sessionExpired,

    login,
    logout,
    handleSessionExpired,
  }


  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}


// =========================================================
// USE AUTH
// =========================================================

export function useAuth() {

  const context =
    useContext(
      AuthContext
    )

  if (!context) {

    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}