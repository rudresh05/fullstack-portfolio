"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { JourneyChapter } from "./journey-path";
import { useRelationship } from "./relationship-provider";
import { saveChaptersToIDB } from "@/lib/relationship-db";
import { fetchSetting, subscribeSetting, type ForHerContent } from "@/lib/content-store";

interface Waypoints3DProps {
  curve: THREE.CatmullRomCurve3;
  chapters: JourneyChapter[];
  onOpenChapter: (c: JourneyChapter) => void;
  onOpenLetter?: () => void;
}

// Helper: Generates a high-DPI 2D canvas texture with romantic typography for each chapter
function createChapterCanvasTexture(chapter: JourneyChapter): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const pad = 24;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const r = 40;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Soft Ambient Glow
  ctx.shadowColor = "rgba(244, 63, 94, 0.4)";
  ctx.shadowBlur = 30;

  // Background Fill
  ctx.fillStyle = "rgba(10, 4, 16, 0.95)";
  ctx.beginPath();
  ctx.roundRect(pad, pad, w, h, r);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Rose-Gold Border
  const borderGrad = ctx.createLinearGradient(pad, pad, pad + w, pad + h);
  borderGrad.addColorStop(0, "rgba(251, 113, 133, 0.85)");
  borderGrad.addColorStop(0.5, "rgba(244, 63, 94, 0.5)");
  borderGrad.addColorStop(1, "rgba(251, 113, 133, 0.85)");

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Top accent line
  const lineGrad = ctx.createLinearGradient(pad + 40, pad + 120, pad + w - 40, pad + 120);
  lineGrad.addColorStop(0, "rgba(244, 63, 94, 0.0)");
  lineGrad.addColorStop(0.5, "rgba(244, 63, 94, 0.4)");
  lineGrad.addColorStop(1, "rgba(244, 63, 94, 0.0)");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad + 40, pad + 120);
  ctx.lineTo(pad + w - 40, pad + 120);
  ctx.stroke();

  // 2. Chapter Badge
  const badgeX = pad + 40;
  const badgeY = pad + 42;
  ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 210, 48, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#fda4af";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`✨ CHAPTER ${String(chapter.chapterNumber).padStart(2, "0")}`, badgeX + 22, badgeY + 24);

  // Date
  if (chapter.date) {
    ctx.fillStyle = "rgba(254, 205, 211, 0.75)";
    ctx.font = "19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`📅 ${chapter.date}`, pad + w - 45, badgeY + 24);
    ctx.textAlign = "left";
  }

  // 3. Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px 'Playfair Display', Georgia, serif";
  ctx.fillText(chapter.title, pad + 42, pad + 185);

  // Subtitle
  if (chapter.subtitle) {
    ctx.fillStyle = "rgba(253, 164, 175, 0.9)";
    ctx.font = "italic 24px 'Playfair Display', Georgia, serif";
    ctx.fillText(`"${chapter.subtitle}"`, pad + 42, pad + 230);
  }

  // 4. Multi-line Story Narrative
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.font = "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const maxWidth = w - 85;
  const words = chapter.body.split(" ");
  let line = "";
  let currY = pad + (chapter.subtitle ? 285 : 255);
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, pad + 42, currY);
      line = words[n] + " ";
      currY += 36;
      lineCount++;
      if (lineCount >= 4) {
        line = line.trim() + "…";
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (lineCount < 4) {
    ctx.fillText(line, pad + 42, currY);
  }

  // 5. Quote Callout Pill
  if (chapter.quote) {
    const quoteY = pad + h - 195;
    ctx.fillStyle = "rgba(76, 5, 25, 0.6)";
    ctx.beginPath();
    ctx.roundRect(pad + 40, quoteY, w - 80, 68, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#fecdd3";
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText(`♥ "${chapter.quote}"`, pad + 60, quoteY + 40);
  }

  // 6. Footer: Location & Interactive Read Button
  const footerY = pad + h - 68;
  if (chapter.location) {
    ctx.fillStyle = "rgba(254, 205, 211, 0.7)";
    ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`📍 ${chapter.location}`, pad + 45, footerY);
  } else {
    ctx.fillStyle = "rgba(254, 205, 211, 0.7)";
    ctx.font = "19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("#Love #Memory", pad + 45, footerY);
  }

  // Button
  const btnW = 220;
  const btnH = 50;
  const btnX = pad + w - btnW - 40;
  const btnY = footerY - 34;

  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
  btnGrad.addColorStop(0, "#e11d48");
  btnGrad.addColorStop(1, "#f43f5e");

  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 25);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Read Story ➜", btnX + btnW / 2, btnY + 31);
  ctx.textAlign = "left";

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

// 100% Pure 3D Physical Milestone Signpost
function PhysicalStorySignpost({
  chapter,
  position,
  rotationY,
  side,
  onOpenModal,
}: {
  chapter: JourneyChapter;
  position: [number, number, number];
  rotationY: number;
  side: number;
  onOpenModal: (c: JourneyChapter) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => createChapterCanvasTexture(chapter), [chapter]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const signOffsetX = side > 0 ? -1.6 : 1.6;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 1. Stone Base Pedestal */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.28, 0.42, 0.4, 8]} />
        <meshStandardMaterial color="#1e1022" roughness={0.7} />
      </mesh>
      {/* Glowing Rose Collar */}
      <mesh position={[0, 0.42, 0]}>
        <torusGeometry args={[0.25, 0.04, 8, 16]} />
        <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} />
      </mesh>

      {/* 2. Main Wrought-Iron Lamp Post */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.08, 0.11, 3.4, 8]} />
        <meshStandardMaterial color="#1a0e1c" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 3. Top Glowing Lantern Housing */}
      <mesh position={[0, 3.8, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#1a0e1c" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 3.8, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#fed7aa" emissive="#fda4af" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, 3.8, 0.3]} intensity={1.8} color="#fda4af" distance={12} />

      {/* 4. Horizontal Wrought-Iron Arm Holding the Sign Board */}
      <mesh position={[signOffsetX / 2, 2.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, Math.abs(signOffsetX) + 0.3, 6]} />
        <meshStandardMaterial color="#1a0e1c" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 5. Hanging Chains connecting arm to sign board */}
      <mesh position={[signOffsetX - 0.7, 2.45, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
        <meshStandardMaterial color="#fda4af" metalness={0.9} />
      </mesh>
      <mesh position={[signOffsetX + 0.7, 2.45, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
        <meshStandardMaterial color="#fda4af" metalness={0.9} />
      </mesh>

      {/* 6. Solid Wooden Backing Panel */}
      <mesh position={[signOffsetX, 1.6, -0.02]}>
        <boxGeometry args={[2.7, 2.05, 0.06]} />
        <meshStandardMaterial color="#100516" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* 7. High-DPI 3D Storyboard Plane Texture */}
      <mesh
        position={[signOffsetX, 1.6, 0.02]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenModal(chapter);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <planeGeometry args={[2.65, 2.0]} />
        <meshBasicMaterial
          map={texture}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hover Halo Glow */}
      {hovered && (
        <pointLight position={[signOffsetX, 1.6, 0.6]} intensity={2.0} color="#f43f5e" distance={5} />
      )}
    </group>
  );
}

// Single Clean Photo Panel for the Hexagonal Carousel (Centered Cover, No Wireframes)
function HexagonalPanel({
  imageUrl,
  position,
  rotationY,
}: {
  imageUrl: string;
  position: [number, number, number];
  rotationY: number;
}) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, 800, 1000);

      const pad = 12;
      const w = 800 - pad * 2;
      const h = 1000 - pad * 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pad, pad, w, h, 28);
      ctx.clip();

      // Exact Centered Cover Algorithm
      const imgAspect = img.width / img.height;
      const canvasAspect = w / h;
      let drawW: number;
      let drawH: number;
      let drawX: number;
      let drawY: number;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas: fit height, crop width equally from center
        drawH = h;
        drawW = h * imgAspect;
        drawX = pad + (w - drawW) / 2;
        drawY = pad;
      } else {
        // Image is taller than canvas: fit width, crop height equally from center
        drawW = w;
        drawH = w / imgAspect;
        drawX = pad;
        drawY = pad + (h - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Subtle bottom shadow vignette
      const grad = ctx.createLinearGradient(0, 720, 0, 1000);
      grad.addColorStop(0, "rgba(10, 4, 16, 0.0)");
      grad.addColorStop(1, "rgba(10, 4, 16, 0.7)");
      ctx.fillStyle = grad;
      ctx.fillRect(pad, 720, w, 280);

      ctx.restore();

      // Radiant Rose-Gold Frame Border
      ctx.beginPath();
      ctx.roundRect(pad, pad, w, h, 28);
      ctx.strokeStyle = "rgba(251, 113, 133, 0.95)";
      ctx.lineWidth = 10;
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
    };
  }, [imageUrl]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Dark Backing Board */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[2.0, 2.52, 0.04]} />
        <meshStandardMaterial color="#0e0414" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Main High-DPI Photo Plane (Centered Cover) */}
      {texture && (
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[1.98, 2.5]} />
          <meshBasicMaterial map={texture} toneMapped={false} side={THREE.FrontSide} />
        </mesh>
      )}
    </group>
  );
}

// 🌸 3D REVOLVING HEXAGONAL PHOTO PRISM CAROUSEL
function HexagonalPhotoPrism({ photos }: { photos: Array<{ url: string }> }) {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth romantic rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  const count = 6;
  const radius = 1.95;

  const panels = useMemo(() => {
    return Array.from({ length: count }).map((_, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const photoItem = photos[idx % photos.length] || {
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop",
      };

      return {
        id: idx,
        url: photoItem.url,
        position: [x, 0, z] as [number, number, number],
        rotationY: angle,
      };
    });
  }, [photos, radius, count]);

  return (
    <group position={[0, 3.6, 0]}>
      {/* Revolving Hexagonal Core */}
      <group ref={groupRef}>
        {/* Top & Bottom Glowing Hexagonal Plates */}
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.05, 6]} />
          <meshStandardMaterial color="#1a0a22" emissive="#f43f5e" emissiveIntensity={0.6} metalness={0.8} />
        </mesh>
        <mesh position={[0, -1.3, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.05, 6]} />
          <meshStandardMaterial color="#1a0a22" emissive="#f43f5e" emissiveIntensity={0.6} metalness={0.8} />
        </mesh>

        {/* 6 Clean High-DPI Hexagonal Photo Faces */}
        {panels.map((p) => (
          <HexagonalPanel
            key={p.id}
            imageUrl={p.url}
            position={p.position}
            rotationY={p.rotationY}
          />
        ))}

        {/* Glowing Central Fairy Core */}
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial color="#fda4af" emissive="#f43f5e" emissiveIntensity={1.8} />
        </mesh>
        <pointLight position={[0, 0, 0]} intensity={3.5} color="#fda4af" distance={10} />
      </group>

      {/* Exterior Warm Illuminators */}
      <pointLight position={[0, 0, 3.2]} intensity={2.2} color="#fed7aa" distance={10} />
      <pointLight position={[0, 0, -3.2]} intensity={2.2} color="#fed7aa" distance={10} />
    </group>
  );
}

// 🏛️ HEXAGONAL HOME WITH ROUND ("GOL") DOME ROOF
function HexagonalGazeboHouse() {
  const pillarRadius = 3.6;
  const pillarCount = 6;

  // 6 Pillars placed in a regular hexagon
  const pillars = useMemo(() => {
    return Array.from({ length: pillarCount }).map((_, idx) => {
      const angle = (idx / pillarCount) * Math.PI * 2;
      const x = Math.sin(angle) * pillarRadius;
      const z = Math.cos(angle) * pillarRadius;
      return { id: idx, pos: [x, 2.6, z] as [number, number, number] };
    });
  }, [pillarRadius, pillarCount]);

  return (
    <group>
      {/* 1. Grand Hexagonal Stepped Terrace Base */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[6.4, 7.0, 0.4, 6]} />
        <meshStandardMaterial color="#1a0c1e" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.1, 6.35, 6]} />
        <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} />
      </mesh>

      {/* 2. 6 Elegant Gazebo House Pillars arranged in a Hexagon */}
      {pillars.map((p) => (
        <group key={p.id} position={p.pos}>
          {/* Main Pillar Column */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.18, 5.2, 12]} />
            <meshStandardMaterial color="#25102b" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Glowing Rose Collar on base & top */}
          <mesh position={[0, -2.4, 0]}>
            <torusGeometry args={[0.22, 0.04, 8, 16]} />
            <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 2.6, 0]}>
            <octahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[0, 2.4, 0]} intensity={1.4} color="#fda4af" distance={8} />
        </group>
      ))}

      {/* 3. 🌐 ROUND ("GOL") DOME ROOF ON TOP OF THE HEXAGONAL HOUSE */}
      <group position={[0, 5.2, 0]}>
        {/* Glowing Rose-Gold Circular Arch Ring Supporting the Dome */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.62, 0.08, 12, 48]} />
          <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.9} metalness={0.8} />
        </mesh>

        {/* Outer Round Domed Shell ("Gol Roof") */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[3.65, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <meshStandardMaterial color="#190820" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>

        {/* Inner Warm Canopy Glow Under the Dome */}
        <pointLight position={[0, 0.5, 0]} intensity={2.8} color="#fda4af" distance={10} />

        {/* Tiered Crown Spire atop the Round Roof */}
        <mesh position={[0, 1.85, 0]}>
          <cylinderGeometry args={[0.06, 0.28, 0.8, 8]} />
          <meshStandardMaterial color="#25102b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color="#fda4af" emissive="#f43f5e" emissiveIntensity={2.0} />
        </mesh>
      </group>
    </group>
  );
}

// Grand Finale Romantic Portrait Pavilion
function FinalePavilion({
  position,
  onOpenLetter,
}: {
  position: [number, number, number];
  onOpenLetter?: () => void;
}) {
  const { data } = useRelationship();
  const [forHer, setForHer] = useState<ForHerContent | null>(null);

  // 1. Fetch & Subscribe to Ghost Background Portrait and Visual Gallery from Studio
  useEffect(() => {
    fetchSetting<ForHerContent>("for_her_content", undefined as any).then((val) => {
      if (val) setForHer(val);
    });
    return subscribeSetting<ForHerContent>("for_her_content", (val) => {
      if (val) setForHer(val);
    });
  }, []);

  const recipientName = forHer?.herName || data?.relationship?.recipientName || "My Forever Love";
  const heroSubtitle = forHer?.tagline || data?.settings?.heroSubtitle || "Every second with you is a blessing I cherish forever.";

  // Build the 6 Photos for the Hexagonal Carousel:
  // Face 1: Ghost Background Portrait (Atmosphere)
  // Faces 2-6: Moments from Visual Gallery
  const carouselPhotos = useMemo(() => {
    const list: Array<{ url: string }> = [];

    // 1. Primary Ghost Background Portrait
    const mainPortrait = forHer?.portraitUrl || data?.settings?.portraitUrl;
    if (mainPortrait) {
      list.push({ url: mainPortrait });
    }

    // 2. Moments from Visual Gallery
    if (forHer?.moments && forHer.moments.length > 0) {
      forHer.moments.forEach((m) => {
        if (m.img) {
          list.push({ url: m.img });
        }
      });
    }

    // Fallbacks if fewer than 6 photos
    const fallbackUrls = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    ];

    while (list.length < 6) {
      const idx = list.length;
      list.push({ url: fallbackUrls[idx % fallbackUrls.length] });
    }

    return list.slice(0, 6);
  }, [forHer, data]);

  // Generate 3D Dedicated Podium Plaque Texture
  const finaleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const pad = 24;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;

    // Card Fill with glassmorphic depth
    ctx.fillStyle = "rgba(10, 4, 16, 0.96)";
    ctx.beginPath();
    ctx.roundRect(pad, pad, w, h, 40);
    ctx.fill();

    // Rose-Gold Border
    ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Header Sparkle
    ctx.fillStyle = "#fda4af";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ FOREVER & ALWAYS ✨", canvas.width / 2, pad + 65);

    // Partner Name in Big Gorgeous Serif
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 58px 'Playfair Display', Georgia, serif";
    ctx.fillText(recipientName, canvas.width / 2, pad + 140);

    // Love Tagline / Subtitle
    ctx.fillStyle = "rgba(254, 205, 211, 0.9)";
    ctx.font = "italic 26px 'Playfair Display', Georgia, serif";
    ctx.fillText(`"${heroSubtitle}"`, canvas.width / 2, pad + 205);

    // Interactive Button
    const btnW = 380;
    const btnH = 68;
    const btnX = (canvas.width - btnW) / 2;
    const btnY = pad + h - 105;

    const grad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    grad.addColorStop(0, "#e11d48");
    grad.addColorStop(1, "#f43f5e");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 34);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Open Love Letter 💌", canvas.width / 2, btnY + 44);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [recipientName, heroSubtitle]);

  return (
    <group position={position}>
      {/* 1. Hexagonal Gazebo House with Round ("Gol") Dome Roof */}
      <HexagonalGazeboHouse />

      {/* 2. 🌸 3D Revolving Hexagonal Photo Prism (Centered Cover, 6 Photos) */}
      <HexagonalPhotoPrism photos={carouselPhotos} />

      {/* 3. Left & Right Flanking Lantern Pillars on the Stage */}
      {[-2.7, 2.7].map((x, idx) => (
        <group key={idx} position={[x, 0, 1.4]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 1.2, 8]} />
            <meshStandardMaterial color="#1a0e1c" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.9} />
          </mesh>
          <pointLight position={[0, 1.3, 0]} intensity={1.5} color="#fda4af" distance={6} />
        </group>
      ))}

      {/* 4. Dedicated Foreground Guestbook Podium in Front of the Gazebo */}
      <group position={[0, 1.15, 2.0]} rotation={[-0.12, 0, 0]}>
        {/* Ornate Pedestal Pillar */}
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.12, 0.18, 1.1, 8]} />
          <meshStandardMaterial color="#1a0e1c" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.15, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.15, 8]} />
          <meshStandardMaterial color="#1e1022" roughness={0.7} />
        </mesh>

        {/* Backing Board */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[4.1, 1.66, 0.05]} />
          <meshStandardMaterial color="#100516" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Dedicated 3D Love Plaque Placed Forward in Foreground */}
        <mesh
          position={[0, 0, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            onOpenLetter?.();
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <planeGeometry args={[4.05, 1.62]} />
          <meshBasicMaterial map={finaleTexture} transparent toneMapped={false} side={THREE.DoubleSide} />
        </mesh>

        {/* Podium Highlight Light */}
        <pointLight position={[0, 0, 0.6]} intensity={1.8} color="#fda4af" distance={6} />
      </group>
    </group>
  );
}

export function Waypoints3D({ curve, chapters, onOpenChapter, onOpenLetter }: Waypoints3DProps) {
  // Persist chapters to IndexedDB
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      saveChaptersToIDB(chapters);
    }
  }, [chapters]);

  // Position each 3D story signpost beside the road along the spline
  const positionedChapters = useMemo(() => {
    const total = chapters.length;
    const up = new THREE.Vector3(0, 1, 0);

    return chapters.map((chap, idx) => {
      // Curve parameter t for this chapter (spaced past the entrance gate)
      const t = 0.20 + (idx / (total + 0.5)) * 0.68;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Alternate left and right side of the road
      const side = idx % 2 === 0 ? -1 : 1;
      const offset = normal.clone().multiplyScalar(side * 4.2);
      const finalPos = point.clone().add(offset);
      finalPos.y = point.y; // anchored to ground

      // Calculate orientation angle to face oncoming traveler
      const tangentAngle = Math.atan2(tangent.x, tangent.z);
      const rotationY = tangentAngle + Math.PI + (side * 0.15);

      return {
        chapter: chap,
        position: [finalPos.x, finalPos.y, finalPos.z] as [number, number, number],
        rotationY,
        side,
      };
    });
  }, [curve, chapters]);

  // Grand Finale position at the end of the path
  const finalePoint = useMemo(() => {
    const pt = curve.getPointAt(0.96);
    return [pt.x, pt.y, pt.z] as [number, number, number];
  }, [curve]);

  return (
    <group>
      {/* 1. Pure 3D Physical Story Signposts */}
      {positionedChapters.map((item) => (
        <PhysicalStorySignpost
          key={item.chapter.id}
          chapter={item.chapter}
          position={item.position}
          rotationY={item.rotationY}
          side={item.side}
          onOpenModal={onOpenChapter}
        />
      ))}

      {/* 2. Grand Finale Romantic Pavilion with Hexagonal House and Round Dome Roof */}
      <FinalePavilion position={finalePoint} onOpenLetter={onOpenLetter} />
    </group>
  );
}
