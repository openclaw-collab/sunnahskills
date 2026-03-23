#!/usr/bin/env node
// Extracts specific positions and transitions for the cohesive sequence

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const B62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function fromBase62(c) {
    const i = B62.indexOf(c);
    if (i === -1) throw new Error('Bad base62 digit: ' + c);
    return i;
}

function decodePosition(chars) {
    let off = 0;
    function nextDigit() {
        while (off < chars.length && /\s/.test(chars[off])) off++;
        return fromBase62(chars[off++]);
    }
    function coord() {
        return (nextDigit() * 62 + nextDigit()) / 1000;
    }
    const pos = [[], []];
    for (let pl = 0; pl < 2; pl++) {
        for (let j = 0; j < 23; j++) {
            pos[pl].push([
                +(coord() - 2).toFixed(6),
                +coord().toFixed(6),
                +(coord() - 2).toFixed(6)
            ]);
        }
    }
    return pos;
}

function parseGrappleMap(text) {
    const lines = text.split('\n');
    const sequences = [];
    let desc = [], dataLines = [], lastWasData = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isData = line.length > 0 && line[0] === ' ';
        if (isData) {
            if (!lastWasData && desc.length > 0 && dataLines.length > 0) {
                sequences.push({ desc: [...desc], frames: [...dataLines] });
                dataLines = [];
            }
            dataLines.push(line);
            lastWasData = true;
        } else {
            if (lastWasData && dataLines.length > 0) {
                sequences.push({ desc: [...desc], frames: [...dataLines] });
                desc = []; dataLines = [];
            }
            lastWasData = false;
            if (line.trim()) desc.push(line);
        }
    }
    if (dataLines.length > 0 && desc.length > 0)
        sequences.push({ desc, frames: dataLines });

    return sequences;
}

function playerDistance(p1, p2) {
    let sum = 0;
    for (let i = 0; i < 23; i++) {
        sum += Math.pow(p1[i][0] - p2[i][0], 2);
        sum += Math.pow(p1[i][1] - p2[i][1], 2);
        sum += Math.pow(p1[i][2] - p2[i][2], 2);
    }
    return Math.sqrt(sum);
}

function fixPlayerSwaps(frames) {
    if (frames.length < 2) return frames;
    
    const fixed = frames.map(f => [f[0].map(j => [...j]), f[1].map(j => [...j])]);
    
    for (let i = 1; i < fixed.length; i++) {
        const prev = fixed[i - 1];
        const cur = fixed[i];
        
        const p0continuity = playerDistance(prev[0], cur[0]);
        const p1continuity = playerDistance(prev[1], cur[1]);
        const p0swapped = playerDistance(prev[0], cur[1]);
        const p1swapped = playerDistance(prev[1], cur[0]);
        
        const noSwapDist = p0continuity + p1continuity;
        const swapDist = p0swapped + p1swapped;
        
        // More aggressive: swap if it's ANY better
        if (swapDist < noSwapDist * 0.99) {
            const temp = cur[0];
            cur[0] = cur[1];
            cur[1] = temp;
        }
    }
    
    return fixed;
}

const text = readFileSync(join(ROOT, 'GrappleMap.txt'), 'utf8');
const sequences = parseGrappleMap(text);

console.log(`Total sequences: ${sequences.length}`);

// Target indices (0-based)
const TARGETS = [
    { type: 'position', index: 557, label: 'Position 557' },
    { type: 'transition', index: 1383, label: 'Transition 1383 (uchi-mata)' },
    { type: 'position', index: 558, label: 'Position 558' },
    { type: 'transition', index: 1387, label: 'Transition 1387 (arm bar)' },
    { type: 'position', index: 57, label: 'Position 57' },
    { type: 'transition', index: 1207, label: 'Transition 1207 (tap)' },
    { type: 'position', index: 401, label: 'Position 401' }
];

const extracted = [];

for (const target of TARGETS) {
    const seq = sequences[target.index];
    if (!seq) {
        console.error(`Missing: ${target.label}`);
        continue;
    }

    const name = seq.desc.find(l => !l.startsWith('tags:') && !l.startsWith('properties:') && !l.startsWith('ref:') && !l.startsWith('http'))?.replace(/\n/g, ' ').trim() || '(unnamed)';

    console.log(`${target.label}: "${name}" (${seq.frames.length / 4} frames)`);

    const decodedFrames = [];
    for (let i = 0; i < seq.frames.length; i += 4) {
        const chunk = seq.frames.slice(i, i + 4);
        if (chunk.length === 4) {
            decodedFrames.push(decodePosition(chunk.join('\n')));
        }
    }

    extracted.push({
        type: target.type,
        index: target.index,
        name,
        frames: decodedFrames
    });
}

// Build combined sequence
const combinedFrames = [];
const markers = [];
let frameCount = 0;

for (const item of extracted) {
    markers.push({
        name: item.name,
        frame: frameCount,
        type: item.type
    });

    for (const frame of item.frames) {
        combinedFrames.push(frame);
        frameCount++;
    }
}

// Fix player swaps
console.log('\nFixing player swaps...');
const fixedFrames = fixPlayerSwaps(combinedFrames);

const output = {
    meta: {
        extractedAt: new Date().toISOString(),
        items: TARGETS,
        totalFrames: fixedFrames.length,
        playerSwapsFixed: true
    },
    markers,
    frames: fixedFrames
};

const outPath = join(ROOT, 'preview', 'src', 'sequence.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWrote ${outPath}`);
console.log(`Total frames: ${fixedFrames.length}`);
