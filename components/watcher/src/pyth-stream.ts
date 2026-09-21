// import { env } from "@packages/core";
// import type { Address } from "@packages/core";

// import { PriceRegistry } from "./price-registry.ts";

// const HERMES_URL = env("PYTH_HERMES_URL", "https://hermes.pyth.network");

// interface PythStreamPrice {
//   id: string;
//   price: {
//     price: string;
//     conf: string;
//     expo: number;
//     publish_time: number;
//   };
//   binary?: {
//     data: string[];
//   };
// }

// export class PythStreamService {
//   private eventSource: EventSource | null = null;
//   private registry = PriceRegistry.getInstance();
//   private feedToTokenMap: Map<string, { chainId: number; address: Address }> = new Map();

//   public registerFeed(feedId: string, chainId: number, tokenAddress: Address) {
//     // Pyth feed IDs are 0x-prefixed 32-byte hex strings
//     const normalizedId = feedId.toLowerCase().replace("0x", "");
//     this.feedToTokenMap.set(normalizedId, { chainId, address: tokenAddress });
//   }

//   public start() {
//     const feedIds = Array.from(this.feedToTokenMap.keys());
//     if (feedIds.length === 0) {
//       console.warn("No Pyth feeds registered. Skipping stream initialization.");
//       return;
//     }

//     const queryParams = feedIds.map((id) => `ids[]=${id}`).join("&");
//     // Request binary updates to obtain on-chain VAAs
//     const streamUrl = `${HERMES_URL}/v2/updates/price/stream?${queryParams}&encoding=hex&parsed=true`;

//     console.log(`Connecting to Pyth Hermes SSE stream: ${HERMES_URL}...`);
//     this.eventSource = new EventSource(streamUrl);

//     this.eventSource.onmessage = (event) => {
//       try {
//         const payload = JSON.parse(event.data) as {
//           parsed?: PythStreamPrice[];
//           binary?: { data: string[] };
//         };

//         if (!payload.parsed) return;

//         const vaaData = payload.binary?.data?.[0] ? (`0x${payload.binary.data[0]}` as `0x${string}`) : undefined;

//         for (const update of payload.parsed) {
//           const mapping = this.feedToTokenMap.get(update.id.toLowerCase());
//           if (!mapping) continue;

//           const rawPrice = BigInt(update.price.price);
//           const expo = update.price.expo;

//           // Normalize Pyth price to standard 8 decimals (Aave base units)
//           const targetDecimals = 8;
//           const power = targetDecimals + expo;

//           let normalizedPrice: bigint;
//           if (power >= 0) {
//             normalizedPrice = rawPrice * 10n ** BigInt(power);
//           } else {
//             normalizedPrice = rawPrice / 10n ** BigInt(-power);
//           }

//           this.registry.setPrice(mapping.chainId, mapping.address, normalizedPrice, expo, BigInt(update.price.publish_time), vaaData);
//         }
//       } catch (err) {
//         console.error("Failed to parse Pyth stream update:", err);
//       }
//     };

//     this.eventSource.onerror = (err) => {
//       console.error("Pyth Hermes SSE error:", err);
//     };
//   }

//   public stop() {
//     this.eventSource?.close();
//   }
// }
