"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Music2, VolumeX, SkipForward, ChevronUp, ChevronDown, Quote, Sparkles, Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRelationship } from "@/components/relationship/relationship-provider";

const DATE_QUOTES = [
  "In all the world, there is no heart for me like yours.",
  "Every moment with you is a favorite memory.",
  "If I know what love is, it is because of you.",
  "You make me want to be a better person.",
  "In your smile, I see something more beautiful than the stars.",
  "I love you not only for what you are, but for what I am when I am with you.",
  "My heart is and always will be yours.",
  "I want all of my best days to be spent with you.",
  "Meeting you was fate, becoming your friend was a choice, but falling in love with you was beyond my control.",
  "Grow old along with me! The best is yet to be.",
];

const TRACKS = [
  { title: "Kesariya", artist: "Arijit Singh", videoId: "BddP6PYo2gs" },
  { title: "Tum Hi Ho", artist: "Arijit Singh", videoId: "Umqb9KENgmk" },
  { title: "Raataan Lambiyan", artist: "Jubin Nautiyal", videoId: "gvyUuxdRdW4" },
  { title: "Zaalima", artist: "Arijit Singh", videoId: "huxhqpciEs4" },
  { title: "Channa Mereya", artist: "Arijit Singh", videoId: "z-diRlyLGzo" },
  { title: "Samjhawan", artist: "Arijit Singh", videoId: "H2fC6rTsyuo" },
];

export function MusicWidget() {
  const playerRef = useRef<any>(null);
  const { data } = useRelationship();

  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [quote, setQuote] = useState(DATE_QUOTES[0]);
  const [sparkle, setSparkle] = useState(false);
  const [timePassed, setTimePassed] = useState({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    let startDate = new Date("2024-10-23T00:00:00");
    if (data?.timeline?.length) {
      const dates = data.timeline
        .map((t) => (t.occurredOn ? new Date(t.occurredOn).getTime() : null))
        .filter((t): t is number => t !== null);
      if (dates.length) startDate = new Date(Math.min(...dates));
    }
    const tick = () => {
      const d = Date.now() - startDate.getTime();
      if (d <= 0) return;
      const totalDays = Math.floor(d / 86400000);
      setTimePassed({
        years: Math.floor(totalDays / 365),
        days: totalDays % 365,
        hours: Math.floor((d / 3600000) % 24),
        minutes: Math.floor((d / 60000) % 60),
        seconds: Math.floor((d / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);

  useEffect(() => {
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const init = () => {
      if (playerRef.current) return;
      playerRef.current = new (window as any).YT.Player("yt-romance-player", {
        height: "1", width: "1",
        videoId: TRACKS[trackIndex].videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, iv_load_policy: 3 },
        events: {
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1);
          },
        },
      });
    };
    (window as any).onYouTubeIframeAPIReady = init;
    if ((window as any).YT?.Player) init();
    return () => {
      try { playerRef.current?.destroy?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    try { isMuted ? playerRef.current?.mute?.() : playerRef.current?.unMute?.(); } catch {}
  }, [isMuted]);

  const togglePlay = () => {
    try {
      if (isPlaying) { playerRef.current?.pauseVideo?.(); setIsPlaying(false); }
      else { playerRef.current?.playVideo?.(); setIsPlaying(true); }
    } catch {}
  };

  const nextTrack = () => {
    const next = (trackIndex + 1) % TRACKS.length;
    setTrackIndex(next);
    try { playerRef.current?.loadVideoById?.(TRACKS[next].videoId); setIsPlaying(true); } catch {}
  };

  const rotateQuote = () => {
    const i = DATE_QUOTES.indexOf(quote);
    let n = Math.floor(Math.random() * DATE_QUOTES.length);
    if (n === i) n = (n + 1) % DATE_QUOTES.length;
    setQuote(DATE_QUOTES[n]);
    setSparkle(true);
    setTimeout(() => setSparkle(false), 700);
  };

  const track = TRACKS[trackIndex];

  return (
    <>
      <div id="yt-romance-player" className="absolute -top-[9999px] -left-[9999px] w-px h-px pointer-events-none opacity-0" />
      
      <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-3 select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={quote}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[240px] sm:max-w-[280px] rounded-2xl border border-[var(--me-line)] bg-[var(--me-panel)] backdrop-blur-md px-4 py-3 shadow-md"
          >
            <Quote className="absolute -top-2 left-3 w-4 h-4 text-[var(--me-rose)]/50 rotate-180" />
            <p className="text-[11px] leading-relaxed text-[var(--me-text)] font-serif-display italic pl-2 font-medium">
              "{quote}"
            </p>
            {sparkle && (
              <motion.span
                className="absolute top-1 right-2"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--me-gold)]" />
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="rounded-2xl border border-[var(--me-line)] bg-[var(--me-panel)] backdrop-blur-md shadow-lg overflow-hidden w-[220px] sm:w-[260px]">
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="px-4 pt-4 pb-2 border-b border-[var(--me-line)]"
              >
                <div className="flex items-end gap-0.5 h-5 mb-3">
                  {isPlaying ? (
                    <>
                      <div className="w-1 rounded-full bg-[var(--me-rose)]/80 animate-eq-bar-1" />
                      <div className="w-1 rounded-full bg-[var(--me-rose)]/80 animate-eq-bar-2" />
                      <div className="w-1 rounded-full bg-[var(--me-rose)]/80 animate-eq-bar-3" />
                      <div className="w-1 rounded-full bg-[var(--me-rose)]/80 animate-eq-bar-4" />
                      <div className="w-1 rounded-full bg-[var(--me-rose)]/50 animate-eq-bar-1" />
                    </>
                  ) : (
                    <div className="flex items-end gap-0.5 h-5">
                      {[3,6,4,7,5].map((h,i) => (
                        <div key={i} className="w-1 rounded-full bg-[var(--me-rose)]/20" style={{ height: `${h}px` }} />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[12px] font-semibold text-[var(--me-text)] font-sans-display truncate">{track.title}</p>
                <p className="text-[10px] text-[var(--me-muted)] font-sans-display mt-0.5 truncate">{track.artist}</p>

                <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                  {[
                    { v: timePassed.years, l: "Yrs" },
                    { v: timePassed.days, l: "Days" },
                    { v: timePassed.hours, l: "Hrs" },
                    { v: timePassed.minutes, l: "Min" },
                    { v: timePassed.seconds, l: "Sec" },
                  ].map(({ v, l }) => (
                    <div key={l} className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[11px] font-bold text-[var(--me-gold)] tabular-nums">{String(v).padStart(2, "0")}</span>
                      <span className="text-[7px] uppercase tracking-widest text-[var(--me-muted)] font-sans-display">{l}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 px-3 py-2.5">
            <Heart className="w-3.5 h-3.5 fill-[var(--me-rose)] text-[var(--me-rose)] flex-shrink-0" />
            <button
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--me-rose)]/10 hover:bg-[var(--me-rose)]/20 text-[var(--me-rose)] transition-colors flex-shrink-0"
            >
              {isPlaying ? <Music2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={nextTrack}
              title="Next track"
              className="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-[var(--me-muted)] hover:text-[var(--me-text)] transition-colors flex-shrink-0"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={rotateQuote}
              title="New quote"
              className="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 hover:bg-[var(--me-gold)]/10 text-[var(--me-gold)] transition-colors flex-shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Collapse" : "Expand"}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 text-[var(--me-muted)] hover:text-[var(--me-text)] transition-colors flex-shrink-0 ml-auto"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
