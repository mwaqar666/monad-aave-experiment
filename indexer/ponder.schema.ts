// indexer/ponder.schema.ts
import { onchainTable, primaryKey } from "ponder";

export const account = onchainTable(
  "account",
  (t) => ({
    chainId: t.integer().notNull(),
    protocol: t.text().notNull(),
    userAddress: t.hex().notNull(),
    hasBorrowed: t.boolean().notNull().default(false),
    eModeCategoryId: t.integer().notNull().default(0),
    lastSeenBlock: t.bigint().notNull(),
  }),
  (table) => ({
    account_pk: primaryKey({
      name: "account_pk",
      columns: [table.chainId, table.protocol, table.userAddress],
    }),
  }),
);

export const position = onchainTable(
  "position",
  (t) => ({
    chainId: t.integer().notNull(),
    protocol: t.text().notNull(),
    userAddress: t.hex().notNull(),
    marketId: t.text().notNull(),
    isCollateral: t.boolean().notNull().default(false),
    isDebt: t.boolean().notNull().default(false),
    lastSeenBlock: t.bigint().notNull(),
  }),
  (table) => ({
    position_pk: primaryKey({
      name: "position_pk",
      columns: [table.chainId, table.protocol, table.userAddress, table.marketId],
    }),
  }),
);

export const marketReserve = onchainTable(
  "market_reserve",
  (t) => ({
    chainId: t.integer().notNull(),
    protocol: t.text().notNull(),
    marketId: t.text().notNull(),
    liquidityIndex: t.bigint().notNull().default(0n),
    variableBorrowIndex: t.bigint().notNull().default(0n),
    lastUpdateBlock: t.bigint().notNull(),
  }),
  (table) => ({
    market_reserve_pk: primaryKey({
      name: "market_reserve_pk",
      columns: [table.chainId, table.protocol, table.marketId],
    }),
  }),
);

export const liquidationRecord = onchainTable(
  "liquidation_record",
  (t) => ({
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
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    liquidation_record_pk: primaryKey({
      name: "liquidation_record_pk",
      columns: [table.chainId, table.txHash, table.logIndex],
    }),
  }),
);
