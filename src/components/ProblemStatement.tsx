import React from "react";
import { AlertCircle, EyeOff, VolumeX, Globe } from "lucide-react";

export default function ProblemStatement() {
  const cards = [
    {
      icon: (
        <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
          👁️‍🗨️
        </span>
      ),
      stat: "2.2 Billion",
      statColor: "text-[#00F5FF]",
      borderAccent: "border-[#00F5FF]",
      title: "Vision Impairment",
      description: "People suffer from vision impairment or blindness globally, limiting independence and learning.",
      borderStyle: "hover:border-[#00F5FF]/50 hover:shadow-[0_0_20px_rgba(0,245,255,0.15)]"
    },
    {
      icon: (
        <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(139,0,255,0.6)]">
          🔇
        </span>
      ),
      stat: "430 Million+",
      statColor: "text-[#8B00FF]",
      borderAccent: "border-[#8B00FF]",
      title: "Hearing Obstacles",
      description: "People globally struggle with disabling hearing loss, finding standard speech and conversation difficult.",
      borderStyle: "hover:border-[#8B00FF]/50 hover:shadow-[0_0_20px_rgba(139,0,255,0.15)]"
    },
    {
      icon: (
        <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,0,200,0.6)]">
          🌍
        </span>
      ),
      stat: "700 Million",
      statColor: "text-[#FF00C8]",
      borderAccent: "border-[#FF00C8]",
      title: "Inclusion Gap in Africa",
      description: "Millions of individuals live with physical or cognitive challenges across Africa, warranting real local action.",
      borderStyle: "hover:border-[#FF00C8]/50 hover:shadow-[0_0_20px_rgba(255,0,200,0.15)]"
    }
  ];

  return (
    <section className="relative py-24 bg-cyber-dark-1 border-t border-neon-cyan/10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,255,0.03),transparent)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-[#FF00C8] mb-4">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <span className="font-mono text-sm uppercase tracking-wider font-bold">// THE CHALLENGE OF SCALE</span>
          </div>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-white tracking-tight mb-4 uppercase">
            A World of Invisible Barriers
          </h2>
          <p className="font-sans text-lg text-text-secondary">
            Traditional mobility and assistive systems are expensive, rigid, and fail to provide local context.
            ImboniX unlocks the world through affordable, distributed vision and hearing intelligences.
          </p>
        </div>

        {/* Three glass cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-[rgba(0,245,255,0.15)] p-8 rounded-2xl transition-all duration-300 group hover:-translate-y-2 ${card.borderStyle}`}
            >
              <div className="mb-6 flex justify-between items-center">
                <div className="p-3 bg-cyber-dark-2 rounded-xl border border-neutral-800 group-hover:bg-neutral-900 transition-colors">
                  {card.icon}
                </div>
                <span className="font-mono text-xs text-[#FF00C8]">// GLOBAL_IMPACT_0{idx + 1}</span>
              </div>
              
              <div className={`border-l-2 ${card.borderAccent} pl-4 mb-4`}>
                <div className={`font-sans font-bold text-4xl sm:text-5xl tracking-tight ${card.statColor}`}>
                  {card.stat}
                </div>
                <p className="text-[10px] uppercase text-[#A0A8C0] tracking-wider mt-1">{card.title}</p>
              </div>
              
              <p className="font-sans text-sm text-text-secondary leading-relaxed bg-[#0A0A0F]/60 p-3 rounded-lg border border-white/[0.03]">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
