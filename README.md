# Supply Chain Transparency & Anti-Counterfeit System

A comprehensive blockchain-based supply chain management platform that ensures product authenticity, tracks product journeys, and prevents counterfeiting through QR code verification and immutable blockchain records.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [How It Works (Non-Technical)](#how-it-works-non-technical)
4. [How It Works (Technical)](#how-it-works-technical)
5. [Architecture](#architecture)
6. [Technology Stack](#technology-stack)
7. [Project Structure](#project-structure)
8. [Setup & Installation](#setup--installation)
9. [API Documentation](#api-documentation)
10. [Smart Contract Details](#smart-contract-details)
11. [Database Schema](#database-schema)
12. [User Roles & Workflows](#user-roles--workflows)
13. [Security Features](#security-features)
14. [Deployment](#deployment)

---

## 🎯 Project Overview

### Non-Technical Description

This system is like a **digital passport for products**. Imagine every product you buy has a unique QR code that tells you:
- **Who made it** (manufacturer)
- **Where it's been** (complete journey through supply chain)
- **If it's real** (authenticity verification)
- **Who owns it now** (current holder)

**The Problem It Solves:**
- Prevents fake products from entering the market
- Provides complete transparency in supply chains
- Allows customers to verify product authenticity instantly
- Creates an immutable record that can't be tampered with

**How It Works Simply:**
1. **Manufacturer** creates a product and gets a unique QR code
2. **Distributors/Warehouses/Retailers** scan and transfer products as they move
3. **Customers** scan the QR code to see the complete journey and verify authenticity
4. **Blockchain** stores all this information permanently and securely

### Technical Description

A **full-stack decentralized application (dApp)** that combines:
- **Blockchain Layer**: Smart contracts on Polygon for immutable product records
- **Backend API**: Node.js/Express server managing database and blockchain interactions
- **Frontend**: React-based web application for user interactions
- **QR Code System**: Unique QR codes linking physical products to blockchain records

The system uses **ERC-721 NFTs** for batch management, **zero-knowledge proofs** for privacy-preserving verification, and **JWT authentication** for secure API access.

---

## ✨ Features

### Core Features
- ✅ **Product Registration**: Manufacturers create products on blockchain
- ✅ **Batch Management**: Create batches with multiple products and mint NFTs
- ✅ **QR Code Generation**: Automatic QR code generation for each product
- ✅ **Supply Chain Tracking**: Complete transfer history from manufacturer to customer
- ✅ **Product Verification**: Customers can verify product authenticity
- ✅ **One-Time Verification**: Prevents QR code duplication attacks
- ✅ **Role-Based Access**: Different dashboards for different user roles
- ✅ **Batch Transfers**: Transfer entire batches with one click
- ✅ **ZK Proof Support**: Privacy-preserving batch membership verification

### Advanced Features
- 🔐 **Hardhat Account Impersonation**: For local development testing
- 📊 **Inventory Management**: Track products at each stage
- 🔍 **Product History**: View complete supply chain journey
- 🖼️ **NFT Integration**: Each batch gets a unique NFT token
- 📱 **Mobile-Friendly**: QR codes work with any smartphone camera

---

## 🔄 How It Works (Non-Technical)

### The Journey of a Product

1. **Manufacturing Stage**
   - Manufacturer creates a product in the system
   - System generates a unique QR code
   - Product is registered on blockchain (like a birth certificate)

2. **Distribution Stage**
   - Manufacturer transfers product to Distributor
   - Distributor scans QR code to confirm receipt
   - Transfer is recorded on blockchain (permanent record)

3. **Warehouse Stage**
   - Distributor transfers to Warehouse
   - Warehouse manages inventory
   - All movements tracked on blockchain

4. **Retail Stage**
   - Warehouse transfers to Retailer
   - Retailer prints QR codes and attaches to products
   - Products ready for sale

5. **Customer Stage**
   - Customer buys product
   - Scans QR code with phone
   - Sees complete journey and verifies authenticity
   - Can verify ownership on blockchain (one-time, permanent)

### Why It's Secure

- **Blockchain = Permanent Record**: Once recorded, can't be changed
- **QR Code = Unique Identity**: Each product has one unique code
- **One-Time Verification**: Once verified by a customer, can't be verified again (prevents fake products)
- **Transparent Journey**: Everyone can see where the product has been

---

## ⚙️ How It Works (Technical)

### System Architecture Flow

```
┌─────────────┐
│   Frontend  │  React App (User Interface)
│  (React)    │
└──────┬──────┘
       │ HTTP/REST API
       ▼
┌─────────────┐
│   Backend   │  Express Server (Business Logic)
│  (Node.js)  │
└──────┬──────┘
       │
       ├──► MongoDB (Product Metadata, Users)
       │
       └──► Smart Contract (Blockchain State)
              │
              ▼
         Polygon Network
```

### Technical Flow

1. **Product Creation**
   ```
   User Input → Frontend → Backend API → Smart Contract
   → Blockchain Transaction → Event Emitted
   → Backend Listens → Saves to MongoDB → Generates QR Code
   → Returns to Frontend → Displays QR Code
   ```

2. **Product Transfer**
   ```
   User Initiates Transfer → Backend Validates Ownership
   → Smart Contract Transfer Function → Blockchain Transaction
   → Event Emitted → Backend Updates Database
   → Recipient Sees Product in Dashboard
   ```

3. **Product Verification**
   ```
   Customer Scans QR → Frontend Decodes URL
   → Fetches Product Data (Public API)
   → Displays Blockchain State + Database Details
   → Optional: Customer Verifies Ownership (On-Chain)
   ```

### Key Technical Components

**Blockchain Layer:**
- Smart contract stores: product ownership, transfer history, verification status
- Events emitted for: product creation, transfers, verifications
- ERC-721 NFT for batch representation

**Backend Layer:**
- RESTful API for all operations
- JWT authentication for protected routes
- MongoDB for metadata storage
- Ethers.js for blockchain interactions
- QR code generation using node-qrcode

**Frontend Layer:**
- React Router for navigation
- Axios for API calls
- Ethers.js for blockchain interactions (customer verification)
- Responsive design with TailwindCSS

---

## 🏗️ Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Frontend - User Interface)      │
└─────────────────────────────────────────┘
                  ↕ HTTP/REST
┌─────────────────────────────────────────┐
│         Application Layer                │
│  (Node.js/Express - Business Logic)     │
└─────────────────────────────────────────┘
                  ↕
        ┌─────────┴─────────┐
        ↕                   ↕
┌──────────────┐    ┌──────────────┐
│   MongoDB    │    │  Blockchain  │
│  (Database)  │    │  (Polygon)   │
└──────────────┘    └──────────────┘
```

### Component Interaction

1. **Frontend Components**
   - Pages: Login, Register, Dashboards, Verify Product
   - Components: Layout, Navigation
   - Services: API calls, blockchain interactions

2. **Backend Services**
   - Authentication: JWT token generation/validation
   - Product Management: CRUD operations
   - Blockchain Integration: Contract calls, transaction handling
   - QR Code Generation: Dynamic QR code creation

3. **Smart Contract**
   - Product Registry: Store product data
   - Transfer Logic: Ownership management
   - Verification System: One-time customer verification
   - Batch Management: NFT minting for batches

---

## 🛠️ Technology Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client
- **Ethers.js v6**: Blockchain interaction library
- **html5-qrcode**: QR code scanning

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **node-qrcode**: QR code generation
- **Ethers.js v6**: Blockchain interaction

### Blockchain
- **Solidity**: Smart contract language
- **Hardhat**: Development environment
- **Polygon**: Layer 2 blockchain network
- **OpenZeppelin**: Secure smart contract libraries
- **ERC-721**: NFT standard for batches

### Development Tools
- **Git**: Version control
- **npm**: Package manager
- **ESLint**: Code linting

---

## 📁 Project Structure

```
supply-chain-tracker/
│
├── backend/                    # Backend API Server
│   ├── models/                 # Database models
│   │   ├── User.js             # User schema
│   │   ├── Product.js          # Product schema
│   │   └── Batch.js            # Batch schema
│   ├── routes/                 # API routes
│   │   ├── auth.js            # Authentication routes
│   │   └── products.js        # Product management routes
│   ├── sc-abi/                 # Smart contract ABI
│   │   └── SupplyChainTracker.json
│   ├── server.js               # Express server entry point
│   └── package.json
│
├── blockchain/                 # Smart Contract Project
│   ├── contracts/              # Solidity contracts
│   │   └── SupplyChainTracker.sol
│   ├── scripts/                # Deployment scripts
│   │   └── deploy.js
│   ├── circuits/               # ZK circuit files
│   │   └── batch_membership.circom
│   ├── zk-utils/               # ZK proof utilities
│   │   └── generateProof.js
│   ├── hardhat.config.js       # Hardhat configuration
│   └── package.json
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── ManufacturerDashboard.jsx
│   │   │   ├── DistributorDashboard.jsx
│   │   │   ├── WarehouseDashboard.jsx
│   │   │   ├── RetailerDashboard.jsx
│   │   │   ├── VerifyProduct.jsx
│   │   │   ├── TestQRCode.jsx
│   │   │   └── SupplyChainDashboard.jsx
│   │   ├── components/         # Reusable components
│   │   │   └── Layout.jsx
│   │   ├── contract/           # Contract ABI for frontend
│   │   │   └── SupplyChainTracker.json
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── vite.config.js
│   └── package.json
│
├── README.md                   # This file
├── QUICK_START_GUIDE.md        # Quick setup guide
└── USER_FLOW_GUIDE.md          # Detailed user workflows
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Hardhat (for blockchain development)
- MetaMask (for customer verification)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd supply-chain-tracker
```

### Step 2: Blockchain Setup

```bash
cd blockchain
npm install

# Create .env file
cat > .env << EOF
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
EOF

# Compile contracts
npm run compile

# Deploy to Polygon Amoy (testnet)
npm run deploy:mumbai

# Copy the contract address from output
```

### Step 3: Backend Setup

```bash
cd ../backend
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/supply-chain
JWT_SECRET=your-super-secret-jwt-key-change-this
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
CONTRACT_ADDRESS=0x... # From deployment step
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
FRONTEND_URL=http://localhost:5173
EOF

# Start MongoDB (if local)
# mongod

# Start backend server
npm run dev
```

### Step 4: Frontend Setup

```bash
cd ../frontend
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0x... # From deployment step
VITE_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
EOF

# Start development server
npm run dev
```

### Step 5: Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/products/test-contract

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "walletAddress": "0x...",
  "role": "manufacturer",
  "companyName": "ABC Corp"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: { "token": "jwt-token", "user": {...} }
```

### Product Endpoints

#### Create Product (Manufacturer Only)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "manufactureDate": "2024-01-15",
  "quantity": 1
}
```

#### Create Batch (Manufacturer Only)
```http
POST /api/products/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "metadataURI": "ipfs://...",
  "products": [
    {
      "name": "Product 1",
      "description": "Description",
      "manufactureDate": "2024-01-15"
    }
  ],
  "quantity": 5  // Optional: create N products with same details
}
```

#### Get Products (Authenticated)
```http
GET /api/products
Authorization: Bearer <token>
```

#### Get Product Details (Public)
```http
GET /api/products/:id
```

#### Transfer Product
```http
POST /api/products/:id/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "toAddress": "0x...",
  "location": "Warehouse A",
  "quantity": 1
}
```

#### Transfer Entire Batch
```http
POST /api/products/batch/:batchId/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "toAddress": "0x...",
  "location": "Distribution Center"
}
```

#### Get Batch List
```http
GET /api/products/batch/list
Authorization: Bearer <token>
```

#### Get QR Code
```http
GET /api/products/:id/qrcode
```

---

## 🔐 Smart Contract Details

### Contract: SupplyChainTracker.sol

**Inherits:**
- ERC721URIStorage (for batch NFTs)
- Ownable (for access control)

### Key Functions

#### Product Management
```solidity
function createProduct(string name, string date) 
    → Creates single product, returns productId

function createBatch(string metadataURI, string[] productNames, string[] dates)
    → Creates batch, mints NFT, returns batchId
```

#### Transfer Functions
```solidity
function transferProduct(uint256 productId, address to, string location)
    → Transfers product ownership, records location
```

#### Verification
```solidity
function verifyAsCustomer(uint256 productId)
    → One-time verification, prevents reuse
```

#### Query Functions
```solidity
function getProduct(uint256 productId)
    → Returns: manufacturer, currentHolder, verified, batchId

function getTransferHistory(uint256 productId)
    → Returns array of all transfers

function getBatch(uint256 batchId)
    → Returns batch details and product IDs
```

### Events
- `ProductCreated`: Emitted when product is created
- `ProductTransferred`: Emitted on each transfer
- `ProductVerified`: Emitted when customer verifies
- `BatchCreated`: Emitted when batch is created
- `BatchNFTMinted`: Emitted when batch NFT is minted

### Security Features
- Only authorized manufacturers can create products
- Only current holder can transfer
- One-time customer verification (prevents reuse)
- Owner can authorize new manufacturers

---

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  walletAddress: String (required),
  role: Enum ['manufacturer', 'distributor', 'warehouse', 'retailer'],
  companyName: String (optional)
}
```

### Product Model
```javascript
{
  blockchainId: Number (unique, indexed),
  name: String,
  description: String,
  manufacturer: ObjectId (ref: User),
  batchId: ObjectId (ref: Batch, optional),
  batchBlockchainId: Number,
  sku: String,
  imageUrl: String,
  qrCodeUrl: String,
  manufactureDate: Date,
  zkProof: Mixed,
  zkProofGenerated: Boolean,
  zkProofGeneratedAt: Date
}
```

### Batch Model
```javascript
{
  batchId: Number (unique, indexed),
  manufacturer: ObjectId (ref: User),
  metadataURI: String,
  nftTokenId: Number (unique),
  products: [ObjectId] (ref: Product),
  quantity: Number,
  createdAt: Date
}
```

---

## 👥 User Roles & Workflows

### Manufacturer
**Responsibilities:**
- Create products (single or batch)
- Generate QR codes
- Transfer products to distributors
- Generate ZK proofs for batches

**Dashboard Features:**
- Create single products
- Create batches with NFT minting
- View all created products
- Transfer products/batches
- Generate ZK proofs

### Distributor
**Responsibilities:**
- Receive products from manufacturer
- Transfer products to warehouses/retailers
- Track inventory

**Dashboard Features:**
- View received products
- Transfer individual products
- Transfer entire batches
- View product details

### Warehouse
**Responsibilities:**
- Store products
- Manage inventory
- Transfer to retailers

**Dashboard Features:**
- View inventory
- Transfer products/batches
- Inventory statistics

### Retailer
**Responsibilities:**
- Receive products
- Print QR codes
- Sell to customers

**Dashboard Features:**
- View inventory
- Print QR codes
- Transfer products

### Customer
**Responsibilities:**
- Verify product authenticity
- View supply chain history

**Features:**
- Scan QR code
- View product details
- Verify ownership (one-time)
- View complete journey

---

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Protected API routes

### Blockchain Security
- Only authorized manufacturers can create products
- Only current holder can transfer
- One-time verification prevents reuse
- Immutable transfer history

### Data Security
- Environment variables for sensitive data
- Input validation on all endpoints
- SQL injection prevention (MongoDB)
- CORS configuration

### QR Code Security
- Unique QR codes per product
- Links to blockchain verification
- One-time customer verification
- Prevents duplication attacks

---

## 🚢 Deployment

### Backend Deployment (Example: Heroku/Railway)
```bash
# Set environment variables
MONGODB_URI=...
JWT_SECRET=...
CONTRACT_ADDRESS=...
PRIVATE_KEY=...
POLYGON_RPC_URL=...
FRONTEND_URL=...

# Deploy
git push heroku main
```

### Frontend Deployment (Example: Vercel/Netlify)
```bash
# Set environment variables
VITE_API_URL=...
VITE_CONTRACT_ADDRESS=...
VITE_POLYGON_RPC_URL=...

# Deploy
npm run build
# Upload dist/ folder
```

### Blockchain Deployment
```bash
# Deploy to Polygon Mainnet
npm run deploy:mainnet

# Or use Hardhat scripts
npx hardhat run scripts/deploy.js --network polygon
```

---

## 📝 Additional Documentation

- **QUICK_START_GUIDE.md**: Step-by-step quick start
- **USER_FLOW_GUIDE.md**: Detailed user workflows
- **BATCH_NFT_ZK_IMPLEMENTATION.md**: ZK proof implementation details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

## 🎯 Future Enhancements

- [ ] IPFS integration for metadata storage
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] Real ZK proof verification (currently simplified)
- [ ] Email notifications
- [ ] API rate limiting
- [ ] GraphQL API option
- [ ] WebSocket for real-time updates

---

**Built with ❤️ for transparent and secure supply chains**
