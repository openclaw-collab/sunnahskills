import React, { Suspense } from "react";
import { MannequinViewer } from "./MannequinScene";

type TechniqueViewerProps = {
  className?: string;
  sequencePath?: string;
};

export function TechniqueViewer({ className, sequencePath }: TechniqueViewerProps) {
  return (
    <Suspense fallback={null}>
      <MannequinViewer className={className} sequencePath={sequencePath} />
    </Suspense>
  );
}

