// renderer.js — Three.js wireframe mannequin renderer
// Efficient: geometry created once, only transforms update per frame

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { SEGMENTS, JOINT_RADII, JOINT_VISIBLE, JOINT_COUNT, J } from './grapplemap.js';

const UP = new THREE.Vector3(0, 1, 0);

// ── Player mesh factory ─────────────────────────────
// Creates all spheres + cylinders ONCE, returns update() to reposition them.
function createPlayerMeshes(scene, color) {
    const mat = new THREE.MeshPhongMaterial({
        color, emissive: color, emissiveIntensity: 0.15,
        transparent: true, opacity: 0.85, shininess: 40
    });

    // Joint spheres (created once, shared geometry per radius)
    const spheres = [];
    for (let j = 0; j < JOINT_COUNT; j++) {
        if (JOINT_VISIBLE[j]) {
            const geo = new THREE.SphereGeometry(JOINT_RADII[j], 8, 6);
            const mesh = new THREE.Mesh(geo, mat);
            scene.add(mesh);
            spheres.push(mesh);
        } else {
            spheres.push(null);
        }
    }

    // Bone cylinders (unit height, scaled per frame)
    const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
    const bones = [];
    for (const seg of SEGMENTS) {
        if (!seg[2]) { bones.push(null); continue; } // not visible
        const mesh = new THREE.Mesh(unitCyl, mat);
        scene.add(mesh);
        bones.push(mesh);
    }

    const _from = new THREE.Vector3();
    const _to = new THREE.Vector3();
    const _mid = new THREE.Vector3();
    const _dir = new THREE.Vector3();

    return {
        update(joints) {
            // Update sphere positions (no geometry change)
            for (let j = 0; j < JOINT_COUNT; j++) {
                if (spheres[j]) {
                    spheres[j].position.set(joints[j].x, joints[j].y, joints[j].z);
                }
            }
            // Update bone transforms (no geometry change)
            for (let i = 0; i < SEGMENTS.length; i++) {
                if (!bones[i]) continue;
                const [jFrom, jTo] = SEGMENTS[i][0];
                const radius = SEGMENTS[i][1];

                _from.set(joints[jFrom].x, joints[jFrom].y, joints[jFrom].z);
                _to.set(joints[jTo].x, joints[jTo].y, joints[jTo].z);
                _mid.addVectors(_from, _to).multiplyScalar(0.5);
                _dir.subVectors(_to, _from);
                const len = _dir.length();

                bones[i].position.copy(_mid);
                bones[i].scale.set(radius, len, radius);

                if (len > 0.0001) {
                    _dir.normalize();
                    bones[i].quaternion.setFromUnitVectors(UP, _dir);
                }
            }
        },
        dispose() {
            for (const s of spheres) if (s) { scene.remove(s); s.geometry.dispose(); }
            for (const b of bones) if (b) { scene.remove(b); b.geometry.dispose(); }
            mat.dispose();
            unitCyl.dispose();
        }
    };
}

// ── GrappleMapScene ─────────────────────────────────
// One scene per card. Attaches to a <canvas>.
export class GrappleMapScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.disposed = false;
        this._rafId = null;

        const w = canvas.clientWidth || 400;
        const h = canvas.clientHeight || 300;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0e0e0e, 1);

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(42, w / h, 0.05, 50);
        this.camera.position.set(2.2, 1.4, 2.2);

        // Controls
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.target.set(0, 0.4, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.update();

        // Lights
        this.scene.add(new THREE.AmbientLight(0x404050, 0.7));
        const dir = new THREE.DirectionalLight(0xffeedd, 1.0);
        dir.position.set(3, 5, 3);
        this.scene.add(dir);
        const back = new THREE.DirectionalLight(0x334466, 0.4);
        back.position.set(-2, 3, -2);
        this.scene.add(back);

        // Grid floor
        this.scene.add(new THREE.GridHelper(6, 12, 0x2a2a3a, 0x1a1a28));

        // Players (created on first frame)
        this.player0 = null;
        this.player1 = null;

        // Animation
        this._animPlayer = null;
        this._currentFrame = null;

        // Start render loop
        this._tick = this._tick.bind(this);
        this._rafId = requestAnimationFrame(this._tick);
    }

    _tick(t) {
        if (this.disposed) return;
        this._rafId = requestAnimationFrame(this._tick);

        // Advance animation
        if (this._animPlayer) {
            const frame = this._animPlayer.tick(t);
            if (frame) this._displayFrame(frame);
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    _displayFrame(frame) {
        this._currentFrame = frame;
        if (!this.player0) {
            this.player0 = createPlayerMeshes(this.scene, 0xcc3333);
            this.player1 = createPlayerMeshes(this.scene, 0x3366cc);
        }
        this.player0.update(frame[0]);
        this.player1.update(frame[1]);
    }

    _centerOn(frame) {
        const c0 = frame[0][J.Core], c1 = frame[1][J.Core];
        const cx = (c0.x + c1.x) / 2;
        const cy = Math.max((c0.y + c1.y) / 2, 0.3);
        const cz = (c0.z + c1.z) / 2;
        this.controls.target.set(cx, cy, cz);
        this.camera.position.set(cx + 2, cy + 1.2, cz + 2);
        this.controls.update();
    }

    /** Display a single static frame (for positions) */
    setFrame(frame) {
        this._animPlayer = null;
        this._displayFrame(frame);
        this._centerOn(frame);
    }

    /** Animate through frames using an AnimationPlayer */
    setAnimationPlayer(animPlayer) {
        this._animPlayer = animPlayer;
        if (animPlayer.frames.length > 0) {
            this._displayFrame(animPlayer.frames[0]);
            this._centerOn(animPlayer.frames[0]);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        if (w > 0 && h > 0) {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        }
    }

    dispose() {
        this.disposed = true;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        if (this.player0) this.player0.dispose();
        if (this.player1) this.player1.dispose();
        this.controls.dispose();
        this.renderer.dispose();
    }
}
