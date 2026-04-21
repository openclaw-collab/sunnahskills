import React, { useEffect, useMemo, useRef, useState } from "react";

export const QUALITY_PRESETS = {
  draft: { fps: 30, bitrate: 1_000_000 },
  social: { fps: 30, bitrate: 4_000_000 },
  hd: { fps: 60, bitrate: 10_000_000 },
  max: { fps: 60, bitrate: 24_000_000 },
};

export type CameraPathPreset = "static" | "orbit" | "push-in" | "swoop" | "overhead";

export interface CameraKeyframe {
  t: number;
  position: [number, number, number];
  target?: [number, number, number];
  fov?: number;
}

export interface CameraPathOptions {
  preset?: CameraPathPreset;
  keyframes?: CameraKeyframe[];
  distance?: number;
  height?: number;
  orbitDegrees?: number;
}

export interface RecordOptions {
  duration?: number;
  quality?: keyof typeof QUALITY_PRESETS;
  fps?: number;
  bitrate?: number;
  download?: boolean;
  filename?: string;
  cameraPath?: CameraPathOptions;
}

interface AgentVideoRecorderProps {
  scene: { frames: unknown[] };
  fps?: number;
  autoStartRecording?: boolean;
  recordOptions?: RecordOptions;
  onRecordComplete?: (blob: Blob) => void;
  children?: React.ReactNode;
}

function chooseMimeType() {
  const candidates = [
    "video/mp4;codecs=h264",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return candidates.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) || "";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function findCanvas(container: HTMLElement | null) {
  return container?.querySelector("canvas") as HTMLCanvasElement | null;
}

function RecordingControls({
  ready,
  onRecord,
}: {
  ready: boolean;
  onRecord: (options: RecordOptions) => Promise<Blob | null>;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [quality, setQuality] = useState<keyof typeof QUALITY_PRESETS>("hd");
  const [duration, setDuration] = useState(10);

  async function handleRecord() {
    if (isRecording || !ready) return;
    setIsRecording(true);
    try {
      await onRecord({ quality, duration, download: true });
    } catch (error) {
      console.error("Recording failed:", error);
    } finally {
      setIsRecording(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.8)",
        padding: "12px 20px",
        borderRadius: 8,
        display: "flex",
        gap: 12,
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <select
        value={quality}
        onChange={(event) => setQuality(event.target.value as keyof typeof QUALITY_PRESETS)}
        style={{ padding: "8px 12px", borderRadius: 4 }}
        disabled={isRecording}
      >
        <option value="draft">Draft</option>
        <option value="social">Social</option>
        <option value="hd">HD</option>
        <option value="max">Max</option>
      </select>

      <input
        type="number"
        value={duration}
        onChange={(event) => setDuration(Number(event.target.value))}
        min={1}
        max={300}
        style={{ width: 72, padding: "8px", borderRadius: 4 }}
        disabled={isRecording}
      />
      <span style={{ color: "white" }}>sec</span>

      <button
        onClick={handleRecord}
        disabled={isRecording || !ready}
        style={{
          padding: "8px 24px",
          borderRadius: 4,
          background: isRecording ? "#666" : "#e74c3c",
          color: "white",
          border: "none",
          cursor: isRecording ? "wait" : "pointer",
          fontWeight: "bold",
        }}
      >
        {isRecording ? "Recording..." : "Record"}
      </button>
    </div>
  );
}

export function AgentVideoRecorder({
  scene,
  fps = 60,
  autoStartRecording = false,
  recordOptions = {},
  onRecordComplete,
  children,
}: AgentVideoRecorderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAutoRecorded = useRef(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [cameraPath, setCameraPath] = useState<CameraPathOptions | null>(recordOptions.cameraPath ?? null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setCanvasReady(Boolean(findCanvas(containerRef.current))));
    return () => cancelAnimationFrame(raf);
  }, [scene.frames.length, children]);

  async function recordCanvas(options: RecordOptions = {}) {
    const canvas = findCanvas(containerRef.current);
    if (!canvas) throw new Error("GrappleMap canvas is not ready.");

    const mergedOptions = { ...recordOptions, ...options };
    const preset = QUALITY_PRESETS[mergedOptions.quality || "hd"];
    const duration = Math.max(0.25, Math.min(300, Number(mergedOptions.duration || 10)));
    const fpsValue = Math.max(1, Math.min(120, Number(mergedOptions.fps || preset.fps || fps)));
    const bitrate = Math.max(250_000, Number(mergedOptions.bitrate || preset.bitrate));
    const mimeType = chooseMimeType();
    if (!mimeType) throw new Error("This browser cannot record canvas video.");

    if (mergedOptions.cameraPath) {
      setCameraPath(mergedOptions.cameraPath);
      window.dispatchEvent(new CustomEvent("grapplemap-camera-path", { detail: mergedOptions.cameraPath }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    const stream = canvas.captureStream(fpsValue);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data);
      };
      recorder.onerror = () => reject(recorder.error ?? new Error("Canvas recording failed."));
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunks, { type: mimeType }));
      };
      recorder.start(100);
      window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, duration * 1000);
    });

    if (mergedOptions.download !== false) {
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      downloadBlob(blob, mergedOptions.filename || `grapplemap-${Date.now()}.${extension}`);
    }

    onRecordComplete?.(blob);
    if (window.self !== window.top) {
      window.parent.postMessage(
        { type: "grapplemap-record-complete", mimeType: blob.type, size: blob.size },
        "*",
      );
    }
    return blob;
  }

  useEffect(() => {
    (window as any).grapplemapRecord = async (options: RecordOptions = {}) => {
      try {
        return await recordCanvas(options);
      } catch (error) {
        console.error("Recording failed:", error);
        return null;
      }
    };
    (window as any).grapplemapSetCameraPath = (nextCameraPath: CameraPathOptions) => {
      setCameraPath(nextCameraPath);
      window.dispatchEvent(new CustomEvent("grapplemap-camera-path", { detail: nextCameraPath }));
      return nextCameraPath;
    };
    return () => {
      delete (window as any).grapplemapRecord;
      delete (window as any).grapplemapSetCameraPath;
    };
  }, [recordOptions, canvasReady]);

  useEffect(() => {
    const recordListener = (event: CustomEvent<RecordOptions>) => {
      void (window as any).grapplemapRecord?.(event.detail);
    };
    const cameraListener = (event: CustomEvent<CameraPathOptions>) => {
      setCameraPath(event.detail);
    };
    window.addEventListener("grapplemap-record", recordListener as EventListener);
    window.addEventListener("grapplemap-camera-path", cameraListener as EventListener);
    return () => {
      window.removeEventListener("grapplemap-record", recordListener as EventListener);
      window.removeEventListener("grapplemap-camera-path", cameraListener as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!canvasReady || hasAutoRecorded.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("record") !== "true" || !autoStartRecording) return;

    hasAutoRecorded.current = true;
    const cameraPreset = params.get("camera") as CameraPathPreset | null;
    void (window as any).grapplemapRecord?.({
      duration: Number(params.get("duration") || 10),
      quality: (params.get("quality") || "hd") as keyof typeof QUALITY_PRESETS,
      cameraPath: cameraPreset ? { preset: cameraPreset } : undefined,
      download: true,
    });
  }, [canvasReady, autoStartRecording]);

  const enhancedChildren = useMemo(() => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child as React.ReactElement<any>, { cameraPath });
    });
  }, [children, cameraPath]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {enhancedChildren}
      <RecordingControls ready={canvasReady} onRecord={recordCanvas} />
    </div>
  );
}

export default AgentVideoRecorder;
