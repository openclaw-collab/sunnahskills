/**
 * UchimataCardHuman.jsx
 * Solid figures with glowing wireframe overlay
 * 
 * Optimizations:
 * - Linear interpolation (matches C++ behavior)
 * - Pre-computed joint lookup map (O(1) access)
 * - Ref-based state (no React re-renders per frame)
 * - Fixed camera smoothing (applies 0.7 scaling before smoothing)
 * - Camera flip protection
 * - Transition blending for smooth scene changes
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as THREE from 'three';
import scenesData from './scenes.json';
const defaultSceneData = scenesData.scenes['1383'];

const COLOR_ATTACKER = 0x1a1a1a;
const COLOR_ATTACKER_GLOW = 0x4a9eff;
const COLOR_DEFENDER = 0x555555;
const COLOR_DEFENDER_GLOW = 0xffa64a;

const HUMAN = {
  head: { radius: 0.09, height: 0.22 },
  neck: { radiusTop: 0.055, radiusBottom: 0.065, height: 0.08 },
  chest: { width: 0.38, depth: 0.22, height: 0.28 },
  waist: { width: 0.32, depth: 0.18, height: 0.18 },
  pelvis: { width: 0.30, depth: 0.20, height: 0.15 },
  shoulder: { radius: 0.075 },
  upperArm: { radiusTop: 0.06, radiusBottom: 0.045, length: 0.32 },
  elbow: { radius: 0.04 },
  forearm: { radiusTop: 0.042, radiusBottom: 0.032, length: 0.28 },
  wrist: { radius: 0.028 },
  hand: { radius: 0.035, length: 0.09 },
  hip: { radius: 0.095 },
  thigh: { radiusTop: 0.09, radiusBottom: 0.055, length: 0.45 },
  knee: { radius: 0.055 },
  shin: { radiusTop: 0.05, radiusBottom: 0.035, length: 0.42 },
  ankle: { radius: 0.03 },
  foot: { width: 0.09, length: 0.24, height: 0.06 }
};

const J = {
  LeftToe: 0, RightToe: 1, LeftHeel: 2, RightHeel: 3,
  LeftAnkle: 4, RightAnkle: 5, LeftKnee: 6, RightKnee: 7,
  LeftHip: 8, RightHip: 9, LeftShoulder: 10, RightShoulder: 11,
  LeftElbow: 12, RightElbow: 13, LeftWrist: 14, RightWrist: 15,
  LeftHand: 16, RightHand: 17, LeftFingers: 18, RightFingers: 19,
  Core: 20, Neck: 21, Head: 22
};

const ANATOMY_SEGMENTS = [
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

const JOINT_VISUALS = [
  { j: J.LeftToe, r: 0.022 }, { j: J.RightToe, r: 0.022 },
  { j: J.LeftHeel, r: 0.028 }, { j: J.RightHeel, r: 0.028 },
  { j: J.LeftAnkle, r: 0.035 }, { j: J.RightAnkle, r: 0.035 },
  { j: J.LeftKnee, r: 0.05 }, { j: J.RightKnee, r: 0.05 },
  { j: J.LeftHip, r: 0.085 }, { j: J.RightHip, r: 0.085 },
  { j: J.LeftShoulder, r: 0.07 }, { j: J.RightShoulder, r: 0.07 },
  { j: J.LeftElbow, r: 0.045 }, { j: J.RightElbow, r: 0.045 },
  { j: J.LeftWrist, r: 0.03 }, { j: J.RightWrist, r: 0.03 },
  { j: J.LeftHand, r: 0.035 }, { j: J.RightHand, r: 0.035 },
  { j: J.LeftFingers, r: 0.018 }, { j: J.RightFingers, r: 0.018 },
  { j: J.Core, r: 0.11 }, { j: J.Neck, r: 0.05 }, { j: J.Head, r: 0.095 }
];

const POOL = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  v3: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  up: new THREE.Vector3(0, 1, 0)
};

const lerp = (a, b, t) => a + (b - a) * t;

function smoothenJoint(targetX, targetY, targetZ, lastX, lastY, lastZ) {
  const lag = Math.min(0.83, 0.6 + targetY);
  const factor = 1 - lag;
  return {
    x: lastX * lag + targetX * factor,
    y: lastY * lag + targetY * factor,
    z: lastZ * lag + targetZ * factor
  };
}

function HumanPlayer({ color, glowColor, isAttacker, frames, animStateRef }) {
  const groupRef = useRef();
  const meshesRef = useRef({ joints: [], limbs: [] });
  const jointMapRef = useRef({});
  const lastPosRef = useRef(null);

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    meshesRef.current = { joints: [], limbs: [] };
    jointMapRef.current = {};
    lastPosRef.current = null;

    const solidMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });

    const jointSolidMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92
    });

    const jointGlowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });

    JOINT_VISUALS.forEach(({ j, r }) => {
      const solidGeo = new THREE.SphereGeometry(r, 12, 8);
      const solidMesh = new THREE.Mesh(solidGeo, jointSolidMat);
      solidMesh.userData.jointIndex = j;
      group.add(solidMesh);

      const glowGeo = new THREE.IcosahedronGeometry(r * 1.08, 1);
      const glowMesh = new THREE.Mesh(glowGeo, jointGlowMat);
      glowMesh.userData.jointIndex = j;
      group.add(glowMesh);

      const jointPair = { solid: solidMesh, glow: glowMesh };
      meshesRef.current.joints.push(jointPair);
      jointMapRef.current[j] = jointPair;
    });

    ANATOMY_SEGMENTS.forEach((seg) => {
      const { rTop, rBot } = seg;

      const solidGeo = new THREE.CylinderGeometry(rTop, rBot, 1, 8, 1);
      solidGeo.translate(0, 0.5, 0);
      const solidMesh = new THREE.Mesh(solidGeo, solidMat);
      solidMesh.userData = { ...seg };
      group.add(solidMesh);

      const glowGeo = new THREE.CylinderGeometry(rTop * 1.06, rBot * 1.06, 1, 6, 1);
      glowGeo.translate(0, 0.5, 0);
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.userData = { ...seg };
      group.add(glowMesh);

      meshesRef.current.limbs.push({ solid: solidMesh, glow: glowMesh });
    });

  }, [color, glowColor]);

  useFrame(() => {
    if (!groupRef.current || !frames?.length) return;

    const { v1, v2, v3, q, up } = POOL;
    const total = frames.length;
    const jointMap = jointMapRef.current;

    if (total === 1) {
      const frame = frames[0];
      const pIdx = isAttacker ? 0 : 1;
      const playerJoints = frame[pIdx];

      if (!playerJoints) return;

      meshesRef.current.joints.forEach(({ solid, glow }) => {
        const j = solid.userData.jointIndex;
        if (!playerJoints[j]) return;
        const joint = playerJoints[j];
        solid.position.set(joint[0], joint[1], joint[2]);
        glow.position.set(joint[0], joint[1], joint[2]);
      });

      meshesRef.current.limbs.forEach(({ solid, glow }) => {
        const { from, to } = solid.userData;
        const fromJoint = jointMap[from];
        const toJoint = jointMap[to];

        if (fromJoint && toJoint) {
          v1.copy(fromJoint.solid.position);
          v2.copy(toJoint.solid.position);
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

      return;
    }

    const frameTime = animStateRef?.current?.time ?? 0;
    const isPlaying = animStateRef?.current?.isPlaying ?? true;
    const isLooping = animStateRef?.current?.isLooping ?? true;
    
    let raw;
    if (isLooping) {
      raw = frameTime % (total - 1);
    } else {
      raw = Math.min(frameTime, total - 1);
      if (!isPlaying && raw >= total - 1) {
        raw = total - 1;
      }
    }
    
    const idx = Math.floor(raw);
    const t = raw - idx;

    const cur = frames[idx];
    const next = frames[Math.min(idx + 1, total - 1)];
    const pIdx = isAttacker ? 0 : 1;
    const pCur = cur[pIdx];
    const pNext = next[pIdx];

    if (!lastPosRef.current) {
      lastPosRef.current = pCur.map(j => [...j]);
    }

    meshesRef.current.joints.forEach(({ solid, glow }) => {
      const j = solid.userData.jointIndex;

      const targetX = lerp(pCur[j][0], pNext[j][0], t);
      const targetY = lerp(pCur[j][1], pNext[j][1], t);
      const targetZ = lerp(pCur[j][2], pNext[j][2], t);

      const last = lastPosRef.current[j];
      const smoothed = smoothenJoint(targetX, targetY, targetZ, last[0], last[1], last[2]);

      last[0] = smoothed.x;
      last[1] = smoothed.y;
      last[2] = smoothed.z;

      solid.position.set(smoothed.x, smoothed.y, smoothed.z);
      glow.position.set(smoothed.x, smoothed.y, smoothed.z);
    });

    meshesRef.current.limbs.forEach(({ solid, glow }) => {
      const { from, to } = solid.userData;

      const fromJoint = jointMap[from];
      const toJoint = jointMap[to];

      if (fromJoint && toJoint) {
        v1.copy(fromJoint.solid.position);
        v2.copy(toJoint.solid.position);

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
  });

  return <group ref={groupRef} />;
}

function Grid({ animStateRef }) {
  const gridRef = useRef();

  useFrame(() => {
    if (gridRef.current && animStateRef?.current?.chaser) {
      const chaser = animStateRef.current.chaser;
      gridRef.current.position.x = chaser.x;
      gridRef.current.position.z = chaser.z;
    }
  });

  return (
    <gridHelper ref={gridRef} args={[12, 24, '#DDDDDD', '#EEEEEE']} position={[0, 0, 0]} />
  );
}

function lerpVector(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
}

function resolveCameraPose(cameraPath, progress, target) {
  const preset = cameraPath?.preset || 'static';
  const distance = cameraPath?.distance ?? 4.8;
  const height = cameraPath?.height ?? 2.7;
  const orbitRadians = ((cameraPath?.orbitDegrees ?? 160) * Math.PI) / 180;

  if (Array.isArray(cameraPath?.keyframes) && cameraPath.keyframes.length > 0) {
    const keyframes = [...cameraPath.keyframes].sort((a, b) => a.t - b.t);
    const nextIndex = keyframes.findIndex((keyframe) => keyframe.t >= progress);
    const prev = keyframes[Math.max(0, nextIndex - 1)] || keyframes[0];
    const next = nextIndex >= 0 ? keyframes[nextIndex] : keyframes[keyframes.length - 1];
    const span = Math.max(0.0001, next.t - prev.t);
    const localT = Math.max(0, Math.min(1, (progress - prev.t) / span));
    return {
      position: lerpVector(prev.position, next.position, localT),
      target: lerpVector(prev.target || [target.x, target.y, target.z], next.target || [target.x, target.y, target.z], localT),
      fov: lerp(prev.fov ?? 45, next.fov ?? 45, localT),
    };
  }

  if (preset === 'orbit') {
    const angle = -orbitRadians / 2 + orbitRadians * progress;
    return {
      position: [
        target.x + Math.cos(angle) * distance,
        target.y + height,
        target.z + Math.sin(angle) * distance,
      ],
      target: [target.x, target.y + 0.45, target.z],
      fov: 44,
    };
  }

  if (preset === 'push-in') {
    const currentDistance = lerp(distance * 1.5, distance * 0.72, progress);
    return {
      position: [target.x + currentDistance, target.y + height * 0.85, target.z + currentDistance * 0.55],
      target: [target.x, target.y + 0.5, target.z],
      fov: lerp(50, 34, progress),
    };
  }

  if (preset === 'swoop') {
    const angle = -Math.PI * 0.8 + Math.PI * 1.25 * progress;
    const currentHeight = lerp(height * 1.35, 0.85, Math.sin(progress * Math.PI));
    const currentDistance = lerp(distance * 1.2, distance * 0.75, progress);
    return {
      position: [
        target.x + Math.cos(angle) * currentDistance,
        target.y + currentHeight,
        target.z + Math.sin(angle) * currentDistance,
      ],
      target: [target.x, target.y + 0.35, target.z],
      fov: lerp(48, 36, progress),
    };
  }

  if (preset === 'overhead') {
    const angle = Math.PI * 0.25 + progress * Math.PI * 0.25;
    return {
      position: [
        target.x + Math.cos(angle) * distance * 0.45,
        target.y + height * 2.25,
        target.z + Math.sin(angle) * distance * 0.45,
      ],
      target: [target.x, target.y, target.z],
      fov: 42,
    };
  }

  return null;
}

function Scene({ playbackSpeed, autoRotate, frames, onFrame, isPlaying, isLooping, timeRefExternal, playbackStateRef, cameraPath }) {
  const controlsRef = useRef();
  const chaserRef = useRef(null);
  const animStateRef = useRef({ time: 0, chaser: null, isPlaying: true, isLooping: true });
  const lastCenterRef = useRef(null);
  const lastPosRef = useRef(null);
  const MAX_CAMERA_JUMP = 2.0;
  const BLEND_FRAMES = 3;

  const initialCenter = useMemo(() => {
    if (!frames?.length) return [0, 1, 0];
    const first = frames[0];
    const p1 = first[0][20];
    const p2 = first[1][20];
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
  }, [frames]);

  if (chaserRef.current === null) {
    chaserRef.current = new THREE.Vector3(initialCenter[0], initialCenter[1], initialCenter[2]);
    animStateRef.current.chaser = chaserRef.current;
    lastCenterRef.current = new THREE.Vector3(initialCenter[0], initialCenter[1], initialCenter[2]);
  }

  const externalPaused =
    playbackStateRef && playbackStateRef.current && typeof playbackStateRef.current.paused === 'boolean'
      ? playbackStateRef.current.paused
      : null;
  const effectiveIsPlaying = externalPaused === null ? isPlaying : !externalPaused;

  animStateRef.current.isPlaying = effectiveIsPlaying;
  animStateRef.current.isLooping = isLooping;

  useFrame((state, delta) => {
    if (!frames?.length) return;

    if (timeRefExternal && typeof timeRefExternal.current === 'number') {
      animStateRef.current.time = timeRefExternal.current;
    }

    if (effectiveIsPlaying) {
      const dt = Math.min(delta, 0.05) * playbackSpeed;
      animStateRef.current.time += dt;
    }

    if (timeRefExternal) {
      timeRefExternal.current = animStateRef.current.time;
    }

    const total = frames.length;

    if (total === 1) {
      if (onFrame) onFrame(0);
      return;
    }

    let raw;
    if (isLooping) {
      raw = animStateRef.current.time % (total - 1);
    } else {
      raw = Math.min(animStateRef.current.time, total - 1);
    }

    const idx = Math.floor(raw);
    const t = raw - idx;

    const cur = frames[idx];
    const next = frames[Math.min(idx + 1, total - 1)];

    if (!lastPosRef.current) {
      lastPosRef.current = cur[0][20].slice();
    }

    const curCenterX = (cur[0][20][0] + cur[1][20][0]) * 0.5;
    const curCenterY = (cur[0][20][1] + cur[1][20][1]) * 0.5;
    const curCenterZ = (cur[0][20][2] + cur[1][20][2]) * 0.5;

    const nextCenterX = (next[0][20][0] + next[1][20][0]) * 0.5;
    const nextCenterY = (next[0][20][1] + next[1][20][1]) * 0.5;
    const nextCenterZ = (next[0][20][2] + next[1][20][2]) * 0.5;

    let targetX = curCenterX + (nextCenterX - curCenterX) * t;
    let targetY = curCenterY + (nextCenterY - curCenterY) * t;
    let targetZ = curCenterZ + (nextCenterZ - curCenterZ) * t;

    const lastCore = lastPosRef.current;
    const coreJumpDist = Math.sqrt(
      Math.pow(curCenterX - lastCore[0], 2) +
      Math.pow(curCenterZ - lastCore[2], 2)
    );

    if (coreJumpDist > 0.5 && idx < BLEND_FRAMES) {
      const blendFactor = Math.min(1, idx / BLEND_FRAMES);
      const smoothFactor = blendFactor * 0.5;
      targetX = lastCore[0] + (targetX - lastCore[0]) * smoothFactor;
      targetZ = lastCore[2] + (targetZ - lastCore[2]) * smoothFactor;
    }

    lastPosRef.current = [curCenterX, curCenterY, curCenterZ];

    const lastCenter = lastCenterRef.current;
    const jumpDist = Math.sqrt(
      Math.pow(targetX - lastCenter.x, 2) +
      Math.pow(targetZ - lastCenter.z, 2)
    );

    if (jumpDist > MAX_CAMERA_JUMP) {
      const clampedJump = MAX_CAMERA_JUMP;
      targetX = lastCenter.x + (targetX - lastCenter.x) * (clampedJump / jumpDist);
      targetZ = lastCenter.z + (targetZ - lastCenter.z) * (clampedJump / jumpDist);
    }

    lastCenter.x = targetX;
    lastCenter.y = targetY;
    lastCenter.z = targetZ;

    const targetY_scaled = targetY * 0.7;

    const chaser = chaserRef.current;
    chaser.x += (targetX - chaser.x) * 0.2;
    chaser.y += (targetY_scaled - chaser.y) * 0.2;
    chaser.z += (targetZ - chaser.z) * 0.2;

    if (controlsRef.current) {
      controlsRef.current.target.copy(chaser);
    }

    const progress = total > 1 ? Math.max(0, Math.min(1, raw / (total - 1))) : 0;
    const cameraPose = cameraPath ? resolveCameraPose(cameraPath, progress, chaser) : null;
    if (cameraPose) {
      state.camera.position.lerp(new THREE.Vector3(...cameraPose.position), 0.16);
      if (cameraPose.fov && state.camera.isPerspectiveCamera) {
        state.camera.fov += (cameraPose.fov - state.camera.fov) * 0.12;
        state.camera.updateProjectionMatrix();
      }
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(...cameraPose.target), 0.2);
        controlsRef.current.update();
      } else {
        state.camera.lookAt(...cameraPose.target);
      }
    }

    if (onFrame) onFrame(idx);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <hemisphereLight args={['#ffffff', '#999999', 0.3]} />

      <Grid animStateRef={animStateRef} />

      <HumanPlayer
        color={COLOR_ATTACKER}
        glowColor={COLOR_ATTACKER_GLOW}
        isAttacker={true}
        frames={frames}
        animStateRef={animStateRef}
      />
      <HumanPlayer
        color={COLOR_DEFENDER}
        glowColor={COLOR_DEFENDER_GLOW}
        isAttacker={false}
        frames={frames}
        animStateRef={animStateRef}
      />

      <OrbitControls
        ref={controlsRef}
        target={initialCenter}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enablePan
        enableZoom
        enableRotate
      />
    </>
  );
}

export default function UchimataCard({
  className = '',
  style = {},
  playbackSpeed = 1.0,
  autoRotate = false,
  cameraPosition = [5, 3.5, 5],
  scene = defaultSceneData,
  onFrame,
  showStats = false,
  isPlaying = true,
  isLooping = true,
  timeRef = null,
  playbackStateRef = null,
  cameraPath = null,
  ...props
}) {
  const frames = scene.frames;
  return (
    <div
      className={`uchimata-card ${className}`}
      style={{
        width: '100%',
        height: '400px',
        background: 'transparent',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style
      }}
      {...props}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        {showStats && <Stats />}
        <Scene 
          playbackSpeed={playbackSpeed} 
          autoRotate={autoRotate} 
          frames={frames} 
          onFrame={onFrame}
          isPlaying={isPlaying}
          isLooping={isLooping}
          timeRefExternal={timeRef}
          playbackStateRef={playbackStateRef}
          cameraPath={cameraPath}
        />
      </Canvas>
    </div>
  );
}
