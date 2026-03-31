import React, { Suspense } from "react";
import { GrappleMapPreviewViewer } from "./GrappleMapPreviewRenderer";
import type { Marker } from "@/lib/grapplemap-types";

type TechniqueViewerProps = {
  className?: string;
  sequencePath?: string;
  sequenceData?: { frames: number[][][][]; markers?: Marker[] };
  onThumbnailReady?: (dataUrl: string) => void;
  controlsMode?: "none" | "ridges" | "compact";
  autoplay?: boolean;
};

export function TechniqueViewer({
  className,
  sequencePath,
  sequenceData,
  onThumbnailReady,
  controlsMode = "ridges",
  autoplay = false,
}: TechniqueViewerProps) {
  return (
    <Suspense fallback={null}>
      <GrappleMapPreviewViewer
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
