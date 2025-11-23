# Quick Start Guide - Supply Chain Platform

## 🚀 Quick Reference: Step-by-Step for Each Role

---

## 📋 **MANUFACTURER**

### Initial Setup
1. **Register** → `/register`
   - Email, Password, Wallet Address, Role: "manufacturer"
   
2. **Login** → `/login`
   - Email, Password
   - Redirected to Manufacturer Dashboard

### Create Product (Single)
3. **Dashboard** → "Single Product" tab
4. Enter: Name, Description, Manufacture Date
5. Click "Create Product"
6. ✅ Product created with QR code

### Create Batch (Recommended)
3. **Dashboard** → "Create Batch (NFT)" tab
4. Enter metadata URI (optional)
5. Add products → Click "+ Add Product" (repeat)
6. Enter each product: Name, Description, Date
7. Click "Create Batch & Mint NFT"
8. ✅ Batch created, NFT minted, QR codes generated

### Generate ZK Proof
9. Find product in "Your Products"
10. Click "Generate ZK Proof" (if in batch)
11. ✅ Proof generated for privacy verification

### Transfer Product
12. Select product → Transfer
13. Enter recipient address (Distributor/Warehouse)
14. Enter location
15. Submit → ✅ Transfered on-chain

---

## 🚚 **DISTRIBUTOR**

### Initial Setup
1. **Register** → `/register`
   - Email, Password, Wallet Address, Role: "distributor"
   
2. **Login** → `/login`
   - Email, Password

### Receive & Transfer
3. **Wait** for Manufacturer to transfer product
4. **View** received products in dashboard
5. **Transfer** to Warehouse/Retailer:
   - Select product
   - Enter recipient address
   - Enter location
   - Submit → ✅ Transfered

---

## 📦 **WAREHOUSE**

### Initial Setup
1. **Register** → `/register`
   - Email, Password, Wallet Address, Role: "warehouse"
   
2. **Login** → `/login`
   - Email, Password

### Manage Inventory
3. **Receive** products from Manufacturer/Distributor
4. **View** inventory in dashboard
5. **Transfer** to Retailer:
   - Select product
   - Enter retailer address
   - Enter location
   - Submit → ✅ Transfered

---

## 🏪 **RETAILER**

### Initial Setup
1. **Register** → `/register`
   - Email, Password, Wallet Address, Role: "retailer"
   
2. **Login** → `/login`
   - Email, Password

### Sell Products
3. **Receive** products from Warehouse
4. **View** inventory
5. **Print** QR codes
6. **Attach** QR codes to physical products
7. **Sell** to customers
8. **Optional**: Transfer ownership to customer

---

## 👤 **CUSTOMER**

### Verify Product
1. **Receive** product with QR code
2. **Scan** QR code with phone
3. **View** verification page automatically
   - Product details
   - Manufacturer info
   - Supply chain history
   - Authenticity status ✅/❌
4. **Optional**: Verify on-chain (permanent)
5. **Optional**: View ZK proof if available

---

## 🔄 Complete Flow Diagram

```
┌─────────────┐
│Manufacturer │
└──────┬──────┘
       │
       ├─→ Create Batch
       ├─→ Mint NFT
       ├─→ Generate QR Codes
       │
       ▼
┌─────────────┐
│ Distributor │
└──────┬──────┘
       │
       ├─→ Receive Products
       ├─→ Track Inventory
       │
       ▼
┌─────────────┐
│  Warehouse  │
└──────┬──────┘
       │
       ├─→ Store Products
       ├─→ Manage Inventory
       │
       ▼
┌─────────────┐
│  Retailer   │
└──────┬──────┘
       │
       ├─→ Display Products
       ├─→ Print QR Codes
       │
       ▼
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │
       ├─→ Scan QR Code
       ├─→ Verify Authenticity
       └─→ View Supply Chain History
```

---

## 📍 Key URLs

- **Registration**: `/register`
- **Login**: `/login`
- **Manufacturer Dashboard**: `/dashboard/manufacturer`
- **Verify Product**: `/verify/{productId}`
- **Supply Chain Dashboard**: `/dashboard/supply-chain`

---

## 🎯 Essential Actions Checklist

### For Manufacturers:
- [ ] Register account
- [ ] Create batch or single product
- [ ] Generate QR codes
- [ ] Generate ZK proofs (optional)
- [ ] Transfer products

### For Distributors/Warehouses/Retailers:
- [ ] Register account
- [ ] Receive products
- [ ] View inventory
- [ ] Transfer products

### For Customers:
- [ ] Scan QR code
- [ ] Verify authenticity
- [ ] View supply chain history
- [ ] Verify on-chain (optional)

---

## ⚡ Quick Tips

1. **Always use correct wallet address** - This is your identity on blockchain
2. **Save your QR codes** - They're your verification method
3. **Check transfer history** - Verify each step of the supply chain
4. **Batch products** - Better for multiple items, includes NFT
5. **ZK proofs** - Use for privacy-preserving verification

---

## 🆘 Common First Steps

**Manufacturer's First Day:**
1. Register → Login
2. Create your first batch
3. View generated QR codes
4. Test transfer to distributor account

**Customer's First Use:**
1. Purchase product
2. Scan QR code
3. Verify authenticity ✅
4. View supply chain journey

---

**For detailed flows, see `USER_FLOW_GUIDE.md`**

