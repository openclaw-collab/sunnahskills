#!/usr/bin/env node
// Extracts 6-8 BJJ technique sequences from GrappleMap data
// Outputs individual JSON files to client/public/data/techniques/{slug}.json
// Also rewrites client/public/data/scenes.json as a catalog manifest

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Base62 decode ────────────────────────────────────────────────────────────
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

// ── Parser ───────────────────────────────────────────────────────────────────
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
    if (frames.length > 0 && desc.length > 0) sequences.push({ desc, frames });

    const positions = [], transitions = [];
    for (const seq of sequences) {
        const name = seq.desc
            .find(l => !l.startsWith('tags:') && !l.startsWith('properties:') && !l.startsWith('ref:') && !l.startsWith('http'))
            ?.replace(/\\n/g, ' ').trim() || '(unnamed)';
        const tags = (seq.desc.find(l => l.startsWith('tags:')) || '')
            .replace('tags:', '').trim().split(/\s+/).filter(Boolean);
        const props = (seq.desc.find(l => l.startsWith('properties:')) || '')
            .replace('properties:', '').trim().split(/\s+/).filter(Boolean);
        if (seq.frames.length === 1) {
            positions.push({ id: positions.length, name, tags, props, position: seq.frames[0] });
        } else if (seq.frames.length >= 2) {
            transitions.push({ id: transitions.length, name, tags, props, frames: seq.frames, description: seq.desc });
        }
    }
    return { positions, transitions };
}

// ── Skeleton definition ──────────────────────────────────────────────────────
const JOINT_NAMES = [
    'LeftToe', 'RightToe', 'LeftHeel', 'RightHeel',
    'LeftAnkle', 'RightAnkle', 'LeftKnee', 'RightKnee',
    'LeftHip', 'RightHip', 'LeftShoulder', 'RightShoulder',
    'LeftElbow', 'RightElbow', 'LeftWrist', 'RightWrist',
    'LeftHand', 'RightHand', 'LeftFingers', 'RightFingers',
    'Core', 'Neck', 'Head'
];

const JOINT_RADII = [
    0.025, 0.025, 0.03, 0.03, 0.03, 0.03, 0.05, 0.05,
    0.09, 0.09, 0.08, 0.08, 0.045, 0.045, 0.02, 0.02,
    0.02, 0.02, 0.02, 0.02, 0.1, 0.05, 0.11
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

// ── Frame interpolation ──────────────────────────────────────────────────────
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

function padFrames(frames, { startHold = 0, endHold = 0 } = {}) {
    if (frames.length === 0) return frames;
    const first = frames[0];
    const last = frames[frames.length - 1];
    return [
        ...Array.from({ length: startHold }, () => first),
        ...frames,
        ...Array.from({ length: endHold }, () => last)
    ];
}

function slugifyLabel(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function uniqueList(values) {
    return [...new Set(values.filter(Boolean))];
}

// ── Technique catalog ────────────────────────────────────────────────────────
// Each entry: { slug, transitionId, displayName, tags, description, positionCategory, startingPosition, endingPosition, difficulty, curriculumStage, curriculumOrder, shouldEndWithTap }
const TECHNIQUES = [
    {
        slug: 'side-control-escape',
        transitionId: 22,
        displayName: 'Upa Escape from Mount',
        tags: ['escape', 'bottom', 'bridge', 'mount', 'upa'],
        description: [
            'Bridge and roll from mount.',
            'Trap the arm and leg, bridge explosively, and come up on top.'
        ],
        positionCategory: 'mount',
        startingPosition: 'Mount (Bottom)',
        endingPosition: 'Top Position',
        difficulty: 'beginner',
        curriculumStage: 'escapes',
        curriculumOrder: 10,
        shouldEndWithTap: false
    },
    {
        slug: 'half-guard-sweep',
        transitionId: 132,
        displayName: 'Cop Sweep from Half Guard',
        tags: ['half-guard', 'sweep', 'bottom', 'underhook'],
        description: [
            'Half guard sweep using a cop sweep.',
            'Underhook the leg, build angle, and roll to top position.'
        ],
        positionCategory: 'half-guard',
        startingPosition: 'Half Guard (Bottom)',
        endingPosition: 'Top Position',
        difficulty: 'beginner',
        curriculumStage: 'sweeps',
        curriculumOrder: 20,
        shouldEndWithTap: false
    },
    {
        slug: 'guard-pass-bullfighter',
        transitionId: 151,
        displayName: 'Bullfighter Pass',
        tags: ['guard-pass', 'passing', 'top', 'open_guard', 'toreando'],
        description: [
            'Bullfighter pass against open guard.',
            'Control both legs, redirect them, and step into side control.'
        ],
        positionCategory: 'open-guard',
        startingPosition: 'Open Guard',
        endingPosition: 'Side Control',
        difficulty: 'beginner',
        curriculumStage: 'passing',
        curriculumOrder: 30,
        shouldEndWithTap: false
    },
    {
        slug: 'guard-pass-leg-over',
        transitionId: 201,
        displayName: 'Leg-Over Pass',
        tags: ['guard-pass', 'passing', 'top', 'open_guard', 'stack'],
        description: [
            'Open-guard leg-over pass.',
            'Stack the hips, step over the legs, and settle into side control.'
        ],
        positionCategory: 'open-guard',
        startingPosition: 'Open Guard',
        endingPosition: 'Side Control',
        difficulty: 'intermediate',
        curriculumStage: 'passing',
        curriculumOrder: 31,
        shouldEndWithTap: false
    },
    {
        slug: 'back-take',
        transitionId: 254,
        displayName: 'Back Control Entry',
        tags: ['back', 'control', 'transition', 'arm_drag'],
        description: [
            'Back control entry from the top ride.',
            'Use the arm drag or seatbelt to take the back and secure hooks.'
        ],
        positionCategory: 'back-control',
        startingPosition: 'Top Ride',
        endingPosition: 'Back Control',
        difficulty: 'intermediate',
        curriculumStage: 'control',
        curriculumOrder: 40,
        shouldEndWithTap: false
    },
    {
        slug: 'armbar-from-guard',
        transitionId: 458,
        displayName: 'Armbar from Guard',
        tags: ['guard', 'submissions', 'armbar'],
        description: [
            'Closed-guard armbar.',
            'Break posture, pivot the hips, isolate the arm, and extend for the finish.'
        ],
        positionCategory: 'closed-guard',
        startingPosition: 'Closed Guard',
        endingPosition: 'Tap',
        difficulty: 'beginner',
        curriculumStage: 'submissions',
        curriculumOrder: 50,
        shouldEndWithTap: true
    },
    {
        slug: 'kimura-from-guard',
        transitionId: 432,
        displayName: 'Kimura from Guard',
        tags: ['guard', 'submissions', 'kimura'],
        description: [
            'Closed-guard kimura.',
            'Control the wrist, figure-four the arm, and rotate to the finish.'
        ],
        positionCategory: 'closed-guard',
        startingPosition: 'Closed Guard',
        endingPosition: 'Tap',
        difficulty: 'beginner',
        curriculumStage: 'submissions',
        curriculumOrder: 60,
        shouldEndWithTap: true
    },
    {
        slug: 'guillotine',
        transitionId: 358,
        displayName: 'Arm-In Guillotine',
        tags: ['guard', 'submissions', 'choke', 'front_headlock'],
        description: [
            'Arm-in guillotine from a front headlock or guard tie.',
            'Clamp the neck, finish the grip, and squeeze to tap.'
        ],
        positionCategory: 'closed-guard',
        startingPosition: 'Guard Front Headlock',
        endingPosition: 'Tap',
        difficulty: 'intermediate',
        curriculumStage: 'submissions',
        curriculumOrder: 70,
        shouldEndWithTap: true
    }
];

// ── Shared skeleton output ───────────────────────────────────────────────────
const SKELETON = {
    jointNames: JOINT_NAMES,
    jointRadii: JOINT_RADII,
    segments: SEGMENTS.filter(s => s[3]).map(s => ({
        from: s[0], to: s[1], radius: s[2],
        fromName: JOINT_NAMES[s[0]], toName: JOINT_NAMES[s[1]]
    }))
};

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('Reading GrappleMap.txt...');
const text = readFileSync(join(ROOT, 'GrappleMap', 'GrappleMap.txt'), 'utf8');

console.log('Parsing...');
const db = parseGrappleMap(text);
console.log(`  ${db.positions.length} positions, ${db.transitions.length} transitions`);

const outDir = join(ROOT, 'client', 'public', 'data', 'techniques');
mkdirSync(outDir, { recursive: true });
const adminLibraryDir = join(ROOT, 'client', 'public', 'data', 'library', 'admin');
const adminPositionsDir = join(adminLibraryDir, 'positions');
const adminTransitionsDir = join(adminLibraryDir, 'transitions');
mkdirSync(adminLibraryDir, { recursive: true });
mkdirSync(adminPositionsDir, { recursive: true });
mkdirSync(adminTransitionsDir, { recursive: true });

const scenesCatalog = { scenes: {} };
const errors = [];

for (const tech of TECHNIQUES) {
    const trans = db.transitions.find(t => t.id === tech.transitionId);
    if (!trans) {
        console.error(`  ERROR: Transition ${tech.transitionId} not found for "${tech.slug}"`);
        errors.push(tech.slug);
        continue;
    }

    console.log(`\nExtracting T${tech.transitionId}: "${trans.name}" -> ${tech.slug}`);
    console.log(`  Source frames: ${trans.frames.length}`);

    const isDetailed = trans.props.includes('detailed');
    const baseFrames = isDetailed ? trans.frames : doubleFrames(trans.frames);
    const frames = padFrames(baseFrames, {
        startHold: tech.shouldEndWithTap ? 4 : 2,
        endHold: tech.shouldEndWithTap ? 8 : 4
    });
    console.log(`  Output frames: ${frames.length} (${isDetailed ? 'detailed' : 'interpolated'} + held entry/finish beats)`);

    // Build markers: start position, transition, and a terminal position/tap marker.
    const transitionFrame = Math.min(frames.length - 2, tech.shouldEndWithTap ? 4 : 2);
    const markers = [
        { name: tech.startingPosition, frame: 0, type: 'position' },
        { name: tech.displayName, frame: transitionFrame, type: 'transition' },
        { name: tech.shouldEndWithTap ? 'Tap' : tech.endingPosition, frame: Math.max(1, frames.length - 1), type: 'position' }
    ];

    const techniqueData = {
        meta: {
            name: tech.displayName,
            slug: tech.slug,
            transitionId: tech.transitionId,
            extractedAt: new Date().toISOString(),
            tags: tech.tags,
            description: tech.description,
            totalFrames: frames.length,
            source: 'GrappleMap.txt',
            positionCategory: tech.positionCategory,
            startingPosition: tech.startingPosition,
            endingPosition: tech.endingPosition,
            difficulty: tech.difficulty,
            curriculumStage: tech.curriculumStage,
            curriculumOrder: tech.curriculumOrder,
            shouldEndWithTap: tech.shouldEndWithTap
        },
        skeleton: SKELETON,
        markers,
        frames
    };

    const outPath = join(outDir, `${tech.slug}.json`);
    writeFileSync(outPath, JSON.stringify(techniqueData, null, 2));
    const sizeKB = (readFileSync(outPath).length / 1024).toFixed(1);
    console.log(`  Wrote ${outPath} (${sizeKB} KB)`);

    // Add to scenes catalog
    scenesCatalog.scenes[tech.slug] = {
        meta: {
            name: tech.displayName,
            tags: tech.tags,
            description: tech.description,
            dataPath: `/data/techniques/${tech.slug}.json`,
            source: 'GrappleMap.txt',
            positionCategory: tech.positionCategory,
            startingPosition: tech.startingPosition,
            endingPosition: tech.endingPosition,
            difficulty: tech.difficulty,
            curriculumStage: tech.curriculumStage,
            curriculumOrder: tech.curriculumOrder,
            shouldEndWithTap: tech.shouldEndWithTap
        }
    };
}

// ── Write scenes.json catalog manifest ──────────────────────────────────────
const scenesPath = join(ROOT, 'client', 'public', 'data', 'scenes.json');

// Read existing scenes.json to preserve skeleton and legacy scenes data
let existingScenes = {};
try {
    existingScenes = JSON.parse(readFileSync(scenesPath, 'utf8'));
} catch (_) {
    // file may not exist or be malformed - start fresh
}

const newScenes = {
    meta: {
        updatedAt: new Date().toISOString(),
        source: 'GrappleMap.txt',
        techniqueCount: Object.keys(scenesCatalog.scenes).length
    },
    skeleton: SKELETON,
    // Preserve any existing legacy scenes data under a separate key
    ...(existingScenes.scenes && !existingScenes.scenes['armbar-from-guard']
        ? { legacyScenes: existingScenes.scenes }
        : {}),
    scenes: scenesCatalog.scenes
};

writeFileSync(scenesPath, JSON.stringify(newScenes, null, 2));
const scenesSizeKB = (readFileSync(scenesPath).length / 1024).toFixed(1);
console.log(`\nWrote scenes catalog: ${scenesPath} (${scenesSizeKB} KB)`);

if (errors.length > 0) {
    console.error(`\nFailed to extract: ${errors.join(', ')}`);
    process.exit(1);
} else {
    console.log(`\nDone. ${TECHNIQUES.length} techniques extracted successfully.`);
}

// ── Admin library catalogs ──────────────────────────────────────────────────
const adminPositions = db.positions.map((position) => {
    const id = `position-${position.id}`;
    const previewFrames = padFrames([position.position], { startHold: 3, endHold: 5 });
    const previewPath = `/data/library/admin/positions/${id}.json`;
    const item = {
        id,
        sourceId: position.id,
        libraryType: 'position',
        name: position.name,
        slug: slugifyLabel(position.name) || id,
        tags: uniqueList(position.tags),
        props: uniqueList(position.props),
        frameCount: previewFrames.length,
        previewPath,
    };

    writeFileSync(
        join(adminPositionsDir, `${id}.json`),
        JSON.stringify(
            {
                meta: item,
                markers: [{ name: position.name, frame: 0, type: 'position' }],
                frames: previewFrames,
            },
            null,
            2
        )
    );

    return item;
});

const adminTransitions = db.transitions.map((transition) => {
    const id = `transition-${transition.id}`;
    const previewFrames = padFrames(
        transition.props.includes('detailed') ? transition.frames : doubleFrames(transition.frames),
        { startHold: 2, endHold: 4 }
    );
    const previewPath = `/data/library/admin/transitions/${id}.json`;
    const item = {
        id,
        sourceId: transition.id,
        libraryType: 'transition',
        name: transition.name,
        slug: slugifyLabel(transition.name) || id,
        tags: uniqueList([...(transition.tags || []), ...(transition.props || [])]),
        props: uniqueList(transition.props || []),
        frameCount: previewFrames.length,
        previewPath,
    };

    writeFileSync(
        join(adminTransitionsDir, `${id}.json`),
        JSON.stringify(
            {
                meta: item,
                markers: [{ name: transition.name, frame: Math.min(2, previewFrames.length - 1), type: 'transition' }],
                frames: previewFrames,
            },
            null,
            2
        )
    );

    return item;
});

writeFileSync(
    join(adminLibraryDir, 'positions.json'),
    JSON.stringify(
        {
            meta: {
                extractedAt: new Date().toISOString(),
                source: 'GrappleMap.txt',
                itemCount: adminPositions.length,
            },
            positions: adminPositions,
        },
        null,
        2
    )
);

writeFileSync(
    join(adminLibraryDir, 'transitions.json'),
    JSON.stringify(
        {
            meta: {
                extractedAt: new Date().toISOString(),
                source: 'GrappleMap.txt',
                itemCount: adminTransitions.length,
            },
            transitions: adminTransitions,
        },
        null,
        2
    )
);

console.log(`Generated admin position catalog (${adminPositions.length}) and transition catalog (${adminTransitions.length}).`);
