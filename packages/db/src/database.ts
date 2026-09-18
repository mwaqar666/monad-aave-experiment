import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";

import { env } from "@packages/core";

const client = new SQL(env("DATABASE_URL"));
const __database = drizzle({ client });
const __databaseWithLogging = drizzle({ client, logger: true });

export function database() {
  return __database;
}

export namespace database {
  export function withLogging() {
    return __databaseWithLogging;
  }
}
