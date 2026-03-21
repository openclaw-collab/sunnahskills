import React, { Suspense } from "react";
import { MannequinViewer } from "./MannequinScene";
import type { Marker } from "@/lib/grapplemap-types";

type TechniqueViewerProps = {
  className?: string;
  sequencePath?: string;
  sequenceData?: { frames: number[][][][]; markers?: Marker[] };
  onThumbnailReady?: (dataUrl: string) => void;
};

export function TechniqueViewer({ className, sequencePath, sequenceData, onThumbnailReady }: TechniqueViewerProps) {
  return (
    <Suspense fallback={null}>
      <MannequinViewer
        className={className}
        sequencePath={sequencePath}
        sequenceData={sequenceData}
        onThumbnailReady={onThumbnailReady}
      />
    </Suspense>
  );
}
