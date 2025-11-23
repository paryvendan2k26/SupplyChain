# Complete User Flow Guide - Supply Chain Transparency Platform

## Overview
This guide covers the complete user journey for all roles in the blockchain-based supply chain transparency platform.

---

## Role Definitions

1. **Manufacturer** - Creates products/batches, mints NFTs, generates QR codes
2. **Distributor** - Receives products from manufacturers, distributes to warehouses/retailers
3. **Warehouse** - Stores products, manages inventory
4. **Retailer** - Sells products to end customers
5. **Customer/End-User** - Purchases products and verifies authenticity via QR codes

---

## User Flow by Role

### 🔷 **MANUFACTURER**

#### **Step 1: Registration**
1. Navigate to registration page (`/register`)
2. Fill in registration form:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: Secure password
   - **Wallet Address**: Your Ethereum wallet address (for blockchain interactions)
   - **Role**: Select "manufacturer"
   - **Company Name**: Your manufacturing company name (optional)
3. Click "Register"
4. Backend creates user account in MongoDB
5. Receive JWT token for authentication
6. Automatically redirected to Manufacturer Dashboard

#### **Step 2: Login (Future Sessions)**
1. Navigate to login page (`/login`)
2. Enter email and password
3. Click "Login"
4. Receive JWT token
5. Redirected to Manufacturer Dashboard

#### **Step 3: Choose Product Creation Method**

**Option A: Create Single Product**
1. In Manufacturer Dashboard, stay on "Single Product" tab (default)
2. Fill in product details:
   - **Product Name**: Name of the product
   - **Description**: Detailed description (optional)
   - **Manufacture Date**: Select date
3. Click "Create Product"
4. Backend calls smart contract `createProduct()` function
5. Product ID generated on-chain (blockchainId)
6. QR code automatically generated
7. Product saved in MongoDB with blockchain ID
8. Product appears in "Your Products" table
9. QR code visible in table

**Option B: Create Batch with NFT Minting**
1. Switch to "Create Batch (NFT)" tab
2. Enter batch metadata URI (optional - defaults to IPFS URI)
3. Add products to batch:
   - Click "+ Add Product" button
   - Enter product details for each:
     - Product Name (required)
     - Description (optional)
     - Manufacture Date (optional - defaults to today)
   - Can add multiple products
   - Can remove products with "Remove" button
4. Click "Create Batch & Mint NFT"
5. Backend calls smart contract `createBatch()` function
6. **On-chain actions**:
   - All products created atomically
   - ERC-721 NFT minted for the batch
   - NFT token ID = Batch ID
   - NFT owned by manufacturer's wallet
7. Batch saved in MongoDB
8. All products saved with `batchBlockchainId` reference
9. QR codes generated for each product
10. Batch appears in "Your Batches" table
11. Each product in batch shows batch ID badge

#### **Step 4: Generate ZK Proof (Optional - Privacy Verification)**
1. For products in a batch, locate product in "Your Products" table
2. Click "Generate ZK Proof" button
3. Backend generates zero-knowledge proof that:
   - Proves product belongs to batch
   - Doesn't reveal sensitive details
4. Proof stored in database
5. Confirmation message shown

#### **Step 5: Transfer Product to Next Stage**
1. Click on product in dashboard
2. Navigate to transfer interface (if implemented)
3. Enter recipient address (Distributor/Warehouse wallet)
4. Enter location details
5. Submit transfer
6. Backend calls `transferProduct()` on smart contract
7. On-chain transfer recorded
8. Transfer history updated
9. Product ownership changes on blockchain

#### **Step 6: View Product History**
1. Click on any product
2. View complete transfer history
3. See all previous holders
4. View blockchain verification status

---

### 🔶 **DISTRIBUTOR**

#### **Step 1: Registration**
1. Navigate to registration page (`/register`)
2. Fill in registration form:
   - **Name**: Full name
   - **Email**: Email address
   - **Password**: Secure password
   - **Wallet Address**: Ethereum wallet address
   - **Role**: Select "distributor"
   - **Company Name**: Distribution company name (optional)
3. Click "Register"
4. Receive JWT token
5. Redirected to appropriate dashboard

#### **Step 2: Receive Products**
1. Manufacturer transfers product to distributor's wallet address
2. Distributor can view received products in dashboard
3. Product shows:
   - Previous holder (Manufacturer)
   - Current holder (Distributor - you)
   - Transfer history
   - Location information

#### **Step 3: Transfer to Warehouse/Retailer**
1. Select product to transfer
2. Enter recipient wallet address (Warehouse or Retailer)
3. Enter location/destination
4. Submit transfer
5. Transaction recorded on blockchain
6. Product ownership transfers
7. Transfer added to history

#### **Step 4: Track Inventory**
1. View all products currently in possession
2. Check product details
3. Verify authenticity on-chain
4. Monitor transfer history

---

### 📦 **WAREHOUSE**

#### **Step 1: Registration**
1. Navigate to registration page (`/register`)
2. Fill in registration form:
   - **Name**: Full name
   - **Email**: Email address
   - **Password**: Secure password
   - **Wallet Address**: Ethereum wallet address
   - **Role**: Select "warehouse"
   - **Company Name**: Warehouse name (optional)
3. Click "Register"
4. Receive JWT token

#### **Step 2: Receive Products**
1. Receive products from Manufacturer or Distributor
2. Transfer recorded on blockchain
3. Products appear in inventory
4. View product details and batch information

#### **Step 3: Manage Inventory**
1. View all stored products
2. Check product authenticity via blockchain
3. Verify batch information
4. Monitor storage locations

#### **Step 4: Transfer to Retailer**
1. Select product to ship
2. Enter retailer's wallet address
3. Enter destination/location
4. Submit transfer
5. On-chain transfer completed
6. Product ownership changes

---

### 🏪 **RETAILER**

#### **Step 1: Registration**
1. Navigate to registration page (`/register`)
2. Fill in registration form:
   - **Name**: Full name
   - **Email**: Email address
   - **Password**: Secure password
   - **Wallet Address**: Ethereum wallet address
   - **Role**: Select "retailer"
   - **Company Name**: Store/retailer name (optional)
3. Click "Register"
4. Receive JWT token

#### **Step 2: Receive Products**
1. Receive products from Warehouse or Distributor
2. Transfer recorded on blockchain
3. Products appear in inventory
4. QR codes available for printing

#### **Step 3: Display Products**
1. View product inventory
2. Print QR codes for each product
3. Attach QR codes to physical products
4. Products ready for customer purchase

#### **Step 4: Sell to Customer**
1. Customer purchases product
2. Product ownership can optionally transfer to customer
3. Customer receives product with QR code
4. Customer can verify authenticity

---

### 👤 **CUSTOMER/END-USER**

#### **Step 1: Access Product Verification Page**
**Method A: Via QR Code**
1. Receive product with QR code attached
2. Scan QR code with mobile device
3. Automatically redirected to verification page
4. URL format: `http://your-frontend-url/verify/{productId}`

**Method B: Direct URL**
1. Navigate to verification page
2. Enter product ID manually
3. Or enter verification URL from product packaging

#### **Step 2: View Product Information**
1. Product details displayed:
   - **Product Name**: Name of the product
   - **Manufacturer**: Company name
   - **Manufacture Date**: When product was made
   - **Description**: Product details

#### **Step 3: Blockchain Verification**
1. System fetches on-chain data:
   - **Blockchain ID**: Unique product identifier
   - **Manufacturer Address**: Verified manufacturer wallet
   - **Current Holder**: Current owner's wallet
   - **Transfer History**: Complete supply chain journey
   - **Verification Status**: Authentic or not
   - **Batch Information**: If part of a batch, shows NFT info

#### **Step 4: Verify Authenticity**
1. System checks:
   - Product exists on blockchain ✓
   - Manufacturer is authorized ✓
   - Transfer history is valid ✓
   - No tampering detected ✓
2. Display verification result:
   - ✅ **AUTHENTIC**: Green checkmark, product is genuine
   - ❌ **NOT AUTHENTIC**: Warning message if issues found

#### **Step 5: View Supply Chain Journey**
1. See complete transfer history:
   - Manufacturer → Distributor
   - Distributor → Warehouse
   - Warehouse → Retailer
   - Retailer → Customer (if transferred)
2. View locations and timestamps
3. Verify each step is legitimate

#### **Step 6: Verify as Customer (Optional)**
1. If wallet connected, can click "Verify as Customer"
2. On-chain verification transaction
3. Product marked as customer-verified
4. Cannot be transferred after customer verification
5. Permanently authenticated

#### **Step 7: ZK Proof Verification (Advanced)**
1. If product has ZK proof:
   - View proof status
   - Verify batch membership without revealing details
   - Privacy-preserving verification

---

## Complete Supply Chain Flow (End-to-End)

### **Phase 1: Product Creation** 🏭
```
Manufacturer
  ↓
  1. Register Account
  2. Create Batch (or Single Product)
  3. NFT Minted for Batch
  4. Products Created on Blockchain
  5. QR Codes Generated
```

### **Phase 2: Distribution** 🚚
```
Manufacturer
  ↓ Transfer Product
Distributor
  ↓ Transfer Product
Warehouse (or skip to Retailer)
```

### **Phase 3: Retail** 🏪
```
Warehouse
  ↓ Transfer Product
Retailer
  ↓ Display & Sell
```

### **Phase 4: Customer Verification** 👤
```
Customer
  ↓ Scan QR Code
Verification Page
  ↓ Check Blockchain
Authentic Product ✅
```

---

## Key Features Used in Each Flow

### **Blockchain Features:**
- ✅ Product creation on-chain (immutable record)
- ✅ Batch NFT minting (ERC-721)
- ✅ Transfer tracking (complete history)
- ✅ Ownership verification
- ✅ ZK proof generation/verification

### **Database Features:**
- ✅ User authentication (JWT)
- ✅ Product metadata storage
- ✅ QR code storage
- ✅ Batch information
- ✅ ZK proof storage

### **Security Features:**
- ✅ Cryptographically signed QR codes
- ✅ Blockchain immutability
- ✅ Manufacturer authorization
- ✅ Transfer validation
- ✅ Customer verification (permanent)

---

## Typical User Journeys

### **Journey 1: Luxury Watch**
1. Manufacturer creates batch of 100 luxury watches
2. NFT minted representing the batch
3. Each watch gets QR code
4. Batch transferred to Distributor
5. Distributor sends to Warehouse
6. Warehouse ships to Retailer
7. Customer buys watch, scans QR
8. Verification shows: Authentic ✅
9. Customer views full supply chain history
10. Customer verifies on-chain (optional)

### **Journey 2: Pharmaceuticals**
1. Manufacturer creates batch of medicines
2. ZK proof generated for batch membership
3. Transferred through distribution chain
4. Customer verifies authenticity
5. Privacy-preserving proof confirms legitimacy
6. Supply chain remains transparent but confidential

### **Journey 3: Single Product (Legacy)**
1. Manufacturer creates single product (not in batch)
2. Product gets blockchain ID
3. QR code generated
4. Follows same distribution flow
5. Customer verifies authenticity

---

## API Endpoints Used

### **Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Products:**
- `POST /api/products` - Create single product
- `POST /api/products/batch` - Create batch with NFT
- `GET /api/products` - List products (filtered by role)
- `GET /api/products/:id` - Get product details
- `GET /api/products/:id/qrcode` - Get QR code

### **Batches:**
- `GET /api/products/batch/list` - List all batches
- `GET /api/products/batch/:batchId` - Get batch details

### **Transfers:**
- `POST /api/products/:id/transfer` - Transfer product

### **ZK Proofs:**
- `POST /api/products/:id/zk-proof` - Generate ZK proof
- `POST /api/products/:id/zk-verify` - Verify ZK proof on-chain

### **Verification:**
- `GET /api/products/:id` - Public product verification

---

## Important Notes

1. **Wallet Address Required**: All users must have an Ethereum wallet address
2. **Gas Fees**: Blockchain transactions require gas (ETH) on local network, it's free
3. **QR Codes**: Automatically generated, link directly to verification page
4. **Batch NFTs**: Represent ownership of entire batch, transferable
5. **Customer Verification**: Once verified by customer, product cannot be transferred
6. **Immutable Records**: All on-chain data is permanent and cannot be altered
7. **Privacy**: ZK proofs allow verification without revealing sensitive data

---

## Troubleshooting

### **Cannot Create Product:**
- Check backend is connected to blockchain
- Verify contract address in `.env`
- Ensure Hardhat node is running
- Check manufacturer authorization

### **Cannot Scan QR Code:**
- Verify QR code URL is correct
- Check frontend URL in backend `.env`
- Ensure product exists in database

### **Transfer Fails:**
- Verify recipient wallet address is correct
- Check product hasn't been customer-verified
- Ensure you're the current holder
- Check blockchain connection

### **Verification Shows Invalid:**
- Product may not exist on blockchain
- Contract address may be wrong
- Blockchain node may be disconnected
- Product may have been tampered with

---

## Next Steps After Registration

1. **Manufacturers**: Start creating products/batches
2. **Distributors/Warehouses/Retailers**: Wait for products to be transferred
3. **Customers**: Scan QR codes on purchased products

---

**End of User Flow Guide**

