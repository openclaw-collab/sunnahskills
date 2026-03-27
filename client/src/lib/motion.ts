export const DEFAULT_MOTION_SPEED_MULTIPLIER = 3;

export function motionTime(seconds: number) {
  return Number((seconds / DEFAULT_MOTION_SPEED_MULTIPLIER).toFixed(3));
}
