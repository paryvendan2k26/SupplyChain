import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ethers } from 'ethers'

export default function VerifyProduct() {
  const { productId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function fetchData() {
    if (!productId) {
      setLoading(false)
      return
    }
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${productId}`)
      setData(data)
    } catch (e) {
      console.error('Error fetching product:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchData() 
  }, [productId])

  async function verifyOwnership() {
    if (!window.ethereum) {
      alert('Please install MetaMask to verify ownership')
      return
    }

    setVerifying(true)
    setStatus('')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const abi = (await import('../contract/SupplyChainTracker.json')).default.abi
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer)
      const tx = await contract.verifyAsCustomer(Number(productId))
      await tx.wait()
      setStatus('success')
      fetchData()
    } catch (e) {
      setStatus('error')
      console.error('Verification error:', e)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-light">Loading product information...</div>
      </div>
    )
  }

  if (!data || !data.onchain) {
    return (
      <div className="min-h-screen bg-bg">
        <nav className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-semibold text-primary">SupplyChain</Link>
              <Link to="/login" className="text-secondary hover:text-primary text-sm font-medium">Sign In</Link>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text mb-4">Product Not Found</h1>
            <p className="text-text-light mb-6">The product ID you're looking for doesn't exist.</p>
            <Link to="/" className="text-primary hover:text-secondary font-medium">← Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  const { onchain, db, batch } = data
  const isAuthentic = onchain.isAuthentic && onchain.manufacturer !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="min-h-screen bg-bg">
      {/* Navigation */}
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-semibold text-primary">SupplyChain</Link>
            <Link to="/login" className="text-secondary hover:text-primary text-sm font-medium">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-text mb-2">Product Verification</h1>
          <p className="text-text-light">Verify the authenticity and trace the journey of this product</p>
        </div>

        {/* Verification Status */}
        <div className={`mb-6 p-4 rounded-lg border ${
          isAuthentic 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${isAuthentic ? 'text-success' : 'text-error'}`}>
              {isAuthentic ? '✓' : '✗'}
            </div>
            <div>
              <div className={`font-semibold ${isAuthentic ? 'text-success' : 'text-error'}`}>
                {isAuthentic ? 'Authentic Product' : 'Product Verification Failed'}
              </div>
              <div className="text-sm text-text-light mt-0.5">
                {isAuthentic 
                  ? 'This product has been verified on the blockchain'
                  : 'Unable to verify product authenticity'}
              </div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-surface rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">Product Details</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-text-light mb-1">Product Name</div>
              <div className="text-text font-medium">{db?.name || 'N/A'}</div>
            </div>
            {db?.description && (
              <div>
                <div className="text-sm text-text-light mb-1">Description</div>
                <div className="text-text">{db.description}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-text-light mb-1">Manufacture Date</div>
              <div className="text-text">{db?.manufactureDate ? new Date(db.manufactureDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-text-light mb-1">Blockchain ID</div>
              <div className="text-text font-mono text-sm">{productId}</div>
            </div>
            {db?.manufacturer && (
              <div>
                <div className="text-sm text-text-light mb-1">Manufacturer</div>
                <div className="text-text">{db.manufacturer.name || db.manufacturer.companyName || 'N/A'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Batch Information */}
        {batch && (
          <div className="bg-surface rounded-lg border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-text mb-4">Batch Information</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-text-light mb-1">Batch ID</div>
                <div className="text-text font-mono text-sm">{batch.batchId}</div>
              </div>
              <div>
                <div className="text-sm text-text-light mb-1">NFT Token ID</div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg text-secondary border border-border">
                  NFT #{batch.batchId}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-light mb-1">Products in Batch</div>
                <div className="text-text">{batch.productIds?.length || 0} products</div>
              </div>
            </div>
          </div>
        )}

        {/* Supply Chain Journey */}
        <div className="bg-surface rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">Supply Chain Journey</h2>
          {onchain.history && onchain.history.length > 0 ? (
            <div className="space-y-4">
              {onchain.history.map((h, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-sm font-medium text-secondary">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text">
                      {h.from.slice(0, 6)}...{h.from.slice(-4)} → {h.to.slice(0, 6)}...{h.to.slice(-4)}
                    </div>
                    <div className="text-xs text-text-light mt-1">
                      {h.location && `${h.location} • `}
                      {new Date(Number(h.timestamp) * 1000).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-light text-sm">No transfer history available</div>
          )}
        </div>

        {/* Blockchain Information */}
        <div className="bg-surface rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">Blockchain Verification</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-text-light mb-1">Manufacturer Address</div>
              <div className="text-text font-mono text-xs break-all">{onchain.manufacturer}</div>
            </div>
            <div>
              <div className="text-sm text-text-light mb-1">Current Holder</div>
              <div className="text-text font-mono text-xs break-all">{onchain.currentHolder}</div>
            </div>
            {onchain.verifiedByCustomer && (
              <div>
                <div className="text-sm text-text-light mb-1">Verified By Customer</div>
                <div className="text-text font-mono text-xs break-all">{onchain.customer}</div>
              </div>
            )}
          </div>
        </div>

        {/* Verify Ownership Button */}
        {!onchain.verifiedByCustomer && (
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Verify Ownership</h2>
            <p className="text-sm text-text-light mb-4">
              Connect your wallet to permanently verify this product. Once verified, the product cannot be transferred.
            </p>
            <button
              onClick={verifyOwnership}
              disabled={verifying}
              className="bg-primary text-white px-6 py-2.5 rounded-md font-medium hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? 'Verifying...' : 'Verify as Customer'}
            </button>
            {status === 'success' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-success">Product verified successfully!</p>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-error">Verification failed. Product may already be verified.</p>
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-primary hover:text-secondary font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
