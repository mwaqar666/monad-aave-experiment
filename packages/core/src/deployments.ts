import { AaveV3Arbitrum, AaveV3Base, AaveV3Ethereum, AaveV3Monad, AaveV3Optimism, AaveV3Polygon } from "@aave-dao/aave-address-book";

export interface IChainAddresses {
  pool: `0x${string}`;
  oracle: `0x${string}`;
  poolDataProvider: `0x${string}`;
  poolAddressesProvider: `0x${string}`;
}

export interface IChainConfig {
  key: string;
  name: string;
  rpcUrl: string;
  addresses: IChainAddresses;
}

export enum Chain {
  Ethereum = 1,
  Polygon = 137,
  Base = 8453,
  Monad = 143,
  Arbitrum = 42161,
  Optimism = 10,
}

/**
 * The 6 chains we monitor
 */
export const Chains: Record<Chain, IChainConfig> = {
  [Chain.Ethereum]: createChainConfig(Chain.Ethereum, "ethereum", "Ethereum", "RPC_URL_MAINNET"),
  [Chain.Polygon]: createChainConfig(Chain.Polygon, "polygon", "Polygon", "RPC_URL_POLYGON"),
  [Chain.Base]: createChainConfig(Chain.Base, "base", "Base", "RPC_URL_BASE"),
  [Chain.Monad]: createChainConfig(Chain.Monad, "monad", "Monad", "RPC_URL_MONAD"),
  [Chain.Arbitrum]: createChainConfig(Chain.Arbitrum, "arbitrum", "Arbitrum", "RPC_URL_ARBITRUM"),
  [Chain.Optimism]: createChainConfig(Chain.Optimism, "optimism", "Optimism", "RPC_URL_OPTIMISM"),
};

export function env(name: string, defaultVal?: string): string {
  const value = process.env[name];
  if (!value && defaultVal) return defaultVal;
  if (!value) throw new Error(`Environment variable [${name}] is not set`);
  return value;
}

export function createChainConfig(chain: Chain, key: string, name: string, rpcEnvVar: string): IChainConfig {
  return {
    key: key,
    name: name,
    rpcUrl: env(rpcEnvVar),
    addresses: getAddresses(chain),
  };
}

export function getAddresses(chainId: number): IChainAddresses {
  const addressBook = getAddressBook(chainId);

  return {
    pool: addressBook.POOL,
    oracle: addressBook.ORACLE,
    poolDataProvider: addressBook.AAVE_PROTOCOL_DATA_PROVIDER,
    poolAddressesProvider: addressBook.POOL_ADDRESSES_PROVIDER,
  };
}

export function getAddressBook(chainId: number) {
  switch (chainId) {
    case 1:
      return AaveV3Ethereum;
    case 137:
      return AaveV3Polygon;
    case 8453:
      return AaveV3Base;
    case 143:
      return AaveV3Monad;
    case 42161:
      return AaveV3Arbitrum;
    case 10:
      return AaveV3Optimism;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}
