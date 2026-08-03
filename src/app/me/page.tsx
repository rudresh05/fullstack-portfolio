"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import * as THREE from "three";
import { fetchSetting, subscribeSetting, type ForHerContent } from "@/lib/content-store";

const DEFAULT_CONTENT: ForHerContent = {
  herName: "Her Name",
  tagline: "This page exists because of you",
  storyHeading: "Every chapter begins with you",
  storyBody:
    "Some stories don't have a single beginning. They unfold slowly, in moments you only recognise as important later. These are ours.",
  timeline: [
    { date: "Month DD, YYYY", title: "The day we met", desc: "I didn't know it then, but that was the day everything changed." },
    { date: "Month DD, YYYY", title: "The first time I knew", desc: "One moment — you know the one — where it all became absolutely clear." },
    { date: "Today", title: "Still here", desc: "Still choosing you. Still the best decision I ever made." },
  ],
  moments: [
    { title: "The beginning", text: "Write something beautiful about this moment.", img: "https://picsum.photos/seed/love1/600/840", caption: "The first chapter", date: "Month, YYYY" },
    { title: "That moment", text: "There was one moment where everything clicked.", img: "https://picsum.photos/seed/love2/600/840", caption: "When I knew", date: "Month, YYYY" },
    { title: "Just us", text: "A quiet evening, a walk, a laugh that turned into more.", img: "https://picsum.photos/seed/love3/600/840", caption: "Just us", date: "Month, YYYY" },
    { title: "Adventure", text: "Every place feels different with you.", img: "https://picsum.photos/seed/love4/600/840", caption: "Adventure", date: "Month, YYYY" },
  ],
  letterDate: "June 2025",
  letterBody: [
    "There are people who come into your life and rearrange everything — quietly, without asking permission. You're that person for me.",
    "I don't always have the right words. I probably never will. But I know this: everything feels different with you around. Better. Lighter. More worth it.",
    "So this page is just me saying — in the only way I know how — that I see you. All of you. And I'm grateful, every single day.",
  ],
  signature: "Your Name",
  quotes: ["In all the world, there is no heart for me like yours.", "Every moment with you is a favorite memory."],
  portraitUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop",
};

const reveal = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };

export default function ForHerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [content, setContent] = useState<ForHerContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [activeMoment, setActiveMoment] = useState(0);
  const [showStory, setShowStory] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSetting<ForHerContent>("for_her_content", DEFAULT_CONTENT).then((value) => {
      if (active) {
        setContent(value ?? DEFAULT_CONTENT);
        setLoading(false);
      }
    });
    const unsubscribe = subscribeSetting<ForHerContent>("for_her_content", (value) => {
      if (value) setContent(value);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (showStory || content.moments.length < 2) return;
    const timer = window.setInterval(() => setActiveMoment((value) => (value + 1) % content.moments.length), 5000);
    return () => window.clearInterval(timer);
  }, [content.moments.length, showStory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 20;

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = window.innerWidth < 768 ? 750 : 1500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount; index += 1) {
      const offset = index * 3;
      starPositions[offset] = (Math.random() - 0.5) * 48;
      starPositions[offset + 1] = (Math.random() - 0.5) * 34;
      starPositions[offset + 2] = -Math.random() * 45;
      const warmth = Math.random();
      starColors[offset] = 0.88 + warmth * 0.12;
      starColors[offset + 1] = 0.65 + warmth * 0.2;
      starColors[offset + 2] = 0.76 + warmth * 0.2;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: 0.055, transparent: true, opacity: 0.72, vertexColors: true, sizeAttenuation: true }));
    scene.add(stars);

    // Square particles travel through a looping, hourglass-shaped stream around the heart.
    // Multiple point sizes keep the flow feeling like glowing pixels rather than a flat dust cloud.
    const flowGroups: Array<{ geometry: THREE.BufferGeometry; points: THREE.Points; particles: Float32Array }> = [];
    [0.045, 0.085, 0.15].forEach((size, groupIndex) => {
      const count = window.innerWidth < 768 ? 110 : 190;
      const particles = new Float32Array(count * 2);
      const positions = new Float32Array(count * 3);
      for (let index = 0; index < count; index += 1) {
        particles[index * 2] = Math.random(); // progress through the stream
        particles[index * 2 + 1] = (Math.random() - 0.5) * 5; // individual spiral lane
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(geometry, new THREE.PointsMaterial({
        color: groupIndex === 2 ? 0xd47390 : 0xb94d72,
        size,
        transparent: true,
        opacity: groupIndex === 2 ? 0.36 : 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      scene.add(points);
      flowGroups.push({ geometry, points, particles });
    });

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -1.2);
    heartShape.bezierCurveTo(-2.1, 0.1, -1.7, 2.2, 0, 1.15);
    heartShape.bezierCurveTo(1.7, 2.2, 2.1, 0.1, 0, -1.2);
    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.45, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.14, bevelThickness: 0.15, curveSegments: 40 });
    heartGeometry.center();
    const heart = new THREE.Mesh(heartGeometry, new THREE.MeshPhysicalMaterial({ color: 0xd974ae, emissive: 0x4b1339, emissiveIntensity: 0.7, roughness: 0.22, metalness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.1 }));
    heart.position.set(0, -0.75, -1.5);
    heart.rotation.set(-0.12, 0.2, -0.08);
    heart.scale.setScalar(window.innerWidth < 768 ? 0.48 : 0.7);
    scene.add(heart);

    const glow = new THREE.PointLight(0xff79ad, 14, 18);
    glow.position.set(0, 1.5, 5);
    const fill = new THREE.PointLight(0x9d73e6, 8, 14);
    fill.position.set(-4, -2, 2);
    scene.add(glow, fill, new THREE.AmbientLight(0xffc8da, 1.2));

    let pointerX = 0;
    let pointerY = 0;
    let scroll = window.scrollY;
    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => { scroll = window.scrollY; };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();
      stars.rotation.y = elapsed * 0.018 + pointerX * 0.08;
      stars.rotation.x = pointerY * 0.035;
      flowGroups.forEach(({ geometry, particles }, groupIndex) => {
        const positions = geometry.attributes.position.array as Float32Array;
        for (let index = 0; index < particles.length / 2; index += 1) {
          const progress = (particles[index * 2] + elapsed * (0.045 + groupIndex * 0.012)) % 1;
          const lane = particles[index * 2 + 1];
          const centerDistance = Math.abs(progress - 0.5) * 2;
          const spread = 0.45 + Math.pow(centerDistance, 1.55) * 5.2;
          const angle = progress * Math.PI * 8 + lane;
          const offset = index * 3;
          positions[offset] = Math.sin(angle) * spread + Math.sin(lane * 2) * 0.3;
          positions[offset + 1] = (progress - 0.5) * 27;
          positions[offset + 2] = -3 + Math.cos(angle) * (0.7 + centerDistance * 1.8);
        }
        geometry.attributes.position.needsUpdate = true;
      });
      heart.rotation.y += (pointerX * 0.48 - heart.rotation.y) * 0.025;
      heart.rotation.x += (-0.12 - pointerY * 0.18 - heart.rotation.x) * 0.025;
      heart.position.y = -0.75 + Math.sin(elapsed * 1.3) * 0.18 - Math.min(scroll * 0.0015, 2.4);
      heart.position.x += (pointerX * 0.65 - heart.position.x) * 0.02;
      glow.intensity = 11 + Math.sin(elapsed * 2) * 3;
      camera.position.x += (pointerX * 0.38 - camera.position.x) * 0.025;
      camera.position.y += (-pointerY * 0.25 - camera.position.y) * 0.025;
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      starsGeometry.dispose();
      (stars.material as THREE.Material).dispose();
      flowGroups.forEach(({ geometry, points }) => {
        geometry.dispose();
        (points.material as THREE.Material).dispose();
      });
      heartGeometry.dispose();
      (heart.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  const moment = content.moments[activeMoment];
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#0b0710]"><Loader2 className="h-7 w-7 animate-spin text-rose-300" /></div>;
  }

  return (
    <main className="romance-page relative min-h-screen overflow-x-hidden bg-[#0b0710] text-[#f8eef1] selection:bg-rose-300/30">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[15] opacity-85" aria-hidden="true" />
      <div className="romance-noise pointer-events-none fixed inset-0 z-20 opacity-40" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_65%_18%,#3c2435_0%,transparent_35%),radial-gradient(ellipse_at_20%_70%,#1f1127_0%,transparent_38%),#0b0710]" />
      <div className="pointer-events-none fixed inset-y-0 right-0 z-0 w-full opacity-55 sm:w-[72%] lg:w-[58%]" style={{ backgroundImage: `linear-gradient(90deg,#0b0710 0%,rgba(11,7,16,.34) 38%,rgba(11,7,16,.08) 100%), linear-gradient(0deg,#0b0710 0%,transparent 35%,rgba(11,7,16,.28) 100%), url('${content.portraitUrl}')`, backgroundPosition: "center 20%", backgroundSize: "cover" }} />

      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 38 }, (_, index) => <i key={index} className="love-star" style={{ left: `${(index * 37) % 100}%`, top: `${(index * 61) % 100}%`, animationDelay: `${(index % 8) * -0.8}s` }} />)}
        {Array.from({ length: 12 }, (_, index) => <Heart key={index} className="love-heart" fill="currentColor" style={{ left: `${(index * 29 + 7) % 94}%`, animationDelay: `${index * -1.4}s`, transform: `scale(${0.35 + (index % 4) * 0.12})` }} />)}
      </div>

      <Link href="/" className="fixed left-5 top-5 z-40 inline-flex items-center gap-2 rounded-full border border-rose-200/15 bg-[#100915]/65 px-4 py-2.5 text-xs font-medium tracking-wide text-rose-100 backdrop-blur-md transition hover:border-rose-200/40 hover:bg-rose-300/10 sm:left-8 sm:top-8">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <nav className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex" aria-label="Page sections">
        {["hero", "story", "moments", "letter", "forever"].map((section) => <button key={section} aria-label={`Go to ${section}`} onClick={() => scrollTo(section)} className="group flex items-center justify-end gap-3"><span className="translate-x-2 text-[9px] uppercase tracking-[0.22em] text-rose-100/0 transition group-hover:translate-x-0 group-hover:text-rose-100/70">{section}</span><span className="h-1.5 w-1.5 rounded-full bg-rose-300/45 transition group-hover:scale-150 group-hover:bg-rose-200" /></button>)}
      </nav>

      <section id="hero" className="relative z-20 flex min-h-screen items-center justify-center px-6 pb-20 pt-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(78vw,680px)] w-[min(78vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-200/[0.07]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(61vw,510px)] w-[min(61vw,510px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/[0.07]" />
        <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.18 }} className="relative max-w-4xl">
          <motion.div variants={reveal} transition={{ duration: 0.9 }} className="mb-7 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.55em] text-[#e8c47b]"><span className="h-px w-8 bg-[#e8c47b]/45" /> A page made just for <span className="h-px w-8 bg-[#e8c47b]/45" /></motion.div>
          <motion.h1 variants={reveal} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="whitespace-nowrap font-[Georgia,serif] text-[clamp(3.8rem,15vw,11.5rem)] font-normal leading-[0.76] tracking-[-0.07em] text-[#fff7f8] drop-shadow-[0_10px_35px_rgba(0,0,0,0.4)]">
            {content.herName}
          </motion.h1>
          <motion.div variants={reveal} transition={{ duration: 1, delay: 0.1 }} className="mx-auto mt-10 flex items-center justify-center gap-4"><span className="h-px w-14 bg-rose-200/20" /><Heart className="h-7 w-7 fill-rose-300 text-rose-300 drop-shadow-[0_0_22px_rgba(251,113,133,0.7)]" /><span className="h-px w-14 bg-rose-200/20" /></motion.div>
          <motion.p variants={reveal} transition={{ duration: 1 }} className="mt-8 text-xs uppercase tracking-[0.34em] text-rose-100/60 sm:text-sm">{content.tagline}</motion.p>
        </motion.div>
        <button onClick={() => scrollTo("story")} className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-[9px] uppercase tracking-[0.35em] text-rose-100/55 transition hover:text-rose-100"><span className="h-12 w-px bg-gradient-to-b from-rose-300 to-transparent" />Begin our story</button>
      </section>

      <section id="story" className="relative z-20 mx-auto flex min-h-screen max-w-6xl items-center px-6 py-24 sm:px-12">
        <div className="grid w-full gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-28">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9 }} variants={reveal}>
            <p className="mb-6 text-[10px] uppercase tracking-[0.5em] text-[#e8c47b]">Our story</p>
            <h2 className="max-w-md font-[Georgia,serif] text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.055em]">{content.storyHeading}</h2>
            <div className="my-8 h-px w-24 bg-rose-300/35" />
            <p className="max-w-md text-base leading-8 text-rose-100/60">{content.storyBody}</p>
          </motion.div>
          <div className="relative space-y-11 border-l border-rose-200/15 pl-8 sm:pl-12">
            {content.timeline.map((item, index) => <motion.article key={`${item.date}-${item.title}`} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ duration: 0.65, delay: index * 0.12 }} className="relative"><span className="absolute -left-[39px] top-1 h-3.5 w-3.5 rounded-full border border-rose-300 bg-[#120a16] shadow-[0_0_0_4px_rgba(251,113,133,0.06)] sm:-left-[55px]" /><p className="mb-2 text-[10px] uppercase tracking-[0.34em] text-[#e8c47b]">{item.date}</p><h3 className="font-[Georgia,serif] text-3xl tracking-tight text-rose-50">{item.title}</h3><p className="mt-3 max-w-lg leading-7 text-rose-100/55">{item.desc}</p></motion.article>)}
          </div>
        </div>
      </section>

      <section id="moments" className="relative z-20 py-24 sm:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ duration: 0.8 }} className="mx-auto mb-14 max-w-3xl px-6 text-center"><p className="mb-5 text-[10px] uppercase tracking-[0.5em] text-[#e8c47b]">Our moments</p><h2 className="font-[Georgia,serif] text-[clamp(3.2rem,6vw,5.6rem)] leading-none tracking-[-0.06em]">Frozen <em className="font-normal text-rose-300">in time</em></h2><p className="mt-5 text-sm text-rose-100/55">Every memory is a small universe with you at the centre.</p></motion.div>
        {moment && <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 sm:px-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="absolute -inset-4 rounded-[2rem] bg-rose-300/10 blur-2xl" />
            <AnimatePresence mode="wait"><motion.button key={moment.img} onClick={() => setShowStory((open) => !open)} initial={{ opacity: 0, rotate: -2, scale: 0.96 }} animate={{ opacity: 1, rotate: 1, scale: 1 }} exit={{ opacity: 0, rotate: 3, scale: 0.96 }} transition={{ duration: 0.55 }} className="relative aspect-[.72] w-full overflow-hidden rounded-[1.6rem] border border-rose-100/20 bg-[#1a0d1d] text-left shadow-[0_25px_60px_rgba(0,0,0,0.42)]" style={{ backgroundImage: `linear-gradient(to top,rgba(11,7,16,.95),transparent 55%),url('${moment.img}')`, backgroundPosition: "center", backgroundSize: "cover" }}><div className="absolute inset-0 grid place-items-center bg-[#130a18]/88 p-9 text-center transition-opacity duration-500" style={{ opacity: showStory ? 1 : 0 }}><p className="font-[Georgia,serif] text-2xl italic leading-relaxed text-rose-50">{moment.text}</p></div><div className="absolute inset-x-0 bottom-0 p-7 transition-opacity" style={{ opacity: showStory ? 0 : 1 }}><p className="font-[Georgia,serif] text-3xl italic">{moment.caption}</p><p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-rose-100/65">{moment.date} · tap for the story</p></div></motion.button></AnimatePresence>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{content.moments.map((item, index) => <button key={`${item.title}-${index}`} onClick={() => { setActiveMoment(index); setShowStory(false); }} className={`group relative min-h-32 overflow-hidden rounded-2xl border p-5 text-left transition duration-500 ${index === activeMoment ? "border-rose-200/45 bg-rose-300/10" : "border-rose-100/10 bg-white/[0.025] hover:border-rose-200/25"}`}><span className="mb-8 block text-[10px] uppercase tracking-[0.25em] text-[#e8c47b]">0{index + 1}</span><h3 className="font-[Georgia,serif] text-2xl text-rose-50">{item.title}</h3><p className="mt-1 text-sm text-rose-100/45">{item.caption}</p>{index === activeMoment && <span className="absolute right-4 top-4 text-rose-300"><Heart className="h-4 w-4 fill-current" /></span>}</button>)}</div>
        </div>}
      </section>

      <section id="letter" className="relative z-20 flex min-h-screen items-center justify-center px-6 py-24 sm:px-12">
        <motion.article initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} transition={{ duration: 1 }} className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-rose-200/15 bg-[linear-gradient(135deg,rgba(41,19,52,.88),rgba(17,10,25,.94))] p-8 shadow-[0_35px_100px_rgba(0,0,0,.35)] sm:p-14 md:p-20"><Sparkles className="absolute right-7 top-7 h-5 w-5 text-[#e8c47b]/50" /><span className="absolute -left-1 top-3 font-[Georgia,serif] text-[9rem] leading-none text-rose-300/[0.06]">“</span><header className="relative flex items-center justify-between border-b border-rose-100/10 pb-6"><span className="text-[10px] uppercase tracking-[0.4em] text-[#e8c47b]">A letter, for you</span><span className="text-xs text-rose-100/45">{content.letterDate}</span></header><div className="relative mt-11 space-y-7 font-[Georgia,serif] text-xl italic leading-[1.9] text-rose-50/85 sm:text-2xl">{content.letterBody.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><footer className="relative mt-12 border-t border-rose-100/10 pt-8 text-right font-[Georgia,serif] text-3xl text-rose-300">Always yours, {content.signature} <Heart className="ml-1 inline h-5 w-5 fill-current" /></footer></motion.article>
      </section>

      <section id="forever" className="relative z-20 flex min-h-screen items-center justify-center px-6 py-24 text-center"><div className="absolute h-[min(80vw,650px)] w-[min(80vw,650px)] rounded-full border border-rose-200/[0.06]" /><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.2 }} className="relative max-w-4xl">{content.quotes.map((quote, index) => <motion.p key={quote} variants={reveal} transition={{ duration: 0.85 }} className={`font-[Georgia,serif] italic leading-tight ${index === 0 ? "text-[clamp(2.7rem,6vw,5.7rem)]" : "mt-11 text-[clamp(1.6rem,3vw,2.7rem)] text-rose-100/70"}`}>“{quote}”</motion.p>)}<motion.div variants={reveal} transition={{ duration: 0.8 }} className="mt-16"><Heart className="mx-auto h-12 w-12 animate-pulse fill-rose-300 text-rose-300 drop-shadow-[0_0_35px_rgba(251,113,133,0.8)]" /><p className="mt-7 text-[10px] uppercase tracking-[0.45em] text-[#e8c47b]">With all my love · always</p><button onClick={() => scrollTo("hero")} className="mt-9 inline-flex items-center gap-2 text-xs text-rose-100/55 transition hover:text-rose-100">Read it again <ArrowRight className="h-3.5 w-3.5" /></button></motion.div></motion.div></section>

      <style jsx global>{`
        .romance-page { font-family: ui-sans-serif, system-ui, sans-serif; }
        .romance-noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
        .love-star { position: absolute; width: 2px; height: 2px; border-radius: 999px; background: #fff4ef; box-shadow: 0 0 7px 1px rgba(255,220,225,.75); animation: love-twinkle 3.5s ease-in-out infinite; }
        .love-heart { position: absolute; bottom: -5%; color: rgba(251,113,133,.55); filter: drop-shadow(0 0 9px rgba(251,113,133,.4)); animation: love-float 16s linear infinite; }
        @keyframes love-twinkle { 50% { opacity: .15; transform: scale(.5); } }
        @keyframes love-float { to { transform: translateY(-115vh) rotate(25deg) scale(1.1); } }
      `}</style>
    </main>
  );
}
