import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Marker = { name: string; frame: number; type: string };
type SequenceData = { frames: number[][][][]; markers?: Marker[]; posterFrame?: number };

type PlaybackState = {
  paused: boolean;
  speed: number;
  timeRef: React.MutableRefObject<number> | null;
};

const COLOR_ATTACKER = 0x1a1a1a;
const COLOR_ATTACKER_GLOW = 0x4a9eff;
const COLOR_DEFENDER = 0x555555;
const COLOR_DEFENDER_GLOW = 0xffa64a;

const J = {
  LeftToe: 0,
  RightToe: 1,
  LeftHeel: 2,
  RightHeel: 3,
  LeftAnkle: 4,
  RightAnkle: 5,
  LeftKnee: 6,
  RightKnee: 7,
  LeftHip: 8,
  RightHip: 9,
  LeftShoulder: 10,
  RightShoulder: 11,
  LeftElbow: 12,
  RightElbow: 13,
  LeftWrist: 14,
  RightWrist: 15,
  LeftHand: 16,
  RightHand: 17,
  LeftFingers: 18,
  RightFingers: 19,
  Core: 20,
  Neck: 21,
  Head: 22,
} as const;

const HUMAN = {
  shin: { radiusTop: 0.05, radiusBottom: 0.035 },
  thigh: { radiusTop: 0.09, radiusBottom: 0.055 },
  upperArm: { radiusTop: 0.06, radiusBottom: 0.045 },
  forearm: { radiusTop: 0.042, radiusBottom: 0.032 },
} as const;

const ANATOMY_SEGMENTS: Array<{ from: number; to: number; rTop: number; rBot: number }> = [
  { from: J.LeftToe, to: J.LeftHeel, rTop: 0.025, rBot: 0.03 },
  { from: J.LeftHeel, to: J.LeftAnkle, rTop: 0.035, rBot: 0.03 },
  { from: J.LeftAnkle, to: J.LeftKnee, rTop: HUMAN.shin.radiusBottom, rBot: HUMAN.shin.radiusTop },
  { from: J.LeftKnee, to: J.LeftHip, rTop: HUMAN.thigh.radiusBottom, rBot: HUMAN.thigh.radiusTop },
  { from: J.LeftShoulder, to: J.LeftElbow, rTop: HUMAN.upperArm.radiusTop, rBot: HUMAN.upperArm.radiusBottom },
  { from: J.LeftElbow, to: J.LeftWrist, rTop: HUMAN.forearm.radiusTop, rBot: HUMAN.forearm.radiusBottom },
  { from: J.LeftWrist, to: J.LeftHand, rTop: 0.032, rBot: 0.035 },
  { from: J.LeftHand, to: J.LeftFingers, rTop: 0.03, rBot: 0.02 },

  { from: J.RightToe, to: J.RightHeel, rTop: 0.025, rBot: 0.03 },
  { from: J.RightHeel, to: J.RightAnkle, rTop: 0.035, rBot: 0.03 },
  { from: J.RightAnkle, to: J.RightKnee, rTop: HUMAN.shin.radiusBottom, rBot: HUMAN.shin.radiusTop },
  { from: J.RightKnee, to: J.RightHip, rTop: HUMAN.thigh.radiusBottom, rBot: HUMAN.thigh.radiusTop },
  { from: J.RightShoulder, to: J.RightElbow, rTop: HUMAN.upperArm.radiusTop, rBot: HUMAN.upperArm.radiusBottom },
  { from: J.RightElbow, to: J.RightWrist, rTop: HUMAN.forearm.radiusTop, rBot: HUMAN.forearm.radiusBottom },
  { from: J.RightWrist, to: J.RightHand, rTop: 0.032, rBot: 0.035 },
  { from: J.RightHand, to: J.RightFingers, rTop: 0.03, rBot: 0.02 },

  { from: J.LeftHip, to: J.Core, rTop: 0.08, rBot: 0.11 },
  { from: J.RightHip, to: J.Core, rTop: 0.08, rBot: 0.11 },
  { from: J.Core, to: J.LeftShoulder, rTop: 0.09, rBot: 0.075 },
  { from: J.Core, to: J.RightShoulder, rTop: 0.09, rBot: 0.075 },
  { from: J.LeftShoulder, to: J.Neck, rTop: 0.055, rBot: 0.065 },
  { from: J.RightShoulder, to: J.Neck, rTop: 0.055, rBot: 0.065 },
  { from: J.Neck, to: J.Head, rTop: 0.09, rBot: 0.055 },
];

const JOINT_VISUALS: Array<{ j: number; r: number }> = [
  { j: J.LeftToe, r: 0.022 },
  { j: J.RightToe, r: 0.022 },
  { j: J.LeftHeel, r: 0.028 },
  { j: J.RightHeel, r: 0.028 },
  { j: J.LeftAnkle, r: 0.035 },
  { j: J.RightAnkle, r: 0.035 },
  { j: J.LeftKnee, r: 0.05 },
  { j: J.RightKnee, r: 0.05 },
  { j: J.LeftHip, r: 0.085 },
  { j: J.RightHip, r: 0.085 },
  { j: J.LeftShoulder, r: 0.07 },
  { j: J.RightShoulder, r: 0.07 },
  { j: J.LeftElbow, r: 0.045 },
  { j: J.RightElbow, r: 0.045 },
  { j: J.LeftWrist, r: 0.03 },
  { j: J.RightWrist, r: 0.03 },
  { j: J.LeftHand, r: 0.035 },
  { j: J.RightHand, r: 0.035 },
  { j: J.LeftFingers, r: 0.018 },
  { j: J.RightFingers, r: 0.018 },
  { j: J.Core, r: 0.11 },
  { j: J.Neck, r: 0.05 },
  { j: J.Head, r: 0.095 },
];

const POOL = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  v3: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  up: new THREE.Vector3(0, 1, 0),
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function OrbitControls() {
  const { camera, gl } = useThree();
  const controls = useMemo(() => {
    const c = new ThreeOrbitControls(camera, gl.domElement);
    c.enablePan = false;
    c.enableZoom = true;
    c.enableRotate = true;
    c.autoRotate = true;
    c.autoRotateSpeed = 0.5;
    c.target.set(0, 1, 0);
    return c;
  }, [camera, gl.domElement]);

  useFrame(() => controls.update());
  useEffect(() => () => controls.dispose(), [controls]);
  return <primitive object={controls} />;
}

function HumanPlayer({
  frames,
  isAttacker,
  color,
  glowColor,
  timeRef,
}: {
  frames: number[][][][];
  isAttacker: boolean;
  color: number;
  glowColor: number;
  timeRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const jointsRef = useRef<Array<{ solid: THREE.Mesh; glow: THREE.Mesh }>>([]);
  const limbsRef = useRef<Array<{ solid: THREE.Mesh; glow: THREE.Mesh }>>([]);
  const jointMapRef = useRef<Record<number, { solid: THREE.Mesh; glow: THREE.Mesh }>>({});

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    const createdGeometries: THREE.BufferGeometry[] = [];
    const createdMaterials: THREE.Material[] = [];
    while (group.children.length) group.remove(group.children[0]);
    jointsRef.current = [];
    limbsRef.current = [];
    jointMapRef.current = {};

    const solidMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    createdMaterials.push(solidMat);
    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    createdMaterials.push(glowMat);

    const jointSolidMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
    });
    createdMaterials.push(jointSolidMat);
    const jointGlowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    createdMaterials.push(jointGlowMat);

    for (const { j, r } of JOINT_VISUALS) {
      const solidGeo = new THREE.SphereGeometry(r, 12, 8);
      createdGeometries.push(solidGeo);
      const solid = new THREE.Mesh(solidGeo, jointSolidMat);
      (solid.userData as any).jointIndex = j;
      group.add(solid);

      const glowGeo = new THREE.IcosahedronGeometry(r * 1.08, 1);
      createdGeometries.push(glowGeo);
      const glow = new THREE.Mesh(glowGeo, jointGlowMat);
      (glow.userData as any).jointIndex = j;
      group.add(glow);

      const pair = { solid, glow };
      jointsRef.current.push(pair);
      jointMapRef.current[j] = pair;
    }

    for (const seg of ANATOMY_SEGMENTS) {
      const solidGeo = new THREE.CylinderGeometry(seg.rTop, seg.rBot, 1, 8, 1);
      solidGeo.translate(0, 0.5, 0);
      createdGeometries.push(solidGeo);
      const solid = new THREE.Mesh(solidGeo, solidMat);
      solid.userData = { ...seg };
      group.add(solid);

      const glowGeo = new THREE.CylinderGeometry(seg.rTop * 1.06, seg.rBot * 1.06, 1, 6, 1);
      glowGeo.translate(0, 0.5, 0);
      createdGeometries.push(glowGeo);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.userData = { ...seg };
      group.add(glow);

      limbsRef.current.push({ solid, glow });
    }

    return () => {
      createdGeometries.forEach((geometry) => geometry.dispose());
      createdMaterials.forEach((material) => material.dispose());
    };
  }, [color, glowColor]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (!frames?.length) return;

    const total = frames.length;
    const raw = timeRef.current % Math.max(1, total - 1);
    const idx = Math.floor(raw);
    const t = raw - idx;

    const cur = frames[idx];
    const next = frames[Math.min(idx + 1, total - 1)];
    const pIdx = isAttacker ? 0 : 1;
    const pCur = cur?.[pIdx];
    const pNext = next?.[pIdx];
    if (!pCur || !pNext) return;

    for (const { solid, glow } of jointsRef.current) {
      const j = (solid.userData as any).jointIndex as number;
      const c = pCur[j];
      const n = pNext[j];
      const x = lerp(c[0], n[0], t);
      const y = lerp(c[1], n[1], t);
      const z = lerp(c[2], n[2], t);
      solid.position.set(x, y, z);
      glow.position.set(x, y, z);
    }

    const { v1, v2, v3, q, up } = POOL;
    const jointMap = jointMapRef.current;
    for (const { solid, glow } of limbsRef.current) {
      const { from, to } = solid.userData as any;
      const a = jointMap[from];
      const b = jointMap[to];
      if (!a || !b) continue;

      v1.copy(a.solid.position);
      v2.copy(b.solid.position);
      const dist = v1.distanceTo(v2);

      solid.position.copy(v1);
      glow.position.copy(v1);

      v3.copy(v2).sub(v1).normalize();
      q.setFromUnitVectors(up, v3);
      solid.quaternion.copy(q);
      glow.quaternion.copy(q);
      solid.scale.y = dist;
      glow.scale.y = dist;
    }
  });

  return <group ref={groupRef} />;
}

function MannequinSceneInner({
  sequencePath = "/data/sequence.json",
  sequenceData,
  playbackRef,
}: {
  sequencePath?: string;
  sequenceData?: SequenceData;
  playbackRef: React.MutableRefObject<PlaybackState>;
}) {
  const [data, setData] = useState<SequenceData | null>(null);
  const timeRef = useRef(0);

  // Expose timeRef so the overlay can read/seek it
  useEffect(() => {
    playbackRef.current.timeRef = timeRef;
    return () => {
      playbackRef.current.timeRef = null;
    };
  }, [playbackRef]);

  useEffect(() => {
    if (sequenceData) {
      setData(sequenceData);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(sequencePath, { signal: controller.signal });
        const json = (await res.json()) as SequenceData;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sequenceData, sequencePath]);

  /** Paused by default: start on poster / first marker / midpoint (merged plan §15). */
  useEffect(() => {
    if (!data?.frames?.length) return;
    const total = Math.max(1, data.frames.length - 1);
    let startFrame = 0;
    const poster = data.posterFrame;
    if (typeof poster === "number" && Number.isFinite(poster) && poster >= 0 && poster <= total) {
      startFrame = Math.floor(poster);
    } else if (data.markers?.length) {
      startFrame = Math.min(total, Math.max(0, Math.floor(data.markers[0]!.frame)));
    } else {
      startFrame = Math.floor(total / 2);
    }
    timeRef.current = startFrame;
  }, [data]);

  useFrame((_state, delta) => {
    if (playbackRef.current.paused) return;
    timeRef.current += Math.min(delta, 0.05) * 8.0 * playbackRef.current.speed;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} />
      <directionalLight position={[-5, 5, -5]} intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#999999", 0.25]} />
      <gridHelper args={[12, 24, "#2E4036", "#2E4036"]} position={[0, 0, 0]} />

      {data?.frames?.length ? (
        <>
          <HumanPlayer
            frames={data.frames}
            isAttacker
            color={COLOR_ATTACKER}
            glowColor={COLOR_ATTACKER_GLOW}
            timeRef={timeRef}
          />
          <HumanPlayer
            frames={data.frames}
            isAttacker={false}
            color={COLOR_DEFENDER}
            glowColor={COLOR_DEFENDER_GLOW}
            timeRef={timeRef}
          />
        </>
      ) : null}

      <OrbitControls />
    </>
  );
}

// ── Playback overlay ────────────────────────────────────────────────────────

function PlaybackOverlay({
  sequencePath,
  sequenceData,
  playbackRef,
}: {
  sequencePath: string;
  sequenceData?: SequenceData;
  playbackRef: React.MutableRefObject<PlaybackState>;
}) {
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [frame, setFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(36);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    if (sequenceData) {
      setTotalFrames(Math.max(1, sequenceData.frames.length - 1));
      setMarkers(sequenceData.markers ?? []);
      return;
    }

    (async () => {
      try {
        const res = await fetch(sequencePath);
        const json = (await res.json()) as SequenceData;
        setTotalFrames(Math.max(1, json.frames.length - 1));
        setMarkers(json.markers ?? []);
      } catch {
        // ignore
      }
    })();
  }, [sequenceData, sequencePath]);

  // Sync frame display from timeRef on every animation frame
  useEffect(() => {
    const tick = () => {
      const tr = playbackRef.current.timeRef;
      if (tr) {
        setFrame(Math.floor(tr.current % Math.max(1, totalFrames)));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playbackRef, totalFrames]);

  useEffect(() => {
    playbackRef.current.paused = paused;
  }, [paused, playbackRef]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      playbackRef.current.paused = next;
      return next;
    });
  }, [playbackRef]);

  const onSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setSpeed(v);
      playbackRef.current.speed = v;
    },
    [playbackRef]
  );

  const onScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      const tr = playbackRef.current.timeRef;
      if (tr) tr.current = v;
      setFrame(Math.floor(v));
    },
    [playbackRef]
  );

  const jumpToMarker = useCallback(
    (markerFrame: number) => {
      const tr = playbackRef.current.timeRef;
      if (tr) tr.current = markerFrame;
      setFrame(markerFrame);
    },
    [playbackRef]
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "6px 10px",
        background: "rgba(18,22,18,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        pointerEvents: "all",
        userSelect: "none",
        zIndex: 10,
        maxHeight: "52px",
      }}
    >
      <button
        onClick={togglePause}
        title={paused ? "Play" : "Pause"}
        style={{
          background: "rgba(46,64,54,0.9)",
          border: "1px solid #4a7c59",
          borderRadius: "4px",
          color: "#d4c9a8",
          cursor: "pointer",
          fontSize: "10px",
          padding: "2px 8px",
          flexShrink: 0,
        }}
      >
        {paused ? "▶" : "⏸"}
      </button>
      <input
        type="range"
        min={0}
        max={totalFrames}
        step={0.1}
        value={frame}
        onChange={onScrub}
        style={{ accentColor: "#8aab7a", flex: 1, cursor: "pointer", height: "4px" }}
      />
      <span style={{ color: "#8aab7a", fontSize: "10px", minWidth: "44px", textAlign: "right", flexShrink: 0 }}>
        {frame}/{totalFrames}
      </span>
      <select
        value={speed}
        onChange={(e) => onSpeedChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
        style={{
          background: "rgba(46,64,54,0.9)",
          border: "1px solid #4a7c59",
          borderRadius: "4px",
          color: "#d4c9a8",
          fontSize: "10px",
          padding: "2px 4px",
          cursor: "pointer",
          width: "52px",
          flexShrink: 0,
        }}
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>
    </div>
  );
}

export function MannequinViewer({
  className,
  sequencePath = "/data/sequence.json",
  sequenceData,
  onThumbnailReady,
}: {
  className?: string;
  sequencePath?: string;
  sequenceData?: SequenceData;
  onThumbnailReady?: (dataUrl: string) => void;
}) {
  const supportsWebGL = useState(() => {
    if (typeof document === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      return false;
    }
  })[0];
  const playbackRef = useRef<PlaybackState>({ paused: true, speed: 1, timeRef: null });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCaptured = useRef(false);

  // Capture thumbnail after first render
  useEffect(() => {
    if (!onThumbnailReady || thumbnailCaptured.current) return;

    const captureThumbnail = () => {
      if (thumbnailCaptured.current) return;
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          thumbnailCaptured.current = true;
          onThumbnailReady(dataUrl);
        } catch (e) {
          // Ignore capture errors
        }
      }
    };

    // Small delay to ensure canvas is rendered
    const timer = setTimeout(captureThumbnail, 100);
    return () => clearTimeout(timer);
  }, [onThumbnailReady]);

  if (!supportsWebGL) {
    return (
      <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-charcoal px-4 text-center">
          <div className="max-w-xs">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
              GrappleMap Preview
            </div>
            <p className="mt-3 font-body text-sm leading-relaxed text-cream/70">
              The interactive viewer needs WebGL. The technique library still works, and the public site falls back
              to this static preview when the browser cannot create a 3D context.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas ref={canvasRef} camera={{ position: [5, 3.5, 5], fov: 45, near: 0.1, far: 100 }}>
        <color attach="background" args={["#1A1A1A"]} />
        <MannequinSceneInner sequencePath={sequencePath} sequenceData={sequenceData} playbackRef={playbackRef} />
      </Canvas>
      <PlaybackOverlay sequencePath={sequencePath} sequenceData={sequenceData} playbackRef={playbackRef} />
    </div>
  );
}
