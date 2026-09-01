import { AaveV3Arbitrum, AaveV3Base, AaveV3Ethereum, AaveV3Monad, AaveV3Optimism, AaveV3Polygon } from "@aave-dao/aave-address-book";
import { createPublicClient, http } from "viem";

const Abi = [
  {
    name: "getPool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "getPriceOracle",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "getPoolDataProvider",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const chains = {
  ethereum: {
    client: createPublicClient({
      transport: http("https://eth.drpc.org"),
    }),
    addressProvider: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  },
  polygon: {
    client: createPublicClient({
      transport: http("https://polygon.drpc.org"),
    }),
    addressProvider: AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
  },
  base: {
    client: createPublicClient({
      transport: http("https://mainnet.base.org"),
    }),
    addressProvider: AaveV3Base.POOL_ADDRESSES_PROVIDER,
  },
  monad: {
    client: createPublicClient({
      transport: http("https://rpc.monad.xyz"),
    }),
    addressProvider: AaveV3Monad.POOL_ADDRESSES_PROVIDER,
  },
  arbitrum: {
    client: createPublicClient({
      transport: http("https://arb1.arbitrum.io/rpc"),
    }),
    addressProvider: AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
  },
  optimism: {
    client: createPublicClient({
      transport: http("https://mainnet.optimism.io"),
    }),
    addressProvider: AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
  },
};

for (const [chain, chainContext] of Object.entries(chains)) {
  console.log(`\n\nChain: ${chain}`);
  console.log("─────────────────────────────");

  let [pool, priceOracle, poolDataProvider] = ["", "", ""];
  try {
    pool = await chainContext.client.readContract({
      address: chainContext.addressProvider,
      abi: Abi,
      functionName: "getPool",
    });
  } catch (error) {
    pool = "Error fetching pool address";
  }

  try {
    priceOracle = await chainContext.client.readContract({
      address: chainContext.addressProvider,
      abi: Abi,
      functionName: "getPriceOracle",
    });
  } catch (error) {
    priceOracle = "Error fetching price oracle address";
  }

  try {
    poolDataProvider = await chainContext.client.readContract({
      address: chainContext.addressProvider,
      abi: Abi,
      functionName: "getPoolDataProvider",
    });
  } catch (error) {
    poolDataProvider = "Error fetching pool data provider address";
  }

  console.log("Pool Address:", pool);
  console.log("Price Oracle Address:", priceOracle);
  console.log("Pool Data Provider Address:", poolDataProvider);
}
