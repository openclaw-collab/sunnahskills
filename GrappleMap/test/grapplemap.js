// grapplemap.js — GrappleMap.txt parser + animation engine
// Faithfully ports the C++ decodePosition (persistence.cpp) and
// animation logic (composer.js / gm.js)

// ── Joint layout (from gm.js) ──────────────────────
export const J = {
    LeftToe: 0, RightToe: 1, LeftHeel: 2, RightHeel: 3,
    LeftAnkle: 4, RightAnkle: 5, LeftKnee: 6, RightKnee: 7,
    LeftHip: 8, RightHip: 9, LeftShoulder: 10, RightShoulder: 11,
    LeftElbow: 12, RightElbow: 13, LeftWrist: 14, RightWrist: 15,
    LeftHand: 16, RightHand: 17, LeftFingers: 18, RightFingers: 19,
    Core: 20, Neck: 21, Head: 22
};
export const JOINT_COUNT = 23;

// Segment definitions: [[fromJoint, toJoint], centerRadius, visible]
// Matches gm.js segments array exactly
export const SEGMENTS = [
    [[0, 2], 0.025, true], [[0, 4], 0.025, true], [[2, 4], 0.025, true],
    [[4, 6], 0.055, true], [[6, 8], 0.085, true], [[8, 20], 0.1, true],
    [[20, 10], 0.075, true], [[10, 12], 0.06, true], [[12, 14], 0.03, true],
    [[14, 16], 0.02, true], [[16, 18], 0.02, true], [[14, 18], 0.02, false],
    [[1, 3], 0.025, true], [[1, 5], 0.025, true], [[3, 5], 0.025, true],
    [[5, 7], 0.055, true], [[7, 9], 0.085, true], [[9, 20], 0.1, true],
    [[20, 11], 0.075, true], [[11, 13], 0.06, true], [[13, 15], 0.03, true],
    [[15, 17], 0.02, true], [[17, 19], 0.02, true], [[15, 19], 0.02, false],
    [[8, 9], 0.1, false], [[10, 21], 0.065, true], [[11, 21], 0.065, true],
    [[21, 22], 0.05, true]
];

// Joint radii + visibility (from gm.js joints array)
export const JOINT_RADII = [
    0.025, 0.025, 0.03, 0.03, 0.03, 0.03, 0.05, 0.05,
    0.09, 0.09, 0.08, 0.08, 0.045, 0.045, 0.02, 0.02,
    0.02, 0.02, 0.02, 0.02, 0.1, 0.05, 0.11
];
export const JOINT_VISIBLE = [
    false, false, false, false, true, true, true, true,
    true, true, true, true, true, true, false, false,
    true, true, false, false, false, false, true
];

// ── Base62 decoding (from persistence.cpp) ──────────
const B62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function fromBase62(c) {
    const i = B62.indexOf(c);
    if (i === -1) throw new Error('Bad base62: ' + c);
    return i;
}

/**
 * Decode one frame (2 players × 23 joints × 3 coords) from base62 chars.
 * Matches persistence.cpp decodePosition exactly.
 */
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
        for (let j = 0; j < JOINT_COUNT; j++) {
            pos[pl].push({ x: coord() - 2, y: coord(), z: coord() - 2 });
        }
    }
    return pos;
}

// ── Parser (from persistence.cpp readSeqs + loadGraph) ──
/**
 * Parse GrappleMap.txt → { positions[], transitions[] }
 * 
 * Matches C++ readSeqs in persistence.cpp:
 * - Non-indented lines are description/metadata
 * - Indented lines (start with space) are base62-encoded frames (groups of 4)
 * - A new sequence starts when we transition from description → data
 * - Data lines for a sequence are consecutive (no desc lines between frames)
 */
export function parseGrappleMap(text) {
    const lines = text.split('\n');
    const sequences = [];
    let desc = [];
    let dataLines = [];
    let frames = [];
    let lastWasData = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isData = line.length > 0 && line[0] === ' ';

        if (isData) {
            if (!lastWasData) {
                // Transitioning from desc → data: this starts a new sequence.
                // desc is already accumulated. Start collecting frames.
                // (Don't flush yet — frames will be added to this entry.)
                if (desc.length > 0) {
                    // If we had a previous complete sequence, push it first
                    if (frames.length > 0) {
                        sequences.push({ desc: [...desc], frames: [...frames] });
                        frames = [];
                    }
                }
            }
            dataLines.push(line);
            if (dataLines.length === 4) {
                try {
                    frames.push(decodePosition(dataLines.join('\n')));
                } catch (e) {
                    console.warn('Decode error line ' + (i - 3) + ': ' + e.message);
                }
                dataLines = [];
            }
            lastWasData = true;
        } else {
            if (lastWasData && frames.length > 0) {
                // Finished data block → flush the current sequence
                sequences.push({ desc: [...desc], frames: [...frames] });
                desc = [];
                frames = [];
                dataLines = [];
            }
            lastWasData = false;
            if (line.trim().length > 0) {
                desc.push(line);
            }
        }
    }
    // Flush last sequence
    if (frames.length > 0 && desc.length > 0) {
        sequences.push({ desc: [...desc], frames: [...frames] });
    }

    // Separate into positions (1 frame) and transitions (2+ frames)
    const positions = [];
    const transitions = [];

    for (const seq of sequences) {
        const name = parseName(seq.desc);
        const tags = parseTags(seq.desc);
        const props = parseProperties(seq.desc);

        if (seq.frames.length === 1) {
            positions.push({ id: positions.length, name, tags, props, position: seq.frames[0] });
        } else if (seq.frames.length >= 2) {
            transitions.push({ id: transitions.length, name, tags, props, frames: seq.frames });
        }
    }

    return { positions, transitions };
}

function parseName(descLines) {
    for (const line of descLines) {
        if (!line.startsWith('tags:') && !line.startsWith('properties:') &&
            !line.startsWith('ref:') && !line.startsWith('http')) {
            return line.replace(/\\n/g, ' ').trim();
        }
    }
    return '(unnamed)';
}

function parseTags(descLines) {
    for (const line of descLines) {
        if (line.startsWith('tags:')) {
            return line.slice(5).trim().split(/\s+/).filter(Boolean);
        }
    }
    return [];
}

function parseProperties(descLines) {
    for (const line of descLines) {
        if (line.startsWith('properties:')) {
            return line.slice(11).trim().split(/\s+/).filter(Boolean);
        }
    }
    return [];
}

// ── Animation helpers (from composer.js / gm.js) ────

/** Insert midpoint frames between each pair (matches composer.js double_frames) */
export function doubleFrames(frames) {
    if (frames.length <= 1) return frames;
    const r = [frames[0]];
    for (let i = 1; i < frames.length; i++) {
        r.push(lerpFrame(frames[i - 1], frames[i], 0.5));
        r.push(frames[i]);
    }
    return r;
}

/** Interpolate between two frames */
export function lerpFrame(a, b, t) {
    const r = [[], []];
    for (let pl = 0; pl < 2; pl++) {
        for (let j = 0; j < JOINT_COUNT; j++) {
            r[pl].push({
                x: a[pl][j].x * (1 - t) + b[pl][j].x * t,
                y: a[pl][j].y * (1 - t) + b[pl][j].y * t,
                z: a[pl][j].z * (1 - t) + b[pl][j].z * t,
            });
        }
    }
    return r;
}

/**
 * Prepare frames for playback.
 * Non-"detailed" transitions get doubled (matching composer.js emscripten_loaded).
 */
export function prepareFrames(transition) {
    if (transition.props.indexOf('detailed') === -1) {
        return doubleFrames(transition.frames);
    }
    return transition.frames;
}

/**
 * Animation controller matching GrappleMap editor timing.
 * From composer.js: k += deltaTime / 100, advance frame when k >= 1
 */
export class AnimationPlayer {
    constructor(frames, { speed = 1.0, loop = true } = {}) {
        this.frames = frames;
        this.speed = speed;
        this.loop = loop;
        this.frameIndex = 0;
        this.k = 0;          // sub-frame interpolant [0,1)
        this.playing = true;
        this.lastTime = null;
    }

    /** Call each RAF. Returns interpolated frame, or null if no frames. */
    tick(timestamp) {
        if (!this.frames || this.frames.length === 0) return null;
        if (this.frames.length === 1) return this.frames[0];

        if (this.lastTime === null) this.lastTime = timestamp;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.playing) {
            // Matches composer.js: k += deltaTime / 100
            // speed=1 → 100ms per frame, speed=2 → 50ms, speed=0.5 → 200ms
            this.k += (dt / 100) * this.speed;

            while (this.k >= 1) {
                this.k -= 1;
                this.frameIndex++;
                if (this.frameIndex >= this.frames.length - 1) {
                    if (this.loop) {
                        this.frameIndex = 0;
                        this.k = 0;
                    } else {
                        this.frameIndex = this.frames.length - 1;
                        this.k = 0;
                        this.playing = false;
                        break;
                    }
                }
            }
        }

        const f0 = this.frames[this.frameIndex];
        const f1 = this.frames[Math.min(this.frameIndex + 1, this.frames.length - 1)];
        return lerpFrame(f0, f1, this.k);
    }

    play() { this.playing = true; this.lastTime = null; }
    pause() { this.playing = false; }
    reset() { this.frameIndex = 0; this.k = 0; this.lastTime = null; }

    setSpeed(s) { this.speed = s; }
}
