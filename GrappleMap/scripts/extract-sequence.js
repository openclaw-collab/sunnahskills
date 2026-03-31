#!/usr/bin/env node
/**
 * Extract sequence from GrappleMap database using flat p### / t### spec.
 * Usage: node extract-sequence.js [sequence-spec]
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { buildSequencePayload, parseSpec, SEQUENCES } from "./sequence-extractor.js";
import { loadGraph } from "./grapplemap-loader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_PATH = join(ROOT, "GrappleMap.txt");
const OUTPUT_PATH = join(ROOT, "preview", "src", "sequence.json");

const graph = loadGraph();
console.log(`Loaded: ${graph.nodes.length} positions, ${graph.edges.length} transitions\n`);

function extractSequence(name, spec) {
  console.log(`Extracting sequence: ${name}`);

  const text = readFileSync(DB_PATH, "utf8");
  const output = buildSequencePayload(name, text, spec);

  if (output.frames.length === 0) {
    console.error("No frames extracted!");
    return;
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\nExtracted ${output.frames.length} frames:`);
  for (const marker of output.markers) {
    console.log(`  [${marker.frame.toString().padStart(2)}] ${marker.type.padEnd(10)} "${marker.name.substring(0, 40)}"`);
  }
  console.log(`\nWrote to: ${OUTPUT_PATH}`);
}

const spec = process.argv[2] || "uchimata";

if (spec === "search") {
  const query = process.argv[3];
  if (!query) {
    console.error("Usage: node extract-sequence.js search <query>");
    process.exit(1);
  }
  const results = graph.findByName(query);
  console.log(`\nSearch results for "${query}":`);
  for (const result of results.slice(0, 20)) {
    const tags = result.tags?.slice(0, 3).join(", ") || "";
    console.log(`  ${result.type} ${result.id}: "${result.name.substring(0, 50)}" ${tags ? `[${tags}]` : ""}`);
  }
} else if (spec === "tags") {
  const tag = process.argv[3];
  if (!tag) {
    console.error("Usage: node extract-sequence.js tags <tag>");
    process.exit(1);
  }
  const results = graph.findByTag(tag);
  console.log(`\nPositions/transitions with tag "${tag}":`);
  for (const result of results.slice(0, 20)) {
    console.log(`  ${result.type} ${result.id}: "${result.name.substring(0, 50)}"`);
  }
} else if (spec === "list") {
  console.log("\nPredefined sequences:");
  for (const name of Object.keys(SEQUENCES)) {
    console.log(`  ${name}`);
  }
  console.log("\nUsage examples:");
  console.log("  node extract-sequence.js uchimata");
  console.log('  node extract-sequence.js search "arm bar"');
  console.log("  node extract-sequence.js tags standing");
  console.log('  node extract-sequence.js "p557,t1383,p558"');
} else if (SEQUENCES[spec]) {
  extractSequence(spec, SEQUENCES[spec]);
} else {
  const parsed = parseSpec(spec);
  if (parsed.length > 0) {
    extractSequence("custom", parsed);
  } else {
    console.error(`Unknown sequence: ${spec}`);
    console.log('Run "node extract-sequence.js list" for available sequences');
    process.exit(1);
  }
}
