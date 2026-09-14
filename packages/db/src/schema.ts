import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";

/**
 * ─────────────────────────────────────────────────────────────
 * Table: market_metadata
 * Static market config owned by the seeder.
 * Ponder does NOT declare this table — no conflict.
 * ─────────────────────────────────────────────────────────────
 */
export const marketMetadata = pgTable("market_metadata", {
  id: text().primaryKey(), // Format: `${chainId}:${protocol}:${marketId}`
  chainId: integer().notNull(),
  protocol: text().notNull(),
  marketId: text().notNull(), // Underlying token address
  assetSymbol: text().notNull().default(""),
  decimals: integer().notNull().default(18),
  oracleAddress: text().notNull().default("0x0000000000000000000000000000000000000000"),
  liquidationThresholdBps: integer().notNull().default(0),
  liquidationBonusBps: integer().notNull().default(0),
  usageAsCollateralEnabled: boolean().notNull().default(true),
  isActive: boolean().notNull().default(true),
  isFrozen: boolean().notNull().default(false),
});

/**
 * ─────────────────────────────────────────────────────────────
 * Table: emode_category_metadata
 * E-Mode category config owned by the seeder.
 * Ponder does NOT declare this table — no conflict.
 * ─────────────────────────────────────────────────────────────
 */
export const emodeCategoryMetadata = pgTable("emode_category_metadata", {
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
