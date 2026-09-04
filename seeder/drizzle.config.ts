import { defineConfig } from "drizzle-kit";

const getEnvVar = (name: string, defaultVal?: string): string => {
  const value = process.env[name];

  if (!value && defaultVal) return defaultVal;

  if (!value) throw new Error(`Environment variable [${name}] is not set`);

  return value;
};

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getEnvVar("DATABASE_URL"),
  },
});
