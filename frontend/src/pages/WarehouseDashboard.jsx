import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'

export default function WarehouseDashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [transferData, setTransferData] = useState({
    productId: '',
    toAddress: '',
    location: ''
  })
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchProducts()
  }, [])

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
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/products/${transferData.productId}/transfer`,
        { toAddress: transferData.toAddress, location: transferData.location },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      alert('Product transferred successfully!')
      setTransferData({ productId: '', toAddress: '', location: '' })
      fetchProducts()
    } catch (e) {
      alert('Transfer failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
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

        {/* Transfer Form */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Transfer Product</h2>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
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
              {loading ? 'Transferring...' : 'Transfer Product'}
            </button>
          </form>
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

