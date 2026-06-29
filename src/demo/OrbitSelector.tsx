/**
 * Section 2 — Holographic Orbit module selector.
 * Desktop: central ImboniX orb with 3 cards orbiting (CSS rotation).
 * Mobile: vertical stack of glowing cards.
 */
import React, { useState } from "react";
import { Eye, Ear, Heart, ArrowRight } from "lucide-react";
import type { ModuleId } from "./types";
import { StepHeader } from "./ui";

interface ModuleDef {
  id: ModuleId;
  name: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
}

const MODULES: ModuleDef[] = [
  { id: "vision", name: "Vision Assist", desc: "See the world through ImboniX", color: "#00F5FF", icon: <Eye className="w-8 h-8" /> },
  { id: "hearing", name: "Hearing Assist", desc: "Live captions & sound alerts", color: "#8B00FF", icon: <Ear className="w-8 h-8" /> },
  { id: "eldercare", name: "ElderCare Assist", desc: "Quiet guardian in the background", color: "#F39C12", icon: <Heart className="w-8 h-8" /> },
];

export default function OrbitSelector({
  onSelect,
  onExit,
}: {
  onSelect: (m: ModuleId) => void;
  onExit: () => void;
}) {
  const [hover, setHover] = useState<ModuleId | null>(null);
  const [chosen, setChosen] = useState<ModuleId | null>(null);

  const pick = (m: ModuleId) => {
    setChosen(m);
    setTimeout(() => onSelect(m), 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <StepHeader title="Select an ImboniX Module" subtitle="Choose how ImboniX will assist you today." onExit={onExit} />

      {/* Desktop orbit */}
      <div className="hidden md:flex relative h-[460px] items-center justify-center">
        {/* Central orb */}
        <div className="absolute z-20 w-32 h-32 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/50 flex items-center justify-center orb-core">
          <Eye className="w-14 h-14 text-neon-cyan" />
        </div>

        {/* Orbit ring */}
        <div className={`orbit-ring relative w-[420px] h-[420px] rounded-full border border-dashed border-white/10 ${hover ? "paused" : ""}`}>
          {MODULES.map((m, i) => {
            const angle = (i / MODULES.length) * 2 * Math.PI;
            const radius = 210;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isChosen = chosen === m.id;
            return (
              <div
                key={m.id}
                className="absolute orbit-card-counter"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <button
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => pick(m.id)}
                  className={`w-44 rounded-2xl p-5 text-center transition-all duration-300 bg-cyber-dark-card ${isChosen ? "burst-in scale-110" : ""}`}
                  style={{
                    border: `1px solid ${m.color}`,
                    boxShadow: hover === m.id ? `0 0 35px ${m.color}aa` : `0 0 15px ${m.color}44`,
                    transform: hover === m.id ? "scale(1.15)" : "scale(1)",
                    opacity: chosen && !isChosen ? 0 : 1,
                  }}
                >
                  <div className="inline-flex p-3 rounded-xl bg-cyber-dark-1 mb-3" style={{ color: m.color }}>
                    {m.icon}
                  </div>
                  <h3 className="font-sans font-bold text-white text-sm mb-1">{m.name}</h3>
                  <p className="font-sans text-[11px] text-text-secondary leading-snug">{m.desc}</p>
                  {hover === m.id && (
                    <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-bold" style={{ color: m.color }}>
                      Select <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile stack */}
      <div className="md:hidden space-y-4">
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => pick(m.id)}
            className={`w-full flex items-center gap-4 rounded-2xl p-5 text-left bg-cyber-dark-card transition-all ${chosen === m.id ? "burst-in" : ""}`}
            style={{ border: `1px solid ${m.color}`, boxShadow: `0 0 15px ${m.color}44` }}
          >
            <div className="inline-flex p-3 rounded-xl bg-cyber-dark-1 shrink-0" style={{ color: m.color }}>
              {m.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-sans font-bold text-white text-base">{m.name}</h3>
              <p className="font-sans text-xs text-text-secondary">{m.desc}</p>
            </div>
            <ArrowRight className="w-5 h-5" style={{ color: m.color }} />
          </button>
        ))}
      </div>
    </div>
  );
}
