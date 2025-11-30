import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'

export default function WarehouseDashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [transferData, setTransferData] = useState({
    productId: '',
    toAddress: '',
    location: '',
    quantity: 1
  })
  const [transferResult, setTransferResult] = useState(null)
  const [batches, setBatches] = useState([])
  const [transferBatchData, setTransferBatchData] = useState({
    batchId: '',
    toAddress: '',
    location: ''
  })
  const [transferBatchLoading, setTransferBatchLoading] = useState(false)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchProducts()
    fetchBatches()
  }, [])

  async function fetchBatches() {
    if (!token) return
    try {
      const { data } = await axios.get(import.meta.env.VITE_API_URL + '/api/products/batch/list', { 
        headers: { Authorization: 'Bearer ' + token } 
      })
      setBatches(data)
    } catch (e) {
      console.error('Error fetching batches:', e)
    }
  }

  async function fetchProducts() {
    if (!token) return
    try {
      const { data } = await axios.get(import.meta.env.VITE_API_URL + '/api/products', { 
        headers: { Authorization: 'Bearer ' + token } 
      })
      setProducts(data)
    } catch (e) {
      console.error('Error fetching products:', e)
    }
  }

  async function handleTransfer(e) {
    e.preventDefault()
    if (!transferData.productId || !transferData.toAddress) {
      alert('Please fill in product ID and recipient address')
      return
    }

    setLoading(true)
    setTransferResult(null)
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/products/${transferData.productId}/transfer`,
        { 
          toAddress: transferData.toAddress, 
          location: transferData.location,
          quantity: parseInt(transferData.quantity) || 1
        },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      setTransferResult(data)
      setTransferData({ productId: '', toAddress: '', location: '', quantity: 1 })
      setTimeout(() => setTransferResult(null), 10000)
      fetchProducts()
    } catch (e) {
      alert('Transfer failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleBatchTransfer(e) {
    e.preventDefault()
    if (!transferBatchData.batchId || !transferBatchData.toAddress) {
      alert('Please fill in batch ID and recipient address')
      return
    }

    if (!confirm(`Transfer entire batch ${transferBatchData.batchId}? This will transfer all products in the batch.`)) {
      return
    }

    setTransferBatchLoading(true)
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/products/batch/${transferBatchData.batchId}/transfer`,
        { 
          toAddress: transferBatchData.toAddress, 
          location: transferBatchData.location
        },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      alert(data.message || 'Batch transferred successfully!')
      setTransferBatchData({ batchId: '', toAddress: '', location: '' })
      fetchProducts()
      fetchBatches()
    } catch (e) {
      alert('Batch transfer failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setTransferBatchLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-text mb-2">Warehouse Dashboard</h1>
          <p className="text-text-light">Manage inventory and product storage</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="text-2xl font-semibold text-text">{products.length}</div>
            <div className="text-sm text-text-light mt-1">Total Products</div>
          </div>
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="text-2xl font-semibold text-text">
              {products.filter(p => p.batchBlockchainId).length}
            </div>
            <div className="text-sm text-text-light mt-1">Batched Products</div>
          </div>
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="text-2xl font-semibold text-text">
              {products.filter(p => !p.batchBlockchainId).length}
            </div>
            <div className="text-sm text-text-light mt-1">Single Products</div>
          </div>
        </div>

        {/* Batch Transfer Form */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Transfer Entire Batch</h2>
          <form onSubmit={handleBatchTransfer} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Batch ID</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text font-mono text-sm"
                  placeholder="Batch ID"
                  value={transferBatchData.batchId}
                  onChange={e => setTransferBatchData({...transferBatchData, batchId: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Recipient Address</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text font-mono text-sm"
                  placeholder="0x..."
                  value={transferBatchData.toAddress}
                  onChange={e => setTransferBatchData({...transferBatchData, toAddress: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Location (Optional)</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                  placeholder="Destination location"
                  value={transferBatchData.location}
                  onChange={e => setTransferBatchData({...transferBatchData, location: e.target.value})}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={transferBatchLoading}
              className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {transferBatchLoading ? 'Transferring Batch...' : 'Transfer Entire Batch'}
            </button>
            <p className="text-xs text-text-light">
              This will transfer all products in the batch to the recipient address
            </p>
          </form>
        </div>

        {/* Transfer Form */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Transfer Product</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Product ID</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text font-mono text-sm"
                  placeholder="Product blockchain ID"
                  value={transferData.productId}
                  onChange={e => setTransferData({...transferData, productId: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Recipient Address</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text font-mono text-sm"
                  placeholder="0x..."
                  value={transferData.toAddress}
                  onChange={e => setTransferData({...transferData, toAddress: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                  placeholder="1"
                  value={transferData.quantity}
                  onChange={e => setTransferData({...transferData, quantity: Math.max(1, Math.min(50, parseInt(e.target.value) || 1))})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Location (Optional)</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                  placeholder="Destination location"
                  value={transferData.location}
                  onChange={e => setTransferData({...transferData, location: e.target.value})}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Transferring...' : `Transfer ${transferData.quantity} Product(s)`}
            </button>
          </form>
          
          {/* Transfer Result with Manufacturer Info */}
          {transferResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-success mb-2">{transferResult.message}</p>
              {transferResult.manufacturer && (
                <div className="text-sm text-text-light">
                  <div className="font-medium text-text mt-2">Manufacturer Details:</div>
                  <div>Name: {transferResult.manufacturer.name || 'N/A'}</div>
                  {transferResult.manufacturer.companyName && (
                    <div>Company: {transferResult.manufacturer.companyName}</div>
                  )}
                  <div className="font-mono text-xs mt-1">Address: {transferResult.manufacturer.address}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">Inventory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">QR Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-text-light">
                      No products in warehouse inventory yet.
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p._id} className="hover:bg-bg transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-text">{p.blockchainId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.batchBlockchainId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg text-secondary border border-border">
                            Batch #{p.batchBlockchainId}
                          </span>
                        ) : (
                          <span className="text-text-light text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.qrCodeUrl ? (
                          <img src={p.qrCodeUrl} className="w-16 h-16 object-contain" alt="QR Code" />
                        ) : (
                          <span className="text-text-light text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

