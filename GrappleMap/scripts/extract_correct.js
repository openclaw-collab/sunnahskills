#!/usr/bin/env node
// Correct extraction - data comes BEFORE description

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

const text = readFileSync(join(ROOT, 'GrappleMap.txt'), 'utf8');
const lines = text.split('\n');

// First pass: identify all positions and transitions
let inData = false;
let dataLines = [];
let currentDesc = [];

const positions = [];
const transitions = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isData = line.length > 0 && line[0] === ' ';

    if (isData) {
        dataLines.push(line);
        inData = true;
    } else {
        if (inData && dataLines.length > 0) {
            // End of data block - now check what we have
            const frameCount = Math.floor(dataLines.length / 4);
            const name = currentDesc.find(l =>
                !l.startsWith('tags:') &&
                !l.startsWith('properties:') &&
                !l.startsWith('ref:') &&
                !l.startsWith('http')
            )?.replace(/\n/g, ' ').trim() || '(unnamed)';

            if (frameCount === 1) {
                positions.push({
                    id: positions.length,
                    name,
                    data: dataLines.slice(0, 4),
                    line: i - dataLines.length
                });
            } else if (frameCount >= 2) {
                const frames = [];
                for (let j = 0; j < dataLines.length; j += 4) {
                    if (j + 4 <= dataLines.length) {
                        frames.push(dataLines.slice(j, j + 4));
                    }
                }
                transitions.push({
                    id: transitions.length,
                    name,
                    frames,
                    frameCount,
                    line: i - dataLines.length
                });
            }
            dataLines = [];
        }
        inData = false;
        if (line.trim()) currentDesc = [line];
    }
}

console.log(`Total positions: ${positions.length}`);
console.log(`Total transitions: ${transitions.length}\n`);

// Extract the specific sequence
const targets = [
    { type: 'position', id: 557 },
    { type: 'transition', id: 1383 },
    { type: 'position', id: 558 },
    { type: 'transition', id: 1387 },
    { type: 'position', id: 57 },
    { type: 'transition', id: 1207 },
    { type: 'position', id: 401 }
];

const extracted = [];
const markers = [];
let frameCount = 0;

for (const target of targets) {
    if (target.type === 'position') {
        const pos = positions[target.id];
        if (!pos) {
            console.error(`Position ${target.id} not found!`);
            continue;
        }
        console.log(`Position ${target.id}: "${pos.name}"`);

        markers.push({ name: pos.name, frame: frameCount, type: 'position' });

        const decoded = decodePosition(pos.data.join('\n'));
        extracted.push(decoded);
        frameCount++;
    } else {
        const trans = transitions[target.id];
        if (!trans) {
            console.error(`Transition ${target.id} not found!`);
            continue;
        }
        console.log(`Transition ${target.id}: "${trans.name}" (${trans.frameCount} frames)`);

        markers.push({ name: trans.name, frame: frameCount, type: 'transition' });

        for (const frame of trans.frames) {
            const decoded = decodePosition(frame.join('\n'));
            extracted.push(decoded);
            frameCount++;
        }
    }
}

const output = {
    meta: {
        extractedAt: new Date().toISOString(),
        totalFrames: extracted.length
    },
    markers,
    frames: extracted
};

const outPath = join(ROOT, 'preview', 'src', 'sequence.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWrote ${outPath}`);
console.log(`Total frames: ${extracted.length}`);
