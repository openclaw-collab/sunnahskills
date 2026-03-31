/**
 * Wraps the exact GrappleMap preview renderer (`UchimataCardHuman.jsx`) and loads sequences
 * from `sequencePath` / `sequenceData` like the rest of the app.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import UchimataCard from "@grapplemap-preview/UchimataCardHuman.jsx";
import {
  GrappleMapPlaybackOverlay,
  loadGrappleMapSequence,
  type GrappleMapPlaybackState,
  type GrappleMapSequenceData,
} from "./MannequinScene";
import { stabilizeSequencePayload } from "@/lib/grapplemapPlayerContinuity";
import { grapplemapEngineSpeed } from "@/lib/grapplemapPlayback";
import { DEFAULT_HOME_TECHNIQUE_SEQUENCE_PATH } from "@/lib/launchTechniques";

export function GrappleMapPreviewViewer({
  className = "",
  style,
  playbackSpeed: playbackSpeedProp = grapplemapEngineSpeed(1),
  autoRotate = false,
  cameraPosition = [5, 3.5, 5],
  sequencePath = DEFAULT_HOME_TECHNIQUE_SEQUENCE_PATH,
  sequenceData,
  onFrame,
  showStats = false,
  controlsMode = "ridges",
  autoplay = false,
  isLooping = true,
  onThumbnailReady,
}: {
  className?: string;
  style?: React.CSSProperties;
  playbackSpeed?: number;
  autoRotate?: boolean;
  cameraPosition?: [number, number, number];
  sequencePath?: string;
  sequenceData?: GrappleMapSequenceData;
  onFrame?: (idx: number) => void;
  showStats?: boolean;
  controlsMode?: "none" | "ridges" | "compact";
  autoplay?: boolean;
  isLooping?: boolean;
  onThumbnailReady?: (dataUrl: string) => void;
}) {
  const [data, setData] = useState<GrappleMapSequenceData | null>(null);
  // Use refs for playback state to avoid React re-renders during animation
  const isPlayingRef = useRef(autoplay);
  const playbackSpeedRef = useRef(playbackSpeedProp);
  const playbackRef = useRef<GrappleMapPlaybackState>({ paused: !autoplay, speed: grapplemapEngineSpeed(1), timeRef: null });
  const wrapRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const thumbnailCaptured = useRef(false);
  // Force minimal re-renders only for UI state that must be reflected
  const [, forceRender] = useState({});

  // Keep refs in sync with props (no re-render needed)
  useEffect(() => {
    playbackSpeedRef.current = playbackSpeedProp;
    playbackRef.current.speed = grapplemapEngineSpeed(playbackSpeedProp);
  }, [playbackSpeedProp]);

  useEffect(() => {
    isPlayingRef.current = autoplay;
    playbackRef.current.paused = !autoplay;
    // Only force render for UI button state change
    forceRender({});
  }, [autoplay]);

  useEffect(() => {
    playbackRef.current.timeRef = timeRef;
    return () => {
      if (playbackRef.current.timeRef === timeRef) {
        playbackRef.current.timeRef = null;
      }
    };
  }, [playbackRef]);

  // Load sequence data
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      if (sequenceData?.frames?.length) {
        const next = stabilizeSequencePayload({ ...sequenceData }) as GrappleMapSequenceData;
        if (!cancelled && next) setData(next);
        return;
      }
      if (!sequencePath) {
        if (!cancelled) setData(null);
        return;
      }
      const json = await loadGrappleMapSequence(sequencePath, ac.signal);
      if (!cancelled && json) {
        const next = stabilizeSequencePayload(json) as GrappleMapSequenceData;
        if (next) setData(next);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [sequenceData, sequencePath]);

  const frames = data?.frames ?? [];
  const hasApiFrames = frames.length > 0;
  /** Omit `scene` so `UchimataCard` uses bundled `scenes.json` default (same as GrappleMap preview). */
  const uchimataKey = hasApiFrames ? (sequencePath ?? (sequenceData ? "sequenceData" : "loaded")) : "bundled";

  useEffect(() => {
    thumbnailCaptured.current = false;
  }, [uchimataKey]);

  useEffect(() => {
    if (!onThumbnailReady || thumbnailCaptured.current) return;
    const timer = setTimeout(() => {
      if (thumbnailCaptured.current) return;
      const root = wrapRef.current;
      const canvas = root?.querySelector("canvas");
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        thumbnailCaptured.current = true;
        onThumbnailReady(dataUrl);
      } catch {
        // ignore
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [onThumbnailReady, uchimataKey]);

  // Toggle playback without triggering full re-render
  const togglePlayback = useCallback(() => {
    isPlayingRef.current = !isPlayingRef.current;
    playbackRef.current.paused = !isPlayingRef.current;
    // Only force render for UI button state
    forceRender({});
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      <UchimataCard
        key={uchimataKey}
        className=""
        playbackSpeed={playbackSpeedRef.current}
        autoRotate={autoRotate}
        cameraPosition={cameraPosition}
        {...(hasApiFrames ? { scene: { frames } } : {})}
        onFrame={onFrame}
        showStats={showStats}
        isPlaying={isPlayingRef.current}
        isLooping={isLooping}
        timeRef={timeRef}
        playbackStateRef={playbackRef}
        style={{ height: "100%", width: "100%" }}
      />

      {controlsMode === "ridges" ? (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            togglePlayback();
          }}
          aria-label={isPlayingRef.current ? "Pause technique animation" : "Play technique animation"}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 bg-charcoal/78 text-cream/75 shadow-[0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur-sm transition hover:border-moss/45 hover:text-cream"
          style={{ pointerEvents: "all" }}
        >
          {isPlayingRef.current ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
        </button>
      ) : null}

      <GrappleMapPlaybackOverlay
        sequencePath={sequencePath}
        sequenceData={sequenceData}
        playbackRef={playbackRef}
        controlsMode={controlsMode}
        isPlaying={isPlayingRef.current}
        onTogglePlayback={togglePlayback}
        onPlaybackSpeedChange={(speed) => {
          playbackSpeedRef.current = speed;
          playbackRef.current.speed = speed;
          forceRender({});
        }}
      />
    </div>
  );
}
