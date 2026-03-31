export function stabilizeSequenceFrames(
  frames: number[][][][],
  markers?: Array<{ frame: number }> | undefined,
): number[][][][];

export function stabilizeSequencePayload<T extends { frames?: number[][][][]; markers?: Array<{ frame: number }> }>(
  data: T | null | undefined,
): T | null | undefined;
