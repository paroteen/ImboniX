import React, { useState, useEffect } from "react";
import { Eye, Menu, X, ShieldAlert } from "lucide-react";

export default function Header({ onTryDemo }: { onTryDemo?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const tryDemo = () => {
    setIsOpen(false);
    onTryDemo?.();
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of fixed header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cyber-dark-2/95 border-b border-neon-cyan/20 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            onClick={() => scrollToSection("hero")}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#00F5FF] to-[#8B00FF] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.45)] group-hover:scale-105 transition-transform duration-200">
              <span className="font-bold text-black text-lg italic tracking-tighter">IX</span>
            </div>
            <span className="font-sans font-bold text-2xl tracking-tighter text-[#00F5FF] transition-all" style={{ textShadow: "0 0 10px rgba(0,245,255,0.4)" }}>
              IMBONIX
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {["features", "how-it-works", "mission"].map((sec) => (
              <button
                key={sec}
                onClick={() => scrollToSection(sec)}
                className="font-sans text-xs tracking-widest font-medium text-text-secondary hover:text-[#00F5FF] uppercase transition-colors"
              >
                {sec.replace("-", " ")}
              </button>
            ))}

            <button
              onClick={tryDemo}
              className="px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-cyber-dark-1 bg-neon-cyan border border-neon-cyan rounded-md shadow-[0_0_15px_rgba(0,245,255,0.4)] hover:shadow-[0_0_25px_rgba(0,245,255,0.8)] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Try ImboniX Live
            </button>
          </nav>

          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-secondary hover:text-neon-cyan p-2 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-cyber-dark-2/95 border-b border-neon-cyan/20 backdrop-blur-md px-4 pt-2 pb-6 space-y-3 shadow-2xl">
          {["features", "how-it-works", "mission"].map((sec) => (
            <button
              key={sec}
              onClick={() => scrollToSection(sec)}
              className="block w-full text-left py-2 px-3 rounded-md text-base font-medium text-text-secondary hover:text-neon-cyan hover:bg-neutral-900 transition-colors"
            >
              {sec
                .replace("-", " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={tryDemo}
              className="block w-full text-center px-4 py-3 font-mono text-sm font-bold uppercase text-cyber-dark-1 bg-neon-cyan rounded-md shadow-[0_0_15px_rgba(0,245,255,0.4)]"
            >
              Try ImboniX Live
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
