import { ponder } from "ponder:registry";
import { account, position, liquidationRecord, reserveIndex } from "ponder:schema";

const PROTOCOL_AAVE_V3 = "aave_v3";
// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:Supply", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.onBehalfOf;
  const assetAddress = event.args.reserve;

  // 1. Ensure parent account exists
  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
    })
    .onConflictDoNothing();

  // 2. Mark this asset position as collateral for the account
  const positionId = `${accountId}:${assetAddress}`;
  await context.db
    .insert(position)
    .values({
      id: positionId,
      accountId: accountId,
      assetAddress: assetAddress,
      isCollateral: true,
    })
    .onConflictDoUpdate({
      isCollateral: true,
    });
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:Withdraw", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.user;
  const assetAddress = event.args.reserve;

  // 1. Ensure parent account exists
  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
    })
    .onConflictDoNothing();

  // 2. Ensure position entry exists
  const positionId = `${accountId}:${assetAddress}`;
  await context.db
    .insert(position)
    .values({
      id: positionId,
      accountId,
      assetAddress: assetAddress,
    })
    .onConflictDoNothing();
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:Borrow", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.onBehalfOf;
  const assetAddress = event.args.reserve;

  // 1. Mark account as an active borrower
  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
      hasBorrowed: true,
    })
    .onConflictDoUpdate({
      hasBorrowed: true,
    });

  // 2. Mark this asset position as active debt
  const positionId = `${accountId}:${assetAddress}`;
  await context.db
    .insert(position)
    .values({
      id: positionId,
      accountId,
      assetAddress: assetAddress,
      isDebt: true,
    })
    .onConflictDoUpdate({
      isDebt: true,
    });
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:Repay", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.user;
  const assetAddress = event.args.reserve;

  // 1. Ensure parent account exists
  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
    })
    .onConflictDoNothing();

  // 2. Ensure position entry exists
  const positionId = `${accountId}:${assetAddress}`;
  await context.db
    .insert(position)
    .values({
      id: positionId,
      accountId,
      assetAddress: assetAddress,
    })
    .onConflictDoNothing();
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:ReserveUsedAsCollateralEnabled", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.user;
  const assetAddress = event.args.reserve;

  // 1. Ensure parent account exists
  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
    })
    .onConflictDoNothing();

  // 2. Explicitly enable collateral
  const positionId = `${accountId}:${assetAddress}`;
  await context.db
    .insert(position)
    .values({
      id: positionId,
      accountId,
      assetAddress: assetAddress,
      isCollateral: true,
    })
    .onConflictDoUpdate({
      isCollateral: true,
    });
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:ReserveUsedAsCollateralDisabled", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.user;
  const assetAddress = event.args.reserve;

  // 1. Ensure parent account exists
  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
    })
    .onConflictDoNothing();

  // 2. Explicitly disable collateral
  const positionId = `${accountId}:${assetAddress}`;
  await context.db
    .insert(position)
    .values({
      id: positionId,
      accountId,
      assetAddress: assetAddress,
      isCollateral: false,
    })
    .onConflictDoUpdate({
      isCollateral: false,
    });
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:UserEModeSet", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.user;
  const categoryId = +event.args.categoryId;

  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
      eModeCategoryId: categoryId,
    })
    .onConflictDoUpdate({
      eModeCategoryId: categoryId,
    });
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:LiquidationCall", async ({ event, context }) => {
  const chainId = context.chain.id;
  const user = event.args.user;
  const collateralAsset = event.args.collateralAsset;
  const debtAsset = event.args.debtAsset;
  const txHash = event.transaction.hash;
  const logIndex = event.log.logIndex;

  // 1. Record historical liquidation execution
  const recordId = `${chainId}:${txHash}:${logIndex}`;
  await context.db.insert(liquidationRecord).values({
    id: recordId,
    chainId,
    protocol: PROTOCOL_AAVE_V3,
    txHash,
    logIndex,
    collateralAsset,
    debtAsset,
    userAddress: user,
    liquidatorAddress: event.args.liquidator,
    debtCoveredAmount: event.args.debtToCover,
    collateralLiquidatedAmount: event.args.liquidatedCollateralAmount,
    receiveAToken: event.args.receiveAToken,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });

  // 2. Ensure borrower account exists
  const accountId = `${chainId}:${PROTOCOL_AAVE_V3}:${user}`;
  await context.db
    .insert(account)
    .values({
      id: accountId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      userAddress: user,
    })
    .onConflictDoNothing();

  // 3. Ensure collateral position exist
  const collateralPositionId = `${accountId}:${collateralAsset}`;
  await context.db
    .insert(position)
    .values({
      id: collateralPositionId,
      accountId,
      assetAddress: collateralAsset,
    })
    .onConflictDoNothing();

  // 4. Ensure debt position exist
  const debtPositionId = `${accountId}:${debtAsset}`;
  await context.db
    .insert(position)
    .values({
      id: debtPositionId,
      accountId,
      assetAddress: debtAsset,
    })
    .onConflictDoNothing();
});

// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:ReserveDataUpdated", async ({ event, context }) => {
  const chainId = context.chain.id;
  const assetAddress = event.args.reserve;
  const liquidityIndex = event.args.liquidityIndex;
  const variableBorrowIndex = event.args.variableBorrowIndex;

  const indexId = `${chainId}:${PROTOCOL_AAVE_V3}:${assetAddress}`;
  await context.db
    .insert(reserveIndex)
    .values({
      id: indexId,
      chainId,
      protocol: PROTOCOL_AAVE_V3,
      assetAddress: assetAddress,
      liquidityIndex,
      variableBorrowIndex,
    })
    .onConflictDoUpdate({ liquidityIndex, variableBorrowIndex });
});
