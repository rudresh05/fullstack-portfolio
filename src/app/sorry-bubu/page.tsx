"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";

// Web Audio Synthesizer
class SoundEffects {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playTone(freq: number, type: OscillatorType = "sine", duration = 0.3, gainVal = 0.12) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio errors if blocked
    }
  }

  playPop() {
    this.playTone(523.25, "sine", 0.15, 0.15);
    setTimeout(() => this.playTone(659.25, "sine", 0.2, 0.12), 60);
  }

  playChime() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "triangle", 0.4, 0.1), idx * 80);
    });
  }

  playHarp() {
    const notes = [440, 554.37, 659.25, 830.61, 880, 1108.73];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, "sine", 0.5, 0.08), idx * 70);
    });
  }
}

const sounds = new SoundEffects();

type ThemeMode = "blossom" | "cozy" | "night";

interface GiftItem {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  content: string;
  detail: string;
}

const giftsData: GiftItem[] = [
  {
    id: 0,
    emoji: "🌷",
    title: "100 Virtual Roses for Bubu",
    subtitle: "Tap to bloom flowers across the screen",
    content: "Ek ek phool un saare moments ke liye jab tumne mera din special banaya hai.",
    detail: "Tum muskuraati ho na, toh sach me mera pura world bright ho jaata hai. 🌸",
  },
  {
    id: 1,
    emoji: "🧸",
    title: "Emergency Hug Counter",
    subtitle: "Tap to give Betu a tight hug",
    content: "Bas ab chup chap paas aao aur bohot tight wali hug lo. Aur jab tak tumhara gussa thanda na ho, chhodna mat.",
    detail: "Saari tension bhool jao, tumhara Betu hamesha tumhare saath hai. 🫂",
  },
  {
    id: 2,
    emoji: "💌",
    title: "Betu's Handwritten Note",
    subtitle: "Tap to open letter",
    content: "Suno Bubu... tum jitna chahe gussa kar lo. Main baar baar manata rahunga. Nakhre karo, ignore karo, par mujhe chhod ke mat jaana kabhi.",
    detail: "Kyuki Betu tumhare bina ek din bhi khush nahi reh sakta. ❤️",
  },
  {
    id: 3,
    emoji: "🎵",
    title: "Bubu's Pampering Tunes",
    subtitle: "Play soft ambient sounds",
    content: "Apna sabse favourite song play kar lo abhi. Thoda relax karo. Betu sab handle kar lega.",
    detail: "Aaj bas tumhara din hai — Bubu-pampering day! 🎶",
  },
  {
    id: 4,
    emoji: "🗝️",
    title: "The Key to Betu's Heart",
    subtitle: "Special message for you",
    content: "Yeh key sirf ek hi cheez kholti hai: mera pura dil, jo hamesha tumhara hi tha aur rahega.",
    detail: "Scroll down karke dekho maine tumhare gusse ko thanda karne ke liye kya kiya hai... 🥺",
  },
];

const promisesData = [
  {
    title: "Promise #1 🌸",
    text: "Betu pehle sune-ga, samjhega, aur kabhi bina baat argument nahi karega.",
    icon: "🎧",
  },
  {
    title: "Promise #2 🍫",
    text: "Jab bhi Bubu ka mood off hoga, Betu chocolates aur warm hugs lekar aayega.",
    icon: "🍫",
  },
  {
    title: "Promise #3 🫂",
    text: "Chahe jitni bhi ladai ho jaaye, Betu tumhara haath kabhi nahi chhodega.",
    icon: "💖",
  },
];

const stages = [
  { emoji: "😤", title: "Bubu is super angry!", desc: "Betu ki bohot badi mistake hai. Plz maaf kar do na 🥺" },
  { emoji: "😒", title: "Mood is still off...", desc: "Achha baba main sorry bol raha hu na dil se..." },
  { emoji: "🙄", title: "Eye-rolling detected!", desc: "Kaan pakad ke sorry bolu kya ab? Plz maan jao na!" },
  { emoji: "😑", title: "Anger is melting a little!", desc: "Ek choti si pyari si smile de do na please..." },
  { emoji: "🙂", title: "A tiny smile appeared!", desc: "Haan thodi si toh smile aayi honton pe! Main dekh sakta hu!" },
  { emoji: "🥺", title: "Almost melted completely!", desc: "Pighal jao na ab meri Bubu... Betu ko hug chahiye!" },
  { emoji: "❤️", title: "BUBU SMILED! 🎉", desc: "Aaja mera baccha! Ab gussa bilkul khatam! 🫂❤️" },
];

const runawayMessages = [
  "Nahi nahi, gussa nahi chalega! 😜",
  "Pakad sako toh pakdo Bubu! 💖",
  "Betu nahi jaane dega gusse me! 💕",
  "Aaja ek tight hug me! 🫂",
  "Gussa is temporarily disabled! 🥺",
  "I love you Bubu! 🌸",
];

export default function SorryBubuPage() {
  const [theme, setTheme] = useState<ThemeMode>("blossom");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hugCount, setHugCount] = useState(1);
  const [stage, setStage] = useState(0);
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [noBtnPos, setNoBtnPos] = useState<{ x: number; y: number } | null>(null);
  const [runawayMsg, setRunawayMsg] = useState("");
  const [forgiven, setForgiven] = useState(false);
  const [floaters, setFloaters] = useState<
    Array<{ id: number; char: string; left: string; fontSize: string; duration: string }>
  >([]);

  const floaterIdRef = useRef(0);

  const burst = (n = 10) => {
    if (soundEnabled) sounds.playPop();
    const chars = ["🌸", "❤️", "💗", "✨", "🌹", "🧸", "💖", "🌷"];
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const id = floaterIdRef.current++;
        const newFloater = {
          id,
          char: chars[Math.floor(Math.random() * chars.length)],
          left: Math.random() * 92 + "vw",
          fontSize: 16 + Math.random() * 26 + "px",
          duration: 3 + Math.random() * 3 + "s",
        };
        setFloaters((prev) => [...prev, newFloater]);
        setTimeout(() => {
          setFloaters((prev) => prev.filter((f) => f.id !== id));
        }, 6000);
      }, i * 40);
    }
  };

  const handleCardClick = (id: number) => {
    if (soundEnabled) sounds.playChime();
    setOpenCard(openCard === id ? null : id);
    if (id === 0) burst(12);
    if (id === 1) setHugCount((prev) => prev + 1);
  };

  const soothe = () => {
    const nextStage = Math.min(stage + 1, 6);
    setStage(nextStage);
    burst(nextStage > 4 ? 14 : 4);
    if (nextStage === 6 && soundEnabled) {
      sounds.playHarp();
    }
  };

  const escapeNo = () => {
    if (soundEnabled) sounds.playTone(600, "sawtooth", 0.1, 0.1);
    const rx = Math.random() * 50 + 15;
    const ry = Math.random() * 50 + 20;
    setNoBtnPos({ x: rx, y: ry });
    setRunawayMsg(runawayMessages[Math.floor(Math.random() * runawayMessages.length)]);
  };

  const finishForgiveness = () => {
    setForgiven(true);
    if (soundEnabled) sounds.playHarp();
    burst(35);
  };

  const themeStyles = {
    blossom: {
      bg: "bg-gradient-to-br from-rose-50 via-pink-100/70 to-orange-50 text-rose-950",
      card: "bg-white/80 border-rose-200/80 shadow-rose-200/40 text-rose-950 backdrop-blur-xl",
      accentBtn: "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-300/50",
      headerText: "text-rose-900 font-serif",
      subText: "text-rose-800/80",
    },
    cozy: {
      bg: "bg-gradient-to-br from-amber-50 via-orange-100/60 to-stone-100 text-amber-950",
      card: "bg-white/85 border-amber-200/80 shadow-amber-200/40 text-amber-950 backdrop-blur-xl",
      accentBtn: "bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-amber-300/50",
      headerText: "text-amber-950 font-serif",
      subText: "text-amber-800/80",
    },
    night: {
      bg: "bg-gradient-to-br from-[#0e0a14] via-[#1a0f24] to-[#08050e] text-pink-100",
      card: "bg-white/[0.08] border-white/15 shadow-black/60 text-pink-100 backdrop-blur-xl",
      accentBtn: "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-pink-500/30",
      headerText: "text-pink-100 font-serif",
      subText: "text-pink-200/70",
    },
  };

  const currentTheme = themeStyles[theme];

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${currentTheme.bg} font-sans relative overflow-x-hidden selection:bg-pink-300 selection:text-pink-900 px-3 sm:px-6`}
    >
      {/* Top Floating Mobile-First Control Bar */}
      <header className="sticky top-3 z-40 max-w-md mx-auto pt-1">
        <div
          className={`flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl sm:rounded-full border shadow-lg ${currentTheme.card}`}
        >
          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-full p-1 border border-black/5">
            <button
              onClick={() => {
                setTheme("blossom");
                if (soundEnabled) sounds.playPop();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition min-h-[36px] ${
                theme === "blossom" ? "bg-white shadow text-rose-600 font-bold" : "opacity-70"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Blossom</span>
            </button>
            <button
              onClick={() => {
                setTheme("cozy");
                if (soundEnabled) sounds.playPop();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition min-h-[36px] ${
                theme === "cozy" ? "bg-white shadow text-amber-600 font-bold" : "opacity-70"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Cozy</span>
            </button>
            <button
              onClick={() => {
                setTheme("night");
                if (soundEnabled) sounds.playPop();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition min-h-[36px] ${
                theme === "night" ? "bg-pink-500 text-white shadow font-bold" : "opacity-70"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Night</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) sounds.playPop();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border border-black/10 hover:bg-black/5 transition min-h-[36px]"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-pink-500" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
            <span>{soundEnabled ? "Audio" : "Muted"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Sanctuary (Mobile First Padding & Spacing) */}
      <main className="max-w-xl sm:max-w-2xl mx-auto py-6 sm:py-12 space-y-8 sm:space-y-14 pb-16">
        {/* HERO SECTION */}
        <section className="text-center pt-2 sm:pt-4 space-y-3 sm:space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase bg-pink-500/10 text-pink-600 border border-pink-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>sirf meri Bubu ke liye</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-4xl sm:text-6xl font-bold leading-tight font-serif ${currentTheme.headerText}`}
          >
            Bubu, I'm So Sorry... ❤️
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`text-sm sm:text-base max-w-md mx-auto font-medium leading-relaxed ${currentTheme.subText}`}
          >
            Bubu... sorry yaar. Mujhe pata hai maine galti ki hai. Aaj koi lame logic ya arguments nahi, bas tumhare Betu ki taraf se ek pyaara sa sanctuary space.
          </motion.p>
        </section>

        {/* 5 TREASURES MOBILE-FIRST GRID */}
        <section className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-1">
            <h2 className={`text-2xl sm:text-4xl font-bold font-serif ${currentTheme.headerText}`}>
              5 Treasures For Bubu 🌸
            </h2>
            <p className={`text-xs sm:text-sm ${currentTheme.subText}`}>Tap on any card to open your secret surprise</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {giftsData.map((g) => (
              <motion.div
                key={g.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCardClick(g.id)}
                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-md cursor-pointer transition-all duration-300 relative overflow-hidden active:bg-pink-500/5 ${currentTheme.card}`}
              >
                <div className="flex items-start gap-3.5">
                  <span className="text-3xl sm:text-4xl p-2.5 sm:p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex-shrink-0">
                    {g.emoji}
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold font-serif">{g.title}</h3>
                    <p className="text-[11px] sm:text-xs opacity-75">{g.subtitle}</p>
                    {g.id === 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[11px] font-bold shadow">
                        <span>Hugs Given: {hugCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {openCard === g.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-black/10 space-y-1.5 text-xs sm:text-sm leading-relaxed"
                    >
                      <p className="font-semibold">{g.content}</p>
                      <p className="text-[11px] italic opacity-80">{g.detail}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* BETU'S HANDWRITTEN LETTER */}
        <section className="space-y-4">
          <div className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-amber-50/95 text-amber-950 border border-amber-200 shadow-lg relative transform -rotate-1 hover:rotate-0 transition duration-300">
            <div className="font-serif text-2xl sm:text-4xl font-bold mb-2 text-rose-900">
              Bubu, idhar dekho… 💌
            </div>
            <p className="font-serif text-lg sm:text-2xl leading-relaxed mb-2.5">
              I'm really, really sorry, meri Bubu. ❤️
            </p>
            <p className="font-serif text-base sm:text-xl leading-relaxed mb-2.5">
              Aaj koi explanation nahi. Bas tumhara gussa mujhe de do, aur ek sweet hug apne Betu ko de do.
            </p>
            <p className="font-serif text-base sm:text-xl leading-relaxed mb-3">
              Tum jitna gussa karna hai karo. Main manaata rahunga. Nakhre allowed, ignore karna temporarily allowed. But leaving your Betu without a hug? <em className="text-rose-700 font-bold">Not allowed at all!</em> 🥺
            </p>
            <div className="text-right font-serif text-xl sm:text-2xl font-bold text-rose-800">— your Betu ❤️</div>
          </div>
        </section>

        {/* PROMISES MOBILE-FIRST SECTION */}
        <section className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-1">
            <h2 className={`text-2xl sm:text-4xl font-bold font-serif ${currentTheme.headerText}`}>
              Betu's Promises To Bubu 💖
            </h2>
            <p className={`text-xs sm:text-sm ${currentTheme.subText}`}>Written in stone, forever and ever</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {promisesData.map((p, idx) => (
              <div key={idx} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-md space-y-1.5 text-center ${currentTheme.card}`}>
                <div className="text-2xl sm:text-3xl mb-1">{p.icon}</div>
                <h4 className="font-serif font-bold text-base sm:text-lg">{p.title}</h4>
                <p className="text-xs leading-relaxed opacity-90">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* "MANAAO BETU" ANGER METER GAME */}
        <section className={`p-6 sm:p-10 rounded-2xl sm:rounded-3xl border shadow-xl text-center space-y-5 ${currentTheme.card}`}>
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-pink-500">
              gussa kam karne ki choti si koshish 🥺
            </span>
            <h2 className={`text-2xl sm:text-4xl font-bold font-serif ${currentTheme.headerText}`}>
              Manaao Bubu Station
            </h2>
          </div>

          <motion.div
            key={stage}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-6xl sm:text-8xl py-1 sm:py-2"
          >
            {stages[stage].emoji}
          </motion.div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold font-serif">{stages[stage].title}</h3>
            <p className={`text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto ${currentTheme.subText}`}>{stages[stage].desc}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto bg-black/10 dark:bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-black/5">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
              animate={{ width: `${(stage / 6) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <button
            onClick={soothe}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm shadow-lg transition active:scale-95 min-h-[48px] ${currentTheme.accentBtn}`}
          >
            Manaao Betu ko 🥺
          </button>
        </section>

        {/* FINAL FORGIVENESS & CERTIFICATE SECTION */}
        <section className={`p-6 sm:p-12 rounded-2xl sm:rounded-3xl border shadow-2xl text-center space-y-5 ${currentTheme.card}`}>
          <div className="text-6xl sm:text-7xl text-rose-500 animate-pulse">❤️</div>
          <h2 className={`text-3xl sm:text-6xl font-bold font-serif ${currentTheme.headerText}`}>
            Bubu, idhar aao.
          </h2>
          <p className={`text-xs sm:text-base max-w-md mx-auto leading-relaxed ${currentTheme.subText}`}>
            Koi ladai nahi. Koi arguments nahi. <br />
            Bas ek bohot lambi wali tight hug apne Betu se.
          </p>

          {!forgiven ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={finishForgiveness}
                className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm sm:text-base shadow-xl transition active:scale-95 min-h-[48px] ${currentTheme.accentBtn}`}
              >
                Maaf Kiya Iss Idiot Ko ❤️
              </button>

              <button
                style={
                  noBtnPos
                    ? {
                        position: "fixed",
                        left: `${noBtnPos.x}vw`,
                        top: `${noBtnPos.y}vh`,
                        zIndex: 60,
                      }
                    : {}
                }
                onMouseEnter={escapeNo}
                onTouchStart={escapeNo}
                onClick={escapeNo}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm border border-black/10 hover:bg-black/5 transition min-h-[48px]"
              >
                Abhi bhi gussa hu 😤
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 sm:p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2.5 shadow-inner"
            >
              <div className="text-3xl sm:text-4xl">👑</div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold">Official Certificate of Forgiveness</h3>
              <p className="text-xs sm:text-sm leading-relaxed">
                Hug accepted! Gussa officially 100% khatam. Ab se Betu tumko bas bohot saara pyaar karega, pamper karega, aur kabhi udaas nahi hone dega.
              </p>
              <div className="text-xs font-bold text-rose-600 pt-1">— Signed with love by Betu 🫂❤️</div>
            </motion.div>
          )}

          {runawayMsg && <div className="text-xs text-rose-500 font-bold animate-bounce">{runawayMsg}</div>}
        </section>
      </main>

      {/* FLOATING PARTICLES */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="float-particle"
            style={{
              left: f.left,
              fontSize: f.fontSize,
              animationDuration: f.duration,
            }}
          >
            {f.char}
          </span>
        ))}
      </div>
    </div>
  );
}
