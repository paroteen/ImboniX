import React from "react";
import { Camera, Brain, Volume2, Users, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Camera className="w-6 h-6 text-neon-cyan" />,
      title: "Field Capture",
      desc: "Ultra-compact frame cameras capture ambient environments, documents, faces, or street pathways continuously."
    },
    {
      num: "02",
      icon: <Brain className="w-6 h-6 text-neon-purple animate-pulse" />,
      title: "ImboniX Analysis",
      desc: "Raw snapshots stream instantly to the ImboniX engine, running deep spatial and text comprehension."
    },
    {
      num: "03",
      icon: <Volume2 className="w-6 h-6 text-neon-green" />,
      title: "Active Audio HUD",
      desc: "Lenses translate description strings into clear bone conduction audio instructions or direction vectors."
    },
    {
      num: "04",
      icon: <Users className="w-6 h-6 text-neon-magenta" />,
      title: "Caregiver Sync",
      desc: "Live captions translate on lens screens, and automatic fall alerts send maps coordinates to family."
    }
  ];

  return (
    <section id="how-it-works" className="relative py-24 bg-cyber-dark-1 border-t border-neon-cyan/10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,255,0.02),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-white tracking-tight mb-4">
            From Glasses to Understanding
          </h2>
          <p className="font-sans text-lg text-text-secondary">
            Four simple phases tracking transmission pipelines from glass optics into absolute user independence.
          </p>
        </div>

        {/* 4-Step horizontal flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          
          {/* Connecting arrow/line backdrop on desktop */}
          <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-neon-cyan/30 via-neon-purple/30 to-neon-magenta/30 border-dashed border-t border-neutral-800 z-0 pointer-events-none" />

          {steps.map((st, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              
              {/* Outer circle layout */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full bg-cyber-dark-card border border-neutral-850 hover:border-neon-cyan flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-cyber-dark-2">
                  {st.icon}
                </div>
                
                {/* Floating neon badge number */}
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyber-dark-1 border border-neon-cyan/50 text-[10px] font-mono text-neon-cyan font-bold shadow-[0_0_8px_rgba(0,245,255,0.4)]">
                  {st.num}
                </span>
              </div>

              {/* Title & info description */}
              <h3 className="font-sans font-bold text-lg text-white mb-2 uppercase tracking-wide">
                {st.title}
              </h3>
              
              <p className="font-sans text-sm text-text-secondary leading-relaxed max-w-xs">
                {st.desc}
              </p>

              {/* Mobile transition spacer indicator */}
              {idx < 3 && (
                <div className="md:hidden mt-6 text-neon-cyan select-none animate-bounce">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
