import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "GrappleMap", "GrappleMap.txt");
const dst = join(root, "functions", "lib", "GrappleMap.txt");

if (!existsSync(src)) {
  console.warn("[copy-grapplemap-txt] GrappleMap/GrappleMap.txt not found — admin extract API will not bundle until you add it.");
  process.exit(0);
}

mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
const bytes = statSync(dst).size;
console.log(`[copy-grapplemap-txt] Copied GrappleMap.txt → functions/lib/GrappleMap.txt (${bytes} bytes)`);
