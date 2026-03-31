/**
 * Playback speed for GrappleMap Uchimata card + shared compact overlay.
 * UI "1×" maps to this base so motion matches GrappleMap SequenceBuilder defaults (~4–8 feel).
 */
export const GRAPPLEMAP_PLAYBACK_SPEED_BASE = 4;

export function grapplemapEngineSpeed(uiMultiplier: number): number {
  return uiMultiplier * GRAPPLEMAP_PLAYBACK_SPEED_BASE;
}
