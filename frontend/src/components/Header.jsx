import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header() {
  const {
    isAuthenticated,
    logout,
  } = useAuth()

  return (
    <header className="site-header">
      <div className="site-header__brand">
        DATACALIPER
        <span>TRAINING</span>
      </div>

      <div className="site-header__right">
        <div className="site-header__status">
          EARLY CAREER
        </div>

        {isAuthenticated && (
          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  )
}

export default Header