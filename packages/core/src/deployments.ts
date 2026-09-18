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

export interface IChainConfig<ChainKey extends Chain, ChainType extends AllChainType> {
  key: ChainKey;
  chain: ChainType;
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
  [Chain.Mainnet]: createChainConfig(Chain.Mainnet, mainnet, "RPC_URL_MAINNET"),
  [Chain.Polygon]: createChainConfig(Chain.Polygon, polygon, "RPC_URL_POLYGON"),
  [Chain.Base]: createChainConfig(Chain.Base, base, "RPC_URL_BASE"),
  [Chain.Monad]: createChainConfig(Chain.Monad, monad, "RPC_URL_MONAD"),
  [Chain.Arbitrum]: createChainConfig(Chain.Arbitrum, arbitrum, "RPC_URL_ARBITRUM"),
  [Chain.Optimism]: createChainConfig(Chain.Optimism, optimism, "RPC_URL_OPTIMISM"),
};

function createChainConfig<ChainKey extends Chain, ChainType extends AllChainType>(key: ChainKey, chain: ChainType, rpcEnvVar: string): IChainConfig<ChainKey, ChainType> {
  return {
    key: key,
    chain: chain,
    rpcUrl: env(rpcEnvVar),
    addresses: getAddresses(key),
  };
}

function getAddresses(chain: Chain): IChainAddresses {
  const addressBook = getAddressBook(chain);

  return {
    pool: addressBook.POOL,
    oracle: addressBook.ORACLE,
    poolDataProvider: addressBook.AAVE_PROTOCOL_DATA_PROVIDER,
    poolAddressesProvider: addressBook.POOL_ADDRESSES_PROVIDER,
  };
}

function getAddressBook(chain: Chain) {
  switch (chain) {
    case Chain.Mainnet:
      return AaveV3Ethereum;
    case Chain.Polygon:
      return AaveV3Polygon;
    case Chain.Base:
      return AaveV3Base;
    case Chain.Monad:
      return AaveV3Monad;
    case Chain.Arbitrum:
      return AaveV3Arbitrum;
    case Chain.Optimism:
      return AaveV3Optimism;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}
