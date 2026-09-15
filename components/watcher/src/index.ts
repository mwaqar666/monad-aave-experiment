import { createPublicClient, http, type Address } from "viem";
import { Pool } from "pg";
import { createClient } from "redis";

import { AavePoolAbi } from "@packages/abis";
import { Chains, env } from "@packages/core";
import type { Chain, IChainConfig } from "@packages/core";

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const DATABASE_URL = env("DATABASE_URL");
const REDIS_URL = env("REDIS_URL");
const POLL_INTERVAL_MS = parseInt(env("POLL_INTERVAL"));
const HF_THRESHOLD = parseInt(env("HF_THRESHOLD"));

// ─────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────
const pgPool = new Pool({ connectionString: DATABASE_URL });
const redisClient = createClient({ url: REDIS_URL });

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

interface IUserData {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

async function pushToQueue(user: Address, chainId: number, data: IUserData) {
  const payload = JSON.stringify({
    user,
    chainId,
    totalCollateralBase: Number(data.totalCollateralBase / BigInt(1e8)),
    totalDebtBase: Number(data.totalDebtBase / BigInt(1e8)),
    healthFactor: Number(data.healthFactor / BigInt(1e18)),
    ltv: Number(data.ltv / BigInt(1e4)),
    currentLiquidationThreshold: Number(data.currentLiquidationThreshold / BigInt(1e4)),
    timestamp: Date.now(),
  });
  await redisClient.lPush("liquidation:candidates", payload);
  console.log(`[QUEUE] Chain ${chainId} | ${user} | HF: ${Number(data.healthFactor / BigInt(1e18)).toFixed(4)} | Debt: $${Number(data.totalDebtBase / BigInt(1e8)).toFixed(2)}`);
}

// ─────────────────────────────────────────────────────────────
// CHAIN SCAN: Check all borrowers on one chain
// ─────────────────────────────────────────────────────────────

async function checkChainBorrowers(chainId: Chain, chainConfig: IChainConfig) {
  const viemClient = createPublicClient({ transport: http(chainConfig.rpcUrl) });

  // 1. Fetch all borrowers for this chain from PostgreSQL
  const result = await pgPool.query<{ id: string; user_address: string }>(`SELECT id, user_address FROM account WHERE chain_id = $1 AND has_borrowed = true`, [chainId]);

  const borrowers = result.rows;
  if (borrowers.length === 0) {
    console.log(`[SCAN] ${chainConfig.name}: No borrowers found`);
    return;
  }

  console.log(`[SCAN] ${chainConfig.name}: Checking ${borrowers.length} borrowers...`);

  // 2. Batch call getUserAccountData
  const calls = borrowers.map((row) =>
    viemClient
      .readContract({
        address: chainConfig.addresses.pool,
        abi: AavePoolAbi,
        functionName: "getUserAccountData",
        args: [row.user_address as Address],
      })
      .then((data) => ({ user: row.user_address as Address, data })),
  );

  const results = await Promise.allSettled(calls);

  // 3. Process results
  let liquidatableCount = 0;
  for (const settled of results) {
    if (settled.status === "rejected") continue;

    const { user, data } = settled.value;
    const [totalCollateralBase, totalDebtBase, , currentLiquidationThreshold, ltv, healthFactor] = data;

    const hfDisplay = Number(healthFactor / BigInt(1e18));
    const debtDisplay = Number(totalDebtBase / BigInt(1e8));

    console.log(`[CHECK] ${chainConfig.name} | ${user} | HF: ${hfDisplay.toFixed(4)} | Debt: $${debtDisplay.toFixed(2)}`);

    if (totalDebtBase <= 0n) continue;

    if (healthFactor < BigInt(Math.floor(HF_THRESHOLD * 1e18))) {
      liquidatableCount++;
      await pushToQueue(user, chainId, {
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase: data[2],
        currentLiquidationThreshold,
        ltv,
        healthFactor,
      });
    }
  }

  console.log(`[DONE] ${chainConfig.name}: ${liquidatableCount} liquidatable | ${borrowers.length} checked`);
}

// ─────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("[WATCHER] Starting Aave Liquidation Watcher (Multi-Chain)");
  console.log(
    `[WATCHER] Chains: ${Object.values(Chains)
      .map((c) => c.name)
      .join(", ")}`,
  );
  console.log(`[WATCHER] HF threshold: ${HF_THRESHOLD}`);
  console.log(`[WATCHER] Poll interval: ${POLL_INTERVAL_MS}ms`);

  await redisClient.connect();
  console.log("[WATCHER] Redis connected");

  const test = await pgPool.query("SELECT NOW()");
  console.log(`[WATCHER] PostgreSQL connected | Server time: ${test.rows[0].now}`);

  while (true) {
    const startTime = Date.now();
    for (const [chainId, chainConfig] of Object.entries(Chains)) {
      try {
        await checkChainBorrowers(parseInt(chainId), chainConfig);
      } catch (err) {
        console.error(`[WATCHER] Error on ${chainConfig.name}:`, err);
      }
    }
    const elapsed = Date.now() - startTime;
    console.log(`[CYCLE] All chains scanned in ${elapsed}ms`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error("[WATCHER] Fatal error:", err);
  process.exit(1);
});
