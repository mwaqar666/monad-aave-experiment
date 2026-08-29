// indexer/src/index.ts^
import { ponder } from "ponder:registry";
import { account, position, reserveData, liquidationEvent } from "ponder:schema";

// ─────────────────────────────────────────────────────────────
// EVENT: Supply
// Someone deposited collateral. Record the user and asset.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePoolV3:Supply", async ({ event, context }) => {
  const user = event.args.onBehalfOf;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await account.upsertAccount(context.db, user, blockNumber);
  await position.upsertPosition(context.db, user, asset, blockNumber, { hasCollateral: true });
});

// ─────────────────────────────────────────────────────────────
// EVENT: Withdraw
// Someone removed collateral. Record the activity.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePoolV3:Withdraw", async ({ event, context }) => {
  const user = event.args.user;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await account.upsertAccount(context.db, user, blockNumber);
  await position.upsertPosition(context.db, user, asset, blockNumber);
});

// ─────────────────────────────────────────────────────────────
// EVENT: Borrow
// Someone took out a loan. THIS IS CRITICAL.
// Mark them as a borrower — the Watcher will check their health factor.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePoolV3:Borrow", async ({ event, context }) => {
  const user = event.args.onBehalfOf;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await account.upsertAccount(context.db, user, blockNumber, { hasBorrowed: true });
  await position.upsertPosition(context.db, user, asset, blockNumber, { hasDebt: true });
});

// ─────────────────────────────────────────────────────────────
// EVENT: Repay
// Someone paid back debt. Record the activity.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePoolV3:Repay", async ({ event, context }) => {
  const user = event.args.user;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await account.upsertAccount(context.db, user, blockNumber);
  await position.upsertPosition(context.db, user, asset, blockNumber);
});

// ─────────────────────────────────────────────────────────────
// EVENT: LiquidationCall
// Someone got liquidated. Record everything for analytics.
// Also update the victim's position.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePoolV3:LiquidationCall", async ({ event, context }) => {
  const user = event.args.user;
  const collateralAsset = event.args.collateralAsset;
  const debtAsset = event.args.debtAsset;
  const blockNumber = event.block.number;

  // Record the liquidation event
  const liquidationEventId = `${event.transaction.hash}_${event.log.logIndex}`;
  await liquidationEvent.insertLiquidationEvent(context.db, liquidationEventId, {
    collateralAsset,
    debtAsset,
    user,
    liquidator: event.args.liquidator,
    debtToCover: event.args.debtToCover,
    liquidatedCollateralAmount: event.args.liquidatedCollateralAmount,
    receiveAToken: event.args.receiveAToken,
    blockNumber,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update the victim's account and positions
  await account.upsertAccount(context.db, user, blockNumber);
  await position.upsertPosition(context.db, user, collateralAsset, blockNumber);
  await position.upsertPosition(context.db, user, debtAsset, blockNumber);
});

// ─────────────────────────────────────────────────────────────
// EVENT: ReserveDataUpdated
// Interest rates changed. Track for analytics.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePoolV3:ReserveDataUpdated", async ({ event, context }) => {
  const reserveDataId = `${event.args.reserve}_${event.block.number}`;
  await reserveData.insertReserveData(context.db, reserveDataId, {
    asset: event.args.reserve,
    liquidityRate: event.args.liquidityRate,
    variableBorrowRate: event.args.variableBorrowRate,
    liquidityIndex: event.args.liquidityIndex,
    variableBorrowIndex: event.args.variableBorrowIndex,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });
});
