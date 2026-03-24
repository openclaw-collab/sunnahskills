#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadGraph } from "../GrappleMap/scripts/grapplemap-loader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ADMIN_LIBRARY_DIR = join(ROOT, "client", "public", "data", "library", "admin");

const POSITION_FAMILIES = [
  "mount",
  "back",
  "back_control",
  "side_control",
  "north_south",
  "knee_on_belly",
  "closed_guard",
  "full_guard",
  "half_guard",
  "quarter_guard",
  "open_guard",
  "butterfly",
  "x_guard",
  "single_leg_x",
  "de_la_riva",
  "reverse_dlr",
  "turtle",
  "dogfight",
  "standing",
  "front_headlock",
  "body_lock",
  "seatbelt",
  "north_south",
];

const GENERIC_TAGS = new Set([
  "top",
  "bottom",
  "top_kneeling",
  "top_seated",
  "top_on_side",
  "bottom_supine",
  "bottom_seated",
  "bottom_on_side",
  "bottom_turned_in",
  "bottom_turned_away",
  "top_post_hand",
  "bottom_post_hand",
  "bottom_post_elbow",
  "top_posture_broken",
  "engaged_butterfly",
]);

const KEYWORD_TAGS = [
  "armbar",
  "arm_triangle",
  "americana",
  "kimura",
  "guillotine",
  "triangle",
  "omoplata",
  "monoplata",
  "darce",
  "anaconda",
  "crossface",
  "underhook",
  "overhook",
  "whizzer",
  "seatbelt",
  "body_lock",
  "arm_drag",
  "leg_drag",
  "knee_slice",
  "butterfly_sweep",
  "sweep",
  "pass",
  "guard_pass",
  "escape",
  "takedown",
  "single_leg",
  "double_leg",
  "collar_tie",
  "arm_drag",
  "north_south",
  "twister",
  "lockdown",
  "front_headlock",
  "hip_bump",
  "head_and_arm",
  "seatbelt",
  "rear_naked_choke",
  "mount",
  "s_mount",
  "technical_mount",
];

const TAG_ALIASES = {
  rear_naked_choke: "rnc",
  double_leg_takedown: "double_leg",
  single_leg_takedown: "single_leg",
  twister_side: "twister",
  t_rex: "t_rex",
  full_guard: "closed_guard",
};

function titleize(value) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLabelSource(value = "") {
  return value
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/w\//gi, "with ")
    .replace(/\bctrl\b/gi, "control")
    .replace(/¼/g, "quarter")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeLabelSource(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function displayName(value) {
  return titleize(normalizeLabelSource(value));
}

function isUnnamedLabel(value = "") {
  const normalized = normalizeLabelSource(value).toLowerCase();
  return !normalized || normalized === "(unnamed)" || normalized === "unnamed" || normalized === "...";
}

function pickFamily(tags = [], name = "") {
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  for (const family of POSITION_FAMILIES) {
    if (normalizedTags.includes(family)) return family;
  }

  const normalizedName = normalizeLabelSource(name).toLowerCase();
  for (const family of POSITION_FAMILIES) {
    if (normalizedName.includes(family.replace(/_/g, " "))) return family;
  }

  return "mixed";
}

function inferRole(tags = []) {
  if (tags.some((tag) => tag.startsWith("top_"))) return "top";
  if (tags.some((tag) => tag.startsWith("bottom_"))) return "bottom";
  return "neutral";
}

function normalizeTags(tags = []) {
  return [...new Set(tags.filter(Boolean).map((tag) => TAG_ALIASES[tag.toLowerCase()] || tag.toLowerCase()))];
}

function importantTags(tags = [], name = "", properties = []) {
  const normalizedName = normalizeLabelSource(name).toLowerCase();
  const tagList = normalizeTags(tags);
  const picked = [];

  for (const tag of tagList) {
    if (GENERIC_TAGS.has(tag)) continue;
    if (POSITION_FAMILIES.includes(tag) || KEYWORD_TAGS.includes(tag)) {
      picked.push(tag);
    }
  }

  for (const keyword of KEYWORD_TAGS) {
    if (normalizedName.includes(keyword.replace(/_/g, " "))) {
      picked.push(keyword);
    }
  }

  properties.forEach((property) => picked.push(property.toLowerCase()));

  return [...new Set(picked)].slice(0, 6);
}

function buildRouteLabel(fromName, toName) {
  const fromLabel = fromName ? displayName(fromName) : "Unknown start";
  const toLabel = toName ? displayName(toName) : "Unknown finish";
  return `${fromLabel} -> ${toLabel}`;
}

function cleanTransitionName(name, fromName, toName, routeTags = []) {
  const trimmed = normalizeLabelSource(name);
  if (!trimmed || trimmed === "..." || trimmed.toLowerCase() === "(unnamed)") {
    if (routeTags.length > 0 && fromName && toName) {
      return `${titleize(routeTags[0])}: ${buildRouteLabel(fromName, toName)}`;
    }
    return buildRouteLabel(fromName, toName);
  }
  return displayName(trimmed);
}

function buildContextualNodeName(node, edgeById) {
  const family = pickFamily(node.tags, node.name);
  const familyLabel = family !== "mixed" ? titleize(family) : "Transition";

  const incomingTransition = (node.incoming ?? [])
    .map((step) => edgeById.get(step.transition))
    .find((edge) => edge && !isUnnamedLabel(edge.name));
  const outgoingTransition = (node.outgoing ?? [])
    .map((step) => edgeById.get(step.transition))
    .find((edge) => edge && !isUnnamedLabel(edge.name));

  const incomingName = incomingTransition ? displayName(incomingTransition.name) : "";
  const outgoingName = outgoingTransition ? displayName(outgoingTransition.name) : "";

  if (incomingName && outgoingName) {
    return `${familyLabel} after ${incomingName}`;
  }
  if (incomingName) {
    return `${familyLabel} finish after ${incomingName}`;
  }
  if (outgoingName) {
    return `${familyLabel} setup for ${outgoingName}`;
  }
  return `${familyLabel} continuation ${node.id}`;
}

function createPositionSummary(node, edgeById) {
  const resolvedName = isUnnamedLabel(node.name) ? buildContextualNodeName(node, edgeById) : node.name;
  const family = pickFamily(node.tags, resolvedName);
  const role = inferRole(node.tags);
  const keyTags = importantTags(node.tags, resolvedName, node.properties);
  const tags = [...new Set([family, role, ...normalizeTags(node.tags), ...keyTags].filter((tag) => tag && tag !== "neutral"))];

  return {
    id: `position-${node.id}`,
    sourceId: node.id,
    graphNodeId: node.id,
    libraryType: "position",
    name: resolvedName,
    displayName: displayName(resolvedName),
    slug: slugify(resolvedName || `position-${node.id}`),
    tags,
    props: node.properties ?? [],
    frameCount: 9,
    incomingCount: node.incoming.length,
    outgoingCount: node.outgoing.length,
    family,
    role,
    routeLabel: displayName(resolvedName),
    composerTitle: displayName(resolvedName),
    composerSubtitle: `${node.outgoing.length} outgoing routes • ${node.incoming.length} incoming routes`,
    searchTerms: [...new Set([displayName(resolvedName), ...tags, ...(node.properties ?? [])])],
    previewPath: `/data/library/admin/positions/position-${node.id}.json`,
  };
}

function createTransitionSummary(edge, positionSummaryById, nodeById) {
  const fromNodeId = edge.from?.node ?? null;
  const toNodeId = edge.to?.node ?? null;
  const fromNode = fromNodeId != null ? nodeById.get(fromNodeId) : null;
  const toNode = toNodeId != null ? nodeById.get(toNodeId) : null;
  const fromSummary = fromNodeId != null ? positionSummaryById.get(fromNodeId) : null;
  const toSummary = toNodeId != null ? positionSummaryById.get(toNodeId) : null;
  const fromLabel = fromSummary?.displayName ?? "";
  const toLabel = toSummary?.displayName ?? "";
  const fromFamily = fromSummary?.family ?? pickFamily(fromNode?.tags, fromNode?.name);
  const toFamily = toSummary?.family ?? pickFamily(toNode?.tags, toNode?.name);
  const role = inferRole(edge.tags);
  const keyTags = importantTags(edge.tags, edge.name, edge.properties);
  const routeLabel = buildRouteLabel(fromLabel, toLabel);
  const tags = [
    ...new Set([
      fromFamily,
      toFamily,
      role,
      ...normalizeTags(edge.tags),
      ...(fromNode ? normalizeTags(fromNode.tags) : []),
      ...(toNode ? normalizeTags(toNode.tags) : []),
      ...keyTags,
      ...(edge.properties ?? []),
    ].filter((tag) => tag && tag !== "neutral" && tag !== "mixed")),
  ];
  const display = cleanTransitionName(edge.name, fromLabel || "start", toLabel || "finish", keyTags);

  return {
    id: `transition-${edge.id}`,
    sourceId: edge.id,
    graphTransitionId: edge.id,
    libraryType: "transition",
    name: edge.name,
    displayName: display,
    slug: slugify(edge.name && edge.name !== "..." ? edge.name : `transition-${edge.id}`),
    tags,
    props: edge.properties ?? [],
    frameCount: edge.frameCount,
    fromNodeId,
    toNodeId,
    fromName: fromLabel,
    toName: toLabel,
    fromDisplayName: fromLabel,
    toDisplayName: toLabel,
    fromFamily,
    toFamily,
    role,
    bidirectional: Boolean(edge.bidirectional),
    routeLabel,
    composerTitle: display,
    composerSubtitle: `From ${fromLabel || "unknown start"} to ${toLabel || "unknown finish"}`,
    searchTerms: [...new Set([display, routeLabel, fromLabel, toLabel, fromNode?.name ?? "", toNode?.name ?? "", ...tags, ...(edge.properties ?? [])])],
    previewPath: `/data/library/admin/transitions/transition-${edge.id}.json`,
  };
}

function main() {
  const graph = loadGraph(join(ROOT, "GrappleMap", "GrappleMap.txt"));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edgeById = new Map(graph.edges.map((edge) => [edge.id, edge]));

  const positions = graph.nodes.map((node) => createPositionSummary(node, edgeById));
  const positionSummaryById = new Map(positions.map((node) => [node.graphNodeId, node]));
  const transitions = graph.edges.map((edge) => createTransitionSummary(edge, positionSummaryById, nodeById));

  writeFileSync(
    join(ADMIN_LIBRARY_DIR, "positions.json"),
    JSON.stringify({ positions }, null, 2),
  );

  writeFileSync(
    join(ADMIN_LIBRARY_DIR, "transitions.json"),
    JSON.stringify({ transitions }, null, 2),
  );

  console.log(`Wrote ${positions.length} positions and ${transitions.length} transitions to admin library.`);
}

main();
