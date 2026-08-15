"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Gate3D } from "./Gate3D";
import { GardenPath3D } from "./GardenPath3D";
import { Waypoints3D } from "./Waypoints3D";
import { useRelationship } from "./relationship-provider";
import { buildJourneySpline, getEnrichedChapters, GATE_POSITION, JourneyChapter } from "./journey-path";

interface Experience3DProps {
  isLocked: boolean;
  isDroneMode?: boolean;
  onUnlock: (token: string) => Promise<boolean>;
  onOpenChapter: (c: JourneyChapter) => void;
  onOpenLetter?: () => void;
}

export function Experience3D({
  isLocked,
  isDroneMode = false,
  onUnlock,
  onOpenChapter,
  onOpenLetter,
}: Experience3DProps) {
  const scroll = useScroll();
  const { data } = useRelationship();

  // 1. Enriched chapters
  const chapters = useMemo(() => getEnrichedChapters(data), [data]);

  // 2. Build the smooth 3D CatmullRom spline curve
  const { curve, totalLengthZ } = useMemo(() => {
    return buildJourneySpline(chapters.length);
  }, [chapters.length]);

  // Finale center point
  const finalePoint = useMemo(() => {
    const pt = curve.getPointAt(0.96);
    return new THREE.Vector3(pt.x, pt.y, pt.z);
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

    // Determine if we should be in Drone Mode:
    // Either manually toggled OR automatically when scrolled to the Grand Finale (offset > 0.94)
    const isAtFinale = scroll.offset > 0.94;
    const activeDrone = isDroneMode || isAtFinale;

    if (activeDrone) {
      // 🚁 CINEMATIC 3D ORBITAL DRONE CAMERA SHOT
      droneAngle.current += delta * 0.28; // Smooth orbit speed
      const radius = 11.2;
      const angle = droneAngle.current;

      const droneX = finalePoint.x + Math.sin(angle) * radius;
      const droneZ = finalePoint.z + Math.cos(angle) * radius;
      const droneY = 4.4 + Math.sin(elapsed * 0.4) * 1.3; // Gentle altitude wave

      const targetCameraPos = new THREE.Vector3(droneX, droneY, droneZ);
      // Focus directly on the center of her illuminated portrait in the gazebo
      const targetCameraLook = new THREE.Vector3(finalePoint.x, 3.8, finalePoint.z);

      currentPos.current.lerp(targetCameraPos, Math.min(1, delta * 3.0));
      currentLookAt.current.lerp(targetCameraLook, Math.min(1, delta * 3.5));

      camera.position.copy(currentPos.current);
      camera.lookAt(currentLookAt.current);
      return;
    }

    // Standard Walking Mode: Map scroll offset (0 -> 1) to curve parameter t (0.02 -> 0.96)
    const rawT = THREE.MathUtils.lerp(0.02, 0.95, scroll.offset);
    const clampedT = Math.max(0.005, Math.min(0.98, rawT));

    // Get position along curve
    const pathPoint = curve.getPointAt(clampedT);
    
    // Look ahead 18 meters down the spline
    const lookAheadT = Math.min(0.999, clampedT + 0.065);
    const lookPoint = curve.getPointAt(lookAheadT);

    // Walking bobbing
    const bob = Math.sin(scroll.offset * Math.PI * 22) * 0.08;
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

      {/* Entrance Gate at z = 0 (right in front of the camera!) */}
      <Gate3D isLocked={isLocked} onUnlock={onUnlock} position={[GATE_POSITION.x, GATE_POSITION.y, GATE_POSITION.z]} />

      {/* Winding Garden Path & Scenery */}
      <GardenPath3D curve={curve} totalLengthZ={totalLengthZ} />

      {/* Romantic Story Chapters Waypoints & Finale Pavilion */}
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
