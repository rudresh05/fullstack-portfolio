"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";

interface GardenPath3DProps {
  curve: THREE.CatmullRomCurve3;
  totalLengthZ: number;
}

// Lightweight Procedural Cherry Blossom Tree
function SakuraTree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.18, 0.38, 3.6, 5]} />
        <meshStandardMaterial color="#1a0f18" roughness={0.9} />
      </mesh>
      {/* Blossom Foliage Clouds */}
      <mesh position={[0, 4.0, 0]}>
        <dodecahedronGeometry args={[1.7, 0]} />
        <meshStandardMaterial color="#fb7185" roughness={0.5} emissive="#f43f5e" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-1.0, 3.7, 0.6]}>
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="#fda4af" roughness={0.5} emissive="#fb7185" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[1.1, 3.9, -0.5]}>
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="#f472b6" roughness={0.5} emissive="#e11d48" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// Lightweight Roadside Lantern
function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 2.4, 4]} />
        <meshStandardMaterial color="#2d1b2a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#fed7aa" emissive="#fda4af" emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} intensity={1.0} color="#fda4af" distance={6} />
    </group>
  );
}

export function GardenPath3D({ curve }: GardenPath3DProps) {
  const scroll = useScroll();
  const petalsRef = useRef<THREE.InstancedMesh>(null);
  const petalCount = 80; // Optimized petal count
  const [cameraT, setCameraT] = useState(0.02);

  useFrame(() => {
    const normalized = (scroll.offset % 1.0 + 1.0) % 1.0;
    setCameraT(normalized);
  });

  // 1. Build road ribbon with optimized segments
  const { roadGeometry, leftRailGeometry, rightRailGeometry, allTrees, allLanterns, allFlowers } = useMemo(() => {
    const segments = 220; // Lightweight optimized segment count
    const width = 3.6;
    const railWidth = 0.12;

    const roadPositions: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    const leftRailPos: number[] = [];
    const leftRailIndices: number[] = [];
    const rightRailPos: number[] = [];
    const rightRailIndices: number[] = [];

    const trees: { t: number; pos: [number, number, number]; scale: number; rot: number }[] = [];
    const lanterns: { t: number; pos: [number, number, number] }[] = [];
    const flowers: { t: number; pos: [number, number, number] }[] = [];

    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const halfW = width / 2;
      const leftP = new THREE.Vector3().copy(point).sub(normal.clone().multiplyScalar(halfW));
      const rightP = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(halfW));

      const roadY = point.y + 0.05;
      roadPositions.push(leftP.x, roadY, leftP.z);
      roadPositions.push(rightP.x, roadY, rightP.z);

      roadUvs.push(0, t * 40);
      roadUvs.push(1, t * 40);

      const railY = roadY + 0.04;
      const lInner = leftP.clone().add(normal.clone().multiplyScalar(railWidth));
      leftRailPos.push(leftP.x, railY, leftP.z);
      leftRailPos.push(lInner.x, railY, lInner.z);

      const rInner = rightP.clone().sub(normal.clone().multiplyScalar(railWidth));
      rightRailPos.push(rInner.x, railY, rInner.z);
      rightRailPos.push(rightP.x, railY, rightP.z);

      if (i < segments) {
        const base = i * 2;
        roadIndices.push(base, base + 1, base + 2);
        roadIndices.push(base + 1, base + 3, base + 2);

        leftRailIndices.push(base, base + 1, base + 2);
        leftRailIndices.push(base + 1, base + 3, base + 2);

        rightRailIndices.push(base, base + 1, base + 2);
        rightRailIndices.push(base + 1, base + 3, base + 2);
      }

      // Procedural trees
      if (point.z < -8 && i % 8 === 0) {
        const side = (i % 16 === 0) ? 1 : -1;
        const treeOffset = normal.clone().multiplyScalar(side * (5.5 + (i % 4)));
        const treePos = point.clone().add(treeOffset);
        trees.push({
          t,
          pos: [treePos.x, point.y, treePos.z],
          scale: 0.85 + (i % 3) * 0.15,
          rot: (i * 0.5) % (Math.PI * 2),
        });
      }

      // Procedural lanterns
      if (point.z < -4 && i % 12 === 0) {
        const side = (i % 24 === 0) ? 1 : -1;
        const lanternOffset = normal.clone().multiplyScalar(side * (halfW + 0.6));
        const lanternPos = point.clone().add(lanternOffset);
        lanterns.push({ t, pos: [lanternPos.x, point.y, lanternPos.z] });
      }

      // Procedural flowers
      if (point.z < -5 && i % 6 === 0) {
        const side = (i % 12 === 0) ? 1 : -1;
        const flowerOffset = normal.clone().multiplyScalar(side * (halfW + 1.2));
        const flowerPos = point.clone().add(flowerOffset);
        flowers.push({ t, pos: [flowerPos.x, point.y, flowerPos.z] });
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(roadPositions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(roadUvs, 2));
    geom.setIndex(roadIndices);
    geom.computeVertexNormals();

    const leftGeom = new THREE.BufferGeometry();
    leftGeom.setAttribute("position", new THREE.Float32BufferAttribute(leftRailPos, 3));
    leftGeom.setIndex(leftRailIndices);
    leftGeom.computeVertexNormals();

    const rightGeom = new THREE.BufferGeometry();
    rightGeom.setAttribute("position", new THREE.Float32BufferAttribute(rightRailPos, 3));
    rightGeom.setIndex(rightRailIndices);
    rightGeom.computeVertexNormals();

    return {
      roadGeometry: geom,
      leftRailGeometry: leftGeom,
      rightRailGeometry: rightGeom,
      allTrees: trees,
      allLanterns: lanterns,
      allFlowers: flowers,
    };
  }, [curve]);

  // 🪟 SLIDING WINDOW: Filter trees and scenery near current camera position (dT < 0.15)
  const visibleTrees = useMemo(() => {
    return allTrees.filter((item) => {
      const dt = Math.abs(item.t - cameraT);
      const wrapDt = Math.min(dt, 1.0 - dt);
      return wrapDt < 0.15;
    });
  }, [allTrees, cameraT]);

  const visibleLanterns = useMemo(() => {
    return allLanterns.filter((item) => {
      const dt = Math.abs(item.t - cameraT);
      const wrapDt = Math.min(dt, 1.0 - dt);
      return wrapDt < 0.15;
    });
  }, [allLanterns, cameraT]);

  const visibleFlowers = useMemo(() => {
    return allFlowers.filter((item) => {
      const dt = Math.abs(item.t - cameraT);
      const wrapDt = Math.min(dt, 1.0 - dt);
      return wrapDt < 0.15;
    });
  }, [allFlowers, cameraT]);

  // 2. Floating Cherry Blossom Petals Particles (Optimized)
  const initialPetalData = useMemo(() => {
    return Array.from({ length: petalCount }, () => ({
      x: (Math.random() - 0.5) * 30,
      y: Math.random() * 7 + 0.5,
      z: (Math.random() - 0.5) * 200 - 60,
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      rotZ: Math.random() * Math.PI,
      speedY: 0.015 + Math.random() * 0.02,
      speedX: (Math.random() - 0.5) * 0.015,
      rotSpeed: 0.01 + Math.random() * 0.02,
      scale: 0.08 + Math.random() * 0.1,
    }));
  }, [petalCount]);

  const petalState = useRef(initialPetalData);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, delta) => {
    if (!petalsRef.current) return;

    petalState.current.forEach((petal, i) => {
      petal.y -= petal.speedY * (delta * 60);
      petal.x += Math.sin(petal.y * 2) * petal.speedX * (delta * 60);
      petal.rotX += petal.rotSpeed;
      petal.rotY += petal.rotSpeed;

      if (petal.y < 0.2) {
        petal.y = 7 + Math.random() * 2;
        petal.x = (Math.random() - 0.5) * 30;
      }

      tempMatrix.makeRotationFromEuler(new THREE.Euler(petal.rotX, petal.rotY, petal.rotZ));
      tempMatrix.setPosition(petal.x, petal.y, petal.z);
      tempMatrix.scale(new THREE.Vector3(petal.scale, petal.scale, petal.scale * 0.3));

      petalsRef.current!.setMatrixAt(i, tempMatrix);
    });

    petalsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -120]} receiveShadow>
        <planeGeometry args={[160, 420]} />
        <meshStandardMaterial color="#080309" roughness={0.9} />
      </mesh>

      {/* Road Ribbon */}
      <mesh geometry={roadGeometry} receiveShadow>
        <meshStandardMaterial color="#16081c" roughness={0.65} metalness={0.25} />
      </mesh>

      {/* Glowing Border Strips */}
      <mesh geometry={leftRailGeometry}>
        <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={1.0} toneMapped={false} />
      </mesh>
      <mesh geometry={rightRailGeometry}>
        <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={1.0} toneMapped={false} />
      </mesh>

      {/* 🪟 SLIDING WINDOW: Visible Trees */}
      {visibleTrees.map((t, idx) => (
        <SakuraTree key={idx} position={t.pos} scale={t.scale} rotation={t.rot} />
      ))}

      {/* 🪟 SLIDING WINDOW: Visible Lanterns */}
      {visibleLanterns.map((l, idx) => (
        <Lantern key={idx} position={l.pos} />
      ))}

      {/* 🪟 SLIDING WINDOW: Visible Flowers */}
      {visibleFlowers.map((f, idx) => (
        <mesh key={idx} position={f.pos}>
          <sphereGeometry args={[0.18, 4, 4]} />
          <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* Floating Petals */}
      <instancedMesh ref={petalsRef} args={[undefined, undefined, petalCount]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#fda4af"
          emissive="#fb7185"
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
    </group>
  );
}
