import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    walletAddress: '',
    role: 'manufacturer'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const { data } = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/register', formData)
      
      localStorage.setItem('token', data.token)
      
      // Redirect based on role
      const roleMap = {
        manufacturer: '/manufacturer',
        distributor: '/distributor',
        warehouse: '/warehouse',
        retailer: '/retailer'
      }
      
      navigate(roleMap[formData.role] || '/manufacturer')
    } catch (e) {
      setError(e?.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-surface rounded-lg shadow-sm border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-text mb-2">Create Account</h1>
            <p className="text-sm text-text-light">Join the supply chain network</p>
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
              <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text placeholder-text-light"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-text mb-1.5">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text placeholder-text-light"
                placeholder="Acme Corporation (optional)"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
                Email Address <span className="text-error">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text placeholder-text-light"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
                Password <span className="text-error">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text placeholder-text-light"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-text mb-1.5">
                Wallet Address <span className="text-error">*</span>
              </label>
              <input
                id="walletAddress"
                name="walletAddress"
                type="text"
                required
                value={formData.walletAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text placeholder-text-light font-mono text-sm"
                placeholder="0x..."
              />
              <p className="mt-1 text-xs text-text-light">Your Ethereum wallet address for blockchain transactions</p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text mb-1.5">
                Role <span className="text-error">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="warehouse">Warehouse</option>
                <option value="retailer">Retailer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 px-4 rounded-md font-medium hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-light">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-secondary font-medium">
                Sign In
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
