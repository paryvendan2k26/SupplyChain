import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Html5Qrcode } from 'html5-qrcode'
import PartnershipManager from '../components/PartnershipManager'
import ProductsBySender from '../components/ProductsBySender'

export default function SupplyChainDashboard() {
  const [scannedId, setScannedId] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [location, setLocation] = useState('')
  const [inventory, setInventory] = useState([])
  const [activeTab, setActiveTab] = useState('transfer')
  const scannerRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    return () => { if (scannerRef.current) scannerRef.current.stop().catch(()=>{}) }
  }, [])

  async function startScan() {
    const scanner = new Html5Qrcode('reader')
    scannerRef.current = scanner
    await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decoded) => {
      try {
        const url = new URL(decoded)
        const id = url.pathname.split('/').pop()
        setScannedId(id)
        scanner.stop()
      } catch {}
    })
  }

  async function transfer() {
    if (!scannedId || !toAddress) return
    await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${scannedId}/transfer`, { toAddress, location }, { headers: { Authorization: 'Bearer ' + token }})
    alert('Transferred')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Supply Chain Dashboard</h1>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('transfer')} className={`pb-2 ${activeTab === 'transfer' ? 'border-b-2 border-primary' : ''}`}>
            Transfer
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`pb-2 ${activeTab === 'inventory' ? 'border-b-2 border-primary' : ''}`}>
            All Products
          </button>
          <button onClick={() => setActiveTab('by-sender')} className={`pb-2 ${activeTab === 'by-sender' ? 'border-b-2 border-primary' : ''}`}>
            By Sender
          </button>
          <button onClick={() => setActiveTab('partnerships')} className={`pb-2 ${activeTab === 'partnerships' ? 'border-b-2 border-primary' : ''}`}>
            Partnerships
          </button>
        </div>
      </div>

      {/* Transfer Tab */}
      {activeTab === 'transfer' && (
        <div className="bg-white p-4 rounded shadow space-y-3">
          <div id="reader" className="w-full max-w-sm" />
          <button onClick={startScan} className="bg-secondary text-white px-4 py-2 rounded">Scan QR</button>
          {scannedId && <div>Scanned Product ID: <span className="font-mono">{scannedId}</span></div>}
          <div className="grid md:grid-cols-3 gap-2">
            <input className="border p-2 rounded" placeholder="To wallet address" value={toAddress} onChange={e=>setToAddress(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Location (optional)" value={location} onChange={e=>setLocation(e.target.value)} />
            <button onClick={transfer} className="bg-primary text-white rounded">Transfer</button>
          </div>
        </div>
      )}

      {/* All Products Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">All Products</h2>
          <p className="text-gray-600 text-sm">Use "By Sender" tab to see products grouped by sender</p>
        </div>
      )}

      {/* By Sender Tab */}
      {activeTab === 'by-sender' && (
        <ProductsBySender />
      )}

      {/* Partnerships Tab */}
      {activeTab === 'partnerships' && (
        <PartnershipManager />
      )}
    </div>
  )
}


