import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

export default function TestQRCode() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (productId) {
      fetchProduct()
    } else {
      setLoading(false)
    }
  }, [productId])

  async function fetchProduct() {
    try {
      // First, try authenticated endpoint if user is logged in (more reliable)
      if (token) {
        try {
          const { data: products } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
            headers: { Authorization: 'Bearer ' + token }
          })
          const foundProduct = products.find(p => p.blockchainId === Number(productId))
          if (foundProduct) {
            setProduct(foundProduct)
            setLoading(false)
            return
          }
        } catch (authError) {
          console.log('Authenticated fetch failed, trying public endpoint:', authError.message)
        }
      }
      
      // Try public endpoint
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${productId}`)
      if (data && data.db) {
        setProduct(data.db)
      } else if (data && data.onchain) {
        // Product exists on-chain but not in DB - create a minimal product object
        setProduct({
          blockchainId: Number(productId),
          name: data.onchain.name || `Product ${productId}`,
          qrCodeUrl: null // Will generate below
        })
        // Try to get QR code from QR code endpoint
        try {
          const qrData = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${productId}/qrcode`)
          if (qrData.data && qrData.data.qrCodeUrl) {
            setProduct(prev => ({ ...prev, qrCodeUrl: qrData.data.qrCodeUrl }))
          }
        } catch (qrError) {
          console.log('Could not fetch QR code:', qrError.message)
        }
      } else {
        setError(`Product with ID ${productId} not found`)
      }
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Unknown error'
      setError(`Product not found: ${errorMsg}. Product ID: ${productId}`)
      console.error('Error fetching product:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-text-light">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Product Not Found</h2>
            <p className="text-red-600 mb-2">{error || 'Please provide a valid product ID'}</p>
            {productId && (
              <div className="mt-4 p-3 bg-white rounded border border-red-200">
                <p className="text-sm text-text mb-2"><strong>Product ID:</strong> {productId}</p>
                <p className="text-xs text-text-light mb-4">
                  This product might not exist in the database yet, or the blockchain ID might be incorrect.
                </p>
                <div className="text-sm text-text">
                  <p className="mb-2"><strong>To fix this:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-text-light">
                    <li>Make sure the product ID is correct (check your dashboard)</li>
                    <li>Verify the product was created successfully</li>
                    <li>Try accessing the verify page directly: <a href={`/verify/${productId}`} className="text-primary hover:text-secondary">/verify/{productId}</a></li>
                  </ul>
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-4">
              <Link to="/manufacturer" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors">
                ← Back to Dashboard
              </Link>
              {productId && (
                <Link to={`/verify/${productId}`} className="px-4 py-2 bg-bg border border-border rounded-md text-text hover:bg-surface transition-colors">
                  Try Verify Page
                </Link>
              )}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const verifyUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin}/verify/${product.blockchainId}`

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-text mb-2">QR Code Test</h1>
          <p className="text-text-light">Test and verify QR code functionality</p>
        </div>

        {/* Product Info */}
        <div className="bg-surface rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">Product Information</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-text-light">Product Name:</span>
              <span className="ml-2 text-text font-medium">{product.name}</span>
            </div>
            <div>
              <span className="text-sm text-text-light">Blockchain ID:</span>
              <span className="ml-2 text-text font-mono text-sm">{product.blockchainId}</span>
            </div>
            <div>
              <span className="text-sm text-text-light">Verify URL:</span>
              <span className="ml-2 text-text font-mono text-xs break-all">{verifyUrl}</span>
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="bg-surface rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">QR Code</h2>
          <div className="flex flex-col items-center space-y-4">
            {product.qrCodeUrl ? (
              <>
                <div className="bg-white p-4 rounded-lg border-2 border-border">
                  <img 
                    src={product.qrCodeUrl} 
                    alt="Product QR Code" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-text-light">
                    Scan this QR code with your phone camera or a QR scanner app
                  </p>
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary hover:text-secondary font-medium text-sm"
                  >
                    Or click here to open verify page directly →
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center text-text-light">
                <p>No QR code available for this product</p>
              </div>
            )}
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-surface rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">How to Test</h2>
          <div className="space-y-3 text-sm text-text">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="font-medium mb-1">Using Your Phone Camera:</p>
                <p className="text-text-light">Open your phone's camera app and point it at the QR code above. Your phone should detect the QR code and show a notification to open the link.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-medium mb-1">Using a QR Scanner App:</p>
                <p className="text-text-light">Download a QR code scanner app (like "QR Code Reader" or "Barcode Scanner") and scan the code.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="font-medium mb-1">Manual Testing:</p>
                <p className="text-text-light">Click the link above to manually open the verify page. This should show the product details.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <p className="font-medium mb-1">Expected Result:</p>
                <p className="text-text-light">The QR code should redirect to: <code className="bg-bg px-2 py-1 rounded text-xs">{verifyUrl}</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Link
            to="/manufacturer"
            className="px-4 py-2 bg-bg border border-border rounded-md text-text hover:bg-surface transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
          >
            Print QR Code
          </button>
        </div>
      </div>
    </Layout>
  )
}

