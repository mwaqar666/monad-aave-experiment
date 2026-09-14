export const AaveOracleAbi = [
  {
    name: "getSourceOfAsset",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "getAssetPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getAssetsPrices",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "address[]" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
] as const;
