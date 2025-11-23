require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { POLYGON_RPC_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mumbai: {
      url: POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};


