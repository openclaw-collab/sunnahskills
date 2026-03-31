const JOINT_COUNT = 23;
const PLAYER_COUNT = 2;
const B62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function fromBase62(c) {
  const i = B62.indexOf(c);
  if (i === -1) throw new Error(`Bad base62 digit: ${c}`);
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
  for (let pl = 0; pl < PLAYER_COUNT; pl += 1) {
    for (let j = 0; j < JOINT_COUNT; j += 1) {
      pos[pl].push([+(coord() - 2).toFixed(6), +coord().toFixed(6), +(coord() - 2).toFixed(6)]);
    }
  }
  return pos;
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function angle2(v) {
  return Math.atan2(v[1], v[0]);
}

function rotateY(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

function mirrorPoint(v) {
  return [-v[0], v[1], v[2]];
}

function clonePosition(position) {
  return position.map((player) => player.map((joint) => [...joint]));
}

function swapLimbs(player) {
  const swaps = [[8, 9], [10, 11], [16, 17], [14, 15], [12, 13], [18, 19], [4, 5], [0, 1], [2, 3], [6, 7]];
  swaps.forEach(([a, b]) => {
    const temp = player[a];
    player[a] = player[b];
    player[b] = temp;
  });
}

function mirrorPosition(position) {
  const p = clonePosition(position);
  for (let player = 0; player < PLAYER_COUNT; player += 1) {
    for (let joint = 0; joint < JOINT_COUNT; joint += 1) {
      p[player][joint] = mirrorPoint(p[player][joint]);
    }
    swapLimbs(p[player]);
  }
  return p;
}

function swapPlayers(position) {
  return [clonePosition(position)[1], clonePosition(position)[0]];
}

function applyReorientation(position, reo) {
  let p = clonePosition(position);
  for (let player = 0; player < PLAYER_COUNT; player += 1) {
    for (let joint = 0; joint < JOINT_COUNT; joint += 1) {
      p[player][joint] = add(rotateY(p[player][joint], reo.angle), reo.offset);
    }
  }
  if (reo.mirror) p = mirrorPosition(p);
  if (reo.swapPlayers) p = [p[1], p[0]];
  return p;
}

function copyReorientation(reo) {
  return {
    angle: reo.angle,
    offset: [...reo.offset],
    swapPlayers: reo.swapPlayers,
    mirror: reo.mirror,
  };
}

function inverseReorientation(reo) {
  const inverted = {
    offset: rotateY([-reo.offset[0], -reo.offset[1], -reo.offset[2]], -reo.angle),
    angle: -reo.angle,
    mirror: reo.mirror,
    swapPlayers: reo.swapPlayers,
  };

  if (reo.mirror) {
    inverted.angle = -inverted.angle;
    inverted.offset[0] = -inverted.offset[0];
  }

  return inverted;
}

function composeReorientation(a, b) {
  const composed = {
    mirror: a.mirror !== b.mirror,
    swapPlayers: a.swapPlayers !== b.swapPlayers,
    angle: 0,
    offset: [0, 0, 0],
  };

  if (a.mirror) {
    const mirroredOffset = [-b.offset[0], b.offset[1], b.offset[2]];
    composed.angle = a.angle - b.angle;
    composed.offset = add(mirroredOffset, rotateY(a.offset, -b.angle));
  } else {
    composed.angle = a.angle + b.angle;
    composed.offset = add(b.offset, rotateY(a.offset, b.angle));
  }

  return composed;
}

function basicallySame(a, b) {
  for (let player = 0; player < PLAYER_COUNT; player += 1) {
    for (let joint = 0; joint < JOINT_COUNT; joint += 1) {
      if (distanceSquared(a[player][joint], b[player][joint]) > 0.0016) return false;
    }
  }
  return true;
}

function isReorientedWithoutMirrorAndSwap(a, b) {
  const a0h = a[0][22];
  const a1h = a[1][22];
  const b0h = b[0][22];
  const b1h = b[1][22];
  const angleOff = angle2([b1h[0] - b0h[0], b1h[2] - b0h[2]]) - angle2([a1h[0] - a0h[0], a1h[2] - a0h[2]]);
  const rotatedA0 = rotateY(a0h, angleOff);
  const offset = sub(b0h, rotatedA0);
  const reo = { angle: angleOff, offset, swapPlayers: false, mirror: false };
  return basicallySame(applyReorientation(a, reo), b) ? reo : null;
}

function isReorientedWithoutSwap(a, b) {
  const direct = isReorientedWithoutMirrorAndSwap(a, b);
  if (direct) return direct;
  const mirrored = isReorientedWithoutMirrorAndSwap(a, mirrorPosition(b));
  if (mirrored) return { ...mirrored, mirror: true };
  return null;
}

function isReoriented(a, b) {
  const headDistance = (p) => distanceSquared(p[0][22], p[1][22]);
  if (Math.abs(headDistance(a) - headDistance(b)) > 0.05) return null;

  const direct = isReorientedWithoutSwap(a, b);
  if (direct) return direct;

  const swapped = isReorientedWithoutSwap(a, swapPlayers(b));
  if (swapped) return { ...swapped, swapPlayers: true };
  return null;
}

function parseDatabase(text) {
  const lines = text.split('\n');
  const sequences = [];
  let desc = [];
  let dataLines = [];
  let lastWasPosition = false;
  let lineNr = 0;

  function finalizeDataChunk() {
    if (dataLines.length === 0) return;
    const frameCount = Math.floor(dataLines.length / 4);
    const positions = [];
    for (let i = 0; i < dataLines.length; i += 4) {
      positions.push(decodePosition(dataLines.slice(i, i + 4).join('\n')));
    }
    const propertiesLine = desc.find((line) => line.startsWith('properties:')) ?? '';
    const properties = propertiesLine.replace('properties:', '').trim().split(/\s+/).filter(Boolean);
    sequences.push({
      description: [...desc],
      positions,
      line_nr: lineNr - desc.length,
      detailed: properties.includes('detailed'),
      bidirectional: properties.includes('bidirectional'),
    });
    dataLines = [];
    desc = [];
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isPosition = line.length > 0 && line[0] === ' ';

    if (isPosition) {
      dataLines.push(line);
      lineNr += 1;
    } else {
      if (lastWasPosition) finalizeDataChunk();
      if (line.trim()) desc.push(line.trim());
      lineNr += 1;
    }

    lastWasPosition = isPosition;
  }
  if (lastWasPosition) finalizeDataChunk();
  return sequences;
}

function tagsFromDescription(description = []) {
  const tagsLine = description.find((line) => line.startsWith('tags:'));
  return tagsLine ? tagsLine.replace('tags:', '').trim().split(/\s+/).filter(Boolean) : [];
}

function propertiesFromDescription(description = []) {
  const propsLine = description.find((line) => line.startsWith('properties:'));
  return propsLine ? propsLine.replace('properties:', '').trim().split(/\s+/).filter(Boolean) : [];
}

function firstDescriptionLine(description = []) {
  return description.find((line) => !/^(tags:|properties:|ref:|http)/.test(line)) ?? '(unnamed)';
}

export function loadGraphFromText(text) {
  const parsed = parseDatabase(text);
  const nodes = [];
  const edges = [];

  parsed.forEach((seq) => {
    if (seq.positions.length === 1) {
      nodes.push({
        id: nodes.length,
        name: firstDescriptionLine(seq.description),
        description: seq.description,
        desc_lines: firstDescriptionLine(seq.description).split('\\n'),
        tags: tagsFromDescription(seq.description),
        properties: propertiesFromDescription(seq.description),
        position: seq.positions[0],
        line: seq.line_nr,
        line_nr: seq.line_nr,
        incoming: [],
        outgoing: [],
      });
    }
  });

  function findOrAddNode(position) {
    for (const node of nodes) {
      const reo = isReoriented(node.position, position);
      if (reo) return { nodeId: node.id, reo };
    }

    const newNode = {
      id: nodes.length,
      name: '(unnamed)',
      description: [],
      desc_lines: ['?'],
      tags: [],
      properties: [],
      position: clonePosition(position),
      line: null,
      line_nr: null,
      incoming: [],
      outgoing: [],
    };
    nodes.push(newNode);
    return { nodeId: newNode.id, reo: { angle: 0, offset: [0, 0, 0], swapPlayers: false, mirror: false } };
  }

  parsed.forEach((seq) => {
    if (seq.positions.length <= 1) return;

    const from = findOrAddNode(seq.positions[0]);
    const to = findOrAddNode(seq.positions[seq.positions.length - 1]);
    if (from.nodeId === to.nodeId) return;

    const edge = {
      id: edges.length,
      name: firstDescriptionLine(seq.description),
      description: seq.description,
      desc_lines: firstDescriptionLine(seq.description).split('\\n'),
      tags: tagsFromDescription(seq.description),
      properties: propertiesFromDescription(seq.description),
      frames: seq.positions,
      frameCount: seq.positions.length,
      line: seq.line_nr,
      line_nr: seq.line_nr,
      from: { node: from.nodeId, reo: from.reo },
      to: { node: to.nodeId, reo: to.reo },
      bidirectional: seq.bidirectional,
      detailed: seq.detailed,
    };
    edges.push(edge);
  });

  nodes.forEach((node) => {
    node.incoming = [];
    node.outgoing = [];
  });

  edges.forEach((edge) => {
    nodes[edge.from.node]?.outgoing.push({ transition: edge.id, reverse: false });
    nodes[edge.to.node]?.incoming.push({ transition: edge.id, reverse: false });
    if (edge.bidirectional) {
      nodes[edge.from.node]?.incoming.push({ transition: edge.id, reverse: true });
      nodes[edge.to.node]?.outgoing.push({ transition: edge.id, reverse: true });
    }
  });

  return {
    nodes,
    edges,
    nodeMap: new Map(nodes.map((node) => [node.id, node])),
    edgeMap: new Map(edges.map((edge) => [edge.id, edge])),
  };
}

export function buildSequenceFromGraphText(text, spec) {
  const graph = loadGraphFromText(text);
  const frames = [];
  const markers = [];
  let reo = null;
  let previousTransitionStep = null;

  function edgeFrom(step) {
    const edge = graph.edgeMap.get(step.id);
    if (!edge) return null;
    return step.reverse ? edge.to : edge.from;
  }

  function edgeTo(step) {
    const edge = graph.edgeMap.get(step.id);
    if (!edge) return null;
    return step.reverse ? edge.from : edge.to;
  }

  function nextTransitionIndex(fromIndex) {
    for (let i = fromIndex + 1; i < spec.length; i += 1) {
      if (spec[i]?.type === 'transition') return i;
    }
    return -1;
  }

  function previousTransitionIndex(fromIndex) {
    for (let i = fromIndex - 1; i >= 0; i -= 1) {
      if (spec[i]?.type === 'transition') return i;
    }
    return -1;
  }

  for (let i = 0; i < spec.length; i += 1) {
    const step = spec[i];

    if (step.type === 'position') {
      const node = graph.nodeMap.get(step.id);
      if (!node) {
        console.error(`Position ${step.id} not found (graph node id; ${graph.nodes.length} nodes in graph).`);
        continue;
      }

      const prevTransitionIdx = previousTransitionIndex(i);
      const nextTransitionIdx = nextTransitionIndex(i);
      const expectedFrom = nextTransitionIdx >= 0 ? edgeFrom(spec[nextTransitionIdx]) : null;
      const expectedTo = prevTransitionIdx >= 0 ? edgeTo(spec[prevTransitionIdx]) : null;

      if (expectedFrom && expectedFrom.node !== step.id && prevTransitionIdx < 0) {
        console.warn(`Position ${step.id} does not match start node ${expectedFrom.node} for transition ${spec[nextTransitionIdx].id}.`);
      }
      if (expectedTo && expectedTo.node !== step.id) {
        console.warn(`Position ${step.id} does not match end node ${expectedTo.node} for transition ${spec[prevTransitionIdx].id}.`);
      }

      let frame = Math.max(0, frames.length - 1);
      if (frames.length === 0 && nextTransitionIdx === -1) {
        frames.push(node.position);
        frame = 0;
      } else if (frames.length > 0 && prevTransitionIdx === -1 && nextTransitionIdx === -1) {
        frames.push(node.position);
        frame = frames.length - 1;
      } else if (frames.length === 0 && nextTransitionIdx >= 0) {
        frame = 0;
      }

      markers.push({ name: node.name, frame, type: 'position' });
      continue;
    }

    const edge = graph.edgeMap.get(step.id);
    if (!edge) {
      console.error(`Transition ${step.id} not found (graph edge id; ${graph.edges.length} transitions in graph).`);
      continue;
    }

    if (previousTransitionStep) {
      const fromReo = edgeFrom(step)?.reo;
      const prevToReo = edgeTo(previousTransitionStep)?.reo;
      if (!fromReo || !prevToReo) {
        console.error(`Transition ${step.id} is missing graph endpoint reorientation metadata.`);
        continue;
      }
      reo = composeReorientation(composeReorientation(inverseReorientation(fromReo), prevToReo), reo);
    } else {
      const startReo = edgeFrom(step)?.reo;
      if (!startReo) {
        console.error(`Transition ${step.id} is missing graph start reorientation metadata.`);
        continue;
      }
      reo = copyReorientation(startReo);
    }

    if (frames.length !== 0) frames.pop();

    markers.push({ name: edge.name, frame: frames.length, type: 'transition' });
    const edgeFrames = step.reverse ? [...edge.frames].reverse() : edge.frames;
    for (const pose of edgeFrames) {
      frames.push(applyReorientation(pose, reo));
    }
    previousTransitionStep = step;
  }

  if (frames.length) {
    let coreSum = [0, 0, 0];
    for (const frame of frames) {
      coreSum = add(coreSum, frame[0][20]);
      coreSum = add(coreSum, frame[1][20]);
    }
    coreSum[1] = 0;
    const scale = -1 / (frames.length * 2);
    const centerer = { mirror: false, swapPlayers: false, angle: 0, offset: [coreSum[0] * scale, 0, coreSum[2] * scale] };
    for (let i = 0; i < frames.length; i += 1) {
      frames[i] = applyReorientation(frames[i], centerer);
    }
  }

  return { frames, markers };
}

export function buildSequencePayloadFromGraphText(name, text, spec, options = {}) {
  const { extractedAt = new Date().toISOString() } = options;
  const { frames, markers } = buildSequenceFromGraphText(text, spec);
  return {
    meta: {
      name,
      extractedAt,
      totalFrames: frames.length,
      positions: spec.filter((step) => step.type === 'position').length,
      transitions: spec.filter((step) => step.type === 'transition').length,
    },
    markers,
    frames,
  };
}
