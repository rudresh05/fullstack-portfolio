"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { Volume2, VolumeX } from "lucide-react";

// Web Audio Synthesizer for Forest Birds & Koyal Cuckoo
class NatureAudio {
  ctx: AudioContext | null = null;
  birdTimer: NodeJS.Timeout | null = null;
  koyalTimer: NodeJS.Timeout | null = null;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  chirp() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 2100 + Math.random() * 800;
      osc.type = "sine";
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(startFreq + 600, this.ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(startFreq - 200, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Ignore
    }
  }

  playKoyal() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(540, now);
      osc1.frequency.exponentialRampToValueAtTime(640, now + 0.25);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(660, now + 0.38);
      osc2.frequency.exponentialRampToValueAtTime(780, now + 0.7);
      gain2.gain.setValueAtTime(0.001, now + 0.38);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.48);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.38);
      osc2.stop(now + 0.85);
    } catch {
      // Ignore
    }
  }

  startAmbient() {
    this.stopAmbient();
    this.birdTimer = setInterval(() => {
      if (Math.random() > 0.3) this.chirp();
    }, 1300);

    this.koyalTimer = setInterval(() => {
      this.playKoyal();
    }, 4500);
  }

  stopAmbient() {
    if (this.birdTimer) clearInterval(this.birdTimer);
    if (this.koyalTimer) clearInterval(this.koyalTimer);
  }
}

const natureAudio = new NatureAudio();

export default function GoodMorningCutiePage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();

    // Procedural Sunrise Gradient Canvas Sky
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 1;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext("2d");
    if (skyCtx) {
      const grad = skyCtx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, "#2a1b3d"); // Deep morning violet
      grad.addColorStop(0.3, "#a4508b"); // Warm rose mist
      grad.addColorStop(0.65, "#ff758c"); // Sunrise pink
      grad.addColorStop(0.85, "#ff7e5f"); // Soft coral horizon
      grad.addColorStop(1, "#feb47b"); // Golden sun glow
      skyCtx.fillStyle = grad;
      skyCtx.fillRect(0, 0, 1, 512);
    }
    scene.background = new THREE.CanvasTexture(skyCanvas);
    scene.fog = new THREE.FogExp2(0xa4508b, 0.014);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 3, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Soft Warm Lighting
    const ambientLight = new THREE.AmbientLight(0xffecd2, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfeb47b, 3.5);
    sunLight.position.set(8, 22, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    const fillLight = new THREE.PointLight(0xff758c, 1.8, 60);
    fillLight.position.set(-10, 8, 10);
    scene.add(fillLight);

    // 3. Volumetric 3D Sun Orb Mesh
    const sunGeo = new THREE.SphereGeometry(5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(5, 16, -45);
    scene.add(sunMesh);

    const glowGeo = new THREE.SphereGeometry(7.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfeb47b,
      transparent: true,
      opacity: 0.45,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    sunMesh.add(glowMesh);

    // 4. Smooth Rolling Meadow Ground Terrain (No sharp spikes!)
    const terrainGeo = new THREE.PlaneGeometry(120, 120, 80, 80);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i);
      const v = posAttr.getY(i);
      let z = Math.sin(u * 0.06) * Math.cos(v * 0.06) * 2;
      posAttr.setZ(i, z);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x2e5a27, // Rich soft green
      roughness: 0.8,
      metalness: 0.05,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -3;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 5. Soft Organic 3D Foliage Trees (Cherry Blossoms & Lush Oaks)
    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.9 });

    const createLushOrganicTree = (tx: number, tz: number, scale: number) => {
      const tree = new THREE.Group();

      // Smooth Curved Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 8 * scale, 12);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = (4 * scale);
      trunk.castShadow = true;
      tree.add(trunk);

      // Lush Organic Cloud Canopies (Soft Spherical Clusters)
      const canopyColors = [0xffb3c6, 0xff85a1, 0xff758f, 0x40916c, 0x52b788];
      const mainColor = canopyColors[Math.floor(Math.random() * canopyColors.length)];

      const canopyMat = new THREE.MeshStandardMaterial({
        color: mainColor,
        roughness: 0.7,
      });

      const clusterCount = 5;
      for (let c = 0; c < clusterCount; c++) {
        const r = (1.8 + Math.random() * 0.8) * scale;
        const cGeo = new THREE.DodecahedronGeometry(r, 1);

        // Deform vertices for natural organic fluffiness
        const cPos = cGeo.attributes.position;
        for (let i = 0; i < cPos.count; i++) {
          const vx = cPos.getX(i);
          const vy = cPos.getY(i);
          const vz = cPos.getZ(i);
          const noise = 1 + (Math.sin(vx * 3) + Math.cos(vy * 3)) * 0.08;
          cPos.setXYZ(i, vx * noise, vy * noise, vz * noise);
        }
        cGeo.computeVertexNormals();

        const canopyCluster = new THREE.Mesh(cGeo, canopyMat);
        const ox = (Math.random() - 0.5) * 2 * scale;
        const oy = (6.5 + Math.random() * 2) * scale;
        const oz = (Math.random() - 0.5) * 2 * scale;

        canopyCluster.position.set(ox, oy, oz);
        canopyCluster.castShadow = true;
        canopyCluster.receiveShadow = true;
        tree.add(canopyCluster);
      }

      tree.position.set(tx, -3, tz);
      treeGroup.add(tree);
    };

    // Plant 35 Lush Organic Trees
    for (let i = 0; i < 35; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const tx = (Math.random() * 22 + 4) * side;
      const tz = (Math.random() - 0.5) * 50;
      const scale = 0.75 + Math.random() * 0.65;
      createLushOrganicTree(tx, tz, scale);
    }

    // 6. Smooth Curved 3D Meadow Flower Blooming Engine
    const flowerGroup = new THREE.Group();
    scene.add(flowerGroup);

    const createBlooming3DFlower = (x: number, z: number) => {
      const flower = new THREE.Group();

      // Stem
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 8), stemMat);
      stem.position.y = 0.6;
      flower.add(stem);

      // Petals (Soft Rounded Physical Petals)
      const colors = [0xe11d48, 0xf43f5e, 0xfb7185, 0xfacc15, 0xff758f];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const petalMat = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.25,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
      });

      const center = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
      center.position.y = 1.3;
      flower.add(center);

      // 8 Wide Curved Petals
      const petalCount = 8;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), petalMat);
        petal.scale.set(1.5, 0.35, 0.9);
        petal.position.set(Math.cos(angle) * 0.35, 1.3, Math.sin(angle) * 0.35);
        petal.rotation.y = -angle;
        flower.add(petal);
      }

      flower.position.set(x, -2.9, z);
      const finalScale = 0.85 + Math.random() * 0.55;
      flower.scale.set(0.01, 0.01, 0.01);
      flowerGroup.add(flower);

      let currentScale = 0.01;
      const growTimer = setInterval(() => {
        currentScale += (finalScale - currentScale) * 0.15;
        flower.scale.set(currentScale, currentScale, currentScale);
        if (Math.abs(finalScale - currentScale) < 0.02) {
          flower.scale.set(finalScale, finalScale, finalScale);
          clearInterval(growTimer);
        }
      }, 30);
    };

    // Pre-plant 30 Lush Blooming Flowers
    for (let i = 0; i < 30; i++) {
      createBlooming3DFlower((Math.random() - 0.5) * 35, (Math.random() - 0.5) * 30);
    }

    // 7. Floating 3D Blossom Petals & Golden Sun Dust
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 45;
      particlePositions[i + 1] = (Math.random() - 0.5) * 25;
      particlePositions[i + 2] = (Math.random() - 0.5) * 35;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffb3c6,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 8. Interactive Raycaster Spawning Flowers on Tap/Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let targetMouseX = 0;
    let targetMouseY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let cx = 0;
      let cy = 0;
      if ("touches" in e && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if ("clientX" in e) {
        cx = (e as MouseEvent).clientX;
        cy = (e as MouseEvent).clientY;
      }
      targetMouseX = (cx / window.innerWidth - 0.5) * 2;
      targetMouseY = (cy / window.innerHeight - 0.5) * 2;
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      let cx = 0;
      let cy = 0;
      if ("touches" in e && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if ("clientX" in e) {
        cx = (e as MouseEvent).clientX;
        cy = (e as MouseEvent).clientY;
      }

      mouse.x = (cx / window.innerWidth) * 2 - 1;
      mouse.y = -(cy / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(terrainMesh);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        createBlooming3DFlower(point.x, point.z);
      } else {
        createBlooming3DFlower((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15);
      }

      natureAudio.chirp();
      if (Math.random() > 0.5) natureAudio.playKoyal();
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("click", handlePointerDown);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // 9. Three.js Animation Loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Camera Parallax
      camera.position.x += (targetMouseX * 3 - camera.position.x) * 0.05;
      camera.position.y += (-targetMouseY * 1.5 + 3 - camera.position.y) * 0.05;
      camera.lookAt(0, 1, 0);

      // Sun pulsing glow
      sunMesh.rotation.y = elapsedTime * 0.1;
      glowMesh.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.05);

      // Rotate particle system
      particleSystem.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
      reqId = requestAnimationFrame(animate);
    };

    animate();
    natureAudio.startAmbient();

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("click", handlePointerDown);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(reqId);
      natureAudio.stopAmbient();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none cursor-pointer bg-[#a4508b]">
      {/* Pure 3D Soft Organic Morning Garden Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Subtle Sound Control Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSoundEnabled(!soundEnabled);
          if (!soundEnabled) natureAudio.startAmbient();
          else natureAudio.stopAmbient();
        }}
        className="fixed top-5 right-5 z-50 p-3 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-2xl text-rose-900 hover:bg-white transition"
        title="Toggle Audio"
      >
        {soundEnabled ? <Volume2 className="w-5 h-5 text-rose-800" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
      </button>
    </div>
  );
}
