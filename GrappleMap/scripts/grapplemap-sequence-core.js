import {
  parseFlatIndexLists,
  parseSpec,
  SEQUENCES,
  stabilizeSequenceFrames,
} from "./sequence-extractor.js";
import {
  buildSequenceFromGraphText,
  buildSequencePayloadFromGraphText,
} from "./grapplemap-graph-core.js";

export const PREDEFINED_SEQUENCES = SEQUENCES;

export function parseFlatSpec(spec) {
  if (Array.isArray(spec)) {
    return spec;
  }
  return parseSpec(spec);
}

export function buildSequenceFromGrappleMapText(text, spec) {
  const { frames, markers } = buildSequenceFromGraphText(text, spec);
  const stabilized = frames.length >= 2 ? stabilizeSequenceFrames(frames, markers) : frames;
  return { frames: stabilized, markers };
}

export function buildSequencePayloadFromGrappleMapText(name, text, spec, extractedAt) {
  const payload = buildSequencePayloadFromGraphText(name, text, spec, extractedAt ? { extractedAt } : undefined);
  const stabilized = payload.frames.length >= 2 ? stabilizeSequenceFrames(payload.frames, payload.markers) : payload.frames;
  return {
    ...payload,
    frames: stabilized,
    meta: {
      ...payload.meta,
      totalFrames: stabilized.length,
    },
  };
}

export {
  parseFlatIndexLists,
  stabilizeSequenceFrames,
};
