# Batch-Level NFTs & Zero-Knowledge Proofs Implementation

## Overview

This project now implements **batch-level NFTs** and **zero-knowledge proof verification** for luxury goods supply chain integrity. This enables:

- **Batch NFT Minting**: Manufacturers create batches of products and mint ERC-721 NFTs for each batch
- **ZK Proof Verification**: Prove product membership in a batch without revealing sensitive details
- **Privacy-Preserving Authentication**: Customers can verify product authenticity while maintaining privacy

## New Features

### 1. Batch-Level NFT Minting

When manufacturers create a batch of products:
- All products in the batch are created on-chain atomically
- An ERC-721 NFT is automatically minted for the batch
- The NFT token ID equals the batch ID
- The NFT owner is the manufacturer who created the batch
- Batch metadata can be stored on IPFS or any URI

**API Endpoint**: `POST /api/products/batch`
```json
{
  "metadataURI": "ipfs://Qm...",
  "products": [
    {
      "name": "Product 1",
      "description": "Description",
      "manufactureDate": "2025-10-31"
    },
    {
      "name": "Product 2",
      "description": "Description",
      "manufactureDate": "2025-10-31"
    }
  ]
}
```

**Response**:
```json
{
  "batch": { /* Batch document */ },
  "products": [ /* Product documents */ ],
  "txHash": "0x...",
  "nftTokenId": 1
}
```

### 2. Zero-Knowledge Proof Generation

Generate ZK proofs that prove a product belongs to a batch without revealing:
- Internal product details
- Manufacturer secrets
- Batch composition

**API Endpoint**: `POST /api/products/:productId/zk-proof`

**Response**:
```json
{
  "productId": 1,
  "batchId": 1,
  "proof": {
    "a": ["...", "..."],
    "b": [["...", "..."], ["...", "..."]],
    "c": ["...", "..."],
    "publicSignals": ["...", "..."]
  },
  "publicSignals": ["...", "..."]
}
```

### 3. On-Chain ZK Proof Verification

Verify ZK proofs on-chain to ensure product authenticity:

**API Endpoint**: `POST /api/products/:productId/zk-verify`
```json
{
  "proof": { /* ZK proof structure */ },
  "batchId": 1
}
```

**Response**:
```json
{
  "verified": true,
  "txHash": "0x...",
  "productId": 1,
  "batchId": 1
}
```

## Smart Contract Enhancements

### New Contract Functions

1. **`createBatch()`**: Creates a batch of products and mints an NFT
2. **`getBatch()`**: Retrieves batch information including NFT owner
3. **`getBatchProductIds()`**: Gets all product IDs in a batch
4. **`getProductBatchId()`**: Gets the batch ID for a product
5. **`verifyZKProof()`**: Verifies ZK proof on-chain (simplified implementation)

### New Events

- `BatchCreated`: Emitted when a batch is created
- `BatchNFTMinted`: Emitted when NFT is minted for a batch
- `ZKProofVerified`: Emitted when a ZK proof is verified

## Database Schema Updates

### Batch Model
```javascript
{
  batchId: Number,           // On-chain batch ID
  manufacturer: ObjectId,    // Reference to User
  metadataURI: String,       // IPFS or metadata URI
  nftTokenId: Number,        // ERC-721 token ID
  products: [ObjectId],      // Array of Product references
  createdAt: Date
}
```

### Product Model (Updated)
```javascript
{
  // ... existing fields ...
  batchId: ObjectId,         // Reference to Batch document
  batchBlockchainId: Number, // On-chain batch ID
  zkProof: Mixed             // Stored ZK proof if generated
}
```

## Frontend Features

### Manufacturer Dashboard

1. **Single Product Creation**: Create individual products (backward compatible)
2. **Batch Creation Tab**: Create batches with multiple products
   - Add/remove products dynamically
   - Set batch metadata URI
   - Mint NFT automatically on batch creation

3. **Batch List View**: View all created batches
   - Batch ID and NFT Token ID
   - Number of products in batch
   - Creation date

4. **ZK Proof Generation**: Generate ZK proofs for products in batches
   - Button available for each product in a batch
   - Proof stored in database and available for verification

## ZK Circuit Architecture

### Circuit Location
`blockchain/circuits/batch_membership.circom`

### Circuit Logic
Proves that a product belongs to a batch using:
- **Public inputs**: `batchId`, `productHash`
- **Private inputs**: `productId`, `secret`
- **Constraint**: `hash(productId, secret) == productHash`

### Implementation Status

- ✅ Circuit structure defined
- ✅ Proof generation utility created
- ✅ API endpoints for proof generation/verification
- ⚠️ Full ZK verifier contract (simplified version implemented)
- ⚠️ Circuit compilation and trusted setup (requires additional setup)

**Note**: The current implementation uses a simplified proof structure. For production, you should:
1. Compile the Circom circuit
2. Generate a trusted setup
3. Integrate a proper ZK verifier contract (e.g., using snarkjs verifier)

## Usage Guide

### 1. Start Hardhat Node
```bash
cd blockchain
npm run node
```

### 2. Deploy Contract
```bash
npm run deploy:local
# Copy the deployed address to backend/.env as CONTRACT_ADDRESS
```

### 3. Create a Batch

Via API:
```bash
curl -X POST http://localhost:5000/api/products/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metadataURI": "ipfs://Qm...",
    "products": [
      {"name": "Luxury Watch 1", "description": "...", "manufactureDate": "2025-10-31"},
      {"name": "Luxury Watch 2", "description": "...", "manufactureDate": "2025-10-31"}
    ]
  }'
```

Via Frontend:
1. Log in as manufacturer
2. Go to "Create Batch (NFT)" tab
3. Add products to the batch
4. Click "Create Batch & Mint NFT"

### 4. Generate ZK Proof

Via API:
```bash
curl -X POST http://localhost:5000/api/products/1/zk-proof \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Via Frontend:
1. Find a product that belongs to a batch
2. Click "Generate ZK Proof" button

### 5. Verify ZK Proof

Via API:
```bash
curl -X POST http://localhost:5000/api/products/1/zk-verify \
  -H "Content-Type: application/json" \
  -d '{
    "proof": { /* proof structure */ },
    "batchId": 1
  }'
```

## Technical Notes

### OpenZeppelin Contracts

The contract now extends:
- `ERC721URIStorage`: For NFT functionality with metadata URIs
- `Ownable`: For access control

### Backward Compatibility

- Single product creation (`createProduct()`) still works
- Products without batches have `batchId = 0`
- Existing products remain functional

### ZK Proof Status

The ZK proof verification is currently simplified. For production deployment:
1. Compile the Circom circuit
2. Generate trusted setup parameters
3. Deploy a proper Groth16 verifier contract
4. Update `verifyZKProof()` to call the verifier contract

## Future Enhancements

- [ ] Full ZK circuit compilation and trusted setup
- [ ] Deploy dedicated ZK verifier contract
- [ ] IPFS integration for batch metadata
- [ ] Batch transfer functionality (transfer NFT ownership)
- [ ] Enhanced ZK proofs with more privacy features
- [ ] Customer-facing ZK proof verification UI

## Summary

✅ **Batch NFT Minting**: Fully implemented
✅ **ZK Proof Generation**: API implemented (circuit structure ready)
⚠️ **ZK Proof Verification**: Simplified version (production-ready verifier pending)
✅ **Frontend Integration**: Complete with batch creation UI
✅ **Database Models**: Updated with batch support

The system now provides a scalable solution for luxury goods supply chain transparency with batch-level NFTs and zero-knowledge proof capabilities!

