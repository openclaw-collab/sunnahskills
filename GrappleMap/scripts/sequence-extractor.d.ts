export type FlatSpecItem = { type: "position" | "transition"; id: number; reverse?: boolean };

export type ExtractedMarker = {
  name: string;
  frame: number;
  type: "position" | "transition";
};

export type GrappleMapSequencePayload = {
  meta: {
    name: string;
    extractedAt: string;
    totalFrames: number;
    positions: number;
    transitions: number;
  };
  markers: ExtractedMarker[];
  frames: number[][][][];
};

export const SEQUENCES: Record<string, FlatSpecItem[]>;

export function parseSpec(spec: string): FlatSpecItem[];
export function decodePosition(chars: string): number[][][];
export function parseFlatIndexLists(text: string): {
  positions: Array<{ id: number; name: string; data: string[]; line: number }>;
  transitions: Array<{ id: number; name: string; frames: string[][]; frameCount: number; line: number }>;
};
export function stabilizeSequenceFrames(
  frames: number[][][][],
  markers?: Array<{ frame: number }> | undefined,
): number[][][][];
export function buildSequenceFromGrappleMapText(
  text: string,
  spec: FlatSpecItem[],
): { frames: number[][][][]; markers: ExtractedMarker[] };
export function buildSequencePayload(
  name: string,
  text: string,
  spec: FlatSpecItem[],
  options?: { extractedAt?: string },
): GrappleMapSequencePayload;
