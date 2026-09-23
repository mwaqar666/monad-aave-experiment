import { EventEmitter } from "events";

import type { Address, Optional } from "@packages/core";
import type { IPriceFeed } from "./price-feeds.ts";

const PRICE_DECIMALS = 8;

/**
 * PriceRecordKey = `${chainId}:${assetAddress}` — used as the key in the price registry map.
 */
export type PriceRecordKey = `${number}:${Address}`;

export interface IPriceRecord {
  priceUsd: bigint; // Normalized to 8 decimals
  expo: number;
  publishTime: bigint; // Unix seconds
  updatedAt: number; // local receive timestamp (ms)
}

export interface IAssetPrice extends Omit<IPriceRecord, "updatedAt"> {
  chainId: number;
  assetAddress: Address;
  stale: boolean;
}

export class PriceRegistry extends EventEmitter {
  private static instance: PriceRegistry;
  private priceRecord: Map<PriceRecordKey, IPriceRecord> = new Map();

  // Configured thresholds (exposed for tests)
  private readonly movedBps = 5;
  private readonly staleMs = 60_000;

  private constructor() {
    super();
  }

  public static getInstance(): PriceRegistry {
    if (PriceRegistry.instance) return PriceRegistry.instance;

    PriceRegistry.instance = new PriceRegistry();
    return PriceRegistry.instance;
  }

  /**
   * Pre-populate the registry keys (optional — used for observability).
   */
  public init(priceFeeds: IPriceFeed[]): void {
    for (const priceFeed of priceFeeds) {
      const priceRecordKey = `${priceFeed.chainId}:${priceFeed.assetAddress}` satisfies PriceRecordKey;

      const priceRecord = this.priceRecord.get(priceRecordKey);
      if (priceRecord) return;

      this.priceRecord.set(priceRecordKey, {
        priceUsd: 0n,
        expo: -priceFeed.decimals,
        publishTime: 0n,
        updatedAt: 0,
      });
    }
  }

  /**
   * Set the price for a given asset on a specific chain.
   */
  public setPrice(chainId: number, assetAddress: Address, priceUsd: bigint, expo: number, publishTime: bigint): void {
    const key = `${chainId}:${assetAddress}` satisfies PriceRecordKey;
    const previous = this.priceRecord.get(key);

    // Normalize price to the standard 8-decimal base so that deltas are
    // comparable regardless of the source feed's native exponent (e.g. Pyth).
    const normalized = this.toBaseUnits(priceUsd, expo);

    this.priceRecord.set(key, {
      priceUsd: normalized,
      expo: -PRICE_DECIMALS,
      publishTime,
      updatedAt: Date.now(),
    });

    // Check price delta to trigger liquidation evaluation
    if (previous && previous.updatedAt > 0) {
      if (this.isStale(previous)) {
        // Previous price is stale — treat as a fresh initialization instead of a delta.
        this.emit("price:initialized", {
          chainId: chainId,
          assetAddress: assetAddress,
          priceUsd: normalized,
        });
        return;
      }

      const deltaBps = this.calcDeltaBps(previous.priceUsd, normalized);
      if (Math.abs(deltaBps) >= this.movedBps) {
        this.emit("price:moved", {
          chainId: chainId,
          assetAddress: assetAddress,
          oldPriceUsd: previous.priceUsd,
          newPriceUsd: normalized,
          deltaBps,
        });
      }
    } else {
      this.emit("price:initialized", {
        chainId: chainId,
        assetAddress: assetAddress,
        priceUsd: normalized,
      });
    }
  }

  /**
   * Get the latest known price for a given asset on a specific chain.
   */
  public getPrice(chainId: number, assetAddress: Address): Optional<bigint> {
    const priceRecord = this.priceRecord.get(`${chainId}:${assetAddress}`);
    if (!priceRecord) {
      console.warn(`[PriceRegistry] No price record for ${chainId}:${assetAddress}`);
      return;
    }

    return priceRecord.priceUsd;
  }

  public getPriceRecord(chainId: number, assetAddress: Address): Optional<IPriceRecord> {
    return this.priceRecord.get(`${chainId}:${assetAddress}`);
  }

  public getAllPrices(): IAssetPrice[] {
    const assetPrices: IAssetPrice[] = [];
    for (const [priceRecordKey, priceRecord] of this.priceRecord) {
      const [chainId, assetAddress] = priceRecordKey.split(":") as [string, Address];
      assetPrices.push({
        chainId: parseInt(chainId),
        assetAddress: assetAddress,
        priceUsd: priceRecord.priceUsd,
        expo: priceRecord.expo,
        publishTime: priceRecord.publishTime,
        stale: !this.isFresh(priceRecord),
      });
    }
    return assetPrices;
  }

  /**
   * Convert a price with arbitrary exponent into 8-decimal base units.
   */
  private toBaseUnits(price: bigint, expo: number): bigint {
    const power = PRICE_DECIMALS + expo; // expo is negative (e.g. -8, -9)
    if (power >= 0) return price * 10n ** BigInt(power);
    return price / 10n ** BigInt(-power);
  }

  /**
   * Basis-point delta between two 8-decimal prices.
   */
  private calcDeltaBps(oldPrice: bigint, newPrice: bigint): number {
    if (oldPrice === 0n) return 0;
    return Number(((newPrice - oldPrice) * 10000n) / oldPrice);
  }

  /**
   * True if the latest known price for this feed is stale.
   */
  public isStale(record: IPriceRecord): boolean {
    return !this.isFresh(record);
  }

  /**
   * A price is stale if it hasn't been updated within the stale window.
   */
  private isFresh(record: IPriceRecord): boolean {
    return Date.now() - record.updatedAt < this.staleMs;
  }
}

/** Shared singleton instance used across the watcher. */
export const priceRegistry = PriceRegistry.getInstance();
