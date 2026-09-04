export const AavePoolEModeAbi = [
  {
    name: "getEModeCategoryData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint8" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "ltv", type: "uint16" },
          { name: "liquidationThreshold", type: "uint16" },
          { name: "liquidationBonus", type: "uint16" },
          { name: "priceSource", type: "address" },
          { name: "label", type: "string" },
        ],
      },
    ],
  },
] as const;
