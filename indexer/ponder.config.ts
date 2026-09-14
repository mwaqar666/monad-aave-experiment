import { createConfig } from "ponder";
import { http } from "viem";

import { AavePoolAbi } from "@packages/abis";
import { Chain, Chains, env } from "@packages/core";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: env("DATABASE_URL"),
  },
  chains: {
    ethereum: { id: Chain.Ethereum, rpc: http(Chains[Chain.Ethereum].rpcUrl) },
    polygon: { id: Chain.Polygon, rpc: http(Chains[Chain.Polygon].rpcUrl) },
    base: { id: Chain.Base, rpc: http(Chains[Chain.Base].rpcUrl) },
    monad: { id: Chain.Monad, rpc: http(Chains[Chain.Monad].rpcUrl) },
    arbitrum: { id: Chain.Arbitrum, rpc: http(Chains[Chain.Arbitrum].rpcUrl) },
    optimism: { id: Chain.Optimism, rpc: http(Chains[Chain.Optimism].rpcUrl) },
  },
  contracts: {
    AavePool: {
      abi: AavePoolAbi,
      chain: {
        ethereum: { address: Chains[Chain.Ethereum].addresses.pool, startBlock: 25897147 },
        polygon: { address: Chains[Chain.Polygon].addresses.pool, startBlock: 93158918 },
        base: { address: Chains[Chain.Base].addresses.pool, startBlock: 50827151 },
        monad: { address: Chains[Chain.Monad].addresses.pool, startBlock: 101631748 },
        arbitrum: { address: Chains[Chain.Arbitrum].addresses.pool, startBlock: 501340240 },
        optimism: { address: Chains[Chain.Optimism].addresses.pool, startBlock: 156422436 },
      },
    },
  },
});
