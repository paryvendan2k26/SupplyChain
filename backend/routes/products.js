const router = require('express').Router();
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Partnership = require('../models/Partnership');
const GlobalCounter = require('../models/GlobalCounter');
const { ethers } = require('ethers');
// ZK Proof generation - simplified for now
// In production, use a proper ZK library and compiled circuits
async function generateBatchMembershipProof(productId, batchId, secret) {
  try {
    // Use ethers keccak256 for hashing (more reliable than circomlib)
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(`${productId}-${batchId}-${secret}`));
    const productHash = ethers.keccak256(ethers.toUtf8Bytes(`${productId}-${secretHash}`));
    
    // Create public signals
    const publicSignals = [batchId.toString(), productHash];
    
    // Mock proof structure (in production, generate actual proof from circuit)
    const proof = {
      a: ["0", "0"],
      b: [["0", "0"], ["0", "0"]],
      c: ["0", "0"],
      publicSignals: publicSignals
    };
    
    return {
      proof,
      publicSignals,
      productHash
    };
  } catch (error) {
    console.error("Error generating proof:", error);
    // Return mock proof on error
    return {
      proof: {
        a: ["0", "0"],
        b: [["0", "0"], ["0", "0"]],
        c: ["0", "0"],
        publicSignals: [batchId.toString(), "0"]
      },
      publicSignals: [batchId.toString(), "0"],
      productHash: "0"
    };
  }
}
require('dotenv').config();

// Simple JWT auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Ethers v6 lazy init to avoid top-level await in CommonJS
let provider = null;
let signer = null;
let contract = null;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Helper to get signer for a specific address (for Hardhat local dev)
async function getSignerForAddress(provider, address) {
  const rpcUrl = process.env.POLYGON_RPC_URL || 'http://127.0.0.1:8545';
  const isLocal = rpcUrl.toLowerCase().includes('127.0.0.1') || rpcUrl.toLowerCase().includes('localhost');
  
  if (isLocal) {
    // For Hardhat local, try to impersonate the address
    try {
      // Impersonate the account (Hardhat feature)
      await provider.send('hardhat_impersonateAccount', [address]);
      // Fund the account if needed (for gas)
      await provider.send('hardhat_setBalance', [address, '0x1000000000000000000000']); // 1000 ETH
      return await provider.getSigner(address);
    } catch (e) {
      console.log('Could not impersonate account, trying unlocked accounts:', e.message);
      // Fallback: try to find the address in unlocked accounts
      for (let i = 0; i < 20; i++) {
        try {
          const testSigner = await provider.getSigner(i);
          const testAddr = await testSigner.getAddress();
          if (testAddr.toLowerCase() === address.toLowerCase()) {
            return testSigner;
          }
        } catch (_) {
          break;
        }
      }
    }
  }
  return null;
}

async function getEthersBindings(userWalletAddress = null) {
  if (contract && !userWalletAddress) return { provider, signer, contract };

  const rpcUrl = process.env.POLYGON_RPC_URL || 'http://127.0.0.1:8545';
  provider = new ethers.JsonRpcProvider(rpcUrl);
  const abiData = require('../sc-abi/SupplyChainTracker.json');
  const abi = abiData.abi || abiData;

  if (!contractAddress) {
    console.log('Missing CONTRACT_ADDRESS in environment');
    return { provider, signer: null, contract: null };
  }

  const isLocal = rpcUrl.toLowerCase().includes('127.0.0.1') || rpcUrl.toLowerCase().includes('localhost');
  
  // If user wallet is provided, try to use that signer (for Hardhat local dev)
  if (userWalletAddress && isLocal) {
    const userSigner = await getSignerForAddress(provider, userWalletAddress);
    if (userSigner) {
      signer = userSigner;
      contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const addr = await signer.getAddress();
        console.log('Using user wallet signer:', addr);
      } catch (_) {}
      return { provider, signer, contract };
    }
  }
  
  // Default: use first unlocked account or PRIVATE_KEY
  if (isLocal) {
    // Hardhat local network – use first unlocked account
    try {
      signer = await provider.getSigner(0);
    } catch (e) {
      console.log('Failed to get local signer:', e.message);
      signer = null;
    }
  } else if (process.env.PRIVATE_KEY) {
    signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  }

  contract = signer ? new ethers.Contract(contractAddress, abi, signer) : null;
  if (signer && contract) {
    try {
      const addr = await signer.getAddress();
      console.log('Contract initialized:', contractAddress, 'Signer:', addr);
    } catch (_) {}
  } else {
    console.log('No signer available. Check PRIVATE_KEY or use localhost signer.');
  }

  return { provider, signer, contract };
}

// Generate unique product ID for single products (not in batch)
// Format: MFR_{manufacturerId}_{timestamp}_{counter}
async function generateUniqueProductId(manufacturerId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const count = await Product.countDocuments({ manufacturer: manufacturerId, batchId: { $exists: false } });
  const counter = String(count + 1).padStart(3, '0');
  return `MFR_${manufacturerId}_${timestamp}_${counter}`;
}

// Partnership check middleware (for new products requiring partnership)
async function checkPartnershipForTransfer(senderId, receiverWalletAddress) {
  // Find receiver user by wallet address
  const receiver = await User.findOne({ walletAddress: receiverWalletAddress.toLowerCase() });
  if (!receiver) return { allowed: false, error: 'Receiver not found in system' };
  
  // Check if partnership exists
  const partnership = await Partnership.findOne({
    $or: [
      { sender: senderId, receiver: receiver._id, status: 'accepted' },
      { sender: receiver._id, receiver: senderId, status: 'accepted' }
    ]
  });
  
  return { allowed: !!partnership, error: partnership ? null : 'Partnership required. Request partnership first.' };
}

// Create products with quantity: calls contract and saves Mongo docs
router.post('/', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'manufacturer') return res.status(403).json({ error: 'Forbidden' });
    const { name, description, manufactureDate, quantity = 1 } = req.body;
    if (!contractAddress) return res.status(500).json({ error: 'Contract address missing' });
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });

    const qty = Math.max(1, Math.min(100, parseInt(quantity) || 1)); // Limit to 1-100
    const dateStr = new Date(manufactureDate).toISOString().slice(0, 10);
    console.log('Creating products:', { name, quantity: qty, dateStr, userWallet: user.walletAddress });
    
    // Ensure signer is an authorized manufacturer
    try {
      const { signer: currentSigner } = await getEthersBindings();
      const signerAddr = await currentSigner.getAddress();
      const isAuth = await contract.authorizedManufacturer(signerAddr);
      if (!isAuth) {
        console.log('Authorizing signer...');
        const txAuth = await contract.setManufacturer(signerAddr, true);
        await txAuth.wait();
        console.log('Signer authorized');
      }
    } catch (e) {
      console.error('Authorization error:', e.message);
    }
    
    // Create products in batch
    const createdProducts = [];
    for (let i = 0; i < qty; i++) {
      const tx = await contract.createProduct(name, dateStr);
      const receipt = await tx.wait();
      const productId = await contract.nextProductId();
      const blockchainId = Number(productId) - 1;
      
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${blockchainId}`;
      const qrCodeUrl = await QRCode.toDataURL(verifyUrl);
      
      // Generate unique product ID for new products
      const uniqueProductId = await generateUniqueProductId(user._id);

      const product = await Product.create({
        blockchainId,
        uniqueProductId, // NEW: Add unique product ID
        name: qty > 1 ? `${name} #${i + 1}` : name,
        description,
        manufacturer: user._id,
        currentHolder: user._id, // NEW: Track current holder
        manufactureDate,
        qrCodeUrl,
        requiresPartnership: true, // NEW: Flag new products as requiring partnership
      });
      createdProducts.push(product);
    }
    
    res.json({ 
      message: `Successfully created ${qty} product(s)`,
      products: createdProducts,
      count: createdProducts.length
    });
  } catch (e) {
    console.error('Create product error:', e);
    const message = e?.error?.message || e?.shortMessage || e?.message || 'Server error';
    res.status(500).json({ error: message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Get all products from database
    let query = {};
    if (user.role === 'manufacturer') {
      query = { manufacturer: user._id };
    }
    
    const allProducts = await Product.find(query).sort({ createdAt: -1 }).limit(500);
    
    // Filter by blockchain currentHolder - only show products owned by this user
    if (!contract) {
      return res.json([]); // Return empty if contract not configured
    }
    
    const userWallet = user.walletAddress.toLowerCase();
    const filteredProducts = [];
    
    for (const product of allProducts) {
      try {
        const result = await contract.getProduct(product.blockchainId);
        const currentHolder = result[1]?.toLowerCase();
        
        // Show product if:
        // 1. User is manufacturer (they created it) OR
        // 2. User is current holder on blockchain
        if (user.role === 'manufacturer' || currentHolder === userWallet) {
          filteredProducts.push(product);
        }
      } catch (e) {
        console.error(`Error checking product ${product.blockchainId}:`, e.message);
        // If can't check blockchain, only show to manufacturer
        if (user.role === 'manufacturer') {
          filteredProducts.push(product);
        }
      }
    }
    
    res.json(filteredProducts);
  } catch (e) {
    console.error('Error fetching products:', e);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// NEW: Get products grouped by sender
router.get('/grouped-by-sender', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Get all products (same logic as main endpoint)
    let query = {};
    if (user.role === 'manufacturer') {
      query = { manufacturer: user._id };
    }
    
    const allProducts = await Product.find(query).populate('sender manufacturer', 'name companyName role').sort({ createdAt: -1 }).limit(500);
    
    if (!contract) {
      return res.json({}); // Return empty object if contract not configured
    }
    
    const userWallet = user.walletAddress.toLowerCase();
    const filteredProducts = [];
    
    for (const product of allProducts) {
      try {
        const result = await contract.getProduct(product.blockchainId);
        const currentHolder = result[1]?.toLowerCase();
        
        if (user.role === 'manufacturer' || currentHolder === userWallet) {
          filteredProducts.push(product);
        }
      } catch (e) {
        if (user.role === 'manufacturer') {
          filteredProducts.push(product);
        }
      }
    }
    
    // Group by sender
    const grouped = {};
    filteredProducts.forEach(product => {
      const senderId = product.sender?._id?.toString() || product.manufacturer?._id?.toString() || 'unknown';
      if (!grouped[senderId]) {
        grouped[senderId] = {
          sender: product.sender || product.manufacturer,
          products: []
        };
      }
      grouped[senderId].products.push(product);
    });
    
    res.json(grouped);
  } catch (e) {
    console.error('Error fetching grouped products:', e);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get QR code (manufacturer only)
router.get('/:id/qrcode', auth, async (req, res) => {
  try {
    // Try to find by blockchainId first (backward compatibility)
    let p = await Product.findOne({ blockchainId: req.params.id });
    // If not found, try uniqueProductId
    if (!p) {
      p = await Product.findOne({ uniqueProductId: req.params.id });
    }
    if (!p) return res.status(404).json({ error: 'Not found' });
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    // Only manufacturer can view QR codes
    if (user.role !== 'manufacturer' || p.manufacturer.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'QR codes are only visible to the manufacturer' });
    }
    
    res.json({ qrCodeUrl: p.qrCodeUrl });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

module.exports = router;

// Test contract connection
router.get('/test-contract', async (req, res) => {
  try {
    const { contract, provider, signer } = await getEthersBindings();
    if (!contract) {
      return res.json({ 
        error: 'Contract not configured',
        provider: !!provider,
        signer: !!signer,
        contractAddress: contractAddress,
        abi: !!require('../sc-abi/SupplyChainTracker.json')
      });
    }
    const nextId = await contract.nextProductId();
    const { signer: currentSigner } = await getEthersBindings();
    const signerAddr = currentSigner ? await currentSigner.getAddress() : null;
    res.json({ 
      connected: true, 
      nextProductId: Number(nextId),
      contractAddress: contractAddress,
      signerAddress: signerAddr
    });
  } catch (e) {
    res.json({ error: e.message, connected: false });
  }
});

// Transfer products on-chain (supports quantity)
router.post('/:id/transfer', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const { toAddress, location, quantity = 1 } = req.body;
    const productId = Number(req.params.id);
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    
    // Verify product exists and get manufacturer info
    const result = await contract.getProduct(productId);
    const manufacturer = result[0];
    const currentHolder = result[1];
    const user = await User.findById(req.user.id);
    
    // Verify user is current holder
    if (currentHolder.toLowerCase() !== user.walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'You are not the current holder of this product' });
    }
    
    // NEW: Check partnership for products requiring it (backward compatible - old products don't require)
    const dbProduct = await Product.findOne({ blockchainId: productId });
    if (dbProduct && dbProduct.requiresPartnership) {
      const partnershipCheck = await checkPartnershipForTransfer(user._id, toAddress);
      if (!partnershipCheck.allowed) {
        return res.status(403).json({ error: partnershipCheck.error });
      }
    }
    
    // Get manufacturer details
    const manufacturerUser = await User.findOne({ walletAddress: manufacturer.toLowerCase() });
    const manufacturerInfo = manufacturerUser ? {
      name: manufacturerUser.name,
      companyName: manufacturerUser.companyName,
      address: manufacturer
    } : { address: manufacturer };
    
    // Transfer products (if quantity > 1, transfer multiple consecutive IDs)
    const qty = Math.max(1, Math.min(50, parseInt(quantity) || 1));
    const transfers = [];
    
    for (let i = 0; i < qty; i++) {
      const currentProductId = productId + i;
      try {
        // Verify this product exists and is owned by user
        const prodResult = await contract.getProduct(currentProductId);
        if (prodResult[1].toLowerCase() !== user.walletAddress.toLowerCase()) {
          break; // Stop if we hit a product not owned by user
        }
        
        const tx = await contract.transferProduct(currentProductId, toAddress, location || '');
        const receipt = await tx.wait();
        
        // NEW: Update product in DB with new holder and sender
        const dbProd = await Product.findOne({ blockchainId: currentProductId });
        if (dbProd) {
          const receiverUser = await User.findOne({ walletAddress: toAddress.toLowerCase() });
          if (receiverUser) {
            dbProd.currentHolder = receiverUser._id;
            dbProd.sender = user._id;
            await dbProd.save();
          }
        }
        
        transfers.push({
          productId: currentProductId,
          txHash: receipt.transactionHash
        });
      } catch (e) {
        console.error(`Error transferring product ${currentProductId}:`, e.message);
        break;
      }
    }
    
    if (transfers.length === 0) {
      return res.status(400).json({ error: 'Transfer failed - no products transferred' });
    }
    
    res.json({ 
      message: `Successfully transferred ${transfers.length} product(s)`,
      transfers,
      manufacturer: manufacturerInfo,
      toAddress,
      location: location || ''
    });
  } catch (e) {
    console.error('Transfer error:', e);
    const message = e?.error?.message || e?.shortMessage || e?.message || 'Transfer failed';
    res.status(400).json({ error: message });
  }
});

// Public product read: on-chain state + db details
router.get('/:id', async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const productId = Number(req.params.id);
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    const result = await contract.getProduct(productId);
    // Ethers v6 returns an array, but we need to handle it properly
    const manufacturer = result[0];
    const currentHolder = result[1];
    const verifiedByCustomer = result[2];
    const isAuthentic = result[3];
    const customer = result[4];
    const batchId = result[5] || 0;
    const history = await contract.getTransferHistory(productId);
    const db = await Product.findOne({ blockchainId: productId }).populate('manufacturer', 'name companyName').populate('batchId');
    
    // Get batch info if product is in a batch
    let batchInfo = null;
    if (batchId && Number(batchId) > 0) {
      try {
        const batchResult = await contract.getBatch(batchId);
        const batchManufacturer = batchResult[0];
        const metadataURI = batchResult[1];
        const createdAt = batchResult[2];
        const productIds = batchResult[3];
        const nftOwner = batchResult[4];
        batchInfo = {
          batchId: Number(batchId),
          manufacturer: batchManufacturer,
          metadataURI,
          createdAt: Number(createdAt),
          productIds: productIds.map(id => Number(id)),
          nftOwner
        };
      } catch (e) {
        console.error('Error fetching batch info:', e.message);
      }

    }
    
    res.json({ 
      onchain: { manufacturer, currentHolder, verifiedByCustomer, isAuthentic, customer, batchId: Number(batchId || 0), history }, 
      db,
      batch: batchInfo
    });
  } catch (e) {
    console.error('Error fetching product:', e);
    res.status(404).json({ error: 'Not found' });
  }
});

// Authorize a manufacturer wallet on-chain (uses backend owner key)
router.post('/authorize-manufacturer', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    const user = await User.findById(req.user.id);
    const address = req.body.address || user?.walletAddress;
    if (!address) return res.status(400).json({ error: 'address required' });
    const tx = await contract.setManufacturer(address, true);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash, authorized: address });
  } catch (e) {
    res.status(400).json({ error: 'Authorization failed' });
  }
});

// Create batch with multiple products and mint NFT
router.post('/batch', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'manufacturer') return res.status(403).json({ error: 'Forbidden' });
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });

    const { metadataURI, products, quantity } = req.body;
    
    // Support both array of products and quantity-based creation
    let productList = [];
    if (quantity && quantity > 1 && products && products.length > 0) {
      // If quantity is provided, duplicate the first product N times
      const template = products[0];
      const qty = Math.max(1, Math.min(100, parseInt(quantity) || 1));
      for (let i = 0; i < qty; i++) {
        productList.push({
          name: qty > 1 ? `${template.name || 'Product'} #${i + 1}` : (template.name || 'Product'),
          description: template.description || '',
          manufactureDate: template.manufactureDate || new Date().toISOString().slice(0, 10)
        });
      }
    } else if (products && Array.isArray(products) && products.length > 0) {
      // Use provided products array
      productList = products;
    } else {
      return res.status(400).json({ error: 'Products array or quantity required' });
    }

    // Prepare product data for contract
    const productNames = productList.map(p => p.name || '');
    const manufactureDates = productList.map(p => 
      p.manufactureDate ? new Date(p.manufactureDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    );

    // Ensure signer is authorized
    try {
      const { signer: currentSigner } = await getEthersBindings();
      const signerAddr = await currentSigner.getAddress();
      const isAuth = await contract.authorizedManufacturer(signerAddr);
      if (!isAuth) {
        const txAuth = await contract.setManufacturer(signerAddr, true);
        await txAuth.wait();
      }
    } catch (e) {
      console.error('Authorization error:', e.message);
    }

    // Create batch on-chain (mints NFT and creates all products)
    const tx = await contract.createBatch(
      metadataURI || `ipfs://batch-${Date.now()}`,
      productNames,
      manufactureDates
    );
    const receipt = await tx.wait();
    console.log('Batch created, tx:', receipt.transactionHash);

    // Get batch ID from event or calculate
    const batchId = Number(await contract.nextBatchId()) - 1;
    
    // Get globally unique NFT token ID
    const nftTokenId = await GlobalCounter.getNextCounter('nftTokenId');
    
    // Increment manufacturer's batch counter and get manufacturer batch number
    user.batchCounter = (user.batchCounter || 0) + 1;
    const manufacturerBatchNumber = user.batchCounter;
    await user.save();
    
    // Get product IDs from the batch
    const productIds = await contract.getBatchProductIds(batchId);
    
    // Create batch document in MongoDB
    const batchDoc = await Batch.create({
      batchId,
      manufacturer: user._id,
      manufacturerBatchNumber,
      metadataURI: metadataURI || `ipfs://batch-${batchId}`,
      nftTokenId, // Globally unique NFT token ID
    });

    // Create product documents in MongoDB and generate ZK proofs (MANDATORY)
    const createdProducts = [];
    for (let i = 0; i < productList.length; i++) {
      const blockchainId = Number(productIds[i]);
      const product = productList[i];
      const productNumberInBatch = i + 1; // 1-indexed product number
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${blockchainId}`;
      const qrCodeUrl = await QRCode.toDataURL(verifyUrl);

      // Generate ZK proof for each product (MANDATORY for batch products)
      const secret = ethers.keccak256(ethers.toUtf8Bytes(`secret-${blockchainId}-${batchId}-${Date.now()}`));
      const proofData = await generateBatchMembershipProof(blockchainId, batchId, secret);

      // Generate unique product ID: MFR_{manufacturerId}_BATCH{batchNumber}_PROD{productNumber}
      const uniqueProductId = `MFR_${user._id}_BATCH${manufacturerBatchNumber}_PROD${productNumberInBatch}`;

      const productDoc = await Product.create({
        blockchainId,
        uniqueProductId,
        name: product.name,
        description: product.description,
        manufacturer: user._id,
        batchId: batchDoc._id,
        batchBlockchainId: batchId,
        productNumberInBatch,
        manufactureDate: product.manufactureDate || new Date(),
        qrCodeUrl,
        zkProof: proofData,
        zkProofGenerated: true,
        zkProofGeneratedAt: new Date(),
      });

      createdProducts.push(productDoc);
    }

    // Update batch with product references and quantity
    batchDoc.products = createdProducts.map(p => p._id);
    batchDoc.quantity = createdProducts.length;
    await batchDoc.save();

    res.json({
      batch: batchDoc,
      products: createdProducts,
      txHash: receipt.transactionHash,
      nftTokenId,
      manufacturerBatchNumber
    });
  } catch (e) {
    console.error('Create batch error:', e);
    const message = e?.error?.message || e?.shortMessage || e?.message || 'Server error';
    res.status(500).json({ error: message });
  }
});

// Get all batches for a manufacturer or batches where user owns all products
router.get('/batch/list', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let batches = [];
    if (user.role === 'manufacturer') {
      // Manufacturers see all their batches
      batches = await Batch.find({ manufacturer: user._id })
        .populate('manufacturer', 'name companyName')
        .populate('products')
        .sort({ createdAt: -1 });
    } else {
      // For other roles, check blockchain ownership
      if (!contract) {
        return res.json([]); // Return empty if contract not configured
      }
      
      // Get all batches from database
      const allBatches = await Batch.find()
        .populate('manufacturer', 'name companyName')
        .populate('products')
        .sort({ createdAt: -1 });
      
      const userWallet = user.walletAddress.toLowerCase();
      
      // Filter batches where user owns all products
      for (const batch of allBatches) {
        if (!batch.products || batch.products.length === 0) continue;
        
        let ownsAll = true;
        for (const product of batch.products) {
          try {
            const prodResult = await contract.getProduct(product.blockchainId);
            const currentHolder = prodResult[1]?.toLowerCase();
            if (currentHolder !== userWallet) {
              ownsAll = false;
              break;
            }
          } catch (e) {
            console.error(`Error checking product ${product.blockchainId}:`, e.message);
            ownsAll = false;
            break;
          }
        }
        
        if (ownsAll) {
          batches.push(batch);
        }
      }
    }
    
    res.json(batches);
  } catch (e) {
    console.error('Error fetching batches:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single batch details
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const batchId = Number(req.params.batchId);
    
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    
    // Get on-chain batch data
    const [manufacturer, metadataURI, createdAt, productIds, nftOwner] = await contract.getBatch(batchId);
    
    // Get database batch
    const batchDoc = await Batch.findOne({ batchId })
      .populate('manufacturer', 'name companyName')
      .populate('products');
    
    res.json({
      onchain: {
        batchId,
        manufacturer,
        metadataURI,
        createdAt: Number(createdAt),
        productIds: productIds.map(id => Number(id)),
        nftOwner
      },
      db: batchDoc
    });
  } catch (e) {
    console.error('Error fetching batch:', e);
    res.status(404).json({ error: 'Batch not found' });
  }
});

// Generate ZK proof for product batch membership (MANDATORY)
router.post('/:id/zk-proof', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const productId = Number(req.params.id);
    
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    
    // Get product and batch info
    const result = await contract.getProduct(productId);
    const manufacturer = result[0];
    const currentHolder = result[1];
    const verifiedByCustomer = result[2];
    const isAuthentic = result[3];
    const customer = result[4];
    const batchId = result[5] || 0;
    
    if (!batchId || Number(batchId) === 0) {
      return res.status(400).json({ error: 'Product is not part of a batch. ZK proof requires batch membership.' });
    }
    
    // Generate secret using product and batch info
    const secret = req.body.secret || ethers.keccak256(ethers.toUtf8Bytes(`secret-${productId}-${batchId}-${Date.now()}`));
    
    // Generate ZK proof
    const proofData = await generateBatchMembershipProof(productId, Number(batchId), secret);
    
    // Save proof to product document (MANDATORY)
    const product = await Product.findOne({ blockchainId: productId });
    if (product) {
      product.zkProof = proofData;
      product.zkProofGenerated = true;
      product.zkProofGeneratedAt = new Date();
      await product.save();
    }
    
    res.json({
      productId,
      batchId: Number(batchId),
      proof: proofData.proof,
      publicSignals: proofData.publicSignals,
      message: 'ZK proof generated successfully and saved'
    });
  } catch (e) {
    console.error('Error generating ZK proof:', e);
    res.status(500).json({ error: 'Failed to generate proof: ' + e.message });
  }
});

// Verify ZK proof on-chain
router.post('/:id/zk-verify', async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const productId = Number(req.params.id);
    const { proof, batchId } = req.body;
    
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    if (!proof || !batchId) return res.status(400).json({ error: 'Proof and batchId required' });
    
    // Convert proof to contract format
    const zkProof = {
      a: proof.a,
      b: proof.b,
      c: proof.c,
      publicSignals: proof.publicSignals.map(s => BigInt(s))
    };
    
    // Call verifyZKProof on contract
    const tx = await contract.verifyZKProof(productId, batchId, zkProof);
    const receipt = await tx.wait();
    
    res.json({
      verified: true,
      txHash: receipt.transactionHash,
      productId,
      batchId
    });
  } catch (e) {
    console.error('Error verifying ZK proof:', e);
    const message = e?.error?.message || e?.shortMessage || e?.message || 'Verification failed';
    res.status(400).json({ error: message });
  }
});

// Transfer entire batch (all products in batch)
router.post('/batch/:batchId/transfer', auth, async (req, res) => {
  try {
    const { toAddress, location } = req.body;
    const batchId = Number(req.params.batchId);
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Get ethers bindings with user's wallet (for Hardhat local dev)
    const { contract, signer } = await getEthersBindings(user.walletAddress);
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    if (!signer) return res.status(500).json({ error: 'No signer available' });
    
    // Get batch info from blockchain - use destructuring like other endpoints
    const [manufacturer, metadataURI, createdAt, productIds, nftOwner] = await contract.getBatch(batchId);
    
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ error: 'Batch has no products' });
    }
    
    // Verify user owns all products in the batch
    const userWallet = user.walletAddress.toLowerCase();
    const ownedProducts = [];
    
    for (const productId of productIds) {
      try {
        const prodResult = await contract.getProduct(Number(productId));
        const currentHolder = prodResult[1]?.toLowerCase();
        
        if (currentHolder === userWallet) {
          ownedProducts.push(Number(productId));
        } else {
          return res.status(403).json({ 
            error: `You are not the current holder of product ${productId} in this batch. Current holder: ${currentHolder}, Your wallet: ${userWallet}` 
          });
        }
      } catch (e) {
        console.error(`Error checking product ${productId}:`, e.message);
        return res.status(400).json({ error: `Failed to verify product ${productId}` });
      }
    }
    
    // Verify signer matches user wallet (should be true after getEthersBindings with user wallet)
    const signerAddress = (await signer.getAddress()).toLowerCase();
    if (signerAddress !== userWallet) {
      return res.status(403).json({ 
        error: `Signer mismatch: Backend signer (${signerAddress}) does not match your wallet (${userWallet}). For Hardhat local development, ensure your wallet address is one of the unlocked accounts or use account impersonation.` 
      });
    }
    
    // Transfer all products in the batch sequentially
    const transfers = [];
    let failedProductId = null;
    let failedError = null;
    
    for (const productId of ownedProducts) {
      try {
        // Double-check ownership before each transfer
        const prodCheck = await contract.getProduct(productId);
        const currentHolder = prodCheck[1]?.toLowerCase();
        if (currentHolder !== userWallet) {
          failedProductId = productId;
          failedError = `Product ${productId} is no longer owned by ${userWallet}. Current holder: ${currentHolder}`;
          break;
        }
        
        const tx = await contract.transferProduct(productId, toAddress, location || '');
        const receipt = await tx.wait();
        transfers.push({
          productId,
          txHash: receipt.transactionHash
        });
      } catch (e) {
        console.error(`Error transferring product ${productId}:`, e.message);
        failedProductId = productId;
        failedError = e?.error?.message || e?.shortMessage || e?.message || 'Unknown error';
        break;
      }
    }
    
    // If some transfers failed, return partial success or error
    if (failedProductId && transfers.length === 0) {
      return res.status(400).json({ 
        error: `Failed to transfer product ${failedProductId}: ${failedError}` 
      });
    }
    
    if (failedProductId && transfers.length > 0) {
      return res.status(207).json({ 
        message: `Partially transferred: ${transfers.length} of ${ownedProducts.length} products transferred`,
        error: `Failed at product ${failedProductId}: ${failedError}`,
        batchId,
        transfers,
        manufacturer: manufacturerInfo,
        toAddress,
        location: location || ''
      });
    }
    
    // Get manufacturer info (already destructured above)
    const manufacturerUser = await User.findOne({ walletAddress: manufacturer.toLowerCase() });
    const manufacturerInfo = manufacturerUser ? {
      name: manufacturerUser.name,
      companyName: manufacturerUser.companyName,
      address: manufacturer
    } : { address: manufacturer };
    
    res.json({ 
      message: `Successfully transferred entire batch (${transfers.length} products)`,
      batchId,
      transfers,
      manufacturer: manufacturerInfo,
      toAddress,
      location: location || ''
    });
  } catch (e) {
    console.error('Batch transfer error:', e);
    const message = e?.error?.message || e?.shortMessage || e?.message || 'Batch transfer failed';
    res.status(400).json({ error: message });
  }
});


