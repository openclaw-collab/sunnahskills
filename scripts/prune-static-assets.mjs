import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

if (process.env.KEEP_FULL_PUBLIC_BUILD === "1") {
  console.log("Keeping full public asset build because KEEP_FULL_PUBLIC_BUILD=1.");
  process.exit(0);
}

const pruneTargets = [
  resolve(root, "dist", "AGENTS.md"),
  resolve(root, "dist", "data", "AGENTS.md"),
  resolve(root, "dist", "data", "library", "admin"),
];

for (const target of pruneTargets) {
  if (!existsSync(target)) continue;
  rmSync(target, { recursive: true, force: true });
  console.log(`Pruned ${target.replace(`${root}/`, "")}`);
}
