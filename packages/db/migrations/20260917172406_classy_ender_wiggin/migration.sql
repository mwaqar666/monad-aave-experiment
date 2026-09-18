CREATE TABLE "emode_category_metadata" (
	"id" text PRIMARY KEY,
	"chainId" integer NOT NULL,
	"protocol" text NOT NULL,
	"categoryId" integer NOT NULL,
	"ltvBps" integer DEFAULT 0 NOT NULL,
	"liquidationThresholdBps" integer DEFAULT 0 NOT NULL,
	"liquidationBonusBps" integer DEFAULT 0 NOT NULL,
	"oracleAddress" text DEFAULT '0x0000000000000000000000000000000000000000' NOT NULL,
	"label" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_metadata" (
	"id" text PRIMARY KEY,
	"chainId" integer NOT NULL,
	"protocol" text NOT NULL,
	"marketId" text NOT NULL,
	"assetSymbol" text DEFAULT '' NOT NULL,
	"decimals" integer DEFAULT 18 NOT NULL,
	"oracleAddress" text DEFAULT '0x0000000000000000000000000000000000000000' NOT NULL,
	"liquidationThresholdBps" integer DEFAULT 0 NOT NULL,
	"liquidationBonusBps" integer DEFAULT 0 NOT NULL,
	"usageAsCollateralEnabled" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isFrozen" boolean DEFAULT false NOT NULL
);
