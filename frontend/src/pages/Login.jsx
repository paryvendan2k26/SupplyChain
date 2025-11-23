import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const { data } = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/login', { 
        email, 
        password 
      })
      
      localStorage.setItem('token', data.token)
      
      // Redirect based on role
      const roleMap = {
        manufacturer: '/manufacturer',
        distributor: '/distributor',
        warehouse: '/warehouse',
        retailer: '/retailer'
      }
      
      navigate(roleMap[data.user.role] || '/manufacturer')
    } catch (e) {
      setError(e?.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface rounded-lg shadow-sm border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-text mb-2">Welcome Back</h1>
            <p className="text-sm text-text-light">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text placeholder-text-light"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text placeholder-text-light"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 px-4 rounded-md font-medium hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-light">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-secondary font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-text-light hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
