import { createPublicClient, createTestClient, http, publicActions, walletActions, parseEther } from "viem";
import { createClient } from "redis";
import { monad } from "viem/chains";
import { AaveV3Monad } from "@aave-dao/aave-address-book";
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

const RPC_URL = getEnvVar("RPC_URL", "https://rpc.monad.xyz");
const REDIS_URL = getEnvVar("REDIS_URL", "redis://localhost:6379");
const MIN_PROFIT_USD = Number(getEnvVar("MIN_PROFIT_USD", "10")); // Minimum $10 profit to proceed
const POLL_INTERVAL = Number(getEnvVar("POLL_INTERVAL", "2000"));

const FLASH_LOAN_PROVIDER = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; // Aave Pool on most chains

// Minimal ABI for liquidation
const poolAbi = [
  {
    name: "liquidationCall",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collateralAsset", type: "address" },
      { name: "debtAsset", type: "address" },
      { name: "borrower", type: "address" },
      { name: "debtToCover", type: "uint256" },
      { name: "receiveAToken", type: "bool" },
    ],
    outputs: [],
  },
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
const redisClient = createClient({ url: REDIS_URL });

const publicClient = createPublicClient({
  chain: monad,
  transport: http(RPC_URL),
});

// ─────────────────────────────────────────────────────────────
// SIMULATION: Fork Monad and test liquidation
// ─────────────────────────────────────────────────────────────

interface ICandidateData {
  user: AbiTypeToPrimitiveType<"address">;
  totalCollateralBase: number;
  totalDebtBase: number;
  healthFactor: number;
  ltv: number;
  currentLiquidationThreshold: number;
  timestamp: number;
}

async function simulateLiquidation(candidate: ICandidateData): Promise<{ profitable: boolean; estimatedProfit: number; gasUsed: bigint }> {
  console.log(`[SIM] Starting simulation for ${candidate.user}...`);

  // Get latest block for forking
  const latestBlock = await publicClient.getBlockNumber();
  console.log(`[SIM] Forking at block ${latestBlock}`);

  // Create Anvil test client (forks mainnet)
  const testClient = createTestClient({
    chain: monad,
    mode: "anvil",
    transport: http(RPC_URL),
  })
    .extend(publicActions)
    .extend(walletActions);

  // Impersonate a whale account with lots of capital
  const liquidatorAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`; // Will use anvil_impersonate

  try {
    // Set balance for impersonated account
    await testClient.setBalance({
      address: liquidatorAddress,
      value: parseEther("1000"),
    });

    // Get fresh user data on the fork
    const userData = await testClient.readContract({
      address: AaveV3Monad.POOL,
      abi: poolAbi,
      functionName: "getUserAccountData",
      args: [candidate.user],
    });

    const hf = Number(userData[5] / BigInt(1e18));
    console.log(`[SIM] On-fork HF: ${hf.toFixed(4)}`);

    if (hf >= 1.0) {
      console.log(`[SIM] Position recovered on fork. Skipping.`);
      return { profitable: false, estimatedProfit: 0, gasUsed: 0n };
    }

    // Calculate debt to cover (100% if HF < 0.95, else 50%)
    const debtToCover = candidate.totalDebtBase * (hf < 0.95 ? 1.0 : 0.5);
    const debtToCoverWei = BigInt(Math.floor(debtToCover * 1e8));

    console.log(`[SIM] Attempting to repay ${debtToCover.toFixed(2)} USD of debt`);

    // Simulate the liquidation call
    // Note: This is a simplified simulation. Real implementation needs:
    // 1. Flash loan setup
    // 2. Swap path for collateral
    // 3. Exact gas estimation

    const gasEstimate = await testClient.estimateContractGas({
      address: AaveV3Monad.POOL,
      abi: poolAbi,
      functionName: "liquidationCall",
      args: [
        "0x0000000000000000000000000000000000000000" as `0x${string}`, // collateralAsset - need to fetch from position
        "0x0000000000000000000000000000000000000000" as `0x${string}`, // debtAsset - need to fetch from position
        candidate.user,
        debtToCoverWei,
        false, // receiveAToken = false (receive underlying)
      ],
      account: liquidatorAddress,
    });

    // Monad gas is near-zero, but calculate anyway
    const gasPrice = await testClient.getGasPrice();
    const gasCost = Number(gasEstimate * gasPrice) / 1e18; // In MON

    // Rough profit estimate: 5-10% of debt as bonus minus gas
    const liquidationBonus = debtToCover * 0.05; // Assume 5%
    const estimatedProfit = liquidationBonus - gasCost;

    console.log(`[SIM] Gas estimate: ${gasEstimate} | Gas cost: ${gasCost.toFixed(6)} MON`);
    console.log(`[SIM] Estimated bonus: $${liquidationBonus.toFixed(2)} | Profit: $${estimatedProfit.toFixed(2)}`);

    return {
      profitable: estimatedProfit > MIN_PROFIT_USD,
      estimatedProfit,
      gasUsed: gasEstimate,
    };
  } catch (err: any) {
    console.error(`[SIM] Simulation failed: ${err.message}`);
    return { profitable: false, estimatedProfit: 0, gasUsed: 0n };
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN LOOP: Pull from Redis, simulate, push to Executor
// ─────────────────────────────────────────────────────────────
async function processCandidates() {
  const candidateJson = await redisClient.rPop("liquidation:candidates");

  if (!candidateJson) return;

  const candidate: ICandidateData = JSON.parse(candidateJson);
  console.log(`[SIM] Processing candidate: ${candidate.user}`);

  const result = await simulateLiquidation(candidate);

  if (result.profitable) {
    const approvedPayload = JSON.stringify({
      ...candidate,
      estimatedProfit: result.estimatedProfit,
      gasUsed: result.gasUsed.toString(),
      timestamp: Date.now(),
    });
    await redisClient.lPush("liquidation:approved", approvedPayload);
    console.log(`[SIM] ✅ APPROVED — Profit: $${result.estimatedProfit.toFixed(2)}`);
  } else {
    console.log(`[SIM] ❌ REJECTED — Not profitable`);
  }
}

async function main() {
  console.log("[SIMULATOR] Starting Aave Liquidation Simulator...");
  console.log(`[SIMULATOR] RPC: ${RPC_URL}`);
  console.log(`[SIMULATOR] Min profit: $${MIN_PROFIT_USD}`);
  console.log(`[SIMULATOR] Redis: ${REDIS_URL}`);

  await redisClient.connect();
  console.log("[SIMULATOR] Redis connected");

  while (true) {
    try {
      await processCandidates();
    } catch (err) {
      console.error("[SIMULATOR] Error:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

main().catch((err) => {
  console.error("[SIMULATOR] Fatal:", err);
  process.exit(1);
});
