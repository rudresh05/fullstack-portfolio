"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Gate3D } from "./Gate3D";
import { GardenPath3D } from "./GardenPath3D";
import { Waypoints3D } from "./Waypoints3D";
import { useRelationship } from "./relationship-provider";
import { buildJourneySpline, getEnrichedChapters, GATE_POSITION, JourneyChapter } from "./journey-path";
import { fetchSetting, subscribeSetting, type ForHerContent } from "@/lib/content-store";

interface Experience3DProps {
  isLocked: boolean;
  isDroneMode?: boolean;
  onUnlock: (token: string) => Promise<boolean>;
  onOpenChapter: (c: JourneyChapter) => void;
  onOpenLetter?: () => void;
}

// Checkpoint locations where 3D Drone Sweeps around Pavilions happen
const DRONE_CHECKPOINTS = [0.35, 0.70, 0.96];

export function Experience3D({
  isLocked,
  isDroneMode = false,
  onUnlock,
  onOpenChapter,
  onOpenLetter,
}: Experience3DProps) {
  const scroll = useScroll();
  const { data } = useRelationship();
  const [forHer, setForHer] = useState<ForHerContent | null>(null);

  // Subscribe to studio settings
  useEffect(() => {
    fetchSetting<ForHerContent>("for_her_content", undefined as any).then((val) => {
      if (val) setForHer(val);
    });
    return subscribeSetting<ForHerContent>("for_her_content", (val) => {
      if (val) setForHer(val);
    });
  }, []);

  // 1. Enriched chapters
  const chapters = useMemo(() => getEnrichedChapters(data, forHer), [data, forHer]);

  // 2. Build the smooth extended 3D spline curve
  const { curve, totalLengthZ } = useMemo(() => {
    return buildJourneySpline(chapters.length);
  }, [chapters.length]);

  // Pavilion positions along the spline for drone targeting
  const pavilionPoints = useMemo(() => {
    return DRONE_CHECKPOINTS.map((t) => {
      const pt = curve.getPointAt(t);
      return new THREE.Vector3(pt.x, pt.y, pt.z);
    });
  }, [curve]);

  // Vector buffers for smooth interpolation
  const currentPos = useRef(new THREE.Vector3(0, 2.2, 14));
  const currentLookAt = useRef(new THREE.Vector3(0, 2.4, 0));
  const droneAngle = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    const elapsed = clock.getElapsedTime();

    if (isLocked) {
      // Floating gently before the entrance gate at z = 14, looking directly at the Gate at z = 0
      const hoverY = 2.2 + Math.sin(elapsed * 1.2) * 0.08;
      camera.position.set(0, hoverY, 14);
      camera.lookAt(0, 2.4, 0);
      return;
    }

    // Wrap scroll offset into modular range [0.01, 0.98] for infinite looping
    const normalizedOffset = (scroll.offset % 1.0 + 1.0) % 1.0;
    const rawT = THREE.MathUtils.lerp(0.015, 0.985, normalizedOffset);

    // Check if we are near any of the recurring Drone Checkpoints (within +- 0.035)
    let activeCheckpointIdx = -1;
    for (let i = 0; i < DRONE_CHECKPOINTS.length; i++) {
      if (Math.abs(rawT - DRONE_CHECKPOINTS[i]) <= 0.035) {
        activeCheckpointIdx = i;
        break;
      }
    }

    const shouldDrone = isDroneMode || activeCheckpointIdx >= 0;

    if (shouldDrone) {
      // 🚁 CINEMATIC 3D ORBITAL DRONE SHOT (Sweeping $360^\circ$ around the nearest Hexagonal Domed House)
      const targetCenter = activeCheckpointIdx >= 0
        ? pavilionPoints[activeCheckpointIdx]
        : pavilionPoints[pavilionPoints.length - 1];

      droneAngle.current += delta * 0.32;
      const radius = 11.5;
      const angle = droneAngle.current;

      const droneX = targetCenter.x + Math.sin(angle) * radius;
      const droneZ = targetCenter.z + Math.cos(angle) * radius;
      const droneY = targetCenter.y + 4.6 + Math.sin(elapsed * 0.5) * 1.2;

      const targetCameraPos = new THREE.Vector3(droneX, droneY, droneZ);
      const targetCameraLook = new THREE.Vector3(targetCenter.x, targetCenter.y + 3.8, targetCenter.z);

      currentPos.current.lerp(targetCameraPos, Math.min(1, delta * 3.2));
      currentLookAt.current.lerp(targetCameraLook, Math.min(1, delta * 3.8));

      camera.position.copy(currentPos.current);
      camera.lookAt(currentLookAt.current);
      return;
    }

    // 🚶 STANDARD WALKING MODE DOWN THE ENCHANTED WINDING ROAD
    const clampedT = Math.max(0.005, Math.min(0.99, rawT));
    const pathPoint = curve.getPointAt(clampedT);

    // Look ahead down the spline
    const lookAheadT = (clampedT + 0.04) % 1.0;
    const lookPoint = curve.getPointAt(lookAheadT);

    // Walking gentle bobbing
    const bob = Math.sin(normalizedOffset * Math.PI * 36) * 0.07;
    const targetY = pathPoint.y + 1.9 + bob;

    const targetCameraPos = new THREE.Vector3(pathPoint.x, targetY, pathPoint.z);
    const targetCameraLook = new THREE.Vector3(lookPoint.x, lookPoint.y + 1.7, lookPoint.z);

    // Smoothly interpolate position and lookAt direction
    currentPos.current.lerp(targetCameraPos, Math.min(1, delta * 4.5));
    currentLookAt.current.lerp(targetCameraLook, Math.min(1, delta * 5.5));

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return (
    <>
      {/* Ambient & Directional Lighting */}
      <ambientLight intensity={0.4} color="#fed7aa" />
      <directionalLight
        position={[15, 30, 10]}
        intensity={0.75}
        color="#fda4af"
      />
      <pointLight position={[0, 5, 4]} intensity={1.5} color="#f43f5e" distance={20} />
      <pointLight position={[0, 4, -45]} intensity={1.2} color="#fb7185" distance={25} />

      {/* Entrance Gate at z = 0 */}
      <Gate3D isLocked={isLocked} onUnlock={onUnlock} position={[GATE_POSITION.x, GATE_POSITION.y, GATE_POSITION.z]} />

      {/* Winding Garden Path & Scenery */}
      <GardenPath3D curve={curve} totalLengthZ={totalLengthZ} />

      {/* Romantic Story Chapters Waypoints & Recurring Hexagonal Domed Pavilions */}
      {!isLocked && (
        <Waypoints3D
          curve={curve}
          chapters={chapters}
          onOpenChapter={onOpenChapter}
          onOpenLetter={onOpenLetter}
        />
      )}

      {/* Bloom Post Processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.45}
          luminanceSmoothing={0.8}
          mipmapBlur
          intensity={1.1}
        />
      </EffectComposer>
    </>
  );
}
