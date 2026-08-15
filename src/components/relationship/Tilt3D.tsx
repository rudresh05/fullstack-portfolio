"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function Tilt3D({ 
  children, 
  className = "", 
  maxRotation = 12 
}: { 
  children: React.ReactNode; 
  className?: string; 
  maxRotation?: number; 
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Springs for smooth movement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(x, { damping: 25, stiffness: 180 });
  const rotateY = useSpring(y, { damping: 25, stiffness: 180 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Normalize coordinates (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Set rotation values
    x.set(mouseY * -maxRotation); // Rotates around X-axis (tilt up/down)
    y.set(mouseX * maxRotation);  // Rotates around Y-axis (tilt left/right)
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none ${className}`}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d"
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        className="w-full h-full transition-all duration-300 ease-out"
        animate={{
          scale: isHovered ? 1.018 : 1.0,
          boxShadow: isHovered 
            ? "0 35px 80px rgba(244, 63, 94, 0.15), 0 0 30px rgba(244, 63, 94, 0.08)" 
            : "0 10px 30px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div 
          style={{
            transform: isHovered ? "translateZ(20px)" : "translateZ(0px)",
            transformStyle: "preserve-3d",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          className="w-full h-full"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
