import { onchainTable, relations } from "ponder";

/**
 * ─────────────────────────────────────────────────────────────
 * Table: account
 * Tracks distinct users per chain and protocol instance.
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
 * ─────────────────────────────────────────────────────────────
 */
export const position = onchainTable("position", (t) => ({
  id: t.text().primaryKey(), // Format: `${accountId}:${marketId}`
  accountId: t.text().notNull(),
  marketId: t.hex().notNull(),
  isCollateral: t.boolean().notNull().default(false),
  isDebt: t.boolean().notNull().default(false),
}));

/**
 * ─────────────────────────────────────────────────────────────
 * Table: emode_category
 * Aave v3 E-Mode category configurations.
 * ─────────────────────────────────────────────────────────────
 */
export const emodeCategory = onchainTable("emode_category", (t) => ({
  id: t.text().primaryKey(), // Format: `${chainId}:${protocol}:${categoryId}`
  chainId: t.integer().notNull(),
  protocol: t.text().notNull(),
  categoryId: t.integer().notNull(),
  ltvBps: t.integer().notNull().default(0),
  liquidationThresholdBps: t.integer().notNull().default(0),
  liquidationBonusBps: t.integer().notNull().default(0),
  oracleAddress: t.hex().notNull().default("0x0000000000000000000000000000000000000000"),
  label: t.text().notNull().default(""),
}));

/**
 * ─────────────────────────────────────────────────────────────
 * Table: liquidation_record
 * Records all executed liquidations across monitored protocols.
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
 * Table: market_reserve
 * Static configuration, risk parameters, and indexes per market.
 * ─────────────────────────────────────────────────────────────
 */
export const marketReserve = onchainTable("market_reserve", (t) => ({
  id: t.text().primaryKey(), // Format: `${chainId}:${protocol}:${marketId}`
  chainId: t.integer().notNull(),
  protocol: t.text().notNull(),
  marketId: t.hex().notNull(), // Underlying token address
  assetSymbol: t.text().notNull().default(""),
  decimals: t.integer().notNull().default(18),
  oracleAddress: t.hex().notNull().default("0x0000000000000000000000000000000000000000"),
  liquidationThresholdBps: t.integer().notNull().default(0),
  liquidationBonusBps: t.integer().notNull().default(0),
  liquidityIndex: t.bigint().notNull().default(0n),
  variableBorrowIndex: t.bigint().notNull().default(0n),
  usageAsCollateralEnabled: t.boolean().notNull().default(true),
  isActive: t.boolean().notNull().default(true),
  isFrozen: t.boolean().notNull().default(false),
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
