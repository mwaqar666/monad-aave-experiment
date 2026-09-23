import { mainnet, polygon, base, monad, arbitrum, optimism } from "viem/chains";
import { AaveV3Ethereum, AaveV3Polygon, AaveV3Base, AaveV3Monad, AaveV3Arbitrum, AaveV3Optimism } from "@aave-dao/aave-address-book";

import { env } from "./utils.ts";
import type { Address } from "./types.ts";

export type AllChainType = typeof mainnet | typeof polygon | typeof base | typeof monad | typeof arbitrum | typeof optimism;

export interface IChainUrls {
  ws: string;
  rpc: string;
}

export interface IChainAddresses {
  pool: Address;
  oracle: Address;
  poolDataProvider: Address;
  poolAddressesProvider: Address;
}

export interface IChain<ChainKey extends Chain, ChainConfig extends AllChainType> {
  key: ChainKey;
  config: ChainConfig;
  urls: IChainUrls;
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
    urls: {
      ws: env("WS_URL_MAINNET", "wss://eth.drpc.org"),
      rpc: env("RPC_URL_MAINNET", "https://eth.drpc.org"),
    },
    addresses: {
      pool: AaveV3Ethereum.POOL,
      oracle: AaveV3Ethereum.ORACLE,
      poolDataProvider: AaveV3Ethereum.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    },
  } satisfies IChain<Chain.Mainnet, typeof mainnet>,
  [Chain.Polygon]: {
    key: Chain.Polygon,
    config: polygon,
    urls: {
      ws: env("WS_URL_POLYGON", "wss://polygon.drpc.org"),
      rpc: env("RPC_URL_POLYGON", "https://polygon.drpc.org"),
    },
    addresses: {
      pool: AaveV3Polygon.POOL,
      oracle: AaveV3Polygon.ORACLE,
      poolDataProvider: AaveV3Polygon.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Polygon.POOL_ADDRESSES_PROVIDER,
    },
  } satisfies IChain<Chain.Polygon, typeof polygon>,
  [Chain.Base]: {
    key: Chain.Base,
    config: base,
    urls: {
      ws: env("WS_URL_BASE", "wss://base.drpc.org"),
      rpc: env("RPC_URL_BASE", "https://base.drpc.org"),
    },
    addresses: {
      pool: AaveV3Base.POOL,
      oracle: AaveV3Base.ORACLE,
      poolDataProvider: AaveV3Base.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Base.POOL_ADDRESSES_PROVIDER,
    },
  } satisfies IChain<Chain.Base, typeof base>,
  [Chain.Monad]: {
    key: Chain.Monad,
    config: monad,
    urls: {
      ws: env("WS_URL_MONAD", "wss://monad-mainnet.drpc.org"),
      rpc: env("RPC_URL_MONAD", "https://monad-mainnet.drpc.org"),
    },
    addresses: {
      pool: AaveV3Monad.POOL,
      oracle: AaveV3Monad.ORACLE,
      poolDataProvider: AaveV3Monad.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Monad.POOL_ADDRESSES_PROVIDER,
    },
  } satisfies IChain<Chain.Monad, typeof monad>,
  [Chain.Arbitrum]: {
    key: Chain.Arbitrum,
    config: arbitrum,
    urls: {
      ws: env("WS_URL_ARBITRUM", "wss://arbitrum.drpc.org"),
      rpc: env("RPC_URL_ARBITRUM", "https://arbitrum.drpc.org"),
    },
    addresses: {
      pool: AaveV3Arbitrum.POOL,
      oracle: AaveV3Arbitrum.ORACLE,
      poolDataProvider: AaveV3Arbitrum.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
    },
  } satisfies IChain<Chain.Arbitrum, typeof arbitrum>,
  [Chain.Optimism]: {
    key: Chain.Optimism,
    config: optimism,
    urls: {
      ws: env("WS_URL_OPTIMISM", "wss://optimism.drpc.org"),
      rpc: env("RPC_URL_OPTIMISM", "https://optimism.drpc.org"),
    },
    addresses: {
      pool: AaveV3Optimism.POOL,
      oracle: AaveV3Optimism.ORACLE,
      poolDataProvider: AaveV3Optimism.AAVE_PROTOCOL_DATA_PROVIDER,
      poolAddressesProvider: AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
    },
  } satisfies IChain<Chain.Optimism, typeof optimism>,
};
