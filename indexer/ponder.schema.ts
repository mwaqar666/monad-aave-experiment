// indexer/ponder.schema.ts
import { onchainTable } from "ponder";
import { Context } from "ponder:registry";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { AbiTypeToPrimitiveType } from "abitype";
import { Nullable } from "@types";

/**
 * Accounts: Every unique user address that has ever interacted with Aave.
 * The Watcher uses this to know WHO to check for liquidations.
 */

export const AccountSchema = onchainTable("account", (t) => ({
  id: t.hex().primaryKey(), // user address
  firstSeenBlock: t.bigint().notNull(),
  lastSeenBlock: t.bigint().notNull(),
  hasBorrowed: t.boolean().notNull().default(false),
  isActive: t.boolean().notNull().default(true),
}));

class Account {
  public findAccount(db: Context["db"], id: AbiTypeToPrimitiveType<"address">): Promise<Nullable<AccountType>> {
    return db.find(AccountSchema, { id });
  }

  public insertAccount(db: Context["db"], id: AbiTypeToPrimitiveType<"address">, account: AccountTypeInsert): Promise<AccountType> {
    return db.insert(AccountSchema).values({ id, ...account });
  }

  public updateAccount(db: Context["db"], id: AbiTypeToPrimitiveType<"address">, updates: AccountTypeUpdate): Promise<AccountType> {
    return db.update(AccountSchema, { id }).set(updates);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER: Upsert an account (user address)
  // ─────────────────────────────────────────────────────────────
  public async upsertAccount(db: Context["db"], user: AbiTypeToPrimitiveType<"address">, blockNumber: bigint, updates?: Pick<AccountTypeInsert, "hasBorrowed" | "isActive">): Promise<AccountType> {
    const existing = await this.findAccount(db, user);

    if (existing) {
      return this.updateAccount(db, user, {
        lastSeenBlock: blockNumber,
        ...updates,
      });
    }

    return this.insertAccount(db, user, {
      firstSeenBlock: blockNumber,
      lastSeenBlock: blockNumber,
      ...updates,
    });
  }
}

export const account = new Account();
export type AccountType = InferSelectModel<typeof AccountSchema>;
export type AccountTypeInsert = Omit<InferInsertModel<typeof AccountSchema>, "id">;
export type AccountTypeUpdate = Partial<AccountTypeInsert>;

/**
 * Positions: Every user-asset pair that has ever existed.
 * Tracks whether the user has collateral and/or debt in this asset.
 */

export const PositionSchema = onchainTable("position", (t) => ({
  id: t.text().primaryKey(), // user_address + "_" + asset_address
  user: t.hex().notNull(),
  asset: t.hex().notNull(),
  firstSeenBlock: t.bigint().notNull(),
  lastSeenBlock: t.bigint().notNull(),
  hasCollateral: t.boolean().notNull().default(false),
  hasDebt: t.boolean().notNull().default(false),
  isActive: t.boolean().notNull().default(true),
}));

class Position {
  public findPosition(db: Context["db"], id: string): Promise<Nullable<PositionType>> {
    return db.find(PositionSchema, { id });
  }

  public insertPosition(db: Context["db"], id: string, position: PositionTypeInsert): Promise<PositionType> {
    return db.insert(PositionSchema).values({ id, ...position });
  }

  public updatePosition(db: Context["db"], id: string, updates: PositionTypeUpdate): Promise<PositionType> {
    return db.update(PositionSchema, { id }).set(updates);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER: Upsert a position (user + asset pair)
  // ─────────────────────────────────────────────────────────────
  public async upsertPosition(db: Context["db"], user: AbiTypeToPrimitiveType<"address">, asset: AbiTypeToPrimitiveType<"address">, blockNumber: bigint, updates?: Pick<PositionTypeInsert, "hasCollateral" | "hasDebt" | "isActive">): Promise<PositionType> {
    const positionId = `${user}_${asset}`;
    const existing = await this.findPosition(db, positionId);

    if (existing) {
      return this.updatePosition(db, positionId, {
        lastSeenBlock: blockNumber,
        ...updates,
      });
    }

    return this.insertPosition(db, positionId, {
      user,
      asset,
      firstSeenBlock: blockNumber,
      lastSeenBlock: blockNumber,
      ...updates,
    });
  }
}

export const position = new Position();
export type PositionType = InferSelectModel<typeof PositionSchema>;
export type PositionTypeInsert = Omit<InferInsertModel<typeof PositionSchema>, "id">;
export type PositionTypeUpdate = Partial<PositionTypeInsert>;

/**
 * ReserveData: Tracks interest rate updates per asset.
 * Useful for analytics and understanding protocol state.
 */

export const ReserveDataSchema = onchainTable("reserve_data", (t) => ({
  id: t.text().primaryKey(), // asset_address + "_" + block_number
  asset: t.hex().notNull(),
  liquidityRate: t.bigint().notNull(),
  variableBorrowRate: t.bigint().notNull(),
  liquidityIndex: t.bigint().notNull(),
  variableBorrowIndex: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export class ReserveData {
  public findReserveData(db: Context["db"], id: string): Promise<Nullable<ReserveDataType>> {
    return db.find(ReserveDataSchema, { id });
  }

  public insertReserveData(db: Context["db"], id: string, reserveData: ReserveDataTypeInsert): Promise<ReserveDataType> {
    return db.insert(ReserveDataSchema).values({ id, ...reserveData });
  }

  public updateReserveData(db: Context["db"], id: string, updates: ReserveDataTypeUpdate): Promise<ReserveDataType> {
    return db.update(ReserveDataSchema, { id }).set(updates);
  }
}

export const reserveData = new ReserveData();
export type ReserveDataType = InferSelectModel<typeof ReserveDataSchema>;
export type ReserveDataTypeInsert = Omit<InferInsertModel<typeof ReserveDataSchema>, "id">;
export type ReserveDataTypeUpdate = Partial<ReserveDataTypeInsert>;

/**
 * LiquidationEvents: Records every liquidation that occurs.
 * Useful for PnL tracking and understanding market conditions.
 */

export const LiquidationEventSchema = onchainTable("liquidation_event", (t) => ({
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

class LiquidationEvent {
  public findLiquidationEvent(db: Context["db"], id: string): Promise<Nullable<LiquidationEventType>> {
    return db.find(LiquidationEventSchema, { id });
  }

  public insertLiquidationEvent(db: Context["db"], id: string, liquidationEvent: LiquidationEventTypeInsert): Promise<LiquidationEventType> {
    return db.insert(LiquidationEventSchema).values({ id, ...liquidationEvent });
  }

  public updateLiquidationEvent(db: Context["db"], id: string, updates: LiquidationEventTypeUpdate): Promise<LiquidationEventType> {
    return db.update(LiquidationEventSchema, { id }).set(updates);
  }
}

export const liquidationEvent = new LiquidationEvent();
export type LiquidationEventType = InferSelectModel<typeof LiquidationEventSchema>;
export type LiquidationEventTypeInsert = Omit<InferInsertModel<typeof LiquidationEventSchema>, "id">;
export type LiquidationEventTypeUpdate = Partial<LiquidationEventTypeInsert>;
