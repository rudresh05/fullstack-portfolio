"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface GardenPath3DProps {
  curve: THREE.CatmullRomCurve3;
  totalLengthZ: number;
}

// Procedural Cherry Blossom Tree Component
function SakuraTree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.2, 0.45, 4, 7]} />
        <meshStandardMaterial color="#1a0f18" roughness={0.9} />
      </mesh>
      {/* Branch Left */}
      <mesh position={[-0.6, 3.2, 0.2]} rotation={[0.4, 0, 0.6]}>
        <cylinderGeometry args={[0.12, 0.22, 2.2, 5]} />
        <meshStandardMaterial color="#1a0f18" roughness={0.9} />
      </mesh>
      {/* Branch Right */}
      <mesh position={[0.7, 3.4, -0.3]} rotation={[-0.3, 0.5, -0.7]}>
        <cylinderGeometry args={[0.1, 0.2, 2.4, 5]} />
        <meshStandardMaterial color="#1a0f18" roughness={0.9} />
      </mesh>

      {/* Blossom Foliage Clouds (Soft glowing pink/rose clusters) */}
      <mesh position={[0, 4.4, 0]}>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#fb7185" roughness={0.4} emissive="#f43f5e" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-1.2, 4.1, 0.8]}>
        <dodecahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color="#fda4af" roughness={0.4} emissive="#fb7185" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.3, 4.3, -0.7]}>
        <dodecahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial color="#f472b6" roughness={0.4} emissive="#e11d48" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.4, 5.2, 0.5]}>
        <dodecahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color="#fbcfe8" roughness={0.4} emissive="#fda4af" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// Romantic Garden Lantern
function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 2.4, 6]} />
        <meshStandardMaterial color="#2d1b2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Lantern Housing */}
      <mesh position={[0, 2.4, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#2d1b2a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glowing Warm Core */}
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshBasicMaterial color="#fed7aa" />
      </mesh>
      {/* Soft local point light */}
      <pointLight position={[0, 2.4, 0]} intensity={0.8} distance={7} color="#fda4af" />
    </group>
  );
}

export function GardenPath3D({ curve }: GardenPath3DProps) {
  const petalsRef = useRef<THREE.Points>(null);

  // 1. Build the curving road ribbon and glowing edge ribbons geometry along the spline
  const { roadGeometry, leftRailGeometry, rightRailGeometry, treeTransforms, lanternTransforms, flowerTransforms } = useMemo(() => {
    const segments = 350;
    const width = 3.6;
    const railWidth = 0.12;

    const roadPositions: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    const leftRailPos: number[] = [];
    const leftRailIndices: number[] = [];
    const rightRailPos: number[] = [];
    const rightRailIndices: number[] = [];

    const trees: { pos: [number, number, number]; scale: number; rot: number }[] = [];
    const lanterns: [number, number, number][] = [];
    const flowers: [number, number, number][] = [];

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

      // Glowing edge strips (ribbons with slight thickness)
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

      // Procedural trees on the outer garden sides (only after passing the gate)
      if (point.z < -8 && i % 14 === 0) {
        const side = (i % 28 === 0) ? 1 : -1;
        const treeOffset = normal.clone().multiplyScalar(side * (5.5 + (i % 5)));
        const treePos = point.clone().add(treeOffset);
        trees.push({
          pos: [treePos.x, point.y, treePos.z],
          scale: 0.85 + (i % 4) * 0.15,
          rot: (i * 0.4) % (Math.PI * 2),
        });
      }



      // Procedural glowing rose / flower patches (only after passing the gate)
      if (point.z < -5 && i % 7 === 0) {
        const side = (i % 14 === 0) ? 1 : -1;
        const flowerOffset = normal.clone().multiplyScalar(side * (halfW + 1.2 + (i % 3) * 0.5));
        const flowerPos = point.clone().add(flowerOffset);
        flowers.push([flowerPos.x, point.y, flowerPos.z]);
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
      treeTransforms: trees,
      lanternTransforms: lanterns,
      flowerTransforms: flowers,
    };
  }, [curve]);

  // 2. Floating Rose Petals & Fairy Sparkles
  const { petalGeometry, initialPositions } = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    const init = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const pt = curve.getPointAt(t);
      const spreadX = (Math.random() - 0.5) * 26;
      const spreadY = 0.5 + Math.random() * 8;
      const spreadZ = (Math.random() - 0.5) * 16;

      const x = pt.x + spreadX;
      const y = pt.y + spreadY;
      const z = pt.z + spreadZ;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      init[i * 3] = x;
      init[i * 3 + 1] = y;
      init[i * 3 + 2] = z;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { petalGeometry: geom, initialPositions: init };
  }, [curve]);

  // Animate drifting rose petals
  useFrame(({ clock }) => {
    if (!petalsRef.current) return;
    const posAttr = petalsRef.current.geometry.attributes.position;
    if (!posAttr) return;

    const time = clock.getElapsedTime();
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < array.length / 3; i++) {
      const idx = i * 3;
      array[idx] = initialPositions[idx] + Math.sin(time * 0.7 + i) * 1.5;
      const originalY = initialPositions[idx + 1];
      const cycleY = (originalY - (time * 0.6 + i * 0.2)) % 8;
      array[idx + 1] = Math.max(0.2, cycleY >= 0 ? cycleY : cycleY + 8);
      array[idx + 2] = initialPositions[idx + 2] + Math.cos(time * 0.5 + i * 0.8) * 1.2;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* 1. Rolling Enchanted Garden Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -150]} receiveShadow>
        <planeGeometry args={[180, 450, 40, 40]} />
        <meshStandardMaterial
          color="#060308"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Curving Cobblestone / Velvet Path */}
      <mesh geometry={roadGeometry}>
        <meshStandardMaterial
          color="#160c18"
          roughness={0.7}
          metalness={0.15}
          emissive="#241028"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 3. Glowing Rose Edge Rails */}
      <mesh geometry={leftRailGeometry}>
        <meshBasicMaterial color="#fda4af" transparent opacity={0.8} />
      </mesh>
      <mesh geometry={rightRailGeometry}>
        <meshBasicMaterial color="#fda4af" transparent opacity={0.8} />
      </mesh>

      {/* 4. Sakura Blossom Trees along the Bends */}
      {treeTransforms.map((tree, idx) => (
        <SakuraTree key={idx} position={tree.pos} scale={tree.scale} rotation={tree.rot} />
      ))}



      {/* 6. Glowing Crystal Flowers Clusters */}
      {flowerTransforms.map((fPos, idx) => (
        <group key={idx} position={fPos}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.18, 7, 7]} />
            <meshStandardMaterial
              color="#fb7185"
              emissive="#f43f5e"
              emissiveIntensity={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0.2, 0.15, 0.1]}>
            <sphereGeometry args={[0.12, 6, 6]} />
            <meshStandardMaterial
              color="#fda4af"
              emissive="#fb7185"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* 7. Drifting Rose Petals & Fairy Lights */}
      <points ref={petalsRef} geometry={petalGeometry}>
        <pointsMaterial
          size={0.28}
          color="#fda4af"
          transparent
          opacity={0.85}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
