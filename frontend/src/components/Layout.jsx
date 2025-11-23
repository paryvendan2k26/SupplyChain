import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Layout({ children, role }) {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    // Fetch user info
    axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setUser(res.data)
    }).catch(() => {
      localStorage.removeItem('token')
      navigate('/login')
    })
  }, [token, navigate])

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  function getDashboardPath(userRole) {
    const roleMap = {
      manufacturer: '/manufacturer',
      distributor: '/distributor',
      warehouse: '/warehouse',
      retailer: '/retailer'
    }
    return roleMap[userRole] || '/manufacturer'
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-bg">
      {/* Navigation Bar */}
      <nav className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={user ? getDashboardPath(user.role) : '/'} className="text-xl font-semibold text-primary">
              SupplyChain
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              {user && (
                <>
                  <Link 
                    to={getDashboardPath(user.role)} 
                    className="text-secondary hover:text-primary text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/verify" 
                    className="text-secondary hover:text-primary text-sm font-medium transition-colors"
                  >
                    Verify Product
                  </Link>
                  
                  {/* User Info */}
                  <div className="flex items-center gap-3 pl-3 border-l border-border">
                    <div className="text-right">
                      <div className="text-sm font-medium text-text">{user.name || 'User'}</div>
                      <div className="text-xs text-text-light capitalize">{user.role}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-1.5 text-sm text-secondary hover:text-primary hover:bg-bg rounded-md transition-colors border border-border hover:border-accent"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

