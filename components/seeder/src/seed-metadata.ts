import { createPublicClient, http } from "viem";

import { AavePoolDataProviderAbi, AaveOracleAbi, AavePoolEModeAbi } from "@packages/abis";
import { PROTOCOL_AAVE_V3, Chains, type Address } from "@packages/core";
import { database, marketMetadata, emodeCategoryMetadata } from "@packages/db";

console.log("=== Starting Static Market Metadata Seeding ===");

try {
  for (const chain of Object.values(Chains)) {
    console.log(`\nProcessing chain: ${chain.config.name} (ChainID: ${chain.config.id})`);

    const publicClient = createPublicClient({ chain: chain.config, transport: http() });

    // 1. Fetch all listed reserve tokens dynamically
    const rawReserves = await publicClient.readContract({
      address: chain.addresses.poolDataProvider,
      abi: AavePoolDataProviderAbi,
      functionName: "getAllReservesTokens",
    });

    console.log(`Discovered ${rawReserves.length} reserve markets.`);

    if (rawReserves.length === 0) {
      console.warn(`No reserves returned for ${chain.config.name}. Skipping...`);
      continue;
    }

    // 2. Batch multicall for each reserve: config + oracle source
    const reserveCalls = rawReserves.flatMap((reserve) => [
      {
        address: chain.addresses.poolDataProvider,
        abi: AavePoolDataProviderAbi,
        functionName: "getReserveConfigurationData" as const,
        args: [reserve.tokenAddress] as const,
      },
      {
        address: chain.addresses.oracle,
        abi: AaveOracleAbi,
        functionName: "getSourceOfAsset" as const,
        args: [reserve.tokenAddress] as const,
      },
    ]);

    const multicallResults = await publicClient.multicall({
      contracts: reserveCalls,
      allowFailure: false,
      multicallAddress: chain.config.contracts.multicall3.address,
    });

    // 3. Process and write market metadata to PostgreSQL
    for (let i = 0; i < rawReserves.length; i++) {
      const reserve = rawReserves[i];
      if (!reserve) throw new Error(`Reserve data missing for index ${i} on chain ${chain.config.name}`);

      const tokenAddress = reserve.tokenAddress;
      const configData = multicallResults[i * 2] as [
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

      const oracleAddress = multicallResults[i * 2 + 1] as Address;

      const reserveId = `${chain.config.id}:${PROTOCOL_AAVE_V3}:${tokenAddress}`;

      await database()
        .insert(marketMetadata)
        .values({
          id: reserveId,
          chainId: chain.config.id,
          protocol: PROTOCOL_AAVE_V3,
          marketId: tokenAddress,
          assetSymbol: reserve.symbol,
          decimals: Number(configData[0]),
          oracleAddress,
          liquidationThresholdBps: Number(configData[2]),
          liquidationBonusBps: Number(configData[3]),
          usageAsCollateralEnabled: configData[5],
          isActive: configData[8],
          isFrozen: configData[9],
        })
        .onConflictDoUpdate({
          target: marketMetadata.id,
          set: {
            assetSymbol: reserve.symbol,
            decimals: Number(configData[0]),
            oracleAddress,
            liquidationThresholdBps: Number(configData[2]),
            liquidationBonusBps: Number(configData[3]),
            usageAsCollateralEnabled: configData[5],
            isActive: configData[8],
            isFrozen: configData[9],
          },
        });

      console.log(`  ✓ ${reserve.symbol} (${tokenAddress})`);
    }

    // 4. Batch query E-Mode Categories (1 through 5)
    const eModeIds = [1, 2, 3, 4, 5];
    const eModeCalls = eModeIds.map((categoryId) => ({
      address: chain.addresses.pool,
      abi: AavePoolEModeAbi,
      functionName: "getEModeCategoryData",
      args: [categoryId] as const,
    }));

    const eModeResults = await publicClient.multicall({
      contracts: eModeCalls,
      allowFailure: true,
      multicallAddress: chain.config.contracts.multicall3.address,
    });

    for (const categoryId of eModeIds) {
      const result = eModeResults[categoryId - 1];
      if (!result || result.status === "failure") {
        console.warn(`  E-Mode cat ${categoryId} not found. Skipping...`);
        continue;
      }

      const cat = result.result;
      if (cat.ltv === 0 && cat.liquidationThreshold === 0) continue;

      const catId = `${chain.config.id}:${PROTOCOL_AAVE_V3}:${categoryId}`;

      await database()
        .insert(emodeCategoryMetadata)
        .values({
          id: catId,
          chainId: chain.config.id,
          protocol: PROTOCOL_AAVE_V3,
          categoryId,
          ltvBps: cat.ltv,
          liquidationThresholdBps: cat.liquidationThreshold,
          liquidationBonusBps: cat.liquidationBonus,
          oracleAddress: cat.priceSource,
          label: cat.label,
        })
        .onConflictDoUpdate({
          target: emodeCategoryMetadata.id,
          set: {
            ltvBps: cat.ltv,
            liquidationThresholdBps: cat.liquidationThreshold,
            liquidationBonusBps: cat.liquidationBonus,
            oracleAddress: cat.priceSource,
            label: cat.label,
          },
        });

      console.log(`  ✓ E-Mode Cat ${categoryId}: "${cat.label}"`);
    }
  }

  console.log("\n=== Metadata Seeding Completed Successfully ===");
} catch (error) {
  console.error("Error running metadata seed script:", error);
  process.exit(1);
}
