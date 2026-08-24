// indexer/ponder.schema.ts
import { onchainTable } from "ponder";

/**
 * Accounts: Every unique user address that has ever interacted with Aave.
 * The Watcher uses this to know WHO to check for liquidations.
 */
export const account = onchainTable("account", (t) => ({
  id: t.hex().primaryKey(), // user address
  firstSeenBlock: t.bigint().notNull(),
  lastSeenBlock: t.bigint().notNull(),
  hasBorrowed: t.boolean().notNull().default(false),
  isActive: t.boolean().notNull().default(true),
}));

/**
 * Positions: Every user-asset pair that has ever existed.
 * Tracks whether the user has collateral and/or debt in this asset.
 */
export const position = onchainTable("position", (t) => ({
  id: t.text().primaryKey(), // user_address + "_" + asset_address
  user: t.hex().notNull(),
  asset: t.hex().notNull(),
  firstSeenBlock: t.bigint().notNull(),
  lastSeenBlock: t.bigint().notNull(),
  hasCollateral: t.boolean().notNull().default(false),
  hasDebt: t.boolean().notNull().default(false),
  isActive: t.boolean().notNull().default(true),
}));

/**
 * ReserveData: Tracks interest rate updates per asset.
 * Useful for analytics and understanding protocol state.
 */
export const reserveData = onchainTable("reserve_data", (t) => ({
  id: t.text().primaryKey(), // asset_address + "_" + block_number
  asset: t.hex().notNull(),
  liquidityRate: t.bigint().notNull(),
  variableBorrowRate: t.bigint().notNull(),
  liquidityIndex: t.bigint().notNull(),
  variableBorrowIndex: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

/**
 * LiquidationEvents: Records every liquidation that occurs.
 * Useful for PnL tracking and understanding market conditions.
 */
export const liquidationEvent = onchainTable("liquidation_event", (t) => ({
  id: t.text().primaryKey(), // tx_hash + "_" + log_index
  collateralAsset: t.hex().notNull(),
  debtAsset: t.hex().notNull(),
  user: t.hex().notNull(), // the liquidated user
  liquidator: t.hex().notNull(),
  debtToCover: t.bigint().notNull(),
  liquidatedCollateralAmount: t.bigint().notNull(),
  receiveAToken: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));
