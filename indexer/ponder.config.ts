import { createConfig } from "ponder";
import { http } from "viem";
import { AaveV3Monad } from "@aave-dao/aave-address-book";

import { AavePoolV3Abi } from "./abis/AavePoolV3";

const getEnvVar = (name: string, defaultVal?: string): string => {
  const value = process.env[name];

  if (!value && defaultVal) return defaultVal;

  if (!value) throw new Error(`Environment variable [${name}] is not set`);

  return value;
};

const RPC_URL = getEnvVar("RPC_URL");
const DATABASE_URL = getEnvVar("DATABASE_URL");

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: DATABASE_URL,
  },
  chains: {
    monad: {
      id: 1,
      rpc: http(RPC_URL),
    },
  },
  contracts: {
    AavePoolV3: {
      chain: "monad",
      abi: AavePoolV3Abi,
      address: AaveV3Monad.POOL,
      startBlock: "latest",
    },
  },
});
