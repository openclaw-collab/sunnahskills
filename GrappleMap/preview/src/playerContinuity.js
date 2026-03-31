/**
 * Same rules as client/src/lib/grapplemapPlayerContinuity.ts — keeps player 0/1 consistent
 * for GrappleMap preview (SequenceBuilder) which does not use MannequinScene.
 */

const TORSO_JOINTS = [8, 9, 10, 11, 12, 13, 20, 21, 22];
const SWAP_IMPROVE_RATIO = 0.92;

function cloneFrame(frame) {
  return [frame[0].map((j) => [...j]), frame[1].map((j) => [...j])];
}

function torsoPlayerDistance(p1, p2) {
  let sum = 0;
  for (let k = 0; k < TORSO_JOINTS.length; k++) {
    const j = TORSO_JOINTS[k];
    const a = p1[j];
    const b = p2[j];
    sum += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  }
  return Math.sqrt(sum);
}

function alignCurToRefStrictMin(ref, cur) {
  const noSwap = torsoPlayerDistance(ref[0], cur[0]) + torsoPlayerDistance(ref[1], cur[1]);
  const swapped = torsoPlayerDistance(ref[0], cur[1]) + torsoPlayerDistance(ref[1], cur[0]);
  if (swapped < noSwap) {
    const t = cur[0];
    cur[0] = cur[1];
    cur[1] = t;
  }
}

function alignCurToRefRatio(ref, cur) {
  const noSwap = torsoPlayerDistance(ref[0], cur[0]) + torsoPlayerDistance(ref[1], cur[1]);
  const swapped = torsoPlayerDistance(ref[0], cur[1]) + torsoPlayerDistance(ref[1], cur[0]);
  if (swapped < noSwap * SWAP_IMPROVE_RATIO) {
    const t = cur[0];
    cur[0] = cur[1];
    cur[1] = t;
    return true;
  }
  return false;
}

function applyMarkerBoundaryAlignment(fixed, markers) {
  const cuts = Array.from(
    new Set(markers.map((m) => m.frame).filter((f) => f > 0 && f < fixed.length)),
  ).sort((a, b) => a - b);

  for (const f of cuts) {
    alignCurToRefStrictMin(fixed[f - 1], fixed[f]);
  }
}

function applyInteriorRounds(fixed) {
  const maxRounds = 6;
  for (let round = 0; round < maxRounds; round++) {
    let changed = false;
    for (let i = 1; i < fixed.length; i++) {
      if (alignCurToRefRatio(fixed[i - 1], fixed[i])) changed = true;
    }
    for (let i = fixed.length - 2; i >= 0; i--) {
      if (alignCurToRefRatio(fixed[i + 1], fixed[i])) changed = true;
    }
    if (!changed) break;
  }
}

/**
 * @param {Array} frames
 * @param {Array<{ frame: number }>|undefined} markers
 */
export function stabilizeSequenceFrames(frames, markers) {
  if (!Array.isArray(frames) || frames.length === 0) {
    return [];
  }
  if (frames.length < 2) {
    return frames;
  }

  const fixed = frames.map(cloneFrame);
  if (markers?.length) {
    applyMarkerBoundaryAlignment(fixed, markers);
  }
  applyInteriorRounds(fixed);
  return fixed;
}

/** Apply stabilization to API / sequence.json payload. */
export function stabilizeSequencePayload(data) {
  if (!data?.frames?.length) {
    return data;
  }
  const frames = stabilizeSequenceFrames(data.frames, data.markers);
  return { ...data, frames };
}
