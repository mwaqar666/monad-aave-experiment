import { createPublicClient, webSocket, parseAbiItem, type Address } from "viem";

import { PriceRegistry } from "./price-registry.ts";

const ANSWER_UPDATED_EVENT = parseAbiItem("event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)");

export class ChainlinkWatcherService {
  private registry = PriceRegistry.getInstance();

  public watchChainFeeds(chainId: number, wsRpcUrl: string, feedMappings: { marketAddress: Address; oracleAddress: Address }[]) {
    const client = createPublicClient({
      transport: webSocket(wsRpcUrl),
    });

    console.log(`Starting Chainlink feed watcher for chain ID: ${chainId}`);

    for (const { marketAddress, oracleAddress } of feedMappings) {
      client.watchEvent({
        address: oracleAddress,
        event: ANSWER_UPDATED_EVENT,
        onLogs: (logs) => {
          for (const log of logs) {
            const currentAnswer = log.args.current;
            const updatedAt = log.args.updatedAt;

            if (currentAnswer && updatedAt) {
              // Chainlink USD feeds are natively 8 decimals
              const priceUsd = BigInt(currentAnswer);

              this.registry.setPrice(chainId, marketAddress, priceUsd, -8, updatedAt);
            }
          }
        },
        onError: (error) => {
          console.error(`Error on Chainlink feed (${oracleAddress}) on chain ${chainId}:`, error);
        },
      });
    }
  }
}
