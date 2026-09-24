import React from "react";
import { motion } from "motion/react";

export const BrandTransitionBanner: React.FC = () => {
  return (
    <section
      aria-label="Felicite Brand Statement"
      className="bg-white text-black py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t border-b border-neutral-100 relative overflow-x-clip flex flex-col items-center justify-center select-none"
    >
      {/* Subtle ambient luxury grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center text-center relative z-10 px-2 sm:px-4">
        {/* Editorial Eyebrow */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <span className="h-[1px] w-6 sm:w-12 bg-neutral-200" />
          <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] sm:tracking-[0.45em] text-neutral-400 uppercase font-semibold">
            SPRING ARCHIVE 2026
          </p>
          <span className="h-[1px] w-6 sm:w-12 bg-neutral-200" />
        </div>

        {/* Goated Headline Wordmark - safe sizing with breathing room so left and right glyphs never clip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex items-center justify-center px-2 sm:px-6"
        >
          <h2
            style={{ fontFamily: "'Syne', sans-serif" }}
            className="font-goated text-[clamp(2.5rem,8.2vw,7.2rem)] lg:text-[7.8rem] xl:text-[8.5rem] font-black uppercase tracking-[0.03em] sm:tracking-[0.05em] text-black leading-none text-center cursor-default drop-shadow-sm transition-all duration-500 ease-out hover:opacity-85 max-w-full"
          >
            FELICITE
          </h2>
        </motion.div>

        {/* Editorial Sub-bar */}
        <div className="mt-5 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-neutral-400">
          <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] text-neutral-500 uppercase font-medium">
            CONTEMPORARY WEAR
          </span>
          <span className="hidden sm:inline-block text-neutral-300 font-mono">/</span>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] text-neutral-500 uppercase font-medium">
            PARIS · DHAKA
          </span>
          <span className="hidden sm:inline-block text-neutral-300 font-mono">/</span>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] text-neutral-400 uppercase font-medium">
            HAUTE READY-TO-WEAR
          </span>
        </div>
      </div>
    </section>
  );
};
