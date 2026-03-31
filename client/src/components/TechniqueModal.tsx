import React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";

type SceneMeta = {
  transitionId?: number;
  name: string;
  tags?: string[];
  description: string[];
  dataPath: string;
  startingPosition?: string;
  endingPosition?: string;
  source?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
};

type SceneEntry = {
  id: string;
  meta: SceneMeta;
};

type TechniqueModalProps = {
  scene: SceneEntry | null;
  mode: "default" | "fullscreen";
  onClose: () => void;
  onModeChange: (mode: "default" | "fullscreen") => void;
};

export function TechniqueModal({ scene, mode, onClose, onModeChange }: TechniqueModalProps) {
  if (!scene) return null;

  return (
    <Dialog open={!!scene} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={[
          "bg-charcoal border-moss/20 flex flex-col p-0 text-cream",
          mode === "fullscreen"
            ? "w-screen h-screen max-w-none max-h-none rounded-none border-0"
            : "max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh]",
          "[&>button:last-child]:text-cream/60 [&>button:last-child]:hover:text-cream [&>button:last-child]:ring-0",
        ].join(" ")}
      >
        <DialogTitle className="sr-only">{scene.meta.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {mode === "fullscreen" ? "Fullscreen" : "Expanded"} technique viewer for {scene.meta.name}.
        </DialogDescription>
        <div className="flex items-center justify-between px-6 py-4 border-b border-moss/15">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-cream text-xl capitalize">{scene.meta.name}</h2>
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.16em] text-cream/45">
              {scene.meta.startingPosition ? <span>{scene.meta.startingPosition}</span> : null}
              {scene.meta.endingPosition ? <span>→ {scene.meta.endingPosition}</span> : null}
              {scene.meta.difficulty ? <span>{scene.meta.difficulty}</span> : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(scene.meta.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-[0.15em] bg-moss/20 text-moss px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onModeChange(mode === "fullscreen" ? "default" : "fullscreen")}
            className="mr-10 inline-flex items-center gap-2 rounded-full border border-moss/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-cream/70 transition-colors hover:border-moss/50 hover:text-cream"
            aria-label={mode === "fullscreen" ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {mode === "fullscreen" ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{mode === "fullscreen" ? "Windowed" : "Fullscreen"}</span>
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <TechniqueViewer className="w-full h-full" sequencePath={scene.meta.dataPath} controlsMode="compact" />
        </div>
        {scene.meta.description.length > 0 && (
          <div className="px-6 py-4 border-t border-moss/15">
            <p className="text-cream/70 text-sm font-body">
              {scene.meta.description.join(" ")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
