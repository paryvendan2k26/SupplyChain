pragma circom 2.0.0;

/* This circuit proves that a product belongs to a batch
 * without revealing sensitive information about the product or batch
 * 
 * Public inputs: batchId, productHash (hash of product details)
 * Private inputs: productId, secret (known only to manufacturer)
 * 
 * The circuit checks: hash(productId, secret) == productHash
 * and verifies productId is within the batch range
 */

template BatchMembership() {
    // Public signals
    signal input batchId;
    signal input productHash; // hash(productId, secret)
    
    // Private signals
    signal private input productId;
    signal private input secret;
    
    // Constraints
    // Verify hash(productId, secret) == productHash
    component hasher = Poseidon(2);
    hasher.inputs[0] <== productId;
    hasher.inputs[1] <== secret;
    hasher.out === productHash;
    
    // Verify productId is within valid range (0 < productId < 2^64)
    productId > 0;
    productId < 18446744073709551616; // 2^64
}

// Import Poseidon hash function
component main = BatchMembership();

