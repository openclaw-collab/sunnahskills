/**
 * Browser-compatible graph data for sequence building
 */

import sequenceJson from './sequence.json';

// Base62 decoding (same as C++ and Node versions)
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

// Cache for loaded frames
const frameCache = new Map();

/**
 * Fetch frames for a specific position or transition
 * This calls a simple API endpoint that returns the decoded frames
 */
export async function fetchFrames(type, id) {
    const cacheKey = `${type}-${id}`;
    if (frameCache.has(cacheKey)) {
        return frameCache.get(cacheKey);
    }

    try {
        // Try to fetch from the JSON file that was pre-generated
        // For now, we'll use a workaround - fetch from sequence.json or generate statically

        // Check if this ID exists in our current sequence
        const frames = await fetchFramesFromServer(type, id);
        frameCache.set(cacheKey, frames);
        return frames;
    } catch (err) {
        console.error(`Failed to load ${type} ${id}:`, err);
        return null;
    }
}

/**
 * Build a sequence from position/transition IDs
 * Returns frames and markers
 */
export async function buildSequence(sequenceItems) {
    const frames = [];
    const markers = [];
    let frameCount = 0;

    for (const item of sequenceItems) {
        if (item.type === 'position') {
            // Fetch position frame
            const positionFrames = await fetchFrames('position', item.id);
            if (positionFrames && positionFrames.length > 0) {
                frames.push(positionFrames[0]);
                markers.push({
                    name: item.name || `Position ${item.id}`,
                    frame: frameCount,
                    type: 'position'
                });
                frameCount++;
            }
        } else {
            // Fetch transition frames
            const transitionFrames = await fetchFrames('transition', item.id);
            if (transitionFrames && transitionFrames.length > 0) {
                markers.push({
                    name: item.name || `Transition ${item.id}`,
                    frame: frameCount,
                    type: 'transition'
                });
                for (const frame of transitionFrames) {
                    frames.push(frame);
                    frameCount++;
                }
            }
        }
    }

    return { frames, markers };
}

// For now, use the statically generated sequence data
// In a full implementation, this would fetch from a server
async function fetchFramesFromServer(type, id) {
    // This is a placeholder - in production, this would be an API call
    // For now, we return null to indicate we need the static data
    return null;
}

// Export the current sequence data for backward compatibility
export const defaultSequence = sequenceJson;
