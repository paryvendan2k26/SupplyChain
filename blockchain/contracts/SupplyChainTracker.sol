// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SupplyChainTracker is ERC721URIStorage, Ownable {
    struct ProductTransfer {
        address from;
        address to;
        string location;
        uint256 timestamp;
    }

    struct Product {
        string name;
        string manufactureDate;
        address manufacturer;
        address currentHolder;
        bool verifiedByCustomer;
        address customerVerifier;
        bool exists;
        uint256 batchId; // Link to batch NFT
    }

    struct Batch {
        uint256 batchId;
        address manufacturer;
        string metadataURI; // IPFS or other metadata URI
        uint256 createdAt;
        uint256[] productIds; // Products in this batch
        bool exists;
    }

    // ZK Proof Verifier (simplified for demo - in production use actual verifier)
    struct ZKProof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[] publicSignals;
    }

    mapping(uint256 => Product) private products;
    mapping(uint256 => ProductTransfer[]) private transferHistory;
    mapping(uint256 => Batch) private batches;
    mapping(address => bool) public authorizedManufacturer;
    mapping(uint256 => bool) public verifiedProofs; // Track verified proofs to prevent replay
    
    uint256 public nextProductId = 1;
    uint256 public nextBatchId = 1;
    
    // ZK Verifier contract address (will be set after deployment)
    address public zkVerifierAddress;
    bool public zkVerificationEnabled = false;

    event ProductCreated(uint256 indexed productId, address indexed manufacturer, string name, uint256 indexed batchId);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, string location);
    event ProductVerified(uint256 indexed productId, address indexed customer);
    event BatchCreated(uint256 indexed batchId, address indexed manufacturer, string metadataURI, uint256[] productIds);
    event BatchNFTMinted(uint256 indexed batchId, address indexed to, uint256 tokenId);
    event ZKProofVerified(uint256 indexed productId, uint256 indexed batchId, address indexed verifier);

    modifier onlyAuthorizedManufacturer() {
        require(authorizedManufacturer[msg.sender], "Not authorized manufacturer");
        _;
    }

    modifier productMustExist(uint256 productId) {
        require(products[productId].exists, "Invalid product");
        _;
    }

    modifier batchMustExist(uint256 batchId) {
        require(batches[batchId].exists, "Invalid batch");
        _;
    }

    constructor() ERC721("SupplyChainBatch", "SCBATCH") Ownable(msg.sender) {
        authorizedManufacturer[msg.sender] = true;
    }

    function setManufacturer(address account, bool isAuthorized) external onlyOwner {
        authorizedManufacturer[account] = isAuthorized;
    }

    function setZKVerifier(address verifierAddress) external onlyOwner {
        zkVerifierAddress = verifierAddress;
        zkVerificationEnabled = (verifierAddress != address(0));
    }

    /**
     * @dev Create a new batch and mint NFT for it
     * @param metadataURI IPFS or metadata URI for the batch
     * @param productNames Array of product names to create in this batch
     * @param manufactureDates Array of manufacture dates (ISO format strings)
     */
    function createBatch(
        string calldata metadataURI,
        string[] calldata productNames,
        string[] calldata manufactureDates
    ) external onlyAuthorizedManufacturer returns (uint256) {
        require(productNames.length == manufactureDates.length, "Arrays length mismatch");
        require(productNames.length > 0, "Batch must have at least one product");

        uint256 batchId = nextBatchId++;
        uint256[] memory productIds = new uint256[](productNames.length);

        // Create all products in the batch
        for (uint256 i = 0; i < productNames.length; i++) {
            uint256 productId = nextProductId++;
            products[productId] = Product({
                name: productNames[i],
                manufactureDate: manufactureDates[i],
                manufacturer: msg.sender,
                currentHolder: msg.sender,
                verifiedByCustomer: false,
                customerVerifier: address(0),
                exists: true,
                batchId: batchId
            });
            productIds[i] = productId;
            emit ProductCreated(productId, msg.sender, productNames[i], batchId);
        }

        // Create batch record
        batches[batchId] = Batch({
            batchId: batchId,
            manufacturer: msg.sender,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            productIds: productIds,
            exists: true
        });

        // Mint NFT for the batch
        _safeMint(msg.sender, batchId);
        _setTokenURI(batchId, metadataURI);

        emit BatchCreated(batchId, msg.sender, metadataURI, productIds);
        emit BatchNFTMinted(batchId, msg.sender, batchId);

        return batchId;
    }

    /**
     * @dev Legacy function for creating single products (backward compatibility)
     */
    function createProduct(string calldata name, string calldata date)
        external
        onlyAuthorizedManufacturer
        returns (uint256)
    {
        uint256 productId = nextProductId++;
        products[productId] = Product({
            name: name,
            manufactureDate: date,
            manufacturer: msg.sender,
            currentHolder: msg.sender,
            verifiedByCustomer: false,
            customerVerifier: address(0),
            exists: true,
            batchId: 0 // No batch for legacy products
        });

        emit ProductCreated(productId, msg.sender, name, 0);
        return productId;
    }

    /**
     * @dev Verify ZK proof that product belongs to batch (simplified version)
     * In production, this would call an actual ZK verifier contract
     * @param productId The product ID to verify
     * @param batchId The batch ID the product should belong to
     */
    function verifyZKProof(
        uint256 productId,
        uint256 batchId,
        ZKProof calldata /* proof */
    ) external productMustExist(productId) batchMustExist(batchId) {
        require(zkVerificationEnabled, "ZK verification not enabled");
        require(products[productId].batchId == batchId, "Product not in batch");
        
        // Create a unique proof ID to prevent replay attacks
        uint256 proofId = uint256(keccak256(abi.encodePacked(productId, batchId, msg.sender, block.timestamp)));
        
        // In production, this would verify the actual proof:
        // require(IZKVerifier(zkVerifierAddress).verifyProof(proof.a, proof.b, proof.c, proof.publicSignals), "Invalid proof");
        
        // For now, we'll do a simplified check (in production use actual verifier)
        // This checks that the product actually belongs to the batch
        bool isValid = products[productId].batchId == batchId;
        require(isValid, "Invalid ZK proof");
        
        require(!verifiedProofs[proofId], "Proof already used");
        verifiedProofs[proofId] = true;

        emit ZKProofVerified(productId, batchId, msg.sender);
    }

    function transferProduct(uint256 productId, address to, string calldata location)
        external
        productMustExist(productId)
    {
        Product storage p = products[productId];
        require(!p.verifiedByCustomer, "Already verified by customer");
        require(msg.sender == p.currentHolder, "Only current holder can transfer");
        require(to != address(0), "Invalid recipient");

        address fromAddr = p.currentHolder;
        p.currentHolder = to;
        transferHistory[productId].push(ProductTransfer({
            from: fromAddr,
            to: to,
            location: location,
            timestamp: block.timestamp
        }));

        emit ProductTransferred(productId, fromAddr, to, location);
    }

    function verifyAsCustomer(uint256 productId) external productMustExist(productId) {
        Product storage p = products[productId];
        require(!p.verifiedByCustomer, "Already verified");
        p.verifiedByCustomer = true;
        p.customerVerifier = msg.sender;
        emit ProductVerified(productId, msg.sender);
    }

    function getProduct(uint256 productId)
        external
        view
        productMustExist(productId)
        returns (
            address manufacturer,
            address currentHolder,
            bool verifiedByCustomer,
            bool isAuthentic,
            address customer,
            uint256 batchId
        )
    {
        Product storage p = products[productId];
        return (p.manufacturer, p.currentHolder, p.verifiedByCustomer, p.exists, p.customerVerifier, p.batchId);
    }

    function getTransferHistory(uint256 productId)
        external
        view
        productMustExist(productId)
        returns (ProductTransfer[] memory)
    {
        return transferHistory[productId];
    }

    function getBatch(uint256 batchId)
        external
        view
        batchMustExist(batchId)
        returns (
            address manufacturer,
            string memory metadataURI,
            uint256 createdAt,
            uint256[] memory productIds,
            address nftOwner
        )
    {
        Batch storage b = batches[batchId];
        return (b.manufacturer, b.metadataURI, b.createdAt, b.productIds, ownerOf(batchId));
    }

    function getBatchProductIds(uint256 batchId)
        external
        view
        batchMustExist(batchId)
        returns (uint256[] memory)
    {
        return batches[batchId].productIds;
    }

    function getProductBatchId(uint256 productId)
        external
        view
        productMustExist(productId)
        returns (uint256)
    {
        return products[productId].batchId;
    }
}
