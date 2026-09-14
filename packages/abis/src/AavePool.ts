export const AavePoolAbi = [
  // Events we track
  {
    name: "Supply",
    type: "event",
    inputs: [
      { name: "reserve", type: "address", indexed: true },
      { name: "user", type: "address", indexed: false },
      { name: "onBehalfOf", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "referralCode", type: "uint16", indexed: true },
    ],
  },
  {
    name: "Withdraw",
    type: "event",
    inputs: [
      { name: "reserve", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Borrow",
    type: "event",
    inputs: [
      { name: "reserve", type: "address", indexed: true },
      { name: "user", type: "address", indexed: false },
      { name: "onBehalfOf", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "interestRateMode", type: "uint8", indexed: false },
      { name: "borrowRate", type: "uint256", indexed: false },
      { name: "referralCode", type: "uint16", indexed: true },
    ],
  },
  {
    name: "Repay",
    type: "event",
    inputs: [
      { name: "reserve", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "repayer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "useATokens", type: "bool", indexed: false },
    ],
  },
  {
    name: "ReserveUsedAsCollateralEnabled",
    type: "event",
    inputs: [
      { name: "reserve", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
    ],
  },
  {
    name: "ReserveUsedAsCollateralDisabled",
    type: "event",
    inputs: [
      { name: "reserve", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
    ],
  },
  {
    name: "UserEModeSet",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "categoryId", type: "uint8", indexed: false },
    ],
  },
  {
    name: "LiquidationCall",
    type: "event",
    inputs: [
      { name: "collateralAsset", type: "address", indexed: true },
      { name: "debtAsset", type: "address", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "debtToCover", type: "uint256", indexed: false },
      { name: "liquidatedCollateralAmount", type: "uint256", indexed: false },
      { name: "liquidator", type: "address", indexed: false },
      { name: "receiveAToken", type: "bool", indexed: false },
    ],
  },
  {
    name: "ReserveDataUpdated",
    type: "event",
    inputs: [
      { name: "reserve", type: "address", indexed: true },
      { name: "liquidityRate", type: "uint256", indexed: false },
      { name: "stableBorrowRate", type: "uint256", indexed: false },
      { name: "variableBorrowRate", type: "uint256", indexed: false },
      { name: "liquidityIndex", type: "uint256", indexed: false },
      { name: "variableBorrowIndex", type: "uint256", indexed: false },
    ],
  },
  {
    name: "getUserAccountData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
  },
  {
    name: "liquidationCall",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collateralAsset", type: "address" },
      { name: "debtAsset", type: "address" },
      { name: "borrower", type: "address" },
      { name: "debtToCover", type: "uint256" },
      { name: "receiveAToken", type: "bool" },
    ],
    outputs: [],
  },
] as const;
