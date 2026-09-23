import { onchainTable, relations } from "ponder";

/**
 * ─────────────────────────────────────────────────────────────
 * Table: account
 * Tracks distinct users per chain and protocol instance.
 * Owned by the indexer (populated from chain events).
 * ─────────────────────────────────────────────────────────────
 */
export const account = onchainTable("account", (t) => ({
  id: t.text().primaryKey(), // Format: `${chainId}:${protocol}:${userAddress}`
  chainId: t.integer().notNull(),
  protocol: t.text().notNull(),
  userAddress: t.hex().notNull(),
  hasBorrowed: t.boolean().notNull().default(false),
  eModeCategoryId: t.integer().notNull().default(0),
}));

/**
 * ─────────────────────────────────────────────────────────────
 * Table: position
 * Specific asset exposure (collateral/debt) tied to an account.
 * Owned by the indexer (populated from chain events).
 * ─────────────────────────────────────────────────────────────
 */
export const position = onchainTable("position", (t) => ({
  id: t.text().primaryKey(), // Format: `${accountId}:${assetAddress}`
  accountId: t.text().notNull(),
  assetAddress: t.hex().notNull(),
  isCollateral: t.boolean().notNull().default(false),
  isDebt: t.boolean().notNull().default(false),
}));

/**
 * ─────────────────────────────────────────────────────────────
 * Table: liquidation_record
 * Records all executed liquidations across monitored protocols.
 * Owned by the indexer (populated from LiquidationCall events).
 * ─────────────────────────────────────────────────────────────
 */
export const liquidationRecord = onchainTable("liquidation_record", (t) => ({
  id: t.text().primaryKey(), // Format: `${chainId}:${txHash}:${logIndex}`
  chainId: t.integer().notNull(),
  protocol: t.text().notNull(),
  txHash: t.hex().notNull(),
  logIndex: t.integer().notNull(),
  collateralAsset: t.hex().notNull(),
  debtAsset: t.hex().notNull(),
  userAddress: t.hex().notNull(),
  liquidatorAddress: t.hex().notNull(),
  debtCoveredAmount: t.bigint().notNull(),
  collateralLiquidatedAmount: t.bigint().notNull(),
  receiveAToken: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

/**
 * ─────────────────────────────────────────────────────────────
 * Table: reserve_index
 * Real-time liquidity/borrow indexes updated by ReserveDataUpdated events.
 * Owned by the indexer (separate from static market_metadata owned by seeder).
 * ─────────────────────────────────────────────────────────────
 */
export const reserveIndex = onchainTable("reserve_index", (t) => ({
  id: t.text().primaryKey(), // Format: `${chainId}:${protocol}:${assetAddress}`
  chainId: t.integer().notNull(),
  protocol: t.text().notNull(),
  assetAddress: t.hex().notNull(),
  liquidityIndex: t.bigint().notNull().default(0n),
  variableBorrowIndex: t.bigint().notNull().default(0n),
}));

/**
 * ─────────────────────────────────────────────────────────────
 * Table Relationships
 * ─────────────────────────────────────────────────────────────
 */
export const accountRelations = relations(account, ({ many }) => ({
  positions: many(position),
}));

export const positionRelations = relations(position, ({ one }) => ({
  account: one(account, {
    fields: [position.accountId],
    references: [account.id],
  }),
}));
