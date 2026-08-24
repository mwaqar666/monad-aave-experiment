import { createConfig } from "ponder";
import { http } from "viem";

import { AavePoolV3Abi } from "./abis/AavePoolV3";

export default createConfig({
  chains: {
    monad: {
      id: 1,
      rpc: http(process.env.PONDER_RPC_URL),
    },
  },
  contracts: {
    AavePoolV3: {
      chain: "monad",
      abi: AavePoolV3Abi,
      // address: "0x0000000000000000000000000000000000000000",
      address: "0x69a5F9AD4f96ebf0a0C792dD42a01cC5C0102fef",
      startBlock: "latest",
    },
  },
});
