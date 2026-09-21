import { join } from "node:path";
import { rm } from "node:fs/promises";

import tsconfigJson from "../tsconfig.json";

// Clean the dist folder asynchronously
try {
  const TSCONFIG_BUILD_INFO = join(process.cwd(), "tsconfig.tsbuildinfo");
  const DIST_DIR = join(process.cwd(), tsconfigJson.compilerOptions.outDir);

  await rm(DIST_DIR, { recursive: true, force: true });
  await rm(TSCONFIG_BUILD_INFO, { force: true });
  console.log("✅ Dist folder cleaned successfully.");
} catch (error) {
  console.error("❌ Failed to clean dist folder:", error);
}
