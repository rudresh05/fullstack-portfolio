"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
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

// Checkpoint locations where Hexagonal Domed Pavilions stand
const PAVILION_CHECKPOINTS = [0.35, 0.70, 0.96];

// Global Memory-Efficient Texture Cache (Prevents recreating canvases & leaks)
const globalTextureCache = new Map<string, THREE.CanvasTexture>();

function getChapterTexture(chapter: JourneyChapter): THREE.CanvasTexture {
  const cacheKey = `chapter-${chapter.id}-${chapter.title}`;
  if (globalTextureCache.has(cacheKey)) {
    return globalTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const pad = 12;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const r = 20;

  // Background Fill
  ctx.fillStyle = "rgba(10, 4, 16, 0.96)";
  ctx.beginPath();
  ctx.roundRect(pad, pad, w, h, r);
  ctx.fill();

  // Rose-Gold Border
  ctx.strokeStyle = "rgba(251, 113, 133, 0.85)";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Chapter Badge
  const badgeX = pad + 20;
  const badgeY = pad + 20;
  ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, 120, 26, 13);
  ctx.fill();
  ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#fda4af";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`✨ CH ${String(chapter.chapterNumber).padStart(2, "0")}`, badgeX + 12, badgeY + 13);

  // Date
  if (chapter.date) {
    ctx.fillStyle = "rgba(254, 205, 211, 0.75)";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`📅 ${chapter.date}`, pad + w - 20, badgeY + 13);
    ctx.textAlign = "left";
  }

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Playfair Display', Georgia, serif";
  ctx.fillText(chapter.title, pad + 22, pad + 85);

  // Subtitle
  if (chapter.subtitle) {
    ctx.fillStyle = "rgba(253, 164, 175, 0.9)";
    ctx.font = "italic 13px 'Playfair Display', Georgia, serif";
    ctx.fillText(`"${chapter.subtitle}"`, pad + 22, pad + 110);
  }

  // Body preview
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
  const maxWidth = w - 44;
  const words = chapter.body.split(" ");
  let line = "";
  let currY = pad + (chapter.subtitle ? 140 : 125);
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, pad + 22, currY);
      line = words[n] + " ";
      currY += 19;
      linesDrawn++;
      if (linesDrawn >= 3) {
        line = line.trim() + "…";
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (linesDrawn < 3) {
    ctx.fillText(line, pad + 22, currY);
  }

  // Read Button
  const btnW = 120;
  const btnH = 28;
  const btnX = pad + w - btnW - 20;
  const btnY = pad + h - btnH - 16;

  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
  btnGrad.addColorStop(0, "#e11d48");
  btnGrad.addColorStop(1, "#f43f5e");
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 14);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Read Story ➜", btnX + btnW / 2, btnY + 17);
  ctx.textAlign = "left";

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  globalTextureCache.set(cacheKey, texture);
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
  const texture = useMemo(() => getChapterTexture(chapter), [chapter]);
  const signOffsetX = side > 0 ? -1.6 : 1.6;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Stone Base */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.24, 0.36, 0.4, 6]} />
        <meshStandardMaterial color="#1e1022" roughness={0.7} />
      </mesh>

      {/* Main Lamp Post */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 3.4, 6]} />
        <meshStandardMaterial color="#1a0e1c" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Lantern Housing */}
      <mesh position={[0, 3.8, 0]}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color="#fed7aa" emissive="#fda4af" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, 3.8, 0.3]} intensity={1.5} color="#fda4af" distance={8} />

      {/* Horizontal Arm */}
      <mesh position={[signOffsetX / 2, 2.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, Math.abs(signOffsetX) + 0.3, 4]} />
        <meshStandardMaterial color="#1a0e1c" metalness={0.7} />
      </mesh>

      {/* Solid Backing Panel */}
      <mesh position={[signOffsetX, 1.6, -0.02]}>
        <boxGeometry args={[2.7, 2.05, 0.04]} />
        <meshStandardMaterial color="#100516" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* High-DPI 3D Storyboard Plane */}
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
        <meshBasicMaterial map={texture} transparent toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {hovered && (
        <pointLight position={[signOffsetX, 1.6, 0.6]} intensity={1.8} color="#f43f5e" distance={4} />
      )}
    </group>
  );
}

// Single Photo Panel for Hexagonal Carousel
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

    if (globalTextureCache.has(imageUrl)) {
      setTexture(globalTextureCache.get(imageUrl)!);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, 512, 640);
      const pad = 8;
      const w = 512 - pad * 2;
      const h = 640 - pad * 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pad, pad, w, h, 20);
      ctx.clip();

      const imgAspect = img.width / img.height;
      const canvasAspect = w / h;
      let drawW = w;
      let drawH = h;
      let drawX = pad;
      let drawY = pad;

      if (imgAspect > canvasAspect) {
        drawH = h;
        drawW = h * imgAspect;
        drawX = pad + (w - drawW) / 2;
      } else {
        drawW = w;
        drawH = w / imgAspect;
        drawY = pad + (h - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Shadow gradient
      const grad = ctx.createLinearGradient(0, 460, 0, 640);
      grad.addColorStop(0, "rgba(10, 4, 16, 0.0)");
      grad.addColorStop(1, "rgba(10, 4, 16, 0.7)");
      ctx.fillStyle = grad;
      ctx.fillRect(pad, 460, w, 180);
      ctx.restore();

      // Border
      ctx.beginPath();
      ctx.roundRect(pad, pad, w, h, 20);
      ctx.strokeStyle = "rgba(251, 113, 133, 0.95)";
      ctx.lineWidth = 6;
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;

      globalTextureCache.set(imageUrl, tex);
      setTexture(tex);
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
    };
  }, [imageUrl]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[2.0, 2.52, 0.03]} />
        <meshStandardMaterial color="#0e0414" roughness={0.7} metalness={0.3} />
      </mesh>
      {texture && (
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[1.98, 2.5]} />
          <meshBasicMaterial map={texture} toneMapped={false} side={THREE.FrontSide} />
        </mesh>
      )}
    </group>
  );
}

// 🌸 3D REVOLVING HEXAGONAL PHOTO PRISM
function HexagonalPhotoPrism({ photos }: { photos: Array<{ url: string }> }) {
  const groupRef = useRef<THREE.Group>(null);

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
      <group ref={groupRef}>
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.04, 6]} />
          <meshStandardMaterial color="#1a0a22" emissive="#f43f5e" emissiveIntensity={0.6} metalness={0.8} />
        </mesh>
        <mesh position={[0, -1.3, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.04, 6]} />
          <meshStandardMaterial color="#1a0a22" emissive="#f43f5e" emissiveIntensity={0.6} metalness={0.8} />
        </mesh>

        {panels.map((p) => (
          <HexagonalPanel
            key={p.id}
            imageUrl={p.url}
            position={p.position}
            rotationY={p.rotationY}
          />
        ))}

        <pointLight position={[0, 0, 0]} intensity={2.5} color="#fda4af" distance={8} />
      </group>
    </group>
  );
}

// 🏛️ HEXAGONAL HOME WITH ROUND ("GOL") DOME ROOF
function HexagonalGazeboHouse() {
  const pillarRadius = 3.6;
  const pillarCount = 6;

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
      {/* Base */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[6.2, 6.8, 0.35, 6]} />
        <meshStandardMaterial color="#1a0c1e" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* 6 Pillars */}
      {pillars.map((p) => (
        <group key={p.id} position={p.pos}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 5.2, 6]} />
            <meshStandardMaterial color="#25102b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.6, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Round ("Gol") Dome Roof */}
      <group position={[0, 5.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[3.65, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <meshStandardMaterial color="#190820" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} intensity={2.0} color="#fda4af" distance={8} />

        <mesh position={[0, 2.2, 0]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#fda4af" emissive="#f43f5e" emissiveIntensity={1.8} />
        </mesh>
      </group>
    </group>
  );
}

// Checkpoint Hexagonal Domed Pavilion
function CheckpointPavilion({
  position,
  onOpenLetter,
}: {
  position: [number, number, number];
  onOpenLetter?: () => void;
}) {
  const { data } = useRelationship();
  const [forHer, setForHer] = useState<ForHerContent | null>(null);

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

  const carouselPhotos = useMemo(() => {
    const list: Array<{ url: string }> = [];

    const mainPortrait = forHer?.portraitUrl || data?.settings?.portraitUrl;
    if (mainPortrait) list.push({ url: mainPortrait });

    if (forHer?.moments && forHer.moments.length > 0) {
      forHer.moments.forEach((m) => {
        if (m.img) list.push({ url: m.img });
      });
    }

    const fallbackUrls = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    ];

    while (list.length < 6) {
      list.push({ url: fallbackUrls[list.length % fallbackUrls.length] });
    }

    return list.slice(0, 6);
  }, [forHer, data]);

  const finaleTexture = useMemo(() => {
    const cacheKey = `plaque-${recipientName}-${heroSubtitle}`;
    if (globalTextureCache.has(cacheKey)) {
      return globalTextureCache.get(cacheKey)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const pad = 12;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;

    ctx.fillStyle = "rgba(10, 4, 16, 0.96)";
    ctx.beginPath();
    ctx.roundRect(pad, pad, w, h, 20);
    ctx.fill();

    ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#fda4af";
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ FOREVER & ALWAYS ✨", canvas.width / 2, pad + 32);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'Playfair Display', Georgia, serif";
    ctx.fillText(recipientName, canvas.width / 2, pad + 70);

    ctx.fillStyle = "rgba(254, 205, 211, 0.9)";
    ctx.font = "italic 13px 'Playfair Display', Georgia, serif";
    ctx.fillText(`"${heroSubtitle}"`, canvas.width / 2, pad + 102);

    const btnW = 190;
    const btnH = 34;
    const btnX = (canvas.width - btnW) / 2;
    const btnY = pad + h - 52;

    const grad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    grad.addColorStop(0, "#e11d48");
    grad.addColorStop(1, "#f43f5e");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 17);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Open Love Letter 💌", canvas.width / 2, btnY + 22);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    globalTextureCache.set(cacheKey, tex);
    return tex;
  }, [recipientName, heroSubtitle]);

  return (
    <group position={position}>
      <HexagonalGazeboHouse />
      <HexagonalPhotoPrism photos={carouselPhotos} />

      <group position={[0, 1.15, 2.0]} rotation={[-0.12, 0, 0]}>
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.1, 0.14, 1.1, 6]} />
          <meshStandardMaterial color="#1a0e1c" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[4.1, 1.66, 0.04]} />
          <meshStandardMaterial color="#100516" roughness={0.6} metalness={0.2} />
        </mesh>
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
      </group>
    </group>
  );
}

// 🚀 SLIDING WINDOW WAYPOINTS CONTROLLER (Only renders elements currently visible near camera)
export function Waypoints3D({ curve, chapters, onOpenChapter, onOpenLetter }: Waypoints3DProps) {
  const scroll = useScroll();
  const [cameraT, setCameraT] = useState(0.02);

  // Persist chapters to IndexedDB
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      saveChaptersToIDB(chapters);
    }
  }, [chapters]);

  // Update current camera normalized T position
  useFrame(() => {
    const normalized = (scroll.offset % 1.0 + 1.0) % 1.0;
    setCameraT(normalized);
  });

  // Calculate all chapter signpost coordinates along spline
  const allChapters = useMemo(() => {
    const total = Math.max(chapters.length * 2, 12);
    const up = new THREE.Vector3(0, 1, 0);

    return Array.from({ length: total }).map((_, idx) => {
      const chap = chapters[idx % chapters.length];
      const t = 0.08 + (idx / total) * 0.86;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const side = idx % 2 === 0 ? -1 : 1;
      const offset = normal.clone().multiplyScalar(side * 4.4);
      const finalPos = point.clone().add(offset);
      finalPos.y = point.y;

      const tangentAngle = Math.atan2(tangent.x, tangent.z);
      const rotationY = tangentAngle + Math.PI + (side * 0.15);

      return {
        id: `sign-${idx}`,
        t,
        chapter: chap,
        position: [finalPos.x, finalPos.y, finalPos.z] as [number, number, number],
        rotationY,
        side,
      };
    });
  }, [curve, chapters]);

  // Calculate all pavilion coordinates along spline
  const allPavilions = useMemo(() => {
    return PAVILION_CHECKPOINTS.map((t, idx) => {
      const pt = curve.getPointAt(t);
      return {
        id: `pavilion-${idx}`,
        t,
        position: [pt.x, pt.y, pt.z] as [number, number, number],
      };
    });
  }, [curve]);

  // 🪟 SLIDING WINDOW FILTER: Only render signposts within visibility window (dT < 0.10)
  const visibleChapters = useMemo(() => {
    return allChapters.filter((item) => {
      const dt = Math.abs(item.t - cameraT);
      const wrapDt = Math.min(dt, 1.0 - dt);
      return wrapDt < 0.10;
    });
  }, [allChapters, cameraT]);

  // 🪟 SLIDING WINDOW FILTER: Only render pavilions within visibility window (dT < 0.12)
  const visiblePavilions = useMemo(() => {
    return allPavilions.filter((item) => {
      const dt = Math.abs(item.t - cameraT);
      const wrapDt = Math.min(dt, 1.0 - dt);
      return wrapDt < 0.12;
    });
  }, [allPavilions, cameraT]);

  return (
    <group>
      {/* Render only visible story signposts within sliding window */}
      {visibleChapters.map((item) => (
        <PhysicalStorySignpost
          key={item.id}
          chapter={item.chapter}
          position={item.position}
          rotationY={item.rotationY}
          side={item.side}
          onOpenModal={onOpenChapter}
        />
      ))}

      {/* Render only visible pavilions within sliding window */}
      {visiblePavilions.map((p) => (
        <CheckpointPavilion
          key={p.id}
          position={p.position}
          onOpenLetter={onOpenLetter}
        />
      ))}
    </group>
  );
}
