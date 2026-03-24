import React, { Suspense } from "react";
import { MannequinViewer } from "./MannequinScene";
import type { Marker } from "@/lib/grapplemap-types";

type TechniqueViewerProps = {
  className?: string;
  sequencePath?: string;
  sequenceData?: { frames: number[][][][]; markers?: Marker[] };
  onThumbnailReady?: (dataUrl: string) => void;
  controlsMode?: "none" | "ridges";
  autoplay?: boolean;
};

export function TechniqueViewer({
  className,
  sequencePath,
  sequenceData,
  onThumbnailReady,
  controlsMode = "ridges",
  autoplay = true,
}: TechniqueViewerProps) {
  return (
    <Suspense fallback={null}>
      <MannequinViewer
        className={className}
        sequencePath={sequencePath}
        sequenceData={sequenceData}
        onThumbnailReady={onThumbnailReady}
        controlsMode={controlsMode}
        autoplay={autoplay}
      />
    </Suspense>
  );
}
