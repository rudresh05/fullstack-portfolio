"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchSetting, subscribeSetting, type ForHerContent } from "@/lib/content-store";

const EXPO_OUT = [0.16, 1, 0.3, 1] as const;


const DEFAULT_CONTENT: ForHerContent = {
  herName: "Her Name",
  tagline: "This page exists because of you",
  storyHeading: "Every chapter begins with you",
  storyBody: "Some stories don't have a single beginning. They unfold slowly, in moments you only recognise as important later. These are ours.",
  timeline: [
    { date: "Month DD, YYYY", title: "The day we met", desc: "I didn't know it then, but that was the day everything changed. Add your story here." },
    { date: "Month DD, YYYY", title: "The first time I knew", desc: "One moment — you know the one — where it all became absolutely clear." },
    { date: "Today", title: "Still here", desc: "Still choosing you. Still the best decision I ever made." }
  ],
  moments: [
    { title: "The beginning", text: "Write something beautiful about this moment. What were you feeling? What did you notice?", img: "https://picsum.photos/seed/love1/600/840", caption: "The first chapter", date: "Month, YYYY" },
    { title: "That moment", text: "There was one specific moment where everything clicked. Describe it here — she'll cherish it.", img: "https://picsum.photos/seed/love2/600/840", caption: "When I knew", date: "Month, YYYY" },
    { title: "Just us", text: "A quiet evening, a walk, a laugh that turned into more. Tell that story here.", img: "https://picsum.photos/seed/love3/600/840", caption: "Just us", date: "Month, YYYY" },
    { title: "Adventure", text: "Every place feels different with you. Write about your favourite shared adventure here.", img: "https://picsum.photos/seed/love4/600/840", caption: "Adventure", date: "Month, YYYY" },
    { title: "Always", text: "This isn't the last chapter — it's just the latest one. Here's to everything still ahead.", img: "https://picsum.photos/seed/love5/600/840", caption: "Us, always", date: "Month, YYYY" },
  ],
  letterDate: "June 2025",
  letterBody: [
    "There are people who come into your life and rearrange everything — quietly, without asking permission. You're that person for me.",
    "I don't always have the right words. I probably never will. But I know this: everything feels different with you around. Better. Lighter. More worth it.",
    "So this page is just me saying — in the only way I know how — that I see you. All of you. And I'm grateful, every single day."
  ],
  signature: "Your Name",
  quotes: [
    "In all the world, there is no heart for me like yours.",
    "Every moment with you is a favorite memory."
  ],
  portraitUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop"
};

export default function ForHerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<ForHerContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  const TOTAL_CARDS = content.moments.length;

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Fetch dynamic content
    fetchSetting<ForHerContent>("for_her_content", DEFAULT_CONTENT).then(val => {
      setContent(val);
      setLoading(false);
    });

    const unsub = subscribeSetting<ForHerContent>("for_her_content", val => {
      if (val) setContent(val);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      unsub();
    };
  }, []);

  const toggleFlip = (index: number) => {
    if (index !== currentCard) {
      setCurrentCard(index);
      return;
    }
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    // Reset flipped cards when content or card changes
    setFlippedCards({});

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.z = 50;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const N = 2500;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150 - 20;
      const warm = Math.random();
      col[i * 3] = 0.85 + warm * 0.15;
      col[i * 3 + 1] = 0.7 + warm * 0.1;
      col[i * 3 + 2] = 0.75 + warm * 0.05;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Heart particles
    function heartShape(t: number) {
      return {
        x: 16 * Math.pow(Math.sin(t), 3),
        y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
      };
    }
    const heartGeo = new THREE.BufferGeometry();
    const HN = 600;
    const hpos = new Float32Array(HN * 3);
    for (let i = 0; i < HN; i++) {
      const t = (i / HN) * Math.PI * 2;
      const h = heartShape(t);
      hpos[i * 3] = h.x * 0.4 + (Math.random() - 0.5) * 2;
      hpos[i * 3 + 1] = h.y * 0.4 + (Math.random() - 0.5) * 2;
      hpos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    heartGeo.setAttribute("position", new THREE.BufferAttribute(hpos, 3));
    const heartMat = new THREE.PointsMaterial({
      size: 0.18,
      color: 0xe8607a,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const heartPts = new THREE.Points(heartGeo, heartMat);
    heartPts.position.set(0, 0, -5);
    scene.add(heartPts);

    const heartMeshes: THREE.Mesh[] = [];
    function makeHeartMesh() {
      const shape = new THREE.Shape();
      const s = 0.5;
      shape.moveTo(0, s * 0.6);
      shape.bezierCurveTo(s * 0.8, s * 1.2, s * 1.6, -s * 0.2, 0, -s * 0.9);
      shape.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.8, s * 1.2, 0, s * 0.6);
      const geo = new THREE.ShapeGeometry(shape, 12);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe8607a,
        transparent: true,
        opacity: Math.random() * 0.3 + 0.1,
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 30 - 10);
      m.rotation.z = Math.random() * Math.PI * 2;
      m.userData = {
        vy: Math.random() * 0.03 + 0.01,
        vr: (Math.random() - 0.5) * 0.02,
      };
      return m;
    }
    for (let i = 0; i < 30; i++) {
      const m = makeHeartMesh();
      heartMeshes.push(m);
      scene.add(m);
    }

    let mx = 0,
      my = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    let t = 0;
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.008;

      stars.rotation.y = t * 0.04 + mx * 0.03;
      stars.rotation.x = my * 0.02;

      heartPts.rotation.y = t * 0.3;
      heartPts.rotation.x = Math.sin(t * 0.5) * 0.2;
      heartPts.material.opacity = 0.4 + Math.sin(t) * 0.2;

      heartMeshes.forEach((m) => {
        m.position.y += m.userData.vy;
        m.rotation.z += m.userData.vr;
        if (m.position.y > 40) m.position.y = -40;
      });

      camera.position.x += (mx * 3 - camera.position.x) * 0.05;
      camera.position.y += (-my * 2 - camera.position.y) * 0.05;
      camera.position.z = 50 - scrollY * 0.012;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted, content]);

  useEffect(() => {
    const timer = setInterval(() => {
      const anyFlipped = Object.values(flippedCards).some((v) => v);
      if (!anyFlipped && TOTAL_CARDS > 0) {
        setCurrentCard((prev) => (prev + 1) % TOTAL_CARDS);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [flippedCards, TOTAL_CARDS]);

  const getCardStyle = (index: number) => {
    const diff = index - currentCard;
    let d = diff;
    if (d > TOTAL_CARDS / 2) d -= TOTAL_CARDS;
    if (d < -TOTAL_CARDS / 2) d += TOTAL_CARDS;

    const radius = windowWidth < 600 ? 240 : 380;
    const angle = d * (360 / TOTAL_CARDS) * (Math.PI / 180);
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius - radius;
    const scale = d === 0 ? 1 : 0.72 - Math.abs(d) * 0.06;
    const opacity = d === 0 ? 1 : Math.max(0, 0.55 - Math.abs(d) * 0.15);
    const ry = -d * 28;

    return {
      transform: `translate3d(${x}px, 0, ${z}px) rotateY(${ry}deg) scale(${scale})`,
      opacity,
      zIndex: d === 0 ? 10 : 5 - Math.abs(d),
      pointerEvents: (d === 0 ? "auto" : "none") as any,
    };
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08050d]">
        <Loader2 className="h-8 w-8 animate-spin text-[#e8607a]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#08050d] font-['Tenor_Sans'] text-[#e8ddd8] selection:bg-[#e8607a]/30">
      {/* Three.js Layer */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Ethereal Background Portrait */}
      <div 
        className="pointer-events-none fixed top-0 bottom-0 right-0 z-0 w-full md:w-1/2 opacity-25"
        style={{
          backgroundImage: `url('${content.portraitUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          maskImage: "linear-gradient(to left, black 20%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(to left, black 20%, transparent 80%)",
        }}
      />

      {/* Dynamic Gallery Background Flash */}
      {content.moments.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={content.moments[currentCard].img}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              backgroundImage: `url('${content.moments[currentCard].img}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) saturate(1.5)",
            }}
          />
        </AnimatePresence>
      )}

      {/* Back Button */}
      <Link 
        href="/" 
        className="fixed top-8 left-8 z-50 flex items-center gap-2 rounded-full border border-[#e8607a]/20 bg-[#08050d]/50 px-4 py-2 text-xs font-bold text-[#f4a0b5] backdrop-blur-md transition-all hover:bg-[#e8607a]/10 hover:border-[#e8607a]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Aesthetic Grain Layer */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.035] mix-blend-overlay">
        <div className="h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 z-50 h-[2px] bg-gradient-to-r from-[#e8607a] to-[#d4a96a]"
        style={{ scaleX: 0, transformOrigin: "0%" }}
      />

      {/* Navigation */}
      <nav className="fixed right-8 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
        {["hero", "story", "gallery", "letter", "closing"].map((id, i) => (
          <button
            key={id}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              currentCard === i ? "scale-150 bg-[#e8607a] shadow-[0_0_10px_#e8607a]" : "bg-[#e8607a]/25"
            }`}
          />
        ))}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative z-20 flex min-h-screen flex-col items-center justify-center p-8 text-center perspective-800">
        <div className="absolute h-[700px] w-[700px] animate-[spin_30s_linear_infinite] rounded-full border border-[#e8607a]/5" />
        <div className="absolute h-[500px] w-[500px] animate-[spin_20s_linear_infinite_reverse] rounded-full border border-[#d4a96a]/5" />
        <div className="hero-glow pointer-events-none absolute h-[400px] w-[600px] animate-pulse bg-radial-gradient-ellipse from-[#e8607a]/10 to-transparent" />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4, ease: EXPO_OUT }}
          className="mb-8 font-['Cormorant_Garamond'] text-lg italic tracking-[0.4em] text-[#d4a96a] uppercase"
        >
          A page made just for
        </motion.p>

        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.8, ease: EXPO_OUT }}
            className="relative font-['Cormorant_Garamond'] text-[clamp(80px,16vw,180px)] font-light leading-[0.85] tracking-tight text-[#f8eff0]"
          >
            {content.herName.split(" ")[0]}<span className="block italic text-[#f4a0b5]/90">{content.herName.split(" ").slice(1).join(" ") || "Name"}</span>
            <div className="pointer-events-none absolute top-1 left-1 -z-10 select-none text-transparent [-webkit-text-stroke:1px_rgba(232,96,122,0.15)]">{content.herName.split(" ")[0]}</div>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1.5, ease: EXPO_OUT }}
          className="mt-10 text-sm tracking-[0.3em] text-[#9a8898] uppercase"
        >
          {content.tagline}
        </motion.p>

        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <div className="h-14 w-px bg-gradient-to-b from-[#e8607a] to-transparent" />
          <span className="text-[9px] tracking-[0.4em] text-[#9a8898] uppercase">Scroll to begin</span>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="relative z-20 flex min-h-screen items-center justify-center px-6 py-24 sm:px-12">
        <div className="mx-auto grid max-w-6xl w-full gap-12 items-center md:grid-cols-2">
          <div>
            <p className="mb-5 text-[10px] tracking-[0.5em] text-[#d4a96a] uppercase">Our Story</p>
            <h2 className="mb-8 font-['Cormorant_Garamond'] text-[clamp(38px,5vw,62px)] font-light leading-none text-[#f8eff0]">
              {content.storyHeading.split(" ").slice(0, -1).join(" ")}<br /><em className="italic text-[#f4a0b5]">{content.storyHeading.split(" ").slice(-1)}</em>
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-[#9a8898]">{content.storyBody}</p>
          </div>

          <div className="relative space-y-12 pl-8 border-l border-[#e8607a]/15">
            {content.timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className="relative"
              >
                <div className="absolute -left-[41px] top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#e8607a] bg-[#08050d]">
                   <div className="h-1.5 w-1.5 rounded-full bg-[#e8607a] shadow-[0_0_8px_#e8607a]" />
                </div>
                <p className="mb-1 text-[10px] tracking-[0.25em] text-[#d4a96a] uppercase">{item.date}</p>
                <h3 className="mb-2 font-['Cormorant_Garamond'] text-2xl text-[#f8eff0]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#9a8898]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="relative z-20 flex min-h-screen flex-col items-center py-24 perspective-1200">
        <div className="mb-20 text-center">
          <p className="mb-5 text-[10px] tracking-[0.5em] text-[#d4a96a] uppercase">Our Moments</p>
          <h2 className="font-['Cormorant_Garamond'] text-[clamp(38px,5vw,62px)] font-light leading-none text-[#f8eff0]">
            Frozen <em className="italic text-[#f4a0b5]">in time</em>
          </h2>
          <p className="mt-4 text-[12px] tracking-widest text-[#9a8898]">Click a card to flip it ♥</p>
        </div>

        <div className="relative h-[520px] w-full max-w-5xl">
          <div className="relative h-full w-full transition-transform duration-700 preserve-3d">
            {content.moments.map((card, i) => (
              <div
                key={i}
                style={getCardStyle(i)}
                onClick={() => toggleFlip(i)}
                className="absolute top-1/2 left-1/2 h-[420px] w-[300px] -ml-[150px] -mt-[210px] cursor-pointer rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-[#e8607a]/20 preserve-3d"
              >
                <div className={`relative h-full w-full transition-transform duration-700 preserve-3d ${flippedCards[i] ? "[transform:rotateY(180deg)]" : ""}`}>
                  {/* Front */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl backface-hidden">
                    <img src={card.img} alt={card.caption} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08050d] via-transparent to-transparent p-6 flex flex-col justify-end">
                      <p className="font-['Cormorant_Garamond'] text-xl italic text-[#fde0e8]">{card.caption}</p>
                      <p className="mt-1 text-[10px] tracking-widest text-[#9a8898] uppercase">{card.date}</p>
                    </div>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center border border-[#e8607a]/15 bg-gradient-to-br from-[#110a18] to-[#1a1025] p-10 text-center rounded-2xl [transform:rotateY(180deg)] backface-hidden">
                    <h3 className="mb-4 font-['Cormorant_Garamond'] text-3xl italic text-[#f4a0b5]">{card.title}</h3>
                    <p className="text-sm leading-loose text-[#9a8898]">{card.text}</p>
                    <span className="mt-6 text-4xl text-[#e8607a] animate-bounce">♥</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center gap-8">
          <button onClick={() => setCurrentCard((prev) => (prev - 1 + TOTAL_CARDS) % TOTAL_CARDS)} className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e8607a]/15 text-xl text-[#f4a0b5] transition-all hover:bg-[#e8607a]/10 hover:border-[#e8607a]">←</button>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
              <button key={i} onClick={() => setCurrentCard(i)} className={`h-0.5 transition-all duration-500 ${i === currentCard ? "w-10 bg-[#e8607a]" : "w-6 bg-[#e8607a]/20"}`} />
            ))}
          </div>
          <button onClick={() => setCurrentCard((prev) => (prev + 1) % TOTAL_CARDS)} className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e8607a]/15 text-xl text-[#f4a0b5] transition-all hover:bg-[#e8607a]/10 hover:border-[#e8607a]">→</button>
        </div>
      </section>

      {/* Letter Section */}
      <section id="letter" className="relative z-20 flex min-h-screen items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl w-full border border-[#e8607a]/15 bg-gradient-to-br from-[#1a1025]/95 to-[#110a18]/95 p-12 sm:p-20 rounded-[32px] overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-radial-gradient-at-tl from-[#e8607a]/5 to-transparent" />
          <span className="absolute top-4 left-6 select-none font-['Cormorant_Garamond'] text-[100px] leading-none text-[#e8607a]/5">❝</span>

          <div className="relative mb-12 flex items-center justify-between border-b border-[#e8607a]/15 pb-6">
            <span className="text-[10px] tracking-[0.45em] text-[#d4a96a] uppercase">A letter, for you</span>
            <span className="text-xs text-[#9a8898]">{content.letterDate}</span>
          </div>

          <div className="relative z-10 font-['Cormorant_Garamond'] text-[clamp(18px,2.4vw,24px)] font-light italic leading-loose text-[#e8ddd8]">
            {content.letterBody.map((p, i) => (
              <p key={i} className="mb-8">{p}</p>
            ))}
          </div>

          <p className="mt-12 border-t border-[#e8607a]/15 pt-8 text-right font-['Cormorant_Garamond'] text-3xl text-[#f4a0b5]">
            — Always yours, {content.signature}
          </p>
        </motion.div>
      </section>

      {/* Closing Section */}
      <section id="closing" className="relative z-20 flex min-h-screen flex-col items-center justify-center text-center p-8 overflow-hidden">
        <div className="absolute h-full w-full flex items-center justify-center pointer-events-none">
          <div className="absolute h-[300px] w-[300px] animate-[spin_30s_linear_infinite] rounded-full border border-[#e8607a]/5" />
          <div className="absolute h-[600px] w-[600px] animate-[spin_50s_linear_infinite_reverse] rounded-full border border-[#d4a96a]/5" />
        </div>

        <div className="pointer-events-none absolute h-[800px] w-[800px] rounded-full bg-radial-gradient-ellipse from-[#e8607a]/5 to-transparent animate-pulse" />

        <div className="relative z-10 max-w-4xl px-8">
          {content.quotes.map((quote, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: i === 0 ? 1 : 0.8, y: 0 }}
              transition={{ duration: 1.2, delay: i * 0.3 }}
              className={`${i === 0 ? "mb-12 text-[clamp(26px,4vw,50px)]" : "text-[clamp(20px,3vw,32px)]"} font-['Cormorant_Garamond'] font-light italic leading-tight text-[#f8eff0]`}
            >
              "{quote}"
            </motion.p>
          ))}

          <div className="mt-20 flex flex-col items-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mb-6 text-[11px] tracking-[0.4em] text-[#d4a96a] uppercase"
            >
              Made with love — for Her
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.9 }}
              className="text-6xl text-[#e8607a] [text-shadow:0_0_40px_rgba(232,96,122,0.5)]"
            >
              ♥
            </motion.div>
            <p className="mt-12 text-[10px] tracking-[0.25em] text-[#3a2535] uppercase">crafted just for you</p>
          </div>
        </div>
      </section>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Tenor+Sans&display=swap');
      `}</style>
    </div>
  );
}

