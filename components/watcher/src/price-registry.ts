import { EventEmitter } from "events";

import type { Address } from "@packages/core";

export interface PriceRecord {
  priceUsd: bigint; // Normalized to 8 decimals
  expo: number;
  publishTime: bigint;
  vaaUpdateData?: `0x${string}`; // Signed Pyth update blob for on-chain execution
}

export class PriceRegistry extends EventEmitter {
  private static instance: PriceRegistry;
  // Key format: `${chainId}:${marketAddress}`
  private prices: Map<string, PriceRecord> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): PriceRegistry {
    if (PriceRegistry.instance) return PriceRegistry.instance;

    PriceRegistry.instance = new PriceRegistry();
    return PriceRegistry.instance;
  }

  public setPrice(chainId: number, marketAddress: Address, priceUsd: bigint, expo: number, publishTime: bigint, vaaUpdateData?: `0x${string}`): void {
    const key = `${chainId}:${marketAddress.toLowerCase()}`;
    const previous = this.prices.get(key);

    this.prices.set(key, {
      priceUsd,
      expo,
      publishTime,
      vaaUpdateData,
    });

    // Check price delta to trigger liquidation evaluation
    if (previous) {
      const deltaBps = (Number(priceUsd - previous.priceUsd) * 10000) / Number(previous.priceUsd);

      // Emit movement if price shifted by more than 0.05% (5 basis points)
      if (Math.abs(deltaBps) >= 5) {
        this.emit("price:moved", {
          chainId,
          marketAddress: marketAddress.toLowerCase(),
          oldPrice: previous.priceUsd,
          newPrice: priceUsd,
          deltaBps,
          vaaUpdateData,
        });
      }
    } else {
      this.emit("price:initialized", {
        chainId,
        marketAddress: marketAddress.toLowerCase(),
        priceUsd,
        vaaUpdateData,
      });
    }
  }

  public getPrice(chainId: number, marketAddress: Address): bigint | undefined {
    return this.prices.get(`${chainId}:${marketAddress.toLowerCase()}`)?.priceUsd;
  }

  public getPriceRecord(chainId: number, marketAddress: Address): PriceRecord | undefined {
    return this.prices.get(`${chainId}:${marketAddress.toLowerCase()}`);
  }
}
