/**
 * UchimataCard.jsx
 * React-Three-Fiber component for the Uchimata throw animation.
 *
 * Scientific Research aesthetic:
 * - Parchment background (handled by parent)
 * - Transparent WebGL canvas
 * - Charcoal #2B2B2B (Attacker) and Faded Graphite #888888 (Defender) wireframes
 *
 * Performance optimized:
 * - Pre-allocated geometries and materials (no GC in render loop)
 * - Interpolated animation with delta-time
 *
 * Usage:
 *   import UchimataCard from './components/UchimataCard';
 *   <UchimataCard playbackSpeed={1.0} autoRotate={false} />
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import sceneData from '../test/uchimata_scene.json';

// ── Constants ───────────────────────────────────────────────────────────────
const JOINT_COUNT = 23;
const SEGMENT_COUNT = 28;
const PLAYER_COUNT = 2;

// Arkived color palette
const COLOR_ATTACKER = '#2B2B2B';      // Charcoal
const COLOR_DEFENDER = '#888888';      // Faded Graphite

// Volumetric radii (from playerdrawer.cpp)
const RADIUS_TORSO = 0.1;
const RADIUS_THIGH = 0.085;
const RADIUS_SHIN = 0.055;
const RADIUS_FOREARM = 0.03;
const RADIUS_UPPERARM = 0.045;
const RADIUS_HEAD = 0.11;
const RADIUS_NECK = 0.05;
const RADIUS_HIP = 0.09;
const RADIUS_SHOULDER = 0.08;
const RADIUS_HAND = 0.02;
const RADIUS_FOOT = 0.025;

// ── Segment Definitions (from gm.js / players.hpp) ───────────────────────────
// Format: [fromJoint, toJoint, radius]
const SEGMENTS = [
  // Left leg
  [0, 2, RADIUS_FOOT],      // LeftToe - LeftHeel
  [0, 4, RADIUS_FOOT],      // LeftToe - LeftAnkle
  [2, 4, RADIUS_FOOT],      // LeftHeel - LeftAnkle
  [4, 6, RADIUS_SHIN],      // LeftAnkle - LeftKnee
  [6, 8, RADIUS_THIGH],     // LeftKnee - LeftHip
  [8, 20, RADIUS_TORSO],    // LeftHip - Core
  // Left arm
  [20, 10, RADIUS_SHOULDER], // Core - LeftShoulder
  [10, 12, RADIUS_UPPERARM], // LeftShoulder - LeftElbow
  [12, 14, RADIUS_FOREARM],  // LeftElbow - LeftWrist
  [14, 16, RADIUS_HAND],     // LeftWrist - LeftHand
  [16, 18, RADIUS_HAND],     // LeftHand - LeftFingers
  [14, 18, RADIUS_HAND],     // LeftWrist - LeftFingers (aux)
  // Right leg
  [1, 3, RADIUS_FOOT],      // RightToe - RightHeel
  [1, 5, RADIUS_FOOT],      // RightToe - RightAnkle
  [3, 5, RADIUS_FOOT],      // RightHeel - RightAnkle
  [5, 7, RADIUS_SHIN],      // RightAnkle - RightKnee
  [7, 9, RADIUS_THIGH],     // RightKnee - RightHip
  [9, 20, RADIUS_TORSO],    // RightHip - Core
  // Right arm
  [20, 11, RADIUS_SHOULDER], // Core - RightShoulder
  [11, 13, RADIUS_UPPERARM], // RightShoulder - RightElbow
  [13, 15, RADIUS_FOREARM],  // RightElbow - RightWrist
  [15, 17, RADIUS_HAND],     // RightWrist - RightHand
  [17, 19, RADIUS_HAND],     // RightHand - RightFingers
  [15, 19, RADIUS_HAND],     // RightWrist - RightFingers (aux)
  // Torso/Neck
  [8, 9, RADIUS_HIP],        // LeftHip - RightHip (pelvis)
  [10, 21, RADIUS_NECK],     // LeftShoulder - Neck
  [11, 21, RADIUS_NECK],     // RightShoulder - Neck
  [21, 22, RADIUS_HEAD],     // Neck - Head
];

// Visible segments filter (matching original visibility)
const VISIBLE_SEGMENTS = [0, 3, 4, 5, 7, 8, 9, 10, 12, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26, 27];

// Joint radii (from gm.js)
const JOINT_RADII = [
  0.025, 0.025, 0.03, 0.03, 0.03, 0.03, 0.05, 0.05,
  0.09, 0.09, 0.08, 0.08, 0.045, 0.045, 0.02, 0.02,
  0.02, 0.02, 0.02, 0.02, 0.1, 0.05, 0.11
];

// ── Joint Lerp Helper ───────────────────────────────────────────────────────
function lerpJoints(a, b, t) {
  return [
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t
  ];
}

// ── Player Mesh Component ────────────────────────────────────────────────────
function PlayerMesh({ frames, color, isAttacker, playbackSpeed = 1.0 }) {
  const meshRef = useRef();
  const timeRef = useRef(0);

  // Pre-allocate geometries and materials (NO GC in render loop)
  const { jointGeoms, limbGeoms, jointMats, limbMats } = useMemo(() => {
    const jGeoms = [];
    const lGeoms = [];
    const jMats = [];
    const lMats = [];

    // Create 23 joint geometries (Icosahedron) per player
    for (let i = 0; i < JOINT_COUNT; i++) {
      const radius = JOINT_RADII[i];
      // Scale visible joints slightly larger for wireframe aesthetic
      const geom = new THREE.IcosahedronGeometry(radius * 1.2, 1);
      jGeoms.push(geom);

      const mat = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      jMats.push(mat);
    }

    // Create 28 limb geometries (Cylinder) per player
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const [, , radius] = SEGMENTS[i];
      // Cylinder: radiusTop, radiusBottom, height, radialSegments
      // Height starts at 1, will be scaled dynamically
      const geom = new THREE.CylinderGeometry(radius, radius, 1, 8, 1);
      geom.translate(0, 0.5, 0); // Move pivot to bottom
      lGeoms.push(geom);

      const mat = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
      lMats.push(mat);
    }

    return { jointGeoms: jGeoms, limbGeoms: lGeoms, jointMats: jMats, limbMats: lMats };
  }, [color]);

  // Initialize mesh instances
  useEffect(() => {
    if (!meshRef.current) return;

    const group = meshRef.current;

    // Clear any existing children
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Add joint meshes
    for (let i = 0; i < JOINT_COUNT; i++) {
      const mesh = new THREE.Mesh(jointGeoms[i], jointMats[i]);
      mesh.name = `joint_${i}`;
      mesh.userData.jointIndex = i;
      group.add(mesh);
    }

    // Add limb meshes
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const mesh = new THREE.Mesh(limbGeoms[i], limbMats[i]);
      mesh.name = `limb_${i}`;
      mesh.userData.segmentIndex = i;
      mesh.visible = VISIBLE_SEGMENTS.includes(i);
      group.add(mesh);
    }
  }, [jointGeoms, limbGeoms, jointMats, limbMats]);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || frames.length < 2) return;

    const group = meshRef.current;

    // Advance time with fractional frame tracking
    timeRef.current += delta * playbackSpeed;

    // Calculate current frame index with wrap-around
    const totalFrames = frames.length;
    const rawFrame = timeRef.current % (totalFrames - 1);
    const frameIdx = Math.floor(rawFrame);
    const frameT = rawFrame - frameIdx; // Fractional interpolation factor

    // Get current and next frame
    const currentFrame = frames[Math.min(frameIdx, totalFrames - 1)];
    const nextFrame = frames[Math.min(frameIdx + 1, totalFrames - 1)];

    // Player index (0 = top/attacker, 1 = bottom/defender)
    const playerIdx = isAttacker ? 0 : 1;
    const playerJointsCurrent = currentFrame[playerIdx];
    const playerJointsNext = nextFrame[playerIdx];

    // Update joint positions with lerp
    for (let i = 0; i < JOINT_COUNT; i++) {
      const jointMesh = group.children[i];
      if (!jointMesh) continue;

      const current = playerJointsCurrent[i];
      const next = playerJointsNext[i];
      const pos = lerpJoints(current, next, frameT);

      jointMesh.position.set(pos[0], pos[1], pos[2]);
    }

    // Update limb positions and orientations
    const tempVecA = new THREE.Vector3();
    const tempVecB = new THREE.Vector3();
    const tempUp = new THREE.Vector3(0, 1, 0);

    for (let segIdx = 0; segIdx < SEGMENT_COUNT; segIdx++) {
      const limbMesh = group.children[JOINT_COUNT + segIdx];
      if (!limbMesh || !limbMesh.visible) continue;

      const [fromJoint, toJoint] = SEGMENTS[segIdx];

      // Get joint positions
      const fromCurrent = playerJointsCurrent[fromJoint];
      const fromNext = playerJointsNext[fromJoint];
      const toCurrent = playerJointsCurrent[toJoint];
      const toNext = playerJointsNext[toJoint];

      // Lerp joint positions
      const fromPos = lerpJoints(fromCurrent, fromNext, frameT);
      const toPos = lerpJoints(toCurrent, toNext, frameT);

      tempVecA.set(fromPos[0], fromPos[1], fromPos[2]);
      tempVecB.set(toPos[0], toPos[1], toPos[2]);

      // Calculate distance for cylinder scaling
      const distance = tempVecA.distanceTo(tempVecB);

      // Position at start joint
      limbMesh.position.copy(tempVecA);

      // Orient cylinder to point at end joint using quaternion
      const direction = tempVecB.clone().sub(tempVecA).normalize();
      limbMesh.quaternion.setFromUnitVectors(tempUp, direction);

      // Scale height to match distance
      limbMesh.scale.set(1, distance, 1);
    }
  });

  return <group ref={meshRef} />;
}

// ── Scene Component ───────────────────────────────────────────────────────────
function UchimataScene({ playbackSpeed = 1.0, autoRotate = false }) {
  const { frames } = sceneData;

  // Center the camera on the initial position
  const center = useMemo(() => {
    if (!frames || frames.length === 0) return [0, 1, 0];
    const firstFrame = frames[0];
    const p1 = firstFrame[0][20]; // Player 1 Core
    const p2 = firstFrame[1][20]; // Player 2 Core
    return [
      (p1[0] + p2[0]) / 2,
      (p1[1] + p2[1]) / 2,
      (p1[2] + p2[2]) / 2
    ];
  }, [frames]);

  return (
    <>
      {/* Ambient light for wireframe visibility */}
      <ambientLight intensity={1.5} />

      {/* Grid helper for scientific aesthetic */}
      <gridHelper
        args={[10, 20, '#CCCCCC', '#E5E5E5']}
        position={[center[0], 0, center[2]]}
      />

      {/* Attacker (Tor) - Charcoal */}
      <PlayerMesh
        frames={frames}
        color={COLOR_ATTACKER}
        isAttacker={true}
        playbackSpeed={playbackSpeed}
      />

      {/* Defender (Uke) - Faded Graphite */}
      <PlayerMesh
        frames={frames}
        color={COLOR_DEFENDER}
        isAttacker={false}
        playbackSpeed={playbackSpeed}
      />

      {/* Camera controls */}
      <OrbitControls
        target={center}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />
    </>
  );
}

// ── Main Card Component ──────────────────────────────────────────────────────
export default function UchimataCard({
  className = '',
  style = {},
  playbackSpeed = 1.0,
  autoRotate = false,
  cameraPosition = [4, 3, 4],
  ...props
}) {
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
        camera={{
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <UchimataScene
          playbackSpeed={playbackSpeed}
          autoRotate={autoRotate}
        />
      </Canvas>
    </div>
  );
}
