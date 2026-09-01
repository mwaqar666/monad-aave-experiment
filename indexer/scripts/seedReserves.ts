import { createPublicClient, http, type Address } from "viem";
import { AaveV3Ethereum, AaveV3Polygon, AaveV3Base, AaveV3Monad, AaveV3Arbitrum, AaveV3Optimism } from "@aave-dao/aave-address-book";
import { drizzle } from "drizzle-orm/node-postgres";

import { AavePoolDataProviderAbi, AaveOracleAbi, AavePoolEModeAbi } from "@abis";
import { emodeCategory, marketReserve } from "../ponder.schema";

const getEnvVar = (name: string, defaultVal?: string): string => {
  const value = process.env[name];

  if (!value && defaultVal) return defaultVal;

  if (!value) throw new Error(`Environment variable [${name}] is not set`);

  return value;
};

const PROTOCOL_AAVE_V3 = "aave_v3";
const CANONICAL_MULTICALL3: Address = "0xcA11bde05977b3631167028862bE2a173976CA11";

interface NetworkDeployment {
  chainId: number;
  name: string;
  rpcUrl: string;
  poolDataProvider: Address;
  oracle: Address;
  pool: Address;
}

// ─────────────────────────────────────────────────────────────
// Monad & EVM Deployment Registry
// ─────────────────────────────────────────────────────────────
const DEPLOYMENTS: NetworkDeployment[] = [
  {
    chainId: 1,
    name: "Ethereum",
    rpcUrl: getEnvVar("RPC_URL_MAINNET", "https://eth.drpc.org"),
    pool: AaveV3Ethereum.POOL,
    oracle: AaveV3Ethereum.ORACLE,
    poolDataProvider: AaveV3Ethereum.AAVE_PROTOCOL_DATA_PROVIDER,
  },
  {
    chainId: 137,
    name: "Polygon",
    rpcUrl: getEnvVar("RPC_URL_POLYGON", "https://polygon.drpc.org"),
    pool: AaveV3Polygon.POOL,
    oracle: AaveV3Polygon.ORACLE,
    poolDataProvider: AaveV3Polygon.AAVE_PROTOCOL_DATA_PROVIDER,
  },
  {
    chainId: 8453,
    name: "Base",
    rpcUrl: getEnvVar("RPC_URL_BASE", "https://mainnet.base.org"),
    pool: AaveV3Base.POOL,
    oracle: AaveV3Base.ORACLE,
    poolDataProvider: AaveV3Base.AAVE_PROTOCOL_DATA_PROVIDER,
  },
  {
    chainId: 143,
    name: "Monad",
    rpcUrl: getEnvVar("RPC_URL_MONAD", "https://rpc.monad.xyz"),
    pool: AaveV3Monad.POOL,
    oracle: AaveV3Monad.ORACLE,
    poolDataProvider: AaveV3Monad.AAVE_PROTOCOL_DATA_PROVIDER,
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    rpcUrl: getEnvVar("RPC_URL_ARBITRUM", "https://arb1.arbitrum.io/rpc"),
    pool: AaveV3Arbitrum.POOL,
    oracle: AaveV3Arbitrum.ORACLE,
    poolDataProvider: AaveV3Arbitrum.AAVE_PROTOCOL_DATA_PROVIDER,
  },
  {
    chainId: 10,
    name: "Optimism",
    rpcUrl: getEnvVar("RPC_URL_OPTIMISM", "https://mainnet.optimism.io"),
    pool: AaveV3Optimism.POOL,
    oracle: AaveV3Optimism.ORACLE,
    poolDataProvider: AaveV3Optimism.AAVE_PROTOCOL_DATA_PROVIDER,
  },
];

async function seedReserves() {
  //   const dbConnectionString = getEnvVar("DATABASE_URL", "localhost://monad:monadpass@postgres:5432/liquidator");
  const dbConnectionString = getEnvVar("DATABASE_URL", "postgresql://monad:monadpass@127.0.0.1:5432/liquidator");
  const db = drizzle(dbConnectionString);

  console.log("=== Starting Market Metadata & Reserve Seeding ===");

  try {
    for (const deployment of DEPLOYMENTS) {
      console.log(`\nProcessing chain: ${deployment.name} (ChainID: ${deployment.chainId})`);

      const publicClient = createPublicClient({
        transport: http(deployment.rpcUrl),
      });

      // 1. Fetch all listed reserve tokens dynamically
      const rawReserves = await publicClient.readContract({
        address: deployment.poolDataProvider,
        abi: AavePoolDataProviderAbi,
        functionName: "getAllReservesTokens",
      });

      console.log(`Discovered ${rawReserves.length} reserve markets.`);

      if (rawReserves.length === 0) {
        console.warn(`No reserves returned for ${deployment.name}. Skipping...`);
        continue;
      }

      // 2. Batch multicall for each reserve
      // (Configuration + Real-time Indexes + Oracle Sources)
      const reserveCalls = rawReserves.flatMap((reserve) => [
        {
          address: deployment.poolDataProvider,
          abi: AavePoolDataProviderAbi,
          functionName: "getReserveConfigurationData" as const,
          args: [reserve.tokenAddress] as const,
        },
        {
          address: deployment.poolDataProvider,
          abi: AavePoolDataProviderAbi,
          functionName: "getReserveData" as const,
          args: [reserve.tokenAddress] as const,
        },
        {
          address: deployment.oracle,
          abi: AaveOracleAbi,
          functionName: "getSourceOfAsset" as const,
          args: [reserve.tokenAddress] as const,
        },
      ]);

      const multicallResults = await publicClient.multicall({
        contracts: reserveCalls,
        allowFailure: false,
        multicallAddress: CANONICAL_MULTICALL3,
      });

      // 3. Process and write market reserves to PostgreSQL
      for (let i = 0; i < rawReserves.length; i++) {
        const reserve = rawReserves[i];
        if (!reserve) throw new Error(`Reserve data missing for index ${i} on chain ${deployment.name}`);

        const tokenAddress = reserve.tokenAddress;
        const configData = multicallResults[i * 3] as [
          bigint, // 0. decimals
          bigint, // 1. ltv
          bigint, // 2. liquidationThreshold
          bigint, // 3. liquidationBonus
          bigint, // 4. reserveFactor
          boolean, // 5. usageAsCollateralEnabled
          boolean, // 6. borrowingEnabled
          boolean, // 7. stableBorrowRateEnabled
          boolean, // 8. isActive
          boolean, // 9. isFrozen
        ];

        const reserveData = multicallResults[i * 3 + 1] as [
          bigint, // 0. unbacked
          bigint, // 1. accruedToTreasuryScaled
          bigint, // 2. totalAToken
          bigint, // 3. totalStableDebt
          bigint, // 4. totalVariableDebt
          bigint, // 5. liquidityRate
          bigint, // 6. variableBorrowRate
          bigint, // 7. stableBorrowRate
          bigint, // 8. averageStableBorrowRate
          bigint, // 9. liquidityIndex
          bigint, // 10. variableBorrowIndex
          number, // 11. lastUpdateTimestamp
        ];

        const oracleAddress = multicallResults[i * 3 + 2] as Address;

        const reserveId = `${deployment.chainId}:${PROTOCOL_AAVE_V3}:${tokenAddress}`;

        await db
          .insert(marketReserve)
          .values({
            id: reserveId,
            chainId: deployment.chainId,
            protocol: PROTOCOL_AAVE_V3,
            marketId: tokenAddress,
            assetSymbol: reserve.symbol,
            decimals: Number(configData[0]),
            oracleAddress: oracleAddress,
            liquidationThresholdBps: Number(configData[2]),
            liquidationBonusBps: Number(configData[3]),
            liquidityIndex: reserveData[9],
            variableBorrowIndex: reserveData[10],
            usageAsCollateralEnabled: configData[5],
            isActive: configData[8],
            isFrozen: configData[9],
          })
          .onConflictDoUpdate({
            target: marketReserve.id,
            set: {
              assetSymbol: reserve.symbol,
              decimals: Number(configData[0]),
              oracleAddress: oracleAddress,
              liquidationThresholdBps: Number(configData[2]),
              liquidationBonusBps: Number(configData[3]),
              liquidityIndex: reserveData[9],
              variableBorrowIndex: reserveData[10],
              usageAsCollateralEnabled: configData[5],
              isActive: configData[8],
              isFrozen: configData[9],
            },
          });

        // 4. Batch query E-Mode Categories (Categories 1 through 5)
        const eModeCategoryIds = [1, 2, 3, 4, 5];
        const eModeCalls = eModeCategoryIds.map((categoryId) => ({
          address: deployment.pool,
          abi: AavePoolEModeAbi,
          functionName: "getEModeCategoryData",
          args: [categoryId] as const,
        }));

        const eModeResults = await publicClient.multicall({
          contracts: eModeCalls,
          allowFailure: true,
        });

        for (let categoryId of eModeCategoryIds) {
          const eModeCategoryResult = eModeResults[categoryId - 1];
          if (!eModeCategoryResult || eModeCategoryResult.status === "failure") {
            console.warn(`E-Mode category ${categoryId} not found for chain ${deployment.name}. Skipping...`);
            continue;
          }

          const eModeCategory = eModeCategoryResult.result;

          if (eModeCategory.ltv === 0 && eModeCategory.liquidationThreshold === 0) continue;

          const eModeCategoryId = `${deployment.chainId}:${PROTOCOL_AAVE_V3}:${categoryId}`;

          db.insert(emodeCategory)
            .values({
              id: eModeCategoryId,
              chainId: deployment.chainId,
              protocol: PROTOCOL_AAVE_V3,
              categoryId: categoryId,
              ltvBps: eModeCategory.ltv,
              liquidationThresholdBps: eModeCategory.liquidationThreshold,
              liquidationBonusBps: eModeCategory.liquidationBonus,
              oracleAddress: eModeCategory.priceSource,
              label: eModeCategory.label,
            })
            .onConflictDoUpdate({
              target: emodeCategory.id,
              set: {
                ltvBps: eModeCategory.ltv,
                liquidationThresholdBps: eModeCategory.liquidationThreshold,
                liquidationBonusBps: eModeCategory.liquidationBonus,
                oracleAddress: eModeCategory.priceSource,
                label: eModeCategory.label,
              },
            });

          console.log(`  ✓ Indexed E-Mode Cat ${categoryId}: "${eModeCategory.label}" (LT: ${eModeCategory.liquidationThreshold})`);
        }
      }
    }

    console.log("\n=== Reserve and E-Mode Seeding Completed Successfully ===");
  } catch (error) {
    console.error("Error running reserve seed script:", error);
    process.exit(1);
  }
}

seedReserves();
