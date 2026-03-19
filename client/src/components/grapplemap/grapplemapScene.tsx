import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type GrappleMapSequence = {
  frames: number[][][][];
  markers?: unknown[];
  meta?: { totalFrames?: number };
};

// Joint indices (matches GrappleMap preview data)
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

const SEGMENTS: Array<[number, number]> = [
  [J.LeftToe, J.LeftHeel],
  [J.LeftHeel, J.LeftAnkle],
  [J.LeftAnkle, J.LeftKnee],
  [J.LeftKnee, J.LeftHip],
  [J.RightToe, J.RightHeel],
  [J.RightHeel, J.RightAnkle],
  [J.RightAnkle, J.RightKnee],
  [J.RightKnee, J.RightHip],
  [J.LeftHip, J.Core],
  [J.RightHip, J.Core],
  [J.Core, J.LeftShoulder],
  [J.Core, J.RightShoulder],
  [J.LeftShoulder, J.LeftElbow],
  [J.LeftElbow, J.LeftWrist],
  [J.LeftWrist, J.LeftHand],
  [J.LeftHand, J.LeftFingers],
  [J.RightShoulder, J.RightElbow],
  [J.RightElbow, J.RightWrist],
  [J.RightWrist, J.RightHand],
  [J.RightHand, J.RightFingers],
  [J.LeftShoulder, J.Neck],
  [J.RightShoulder, J.Neck],
  [J.Neck, J.Head],
];

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
    c.autoRotateSpeed = 0.55;
    c.target.set(0, 1, 0);
    return c;
  }, [camera, gl.domElement]);

  useFrame(() => controls.update());

  useEffect(() => {
    return () => controls.dispose();
  }, [controls]);

  return <primitive object={controls} />;
}

function PlayerSkeleton({
  playerIndex,
  frames,
  color,
  timeRef,
}: {
  playerIndex: 0 | 1;
  frames: GrappleMapSequence["frames"];
  color: string;
  timeRef: React.MutableRefObject<number>;
}) {
  const lineRef = useRef<THREE.LineSegments | null>(null);
  const jointsRef = useRef<THREE.Points | null>(null);

  const { lineGeometry, jointsGeometry, jointPositions, linePositions } = useMemo(() => {
    const jointPositions = new Float32Array(23 * 3);
    const linePositions = new Float32Array(SEGMENTS.length * 2 * 3);

    const jointsGeometry = new THREE.BufferGeometry();
    jointsGeometry.setAttribute("position", new THREE.BufferAttribute(jointPositions, 3));

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    return { lineGeometry, jointsGeometry, jointPositions, linePositions };
  }, []);

  useFrame(() => {
    if (!frames?.length) return;
    const total = frames.length;
    if (total === 0) return;

    const raw = timeRef.current % Math.max(1, total - 1);
    const idx = Math.floor(raw);
    const t = raw - idx;
    const cur = frames[idx]?.[playerIndex];
    const next = frames[Math.min(idx + 1, total - 1)]?.[playerIndex];
    if (!cur || !next) return;

    // joints
    for (let j = 0; j < 23; j++) {
      const c = cur[j];
      const n = next[j];
      const x = lerp(c[0], n[0], t);
      const y = lerp(c[1], n[1], t);
      const z = lerp(c[2], n[2], t);
      jointPositions[j * 3 + 0] = x;
      jointPositions[j * 3 + 1] = y;
      jointPositions[j * 3 + 2] = z;
    }
    (jointsGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // segments
    for (let s = 0; s < SEGMENTS.length; s++) {
      const [a, b] = SEGMENTS[s];
      const ax = jointPositions[a * 3 + 0];
      const ay = jointPositions[a * 3 + 1];
      const az = jointPositions[a * 3 + 2];
      const bx = jointPositions[b * 3 + 0];
      const by = jointPositions[b * 3 + 1];
      const bz = jointPositions[b * 3 + 2];

      const base = s * 6;
      linePositions[base + 0] = ax;
      linePositions[base + 1] = ay;
      linePositions[base + 2] = az;
      linePositions[base + 3] = bx;
      linePositions[base + 4] = by;
      linePositions[base + 5] = bz;
    }
    (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <group>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.85} />
      </lineSegments>
      <points ref={jointsRef} geometry={jointsGeometry}>
        <pointsMaterial color={color} size={0.035} sizeAttenuation />
      </points>
    </group>
  );
}

export function GrappleMapScene() {
  const [seq, setSeq] = useState<GrappleMapSequence | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/data/sequence.json");
      const json = (await res.json()) as GrappleMapSequence;
      if (!cancelled) setSeq(json);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame((_state, delta) => {
    // keep it calm; matches original "disciplined" vibe
    timeRef.current += Math.min(delta, 0.05) * 8.0;
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 4]} intensity={0.9} />
      <hemisphereLight args={["#ffffff", "#999999", 0.25]} />
      <gridHelper args={[12, 24, "#2E4036", "#2E4036"]} position={[0, 0, 0]} />

      {seq?.frames?.length ? (
        <>
          <PlayerSkeleton playerIndex={0} frames={seq.frames} color="#4a9eff" timeRef={timeRef} />
          <PlayerSkeleton playerIndex={1} frames={seq.frames} color="#ffa64a" timeRef={timeRef} />
        </>
      ) : null}

      <OrbitControls />
    </>
  );
}

