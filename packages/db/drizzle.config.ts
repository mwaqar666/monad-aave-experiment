import { defineConfig } from "drizzle-kit";

import { env } from "@packages/core";

export default defineConfig({
  out: "./migrations",
  dialect: "postgresql",
  schema: "./src/schema.ts",
  driver: "pglite",
  dbCredentials: {
    url: env("DATABASE_URL", "postgresql://blockchain:blockchain@127.0.0.1:5432/blockchain"),
  },
  introspect: {
    casing: "camel",
  },
  verbose: true,
});
