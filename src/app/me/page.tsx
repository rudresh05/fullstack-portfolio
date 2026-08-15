"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { Experience3D } from "@/components/relationship/Experience3D";
import { useRelationship } from "@/components/relationship/relationship-provider";
import { MusicWidget } from "@/components/relationship/MusicWidget";
import { JourneyChapter } from "@/components/relationship/journey-path";
import { Loader2, Heart, Sparkles, ChevronDown, X, Calendar, MapPin, MessageCircleHeart, Video, Lock, Unlock } from "lucide-react";
import Link from "next/link";

export default function MePage() {
  const { data, loading, refresh } = useRelationship();
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<JourneyChapter | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [droneMode, setDroneMode] = useState(false);

  // Check saved session unlock state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("universe_unlocked");
      if (saved === "true") {
        setUnlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setScrolled(true);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading || unlocking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#060307]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-7 w-7 animate-spin text-rose-400" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-rose-200/70 font-sans-display">
            Opening your enchanted universe…
          </p>
        </div>
      </div>
    );
  }

  // Strictly enforce locked state until passcode is entered
  const isLocked = !unlocked;

  // Love letter data from backend or fallback romantic note
  const latestLetter = data?.letters?.[0] || {
    title: "To My Dearest Love",
    body: "From the very moment you entered my world, everything became brighter, warmer, and full of purpose. You are my greatest adventure, my safest haven, and my favorite reason to smile. Every single step on this winding path has led me to you, and I promise to choose you, love you, and stand beside you today, tomorrow, and for all the lifetimes to come.",
    signature: "Forever Yours",
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#060307] select-none">
      {/* Top Floating Subtle Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-rose-950/60 border border-rose-500/30 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          </div>
          <span className="font-cursive text-xl text-rose-200 drop-shadow-md">
            Our Universe
          </span>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Lock / Relock Status Indicator */}
          {!isLocked ? (
            <button
              onClick={() => {
                sessionStorage.removeItem("universe_unlocked");
                setUnlocked(false);
              }}
              title="Lock Garden Gates"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/40 text-rose-300 text-[11px] font-sans-display tracking-wider transition-all backdrop-blur-md cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unlocked</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-sans-display tracking-wider backdrop-blur-md">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Locked</span>
            </div>
          )}

          {/* 🚁 3D Drone Mode Toggle Button */}
          {!isLocked && (
            <button
              onClick={() => setDroneMode((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-sans-display tracking-wider uppercase transition-all backdrop-blur-md cursor-pointer ${
                droneMode
                  ? "bg-rose-600/40 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>{droneMode ? "🚁 Drone Cam ON" : "🚁 Drone Cam"}</span>
            </button>
          )}

          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[11px] font-sans-display tracking-widest uppercase transition-all backdrop-blur-md"
          >
            Portfolio
          </Link>
        </div>
      </header>

      {/* Floating Scroll Indicator */}
      {!isLocked && !scrolled && !droneMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none animate-bounce">
          <span className="text-[10px] uppercase tracking-[0.3em] text-rose-300/80 font-sans-display drop-shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-rose-400" />
            Scroll to wander through the garden
          </span>
          <ChevronDown className="w-4 h-4 text-rose-400" />
        </div>
      )}

      {/* Drone Mode Active Banner */}
      {droneMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 backdrop-blur-md text-[10px] uppercase tracking-widest text-rose-200 pointer-events-none flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Cinematic Drone Flyover Active</span>
        </div>
      )}

      {/* 3D Three.js Journey Canvas with Strictly Enforced Entrance Gate Lock */}
      <Canvas
        camera={{ position: [0, 2, 14], fov: 56 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#060307"]} />
        <fog attach="fog" args={["#060307", 14, 75]} />

        <ScrollControls pages={isLocked ? 1 : 16} damping={0.14} infinite={!isLocked}>
          <Experience3D
            isLocked={isLocked}
            isDroneMode={droneMode}
            onOpenChapter={(c) => setSelectedChapter(c)}
            onOpenLetter={() => setLetterOpen(true)}
            onUnlock={async (token: string) => {
              setUnlocking(true);
              try {
                const res = await fetch("/api/relationship/access", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token }),
                });
                if (res.ok) {
                  sessionStorage.setItem("universe_unlocked", "true");
                  await refresh();
                  setUnlocked(true);
                  setUnlocking(false);
                  return true;
                }
              } catch {
                // ignore
              }
              setUnlocking(false);
              return false;
            }}
          />
        </ScrollControls>
      </Canvas>

      {/* Romantic Music & Quote Widget */}
      <MusicWidget />

      {/* Chapter Reading Modal */}
      {selectedChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0c0512] border border-rose-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedChapter(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold font-sans-display border border-rose-500/30">
                Chapter {selectedChapter.chapterNumber}
              </span>
              {selectedChapter.date && (
                <span className="text-xs text-rose-200/60 font-sans-display flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  {selectedChapter.date}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif-display text-white mb-2 leading-tight">
              {selectedChapter.title}
            </h2>

            {selectedChapter.subtitle && (
              <p className="text-sm font-serif-display italic text-rose-300 mb-5">
                "{selectedChapter.subtitle}"
              </p>
            )}

            {selectedChapter.coverUrl && (
              <div className="mb-5 rounded-2xl overflow-hidden max-h-56 w-full border border-rose-500/30 shadow-lg">
                <img
                  src={selectedChapter.coverUrl}
                  alt={selectedChapter.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="prose prose-invert max-w-none text-white/85 text-sm sm:text-base leading-relaxed font-sans-display mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <p>{selectedChapter.body}</p>
            </div>

            {selectedChapter.quote && (
              <div className="rounded-2xl bg-rose-950/50 border border-rose-500/30 p-4 mb-6 flex items-start gap-3">
                <MessageCircleHeart className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-cursive text-rose-100 italic leading-snug">
                  "{selectedChapter.quote}"
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-rose-500/20 text-xs">
              {selectedChapter.location && (
                <div className="flex items-center gap-1.5 text-rose-200/70">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>{selectedChapter.location}</span>
                </div>
              )}
              <div className="flex gap-1.5 ml-auto">
                {(selectedChapter.tags || ["Love", "Memory"]).map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] border border-rose-500/25"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Love Letter Modal */}
      {letterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#130716] border-2 border-rose-500/50 p-7 sm:p-9 shadow-[0_0_80px_rgba(244,63,94,0.5)] overflow-hidden">
            <button
              onClick={() => setLetterOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-700 to-red-500 border-2 border-amber-300/60 flex items-center justify-center shadow-xl">
                <Heart className="w-7 h-7 fill-white text-white animate-pulse" />
              </div>
            </div>

            <div className="text-center mb-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-rose-400 font-sans-display font-semibold">
                A Letter For You
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-white mt-1">
                {latestLetter.title || "My Forever Love"}
              </h2>
            </div>

            <div className="rounded-2xl bg-black/40 border border-rose-500/20 p-5 sm:p-6 mb-6 max-h-72 overflow-y-auto custom-scrollbar">
              <p className="text-base sm:text-lg font-cursive text-rose-100/95 leading-relaxed italic">
                {latestLetter.body}
              </p>
            </div>

            <div className="text-right pr-3 mb-4">
              <p className="text-xs uppercase tracking-widest text-rose-300/70 font-sans-display mb-1">
                With All My Heart,
              </p>
              <p className="text-2xl font-cursive text-rose-200 font-bold">
                {latestLetter.signature || "Forever & Always"}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setLetterOpen(false)}
                className="px-6 py-2.5 rounded-full bg-rose-600/30 hover:bg-rose-500/50 border border-rose-500/50 text-rose-100 text-xs font-sans-display font-semibold transition-all hover:scale-105 cursor-pointer shadow-md"
              >
                Close & Keep in Heart 💌
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
