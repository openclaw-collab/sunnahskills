#!/usr/bin/env node
/**
 * Export the full GrappleMap graph with connection arrays.
 *
 * This script ports the graph loading logic from grapplemap-loader.js to TypeScript
 * and exports a graph.json file with nodes, edges, and connection arrays.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const B62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const JOINT_COUNT = 23;
const PLAYER_COUNT = 2;

// Types
type Position = number[][][];

interface Reorientation {
  angle: number;
  offset: number[];
  swapPlayers: boolean;
  mirror: boolean;
}

interface NodeConnection {
  transition: number;
  reverse: boolean;
}

interface Node {
  id: number;
  name: string;
  desc_lines: string[];
  tags: string[];
  properties: string[];
  position: Position;
  line: number | null;
  incoming: NodeConnection[];
  outgoing: NodeConnection[];
}

interface EdgeEndpoint {
  node: number;
  reo: Reorientation;
}

interface Edge {
  id: number;
  name: string;
  desc_lines: string[];
  tags: string[];
  properties: string[];
  line: number;
  frameCount: number;
  from: EdgeEndpoint;
  to: EdgeEndpoint;
  bidirectional: boolean;
  detailed: boolean;
}

interface Graph {
  meta: {
    exportedAt: string;
    source: string;
    nodeCount: number;
    edgeCount: number;
  };
  nodes: ExportNode[];
  edges: ExportEdge[];
}

// Export types (without position/frame data to reduce file size)
interface ExportNode {
  id: number;
  name: string;
  desc_lines: string[];
  tags: string[];
  properties: string[];
  line: number | null;
  incoming: NodeConnection[];
  outgoing: NodeConnection[];
}

interface ExportEdge {
  id: number;
  name: string;
  desc_lines: string[];
  tags: string[];
  properties: string[];
  line: number;
  frameCount: number;
  from: EdgeEndpoint;
  to: EdgeEndpoint;
  bidirectional: boolean;
  detailed: boolean;
}

interface ParsedSequence {
  description: string[];
  positions: Position[];
  line_nr: number;
  detailed: boolean;
  bidirectional: boolean;
}

// Base62 decoding
function fromBase62(c: string): number {
  const i = B62.indexOf(c);
  if (i === -1) throw new Error(`Bad base62 digit: ${c}`);
  return i;
}

// Decode position from base62 encoded string
function decodePosition(chars: string): Position {
  let off = 0;
  function nextDigit(): number {
    while (off < chars.length && /\s/.test(chars[off])) off++;
    return fromBase62(chars[off++]);
  }
  function coord(): number {
    return (nextDigit() * 62 + nextDigit()) / 1000;
  }

  const pos: Position = [[], []];
  for (let pl = 0; pl < PLAYER_COUNT; pl++) {
    for (let j = 0; j < JOINT_COUNT; j++) {
      pos[pl].push([
        +(coord() - 2).toFixed(6),
        +coord().toFixed(6),
        +(coord() - 2).toFixed(6),
      ]);
    }
  }
  return pos;
}

// Vector math
function add(a: number[], b: number[]): number[] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: number[], b: number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function distanceSquared(a: number[], b: number[]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function angle2(v: number[]): number {
  return Math.atan2(v[1], v[0]);
}

function rotateY(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

function mirrorPoint(v: number[]): number[] {
  return [-v[0], v[1], v[2]];
}

function clonePosition(position: Position): Position {
  return [position[0].map((joint) => [...joint]), position[1].map((joint) => [...joint])];
}

function swapLimbs(player: number[][]): void {
  const swaps = [
    [8, 9],
    [10, 11],
    [16, 17],
    [14, 15],
    [12, 13],
    [18, 19],
    [4, 5],
    [0, 1],
    [2, 3],
    [6, 7],
  ];
  swaps.forEach(([a, b]) => {
    const temp = player[a];
    player[a] = player[b];
    player[b] = temp;
  });
}

function mirrorPosition(position: Position): Position {
  const p = clonePosition(position);
  for (let player = 0; player < PLAYER_COUNT; player++) {
    for (let joint = 0; joint < JOINT_COUNT; joint++) {
      p[player][joint] = mirrorPoint(p[player][joint]);
    }
    swapLimbs(p[player]);
  }
  return p;
}

function swapPlayers(position: Position): Position {
  const cloned = clonePosition(position);
  return [cloned[1], cloned[0]];
}

function applyReorientation(position: Position, reo: Reorientation): Position {
  let p = clonePosition(position);
  for (let player = 0; player < PLAYER_COUNT; player++) {
    for (let joint = 0; joint < JOINT_COUNT; joint++) {
      p[player][joint] = add(rotateY(p[player][joint], reo.angle), reo.offset);
    }
  }
  if (reo.mirror) p = mirrorPosition(p);
  if (reo.swapPlayers) p = swapPlayers(p);
  return p;
}

function basicallySame(a: Position, b: Position): boolean {
  for (let player = 0; player < PLAYER_COUNT; player++) {
    for (let joint = 0; joint < JOINT_COUNT; joint++) {
      if (distanceSquared(a[player][joint], b[player][joint]) > 0.0016) return false;
    }
  }
  return true;
}

function isReorientedWithoutMirrorAndSwap(a: Position, b: Position): Reorientation | null {
  const a0h = a[0][22];
  const a1h = a[1][22];
  const b0h = b[0][22];
  const b1h = b[1][22];
  const angleOff = angle2([b1h[0] - b0h[0], b1h[2] - b0h[2]]) - angle2([a1h[0] - a0h[0], a1h[2] - a0h[2]]);
  const rotatedA0 = rotateY(a0h, angleOff);
  const offset = sub(b0h, rotatedA0);
  const reo: Reorientation = { angle: angleOff, offset, swapPlayers: false, mirror: false };
  return basicallySame(applyReorientation(a, reo), b) ? reo : null;
}

function isReorientedWithoutSwap(a: Position, b: Position): Reorientation | null {
  const direct = isReorientedWithoutMirrorAndSwap(a, b);
  if (direct) return direct;
  const mirrored = isReorientedWithoutMirrorAndSwap(a, mirrorPosition(b));
  if (mirrored) return { ...mirrored, mirror: true };
  return null;
}

function isReoriented(a: Position, b: Position): Reorientation | null {
  const headDistance = (p: Position) => distanceSquared(p[0][22], p[1][22]);
  if (Math.abs(headDistance(a) - headDistance(b)) > 0.05) return null;

  const direct = isReorientedWithoutSwap(a, b);
  if (direct) return direct;

  const swapped = isReorientedWithoutSwap(a, swapPlayers(b));
  if (swapped) return { ...swapped, swapPlayers: true };
  return null;
}

// Parse the GrappleMap database file
function parseDatabase(dbPath: string): ParsedSequence[] {
  const text = readFileSync(dbPath, "utf8");
  const lines = text.split("\n");
  const sequences: ParsedSequence[] = [];
  let desc: string[] = [];
  let dataLines: string[] = [];
  let lastWasPosition = false;
  let lineNr = 0;

  function finalizeDataChunk() {
    if (dataLines.length === 0) return;
    const positions: Position[] = [];
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

  for (let i = 0; i < lines.length; i++) {
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

function tagsFromDescription(description: string[] = []): string[] {
  const tagsLine = description.find((line) => line.startsWith("tags:"));
  return tagsLine ? tagsLine.replace("tags:", "").trim().split(/\s+/).filter(Boolean) : [];
}

function propertiesFromDescription(description: string[] = []): string[] {
  const propsLine = description.find((line) => line.startsWith("properties:"));
  return propsLine ? propsLine.replace("properties:", "").trim().split(/\s+/).filter(Boolean) : [];
}

function firstDescriptionLine(description: string[] = []): string {
  return description.find((line) => !/^(tags:|properties:|ref:|http)/.test(line)) ?? "(unnamed)";
}

// Main graph loading function
function loadGraph(dbPath: string): { nodes: Node[]; edges: Edge[] } {
  const parsed = parseDatabase(dbPath);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // First pass: create nodes from single-position sequences
  parsed.forEach((seq) => {
    if (seq.positions.length === 1) {
      nodes.push({
        id: nodes.length,
        name: firstDescriptionLine(seq.description),
        desc_lines: firstDescriptionLine(seq.description).split("\n"),
        tags: tagsFromDescription(seq.description),
        properties: propertiesFromDescription(seq.description),
        position: seq.positions[0],
        line: seq.line_nr,
        incoming: [],
        outgoing: [],
      });
    }
  });

  // Find or add node by position (using geometric matching)
  function findOrAddNode(position: Position): { nodeId: number; reo: Reorientation } {
    for (const node of nodes) {
      const reo = isReoriented(node.position, position);
      if (reo) return { nodeId: node.id, reo };
    }

    // Create unnamed node
    const newNode: Node = {
      id: nodes.length,
      name: "(unnamed)",
      desc_lines: ["?"],
      tags: [],
      properties: [],
      position: clonePosition(position),
      line: null,
      incoming: [],
      outgoing: [],
    };
    nodes.push(newNode);
    return { nodeId: newNode.id, reo: { angle: 0, offset: [0, 0, 0], swapPlayers: false, mirror: false } };
  }

  // Second pass: create edges from multi-position sequences
  parsed.forEach((seq) => {
    if (seq.positions.length <= 1) return;

    const from = findOrAddNode(seq.positions[0]);
    const to = findOrAddNode(seq.positions[seq.positions.length - 1]);
    if (from.nodeId === to.nodeId) return;

    const edge: Edge = {
      id: edges.length,
      name: firstDescriptionLine(seq.description),
      desc_lines: firstDescriptionLine(seq.description).split("\n"),
      tags: tagsFromDescription(seq.description),
      properties: propertiesFromDescription(seq.description),
      line: seq.line_nr,
      frameCount: seq.positions.length,
      from: { node: from.nodeId, reo: from.reo },
      to: { node: to.nodeId, reo: to.reo },
      bidirectional: seq.bidirectional,
      detailed: seq.detailed,
    };
    edges.push(edge);
  });

  // Build connection arrays
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

  return { nodes, edges };
}

// Main export function
function exportGraph(): void {
  const dbPath = join(ROOT, "GrappleMap", "GrappleMap.txt");
  const outputPath = join(ROOT, "client", "public", "data", "library", "admin", "graph.json");

  console.log("Loading graph from", dbPath);
  const { nodes, edges } = loadGraph(dbPath);

  // Strip position data from nodes to reduce file size (keep only metadata and connections)
  const exportNodes = nodes.map((node) => ({
    id: node.id,
    name: node.name,
    desc_lines: node.desc_lines,
    tags: node.tags,
    properties: node.properties,
    line: node.line,
    incoming: node.incoming,
    outgoing: node.outgoing,
  }));

  // Strip frame data from edges to reduce file size
  const exportEdges = edges.map((edge) => ({
    id: edge.id,
    name: edge.name,
    desc_lines: edge.desc_lines,
    tags: edge.tags,
    properties: edge.properties,
    line: edge.line,
    frameCount: edge.frameCount,
    from: edge.from,
    to: edge.to,
    bidirectional: edge.bidirectional,
    detailed: edge.detailed,
  }));

  const graph: Graph = {
    meta: {
      exportedAt: new Date().toISOString(),
      source: "GrappleMap.txt",
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
    nodes: exportNodes,
    edges: exportEdges,
  };

  writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  console.log(`Exported ${nodes.length} nodes and ${edges.length} edges to ${outputPath}`);

  // Print some statistics
  const namedNodes = nodes.filter((n) => n.name !== "(unnamed)").length;
  const unnamedNodes = nodes.length - namedNodes;
  console.log(`  - Named nodes: ${namedNodes}`);
  console.log(`  - Unnamed nodes: ${unnamedNodes}`);
  console.log(`  - Bidirectional edges: ${edges.filter((e) => e.bidirectional).length}`);
  console.log(`  - Detailed edges: ${edges.filter((e) => e.detailed).length}`);
}

// Run export
exportGraph();
