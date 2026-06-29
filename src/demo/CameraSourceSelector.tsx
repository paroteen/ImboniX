/**
 * Section 0 — Camera source selector.
 * Two cards: "Use This Device" (local) vs "Pair Your Phone" (WebRTC MVP).
 */
import React from "react";
import { Laptop, Smartphone, Wifi, ArrowRight } from "lucide-react";
import { StepHeader } from "./ui";

export default function CameraSourceSelector({
  onLocal,
  onPair,
  onExit,
}: {
  onLocal: () => void;
  onPair: () => void;
  onExit: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto w-full">
      <StepHeader
        title="Choose Your ImboniX Camera"
        subtitle="Select how ImboniX will see the world around you."
        onExit={onExit}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1 — local */}
        <button
          onClick={onLocal}
          className="text-left bg-cyber-dark-card border border-neon-cyan/30 hover:border-neon-cyan rounded-2xl p-8 transition-all hover:-translate-y-1 group"
        >
          <div className="inline-flex p-4 rounded-xl bg-cyber-dark-1 border border-neutral-800 mb-5">
            <Laptop className="w-8 h-8 text-neon-cyan" />
          </div>
          <h3 className="font-sans font-bold text-xl text-white mb-2">Use This Device</h3>
          <p className="font-sans text-sm text-text-secondary mb-6">Use the camera on this device.</p>
          <span className="inline-flex items-center gap-2 font-mono text-sm font-bold text-neon-cyan group-hover:gap-3 transition-all">
            Continue <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        {/* Card 2 — phone pairing */}
        <button
          onClick={onPair}
          className="relative text-left bg-cyber-dark-card border border-neon-purple/40 hover:border-neon-purple rounded-2xl p-8 transition-all hover:-translate-y-1 group shadow-[0_0_25px_rgba(139,0,255,0.12)]"
        >
          <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/50 text-[9px] font-mono font-bold text-neon-purple uppercase tracking-wider">
            Recommended for MVP testing
          </span>
          <div className="inline-flex p-4 rounded-xl bg-cyber-dark-1 border border-neutral-800 mb-5 relative">
            <Smartphone className="w-8 h-8 text-neon-purple" />
            <Wifi className="w-4 h-4 text-neon-purple absolute -top-1 -right-1" />
          </div>
          <h3 className="font-sans font-bold text-xl text-white mb-2">Pair Your Phone</h3>
          <p className="font-sans text-sm text-text-secondary mb-6">
            Use your phone as the ImboniX camera — best for testing the glasses experience.
          </p>
          <span className="inline-flex items-center gap-2 font-mono text-sm font-bold text-neon-purple group-hover:gap-3 transition-all">
            Generate Pairing Code <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
