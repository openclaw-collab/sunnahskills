import {
  buildSequenceFromGrappleMapText as buildSequenceFromGrappleMapTextCanonical,
  buildSequencePayloadFromGrappleMapText as buildSequencePayloadFromGrappleMapTextCanonical,
  parseFlatIndexLists as parseFlatIndexListsCanonical,
  parseFlatSpec as parseFlatSpecCanonical,
  PREDEFINED_SEQUENCES as PREDEFINED_SEQUENCES_CANONICAL,
  stabilizeSequenceFrames as stabilizeSequenceFramesCanonical,
} from "../GrappleMap/scripts/grapplemap-sequence-core.js";

export type FlatSpecItem = { type: "position" | "transition"; id: number; reverse?: boolean };
export type GrappleMapGraphPathStep = FlatSpecItem;

export type ExtractedMarker = {
  name: string;
  frame: number;
  type: "position" | "transition";
};

export type GrappleMapDiagnostic = {
  type: string;
  id: number;
  stepType: "position" | "transition";
  message: string;
  relatedId?: number;
};

type ParsedFlatIndexLists = {
  positions: Array<{ id: number; name: string; data: string[]; line: number }>;
  transitions: Array<{ id: number; name: string; frames: string[][]; frameCount: number; line: number }>;
};

export const PREDEFINED_SEQUENCES = PREDEFINED_SEQUENCES_CANONICAL as Record<string, FlatSpecItem[]>;

export function serializeGraphPathSpec(spec: GrappleMapGraphPathStep[]) {
  return spec
    .map((step) =>
      step.type === "position" ? `p${step.id}` : `t${step.id}${step.reverse ? "r" : ""}`,
    )
    .join(", ");
}

export function parseFlatSpec(spec: string | FlatSpecItem[]) {
  return parseFlatSpecCanonical(spec) as FlatSpecItem[];
}

export function parseFlatIndexLists(text: string) {
  return parseFlatIndexListsCanonical(text) as ParsedFlatIndexLists;
}

export function stabilizeSequenceFrames(
  frames: number[][][][],
  markers?: Array<{ frame: number }>,
) {
  return stabilizeSequenceFramesCanonical(frames, markers) as number[][][][];
}

export function buildSequenceFromGrappleMapText(
  text: string,
  spec: FlatSpecItem[],
): { frames: number[][][][]; markers: ExtractedMarker[]; diagnostics?: GrappleMapDiagnostic[] } {
  return buildSequenceFromGrappleMapTextCanonical(text, spec) as {
    frames: number[][][][];
    markers: ExtractedMarker[];
    diagnostics?: GrappleMapDiagnostic[];
  };
}

export function buildSequencePayloadFromGrappleMapText(
  name: string,
  text: string,
  spec: FlatSpecItem[],
  extractedAt?: string,
) {
  return buildSequencePayloadFromGrappleMapTextCanonical(name, text, spec, extractedAt) as {
    meta: {
      name: string;
      extractedAt: string;
      totalFrames: number;
      positions: number;
      transitions: number;
    };
    markers: ExtractedMarker[];
    frames: number[][][][];
    diagnostics?: GrappleMapDiagnostic[];
  };
}
