import { HermesClient } from "@pythnetwork/hermes-client";

// import { database, marketMetadata } from "@packages/db";
import { env } from "@packages/core";
// import { Chains, Chain, env } from "@packages/core";

import type { Address } from "viem";
import type { Optional } from "@packages/core";

export interface PriceFeed {
  chainId: number;
  marketAddress: Address;
  assetSymbol: string;
  oracleAddress: Address;
  decimals: number;
  pythFeedId: Optional<`0x${string}`>;
}

const HERMES_URL = env("PYTH_HERMES_URL", "https://hermes.pyth.network");

/**
 * Dynamically resolves Pyth Feed IDs using the official @pythnetwork/hermes-client
 * without hardcoding any 32-byte hashes.
 */
export async function resolvePriceFeeds() {
  const hermes = new HermesClient(HERMES_URL, {
    
  });
  // const markets = await database().select().from(marketMetadata);
  // const pythSymbolToIdMap = new Map<string, `0x${string}`>();

  try {
    const pythFeeds = await hermes.getPriceFeeds({ assetType: "crypto" });
    const priceUpdates = await hermes.getLatestPriceUpdates(
      pythFeeds.map((f) => f.id),
      { parsed: true },
    );

    console.log(`Fetched ${pythFeeds.length} Pyth price feeds from Hermes`);
    console.log(`Fetched ${priceUpdates.binary.data.length} Pyth price updates from Hermes`);

    Bun.write("pyth-feeds.json", JSON.stringify(pythFeeds, null, 2));
    Bun.write("pyth-price-updates.json", JSON.stringify(priceUpdates, null, 2));
  } catch (err) {
    console.error("Failed to query Pyth Hermes price feeds:", err);
  }

  // return markets.map((m): PriceFeed => {
  //   let cleanSymbol = m.assetSymbol.toUpperCase();
  //   if (cleanSymbol.startsWith("W") && cleanSymbol.length > 3) {
  //     cleanSymbol = cleanSymbol.substring(1);
  //   }

  //   return {
  //     chainId: m.chainId,
  //     marketAddress: m.marketId.toLowerCase() as Address,
  //     assetSymbol: m.assetSymbol,
  //     oracleAddress: m.oracleAddress.toLowerCase() as Address,
  //     decimals: m.decimals,
  //     pythFeedId: pythSymbolToIdMap.get(cleanSymbol) || pythSymbolToIdMap.get(m.assetSymbol.toUpperCase()),
  //   };
  // });
}

resolvePriceFeeds();
