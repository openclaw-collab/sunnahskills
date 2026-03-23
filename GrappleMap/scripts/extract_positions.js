#!/usr/bin/env node
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
            if (!lastWasData && desc.length > 0) {
                sequences.push({ desc: [...desc], frames: [] });
                if (dataLines.length > 0) {
                    sequences[sequences.length - 1].frames.push(decodePosition(dataLines.join('\n')));
                }
                desc = [];
                dataLines = [];
            }
            dataLines.push(line);
            if (dataLines.length === 4) {
                if (sequences.length === 0 || sequences[sequences.length - 1].frames.length > 0) {
                    sequences.push({ desc: [...desc], frames: [] });
                }
                sequences[sequences.length - 1].frames.push(decodePosition(dataLines.join('\n')));
                dataLines = [];
            }
            lastWasData = true;
        } else {
            if (lastWasData && dataLines.length > 0) {
                if (sequences.length === 0 || sequences[sequences.length - 1].frames.length > 0) {
                    sequences.push({ desc: [...desc], frames: [] });
                }
                sequences[sequences.length - 1].frames.push(decodePosition(dataLines.join('\n')));
                dataLines = [];
            }
            lastWasData = false;
            if (line.trim()) desc.push(line);
        }
    }

    // Categorize
    const positions = [];
    const transitions = [];

    for (let i = 0; i < sequences.length; i++) {
        const seq = sequences[i];
        const name = seq.desc.find(l => !l.startsWith('tags:') && !l.startsWith('properties:') && !l.startsWith('ref:'))?.replace(/\n/g, ' ').trim() || '(unnamed)';
        const tags = (seq.desc.find(l => l.startsWith('tags:')) || '').replace('tags:', '').trim().split(/\s+/).filter(Boolean);

        if (seq.frames.length === 1) {
            positions.push({ sequenceIndex: i, id: positions.length, name, tags, position: seq.frames[0] });
        } else if (seq.frames.length >= 2) {
            transitions.push({ sequenceIndex: i, id: transitions.length, name, tags, frames: seq.frames });
        }
    }

    return { positions, transitions, sequences };
}

const text = readFileSync(join(ROOT, 'GrappleMap.txt'), 'utf8');
const db = parseGrappleMap(text);

console.log(`Total sequences: ${db.sequences.length}`);
console.log(`Positions: ${db.positions.length}`);
console.log(`Transitions: ${db.transitions.length}`);
console.log('');

// Find positions by sequence index
const targetPositions = [57, 401];
const extracted = {};

for (const pos of db.positions) {
    if (targetPositions.includes(pos.sequenceIndex)) {
        extracted[pos.sequenceIndex] = {
            id: pos.id,
            sequenceIndex: pos.sequenceIndex,
            name: pos.name,
            tags: pos.tags,
            position: pos.position
        };
        console.log(`Position ${pos.sequenceIndex}: "${pos.name}"`);
    }
}

// Save
const outPath = join(ROOT, 'preview', 'src', 'positions.json');
writeFileSync(outPath, JSON.stringify(extracted, null, 2));
console.log(`\nSaved to ${outPath}`);
