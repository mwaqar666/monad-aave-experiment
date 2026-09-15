import { defineConfig } from "drizzle-kit";

import { env } from "@packages/core";

export default defineConfig({
  out: "./drizzle",
  schema: "../packages/db/src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env("DATABASE_URL"),
  },
});
