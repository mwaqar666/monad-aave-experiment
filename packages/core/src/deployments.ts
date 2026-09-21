import { mainnet, polygon, base, monad, arbitrum, optimism } from "viem/chains";
import { AaveV3Ethereum, AaveV3Polygon, AaveV3Base, AaveV3Monad, AaveV3Arbitrum, AaveV3Optimism } from "@aave-dao/aave-address-book";

import { env } from "./utils.ts";
import type { Address } from "./types.ts";

export type AllChainType = typeof mainnet | typeof polygon | typeof base | typeof monad | typeof arbitrum | typeof optimism;

export interface IChainAddresses {
  pool: Address;
  oracle: Address;
  poolDataProvider: Address;
  poolAddressesProvider: Address;
}

export interface IChain<ChainKey extends Chain, ChainConfig extends AllChainType> {
  key: ChainKey;
  config: ChainConfig;
  rpcUrl: string;
  addresses: IChainAddresses;
}

export enum Chain {
  Mainnet = "mainnet",
  Polygon = "polygon",
  Base = "base",
  Monad = "monad",
  Arbitrum = "arbitrum",
  Optimism = "optimism",
}

export const Chains = {
  [Chain.Mainnet]: {
    key: Chain.Mainnet,
    config: mainnet,
    rpcUrl: env("RPC_URL_MAINNET", "https://eth.drpc.org"),
    addresses: {
      pool: AaveV3Ethereum.POOL,
      oracle: AaveV3Ethereum.ORACLE,
      poolDataProvider: AaveV3Ethereum.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    },
  },
  [Chain.Polygon]: {
    key: Chain.Polygon,
    config: polygon,
    rpcUrl: env("RPC_URL_POLYGON", "https://polygon.drpc.org"),
    addresses: {
      pool: AaveV3Polygon.POOL,
      oracle: AaveV3Polygon.ORACLE,
      poolDataProvider: AaveV3Polygon.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
    },
  },
  [Chain.Base]: {
    key: Chain.Base,
    config: base,
    rpcUrl: env("RPC_URL_BASE", "https://mainnet.base.org"),
    addresses: {
      pool: AaveV3Base.POOL,
      oracle: AaveV3Base.ORACLE,
      poolDataProvider: AaveV3Base.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Base.POOL_ADDRESSES_PROVIDER,
    },
  },
  [Chain.Monad]: {
    key: Chain.Monad,
    config: monad,
    rpcUrl: env("RPC_URL_MONAD", "https://rpc.monad.xyz"),
    addresses: {
      pool: AaveV3Monad.POOL,
      oracle: AaveV3Monad.ORACLE,
      poolDataProvider: AaveV3Monad.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Monad.POOL_ADDRESSES_PROVIDER,
    },
  },
  [Chain.Arbitrum]: {
    key: Chain.Arbitrum,
    config: arbitrum,
    rpcUrl: env("RPC_URL_ARBITRUM", "https://arb1.arbitrum.io/rpc"),
    addresses: {
      pool: AaveV3Arbitrum.POOL,
      oracle: AaveV3Arbitrum.ORACLE,
      poolDataProvider: AaveV3Arbitrum.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
    },
  },
  [Chain.Optimism]: {
    key: Chain.Optimism,
    config: optimism,
    rpcUrl: env("RPC_URL_OPTIMISM", "https://mainnet.optimism.io"),
    addresses: {
      pool: AaveV3Optimism.POOL,
      oracle: AaveV3Optimism.ORACLE,
      poolDataProvider: AaveV3Optimism.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
    },
  },
};
