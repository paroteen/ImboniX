import React, { useState } from "react";
import { Eye, Mail, Github, Twitter, Linkedin, Heart, HelpCircle, Send } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() !== "") {
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 3000);
    }
  };

  const scrollToHero = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-cyber-dark-1 text-text-secondary border-t border-neon-cyan/15 pt-20 pb-12 overflow-hidden">
      
      {/* Outer subtle glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Logo brand grid - 4 cols */}
          <div className="md:col-span-4 text-left space-y-4">
            <div
              onClick={scrollToHero}
              className="flex items-center space-x-2 cursor-pointer group inline-flex"
            >
              <div className="p-2 bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 rounded-lg border border-neon-cyan/30">
                <Eye className="w-5 h-5 text-neon-cyan" />
              </div>
              <span className="font-sans font-bold text-lg tracking-wider text-white">
                IMBONI<span className="text-neon-cyan glow-text-cyan">X</span>
              </span>
            </div>
            
            <p className="font-sans text-sm text-text-secondary leading-relaxed max-w-sm">
              See More. Hear More. Live More. ImboniX delivers contextual vision and speech engines to foster full continental independence.
            </p>

            {/* Social linkages */}
            <div className="flex space-x-4 pt-2">
              {[
                { icon: <Twitter className="w-4 h-4" />, href: "#" },
                { icon: <Linkedin className="w-4 h-4" />, href: "#" },
                { icon: <Github className="w-4 h-4" />, href: "#" }
              ].map((soc, idx) => (
                <a
                  key={idx}
                  href={soc.href}
                  className="p-2.5 bg-cyber-dark-2 hover:bg-neon-cyan/10 border border-neutral-850 hover:border-neon-cyan/50 rounded-lg text-text-secondary hover:text-white transition-all hover:scale-105"
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links grid - 4 cols */}
          <div className="md:col-span-4 text-left grid grid-cols-2 gap-8">
            <div>
              <h5 className="font-sans font-bold text-xs uppercase tracking-widest text-white mb-4">
                Resources
              </h5>
              <ul className="space-y-2.5 font-sans text-sm">
                <li>
                  <a href="#features" className="hover:text-neon-cyan transition-colors">Features Grid</a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-neon-cyan transition-colors">How It Works</a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-neon-cyan transition-colors">How It Works</a>
                </li>
                <li>
                  <a href="#mission" className="hover:text-neon-cyan transition-colors">Impact Mission</a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-sans font-bold text-xs uppercase tracking-widest text-white mb-4">
                Inquiries
              </h5>
              <ul className="space-y-2.5 font-sans text-sm font-medium">
                <li>
                  <a href="#contact" onClick={(e) => { e.preventDefault(); alert("Inquiry Registered: info@imbonix.com"); }} className="hover:text-neon-cyan transition-colors">Contact Center</a>
                </li>
                <li>
                  <a href="#investors" onClick={(e) => { e.preventDefault(); alert("Investor Pitch folder opened at: investors@imbonix.com"); }} className="hover:text-neon-cyan transition-colors">Investors Portal</a>
                </li>
                <li>
                  <a href="#careers" onClick={(e) => { e.preventDefault(); alert("Join the Lens design team: recruit@imbonix.com"); }} className="hover:text-neon-cyan transition-colors">Careers</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter section - 4 cols */}
          <div className="md:col-span-4 text-left space-y-4">
            <h5 className="font-sans font-bold text-xs uppercase tracking-widest text-white">
              Sponsor Newsletter
            </h5>
            <p className="font-sans text-sm text-text-secondary leading-relaxed">
              Sign up to receive periodic pilot deployment reports and technical glass milestones.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email path..."
                  className="w-full px-4 py-2.5 pl-10 bg-cyber-dark-2 border border-neutral-850 focus:border-neon-cyan rounded-md font-sans text-sm text-white placeholder-neutral-650 outline-none transition-colors"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-605" />
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 p-1.5 bg-neon-cyan text-cyber-dark-1 hover:bg-white rounded-md transition-colors shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              {subscribed && (
                <p className="font-mono text-[10px] text-neon-green animate-pulse">
                  ✓ Connection established. Welcomed to ImboniX!
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Divider subtle line */}
        <div className="border-t border-neutral-900/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500 text-center sm:text-left">
          <div className="leading-relaxed">
            ImboniX · Built in Kigali, Rwanda · Powered by ParoTeen Inc<br />
            Emergency SMS by AfricasTalking<br />
            &copy; 2025 ParoTeen Inc. All rights reserved.
          </div>

          <div className="flex items-center space-x-1.5 text-neutral-400">
            <span>Built for Africa. Built for Everyone.</span>
            <Heart className="w-3.5 h-3.5 text-neon-magenta" />
          </div>
        </div>

      </div>
    </footer>
  );
}
