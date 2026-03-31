declare module "@grapplemap-preview/UchimataCardHuman.jsx" {
  import type { CSSProperties } from "react";

  export type UchimataScene = { frames: number[][][][] };

  type UchimataCardProps = {
    className?: string;
    style?: CSSProperties;
    playbackSpeed?: number;
    autoRotate?: boolean;
    cameraPosition?: [number, number, number];
    scene?: UchimataScene;
    onFrame?: (idx: number) => void;
    showStats?: boolean;
    isPlaying?: boolean;
    isLooping?: boolean;
    timeRef?: { current: number } | null;
  };

  export default function UchimataCard(props: UchimataCardProps): JSX.Element;
}
