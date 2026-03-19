import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Marker = { name: string; frame: number; type: string };
type SequenceData = { frames: number[][][][]; markers?: Marker[] };

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
    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });

    const jointSolidMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
    });
    const jointGlowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    for (const { j, r } of JOINT_VISUALS) {
      const solidGeo = new THREE.SphereGeometry(r, 12, 8);
      const solid = new THREE.Mesh(solidGeo, jointSolidMat);
      (solid.userData as any).jointIndex = j;
      group.add(solid);

      const glowGeo = new THREE.IcosahedronGeometry(r * 1.08, 1);
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
      const solid = new THREE.Mesh(solidGeo, solidMat);
      solid.userData = { ...seg };
      group.add(solid);

      const glowGeo = new THREE.CylinderGeometry(seg.rTop * 1.06, seg.rBot * 1.06, 1, 6, 1);
      glowGeo.translate(0, 0.5, 0);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.userData = { ...seg };
      group.add(glow);

      limbsRef.current.push({ solid, glow });
    }
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
  playbackRef,
}: {
  sequencePath?: string;
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
    let cancelled = false;
    (async () => {
      const res = await fetch(sequencePath);
      const json = (await res.json()) as SequenceData;
      if (!cancelled) setData(json);
    })();
    return () => {
      cancelled = true;
    };
  }, [sequencePath]);

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
  playbackRef,
}: {
  sequencePath: string;
  playbackRef: React.MutableRefObject<PlaybackState>;
}) {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frame, setFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(36);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
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
  }, [sequencePath]);

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

  const togglePause = useCallback(() => {
    setPaused((p) => {
      playbackRef.current.paused = !p;
      return !p;
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
        padding: "10px 14px",
        background: "rgba(18,22,18,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        pointerEvents: "all",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      {/* Row 1: play/pause + scrubber */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={togglePause}
          title={paused ? "Play" : "Pause"}
          style={{
            background: "rgba(46,64,54,0.9)",
            border: "1px solid #4a7c59",
            borderRadius: "4px",
            color: "#d4c9a8",
            cursor: "pointer",
            fontSize: "13px",
            padding: "3px 10px",
            lineHeight: "20px",
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
          style={{ accentColor: "#8aab7a", flex: 1, cursor: "pointer" }}
        />
        <span style={{ color: "#8aab7a", fontSize: "11px", minWidth: "52px", textAlign: "right" }}>
          {frame}/{totalFrames}
        </span>
      </div>

      {/* Row 2: speed */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ color: "#8aab7a", fontSize: "11px", flexShrink: 0 }}>Speed</span>
        <input
          type="range"
          min={0.25}
          max={2}
          step={0.25}
          value={speed}
          onChange={onSpeedChange}
          style={{ accentColor: "#8aab7a", width: "110px", cursor: "pointer" }}
        />
        <span style={{ color: "#8aab7a", fontSize: "11px" }}>{speed.toFixed(2)}x</span>
      </div>

      {/* Row 3: marker jump buttons */}
      {markers.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
          <span style={{ color: "#8aab7a", fontSize: "11px", flexShrink: 0 }}>Jump:</span>
          {markers.map((m, i) => (
            <button
              key={i}
              title={m.name}
              onClick={() => jumpToMarker(m.frame)}
              style={{
                background: "rgba(46,64,54,0.9)",
                border: "1px solid #4a7c59",
                borderRadius: "4px",
                color: "#d4c9a8",
                cursor: "pointer",
                fontSize: "11px",
                padding: "2px 8px",
                maxWidth: "130px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {m.name.replace(/\\n/g, " ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MannequinViewer({
  className,
  sequencePath = "/data/sequence.json",
}: {
  className?: string;
  sequencePath?: string;
}) {
  const playbackRef = useRef<PlaybackState>({ paused: false, speed: 1, timeRef: null });

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [5, 3.5, 5], fov: 45, near: 0.1, far: 100 }}>
        <color attach="background" args={["#1A1A1A"]} />
        <MannequinSceneInner sequencePath={sequencePath} playbackRef={playbackRef} />
      </Canvas>
      <PlaybackOverlay sequencePath={sequencePath} playbackRef={playbackRef} />
    </div>
  );
}

