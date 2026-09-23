import { getPriceFeeds } from "./price-feeds.ts";
import { priceRegistry } from "./price-registry.ts";
import { ChainlinkWatcherService } from "./chainlink-watcher.ts";

async function main() {
  console.log("🚀 Starting Off-Chain Price Ingestion Service...");

  // 1. Resolve price feed mappings from DB & local Hermes
  const priceFeeds = await getPriceFeeds();
  console.log(`[Config] Resolved ${priceFeeds.length} reserve price feeds across chains.`);

  // 2. Initialize Price Registry with resolved tokens
  await priceRegistry.init(priceFeeds);

  // 3. Start Chainlink WebSocket listeners (Mainnet, Polygon, Base, Monad, Arbitrum, Optimism)
  const chainlinkWatcher = new ChainlinkWatcherService(priceFeeds);
  await chainlinkWatcher.start();

  // 4. Monitor Redis-backed PriceRegistry state
  setInterval(async () => {
    const prices = await priceRegistry.getAllPrices();
    console.log(`\n--- [PriceRegistry Snapshot: ${new Date().toISOString()}] ---`);
    console.table(prices);
  }, 5000);
}

main().catch((err) => {
  console.error("Fatal error in watcher service:", err);
  process.exit(1);
});
