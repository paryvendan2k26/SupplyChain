import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Navigation */}
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-semibold text-primary">SupplyChain</div>
            <div className="flex gap-4">
              <Link to="/login" className="text-secondary hover:text-primary text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-secondary transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-semibold text-text mb-6">
            Blockchain-Powered Supply Chain Transparency
          </h1>
          <p className="text-xl text-text-light mb-8">
            Track products from manufacturer to customer with immutable blockchain records, 
            batch-level NFTs, and zero-knowledge proof verification.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-8 py-3 bg-primary text-white rounded-md font-medium hover:bg-secondary transition-colors"
            >
              Get Started
            </Link>
            <Link 
              to="/verify" 
              className="px-8 py-3 border border-border text-text rounded-md font-medium hover:bg-bg transition-colors"
            >
              Verify Product
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text mb-2">Batch NFT Minting</h3>
            <p className="text-text-light text-sm">
              Create batches of products and mint ERC-721 NFTs for immutable ownership records.
            </p>
          </div>
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text mb-2">Zero-Knowledge Proofs</h3>
            <p className="text-text-light text-sm">
              Verify product authenticity with privacy-preserving ZK proofs without revealing sensitive data.
            </p>
          </div>
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text mb-2">Complete Traceability</h3>
            <p className="text-text-light text-sm">
              Track every transfer and location change through the entire supply chain journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

