#!/usr/bin/env node
/**
 * Extract sequence from GrappleMap database using graph navigation
 * Usage: node extract-sequence.js [sequence-spec]
 *
 * Sequence spec format:
 *   p557,t1383,p558,t1387,p57,t1207,p401
 *
 * Or use predefined sequences:
 *   uchimata    - Classic uchi-mata sequence
 *   armbar      - Arm bar from guard
 *   random      - Random path through graph
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadGraph } from './grapplemap-loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const graph = loadGraph();

console.log(`Loaded: ${graph.nodes.length} positions, ${graph.edges.length} transitions\n`);

// Predefined sequences
const SEQUENCES = {
    uchimata: [
        { type: 'position', id: 557 },
        { type: 'transition', id: 1383 },
        { type: 'position', id: 558 },
        { type: 'transition', id: 1387 },
        { type: 'position', id: 57 },
        { type: 'transition', id: 1207 },
        { type: 'position', id: 401 }
    ],
    armbar: [
        { type: 'position', id: 25 },
        { type: 'transition', id: 54 },
        { type: 'position', id: 26 }
    ],
    triangle: [
        { type: 'position', id: 27 },
        { type: 'transition', id: 62 },
        { type: 'position', id: 28 }
    ],
    kimura: [
        { type: 'position', id: 22 },
        { type: 'transition', id: 47 },
        { type: 'position', id: 23 }
    ],
    rnc: [
        { type: 'position', id: 15 },
        { type: 'transition', id: 35 },
        { type: 'position', id: 16 }
    ]
};

function parseSpec(spec) {
    // Parse format like "p557,t1383,p558" or "position 557, transition 1383"
    const parts = spec.split(/[,:]/).map(s => s.trim().toLowerCase());
    const result = [];

    for (const part of parts) {
        const match = part.match(/^(p|position)?\s*(\d+)$/);
        if (match) {
            result.push({ type: 'position', id: parseInt(match[2]) });
            continue;
        }
        const tmatch = part.match(/^(t|transition)?\s*(\d+)$/);
        if (tmatch) {
            result.push({ type: 'transition', id: parseInt(tmatch[2]) });
            continue;
        }
    }

    return result;
}

function extractSequence(name, spec) {
    console.log(`Extracting sequence: ${name}`);

    const seq = graph.buildSequence(spec);

    if (seq.frames.length === 0) {
        console.error('No frames extracted!');
        return;
    }

    const output = {
        meta: {
            name,
            extractedAt: new Date().toISOString(),
            totalFrames: seq.frames.length,
            positions: spec.filter(s => s.type === 'position').length,
            transitions: spec.filter(s => s.type === 'transition').length
        },
        markers: seq.markers,
        frames: seq.frames
    };

    const outPath = join(ROOT, 'preview', 'src', 'sequence.json');
    writeFileSync(outPath, JSON.stringify(output, null, 2));

    console.log(`\nExtracted ${seq.frames.length} frames:`);
    for (const m of seq.markers) {
        console.log(`  [${m.frame.toString().padStart(2)}] ${m.type.padEnd(10)} "${m.name.substring(0, 40)}"`);
    }
    console.log(`\nWrote to: ${outPath}`);
}

// Main
const spec = process.argv[2] || 'uchimata';

if (spec === 'search') {
    const query = process.argv[3];
    if (!query) {
        console.error('Usage: node extract-sequence.js search <query>');
        process.exit(1);
    }
    const results = graph.findByName(query);
    console.log(`\nSearch results for "${query}":`);
    for (const r of results.slice(0, 20)) {
        const tags = r.tags?.slice(0, 3).join(', ') || '';
        console.log(`  ${r.type} ${r.id}: "${r.name.substring(0, 50)}" ${tags ? `[${tags}]` : ''}`);
    }
} else if (spec === 'tags') {
    const tag = process.argv[3];
    if (!tag) {
        console.error('Usage: node extract-sequence.js tags <tag>');
        process.exit(1);
    }
    const results = graph.findByTag(tag);
    console.log(`\nPositions/transitions with tag "${tag}":`);
    for (const r of results.slice(0, 20)) {
        console.log(`  ${r.type} ${r.id}: "${r.name.substring(0, 50)}"`);
    }
} else if (spec === 'list') {
    console.log('\nPredefined sequences:');
    for (const name of Object.keys(SEQUENCES)) {
        console.log(`  ${name}`);
    }
    console.log('\nUsage examples:');
    console.log('  node extract-sequence.js uchimata');
    console.log('  node extract-sequence.js search "arm bar"');
    console.log('  node extract-sequence.js tags standing');
    console.log('  node extract-sequence.js "p557,t1383,p558"');
} else if (SEQUENCES[spec]) {
    extractSequence(spec, SEQUENCES[spec]);
} else {
    // Try to parse as custom sequence (e.g., "p557,t1383,p558" or just "p557")
    const parsed = parseSpec(spec);
    if (parsed.length > 0) {
        extractSequence('custom', parsed);
    } else {
        console.error(`Unknown sequence: ${spec}`);
        console.log('Run "node extract-sequence.js list" for available sequences');
        process.exit(1);
    }
}
