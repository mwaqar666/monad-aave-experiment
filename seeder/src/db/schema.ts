import { boolean, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";

/**
 * ─────────────────────────────────────────────────────────────
 * Table: account
 * Tracks distinct users per chain and protocol instance.
 * ─────────────────────────────────────────────────────────────
 */
export const account = pgTable("account", {
  id: text().primaryKey(), // Format: `${chainId}:${protocol}:${userAddress}`
  chainId: integer().notNull(),
  protocol: text().notNull(),
  userAddress: text().notNull(),
  hasBorrowed: boolean().notNull().default(false),
  eModeCategoryId: integer().notNull().default(0),
});

/**
 * ─────────────────────────────────────────────────────────────
 * Table: position
 * Specific asset exposure (collateral/debt) tied to an account.
 * ─────────────────────────────────────────────────────────────
 */
export const position = pgTable("position", {
  id: text().primaryKey(), // Format: `${accountId}:${marketId}`
  accountId: text().notNull(),
  marketId: text().notNull(),
  isCollateral: boolean().notNull().default(false),
  isDebt: boolean().notNull().default(false),
});

/**
 * ─────────────────────────────────────────────────────────────
 * Table: emode_category
 * Aave v3 E-Mode category configurations.
 * ─────────────────────────────────────────────────────────────
 */
export const emodeCategory = pgTable("emode_category", {
  id: text().primaryKey(), // Format: `${chainId}:${protocol}:${categoryId}`
  chainId: integer().notNull(),
  protocol: text().notNull(),
  categoryId: integer().notNull(),
  ltvBps: integer().notNull().default(0),
  liquidationThresholdBps: integer().notNull().default(0),
  liquidationBonusBps: integer().notNull().default(0),
  oracleAddress: text().notNull().default("0x0000000000000000000000000000000000000000"),
  label: text().notNull().default(""),
});

/**
 * ─────────────────────────────────────────────────────────────
 * Table: liquidation_record
 * Records all executed liquidations across monitored protocols.
 * ─────────────────────────────────────────────────────────────
 */
export const liquidationRecord = pgTable("liquidation_record", {
  id: text().primaryKey(), // Format: `${chainId}:${txHash}:${logIndex}`
  chainId: integer().notNull(),
  protocol: text().notNull(),
  txHash: text().notNull(),
  logIndex: integer().notNull(),
  collateralAsset: text().notNull(),
  debtAsset: text().notNull(),
  userAddress: text().notNull(),
  liquidatorAddress: text().notNull(),
  debtCoveredAmount: numeric({ mode: "bigint" }).notNull(),
  collateralLiquidatedAmount: numeric({ mode: "bigint" }).notNull(),
  receiveAToken: boolean().notNull(),
  blockNumber: numeric({ mode: "bigint" }).notNull(),
  timestamp: numeric({ mode: "bigint" }).notNull(),
});

/**
 * ─────────────────────────────────────────────────────────────
 * Table: market_reserve
 * Static configuration, risk parameters, and indexes per market.
 * ─────────────────────────────────────────────────────────────
 */
export const marketReserve = pgTable("market_reserve", {
  id: text().primaryKey(), // Format: `${chainId}:${protocol}:${marketId}`
  chainId: integer().notNull(),
  protocol: text().notNull(),
  marketId: text().notNull(), // Underlying token address
  assetSymbol: text().notNull().default(""),
  decimals: integer().notNull().default(18),
  oracleAddress: text().notNull().default("0x0000000000000000000000000000000000000000"),
  liquidationThresholdBps: integer().notNull().default(0),
  liquidationBonusBps: integer().notNull().default(0),
  liquidityIndex: numeric({ mode: "bigint" }).notNull().default(0n),
  variableBorrowIndex: numeric({ mode: "bigint" }).notNull().default(0n),
  usageAsCollateralEnabled: boolean().notNull().default(true),
  isActive: boolean().notNull().default(true),
  isFrozen: boolean().notNull().default(false),
});
