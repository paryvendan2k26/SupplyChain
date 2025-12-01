import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import PartnershipManager from '../components/PartnershipManager'
import QRAccessManager from '../components/QRAccessManager'

export default function ManufacturerDashboard() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('single')
  const [batchProducts, setBatchProducts] = useState([{ name: '', description: '', manufactureDate: '' }])
  const [batchMetadataURI, setBatchMetadataURI] = useState('')
  const [batchQuantity, setBatchQuantity] = useState(1)
  const [batchLoading, setBatchLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [transferBatchData, setTransferBatchData] = useState({
    batchId: '',
    toAddress: '',
    location: ''
  })
  const [transferBatchLoading, setTransferBatchLoading] = useState(false)
  const token = localStorage.getItem('token')

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

  useEffect(() => { 
    fetchProducts()
    fetchBatches()
  }, [])

  async function createProduct(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    try {
      const { data } = await axios.post(import.meta.env.VITE_API_URL + '/api/products', {
        name, description, manufactureDate: date, quantity: parseInt(quantity) || 1
      }, { headers: { Authorization: 'Bearer ' + token } })
      setName(''); setDescription(''); setDate(''); setQuantity(1)
      if (data.products && Array.isArray(data.products)) {
        setProducts([...data.products, ...products])
        setSuccess(`Successfully created ${data.count} product(s)!`)
      } else {
        setProducts([data, ...products])
        setSuccess('Product created successfully!')
      }
      setTimeout(() => setSuccess(''), 5000)
      fetchProducts()
    } catch (e) {
      alert('Failed to create: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  function addBatchProduct() {
    setBatchProducts([...batchProducts, { name: '', description: '', manufactureDate: '' }])
  }

  function removeBatchProduct(index) {
    if (batchProducts.length > 1) {
      setBatchProducts(batchProducts.filter((_, i) => i !== index))
    }
  }

  function updateBatchProduct(index, field, value) {
    const updated = [...batchProducts]
    updated[index][field] = value
    setBatchProducts(updated)
  }

  async function createBatch(e) {
    e.preventDefault()
    setBatchLoading(true)
    setSuccess('')
    
    const validProducts = batchProducts.filter(p => p.name.trim() !== '')
    if (validProducts.length === 0) {
      alert('Please add at least one product with a name')
      setBatchLoading(false)
      return
    }

    const quantity = parseInt(batchQuantity) || 1
    const useQuantity = quantity > 1

    try {
      const { data } = await axios.post(import.meta.env.VITE_API_URL + '/api/products/batch', {
        metadataURI: batchMetadataURI || `ipfs://batch-${Date.now()}`,
        products: validProducts.map(p => ({
          name: p.name,
          description: p.description || '',
          manufactureDate: p.manufactureDate || new Date().toISOString().slice(0, 10)
        })),
        quantity: useQuantity ? quantity : undefined
      }, { headers: { Authorization: 'Bearer ' + token } })
      
      setBatchProducts([{ name: '', description: '', manufactureDate: '' }])
      setBatchMetadataURI('')
      setBatchQuantity(1)
      setSuccess(`Batch created successfully! NFT Token ID: ${data.nftTokenId}${useQuantity ? ` (${quantity} products)` : ''}`)
      setTimeout(() => setSuccess(''), 5000)
      fetchProducts()
      fetchBatches()
    } catch (e) {
      alert('Failed to create batch: ' + (e.response?.data?.error || e.message))
    } finally {
      setBatchLoading(false)
    }
  }

  async function generateZKProof(productId, batchId) {
    if (!confirm('Generate ZK proof for this product? This will prove it belongs to the batch without revealing sensitive details.')) {
      return
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${productId}/zk-proof`, {}, { 
        headers: { Authorization: 'Bearer ' + token } 
      })
      alert(`ZK Proof generated successfully!\nProduct ID: ${productId}\nBatch ID: ${batchId}`)
      fetchProducts()
    } catch (e) {
      alert('Failed to generate ZK proof: ' + (e.response?.data?.error || e.message))
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
    setSuccess('')
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/products/batch/${transferBatchData.batchId}/transfer`,
        { 
          toAddress: transferBatchData.toAddress, 
          location: transferBatchData.location
        },
        { headers: { Authorization: 'Bearer ' + token } }
      )
      setSuccess(data.message || 'Batch transferred successfully!')
      setTransferBatchData({ batchId: '', toAddress: '', location: '' })
      setTimeout(() => setSuccess(''), 10000)
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
          <h1 className="text-3xl font-semibold text-text mb-2">Manufacturer Dashboard</h1>
          <p className="text-text-light">Create products and batches, manage your inventory</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-success">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'single'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-light hover:text-text'
              }`}
            >
              Single Product
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'batch'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-light hover:text-text'
              }`}
            >
              Create Batch (NFT)
            </button>
            <button
              onClick={() => setActiveTab('partnerships')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'partnerships'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-light hover:text-text'
              }`}
            >
              Partnerships
            </button>
            <button
              onClick={() => setActiveTab('qr-access')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'qr-access'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-light hover:text-text'
              }`}
            >
              QR Access
            </button>
          </nav>
        </div>

        {/* Single Product Form */}
        {activeTab === 'single' && (
          <>
            <div className="bg-surface rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Create New Product</h2>
              <form onSubmit={createProduct} className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Product Name</label>
                    <input 
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                      placeholder="Enter product name"
                      value={name} 
                      onChange={e=>setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Description</label>
                    <input 
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                      placeholder="Product description"
                      value={description} 
                      onChange={e=>setDescription(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Manufacture Date</label>
                    <input 
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                      type="date" 
                      value={date} 
                      onChange={e=>setDate(e.target.value)} 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Quantity</label>
                    <input 
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                      type="number" 
                      min="1" 
                      max="100"
                      value={quantity} 
                      onChange={e=>setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} 
                      required
                    />
                  </div>
                </div>
                <button 
                  className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : `Create ${quantity} Product(s)`}
                </button>
              </form>
            </div>

            {/* Products Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-text">Your Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">ZK Proof</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">QR Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-text-light">
                          No products yet. Create your first product above.
                        </td>
                      </tr>
                    ) : (
                      products.map(p => (
                        <tr key={p._id} className="hover:bg-bg transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-text">{p.uniqueProductId || p.blockchainId}</td>
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
                            {p.zkProofGenerated ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-success border border-green-200">
                                ✓ Generated
                              </span>
                            ) : p.batchBlockchainId ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                Required
                              </span>
                            ) : (
                              <span className="text-text-light text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {p.qrCodeUrl ? (
                              <div className="flex items-center gap-2">
                                <img src={p.qrCodeUrl} className="w-16 h-16 object-contain" alt="QR Code" />
                                <a
                                  href={`/test-qr/${p.blockchainId}`}
                                  className="text-xs text-primary hover:text-secondary font-medium"
                                  title="Test QR Code"
                                >
                                  Test
                                </a>
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
          </>
        )}

        {/* Batch Creation Form */}
        {activeTab === 'batch' && (
          <>
            <div className="bg-surface rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Create Batch with NFT</h2>
              <form onSubmit={createBatch} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Batch Metadata URI (Optional)</label>
                    <input
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text font-mono text-sm"
                      placeholder="ipfs://... or https://..."
                      value={batchMetadataURI}
                      onChange={e => setBatchMetadataURI(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-text-light">Leave empty for auto-generated URI</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Quantity (Optional)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text"
                      placeholder="1"
                      value={batchQuantity}
                      onChange={e => setBatchQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    />
                    <p className="mt-1 text-xs text-text-light">Create N products with same details from first product</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-text">Products in Batch</label>
                    <button
                      type="button"
                      onClick={addBatchProduct}
                      className="px-3 py-1.5 text-sm text-primary hover:text-secondary border border-border rounded-md hover:bg-bg transition-colors"
                    >
                      + Add Product
                    </button>
                  </div>

                  <div className="space-y-3">
                    {batchProducts.map((product, index) => (
                      <div key={index} className="p-4 border border-border rounded-md bg-bg">
                        <div className="grid md:grid-cols-4 gap-3">
                          <div>
                            <input
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text text-sm"
                              placeholder="Product name *"
                              value={product.name}
                              onChange={e => updateBatchProduct(index, 'name', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <input
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text text-sm"
                              placeholder="Description"
                              value={product.description}
                              onChange={e => updateBatchProduct(index, 'description', e.target.value)}
                            />
                          </div>
                          <div>
                            <input
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface text-text text-sm"
                              type="date"
                              placeholder="Manufacture Date"
                              value={product.manufactureDate}
                              onChange={e => updateBatchProduct(index, 'manufactureDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => removeBatchProduct(index)}
                              className="w-full px-3 py-2 text-sm text-error hover:bg-red-50 border border-red-200 rounded-md transition-colors disabled:opacity-50"
                              disabled={batchProducts.length === 1}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2.5 px-4 rounded-md font-medium hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={batchLoading}
                >
                  {batchLoading ? 'Creating Batch & Minting NFT...' : 'Create Batch & Mint NFT'}
                </button>
                <p className="text-xs text-text-light text-center">
                  This will create all products in a batch and mint an ERC-721 NFT for the batch
                </p>
              </form>
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

            {/* Batches Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-text">Your Batches</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Batch ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">NFT Token ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Products</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-text-light">
                          No batches yet. Create your first batch above.
                        </td>
                      </tr>
                    ) : (
                      batches.map(batch => (
                        <tr key={batch._id} className="hover:bg-bg transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-text">{batch.batchId}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg text-secondary border border-border">
                              NFT #{batch.nftTokenId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text font-semibold">{batch.quantity || batch.products?.length || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{batch.products?.length || 0} products</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Partnerships Tab */}
        {activeTab === 'partnerships' && (
          <PartnershipManager />
        )}

        {/* QR Access Tab */}
        {activeTab === 'qr-access' && (
          <QRAccessManager userRole="manufacturer" />
        )}
      </div>
    </Layout>
  )
}
