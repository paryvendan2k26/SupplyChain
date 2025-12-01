import { useEffect, useState } from 'react'
import axios from 'axios'

export default function QRAccessManager({ userRole }) {
  const [qrRequests, setQrRequests] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [batchId, setBatchId] = useState('')
  const [manufacturerId, setManufacturerId] = useState('')
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem('token')

  async function fetchQRAccessRequests() {
    try {
      const { data } = await axios.get(import.meta.env.VITE_API_URL + '/api/qr-access/requests', {
        headers: { Authorization: 'Bearer ' + token }
      })
      setQrRequests(data)
    } catch (e) {
      console.error('Error fetching QR requests:', e)
    }
  }

  async function fetchManufacturers() {
    try {
      const { data } = await axios.get(import.meta.env.VITE_API_URL + '/api/auth/users', {
        headers: { Authorization: 'Bearer ' + token }
      })
      setManufacturers(data.filter(u => u.role === 'manufacturer'))
    } catch (e) {
      console.error('Error fetching manufacturers:', e)
    }
  }

  useEffect(() => {
    if (userRole === 'manufacturer') {
      fetchQRAccessRequests()
    } else if (userRole === 'retailer') {
      fetchManufacturers()
    }
  }, [userRole])

  async function requestQRAccess() {
    if (!batchId || !manufacturerId) {
      alert('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/api/qr-access/request',
        { batchId, manufacturerId },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      alert('QR access requested!')
      setBatchId('')
      setManufacturerId('')
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  async function grantQRAccess(requestId, status) {
    setLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/qr-access/${requestId}/grant`,
        { status },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      alert(`QR access ${status}`)
      fetchQRAccessRequests()
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  if (userRole === 'manufacturer') {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">QR Access Requests</h2>
        {qrRequests.length === 0 ? (
          <p className="text-gray-600 text-sm">No pending requests</p>
        ) : (
          <div className="space-y-2">
            {qrRequests.map(req => (
              <div key={req._id} className="border p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{req.retailer?.name} ({req.retailer?.companyName})</div>
                    <div className="text-sm text-gray-600">Batch: {req.batchId}</div>
                  </div>
                  {req.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => grantQRAccess(req._id, 'approved')}
                        disabled={loading}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => grantQRAccess(req._id, 'rejected')}
                        disabled={loading}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2 py-1 rounded text-sm ${req.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (userRole === 'retailer') {
    return (
      <div className="bg-white p-4 rounded shadow space-y-3">
        <h2 className="font-semibold">Request QR Access</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Batch ID</label>
          <input
            className="w-full border p-2 rounded"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            placeholder="BATCH_..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Manufacturer</label>
          <select
            className="w-full border p-2 rounded"
            value={manufacturerId}
            onChange={e => setManufacturerId(e.target.value)}
          >
            <option value="">Select manufacturer...</option>
            {manufacturers.map(m => (
              <option key={m._id} value={m._id}>{m.name} ({m.companyName})</option>
            ))}
          </select>
        </div>
        <button
          onClick={requestQRAccess}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Requesting...' : 'Request QR Access'}
        </button>
      </div>
    )
  }

  return null
}

