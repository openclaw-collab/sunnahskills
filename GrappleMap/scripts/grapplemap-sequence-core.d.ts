export type FlatSpecItem = { type: "position" | "transition"; id: number };
export type ExtractedMarker = {
  name: string;
  frame: number;
  type: "position" | "transition";
};

export const PREDEFINED_SEQUENCES: Record<string, FlatSpecItem[]>;

export function parseFlatSpec(spec: string | FlatSpecItem[]): FlatSpecItem[];
export function parseFlatIndexLists(text: string): {
  positions: Array<{ id: number; name: string; data: string[]; line: number }>;
  transitions: Array<{ id: number; name: string; frames: string[][]; frameCount: number; line: number }>;
};
export function stabilizeSequenceFrames(
  frames: number[][][][],
  markers?: Array<{ frame: number }>,
): number[][][][];
export function buildSequenceFromGrappleMapText(
  text: string,
  spec: FlatSpecItem[],
): { frames: number[][][][]; markers: ExtractedMarker[] };
export function buildSequencePayloadFromGrappleMapText(
  name: string,
  text: string,
  spec: FlatSpecItem[],
  extractedAt?: string,
): {
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
