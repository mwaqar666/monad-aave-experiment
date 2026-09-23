CREATE TABLE "asset_metadata" (
	"id" text PRIMARY KEY,
	"chainId" integer NOT NULL,
	"protocol" text NOT NULL,
	"assetAddress" text NOT NULL,
	"aTokenAddress" text NOT NULL,
	"variableDebtTokenAddress" text NOT NULL,
	"symbol" text DEFAULT '' NOT NULL,
	"decimals" integer DEFAULT 18 NOT NULL,
	"oracleAddress" text DEFAULT '0x0000000000000000000000000000000000000000' NOT NULL,
	"liquidationThresholdBps" integer DEFAULT 0 NOT NULL,
	"liquidationBonusBps" integer DEFAULT 0 NOT NULL,
	"usageAsCollateralEnabled" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"isFrozen" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
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
