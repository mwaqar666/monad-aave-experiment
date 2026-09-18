import Bun from "bun";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import tsconfigJson from "./tsconfig.json";

const ENRTY_POINT = join(import.meta.dir, "src", "index.ts");
const DIST_DIR = join(import.meta.dir, tsconfigJson.compilerOptions.outDir);

// 1. Clean the old dist folder asynchronously using Bun's recommended API
try {
  await rm(DIST_DIR, { recursive: true, force: true });
} catch (error) {
  console.error("❌ Failed to clean dist folder:", error);
}

// 2. Build JavaScript with Bun's native bundler
const buildResult = await Bun.build({
  entrypoints: [ENRTY_POINT],
  outdir: DIST_DIR,
  target: "bun",
  format: "esm",
  splitting: true,
  splitRequire: true,
  packages: "external",
  metafile: true,
});

if (!buildResult.success) {
  console.error("❌ Bun Build failed!");
  for (const message of buildResult.logs) {
    console.error(message);
  }
  process.exit(1);
} else {
  if (buildResult.metafile) {
    // Analyze inputs
    console.log("\n");
    console.log(`${"Input Files".padEnd(50)} Size`);
    for (const [path, meta] of Object.entries(buildResult.metafile.inputs)) {
      console.log(`${path.padEnd(50, ".")} ${meta.bytes} bytes`);
    }

    // Analyze outputs
    console.log("\n");
    console.log(`${"Output Files".padEnd(50)} Size`);
    for (const [path, meta] of Object.entries(buildResult.metafile.outputs)) {
      console.log(`${path.padEnd(50, ".")} ${meta.bytes} bytes`);
    }

    // Save for external analysis tools
    await Bun.write("./dist/meta.json", JSON.stringify(buildResult.metafile));
  }
}

// 3. Generate Type Declarations with tsc using Bun's native subprocess runner
const tscProcess = Bun.spawn(["bun", "x", "tsc", "--build"], {
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await tscProcess.exited;

if (exitCode !== 0) {
  console.error("❌ TypeScript type generation failed!");
  process.exit(exitCode);
}

console.log("\n");
console.log("🎉 Build Complete! Dist directory at ./dist");
