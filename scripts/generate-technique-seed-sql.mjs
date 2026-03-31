/**
 * Reads db/seeds/techniques/*.json and writes db/.generated/seed_techniques.sql for D1.
 * Run: node scripts/generate-technique-seed-sql.mjs
 * Then: wrangler d1 execute DB --local --file=db/.generated/seed_techniques.sql
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedDir = join(root, "db", "seeds", "techniques");
const outDir = join(root, "db", ".generated");
const outFile = join(outDir, "seed_techniques.sql");

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

if (!existsSync(seedDir)) {
  console.error("Missing db/seeds/techniques — run from repo root.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const files = readdirSync(seedDir).filter((f) => f.endsWith(".json"));
let sql = `BEGIN TRANSACTION;\n`;

for (const file of files) {
  const raw = readFileSync(join(seedDir, file), "utf8");
  const data = JSON.parse(raw);
  const meta = data.meta ?? {};
  const slug = meta.slug ?? file.replace(/\.json$/i, "");
  const id = slug;
  const name = (meta.name ?? slug).trim();
  const positionCategory = (meta.positionCategory ?? "mixed").trim();
  const startingPosition = (meta.startingPosition ?? "").trim();
  const endingPosition = (meta.endingPosition ?? "").trim();
  const difficulty = meta.difficulty ?? "beginner";
  const description = Array.isArray(meta.description) ? meta.description : [];
  const metaSources = Array.isArray(meta.sources) ? [...meta.sources] : [];
  if (typeof meta.source === "string" && meta.source.trim() && !metaSources.includes(meta.source.trim())) {
    metaSources.unshift(meta.source.trim());
  }
  const extractSpec = Array.isArray(data.grapplemapExtractSpec) ? data.grapplemapExtractSpec : [];
  const sourcesPayload = [...metaSources];
  if (extractSpec.length > 0) {
    sourcesPayload.push({ grapplemapExtractSpec: extractSpec });
  }
  const markers = Array.isArray(data.markers) ? data.markers : [];
  const frames = Array.isArray(data.frames) ? data.frames : [];

  sql += `INSERT OR REPLACE INTO technique_sequences (
    id, slug, name, position_category, starting_position, ending_position,
    difficulty, description_json, markers_json, frames_json, sources_json,
    verified, created_at, updated_at
  ) VALUES (
    '${sqlEscape(id)}',
    '${sqlEscape(slug)}',
    '${sqlEscape(name)}',
    '${sqlEscape(positionCategory)}',
    '${sqlEscape(startingPosition)}',
    '${sqlEscape(endingPosition)}',
    '${sqlEscape(String(difficulty))}',
    '${sqlEscape(JSON.stringify(description))}',
    '${sqlEscape(JSON.stringify(markers))}',
    '${sqlEscape(JSON.stringify(frames))}',
    '${sqlEscape(JSON.stringify(sourcesPayload))}',
    1,
    datetime('now'),
    datetime('now')
  );\n`;
}

sql += `COMMIT;\n`;
writeFileSync(outFile, sql, "utf8");
console.log(`Wrote ${outFile} (${files.length} techniques)`);
