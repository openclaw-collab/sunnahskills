#!/usr/bin/env node
// Extracts multiple transitions from GrappleMap.txt

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
    for (const seq of sequences) {
        const name = seq.desc.find(l => !l.startsWith('tags:') && !l.startsWith('properties:') && !l.startsWith('ref:') && !l.startsWith('http'))?.replace(/\\n/g, ' ').trim() || '(unnamed)';
        const tags = (seq.desc.find(l => l.startsWith('tags:')) || '').replace('tags:', '').trim().split(/\s+/).filter(Boolean);
        const props = (seq.desc.find(l => l.startsWith('properties:')) || '').replace('properties:', '').trim().split(/\s+/).filter(Boolean);
        if (seq.frames.length === 1) {
            positions.push({ id: positions.length, name, tags, props, position: seq.frames[0] });
        } else if (seq.frames.length >= 2) {
            transitions.push({ id: transitions.length, name, tags, props, frames: seq.frames, description: seq.desc });
        }
    }
    return { positions, transitions };
}

const JOINT_NAMES = [
    'LeftToe', 'RightToe', 'LeftHeel', 'RightHeel',
    'LeftAnkle', 'RightAnkle', 'LeftKnee', 'RightKnee',
    'LeftHip', 'RightHip', 'LeftShoulder', 'RightShoulder',
    'LeftElbow', 'RightElbow', 'LeftWrist', 'RightWrist',
    'LeftHand', 'RightHand', 'LeftFingers', 'RightFingers',
    'Core', 'Neck', 'Head'
];

const SEGMENTS = [
    [0, 2, 0.025, true], [0, 4, 0.025, true], [2, 4, 0.025, true],
    [4, 6, 0.055, true], [6, 8, 0.085, true], [8, 20, 0.1, true],
    [20, 10, 0.075, true], [10, 12, 0.06, true], [12, 14, 0.03, true],
    [14, 16, 0.02, true], [16, 18, 0.02, true], [14, 18, 0.02, false],
    [1, 3, 0.025, true], [1, 5, 0.025, true], [3, 5, 0.025, true],
    [5, 7, 0.055, true], [7, 9, 0.085, true], [9, 20, 0.1, true],
    [20, 11, 0.075, true], [11, 13, 0.06, true], [13, 15, 0.03, true],
    [15, 17, 0.02, true], [17, 19, 0.02, true], [15, 19, 0.02, false],
    [8, 9, 0.1, false], [10, 21, 0.065, true], [11, 21, 0.065, true],
    [21, 22, 0.05, true]
];

const JOINT_RADII = [
    0.025, 0.025, 0.03, 0.03, 0.03, 0.03, 0.05, 0.05,
    0.09, 0.09, 0.08, 0.08, 0.045, 0.045, 0.02, 0.02,
    0.02, 0.02, 0.02, 0.02, 0.1, 0.05, 0.11
];

function lerpFrame(a, b, t) {
    return a.map((player, pl) =>
        player.map((joint, j) => [
            +(joint[0] * (1 - t) + b[pl][j][0] * t).toFixed(6),
            +(joint[1] * (1 - t) + b[pl][j][1] * t).toFixed(6),
            +(joint[2] * (1 - t) + b[pl][j][2] * t).toFixed(6),
        ])
    );
}

function doubleFrames(frames) {
    if (frames.length <= 1) return frames;
    const r = [frames[0]];
    for (let i = 1; i < frames.length; i++) {
        r.push(lerpFrame(frames[i - 1], frames[i], 0.5));
        r.push(frames[i]);
    }
    return r;
}

// Transitions to extract (detailed only, no doubling)
const TRANSITION_IDS = [1383, 1387, 1207];

console.log('Reading GrappleMap.txt...');
const text = readFileSync(join(ROOT, 'GrappleMap.txt'), 'utf8');

console.log('Parsing...');
const db = parseGrappleMap(text);
console.log(`  ${db.positions.length} positions, ${db.transitions.length} transitions`);

const scenes = {};

for (const id of TRANSITION_IDS) {
    const trans = db.transitions.find(t => t.id === id);
    if (!trans) {
        console.error(`Transition ${id} not found!`);
        continue;
    }

    console.log(`\nTransition ${id}: "${trans.name}"`);
    console.log(`  Tags: ${trans.tags.join(', ')}`);
    console.log(`  Raw frames: ${trans.frames.length}`);

    const isDetailed = trans.props.includes('detailed');
    const frames = isDetailed ? trans.frames : doubleFrames(trans.frames);
    console.log(`  Output frames: ${frames.length} (${isDetailed ? 'detailed' : 'doubled'})`);

    scenes[id] = {
        meta: {
            transitionId: id,
            name: trans.name,
            tags: trans.tags,
            rawFrameCount: trans.frames.length,
            outputFrameCount: frames.length,
            doubled: !isDetailed,
            playersPerFrame: 2,
            jointsPerPlayer: 23,
            description: trans.description
        },
        frames: frames
    };
}

// Build combined output with shared skeleton
const output = {
    meta: {
        extractedAt: new Date().toISOString(),
        transitions: TRANSITION_IDS,
        source: 'GrappleMap.txt'
    },
    skeleton: {
        jointNames: JOINT_NAMES,
        jointRadii: JOINT_RADII,
        segments: SEGMENTS.filter(s => s[3]).map(s => ({
            from: s[0], to: s[1], radius: s[2],
            fromName: JOINT_NAMES[s[0]], toName: JOINT_NAMES[s[1]]
        })),
    },
    scenes: scenes
};

const outPath = join(ROOT, 'preview', 'src', 'scenes.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWrote ${outPath}`);
console.log(`  File size: ${(readFileSync(outPath).length / 1024).toFixed(1)} KB`);
