import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'

export default function RetailerDashboard() {
  const [products, setProducts] = useState([])
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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-text mb-2">Retailer Dashboard</h1>
          <p className="text-text-light">View inventory and manage product sales</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="text-2xl font-semibold text-text">{products.length}</div>
            <div className="text-sm text-text-light mt-1">Total Products</div>
          </div>
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="text-2xl font-semibold text-text">
              {products.filter(p => p.qrCodeUrl).length}
            </div>
            <div className="text-sm text-text-light mt-1">Products with QR</div>
          </div>
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="text-2xl font-semibold text-text">
              {products.filter(p => p.batchBlockchainId).length}
            </div>
            <div className="text-sm text-text-light mt-1">Batched Products</div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">Product Inventory</h2>
            <p className="text-sm text-text-light mt-1">Print QR codes to attach to products for customer verification</p>
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
                      No products in inventory yet.
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
                          <div className="flex items-center gap-3">
                            <img src={p.qrCodeUrl} className="w-20 h-20 object-contain border border-border rounded" alt="QR Code" />
                            <button
                              onClick={() => window.open(p.qrCodeUrl, '_blank')}
                              className="text-sm text-primary hover:text-secondary font-medium"
                            >
                              Print
                            </button>
                          </div>
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

