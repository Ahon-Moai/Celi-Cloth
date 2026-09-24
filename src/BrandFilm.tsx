import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Film,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BrandFilmProps {
  onShopClick?: () => void;
}

// 720p optimized video sources for high visual fidelity and smooth instant playback
const VIDEO_SRC_WEBM =
  "https://ik.imagekit.io/g03uyzcgy/tr:w-1280,q-60,f-webm/SQ4.mp4";
const VIDEO_SRC_MP4 =
  "https://ik.imagekit.io/g03uyzcgy/tr:w-1280,q-60/SQ4.mp4";

const POSTER_URL =
  "https://ik.imagekit.io/g03uyzcgy/tr:w-1280,q-80/SQ4.mp4/ik-thumbnail.jpg";

export const BrandFilm: React.FC<BrandFilmProps> = ({ onShopClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(28.58);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setIsHoveringPlayer] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lazy attachment: Only attach preload metadata when scrolled near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
          } else {
            // Auto-pause when user scrolls away
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { rootMargin: "300px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls during uninterrupted playback
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2600);
    }
  };

  // Video playback controls
  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      try {
        setHasStartedPlaying(true);
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Video play interrupted:", err);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // STOP Action: Pauses, rewinds to start, resets UI
  const handleStop = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setHasStartedPlaying(false);
  };

  // Mute / Volume toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = volume || 0.85;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  // Timeline Scrubbing
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
    }
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    if (video.buffered.length > 0 && duration > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBufferedPercent(Math.min(100, (bufferedEnd / duration) * 100));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 28.58);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasStartedPlaying(false);
  };

  // Format seconds to mm:ss
  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <section className="bg-black text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative overflow-hidden">
      {/* Subtle background ambient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.25em] text-zinc-400 uppercase">
                <Film className="w-3 h-3 text-white" />
                CAMPAIGN 2026
              </span>
              <span className="text-zinc-600">/</span>
              <span className="text-[10px] tracking-[0.25em] text-zinc-400 uppercase font-mono">
                SPRING COLLECTION
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white font-sans">
              SPRING &apos;26 VISUAL MANIFESTO
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-2 tracking-wide font-light">
              Contemporary silhouettes, brutalist tailoring, and architectural drape. 
              Witness the collection in fluid motion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onShopClick && (
              <button
                onClick={onShopClick}
                className="group flex items-center gap-2 px-5 py-2.5 border border-white/20 hover:border-white text-[11px] font-bold tracking-[0.2em] uppercase transition-all bg-white/5 hover:bg-white hover:text-black"
              >
                EXPLORE LOOKS
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>

        {/* Video Player Main Frame */}
        <div
          ref={containerRef}
          onMouseEnter={() => setIsHoveringPlayer(true)}
          onMouseLeave={() => {
            setIsHoveringPlayer(false);
            if (isPlaying) setControlsVisible(false);
          }}
          onMouseMove={handleMouseMove}
          className="relative w-full aspect-video bg-zinc-950 border border-white/15 overflow-hidden shadow-2xl group select-none"
        >
          {/* Subtle Brand Watermarks */}
          <div className="absolute top-3 left-3 pointer-events-none z-20 text-[10px] font-mono tracking-widest text-white/50 uppercase">
            FELICITÉ
          </div>

          {/* HTML5 Video Element with 720p sources */}
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            poster={POSTER_URL}
            preload={isNearViewport ? "metadata" : "none"}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onClick={togglePlayPause}
            className="w-full h-full object-cover cursor-pointer"
          >
            <source src={VIDEO_SRC_WEBM} type="video/webm" />
            <source src={VIDEO_SRC_MP4} type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>

          {/* Loading Spinner */}
          <AnimatePresence>
            {isBuffering && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-25 pointer-events-none"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-[10px] font-mono tracking-widest text-white/70">
                    LOADING...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big Hero Center Play Button (Shown when paused or idle) */}
          <AnimatePresence>
            {!isPlaying && !isBuffering && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/30 backdrop-blur-[2px] cursor-pointer"
                onClick={togglePlayPause}
              >
                {/* Visual tactile play trigger */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center justify-center"
                >
                  {/* Outer pulsing ring */}
                  <div className="absolute -inset-4 rounded-full border border-white/25 animate-ping opacity-25 pointer-events-none" />
                  <div className="absolute -inset-2 rounded-full border border-white/40 pointer-events-none" />

                  {/* Primary Play Button Disc */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all duration-300 hover:bg-black hover:text-white hover:border hover:border-white">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                  </div>
                </motion.div>

                {/* Tag below center button */}
                <div className="mt-5 flex items-center gap-2 px-3.5 py-1.5 bg-black/80 border border-white/20 text-[10px] font-mono tracking-[0.25em] uppercase text-zinc-300">
                  <Film className="w-3 h-3 text-white" />
                  <span>{hasStartedPlaying ? "RESUME FILM" : "PLAY CAMPAIGN FILM"}</span>
                  <span className="text-zinc-500">·</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent / Hover Floating Control Bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-4 px-4 sm:px-6 ${
              controlsVisible || !isPlaying
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3 pointer-events-none"
            }`}
          >
            {/* Timeline Progress Seeker */}
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="relative w-full h-2 sm:h-2.5 bg-white/20 hover:h-3.5 transition-all cursor-pointer mb-3 rounded-none overflow-hidden group/bar"
            >
              {/* Buffered progress track */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-white/30 transition-all duration-200"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Played progress track */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-white"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
              {/* Hover scrubber head */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{
                  left: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Bottom Control Row */}
            <div className="flex items-center justify-between gap-3 text-white">
              {/* Left group: Play/Pause, Cool Stop Button, and Timestamp */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? "Pause Video" : "Play Video"}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/10 hover:bg-white hover:text-black border border-white/20 transition-colors rounded-none"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Cool Stop Button (Pauses + Resets to 0) */}
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop Video and Reset"
                  className="group relative px-2.5 sm:px-3 h-9 sm:h-10 flex items-center gap-1.5 bg-white/5 hover:bg-red-600/90 text-zinc-300 hover:text-white border border-white/20 hover:border-red-500 transition-all"
                  title="Stop and Reset to Beginning"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[10px] font-mono tracking-widest font-bold uppercase hidden sm:inline">
                    STOP
                  </span>
                </button>

                {/* Restart quick button if ended or playing */}
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      if (!isPlaying) togglePlayPause();
                    }
                  }}
                  aria-label="Replay from start"
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 hover:bg-white/20 border border-white/20 text-zinc-300 hover:text-white transition-colors"
                  title="Replay from 00:00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Digital Time Code Display */}
                <div className="text-[11px] sm:text-xs font-mono tracking-wider text-zinc-300 ml-1 sm:ml-2">
                  <span className="text-white font-bold">{formatTime(currentTime)}</span>
                  <span className="text-zinc-500 mx-1">/</span>
                  <span className="text-zinc-400">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right group: Audio, Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Volume / Mute Controls */}
                <div className="flex items-center gap-2 group/vol">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 hover:bg-white/20 border border-white/20 transition-colors text-zinc-200"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  {/* Volume Slider */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume slider"
                    className="w-14 sm:w-20 h-1 bg-white/30 accent-white cursor-pointer hidden sm:block opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* Fullscreen Trigger */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 hover:bg-white/20 border border-white/20 transition-colors text-zinc-200"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Editorial Footer under the player */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Film className="w-3 h-3 text-zinc-400" />
            <span>FELICITÉ CAMPAIGN ARCHIVE</span>
          </div>
          <div className="text-zinc-500">
            ALL RIGHTS RESERVED © 2026
          </div>
        </div>
      </div>
    </section>
  );
};
