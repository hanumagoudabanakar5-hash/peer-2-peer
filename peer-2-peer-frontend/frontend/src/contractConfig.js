// Human-readable ABI, matching contracts/contracts/EnergyTrading.sol exactly.
export const ENERGY_TRADING_ABI = [
  "function oracle() view returns (address)",
  "function households(address) view returns (bool registered, string name)",
  "function listings(uint256) view returns (address seller, uint256 kwh, uint256 pricePerKwh, bool active)",
  "function trades(uint256) view returns (uint256 listingId, address buyer, address seller, uint256 kwh, uint256 amountPaid, bool delivered, bool settled)",
  "function listingCount() view returns (uint256)",
  "function tradeCount() view returns (uint256)",
  "function register(string name)",
  "function listSurplus(uint256 kwh, uint256 pricePerKwh)",
  "function buyEnergy(uint256 listingId) payable",
  "function confirmDelivery(uint256 tradeId)",
  "event Registered(address indexed who, string name)",
  "event Listed(uint256 indexed id, address indexed seller, uint256 kwh, uint256 pricePerKwh)",
  "event Purchased(uint256 indexed tradeId, address indexed buyer, uint256 kwh, uint256 amount)",
  "event Delivered(uint256 indexed tradeId)",
  "event Settled(uint256 indexed tradeId, address indexed seller, uint256 amount)",
];

// Fill CONTRACT_ADDRESS after each deploy — deploy.ts writes it to ai/contract_address.txt.
// A .env value (VITE_CONTRACT_ADDRESS) overrides this if present.
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const NETWORKS = {
  hardhatLocal: {
    label: "Hardhat Local",
    chainIdHex: "0x7a69", // 31337
    chainName: "Hardhat Local",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  polygonAmoy: {
    label: "Polygon Amoy",
    chainIdHex: "0x13882", // 80002
    chainName: "Polygon Amoy Testnet",
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
  },
};

// Which network the dashboard targets by default. Switch to "polygonAmoy"
// once you've deployed there and updated CONTRACT_ADDRESS.
export const ACTIVE_NETWORK = import.meta.env.VITE_NETWORK || "hardhatLocal";
