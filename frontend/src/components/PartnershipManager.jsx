import { useEffect, useState } from 'react'
import axios from 'axios'

export default function PartnershipManager() {
  const [partnerships, setPartnerships] = useState([])
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem('token')

  async function fetchData() {
    try {
      const [partnershipsRes, requestsRes, usersRes] = await Promise.all([
        axios.get(import.meta.env.VITE_API_URL + '/api/partnerships/list', {
          headers: { Authorization: 'Bearer ' + token }
        }),
        axios.get(import.meta.env.VITE_API_URL + '/api/partnerships/requests', {
          headers: { Authorization: 'Bearer ' + token }
        }),
        axios.get(import.meta.env.VITE_API_URL + '/api/auth/users', {
          headers: { Authorization: 'Bearer ' + token }
        })
      ])
      setPartnerships(partnershipsRes.data)
      setRequests(requestsRes.data)
      setUsers(usersRes.data)
    } catch (e) {
      console.error('Error fetching partnerships:', e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function requestPartnership(receiverId) {
    setLoading(true)
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/api/partnerships/request',
        { receiverId },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      alert('Partnership requested!')
      fetchData()
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  async function respondToRequest(requestId, status) {
    setLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/partnerships/${requestId}/accept`,
        { status },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      alert(`Partnership ${status}`)
      fetchData()
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Pending Partnership Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600 text-sm">No pending requests</p>
        ) : (
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req._id} className="border p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{req.sender?.name} ({req.sender?.companyName})</div>
                    <div className="text-sm text-gray-600">{req.sender?.role}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToRequest(req._id, 'accepted')}
                      disabled={loading}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToRequest(req._id, 'rejected')}
                      disabled={loading}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Partnerships */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">My Partnerships</h2>
        {partnerships.filter(p => p.status === 'accepted').length === 0 ? (
          <p className="text-gray-600 text-sm">No active partnerships</p>
        ) : (
          <div className="space-y-2">
            {partnerships.filter(p => p.status === 'accepted').map(p => (
              <div key={p._id} className="border p-3 rounded">
                <div className="font-medium">
                  {p.receiver?.name || p.sender?.name} ({p.receiver?.companyName || p.sender?.companyName})
                </div>
                <div className="text-sm text-gray-600">{p.receiver?.role || p.sender?.role}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Partnership */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Request Partnership</h2>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user._id} className="border p-3 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{user.name} ({user.companyName})</div>
                <div className="text-sm text-gray-600">{user.role}</div>
              </div>
              <button
                onClick={() => requestPartnership(user._id)}
                disabled={loading}
                className="bg-primary text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Request
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

