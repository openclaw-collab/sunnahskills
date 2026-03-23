#!/usr/bin/env node
/**
 * Export graph data for browser use
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadGraph } from './grapplemap-loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const graph = loadGraph();

// Export minimal data for browser
const exportData = {
  nodes: graph.nodes.map(n => ({
    id: n.id,
    name: n.name,
    tags: n.tags,
    position: n.position,
    incoming: n.incoming,
    outgoing: n.outgoing
  })),
  edges: graph.edges.map(e => ({
    id: e.id,
    name: e.name,
    tags: e.tags,
    frames: e.frames,
    frameCount: e.frameCount,
    from: e.from,
    to: e.to
  }))
};

const outPath = join(ROOT, 'preview', 'src', 'graph-data.json');
writeFileSync(outPath, JSON.stringify(exportData, null, 2));

console.log(`Exported ${exportData.nodes.length} nodes and ${exportData.edges.length} edges to ${outPath}`);
console.log(`File size: ${(writeFileSync.length / 1024 / 1024).toFixed(2)} MB`);
