import { database, marketMetadata } from "@packages/db";
import { Chains, type Chain } from "@packages/core";

import type { Address } from "viem";

export interface IPriceFeed {
  chainId: number;
  chainKey: Chain;
  symbol: string;
  decimals: number;
  assetAddress: Address;
  oracleAddress: Address;
}

/**
 * Creates a list of price feeds from the database.
 */
export async function getPriceFeeds(): Promise<IPriceFeed[]> {
  const markets = await database().select().from(marketMetadata);
  const chainIdToKeys = new Map<number, Chain>(Object.values(Chains).map((c) => [c.config.id, c.key]));

  const priceFeeds: IPriceFeed[] = [];
  const skipped: string[] = [];

  for (const market of markets) {
    const chainKey = chainIdToKeys.get(market.chainId);
    if (!chainKey) {
      skipped.push(`[${market.chainId}] ${market.symbol} — unknown chain`);
      continue;
    }

    priceFeeds.push({
      chainId: market.chainId,
      chainKey,
      symbol: market.symbol,
      decimals: market.decimals,
      assetAddress: market.assetAddress.toLowerCase() as Address,
      oracleAddress: market.oracleAddress.toLowerCase() as Address,
    });
  }

  if (skipped.length > 0) {
    console.log(`[Feeds] ⚠ Skipped ${skipped.length} reserves:`);
    for (const s of skipped) console.log(`       ${s}`);
  }

  return priceFeeds;
}
