import { createPublicClient, webSocket, parseAbiItem } from "viem";

import { Chain, Chains } from "@packages/core";
import { PriceRegistry } from "./price-registry.ts";

import type { IPriceFeed } from "./price-feeds.ts";

const ANSWER_UPDATED_EVENT = parseAbiItem("event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)");

/**
 * Default public WebSocket RPC endpoints per chain.
 * Override each via env: WSS_RPC_URL_MAINNET / _POLYGON / _ARBITRUM / _OPTIMISM / _BASE.
 * NOTE: Monad has no Chainlink price feeds — it is priced via Pyth only.
 */
export class ChainlinkWatcherService {
  private registry = PriceRegistry.getInstance();
  private chainToPriceFeeds = new Map<Chain, IPriceFeed[]>();

  public constructor(priceFeeds: IPriceFeed[]) {
    this.groupPriceFeedsByChain(priceFeeds);
  }

  public async start(): Promise<void> {
    for (const [chainKey, priceFeeds] of this.chainToPriceFeeds) {
      this.watchChain(chainKey, priceFeeds);
    }
  }

  private groupPriceFeedsByChain(priceFeeds: IPriceFeed[]): void {
    for (const priceFeed of priceFeeds) {
      const priceFeedsOfChain = this.chainToPriceFeeds.get(priceFeed.chainKey) ?? [];
      priceFeedsOfChain.push(priceFeed);

      this.chainToPriceFeeds.set(priceFeed.chainKey, priceFeedsOfChain);
    }
  }

  private watchChain(chainKey: Chain, priceFeeds: IPriceFeed[]): void {
    const chain = Chains[chainKey];

    const client = createPublicClient({
      chain: chain.config,
      transport: webSocket(chain.urls.ws),
    });

    console.log(`[Chainlink] Watching ${priceFeeds.length} oracle feed(s) on chain ${chain.config.name} over WS.`);

    const eventWatcher = client.watchEvent({
      address: priceFeeds.map((m) => m.oracleAddress),
      event: ANSWER_UPDATED_EVENT,
      onLogs: async (logs) => {
        for (const log of logs) {
          const priceFeed = priceFeeds.find((pf) => pf.oracleAddress === log.address);
          if (!priceFeed) continue;

          const currentAnswer = log.args.current;
          const updatedAt = log.args.updatedAt;

          if (currentAnswer && updatedAt) {
            // Chainlink USD feeds are natively 8 decimals.
            await this.registry.setPrice(chain.config.id, priceFeed.assetAddress, currentAnswer, -8, updatedAt);
          }
        }
      },
      onError: (error) => {
        console.error(`[Chainlink] Error on chain ${chain.config.name}:`, error);
      },
    });

    eventWatcher();
  }
}
