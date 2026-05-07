#!/usr/bin/env node
/**
 * Vercel build pipeline with clear log sections so you can see which step failed.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

function run(stepLabel, command, args) {
  console.log("\n" + "=".repeat(64));
  console.log(` ${stepLabel}`);
  console.log("=".repeat(64) + "\n");

  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });

  const code = result.status ?? 1;
  if (code !== 0) {
    console.error(`\n❌ FAILED: ${stepLabel} — exit code ${code}`);
    console.error(
      "Open the log above this line for Prisma / Next.js errors.\n" +
        "Common fixes: set DATABASE_URL + DIRECT_URL (non-pooling) on Vercel; use Node 22.x.",
    );
    process.exit(code);
  }
}

run("1/3 — check-vercel-db.mjs", "node", ["scripts/check-vercel-db.mjs"]);
run("2/3 — prisma migrate deploy", "npx", ["prisma", "migrate", "deploy"]);
run("3/3 — next build", "npx", ["next", "build"]);

console.log("\n✅ All build steps finished successfully.\n");
