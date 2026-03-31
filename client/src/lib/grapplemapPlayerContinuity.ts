import {
  stabilizeSequenceFrames as stabilizeSequenceFramesCanonical,
  stabilizeSequencePayload as stabilizeSequencePayloadCanonical,
} from "@grapplemap-preview/playerContinuity.js";

export type SequencePayload = {
  frames: number[][][][];
  markers?: Array<{ name: string; frame: number; type?: string }>;
  posterFrame?: number;
  meta?: unknown;
};

export function stabilizeSequenceFrames(
  frames: number[][][][],
  markers?: Array<{ frame: number }> | undefined,
): number[][][][] {
  return stabilizeSequenceFramesCanonical(frames, markers) as number[][][][];
}

/** @deprecated Prefer stabilizeSequenceFrames(frames, markers) when markers exist. */
export function stabilizePlayerRoles(frames: number[][][][]): number[][][][] {
  return stabilizeSequenceFrames(frames);
}

export function stabilizeSequencePayload<T extends SequencePayload>(data: T | null | undefined): T | null | undefined {
  return stabilizeSequencePayloadCanonical(data) as T | null | undefined;
}
