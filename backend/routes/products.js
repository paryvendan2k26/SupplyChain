const router = require('express').Router();
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const User = require('../models/User');
const { ethers } = require('ethers');
// ZK Proof generation - simplified for now
// In production, use a proper ZK library and compiled circuits
async function generateBatchMembershipProof(productId, batchId, secret) {
  try {
    // For now, create a mock proof structure
    // In production, compile the circuit and generate real proofs
    const { poseidon } = require('circomlib');
    
    // Calculate product hash: hash(productId, secret)
    // Note: This requires BigInt conversion
    const productHash = poseidon([BigInt(productId), BigInt(secret)]);
    
    // Create public signals
    const publicSignals = [BigInt(batchId), productHash];
    
    // Mock proof (in production, generate actual proof from circuit)
    const proof = {
      a: ["0", "0"],
      b: [["0", "0"], ["0", "0"]],
      c: ["0", "0"],
      publicSignals: publicSignals.map(s => s.toString())
    };
    
    return {
      proof,
      publicSignals: publicSignals.map(s => s.toString()),
      productHash: productHash.toString()
    };
  } catch (error) {
    console.error("Error generating proof:", error);
    // Return mock proof if circomlib is not available
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

async function getEthersBindings() {
  if (contract) return { provider, signer, contract };

  const rpcUrl = process.env.POLYGON_RPC_URL || 'http://127.0.0.1:8545';
  provider = new ethers.JsonRpcProvider(rpcUrl);
  const abiData = require('../sc-abi/SupplyChainTracker.json');
  const abi = abiData.abi || abiData;

  if (!contractAddress) {
    console.log('Missing CONTRACT_ADDRESS in environment');
    return { provider, signer: null, contract: null };
  }

  const isLocal = rpcUrl.toLowerCase().includes('127.0.0.1') || rpcUrl.toLowerCase().includes('localhost');
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

// Create product: calls contract and saves Mongo doc
router.post('/', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'manufacturer') return res.status(403).json({ error: 'Forbidden' });
    const { name, description, manufactureDate } = req.body;
    if (!contractAddress) return res.status(500).json({ error: 'Contract address missing' });
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });

    const dateStr = new Date(manufactureDate).toISOString().slice(0, 10);
    console.log('Creating product:', { name, dateStr, userWallet: user.walletAddress });
    
    // Ensure signer is an authorized manufacturer (owner can set on local)
    try {
      const { signer: currentSigner } = await getEthersBindings();
      const signerAddr = await currentSigner.getAddress();
      const isAuth = await contract.authorizedManufacturer(signerAddr);
      console.log('Signer authorized:', isAuth, signerAddr);
      if (!isAuth) {
        console.log('Authorizing signer...');
        const txAuth = await contract.setManufacturer(signerAddr, true);
        await txAuth.wait();
        console.log('Signer authorized');
      }
    } catch (e) {
      console.error('Authorization error:', e.message);
    }
    
    console.log('Calling createProduct...');
    const tx = await contract.createProduct(name, dateStr);
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.transactionHash);
    
    const productId = await contract.nextProductId();
    const blockchainId = Number(productId) - 1;
    console.log('Product created with ID:', blockchainId);

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${blockchainId}`;
    const qrCodeUrl = await QRCode.toDataURL(verifyUrl);

    const product = await Product.create({
      blockchainId,
      name,
      description,
      manufacturer: user._id,
      manufactureDate,
      qrCodeUrl,
    });
    res.json(product);
  } catch (e) {
    console.error('Create product error:', e);
    const message = e?.error?.message || e?.shortMessage || e?.message || 'Server error';
    res.status(500).json({ error: message });
  }
});

router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const query = user.role === 'manufacturer' ? { manufacturer: user._id } : {};
  const list = await Product.find(query).sort({ createdAt: -1 }).limit(100);
  res.json(list);
});

router.get('/:id/qrcode', async (req, res) => {
  const p = await Product.findOne({ blockchainId: req.params.id });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ qrCodeUrl: p.qrCodeUrl });
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

// Transfer product on-chain
router.post('/:id/transfer', auth, async (req, res) => {
  try {
    const { contract } = await getEthersBindings();
    const { toAddress, location } = req.body;
    const productId = Number(req.params.id);
    if (!contract) return res.status(500).json({ error: 'Contract not configured' });
    const tx = await contract.transferProduct(productId, toAddress, location || '');
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Transfer failed' });
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

    const { metadataURI, products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array required' });
    }

    // Prepare product data for contract
    const productNames = products.map(p => p.name || '');
    const manufactureDates = products.map(p => 
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
    
    // Get product IDs from the batch
    const productIds = await contract.getBatchProductIds(batchId);
    
    // Create batch document in MongoDB
    const batchDoc = await Batch.create({
      batchId,
      manufacturer: user._id,
      metadataURI: metadataURI || `ipfs://batch-${batchId}`,
      nftTokenId: batchId, // NFT token ID = batch ID
    });

    // Create product documents in MongoDB
    const createdProducts = [];
    for (let i = 0; i < products.length; i++) {
      const blockchainId = Number(productIds[i]);
      const product = products[i];
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${blockchainId}`;
      const qrCodeUrl = await QRCode.toDataURL(verifyUrl);

      const productDoc = await Product.create({
        blockchainId,
        name: product.name,
        description: product.description,
        manufacturer: user._id,
        batchId: batchDoc._id,
        batchBlockchainId: batchId,
        manufactureDate: product.manufactureDate || new Date(),
        qrCodeUrl,
      });

      createdProducts.push(productDoc);
    }

    // Update batch with product references
    batchDoc.products = createdProducts.map(p => p._id);
    await batchDoc.save();

    res.json({
      batch: batchDoc,
      products: createdProducts,
      txHash: receipt.transactionHash,
      nftTokenId: batchId
    });
  } catch (e) {
    console.error('Create batch error:', e);
    const message = e?.error?.message || e?.shortMessage || e?.message || 'Server error';
    res.status(500).json({ error: message });
  }
});

// Get all batches for a manufacturer
router.get('/batch/list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const query = user.role === 'manufacturer' ? { manufacturer: user._id } : {};
    const batches = await Batch.find(query)
      .populate('manufacturer', 'name companyName')
      .populate('products')
      .sort({ createdAt: -1 });
    
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

// Generate ZK proof for product batch membership
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
      return res.status(400).json({ error: 'Product is not part of a batch' });
    }
    
    // Generate secret (in production, this should be securely stored per manufacturer)
    const secret = req.body.secret || ethers.keccak256(ethers.toUtf8Bytes(`secret-${productId}-${batchId}`));
    
    // Generate ZK proof
    const proofData = await generateBatchMembershipProof(productId, Number(batchId), secret);
    
    // Save proof to product document
    const product = await Product.findOne({ blockchainId: productId });
    if (product) {
      product.zkProof = proofData;
      await product.save();
    }
    
    res.json({
      productId,
      batchId: Number(batchId),
      proof: proofData.proof,
      publicSignals: proofData.publicSignals
    });
  } catch (e) {
    console.error('Error generating ZK proof:', e);
    res.status(500).json({ error: 'Failed to generate proof' });
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


