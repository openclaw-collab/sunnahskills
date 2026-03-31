const B62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const JOINT_COUNT = 23;
const PLAYER_COUNT = 2;
const TORSO_JOINTS = [8, 9, 10, 11, 12, 13, 20, 21, 22];
const SWAP_IMPROVE_RATIO = 0.92;

export const SEQUENCES = {
  uchimata: [
    { type: "position", id: 557 },
    { type: "transition", id: 1383 },
    { type: "position", id: 558 },
    { type: "transition", id: 1387 },
    { type: "position", id: 57 },
    { type: "transition", id: 1207 },
    { type: "position", id: 401 },
  ],
  armbar: [
    { type: "position", id: 25 },
    { type: "transition", id: 54 },
    { type: "position", id: 26 },
  ],
  triangle: [
    { type: "position", id: 27 },
    { type: "transition", id: 62 },
    { type: "position", id: 28 },
  ],
  kimura: [
    { type: "position", id: 22 },
    { type: "transition", id: 47 },
    { type: "position", id: 23 },
  ],
  rnc: [
    { type: "position", id: 15 },
    { type: "transition", id: 35 },
    { type: "position", id: 16 },
  ],
};

function fromBase62(c) {
  const i = B62.indexOf(c);
  if (i === -1) throw new Error(`Bad base62 digit: ${c}`);
  return i;
}

export function parseSpec(spec) {
  const parts = spec.split(/[,:]/).map((s) => s.trim().toLowerCase());
  const result = [];

  for (const part of parts) {
    const legacyReverseTransitionMatch = part.match(/^-(\d+)$/);
    if (legacyReverseTransitionMatch) {
      result.push({ type: "transition", id: parseInt(legacyReverseTransitionMatch[1], 10), reverse: true });
      continue;
    }

    const positionMatch = part.match(/^(p|position)?\s*(\d+)$/);
    if (positionMatch) {
      result.push({ type: "position", id: parseInt(positionMatch[2], 10) });
      continue;
    }

    const reverseTransitionMatch = part.match(/^(t|transition)?\s*(\d+)\s*(r|rev|reverse)$/);
    if (reverseTransitionMatch) {
      result.push({ type: "transition", id: parseInt(reverseTransitionMatch[2], 10), reverse: true });
      continue;
    }

    const transitionMatch = part.match(/^(t|transition)?\s*(\d+)$/);
    if (transitionMatch) {
      result.push({ type: "transition", id: parseInt(transitionMatch[2], 10), reverse: false });
    }
  }

  return result;
}

export function decodePosition(chars) {
  let off = 0;
  function nextDigit() {
    while (off < chars.length && /\s/.test(chars[off])) off += 1;
    return fromBase62(chars[off++]);
  }
  function coord() {
    return (nextDigit() * 62 + nextDigit()) / 1000;
  }

  const pos = [[], []];
  for (let pl = 0; pl < PLAYER_COUNT; pl += 1) {
    for (let j = 0; j < JOINT_COUNT; j += 1) {
      pos[pl].push([+(coord() - 2).toFixed(6), +coord().toFixed(6), +(coord() - 2).toFixed(6)]);
    }
  }
  return pos;
}

export function parseFlatIndexLists(text) {
  const lines = text.split("\n");
  const positions = [];
  const transitions = [];
  let inData = false;
  let dataLines = [];
  let currentDesc = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isData = line.length > 0 && line[0] === " ";

    if (isData) {
      dataLines.push(line);
      inData = true;
    } else {
      if (inData && dataLines.length > 0) {
        const frameCount = Math.floor(dataLines.length / 4);
        const name =
          currentDesc
            .find(
              (l) =>
                !l.startsWith("tags:") &&
                !l.startsWith("properties:") &&
                !l.startsWith("ref:") &&
                !l.startsWith("http"),
            )
            ?.replace(/\n/g, " ")
            .trim() ?? "(unnamed)";

        if (frameCount === 1) {
          positions.push({
            id: positions.length,
            name,
            data: dataLines.slice(0, 4),
            line: i - dataLines.length,
          });
        } else if (frameCount >= 2) {
          const frames = [];
          for (let j = 0; j < dataLines.length; j += 4) {
            if (j + 4 <= dataLines.length) frames.push(dataLines.slice(j, j + 4));
          }
          transitions.push({
            id: transitions.length,
            name,
            frames,
            frameCount,
            line: i - dataLines.length,
          });
        }
        dataLines = [];
      }
      inData = false;
      if (line.trim()) currentDesc = [line];
    }
  }

  return { positions, transitions };
}

function cloneFrame(frame) {
  return [frame[0].map((joint) => [...joint]), frame[1].map((joint) => [...joint])];
}

function torsoPlayerDistance(p1, p2) {
  let sum = 0;
  for (let k = 0; k < TORSO_JOINTS.length; k += 1) {
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
    const temp = cur[0];
    cur[0] = cur[1];
    cur[1] = temp;
  }
}

function alignCurToRefRatio(ref, cur) {
  const noSwap = torsoPlayerDistance(ref[0], cur[0]) + torsoPlayerDistance(ref[1], cur[1]);
  const swapped = torsoPlayerDistance(ref[0], cur[1]) + torsoPlayerDistance(ref[1], cur[0]);
  if (swapped < noSwap * SWAP_IMPROVE_RATIO) {
    const temp = cur[0];
    cur[0] = cur[1];
    cur[1] = temp;
    return true;
  }
  return false;
}

function applyMarkerBoundaryAlignment(fixed, markers) {
  const cuts = [...new Set(markers.map((m) => m.frame).filter((f) => f > 0 && f < fixed.length))].sort((a, b) => a - b);

  for (const frame of cuts) {
    alignCurToRefStrictMin(fixed[frame - 1], fixed[frame]);
  }
}

function applyInteriorRounds(fixed) {
  const maxRounds = 6;
  for (let round = 0; round < maxRounds; round += 1) {
    let changed = false;
    for (let i = 1; i < fixed.length; i += 1) {
      if (alignCurToRefRatio(fixed[i - 1], fixed[i])) changed = true;
    }
    for (let i = fixed.length - 2; i >= 0; i -= 1) {
      if (alignCurToRefRatio(fixed[i + 1], fixed[i])) changed = true;
    }
    if (!changed) break;
  }
}

export function stabilizeSequenceFrames(frames, markers) {
  if (!Array.isArray(frames) || frames.length === 0) return [];
  if (frames.length < 2) return frames;

  const fixed = frames.map(cloneFrame);
  if (markers?.length) {
    applyMarkerBoundaryAlignment(fixed, markers);
  }
  applyInteriorRounds(fixed);
  return fixed;
}

export function buildSequenceFromGrappleMapText(text, spec) {
  const { positions, transitions } = parseFlatIndexLists(text);
  const frames = [];
  const markers = [];
  let frameCount = 0;

  for (const target of spec) {
    if (target.type === "position") {
      const position = positions[target.id];
      if (!position) {
        console.error(`Position ${target.id} not found (flat index; ${positions.length} static poses in file).`);
        continue;
      }
      markers.push({ name: position.name, frame: frameCount, type: "position" });
      frames.push(decodePosition(position.data.join("\n")));
      frameCount += 1;
    } else {
      const transition = transitions[target.id];
      if (!transition) {
        console.error(`Transition ${target.id} not found (flat index; ${transitions.length} transitions in file).`);
        continue;
      }
      markers.push({ name: transition.name, frame: frameCount, type: "transition" });
      for (const frame of transition.frames) {
        frames.push(decodePosition(frame.join("\n")));
        frameCount += 1;
      }
    }
  }

  const stabilized = frames.length >= 2 ? stabilizeSequenceFrames(frames, markers) : frames;
  return { frames: stabilized, markers };
}

export function buildSequencePayload(name, text, spec, options = {}) {
  const { extractedAt = new Date().toISOString() } = options;
  const { frames, markers } = buildSequenceFromGrappleMapText(text, spec);
  return {
    meta: {
      name,
      extractedAt,
      totalFrames: frames.length,
      positions: spec.filter((step) => step.type === "position").length,
      transitions: spec.filter((step) => step.type === "transition").length,
    },
    markers,
    frames,
  };
}
