import { EventEmitter } from "events";
import { createClient, type RedisClientType } from "redis";

import type { Address, Optional } from "@packages/core";
import type { IPriceFeed } from "./price-feeds.ts";

const PRICE_DECIMALS = 8;

/**
 * PriceRecordKey = `${chainId}:${assetAddress}` — used as the Redis hash key.
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
  private redis: RedisClientType;
  private keys = new Set<PriceRecordKey>();
  private readonly movedBps = 5;
  private readonly staleMs = 60_000;

  private constructor() {
    super();

    const url = process.env["REDIS_URL"] ?? "redis://localhost:6379";
    this.redis = createClient({ url });

    this.redis.on("ready", () => console.log(`[PriceRegistry] Connected to Redis (${url})`));
    this.redis.on("error", (err) => console.error("[PriceRegistry] Redis error:", err.message));
  }

  public static getInstance(): PriceRegistry {
    if (PriceRegistry.instance) return PriceRegistry.instance;

    PriceRegistry.instance = new PriceRegistry();
    PriceRegistry.instance.redis.connect().catch((err) => console.error("[PriceRegistry] Redis connect failure:", err.message));
    return PriceRegistry.instance;
  }

  /** Redis hash key for a chain+asset. */
  private keyFor(chainId: number, assetAddress: Address): PriceRecordKey {
    return `${chainId}:${assetAddress}` as PriceRecordKey;
  }

  /** Register which price feeds we care about (tracks the key set). */
  public async init(priceFeeds: IPriceFeed[]): Promise<void> {
    for (const feed of priceFeeds) {
      this.keys.add(this.keyFor(feed.chainId, feed.assetAddress));
    }
  }

  /**
   * Set the price for a given asset on a specific chain.
   * Persists to Redis and emits change events for downstream liquidation logic.
   */
  public async setPrice(chainId: number, assetAddress: Address, priceUsd: bigint, expo: number, publishTime: bigint): Promise<void> {
    const key = this.keyFor(chainId, assetAddress);
    const normalized = this.toBaseUnits(priceUsd, expo);
    const updatedAt = Date.now();
    const previous = await this.getPriceRecord(chainId, assetAddress);

    // Persist to Redis hash.
    await this.redis.hSet(key, {
      priceUsd: normalized.toString(),
      expo: (-PRICE_DECIMALS).toString(),
      publishTime: publishTime.toString(),
      updatedAt: updatedAt.toString(),
    });
    this.keys.add(key);

    if (previous && previous.updatedAt > 0) {
      if (this.isStale(previous)) {
        this.emit("price:initialized", { chainId, assetAddress, priceUsd: normalized });
        return;
      }

      const deltaBps = this.calcDeltaBps(previous.priceUsd, normalized);
      if (Math.abs(deltaBps) >= this.movedBps) {
        this.emit("price:moved", { chainId, assetAddress, oldPriceUsd: previous.priceUsd, newPriceUsd: normalized, deltaBps });
      }
    } else {
      this.emit("price:initialized", { chainId, assetAddress, priceUsd: normalized });
    }
  }

  /** Get the latest known price for a given asset on a specific chain. */
  public async getPrice(chainId: number, assetAddress: Address): Promise<Optional<bigint>> {
    const record = await this.getPriceRecord(chainId, assetAddress);
    return record?.priceUsd;
  }

  public async getPriceRecord(chainId: number, assetAddress: Address): Promise<Optional<IPriceRecord>> {
    const data = await this.redis.hGetAll(this.keyFor(chainId, assetAddress));
    if (!data["priceUsd"]) return;

    return {
      priceUsd: BigInt(data["priceUsd"]!),
      expo: parseInt(data["expo"] ?? "0"),
      publishTime: BigInt(data["publishTime"] ?? "0"),
      updatedAt: parseInt(data["updatedAt"] ?? "0"),
    };
  }

  public async getAllPrices(): Promise<IAssetPrice[]> {
    const assetPrices: IAssetPrice[] = [];
    for (const key of this.keys) {
      const [chainIdStr, assetAddress] = key.split(":") as [string, Address];
      const record = await this.getPriceRecord(parseInt(chainIdStr), assetAddress);
      if (!record) continue;

      assetPrices.push({
        chainId: parseInt(chainIdStr),
        assetAddress,
        priceUsd: record.priceUsd,
        expo: record.expo,
        publishTime: record.publishTime,
        stale: !this.isFresh(record),
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
   * 1 bps = 0.01% = 0.0001 = 1 / 10,000
   */
  private calcDeltaBps(oldPrice: bigint, newPrice: bigint): number {
    if (oldPrice === 0n) return 0;
    return Number(((newPrice - oldPrice) * 10000n) / oldPrice);
  }

  private isStale(record: IPriceRecord): boolean {
    return !this.isFresh(record);
  }

  private isFresh(record: IPriceRecord): boolean {
    return Date.now() - record.updatedAt < this.staleMs;
  }
}

/** Shared singleton instance used across the watcher. */
export const priceRegistry = PriceRegistry.getInstance();
