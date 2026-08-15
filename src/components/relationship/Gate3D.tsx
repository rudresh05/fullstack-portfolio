"use client";

import { useState, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LockKeyhole, Loader2, ArrowRight, Heart } from "lucide-react";

interface Gate3DProps {
  isLocked: boolean;
  onUnlock: (token: string) => Promise<boolean>;
  position?: [number, number, number];
}

export function Gate3D({ isLocked, onUnlock, position = [0, 0, 0] }: Gate3DProps) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    const success = await onUnlock(token);
    if (!success) setError("Incorrect passcode.");
    setLoading(false);
  };

  useFrame((_, delta) => {
    if (leftDoorRef.current && rightDoorRef.current) {
      // Rotate doors open inward into the garden (-95 degrees left, 95 degrees right)
      const targetLeft = isLocked ? 0 : -Math.PI * 0.52;
      const targetRight = isLocked ? 0 : Math.PI * 0.52;

      leftDoorRef.current.rotation.y = THREE.MathUtils.damp(
        leftDoorRef.current.rotation.y,
        targetLeft,
        2.5,
        delta
      );
      rightDoorRef.current.rotation.y = THREE.MathUtils.damp(
        rightDoorRef.current.rotation.y,
        targetRight,
        2.5,
        delta
      );
    }
  });

  return (
    <group position={position}>
      {/* Stone Pillars */}
      <mesh position={[-3.2, 4, 0]}>
        <boxGeometry args={[1.1, 8.2, 1.1]} />
        <meshStandardMaterial color="#180b1b" roughness={0.8} />
      </mesh>
      <mesh position={[3.2, 4, 0]}>
        <boxGeometry args={[1.1, 8.2, 1.1]} />
        <meshStandardMaterial color="#180b1b" roughness={0.8} />
      </mesh>

      {/* Decorative Pillar Tops */}
      <mesh position={[-3.2, 8.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.8, 0.8, 4]} />
        <meshStandardMaterial color="#2a122e" roughness={0.7} />
      </mesh>
      <mesh position={[3.2, 8.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.8, 0.8, 4]} />
        <meshStandardMaterial color="#2a122e" roughness={0.7} />
      </mesh>

      {/* Archway with soft glowing rose crest */}
      <mesh position={[0, 8.4, 0]}>
        <boxGeometry args={[7.5, 0.9, 0.9]} />
        <meshStandardMaterial color="#180b1b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 9.1, 0]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} />
      </mesh>

      {/* Left Gate Door */}
      <group position={[-2.65, 4, 0]} ref={leftDoorRef}>
        <mesh position={[1.3, 0, 0]}>
          <boxGeometry args={[2.6, 7.8, 0.18]} />
          <meshStandardMaterial
            color="#28112d"
            roughness={0.5}
            metalness={0.3}
            emissive="#350f3b"
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[1.3, 0, 0.1]}>
          <ringGeometry args={[0.6, 0.7, 16]} />
          <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Right Gate Door */}
      <group position={[2.65, 4, 0]} ref={rightDoorRef}>
        <mesh position={[-1.3, 0, 0]}>
          <boxGeometry args={[2.6, 7.8, 0.18]} />
          <meshStandardMaterial
            color="#28112d"
            roughness={0.5}
            metalness={0.3}
            emissive="#350f3b"
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[-1.3, 0, 0.1]}>
          <ringGeometry args={[0.6, 0.7, 16]} />
          <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Magical Rose Lanterns on Pillars */}
      <pointLight position={[-3.2, 4.5, 0.8]} intensity={1.2} color="#fda4af" distance={8} />
      <pointLight position={[3.2, 4.5, 0.8]} intensity={1.2} color="#fda4af" distance={8} />

      {/* Warm magical glow behind the gate */}
      {!isLocked && (
        <pointLight position={[0, 3.5, -3]} intensity={2} color="#fda4af" distance={15} />
      )}

      {/* HTML Passcode Overlay (Only shown when locked) */}
      {isLocked && (
        <Html position={[0, 3.4, 2.5]} center zIndexRange={[100, 0]} distanceFactor={14}>
          <div className="w-[320px] sm:w-[350px] rounded-3xl bg-[#0b0510]/95 p-6 backdrop-blur-2xl border border-rose-500/30 shadow-[0_0_60px_rgba(244,63,94,0.3)] text-center select-none">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shadow-inner">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500 animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl font-serif-display text-white mb-1">Our Secret Garden</h2>
            <p className="text-xs font-serif-display italic text-rose-200/70 mb-5">
              Enter your key to unlock the gates
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Passcode..."
                className="flex-1 rounded-2xl bg-white/5 border border-rose-500/20 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-rose-400 focus:bg-white/10 outline-none font-sans-display transition-all"
              />
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
            {error && <p className="mt-3 text-xs text-rose-400 font-sans-display">{error}</p>}
          </div>
        </Html>
      )}
    </group>
  );
}
