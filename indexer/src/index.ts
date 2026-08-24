// indexer/src/index.ts
import { ponder } from "ponder:registry";
import { account, position, reserveData, liquidationEvent } from "ponder:schema";

// ─────────────────────────────────────────────────────────────
// HELPER: Upsert an account (user address)
// ─────────────────────────────────────────────────────────────
async function upsertAccount(db: any, user: `0x${string}`, blockNumber: bigint, updates: { hasBorrowed?: boolean; isActive?: boolean } = {}) {
  const existing = await db.select().from(account).where(eq(account.id, user)).limit(1);

  if (existing.length > 0) {
    await db
      .update(account)
      .set({
        lastSeenBlock: blockNumber,
        ...(updates.hasBorrowed !== undefined ? { hasBorrowed: updates.hasBorrowed || existing[0].hasBorrowed } : {}),
        ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
      })
      .where(eq(account.id, user));
  } else {
    await db.insert(account).values({
      id: user,
      firstSeenBlock: blockNumber,
      lastSeenBlock: blockNumber,
      hasBorrowed: updates.hasBorrowed ?? false,
      isActive: updates.isActive ?? true,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER: Upsert a position (user + asset pair)
// ─────────────────────────────────────────────────────────────
async function upsertPosition(db: any, user: `0x${string}`, asset: `0x${string}`, blockNumber: bigint, updates: { hasCollateral?: boolean; hasDebt?: boolean; isActive?: boolean } = {}) {
  const positionId = `${user}_${asset}`;
  const existing = await db.select().from(position).where(eq(position.id, positionId)).limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    await db
      .update(position)
      .set({
        lastSeenBlock: blockNumber,
        hasCollateral: updates.hasCollateral ?? current.hasCollateral,
        hasDebt: updates.hasDebt ?? current.hasDebt,
        isActive: updates.isActive ?? current.isActive,
      })
      .where(eq(position.id, positionId));
  } else {
    await db.insert(position).values({
      id: positionId,
      user,
      asset,
      firstSeenBlock: blockNumber,
      lastSeenBlock: blockNumber,
      hasCollateral: updates.hasCollateral ?? false,
      hasDebt: updates.hasDebt ?? false,
      isActive: updates.isActive ?? true,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// EVENT: Supply
// Someone deposited collateral. Record the user and asset.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePoolV3:Supply", async ({ event, context }) => {
  const user = event.args.onBehalfOf;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await upsertAccount(context.db, user, blockNumber);
  await upsertPosition(context.db, user, asset, blockNumber, { hasCollateral: true });
});

// ─────────────────────────────────────────────────────────────
// EVENT: Withdraw
// Someone removed collateral. Record the activity.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:Withdraw", async ({ event, context }) => {
  const user = event.args.user;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await upsertAccount(context.db, user, blockNumber);
  await upsertPosition(context.db, user, asset, blockNumber);
});

// ─────────────────────────────────────────────────────────────
// EVENT: Borrow
// Someone took out a loan. THIS IS CRITICAL.
// Mark them as a borrower — the Watcher will check their health factor.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:Borrow", async ({ event, context }) => {
  const user = event.args.onBehalfOf;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await upsertAccount(context.db, user, blockNumber, { hasBorrowed: true });
  await upsertPosition(context.db, user, asset, blockNumber, { hasDebt: true });
});

// ─────────────────────────────────────────────────────────────
// EVENT: Repay
// Someone paid back debt. Record the activity.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:Repay", async ({ event, context }) => {
  const user = event.args.user;
  const asset = event.args.reserve;
  const blockNumber = event.block.number;

  await upsertAccount(context.db, user, blockNumber);
  await upsertPosition(context.db, user, asset, blockNumber);
});

// ─────────────────────────────────────────────────────────────
// EVENT: LiquidationCall
// Someone got liquidated. Record everything for analytics.
// Also update the victim's position.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:LiquidationCall", async ({ event, context }) => {
  const user = event.args.user;
  const collateralAsset = event.args.collateralAsset;
  const debtAsset = event.args.debtAsset;
  const blockNumber = event.block.number;

  // Record the liquidation event
  await context.db.insert(liquidationEvent).values({
    id: `${event.transaction.hash}_${event.log.logIndex}`,
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
  await upsertAccount(context.db, user, blockNumber);
  await upsertPosition(context.db, user, collateralAsset, blockNumber);
  await upsertPosition(context.db, user, debtAsset, blockNumber);
});

// ─────────────────────────────────────────────────────────────
// EVENT: ReserveDataUpdated
// Interest rates changed. Track for analytics.
// ─────────────────────────────────────────────────────────────
ponder.on("AavePool:ReserveDataUpdated", async ({ event, context }) => {
  await context.db.insert(reserveData).values({
    id: `${event.args.reserve}_${event.block.number}`,
    asset: event.args.reserve,
    liquidityRate: event.args.liquidityRate,
    variableBorrowRate: event.args.variableBorrowRate,
    liquidityIndex: event.args.liquidityIndex,
    variableBorrowIndex: event.args.variableBorrowIndex,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });
});
