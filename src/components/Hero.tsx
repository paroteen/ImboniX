import React from "react";
import { ArrowRight, Play, Eye, Sparkles } from "lucide-react";

export default function Hero({ onTryDemo }: { onTryDemo: () => void }) {
  const scrollToHowItWorks = () => {
    const howElement = document.getElementById("how-it-works");
    if (howElement) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = howElement.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center bg-cyber-gradient scanlines pt-20"
    >
      {/* Background glow structures */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero content container */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20 py-16 sm:py-24">
        {/* Floating badge */}
        <div className="inline-flex items-center space-x-2 bg-cyber-dark-card/85 border border-neon-cyan/30 px-4 py-2 rounded-full mb-8 shadow-[0_0_15px_rgba(0,245,255,0.1)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-green shadow-[0_0_8px_#00FF88]"></span>
          </span>
          <span className="font-mono text-xs tracking-wider text-neon-cyan uppercase">
            Powered by ParoTeen Inc
          </span>
        </div>

        {/* Brand Main Title */}
        <h1 className="font-sans font-bold text-6xl sm:text-7xl md:text-8xl tracking-tight text-white mb-6 uppercase">
          IMBONI<span className="text-neon-cyan glow-text-cyan">X</span>
        </h1>

        {/* Subtitle */}
        <h2 className="font-sans font-semibold text-2xl sm:text-3xl md:text-4xl text-neon-purple glow-text-purple tracking-wide mb-6">
          AI-Powered Vision & Hearing for Everyone
        </h2>

        {/* One-liner Africa dedication */}
        <p className="font-sans text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed">
          Real-time object detection, prescription reading, face recognition, speech captioning —{" "}
          <span className="text-white font-medium border-b border-neon-magenta/40">
            built for Africa.
          </span>
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-10 py-5 font-mono text-base uppercase tracking-wider font-bold text-cyber-dark-1 bg-neon-cyan rounded-md border border-neon-cyan cta-pulse hover:scale-105 active:scale-95 transition-transform duration-300"
          >
            <span>Try ImboniX Live</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 font-mono text-sm uppercase tracking-wider font-bold text-white bg-transparent border border-neon-cyan/40 hover:border-neon-cyan hover:bg-neon-cyan/5 rounded-md hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(0,245,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(0,245,255,0.15)] transition-all duration-300"
          >
            <Play className="w-4 h-4 mr-1 text-neon-cyan" />
            <span>Watch How It Works</span>
          </button>
        </div>

        {/* Corner HUD framing brackets for cyberpunk aesthetic */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-cyan/30 pointer-events-none hidden sm:block" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-cyan/30 pointer-events-none hidden sm:block" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-cyan/30 pointer-events-none hidden sm:block" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-cyan/30 pointer-events-none hidden sm:block" />
      </div>
    </section>
  );
}
