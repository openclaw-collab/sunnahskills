import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pause, Play } from "lucide-react";
import { stabilizeSequenceFrames } from "@/lib/grapplemapPlayerContinuity";
import { grapplemapEngineSpeed } from "@/lib/grapplemapPlayback";
import { techniqueSequenceApiUrl } from "@/lib/techniqueApi";

type Marker = { name: string; frame: number; type: string };
export type GrappleMapSequenceData = { frames: number[][][][]; markers?: Marker[]; posterFrame?: number };
type SequenceData = GrappleMapSequenceData;
type PlayerFrame = number[][];
type Frame = [PlayerFrame, PlayerFrame];

export type GrappleMapPlaybackState = {
  paused: boolean;
  speed: number;
  timeRef: React.MutableRefObject<number> | null;
};
type PlaybackState = GrappleMapPlaybackState;

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

const SEQUENCE_CACHE = new Map<string, SequenceData | null>();
const SEQUENCE_PENDING = new Map<string, Promise<SequenceData | null>>();

const CAMERA_TARGET_DRAG = 0.2;
const MAX_CAMERA_JUMP = 2.0;
const CAMERA_Y_SCALE = 0.7;
const BLEND_FRAMES = 3; // Smooth transition blending for scene changes

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Matches GrappleMap/preview UchimataCardHuman.jsx — smooth, stable motion at high refresh rates. */
function smoothenJoint(targetX: number, targetY: number, targetZ: number, lastX: number, lastY: number, lastZ: number) {
  const lag = Math.min(0.83, 0.6 + targetY);
  const factor = 1 - lag;
  return {
    x: lastX * lag + targetX * factor,
    y: lastY * lag + targetY * factor,
    z: lastZ * lag + targetZ * factor,
  };
}

function normalizeRoleFrames(frames: number[][][][], markers?: Marker[]): number[][][][] {
  if (!Array.isArray(frames) || frames.length === 0) return [];
  return stabilizeSequenceFrames(frames, markers);
}

function getPoseCenter(pose: Frame | null) {
  const coreA = pose?.[0]?.[J.Core];
  const coreB = pose?.[1]?.[J.Core];
  if (!coreA || !coreB) return null;

  return new THREE.Vector3(
    (coreA[0] + coreB[0]) * 0.5,
    ((coreA[1] + coreB[1]) * 0.5) * 0.7,
    (coreA[2] + coreB[2]) * 0.5,
  );
}

/** Fetches and normalizes GrappleMap sequence JSON (cached). Safe to use from any viewer. */
export async function loadGrappleMapSequence(sequencePath: string, signal?: AbortSignal) {
  const cached = SEQUENCE_CACHE.get(sequencePath);
  if (cached !== undefined) {
    return cached;
  }

  let pending = SEQUENCE_PENDING.get(sequencePath);
  if (!pending) {
    pending = fetch(sequencePath, { signal })
      .then(async (res) => {
        const json = (await res.json()) as SequenceData;
        return {
          ...json,
          frames: normalizeRoleFrames(json.frames, json.markers),
        } satisfies SequenceData;
      })
      .catch(() => null)
      .finally(() => {
        SEQUENCE_PENDING.delete(sequencePath);
      });
    SEQUENCE_PENDING.set(sequencePath, pending);
  }

  const json = await pending;
  SEQUENCE_CACHE.set(sequencePath, json);
  return json;
}

function OrbitControls({ targetRef }: { targetRef: React.MutableRefObject<THREE.Vector3> }) {
  const { camera, gl } = useThree();
  const controls = useMemo(() => {
    const c = new ThreeOrbitControls(camera, gl.domElement);
    c.enablePan = true;
    c.enableZoom = true;
    c.enableRotate = true;
    c.autoRotate = false;
    c.target.set(0, 1, 0);
    return c;
  }, [camera, gl.domElement]);

  useFrame(() => {
    // Match Uchimata path: camera chaser is already smoothed upstream.
    controls.target.copy(targetRef.current);
    controls.update();
  });
  useEffect(() => () => controls.dispose(), [controls]);
  return <primitive object={controls} />;
}

function Grid({ targetRef }: { targetRef: React.MutableRefObject<THREE.Vector3> }) {
  const gridRef = useRef<THREE.GridHelper | null>(null);

  useFrame(() => {
    if (!gridRef.current) return;
    gridRef.current.position.x = targetRef.current.x;
    gridRef.current.position.z = targetRef.current.z;
  });

  return <gridHelper ref={gridRef} args={[12, 24, "#2E4036", "#2E4036"]} position={[0, 0, 0]} />;
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
  const lastPosRef = useRef<number[][] | null>(null);
  const lastSeqLenRef = useRef<number>(0);

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    const createdGeometries: THREE.BufferGeometry[] = [];
    const createdMaterials: THREE.Material[] = [];
    while (group.children.length) group.remove(group.children[0]);
    jointsRef.current = [];
    limbsRef.current = [];
    jointMapRef.current = {};
    lastPosRef.current = null;

    const solidMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    createdMaterials.push(solidMat);
    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
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
      opacity: 0.55,
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

    const { v1, v2, v3, q, up } = POOL;
    const jointMap = jointMapRef.current;
    const total = frames.length;

    if (total === 1) {
      const frame = frames[0];
      const pIdx = isAttacker ? 0 : 1;
      const playerJoints = frame?.[pIdx];
      if (!playerJoints) return;

      for (const { solid, glow } of jointsRef.current) {
        const j = (solid.userData as any).jointIndex as number;
        const joint = playerJoints[j];
        if (!joint) continue;
        solid.position.set(joint[0], joint[1], joint[2]);
        glow.position.set(joint[0], joint[1], joint[2]);
      }

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
      return;
    }

    const raw = total === 1 ? 0 : timeRef.current % Math.max(1, total - 1);
    const idx = Math.floor(raw);
    const t = raw - idx;

    const cur = frames[idx];
    const next = frames[Math.min(idx + 1, total - 1)];
    const pIdx = isAttacker ? 0 : 1;
    const pCur = cur?.[pIdx];
    const pNext = next?.[pIdx] ?? pCur;
    if (!pCur || !pNext) return;

    // Detect sequence change (new technique loaded) — reinitialize smoothing state
    if (!lastPosRef.current || lastSeqLenRef.current !== total) {
      lastPosRef.current = pCur.map((joint) => [...joint]);
      lastSeqLenRef.current = total;
    }
    const lastPositions = lastPosRef.current;

    for (const { solid, glow } of jointsRef.current) {
      const j = (solid.userData as any).jointIndex as number;
      const curJoint = pCur[j];
      const nextJoint = pNext[j];
      if (!curJoint || !nextJoint) continue;
      const targetX = lerp(curJoint[0], nextJoint[0], t);
      const targetY = lerp(curJoint[1], nextJoint[1], t);
      const targetZ = lerp(curJoint[2], nextJoint[2], t);
      const last = lastPositions[j];
      if (!last) continue;
      const smoothed = smoothenJoint(targetX, targetY, targetZ, last[0], last[1], last[2]);
      last[0] = smoothed.x;
      last[1] = smoothed.y;
      last[2] = smoothed.z;
      solid.position.set(smoothed.x, smoothed.y, smoothed.z);
      glow.position.set(smoothed.x, smoothed.y, smoothed.z);
    }

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
  sequencePath = techniqueSequenceApiUrl("double-leg-to-mount-escape-full-chain"),
  sequenceData,
  playbackRef,
  onLoaded,
}: {
  sequencePath?: string;
  sequenceData?: SequenceData;
  playbackRef: React.MutableRefObject<PlaybackState>;
  onLoaded?: (loaded: boolean) => void;
}) {
  const [data, setData] = useState<SequenceData | null>(null);
  const timeRef = useRef(0);
  const controlsTargetRef = useRef(new THREE.Vector3(0, 1, 0));
  const lastCenterRef = useRef<THREE.Vector3 | null>(null);

  // Expose timeRef so the overlay can read/seek it
  useEffect(() => {
    playbackRef.current.timeRef = timeRef;
    return () => {
      playbackRef.current.timeRef = null;
    };
  }, [playbackRef]);

  useEffect(() => {
    if (sequenceData) {
      setData({
        ...sequenceData,
        frames: normalizeRoleFrames(sequenceData.frames, sequenceData.markers),
      });
      onLoaded?.(true);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const cached = SEQUENCE_CACHE.get(sequencePath);
    if (cached !== undefined) {
      setData(cached);
      onLoaded?.(Boolean(cached));
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    (async () => {
      try {
        const json = await loadGrappleMapSequence(sequencePath, controller.signal);
        if (!cancelled) {
          setData(json);
          onLoaded?.(Boolean(json));
        }
      } catch {
        if (!cancelled) {
          setData(null);
          onLoaded?.(false);
        }
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
    const initialFrame = (data.frames[Math.min(startFrame, data.frames.length - 1)] ?? data.frames[0]) as Frame | undefined;
    const center = initialFrame ? getPoseCenter(initialFrame) : null;
    if (center) {
      controlsTargetRef.current.copy(center);
      lastCenterRef.current = center.clone();
    }
  }, [data]);

  /** Single unified animation loop - time update, camera follow, and transition blending together */
  useFrame((_state, delta) => {
    if (!data?.frames?.length) return;
    const total = data.frames.length;
    if (total < 2) return;

    // Time update (only when playing)
    if (!playbackRef.current.paused) {
      timeRef.current += Math.min(delta, 0.05) * playbackRef.current.speed;
    }

    // Calculate current frame position
    const raw = timeRef.current % Math.max(1, total - 1);
    const idx = Math.floor(raw);
    const t = raw - idx;

    const cur = data.frames[idx] as Frame | undefined;
    const next = data.frames[Math.min(idx + 1, total - 1)] as Frame | undefined;
    if (!cur || !next) return;

    const curA = cur[0]?.[J.Core];
    const curB = cur[1]?.[J.Core];
    const nextA = next[0]?.[J.Core];
    const nextB = next[1]?.[J.Core];
    if (!curA || !curB || !nextA || !nextB) return;

    const curCenterX = (curA[0] + curB[0]) * 0.5;
    const curCenterY = (curA[1] + curB[1]) * 0.5;
    const curCenterZ = (curA[2] + curB[2]) * 0.5;
    const nextCenterX = (nextA[0] + nextB[0]) * 0.5;
    const nextCenterY = (nextA[1] + nextB[1]) * 0.5;
    const nextCenterZ = (nextA[2] + nextB[2]) * 0.5;

    let targetX = lerp(curCenterX, nextCenterX, t);
    let targetY = lerp(curCenterY, nextCenterY, t);
    let targetZ = lerp(curCenterZ, nextCenterZ, t);

    // Initialize lastCenter on first frame
    if (!lastCenterRef.current) {
      lastCenterRef.current = new THREE.Vector3(targetX, targetY, targetZ);
      controlsTargetRef.current.set(targetX, targetY * CAMERA_Y_SCALE, targetZ);
      return;
    }

    const lastCenter = lastCenterRef.current;

    // Transition blending: smooth camera movement at sequence boundaries
    if (idx < BLEND_FRAMES) {
      const blendFactor = Math.min(1, idx / BLEND_FRAMES);
      const smoothFactor = blendFactor * 0.5;
      targetX = lastCenter.x + (targetX - lastCenter.x) * smoothFactor;
      targetZ = lastCenter.z + (targetZ - lastCenter.z) * smoothFactor;
    }

    // Clamp large jumps
    const jumpDist = Math.hypot(targetX - lastCenter.x, targetZ - lastCenter.z);
    if (jumpDist > MAX_CAMERA_JUMP) {
      const scale = MAX_CAMERA_JUMP / jumpDist;
      targetX = lastCenter.x + (targetX - lastCenter.x) * scale;
      targetZ = lastCenter.z + (targetZ - lastCenter.z) * scale;
    }

    // Update last center
    lastCenter.set(targetX, targetY, targetZ);

    // Smooth camera follow (chaser)
    controlsTargetRef.current.x += (targetX - controlsTargetRef.current.x) * CAMERA_TARGET_DRAG;
    controlsTargetRef.current.y += (targetY * CAMERA_Y_SCALE - controlsTargetRef.current.y) * CAMERA_TARGET_DRAG;
    controlsTargetRef.current.z += (targetZ - controlsTargetRef.current.z) * CAMERA_TARGET_DRAG;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <hemisphereLight args={["#ffffff", "#999999", 0.3]} />
      <Grid targetRef={controlsTargetRef} />

      {data?.frames?.length ? (
        <>
          <HumanPlayer
            key="attacker"
            frames={data.frames}
            isAttacker
            color={COLOR_ATTACKER}
            glowColor={COLOR_ATTACKER_GLOW}
            timeRef={timeRef}
          />
          <HumanPlayer
            key="defender"
            frames={data.frames}
            isAttacker={false}
            color={COLOR_DEFENDER}
            glowColor={COLOR_DEFENDER_GLOW}
            timeRef={timeRef}
          />
        </>
      ) : null}

      <OrbitControls targetRef={controlsTargetRef} />
    </>
  );
}

// ── Playback overlay ────────────────────────────────────────────────────────

export function GrappleMapPlaybackOverlay({
  sequencePath,
  sequenceData,
  playbackRef,
  controlsMode,
  isPlaying,
  onTogglePlayback,
  onPlaybackSpeedChange,
}: {
  sequencePath: string;
  sequenceData?: SequenceData;
  playbackRef: React.MutableRefObject<PlaybackState>;
  controlsMode: "none" | "ridges" | "compact";
  isPlaying: boolean;
  onTogglePlayback: () => void;
  /** Optional — parent can mirror speed for canvases that take `playbackSpeed` as a prop (e.g. GrappleMap preview card). */
  onPlaybackSpeedChange?: (speed: number) => void;
}) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  /** UI multiplier: 1× ⇒ `grapplemapEngineSpeed(1)` on the scene. */
  const [speedUi, setSpeedUi] = useState(1);
  const [totalFrames, setTotalFrames] = useState(1);
  const [sliderValue, setSliderValue] = useState(0);
  const scrubbingRef = useRef(false);
  const resumePlaybackRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (controlsMode === "none") return;

    if (sequenceData) {
      setMarkers(sequenceData.markers ?? []);
      setTotalFrames(Math.max(1, sequenceData.frames.length - 1));
      setSliderValue(0);
      return;
    }

    (async () => {
      try {
        const json = await loadGrappleMapSequence(sequencePath);
        if (!json) return;
        setMarkers(json.markers ?? []);
        setTotalFrames(Math.max(1, json.frames.length - 1));
        setSliderValue(0);
      } catch {
        // ignore
      }
    })();
  }, [controlsMode, sequenceData, sequencePath]);

  useEffect(() => {
    playbackRef.current.speed = grapplemapEngineSpeed(speedUi);
  }, [speedUi, playbackRef]);

  useEffect(() => {
    if (controlsMode !== "compact") return;

    const tick = () => {
      const tr = playbackRef.current.timeRef;
      if (tr && !scrubbingRef.current) {
        setSliderValue(tr.current % Math.max(1, totalFrames));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [controlsMode, playbackRef, totalFrames]);

  const jumpToMarker = useCallback(
    (markerFrame: number) => {
      const tr = playbackRef.current.timeRef;
      if (tr) tr.current = markerFrame;
    },
    [playbackRef]
  );

  const onScrub = useCallback(
    (event: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
      const value = Number((event.target as HTMLInputElement).value);
      setSliderValue(value);
      const tr = playbackRef.current.timeRef;
      if (tr) tr.current = value;
    },
    [playbackRef]
  );

  const startScrub = useCallback(() => {
    scrubbingRef.current = true;
    resumePlaybackRef.current = !playbackRef.current.paused;
    playbackRef.current.paused = true;
  }, [playbackRef]);

  const endScrub = useCallback(() => {
    scrubbingRef.current = false;
    playbackRef.current.paused = !resumePlaybackRef.current;
  }, [playbackRef]);

  const onSpeedChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const ui = Number(event.target.value);
      setSpeedUi(ui);
      const engine = grapplemapEngineSpeed(ui);
      playbackRef.current.speed = engine;
      onPlaybackSpeedChange?.(engine);
    },
    [playbackRef, onPlaybackSpeedChange],
  );

  if (controlsMode === "none") return null;

  if (controlsMode === "compact") {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          right: 14,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          background: "rgba(18,22,18,0.72)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(138,171,122,0.18)",
          borderRadius: "999px",
          pointerEvents: "all",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlayback();
          }}
          aria-label={isPlaying ? "Pause technique animation" : "Play technique animation"}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "999px",
            border: "1px solid rgba(242,240,233,0.16)",
            background: "rgba(26,26,26,0.82)",
            color: "#f2f0e9",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <input
          type="range"
          min={0}
          max={totalFrames}
          step={0.1}
          value={sliderValue}
          onChange={onScrub}
          onInput={onScrub}
          onPointerDown={startScrub}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          onBlur={endScrub}
          aria-label="Scrub technique playback"
          style={{ flex: 1, accentColor: "#cc5833", cursor: "pointer" }}
        />
        <select
          value={speedUi}
          onChange={onSpeedChange}
          aria-label="Technique playback speed"
          style={{
            borderRadius: "999px",
            border: "1px solid rgba(138,171,122,0.24)",
            background: "rgba(26,26,26,0.82)",
            color: "#f2f0e9",
            padding: "8px 10px",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          <option value={0.25}>0.25×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 14,
        left: 14,
        right: 14,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {markers.length > 0 ? (
        <div
          style={{
            display: "flex",
            gap: "8px",
            maxWidth: "min(92%, 540px)",
            width: "fit-content",
            padding: "8px 12px",
            background: "rgba(18,22,18,0.52)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(138,171,122,0.18)",
            borderRadius: "999px",
            overflowX: "auto",
            pointerEvents: "all",
            scrollbarWidth: "none",
          }}
        >
          {markers.map((marker) => {
            return (
              <button
                key={`${marker.type}-${marker.name}-${marker.frame}`}
                type="button"
                aria-label={`Jump to ${marker.name}`}
                title={marker.name}
                onClick={() => jumpToMarker(marker.frame)}
                style={{
                  width: marker.type === "position" ? "28px" : "18px",
                  minWidth: marker.type === "position" ? "28px" : "18px",
                  height: "8px",
                  borderRadius: "999px",
                  border: "1px solid rgba(138,171,122,0.24)",
                  background: marker.type === "position" ? "rgba(204,88,51,0.78)" : "rgba(138,171,122,0.34)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 140ms ease",
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function MannequinViewer({
  className,
  sequencePath = techniqueSequenceApiUrl("double-leg-to-mount-escape-full-chain"),
  sequenceData,
  onThumbnailReady,
  controlsMode = "ridges",
  autoplay = false,
}: {
  className?: string;
  sequencePath?: string;
  sequenceData?: SequenceData;
  onThumbnailReady?: (dataUrl: string) => void;
  controlsMode?: "none" | "ridges" | "compact";
  autoplay?: boolean;
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
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const playbackRef = useRef<PlaybackState>({ paused: !autoplay, speed: grapplemapEngineSpeed(1), timeRef: null });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const thumbnailCaptured = useRef(false);
  const [ready, setReady] = useState(Boolean(sequenceData?.frames?.length || (sequencePath && SEQUENCE_CACHE.get(sequencePath))));

  useEffect(() => {
    setIsPlaying(autoplay);
  }, [autoplay]);

  useEffect(() => {
    playbackRef.current.paused = !isPlaying;
  }, [isPlaying]);

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

  useEffect(() => {
    setReady(Boolean(sequenceData?.frames?.length || (sequencePath && SEQUENCE_CACHE.get(sequencePath))));
  }, [sequenceData, sequencePath]);

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
      <Canvas
        camera={{ position: [5, 3.5, 5], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
      >
        <color attach="background" args={["#1A1A1A"]} />
        <MannequinSceneInner
          sequencePath={sequencePath}
          sequenceData={sequenceData}
          playbackRef={playbackRef}
          onLoaded={setReady}
        />
      </Canvas>
      {!ready ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(26,26,26,0.72)",
            color: "#F2F0E9",
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            zIndex: 5,
          }}
        >
          Loading technique...
        </div>
      ) : null}
      {controlsMode === "ridges" && ready ? (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying((playing) => !playing);
          }}
          aria-label={isPlaying ? "Pause technique animation" : "Play technique animation"}
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 bg-charcoal/78 text-cream/75 shadow-[0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur-sm transition hover:border-moss/45 hover:text-cream"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
        </button>
      ) : null}
      <GrappleMapPlaybackOverlay
        sequencePath={sequencePath}
        sequenceData={sequenceData}
        playbackRef={playbackRef}
        controlsMode={controlsMode}
        isPlaying={isPlaying}
        onTogglePlayback={() => setIsPlaying((playing) => !playing)}
      />
    </div>
  );
}
