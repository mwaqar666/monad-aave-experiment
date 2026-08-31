import { onchainTable, primaryKey, relations } from "ponder";

/**
 * Account
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
 * Position
 */
export const position = onchainTable("position", (t) => ({
  id: t.text().primaryKey(), // Format: `${accountId}:${marketId}`
  accountId: t.text().notNull(),
  marketId: t.hex().notNull(),
  isCollateral: t.boolean().notNull().default(false),
  isDebt: t.boolean().notNull().default(false),
}));

/**
 * Foreign Key Relationships for Account and Position
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

/**
 * Liquidation Record
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

export const marketReserve = onchainTable("market_reserve", (t) => ({
  id: t.text().primaryKey(), // Format: `${chainId}:${protocol}:${marketId}`
  chainId: t.integer().notNull(),
  protocol: t.text().notNull(),
  marketId: t.hex().notNull(), // Underlying token address
  liquidityIndex: t.bigint().notNull().default(0n),
  variableBorrowIndex: t.bigint().notNull().default(0n),
}));
