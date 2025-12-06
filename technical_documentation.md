# Supply Chain Tracker - Technical Documentation

## 1. System Overview

### 1.1 Purpose
Blockchain-based product authentication and supply chain tracking system implementing NFT-based batch certification, Zero-Knowledge Proofs (ZKP) for privacy-preserving verification, and encrypted QR codes for customer product verification.

### 1.2 Core Technologies
- **Blockchain**: Polygon (Mumbai testnet/Amoy) with Ethereum-compatible smart contracts
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin ERC-721 standard
- **Zero-Knowledge Proofs**: Circom 2.0.0 circuits with Poseidon hashing
- **Backend**: Node.js 18+ with Express.js REST API
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React 19+ with Vite build system
- **Cryptography**: Keccak256, bcrypt, JWT, ECDSA (via Ethers.js)

### 1.3 High-Level Workflow
1. Manufacturer creates products/batches → Smart contract mints NFT → Backend generates QR codes
2. Supply chain participants transfer products → Blockchain records ownership changes
3. Customer scans QR code → Backend validates → ZKP verification → Returns minimal verification data
4. Partnership system enforces authorized transfers between registered entities

---

## 2. System Architecture

### 2.1 Client Layer

#### 2.1.1 Frontend Application
- **Framework**: React 19.2.0 with React Router DOM 7.9.4
- **Build Tool**: Vite 7.1.12
- **Styling**: Tailwind CSS 4.1.16
- **HTTP Client**: Axios 1.13.0
- **Blockchain Integration**: Ethers.js 6.15.0
- **QR Code Scanning**: html5-qrcode 2.3.8

#### 2.1.2 QR Code Handling
- QR codes encode verification URLs: `${FRONTEND_URL}/verify/${blockchainId}`
- QR codes generated server-side using `qrcode` library (version 1.5.4)
- Format: Data URL (base64 PNG) stored in MongoDB
- Customer-facing verification page uses private mode (minimal data exposure)

#### 2.1.3 API Interactions
- RESTful API communication via Axios
- JWT Bearer token authentication in Authorization header
- CORS enabled for frontend origin
- Request/response JSON format

### 2.2 Backend Layer

#### 2.2.1 Microservices Architecture
**Single Express.js Application** with modular route handlers:

- **Authentication Service** (`/api/auth`)
  - User registration/login
  - JWT token generation/validation
  - Password hashing (bcryptjs, 10 rounds)

- **Product Service** (`/api/products`)
  - Product creation (single/batch)
  - Product listing with ownership filtering
  - QR code generation and retrieval
  - Blockchain transaction orchestration
  - ZK proof generation

- **Partnership Service** (`/api/partnerships`)
  - Partnership request/accept/reject
  - Partnership validation for transfers
  - Bidirectional partnership tracking

#### 2.2.2 Internal Communication
- Synchronous HTTP request/response pattern
- MongoDB connection pooling via Mongoose
- Blockchain interaction via Ethers.js JSON-RPC provider
- No message queue or async workers

#### 2.2.3 Authentication
- **JWT (JSON Web Tokens)**
  - Algorithm: HS256 (HMAC-SHA256)
  - Secret: Environment variable `JWT_SECRET`
  - Expiration: 7 days
  - Payload: `{ id: userId, role: userRole }`
  - Middleware: `auth()` function validates Bearer token

#### 2.2.4 Encryption
- **Password Hashing**: bcryptjs with 10 salt rounds
- **Blockchain Hashing**: Keccak256 (via Ethers.js)
- **ZKP Hashing**: Poseidon hash (via circomlib)
- No AES encryption for data at rest (MongoDB stores plaintext metadata)

### 2.3 QR Validation Service
- QR codes contain verification URLs, not encrypted payloads
- Backend validates QR code requests via product ID lookup
- Manufacturer-only access to QR code images
- Customer verification endpoint returns minimal public data

### 2.4 ZKP Service

#### 2.4.1 Proving System
- **Circuit Language**: Circom 2.0.0
- **Proof System**: Groth16 zk-SNARK (via snarkjs 0.7.5)
- **Hash Function**: Poseidon (via circomlib 2.0.5)
- **Current Implementation**: Mock proof generation (production-ready circuit defined but not fully integrated)

#### 2.4.2 Public Inputs
- `batchId`: Public batch identifier
- `productHash`: Hash of product ID and secret (Poseidon hash)

#### 2.4.3 Witness Data Handling
- **Private Inputs**:
  - `productId`: Product identifier (private)
  - `secret`: Manufacturer secret (private)
- Witness generation: `poseidon([productId, secret]) == productHash`

#### 2.4.4 Off-Chain Proof Generation
- Function: `generateBatchMembershipProof(productId, batchId, secret)`
- Uses Ethers.js Keccak256 for secret hashing
- Creates proof structure: `{ a, b, c, publicSignals }`
- Proof stored in MongoDB Product document

#### 2.4.5 On-Chain Verification
- Smart contract function: `verifyZKProof(uint256 productId, uint256 batchId, ZKProof calldata proof)`
- Currently simplified: Validates product belongs to batch
- Replay attack prevention via `verifiedProofs` mapping
- Event emitted: `ZKProofVerified(productId, batchId, verifier)`

### 2.5 Blockchain Gateway

#### 2.5.1 JSON-RPC Provider
- **Library**: Ethers.js 6.15.0
- **Network**: Polygon Mumbai/Amoy (configurable via `POLYGON_RPC_URL`)
- **Local Development**: Hardhat node (http://127.0.0.1:8545)
- Provider initialization: `new ethers.JsonRpcProvider(rpcUrl)`

#### 2.5.2 Web3/Ethers Integration
- Contract ABI loaded from `sc-abi/SupplyChainTracker.json`
- Contract address: Environment variable `CONTRACT_ADDRESS`
- Contract instance: `new ethers.Contract(address, abi, signer)`

#### 2.5.3 Signing Transactions
- **Local Development**: Hardhat account impersonation (`hardhat_impersonateAccount`)
- **Production**: Private key from `PRIVATE_KEY` environment variable
- Signer: `new ethers.Wallet(privateKey, provider)`
- Transaction execution: `contract.functionName(...args)` → `tx.wait()`

#### 2.5.4 HD Wallet Usage
- Not implemented (single private key used)
- Future enhancement: HD wallet derivation for multiple manufacturers

### 2.6 Smart Contract Layer

#### 2.6.1 NFT Contract
- **Standard**: ERC-721 (OpenZeppelin `ERC721URIStorage`)
- **Name**: "SupplyChainBatch"
- **Symbol**: "SCBATCH"
- **Inheritance**: `ERC721URIStorage`, `Ownable`
- **Token ID**: Batch ID (1-indexed, globally unique via `GlobalCounter`)

#### 2.6.2 ZKP Verifier Contract
- **Status**: Simplified implementation (production verifier not deployed)
- **Verifier Address**: Configurable via `setZKVerifier(address)`
- **Verification**: Currently validates product-batch relationship
- **Replay Protection**: `verifiedProofs` mapping prevents duplicate proofs

#### 2.6.3 Events
```solidity
event ProductCreated(uint256 indexed productId, address indexed manufacturer, string name, uint256 indexed batchId);
event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, string location);
event ProductVerified(uint256 indexed productId, address indexed customer);
event BatchCreated(uint256 indexed batchId, address indexed manufacturer, string metadataURI, uint256[] productIds);
event BatchNFTMinted(uint256 indexed batchId, address indexed to, uint256 tokenId);
event ZKProofVerified(uint256 indexed productId, uint256 indexed batchId, address indexed verifier);
```

#### 2.6.4 On-Chain Storage Model
```solidity
mapping(uint256 => Product) private products;
mapping(uint256 => ProductTransfer[]) private transferHistory;
mapping(uint256 => Batch) private batches;
mapping(address => bool) public authorizedManufacturer;
mapping(uint256 => bool) public verifiedProofs;
uint256 public nextProductId = 1;
uint256 public nextBatchId = 1;
```

#### 2.6.5 Access Control
- **Owner**: Contract deployer (can authorize manufacturers)
- **Authorized Manufacturers**: `authorizedManufacturer` mapping
- **Modifiers**: `onlyAuthorizedManufacturer()`, `productMustExist()`, `batchMustExist()`

#### 2.6.6 Gas Design Considerations
- Batch creation mints single NFT for entire batch (gas efficient)
- Product transfers update single mapping entry
- Transfer history stored as array (unbounded, consider pagination)
- ZK proof verification includes replay check (additional gas cost)

### 2.7 Storage Layer

#### 2.7.1 Database Schema

**MongoDB Collections:**

1. **users**
   ```javascript
   {
     _id: ObjectId,
     name: String (required),
     email: String (required, unique, indexed),
     password: String (hashed, required),
     walletAddress: String (required),
     role: String (enum: ['manufacturer', 'distributor', 'warehouse', 'retailer'], required),
     companyName: String,
     batchCounter: Number (default: 0),
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **products**
   ```javascript
   {
     _id: ObjectId,
     blockchainId: Number (required, indexed),
     uniqueProductId: String (indexed), // Format: MFR_{manufacturerId}_BATCH{batchNumber}_PROD{productNumber}
     name: String (required),
     description: String,
     manufacturer: ObjectId (ref: 'User', required),
     batchId: ObjectId (ref: 'Batch'),
     batchBlockchainId: Number,
     productNumberInBatch: Number, // 1-indexed
     sku: String,
     imageUrl: String,
     qrCodeUrl: String, // Data URL (base64 PNG)
     manufactureDate: Date (required),
     zkProof: Mixed, // { proof: {a, b, c}, publicSignals, productHash }
     zkProofGenerated: Boolean (default: false),
     zkProofGeneratedAt: Date,
     requiresPartnership: Boolean (default: false),
     currentHolder: ObjectId (ref: 'User'),
     sender: ObjectId (ref: 'User'),
     createdAt: Date,
     updatedAt: Date
   }
   ```

3. **batches**
   ```javascript
   {
     _id: ObjectId,
     batchId: Number (required, unique, indexed),
     manufacturer: ObjectId (ref: 'User', required),
     manufacturerBatchNumber: Number (required), // Manufacturer-specific counter
     metadataURI: String, // IPFS or HTTP URI
     nftTokenId: Number (unique), // Globally unique NFT token ID
     products: [ObjectId] (ref: 'Product'),
     quantity: Number (default: 0),
     createdAt: Date,
     updatedAt: Date
   }
   ```

4. **partnerships**
   ```javascript
   {
     _id: ObjectId,
     sender: ObjectId (ref: 'User', required),
     receiver: ObjectId (ref: 'User', required),
     status: String (enum: ['pending', 'accepted', 'rejected'], default: 'pending'),
     createdAt: Date,
     updatedAt: Date
   }
   ```
   - **Index**: `{ sender: 1, receiver: 1 }` (unique)

5. **globalcounters**
   ```javascript
   {
     _id: ObjectId,
     name: String (required, unique),
     counter: Number (default: 0),
     createdAt: Date,
     updatedAt: Date
   }
   ```

#### 2.7.2 NFT Mapping
- On-chain: `batchId` → NFT token ID (1:1 mapping)
- Off-chain: `batchId` → MongoDB Batch document
- Product-to-batch: `products[productId].batchId` (on-chain), `products.batchId` (off-chain)

#### 2.7.3 IPFS / Off-Chain Metadata
- **Metadata URI**: Stored in `Batch.metadataURI` (on-chain and off-chain)
- **Format**: `ipfs://...` or `https://...`
- **Current Implementation**: Auto-generated `ipfs://batch-{timestamp}` (not actually uploaded to IPFS)
- **Future Enhancement**: IPFS pinning service integration

#### 2.7.4 Hashing Functions
- **Keccak256**: Product ID generation, secret hashing (via Ethers.js)
- **Poseidon**: ZK proof product hash (via circomlib)
- **bcrypt**: Password hashing (10 rounds)

---

## 3. Detailed Workflow Diagrams

### 3.1 Manufacturer Product Registration Flow

**Single Product Creation:**
1. Manufacturer submits product form (name, description, manufactureDate, quantity)
2. Frontend sends POST `/api/products` with JWT token
3. Backend validates JWT, checks manufacturer role
4. For each product (quantity loop):
   a. Backend calls `contract.createProduct(name, dateStr)`
   b. Smart contract increments `nextProductId`, creates Product struct
   c. Contract emits `ProductCreated` event
   d. Backend extracts `blockchainId` from transaction receipt
   e. Backend generates QR code: `QRCode.toDataURL(verifyUrl)` where `verifyUrl = ${FRONTEND_URL}/verify/${blockchainId}`
   f. Backend generates `uniqueProductId`: `MFR_{manufacturerId}_{timestamp}_{counter}`
   g. Backend saves Product document to MongoDB with `qrCodeUrl` (Data URL)
5. Backend returns created products array
6. Frontend displays QR codes in manufacturer dashboard

**Batch Product Creation:**
1. Manufacturer submits batch form (metadataURI, products array, quantity)
2. Frontend sends POST `/api/products/batch` with JWT token
3. Backend validates JWT, checks manufacturer role
4. Backend increments manufacturer's `batchCounter` → `manufacturerBatchNumber`
5. Backend gets globally unique NFT token ID: `GlobalCounter.getNextCounter('nftTokenId')`
6. Backend calls `contract.createBatch(metadataURI, productNames, manufactureDates)`
7. Smart contract:
   a. Increments `nextBatchId`
   b. Creates products in loop, assigns `batchId` to each
   c. Creates Batch struct with `productIds` array
   d. Mints ERC-721 NFT: `_safeMint(msg.sender, batchId)`
   e. Sets token URI: `_setTokenURI(batchId, metadataURI)`
   f. Emits `BatchCreated` and `BatchNFTMinted` events
8. Backend creates Batch document in MongoDB with `manufacturerBatchNumber` and `nftTokenId`
9. For each product:
   a. Backend generates QR code URL
   b. Backend generates ZK proof: `generateBatchMembershipProof(blockchainId, batchId, secret)`
   c. Backend creates Product document with `productNumberInBatch` (1-indexed)
   d. Backend sets `uniqueProductId`: `MFR_{manufacturerId}_BATCH{batchNumber}_PROD{productNumber}`
10. Backend updates Batch document with product references
11. Backend returns batch and products data
12. Frontend displays batch with "Print All QR Codes" functionality

### 3.2 Customer Verification Flow

1. Customer scans QR code (contains URL: `/verify/${blockchainId}`)
2. Frontend navigates to verification page
3. Frontend sends GET `/api/products/${blockchainId}` (no authentication required)
4. Backend queries smart contract: `contract.getProduct(productId)`
5. Backend queries MongoDB: `Product.findOne({ blockchainId })`
6. Backend returns:
   - On-chain data: `{ manufacturer, currentHolder, verifiedByCustomer, isAuthentic, customer, batchId, history }`
   - Database data: `{ name, description, manufactureDate, manufacturer: { name, companyName } }`
   - Batch data (if applicable): `{ batchId, manufacturer, metadataURI, createdAt, productIds, nftOwner }`
7. **Private Mode Display** (customer-facing):
   - Shows: Product name, description, manufacture date
   - Shows: Verification status with checkpoint count: "✅ Authentic - Verified through X checkpoints"
   - Hides: Company names, locations, transfer dates, supplier details, blockchain addresses
8. Customer can verify ownership (optional):
   a. Customer connects MetaMask wallet
   b. Frontend calls `contract.verifyAsCustomer(productId)`
   c. Smart contract sets `verifiedByCustomer = true`, `customerVerifier = msg.sender`
   d. Contract emits `ProductVerified` event
   e. Product becomes non-transferable (`transferProduct` checks `!verifiedByCustomer`)

---

## 4. ZKP Technical Implementation

### 4.1 Circuits

**Circuit File**: `circuits/batch_membership.circom`

```circom
template BatchMembership() {
    signal input batchId;
    signal input productHash;
    signal private input productId;
    signal private input secret;
    
    component hasher = Poseidon(2);
    hasher.inputs[0] <== productId;
    hasher.inputs[1] <== secret;
    hasher.out === productHash;
    
    productId > 0;
    productId < 18446744073709551616; // 2^64
}

component main = BatchMembership();
```

### 4.2 Constraints
- **Hash Constraint**: `poseidon([productId, secret]) == productHash`
- **Range Constraint**: `0 < productId < 2^64`
- **Public Signals**: `batchId`, `productHash`
- **Private Signals**: `productId`, `secret`

### 4.3 Witness Generation
- **Input**: `productId`, `batchId`, `secret`
- **Process**: Compute `productHash = poseidon([productId, secret])`
- **Output**: Public signals `[batchId, productHash]`, private witness `[productId, secret]`

### 4.4 Commitment Scheme
- **Proof System**: Groth16 zk-SNARK
- **Trusted Setup**: Not implemented (mock proofs used)
- **Proof Structure**: `{ a: [uint256, uint256], b: [[uint256, uint256], [uint256, uint256]], c: [uint256, uint256] }`

### 4.5 On-Chain Verifier
- **Function**: `verifyZKProof(uint256 productId, uint256 batchId, ZKProof calldata proof)`
- **Current Implementation**: Validates `products[productId].batchId == batchId`
- **Replay Protection**: `verifiedProofs[proofId]` mapping
- **Proof ID**: `keccak256(abi.encodePacked(productId, batchId, msg.sender, block.timestamp))`
- **Event**: `ZKProofVerified(productId, batchId, verifier)`

---

## 5. Smart Contract Architecture

### 5.1 Functions

**Manufacturer Management:**
- `setManufacturer(address account, bool isAuthorized)`: Owner-only, authorizes manufacturers
- `setZKVerifier(address verifierAddress)`: Owner-only, sets ZK verifier contract address

**Product Creation:**
- `createProduct(string calldata name, string calldata date)`: Creates single product (legacy)
- `createBatch(string calldata metadataURI, string[] calldata productNames, string[] calldata manufactureDates)`: Creates batch with products and mints NFT

**Product Transfer:**
- `transferProduct(uint256 productId, address to, string calldata location)`: Transfers product ownership, records transfer history

**Verification:**
- `verifyAsCustomer(uint256 productId)`: Customer verification (one-time, locks product)
- `verifyZKProof(uint256 productId, uint256 batchId, ZKProof calldata proof)`: ZK proof verification

**Query Functions:**
- `getProduct(uint256 productId)`: Returns product data
- `getTransferHistory(uint256 productId)`: Returns transfer history array
- `getBatch(uint256 batchId)`: Returns batch data
- `getBatchProductIds(uint256 batchId)`: Returns product IDs in batch
- `getProductBatchId(uint256 productId)`: Returns batch ID for product

### 5.2 Events
- `ProductCreated(uint256 indexed productId, address indexed manufacturer, string name, uint256 indexed batchId)`
- `ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, string location)`
- `ProductVerified(uint256 indexed productId, address indexed customer)`
- `BatchCreated(uint256 indexed batchId, address indexed manufacturer, string metadataURI, uint256[] productIds)`
- `BatchNFTMinted(uint256 indexed batchId, address indexed to, uint256 tokenId)`
- `ZKProofVerified(uint256 indexed productId, uint256 indexed batchId, address indexed verifier)`

### 5.3 Storage Model
- **Products**: `mapping(uint256 => Product)` - Product ID → Product struct
- **Transfer History**: `mapping(uint256 => ProductTransfer[])` - Product ID → Transfer array
- **Batches**: `mapping(uint256 => Batch)` - Batch ID → Batch struct
- **Authorized Manufacturers**: `mapping(address => bool)` - Address → Authorization status
- **Verified Proofs**: `mapping(uint256 => bool)` - Proof ID → Verification status
- **Counters**: `nextProductId`, `nextBatchId` (uint256)

### 5.4 Access Control
- **Owner**: Contract deployer (inherited from `Ownable`)
- **Authorized Manufacturers**: Must be in `authorizedManufacturer` mapping
- **Modifiers**: `onlyAuthorizedManufacturer()`, `productMustExist()`, `batchMustExist()`

### 5.5 Gas Design Considerations
- Batch creation: Single NFT mint for entire batch (gas efficient vs. per-product NFTs)
- Transfer history: Unbounded array (consider pagination or event-only storage)
- ZK proof verification: Includes hash computation and mapping write
- Customer verification: Single boolean flag update (low gas)

---

## 6. Tech Stack Summary

### 6.1 Languages
- **Solidity**: 0.8.20 (Smart contracts)
- **JavaScript**: ES6+ (Backend/Frontend)
- **Circom**: 2.0.0 (ZK circuit definition)
- **TypeScript**: Not used (JavaScript only)

### 6.2 Frameworks
- **Backend**: Express.js 5.1.0
- **Frontend**: React 19.2.0
- **Build Tool**: Vite 7.1.12
- **Styling**: Tailwind CSS 4.1.16

### 6.3 Libraries

**Backend:**
- `express`: 5.1.0 - Web framework
- `mongoose`: 8.19.2 - MongoDB ODM
- `ethers`: 6.15.0 - Ethereum library
- `jsonwebtoken`: 9.0.2 - JWT authentication
- `bcryptjs`: 3.0.2 - Password hashing
- `qrcode`: 1.5.4 - QR code generation
- `cors`: 2.8.5 - CORS middleware
- `morgan`: 1.10.1 - HTTP logging
- `dotenv`: 17.2.3 - Environment variables

**Frontend:**
- `react`: 19.2.0 - UI library
- `react-router-dom`: 7.9.4 - Routing
- `axios`: 1.13.0 - HTTP client
- `ethers`: 6.15.0 - Blockchain interaction
- `html5-qrcode`: 2.3.8 - QR code scanning

**Blockchain:**
- `hardhat`: 2.26.3 - Development environment
- `@openzeppelin/contracts`: 5.4.0 - Smart contract libraries
- `circom`: 0.5.46 - Circuit compiler
- `circomlib`: 2.0.5 - Circuit libraries (Poseidon)
- `snarkjs`: 0.7.5 - ZK proof generation/verification

### 6.4 Tools
- **Hardhat**: Smart contract compilation, testing, deployment
- **MongoDB**: Document database
- **Node.js**: Runtime environment (18+)
- **npm**: Package manager

### 6.5 Standards
- **ERC-721**: Non-fungible token standard (OpenZeppelin implementation)
- **ERC-721URIStorage**: Token URI storage extension
- **JSON-RPC**: Ethereum JSON-RPC 2.0 for blockchain communication
- **REST API**: RESTful HTTP API design

---

## 7. Data Structures + Database Schema

### 7.1 Collections

**users**
- **Indexes**: `email` (unique), `walletAddress` (implicit)
- **Relations**: Referenced by `products.manufacturer`, `products.currentHolder`, `products.sender`, `batches.manufacturer`, `partnerships.sender`, `partnerships.receiver`

**products**
- **Indexes**: `blockchainId` (indexed), `uniqueProductId` (indexed)
- **Relations**: References `users` (manufacturer, currentHolder, sender), `batches` (batchId)

**batches**
- **Indexes**: `batchId` (unique, indexed), `manufacturer` (implicit)
- **Relations**: References `users` (manufacturer), `products` (products array)

**partnerships**
- **Indexes**: `{ sender: 1, receiver: 1 }` (unique compound index)
- **Relations**: References `users` (sender, receiver)

**globalcounters**
- **Indexes**: `name` (unique)
- **Relations**: None

### 7.2 Fields

**Critical Fields:**
- `products.blockchainId`: Links MongoDB document to on-chain product
- `products.uniqueProductId`: Human-readable identifier format: `MFR_{manufacturerId}_BATCH{batchNumber}_PROD{productNumber}`
- `batches.nftTokenId`: Globally unique NFT token ID (via GlobalCounter)
- `batches.manufacturerBatchNumber`: Manufacturer-specific batch counter
- `products.productNumberInBatch`: Sequential product number within batch (1-indexed)

### 7.3 Indexes
- `users.email`: Unique index
- `products.blockchainId`: Index for product lookup
- `products.uniqueProductId`: Index for product lookup
- `batches.batchId`: Unique index
- `partnerships.{sender, receiver}`: Unique compound index
- `globalcounters.name`: Unique index

### 7.4 Relations
- **One-to-Many**: User → Products (manufacturer), User → Batches (manufacturer)
- **Many-to-One**: Product → Batch (batchId), Product → User (manufacturer, currentHolder, sender)
- **Many-to-Many**: User ↔ User (via Partnerships, bidirectional)

---

## 8. API Endpoints (REST Technical Spec)

### 8.1 Authentication Endpoints

**POST `/api/auth/register`**
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "walletAddress": "string",
    "role": "manufacturer" | "distributor" | "warehouse" | "retailer",
    "companyName": "string" (optional)
  }
  ```
- **Response**: `{ token: "string", user: { id: "string", name: "string", role: "string" } }`
- **Status Codes**: 200 (success), 400 (validation error), 500 (server error)

**POST `/api/auth/login`**
- **Request Body**: `{ email: "string", password: "string" }`
- **Response**: `{ token: "string", user: { id: "string", name: "string", role: "string" } }`
- **Status Codes**: 200 (success), 400 (invalid credentials), 500 (server error)

**GET `/api/auth/me`**
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ id: "string", role: "string" }`
- **Status Codes**: 200 (success), 401 (unauthorized)

**GET `/api/auth/users`**
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `[{ id: "string", name: "string", email: "string", role: "string", companyName: "string", walletAddress: "string" }]`
- **Status Codes**: 200 (success), 401 (unauthorized), 500 (server error)

### 8.2 Product Endpoints

**POST `/api/products`**
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string",
    "manufactureDate": "ISO date string",
    "quantity": number (1-100, default: 1)
  }
  ```
- **Response**:
  ```json
  {
    "message": "string",
    "products": [{ blockchainId, uniqueProductId, name, description, qrCodeUrl, ... }],
    "count": number
  }
  ```
- **Status Codes**: 200 (success), 403 (forbidden), 500 (server error)

**GET `/api/products`**
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `[{ blockchainId, uniqueProductId, name, description, qrCodeUrl, batchBlockchainId, productNumberInBatch, ... }]`
- **Status Codes**: 200 (success), 401 (unauthorized), 500 (server error)
- **Filtering**: Returns products where user is manufacturer or current holder (on-chain check)

**GET `/api/products/:id`**
- **Request Params**: `id` (blockchainId or uniqueProductId)
- **Response**:
  ```json
  {
    "onchain": {
      "manufacturer": "address",
      "currentHolder": "address",
      "verifiedByCustomer": boolean,
      "isAuthentic": boolean,
      "customer": "address",
      "batchId": number,
      "history": [{ from, to, location, timestamp }]
    },
    "db": { name, description, manufactureDate, manufacturer: { name, companyName }, ... },
    "batch": { batchId, manufacturer, metadataURI, createdAt, productIds, nftOwner } (if applicable)
  }
  ```
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

**GET `/api/products/:id/qrcode`**
- **Headers**: `Authorization: Bearer {token}` (required)
- **Request Params**: `id` (blockchainId or uniqueProductId)
- **Response**: `{ qrCodeUrl: "data:image/png;base64,..." }`
- **Status Codes**: 200 (success), 403 (forbidden - manufacturer only), 404 (not found), 500 (server error)

**POST `/api/products/:id/transfer`**
- **Headers**: `Authorization: Bearer {token}`
- **Request Params**: `id` (blockchainId)
- **Request Body**:
  ```json
  {
    "toAddress": "address",
    "location": "string" (optional),
    "quantity": number (1-50, default: 1)
  }
  ```
- **Response**:
  ```json
  {
    "message": "string",
    "transfers": [{ productId, txHash }],
    "manufacturer": { name, companyName, address },
    "toAddress": "address",
    "location": "string"
  }
  ```
- **Status Codes**: 200 (success), 400 (transfer failed), 403 (forbidden), 500 (server error)
- **Validation**: Checks partnership requirement, current holder ownership

**POST `/api/products/:id/zk-proof`**
- **Headers**: `Authorization: Bearer {token}`
- **Request Params**: `id` (blockchainId)
- **Request Body**: `{ secret: "string" }` (optional)
- **Response**:
  ```json
  {
    "productId": number,
    "batchId": number,
    "proof": { a, b, c, publicSignals },
    "publicSignals": [number],
    "message": "string"
  }
  ```
- **Status Codes**: 200 (success), 400 (product not in batch), 500 (server error)

**POST `/api/products/:id/zk-verify`**
- **Request Params**: `id` (blockchainId)
- **Request Body**:
  ```json
  {
    "proof": { a: [string], b: [[string]], c: [string] },
    "batchId": number
  }
  ```
- **Response**: `{ verified: boolean, txHash: "string", productId: number, batchId: number }`
- **Status Codes**: 200 (success), 400 (verification failed), 500 (server error)

### 8.3 Batch Endpoints

**POST `/api/products/batch`**
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
  ```json
  {
    "metadataURI": "string" (optional),
    "products": [{ name, description, manufactureDate }],
    "quantity": number (optional, duplicates first product N times)
  }
  ```
- **Response**:
  ```json
  {
    "batch": { batchId, manufacturerBatchNumber, nftTokenId, quantity, ... },
    "products": [{ blockchainId, uniqueProductId, productNumberInBatch, ... }],
    "txHash": "string",
    "nftTokenId": number,
    "manufacturerBatchNumber": number
  }
  ```
- **Status Codes**: 200 (success), 400 (validation error), 403 (forbidden), 500 (server error)

**GET `/api/products/batch/list`**
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `[{ batchId, manufacturerBatchNumber, nftTokenId, quantity, products, manufacturer: { name, companyName }, ... }]`
- **Status Codes**: 200 (success), 401 (unauthorized), 500 (server error)
- **Filtering**: Manufacturers see all their batches; others see batches where they own all products

**GET `/api/products/batch/:batchId`**
- **Request Params**: `batchId` (number)
- **Response**:
  ```json
  {
    "onchain": {
      "batchId": number,
      "manufacturer": "address",
      "metadataURI": "string",
      "createdAt": number,
      "productIds": [number],
      "nftOwner": "address"
    },
    "db": { batchId, manufacturerBatchNumber, nftTokenId, products, ... }
  }
  ```
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

**POST `/api/products/batch/:batchId/transfer`**
- **Headers**: `Authorization: Bearer {token}`
- **Request Params**: `batchId` (number)
- **Request Body**: `{ toAddress: "address", location: "string" (optional) }`
- **Response**:
  ```json
  {
    "message": "string",
    "batchId": number,
    "transfers": [{ productId, txHash }],
    "manufacturer": { name, companyName, address },
    "toAddress": "address",
    "location": "string"
  }
  ```
- **Status Codes**: 200 (success), 400 (transfer failed), 403 (forbidden), 500 (server error)
- **Validation**: Verifies user owns all products in batch

### 8.4 Partnership Endpoints

**POST `/api/partnerships/request`**
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**: `{ receiverId: "string" }`
- **Response**: `{ _id, sender: { name, companyName, role }, receiver: { name, companyName, role }, status: "pending" }`
- **Status Codes**: 200 (success), 400 (already exists), 404 (receiver not found), 500 (server error)

**POST `/api/partnerships/:id/accept`**
- **Headers**: `Authorization: Bearer {token}`
- **Request Params**: `id` (partnership ObjectId)
- **Request Body**: `{ status: "accepted" | "rejected" }`
- **Response**: `{ _id, sender: { name, companyName, role }, receiver: { name, companyName, role }, status: "accepted" | "rejected" }`
- **Status Codes**: 200 (success), 400 (validation error), 403 (forbidden), 404 (not found), 500 (server error)

**GET `/api/partnerships/list`**
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `[{ _id, sender: { name, companyName, role }, receiver: { name, companyName, role }, status, createdAt }]`
- **Status Codes**: 200 (success), 401 (unauthorized), 500 (server error)

**GET `/api/partnerships/requests`**
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `[{ _id, sender: { name, companyName, role }, status: "pending", createdAt }]`
- **Status Codes**: 200 (success), 401 (unauthorized), 500 (server error)

---

## 9. Security Architecture

### 9.1 Cryptographic Primitives

**AES**
- Not used (no data encryption at rest)

**ECDSA**
- Used implicitly via Ethereum/Ethers.js for transaction signing
- Private key: Environment variable `PRIVATE_KEY`
- Signer: `ethers.Wallet(privateKey, provider)`

**Keccak256**
- **Usage**: Product ID hashing, secret generation, proof ID generation
- **Library**: Ethers.js `ethers.keccak256(bytes)`
- **Example**: `ethers.keccak256(ethers.toUtf8Bytes(\`secret-${productId}-${batchId}-${timestamp}\`))`

**SHA-256**
- Not directly used (Keccak256 preferred for Ethereum compatibility)

**HMAC**
- **Usage**: JWT signature (HMAC-SHA256)
- **Algorithm**: HS256
- **Secret**: Environment variable `JWT_SECRET`
- **Library**: `jsonwebtoken`

**JWT**
- **Algorithm**: HS256 (HMAC-SHA256)
- **Payload**: `{ id: userId, role: userRole }`
- **Expiration**: 7 days
- **Storage**: Client-side (localStorage)
- **Validation**: Middleware `auth()` function

**bcrypt**
- **Usage**: Password hashing
- **Rounds**: 10
- **Library**: `bcryptjs`
- **Storage**: Hashed passwords in MongoDB

**Poseidon Hash**
- **Usage**: ZK proof product hash computation
- **Library**: `circomlib.poseidon`
- **Input**: `[productId, secret]`
- **Output**: `productHash` (public signal)

### 9.2 QR Signature Verification
- QR codes contain URLs, not signed payloads
- Backend validates product existence via database lookup
- No cryptographic signature on QR code data
- Future enhancement: HMAC signature on QR code payload

### 9.3 Access Control
- **JWT-based authentication**: All protected endpoints require Bearer token
- **Role-based authorization**: Manufacturer-only endpoints check `user.role === 'manufacturer'`
- **Ownership validation**: Transfer endpoints verify on-chain `currentHolder`
- **Partnership enforcement**: Product transfers require accepted partnership (for `requiresPartnership` products)

### 9.4 Security Considerations
- **Private Key Management**: Environment variable (consider hardware wallet integration)
- **Password Storage**: bcrypt hashing (10 rounds)
- **JWT Secret**: Environment variable (use strong random secret)
- **CORS**: Configured for frontend origin only
- **Input Validation**: Express.js body parsing with size limits (2MB)
- **Replay Attack Prevention**: ZK proof verification uses `verifiedProofs` mapping

---

## 10. Complete End-to-End Flow Diagram

### 10.1 Product Registration Flow

```
Manufacturer (Frontend)
  ↓ POST /api/products/batch
Backend API
  ↓ Validate JWT, check role
  ↓ Increment manufacturer.batchCounter
  ↓ Get GlobalCounter.getNextCounter('nftTokenId')
  ↓ Prepare product data
  ↓
Blockchain Gateway (Ethers.js)
  ↓ contract.createBatch(metadataURI, productNames, manufactureDates)
Smart Contract (SupplyChainTracker.sol)
  ↓ Increment nextBatchId
  ↓ Create products (loop)
  ↓   - Increment nextProductId
  ↓   - Create Product struct
  ↓   - Emit ProductCreated event
  ↓ Create Batch struct
  ↓ Mint ERC-721 NFT (_safeMint)
  ↓ Set token URI (_setTokenURI)
  ↓ Emit BatchCreated, BatchNFTMinted events
  ↓ Return batchId
  ↑
Backend API
  ↓ Create Batch document (MongoDB)
  ↓ For each product:
  ↓   - Generate QR code (QRCode.toDataURL)
  ↓   - Generate ZK proof (generateBatchMembershipProof)
  ↓   - Create Product document
  ↓   - Set productNumberInBatch, uniqueProductId
  ↓ Update Batch with product references
  ↑
Manufacturer (Frontend)
  ↓ Display batch with QR codes
  ↓ "Print All QR Codes" functionality
```

### 10.2 Product Transfer Flow

```
Distributor (Frontend)
  ↓ POST /api/products/:id/transfer
Backend API
  ↓ Validate JWT
  ↓ Query contract.getProduct(productId)
  ↓ Verify currentHolder === user.walletAddress
  ↓ Check partnership (if requiresPartnership)
  ↓
Blockchain Gateway
  ↓ contract.transferProduct(productId, toAddress, location)
Smart Contract
  ↓ Verify !verifiedByCustomer
  ↓ Verify msg.sender == currentHolder
  ↓ Update currentHolder = to
  ↓ Push to transferHistory array
  ↓ Emit ProductTransferred event
  ↑
Backend API
  ↓ Update Product document (currentHolder, sender)
  ↑
Distributor (Frontend)
  ↓ Display success message
```

### 10.3 Customer Verification Flow

```
Customer (Mobile Browser)
  ↓ Scan QR code
  ↓ Navigate to /verify/{blockchainId}
Frontend (VerifyProduct.jsx)
  ↓ GET /api/products/{blockchainId}
Backend API
  ↓ Query contract.getProduct(productId)
  ↓ Query Product.findOne({ blockchainId })
  ↓ Query Batch (if batchId > 0)
  ↓ Return onchain, db, batch data
  ↑
Frontend (Private Mode)
  ↓ Display:
  ↓   - Product name, description
  ↓   - Manufacture date
  ↓   - "✅ Authentic - Verified through X checkpoints"
  ↓ Hide: company names, locations, addresses
  ↓
Customer (Optional Verification)
  ↓ Connect MetaMask wallet
  ↓ contract.verifyAsCustomer(productId)
Smart Contract
  ↓ Verify !verifiedByCustomer
  ↓ Set verifiedByCustomer = true
  ↓ Set customerVerifier = msg.sender
  ↓ Emit ProductVerified event
  ↓ Product becomes non-transferable
  ↑
Customer (Frontend)
  ↓ Display verification success
```

---

## 11. Limitations & Future Enhancements

### 11.1 Current Limitations

**ZK Proof Implementation:**
- Mock proof generation (not using compiled Circom circuits)
- No trusted setup ceremony performed
- Simplified on-chain verification (does not call actual ZK verifier contract)
- Proof structure matches Groth16 format but values are placeholders

**Smart Contract:**
- Transfer history stored as unbounded array (gas cost increases with history length)
- No pagination for transfer history queries
- Batch product limit not enforced (could exceed gas limits)
- ZK verifier contract not deployed (simplified verification used)

**Backend:**
- No IPFS integration (metadata URIs are placeholders)
- Single private key for all transactions (not scalable)
- No rate limiting on API endpoints
- No caching layer (all queries hit database/blockchain)

**Security:**
- QR codes not cryptographically signed
- No encryption for sensitive data at rest
- JWT tokens stored in localStorage (XSS vulnerability)
- No HTTPS enforcement (development only)

**Database:**
- No data archival strategy (transfer history grows unbounded)
- No backup/restore procedures documented
- MongoDB connection pooling not optimized

### 11.2 Future Enhancements

**ZK Proof System:**
- Compile Circom circuits and generate trusted setup
- Deploy ZK verifier contract (Groth16 verifier)
- Integrate snarkjs for actual proof generation
- Implement proof batching for multiple products

**Smart Contract:**
- Implement transfer history pagination (event-based queries)
- Add batch size limits (gas optimization)
- Deploy separate ZK verifier contract
- Implement upgradeable proxy pattern (UUPS)

**Backend:**
- Integrate IPFS pinning service (Pinata, Infura)
- Implement HD wallet derivation for multiple manufacturers
- Add Redis caching layer
- Implement rate limiting (express-rate-limit)
- Add API versioning (/api/v1/...)

**Security:**
- Sign QR codes with HMAC-SHA256
- Encrypt sensitive data at rest (AES-256-GCM)
- Implement HTTP-only cookies for JWT storage
- Add HTTPS/TLS enforcement
- Implement 2FA for manufacturer accounts

**Database:**
- Implement data archival for old transfer history
- Add MongoDB replica set configuration
- Implement database backup automation
- Add query optimization indexes

**Scalability:**
- Implement message queue (RabbitMQ/Redis) for async tasks
- Add horizontal scaling (load balancer, multiple backend instances)
- Implement CDN for static assets (QR code images)
- Add database sharding for large-scale deployments

---

## Appendix A: Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/supply-chain
JWT_SECRET=<strong-random-secret>
CONTRACT_ADDRESS=<deployed-contract-address>
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=<ethereum-private-key>
FRONTEND_URL=http://localhost:5173
PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=<deployed-contract-address>
```

### Blockchain (hardhat.config.js)
```
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=<ethereum-private-key>
```

---

## Appendix B: Deployment Checklist

1. **Smart Contract Deployment**
   - Compile contracts: `npx hardhat compile`
   - Deploy to network: `npx hardhat run scripts/deploy.js --network mumbai`
   - Set `CONTRACT_ADDRESS` in backend `.env`
   - Authorize manufacturer addresses: `contract.setManufacturer(address, true)`

2. **Backend Deployment**
   - Set environment variables
   - Install dependencies: `npm install`
   - Start server: `npm run dev` or `node server.js`
   - Verify health: `GET /api/health`

3. **Frontend Deployment**
   - Set environment variables
   - Install dependencies: `npm install`
   - Build: `npm run build`
   - Serve static files (nginx, Vercel, Netlify)

4. **Database Setup**
   - MongoDB instance (local or cloud)
   - Set `MONGODB_URI`
   - Collections created automatically on first use

---

## Appendix C: API Response Examples

### Product Creation Response
```json
{
  "message": "Successfully created 10 product(s)",
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "blockchainId": 123,
      "uniqueProductId": "MFR_507f1f77bcf86cd799439011_1704067200_001",
      "name": "Product Name #1",
      "description": "Product description",
      "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "manufactureDate": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 10
}
```

### Batch Creation Response
```json
{
  "batch": {
    "_id": "507f1f77bcf86cd799439012",
    "batchId": 5,
    "manufacturerBatchNumber": 3,
    "nftTokenId": 1001,
    "quantity": 10,
    "manufacturer": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "products": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "blockchainId": 124,
      "uniqueProductId": "MFR_507f1f77bcf86cd799439011_BATCH3_PROD1",
      "productNumberInBatch": 1,
      "batchBlockchainId": 5,
      "zkProofGenerated": true
    }
  ],
  "txHash": "0x1234567890abcdef...",
  "nftTokenId": 1001,
  "manufacturerBatchNumber": 3
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Development Team

