import { createConfig } from "ponder";
import { http } from "viem";

import { AavePoolAbi } from "@packages/abis";
import { Chain, Chains, env } from "@packages/core";

const mainnet = Chains[Chain.Mainnet];
const polygon = Chains[Chain.Polygon];
const base = Chains[Chain.Base];
const monad = Chains[Chain.Monad];
const arbitrum = Chains[Chain.Arbitrum];
const optimism = Chains[Chain.Optimism];

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env("DATABASE_URL"),
  },
  chains: {
    mainnet: { id: mainnet.config.id, rpc: http(mainnet.rpcUrl) },
    polygon: { id: polygon.config.id, rpc: http(polygon.rpcUrl) },
    base: { id: base.config.id, rpc: http(base.rpcUrl) },
    monad: { id: monad.config.id, rpc: http(monad.rpcUrl) },
    arbitrum: { id: arbitrum.config.id, rpc: http(arbitrum.rpcUrl) },
    optimism: { id: optimism.config.id, rpc: http(optimism.rpcUrl) },
  },
  contracts: {
    AavePool: {
      abi: AavePoolAbi,
      chain: {
        mainnet: { address: mainnet.addresses.pool, startBlock: "latest" },
        polygon: { address: polygon.addresses.pool, startBlock: "latest" },
        base: { address: base.addresses.pool, startBlock: "latest" },
        monad: { address: monad.addresses.pool, startBlock: "latest" },
        arbitrum: { address: arbitrum.addresses.pool, startBlock: "latest" },
        optimism: { address: optimism.addresses.pool, startBlock: "latest" },
      },
    },
  },
});
