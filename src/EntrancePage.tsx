import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, ArrowRight } from "lucide-react";

interface EntrancePageProps {
  onEnter: () => void;
}

const VIDEO_URL =
  "https://ik.imagekit.io/t1q0n1ovm/SQ4.mp4?updatedAt=1791991278161";

export const EntrancePage: React.FC<EntrancePageProps> = ({ onEnter }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Initialize Web Audio API context safely for tactile sound feedback
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Tactical hover micro-click
  const playHoverSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // AudioContext policy fallback
    }
  }, [getAudioContext]);

  // Deep sub-bass pulse upon entering
  const playStartSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.46);
    } catch {
      // AudioContext policy fallback
    }
  }, [getAudioContext]);

  // Handle Enter trigger
  const handleStart = useCallback(() => {
    if (isExiting) return;
    playStartSound();
    setIsExiting(true);

    // Fade out video audio if playing
    if (videoRef.current && !videoRef.current.muted) {
      const vid = videoRef.current;
      const fadeInterval = setInterval(() => {
        if (vid.volume > 0.1) {
          vid.volume = Math.max(0, vid.volume - 0.2);
        } else {
          vid.volume = 0;
          clearInterval(fadeInterval);
        }
      }, 50);
    }

    setTimeout(() => {
      onEnter();
    }, 650);
  }, [isExiting, onEnter, playStartSound]);

  // Keyboard accessibility: Press Enter or Space to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStart]);

  // Toggle video sound
  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted) {
      videoRef.current.volume = 1;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <aside
      className={`fixed inset-0 z-[99999] select-none text-white overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none filter blur-sm"
          : "opacity-100 scale-100"
      }`}
      aria-label="Félicité Entrance"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. FULLSCREEN BACKGROUND VIDEO (NO BLACK OVERLAYS)
      ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-black">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            isVideoLoaded ? "opacity-100" : "opacity-0"
          } ${hovered ? "scale-105" : "scale-100"} ${
            isExiting ? "scale-110 brightness-110" : ""
          }`}
        />
      </div>

      {/* Shutter flash on exit */}
      <div
        className={`absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-300 ease-out ${
          isExiting ? "opacity-40" : "opacity-0"
        }`}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. TOP BAR (CLEAN, MINIMAL, RESPONSIVE)
      ───────────────────────────────────────────────────────────── */}
      <header className="relative z-20 w-full flex items-center justify-between shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
        {/* Brand Stamp */}
        <div className="flex items-center gap-2 tracking-[0.25em] text-[10px] sm:text-xs font-mono uppercase text-white font-semibold">
          <span className="w-1.5 h-1.5 bg-white inline-block"></span>
          <span>FÉLICITÉ</span>
          <span className="text-white/60 hidden xs:inline">// ARCHIVE '26</span>
        </div>

        {/* Audio Toggle Button */}
        <button
          onClick={toggleMute}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 border border-white/40 hover:border-white bg-black/20 hover:bg-white text-white hover:text-black backdrop-blur-md transition-all duration-200 text-[10px] sm:text-xs tracking-[0.2em] font-mono uppercase cursor-pointer"
          aria-label={isMuted ? "Unmute entrance video" : "Mute entrance video"}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          )}
          <span className="font-medium">
            {isMuted ? "SOUND OFF" : "SOUND ON"}
          </span>
        </button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          3. CENTER HERO DISPLAY & RESPONSIVE "START" BUTTON
      ───────────────────────────────────────────────────────────── */}
      <main className="relative z-20 w-full flex-1 flex flex-col items-center justify-center my-auto py-4 text-center px-2">
        <div className="flex flex-col items-center max-w-4xl mx-auto w-full">
          {/* Season / Collection Kicker */}
          <div className="text-[10px] sm:text-xs md:text-sm font-mono tracking-[0.3em] sm:tracking-[0.45em] text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase mb-2 sm:mb-3">
            [ AUTUMN / WINTER 2026 ]
          </div>

          {/* Fluid Responsive Brand Wordmark using high-fashion streetwear Condensed font */}
          <h1
            className="font-condensed text-[clamp(2.8rem,9.5vw,8.5rem)] font-black tracking-[0.12em] sm:tracking-[0.18em] uppercase text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.85)] leading-none my-1 sm:my-2 pl-[0.12em] sm:pl-[0.18em]"
            style={{ fontFamily: "'Barlow Condensed', 'Oswald', sans-serif" }}
          >
            FELICITÉ
          </h1>

          {/* Clean Sub-tagline */}
          <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.25em] sm:tracking-[0.35em] text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase font-mono mt-1 sm:mt-2 max-w-lg">
            CONTEMPORARY LUXURY WEAR
          </p>

          {/* The CENTER START BUTTON */}
          <div className="mt-6 sm:mt-9 md:mt-12 relative group">
            <button
              onClick={handleStart}
              onMouseEnter={() => {
                setHovered(true);
                playHoverSound();
              }}
              onMouseLeave={() => setHovered(false)}
              className="relative flex items-center justify-center gap-3 sm:gap-4 px-8 sm:px-14 md:px-18 py-3.5 sm:py-4.5 md:py-5 border-2 border-white bg-black/25 hover:bg-white text-white hover:text-black backdrop-blur-md transition-all duration-300 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.6)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Start and enter Félicité"
            >
              <span
                className="font-condensed font-black text-base sm:text-xl md:text-2xl tracking-[0.3em] sm:tracking-[0.4em] uppercase pl-[0.3em] sm:pl-[0.4em]"
                style={{ fontFamily: "'Barlow Condensed', 'Oswald', sans-serif" }}
              >
                START
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 -ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Interactive Keyboard / Click Hint */}
          <div className="mt-4 sm:mt-6 text-[9px] sm:text-[11px] font-mono tracking-[0.25em] text-white/70 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] uppercase">
            CLICK OR PRESS [ENTER]
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM BAR (CLEAN, MINIMAL, NON-COLLIDING)
      ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-20 w-full flex items-center justify-between shrink-0 text-[9px] sm:text-[11px] font-mono tracking-[0.2em] text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] uppercase">
        <div className="flex items-center gap-2">
          <span>PARIS</span>
          <span className="text-white/40">·</span>
          <span>DHAKA</span>
          <span className="text-white/40">·</span>
          <span>TOKYO</span>
        </div>

        <div className="text-white/60 tracking-[0.15em] text-right">
          © 2026 FÉLICITÉ
        </div>
      </footer>
    </aside>
  );
};
