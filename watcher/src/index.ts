import { createPublicClient, http } from "viem";
import { monad } from "viem/chains";
import { AaveV3Monad } from "@aave-dao/aave-address-book";
import { Pool } from "pg";
import { createClient } from "redis";

import type { AbiTypeToPrimitiveType } from "abitype";

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const getEnvVar = (name: string, defaultVal?: string): string => {
  const value = process.env[name];

  if (!value && defaultVal) return defaultVal;

  if (!value) throw new Error(`Environment variable [${name}] is not set`);

  return value;
};

const RPC_URL = getEnvVar("RPC_URL");
const DATABASE_URL = getEnvVar("DATABASE_URL");
const REDIS_URL = getEnvVar("REDIS_URL");
const POLL_INTERVAL_MS = Number(getEnvVar("POLL_INTERVAL_MS", "5000")); // 5 seconds
const HF_THRESHOLD = Number(getEnvVar("HF_THRESHOLD", "1.0")); // Liquidatable below this

// Minimal ABI for getUserAccountData
const AavePoolV3Abi = [
  {
    name: "getUserAccountData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────
const viemClient = createPublicClient({
  chain: monad,
  transport: http(RPC_URL),
});

const pgPool = new Pool({ connectionString: DATABASE_URL });

const redisClient = createClient({ url: REDIS_URL });

// ─────────────────────────────────────────────────────────────
// QUEUE: Push liquidatable position to Redis
// ─────────────────────────────────────────────────────────────

interface IPushToQueueData {
  totalCollateralBase: number;
  totalDebtBase: number;
  healthFactor: number;
  ltv: number;
  currentLiquidationThreshold: number;
}

async function pushToQueue(user: AbiTypeToPrimitiveType<"address">, data: IPushToQueueData) {
  const payload = JSON.stringify({
    user,
    ...data,
    timestamp: Date.now(),
  });
  await redisClient.lPush("liquidation:candidates", payload);
  console.log(`[QUEUE] ${user} | HF: ${data.healthFactor.toFixed(4)} | Debt: $${data.totalDebtBase.toFixed(2)}`);
}

// ─────────────────────────────────────────────────────────────
// MAIN LOOP: Check all borrowers
// ─────────────────────────────────────────────────────────────
async function checkBorrowers() {
  const startTime = Date.now();

  // 1. Fetch all borrowers from PostgreSQL
  const result = await pgPool.query<{ id: AbiTypeToPrimitiveType<"address"> }>(`SELECT id FROM account WHERE has_borrowed = true AND is_active = true`);

  const borrowers = result.rows;
  console.log(`[SCAN] Checking ${borrowers.length} borrowers...`);

  if (borrowers.length === 0) return;

  // 2. Batch call getUserAccountData for all borrowers
  // We use Promise.allSettled to avoid one failed RPC call killing the whole batch
  const calls = borrowers.map((borrower) => {
    return viemClient
      .readContract({
        address: AaveV3Monad.POOL,
        abi: AavePoolV3Abi,
        functionName: "getUserAccountData",
        args: [borrower.id],
      })
      .then((data) => ({ user: borrower.id, data }));
  });

  const results = await Promise.allSettled(calls);

  // 3. Process results
  let liquidatableCount = 0;
  for (const result of results) {
    if (result.status === "rejected") continue;

    const {
      user,
      data: [totalCollateralBase, totalDebtBase, _, currentLiquidationThreshold, ltv, healthFactor],
    } = result.value;

    const hfDisplay = Number(healthFactor / BigInt(1e18));
    const debtDisplay = Number(totalDebtBase / BigInt(1e8));

    console.log(`[CHECK] ${user} | HF: ${hfDisplay.toFixed(4)} | Debt: $${debtDisplay.toFixed(2)} | Collateral: $${Number(totalCollateralBase / BigInt(1e8)).toFixed(2)}`);

    // Skip positions with no debt (already repaid or liquidated)
    if (totalDebtBase <= 0) continue;

    // Check if liquidatable
    if (healthFactor < HF_THRESHOLD) {
      liquidatableCount++;

      await pushToQueue(user, {
        totalCollateralBase: Number(totalCollateralBase / BigInt(1e8)),
        totalDebtBase: Number(totalDebtBase / BigInt(1e8)),
        currentLiquidationThreshold: Number(currentLiquidationThreshold / BigInt(1e4)),
        ltv: Number(ltv / BigInt(1e4)),
        healthFactor: Number(healthFactor / BigInt(1e18)),
      });
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[DONE] ${liquidatableCount} liquidatable | ${borrowers.length} checked | ${elapsed}ms`);
}

// ─────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("[WATCHER] Starting Aave Liquidation Watcher...");
  console.log(`[WATCHER] RPC: ${RPC_URL}`);
  console.log(`[WATCHER] DB: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}`); // Hide password
  console.log(`[WATCHER] Redis: ${REDIS_URL}`);
  console.log(`[WATCHER] Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`[WATCHER] HF threshold: ${HF_THRESHOLD}`);

  await redisClient.connect();
  console.log("[WATCHER] Redis connected");

  // Test DB connection
  const test = await pgPool.query("SELECT NOW()");
  console.log(`[WATCHER] PostgreSQL connected | Server time: ${test.rows[0].now}`);

  // Main loop
  while (true) {
    try {
      await checkBorrowers();
    } catch (err) {
      console.error("[WATCHER] Error in main loop:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error("[WATCHER] Fatal error:", err);
  process.exit(1);
});
