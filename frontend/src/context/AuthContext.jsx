import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [token, setToken] = useState(
    () => localStorage.getItem('access_token')
  )

  const [sessionExpired, setSessionExpired] = useState(false)

  const isAuthenticated = Boolean(token)

  // -------------------------
  // SIGN IN
  // -------------------------

  const login = (accessToken) => {
    localStorage.setItem(
      'access_token',
      accessToken
    )

    setToken(accessToken)
    setSessionExpired(false)
  }

  // -------------------------
  // LOGOUT
  // -------------------------

  const logout = () => {
    localStorage.removeItem('access_token')

    setToken(null)
    setSessionExpired(false)

    navigate('/signin')
  }

  // -------------------------
  // SESSION EXPIRED
  // -------------------------

  const handleSessionExpired = () => {
    localStorage.removeItem('access_token')

    setToken(null)
    setSessionExpired(true)

    navigate('/signin', {
      replace: true,
      state: {
        sessionExpired: true,
      },
    })
  }

  // -------------------------
  // CHECK TOKEN
  // -------------------------

  useEffect(() => {
    const storedToken =
      localStorage.getItem('access_token')

    if (!storedToken) {
      setToken(null)
    } else {
      setToken(storedToken)
    }
  }, [])

  const value = {
    token,
    isAuthenticated,
    sessionExpired,
    login,
    logout,
    handleSessionExpired,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}