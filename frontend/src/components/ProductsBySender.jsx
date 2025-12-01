import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ProductsBySender() {
  const [groupedProducts, setGroupedProducts] = useState({})
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem('token')

  async function fetchGroupedProducts() {
    setLoading(true)
    try {
      const { data } = await axios.get(import.meta.env.VITE_API_URL + '/api/products/grouped-by-sender', {
        headers: { Authorization: 'Bearer ' + token }
      })
      setGroupedProducts(data)
    } catch (e) {
      console.error('Error fetching grouped products:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroupedProducts()
  }, [])

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>
  }

  const groups = Object.entries(groupedProducts)

  if (groups.length === 0) {
    return <div className="text-center text-gray-600">No products found</div>
  }

  return (
    <div className="space-y-4">
      {groups.map(([senderId, group]) => (
        <div key={senderId} className="bg-white p-4 rounded shadow">
          <div className="font-semibold mb-2">
            From {group.sender?.companyName || group.sender?.name || 'Unknown'} ({group.sender?.role}) - {group.products.length} product(s)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {group.products.map(p => (
              <div key={p._id} className="border p-2 rounded">
                <div className="font-mono text-xs text-gray-600">{p.uniqueProductId || p.blockchainId}</div>
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-xs text-gray-500">{p.description}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

