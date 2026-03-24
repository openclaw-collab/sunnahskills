#!/usr/bin/env node
/**
 * GrappleMap graph loader that mirrors the native C++ loading path more closely.
 *
 * Key difference from the earlier JS loader:
 * - transition endpoints are matched by GrappleMap-style position reorientation,
 *   not raw frame equality
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const B62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const JOINT_COUNT = 23;
const PLAYER_COUNT = 2;

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
  const swaps = [
    [8, 9], [10, 11], [16, 17], [14, 15], [12, 13], [18, 19], [4, 5], [0, 1], [2, 3], [6, 7],
  ];
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

function parseDatabase(dbPath) {
  const text = readFileSync(dbPath, "utf8");
  const lines = text.split("\n");
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
      positions.push(decodePosition(dataLines.slice(i, i + 4).join("\n")));
    }
    const propertiesLine = desc.find((line) => line.startsWith("properties:")) ?? "";
    const properties = propertiesLine.replace("properties:", "").trim().split(/\s+/).filter(Boolean);
    sequences.push({
      description: [...desc],
      positions,
      line_nr: lineNr - desc.length,
      detailed: properties.includes("detailed"),
      bidirectional: properties.includes("bidirectional"),
    });
    dataLines = [];
    desc = [];
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isPosition = line.length > 0 && line[0] === " ";

    if (isPosition) {
      if (!lastWasPosition) {
        if (desc.length === 0) throw new Error(`Missing description before data at line ${lineNr + 1}`);
      }
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
  const tagsLine = description.find((line) => line.startsWith("tags:"));
  return tagsLine ? tagsLine.replace("tags:", "").trim().split(/\s+/).filter(Boolean) : [];
}

function propertiesFromDescription(description = []) {
  const propsLine = description.find((line) => line.startsWith("properties:"));
  return propsLine ? propsLine.replace("properties:", "").trim().split(/\s+/).filter(Boolean) : [];
}

function firstDescriptionLine(description = []) {
  return description.find((line) => !/^(tags:|properties:|ref:|http)/.test(line)) ?? "(unnamed)";
}

export function loadGraph(dbPath = join(ROOT, "GrappleMap.txt")) {
  const parsed = parseDatabase(dbPath);
  const nodes = [];
  const edges = [];

  parsed.forEach((seq) => {
    if (seq.positions.length === 1) {
      nodes.push({
        id: nodes.length,
        name: firstDescriptionLine(seq.description),
        description: seq.description,
        desc_lines: firstDescriptionLine(seq.description).split("\\n"),
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
      name: "(unnamed)",
      description: [],
      desc_lines: ["?"],
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
      desc_lines: firstDescriptionLine(seq.description).split("\\n"),
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
    getTransitionsFrom(nodeId) {
      const node = nodes[nodeId];
      return node ? node.outgoing.map((step) => ({ ...edges[step.transition], reverse: step.reverse })) : [];
    },
    getTransitionsTo(nodeId) {
      const node = nodes[nodeId];
      return node ? node.incoming.map((step) => ({ ...edges[step.transition], reverse: step.reverse })) : [];
    },
    findByName(name) {
      const lower = name.toLowerCase();
      return [
        ...nodes.filter((node) => node.name.toLowerCase().includes(lower)).map((node) => ({ type: "position", ...node })),
        ...edges.filter((edge) => edge.name.toLowerCase().includes(lower)).map((edge) => ({ type: "transition", ...edge })),
      ];
    },
    findByTag(tag) {
      const lower = tag.toLowerCase();
      return [
        ...nodes.filter((node) => node.tags.some((t) => t.toLowerCase().includes(lower))).map((node) => ({ type: "position", ...node })),
        ...edges.filter((edge) => edge.tags.some((t) => t.toLowerCase().includes(lower))).map((edge) => ({ type: "transition", ...edge })),
      ];
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const graph = loadGraph(process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, "GrappleMap.txt"));
  console.log(`Loaded ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);
}
