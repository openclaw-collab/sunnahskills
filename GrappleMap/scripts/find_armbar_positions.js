#!/usr/bin/env node
import { readFileSync } from 'fs';
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
    let desc = [], dataLines = [], frames = [], lastWasData = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isData = line.length > 0 && line[0] === ' ';
        if (isData) {
            if (!lastWasData && desc.length > 0 && frames.length > 0) {
                sequences.push({ desc: [...desc], frames: [...frames] });
                frames = [];
            }
            dataLines.push(line);
            if (dataLines.length === 4) {
                frames.push(decodePosition(dataLines.join('\n')));
                dataLines = [];
            }
            lastWasData = true;
        } else {
            if (lastWasData && frames.length > 0) {
                sequences.push({ desc: [...desc], frames: [...frames] });
                desc = []; frames = []; dataLines = [];
            }
            lastWasData = false;
            if (line.trim()) desc.push(line);
        }
    }
    if (frames.length > 0 && desc.length > 0)
        sequences.push({ desc, frames });

    const positions = [], transitions = [];
    for (let i = 0; i < sequences.length; i++) {
        const seq = sequences[i];
        const name = seq.desc.find(l => !l.startsWith('tags:') && !l.startsWith('properties:') && !l.startsWith('ref:') && !l.startsWith('http'))?.replace(/\n/g, ' ').trim() || '(unnamed)';
        const tags = (seq.desc.find(l => l.startsWith('tags:')) || '').replace('tags:', '').trim().split(/\s+/).filter(Boolean);

        if (seq.frames.length === 1) {
            positions.push({ index: i, id: positions.length, name, tags, position: seq.frames[0] });
        } else if (seq.frames.length >= 2) {
            transitions.push({ index: i, id: transitions.length, name, tags, frames: seq.frames });
        }
    }
    return { positions, transitions, sequences };
}

const text = readFileSync(join(ROOT, 'GrappleMap.txt'), 'utf8');
const db = parseGrappleMap(text);

console.log(`Total positions: ${db.positions.length}`);
console.log(`Total transitions: ${db.transitions.length}`);
console.log('');

// Find armbar positions
console.log('=== ARMBAR POSITIONS ===');
db.positions.forEach(p => {
    if (p.name.toLowerCase().includes('armbar') || p.name.toLowerCase().includes('arm bar') || p.tags.includes('armbar')) {
        console.log(`Position ${p.index} (ID: ${p.id}): "${p.name}"`);
    }
});

console.log('');
console.log('=== LOOKING FOR POSITION 57 (sequence index) ===');
if (db.sequences[57]) {
    const seq = db.sequences[57];
    const name = seq.desc.find(l => !l.startsWith('tags:') && !l.startsWith('properties:'))?.replace(/\n/g, ' ').trim() || '(unnamed)';
    console.log(`Sequence 57: "${name}"`);
    console.log(`  Frames: ${seq.frames.length}`);
    console.log(`  Description: ${seq.desc}`);
}

console.log('');
console.log('=== LOOKING FOR POSITION 401 (sequence index) ===');
if (db.sequences[401]) {
    const seq = db.sequences[401];
    const name = seq.desc.find(l => !l.startsWith('tags:') && !l.startsWith('properties:'))?.replace(/\n/g, ' ').trim() || '(unnamed)';
    console.log(`Sequence 401: "${name}"`);
    console.log(`  Frames: ${seq.frames.length}`);
    console.log(`  Description: ${seq.desc}`);
}

// Search for tap positions
console.log('');
console.log('=== TAP POSITIONS ===');
db.positions.forEach(p => {
    if (p.name.toLowerCase().includes('tap')) {
        console.log(`Position ${p.index} (ID: ${p.id}): "${p.name}"`);
    }
});
