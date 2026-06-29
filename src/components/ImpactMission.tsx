import React from "react";
import { Quote, Heart, Award } from "lucide-react";

export default function ImpactMission() {
  const metrics = [
    {
      figure: "Rwanda, 2025",
      location: "Pilot Testing",
      details: "Currently in pilot testing",
      glowClass: "glow-border-cyan border-neon-cyan/35 text-neon-cyan"
    },
    {
      figure: "Early Access",
      location: "Applications Open",
      details: "Accepting select partner applications",
      glowClass: "glow-border-purple border-neon-purple/35 text-neon-purple"
    },
    {
      figure: "100 Users",
      location: "Target Phase",
      details: "Building toward our first 100 pilot users",
      glowClass: "glow-border-magenta border-neon-magenta/35 text-neon-magenta"
    }
  ];

  return (
    <section id="mission" className="relative py-28 bg-cyber-dark-2 scroll-mt-20 border-t border-neon-cyan/5">
      {/* Visual neon light blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Quote Icon */}
        <div className="inline-flex p-3 bg-cyber-dark-1 border border-neutral-850 rounded-full mb-8">
          <Quote className="w-8 h-8 text-neon-cyan filter drop-shadow-[0_0_8px_rgba(0,245,255,0.4)]" />
        </div>

        {/* Core Vision Paragraph */}
        <h2 className="font-sans font-medium text-2xl sm:text-3xl md:text-4xl text-white tracking-wide max-w-4xl mx-auto mb-16 leading-relaxed">
          "We believe every{" "}
          <span className="text-neon-cyan glow-text-cyan font-bold">blind</span>,{" "}
          <span className="text-neon-purple glow-text-purple font-bold">deaf</span>, and{" "}
          <span className="text-neon-magenta glow-text-magenta font-bold font-semibold">elderly</span> person in Africa deserves the same independence as anyone else."
        </h2>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((met, idx) => (
            <div
              key={idx}
              className={`p-8 bg-cyber-dark-1/90 rounded-xl border flex flex-col justify-center items-center text-center transition-all duration-300 hover:scale-103 cursor-default h-64 ${met.glowClass}`}
            >
              <div className="font-sans font-bold text-2xl sm:text-3xl mb-3 uppercase tracking-tight">
                {met.figure}
              </div>
              <h4 className="font-sans font-semibold text-xs text-white mb-2 uppercase tracking-widest text-[#00F5FF]">
                {met.location}
              </h4>
              <p className="font-sans text-xs text-text-secondary">
                {met.details}
              </p>
            </div>
          ))}
        </div>

        {/* Dedicated flag credit in foot */}
        <div className="mt-16 flex items-center justify-center space-x-2 text-xs font-mono text-neutral-500">
          <Heart className="w-4.5 h-4.5 text-neon-magenta animate-pulse" />
          <span>DEVELOPED SECURELY IN RWANDA AND KENYA</span>
        </div>

      </div>
    </section>
  );
}
