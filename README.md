# Supply Chain Transparency System (Blockchain Anti-Counterfeit)

A full-stack product authentication platform. Manufacturers register products on-chain, partners transfer custody, and customers verify authenticity by scanning a QR code. One-time verification on blockchain prevents QR duplication.

## Stack
- Frontend: React (Vite), TailwindCSS, React Router, Axios, Ethers v6, html5-qrcode
- Backend: Node/Express, MongoDB/Mongoose, JWT, bcryptjs, node-qrcode, Ethers v6
- Blockchain: Solidity, Hardhat, Polygon Mumbai

## Quick Start

### 1) Blockchain
1. Create `blockchain/.env` (not committed):
```
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```
2. Compile & deploy:
```bash
cd blockchain
npm install
npm run compile
npm run deploy:mumbai
```
3. Copy the printed contract address.

### 2) Backend
1. Create `backend/.env` (not committed):
```
MONGODB_URI=mongodb://localhost:27017/supply-chain
JWT_SECRET=replace-with-strong-secret
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
CONTRACT_ADDRESS=0x...   # from deploy step
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
FRONTEND_URL=http://localhost:5173
```
2. Install and run:
```bash
cd backend
npm install
npm run dev
```

### 3) Frontend
1. Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0x...   # from deploy step
VITE_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
```
2. Install and run:
```bash
cd frontend
npm install
npm run dev
```

## User Flow
- Manufacturer: Create product → QR generated → Transfer to next party
- Partner: Scan QR → Confirm receipt → Transfer to next party
- Customer: Scan QR → View journey → Verify Ownership (one-time)

## Endpoints (Backend)
- POST `/api/auth/register`, `/api/auth/login`
- POST `/api/products` (manufacturer only) → on-chain create + QR
- GET `/api/products` (auth) → list
- GET `/api/products/:id` (public) → on-chain state + DB details
- POST `/api/products/:id/transfer` (auth) → on-chain transfer
- GET `/api/products/:id/qrcode` (public) → QR image data URL

## Contract Highlights
- `createProduct(name, date)` manufacturer-only
- `transferProduct(productId, to, location)` current holder only
- `verifyAsCustomer(productId)` one-time; blocks reuse attacks
- `getProduct`, `getTransferHistory`

## Demo Scenario
1) Create product (Manufacturer) and download QR
2) Scan/transfer through partners
3) Customer scans QR and verifies ownership
4) Second customer scan shows “Already verified”

## Notes
- Use Amoy faucets to fund the deployer with test MATIC.
- Ensure MetaMask is on Amoy when verifying ownership.
- Security: JWT on protected routes, bcrypt password hashing, role checks in contract and API.
