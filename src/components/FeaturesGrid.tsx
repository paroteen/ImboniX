import React from "react";
import { Eye, Volume2, Pill, UserCheck, MapPin, ShieldAlert, Sparkles } from "lucide-react";

export default function FeaturesGrid() {
  const features = [
    {
      icon: <Eye className="w-6 h-6 text-neon-cyan filter drop-shadow-[0_0_8px_rgba(0,245,255,0.4)]" />,
      title: "Vision Assist",
      desc: "Detects objects, steps, dynamic obstacles, and surroundings in real time, delivering a detailed audio narrative.",
      glowStyle: "hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,245,255,0.2)]"
    },
    {
      icon: <Volume2 className="w-6 h-6 text-neon-purple filter drop-shadow-[0_0_8px_rgba(139,0,255,0.4)]" />,
      title: "Hearing Assist",
      desc: "Instant voice-to-text transcripts projected as real-time captions directly on state-of-the-art smart lenses.",
      glowStyle: "hover:border-neon-purple/40 hover:shadow-[0_0_20px_rgba(139,0,255,0.2)]"
    },
    {
      icon: <Pill className="w-6 h-6 text-neon-magenta filter drop-shadow-[0_0_8px_rgba(255,0,200,0.4)]" />,
      title: "Prescription Reader",
      desc: "Identifies medicine labels, analyzes complex text, and speaks crucial dosage guidelines to prevent misuse.",
      glowStyle: "hover:border-neon-magenta/40 hover:shadow-[0_0_20px_rgba(255,0,200,0.2)]"
    },
    {
      icon: <UserCheck className="w-6 h-6 text-neon-green filter drop-shadow-[0_0_8px_rgba(0,255,136,0.4)]" />,
      title: "Face Recognition",
      desc: "Saves reference faces and detects familiar friends or family members on approach with instant voice alerts.",
      glowStyle: "hover:border-neon-green/40 hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]"
    },
    {
      icon: <MapPin className="w-6 h-6 text-neon-cyan filter drop-shadow-[0_0_8px_rgba(0,245,255,0.4)]" />,
      title: "Smart Navigation",
      desc: "Provides audio directions for intricate indoor pathways and safe turn-by-turn outdoor steps across African roads.",
      glowStyle: "hover:border-neon-cyan/40 hover:shadow-[0_0_20px_rgba(0,245,255,0.2)]"
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-neon-magenta filter drop-shadow-[0_0_8px_rgba(255,0,200,0.4)]" />,
      title: "Emergency SOS",
      desc: "Utilizes internal IMU sensors to auto-detect sudden falls, triggering instant distress messages and maps coordinate alerts to caregivers.",
      glowStyle: "hover:border-neon-magenta/40 hover:shadow-[0_0_20px_rgba(255,0,200,0.2)]"
    }
  ];

  return (
    <section id="features" className="relative py-24 bg-cyber-dark-2 border-t border-neon-cyan/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(139,0,255,0.02),transparent)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center space-x-2 text-neon-cyan mb-4">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
            <span className="font-mono text-sm uppercase tracking-wider font-bold">Cutting-Edge Features</span>
          </div>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-white tracking-tight mb-4">
            Everything Your Senses Need
          </h2>
          <p className="font-sans text-lg text-text-secondary">
            Six comprehensive assistive core engines packed inside a featherweight, low-power optical frame designed for continuous everyday wear.
          </p>
        </div>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`glass-card p-8 rounded-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between ${feat.glowStyle}`}
            >
              <div>
                <div className="mb-6 inline-flex p-3 bg-cyber-dark-1 border border-neutral-800 rounded-lg group-hover:bg-neutral-950 transition-colors">
                  {feat.icon}
                </div>
                
                <h3 className="font-sans font-bold text-lg text-white mb-3 uppercase tracking-wide">
                  {feat.title}
                </h3>
                
                <p className="font-sans text-sm text-text-secondary leading-relaxed">
                  {feat.desc}
                </p>
              </div>
              
              <div className="mt-8 flex items-center justify-between text-xs font-mono text-neon-cyan/80 group-hover:text-neon-cyan transition-colors">
                <span>IMBONIX SERVICE</span>
                <span className="tracking-widest">SF-{idx + 10}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
