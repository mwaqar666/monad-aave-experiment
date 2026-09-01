import { createConfig } from "ponder";
import { http } from "viem";
import { AaveV3Arbitrum, AaveV3Base, AaveV3Ethereum, AaveV3Monad, AaveV3Optimism, AaveV3Polygon } from "@aave-dao/aave-address-book";

import { AavePoolAbi } from "@abis";

const getEnvVar = (name: string, defaultVal?: string): string => {
  const value = process.env[name];

  if (!value && defaultVal) return defaultVal;

  if (!value) throw new Error(`Environment variable [${name}] is not set`);

  return value;
};

const RPC_URL_MAINNET = getEnvVar("RPC_URL_MAINNET");
const RPC_URL_POLYGON = getEnvVar("RPC_URL_POLYGON");
const RPC_URL_BASE = getEnvVar("RPC_URL_BASE");
const RPC_URL_MONAD = getEnvVar("RPC_URL_MONAD");
const RPC_URL_ARBITRUM = getEnvVar("RPC_URL_ARBITRUM");
const RPC_URL_OPTIMISM = getEnvVar("RPC_URL_OPTIMISM");

const DATABASE_URL = getEnvVar("DATABASE_URL");

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: DATABASE_URL,
  },
  chains: {
    mainnet: { id: 1, rpc: http(RPC_URL_MAINNET) },
    polygon: { id: 137, rpc: http(RPC_URL_POLYGON) },
    base: { id: 8453, rpc: http(RPC_URL_BASE) },
    monad: { id: 143, rpc: http(RPC_URL_MONAD) },
    arbitrum: { id: 42161, rpc: http(RPC_URL_ARBITRUM) },
    optimism: { id: 10, rpc: http(RPC_URL_OPTIMISM) },
  },
  contracts: {
    AavePool: {
      abi: AavePoolAbi,
      chain: {
        mainnet: { address: AaveV3Ethereum.POOL, startBlock: "latest" },
        polygon: { address: AaveV3Polygon.POOL, startBlock: "latest" },
        base: { address: AaveV3Base.POOL, startBlock: "latest" },
        monad: { address: AaveV3Monad.POOL, startBlock: "latest" },
        arbitrum: { address: AaveV3Arbitrum.POOL, startBlock: "latest" },
        optimism: { address: AaveV3Optimism.POOL, startBlock: "latest" },
      },
    },
  },
});
