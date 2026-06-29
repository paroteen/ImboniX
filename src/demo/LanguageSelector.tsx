/**
 * Section 0 — Language selector.
 * The first thing the wearer chooses. The selected language is the language
 * ImboniX will speak, listen, and hold conversations in across every module.
 */
import React from "react";
import { Languages, Check, ArrowRight } from "lucide-react";
import { StepHeader } from "./ui";
import { useImbonix } from "./store";
import { LANGUAGE_OPTIONS, type Language } from "./types";

export default function LanguageSelector({
  onContinue,
  onExit,
}: {
  onContinue: () => void;
  onExit: () => void;
}) {
  const { config, update } = useImbonix();
  const [selected, setSelected] = React.useState<Language>(config.language);

  const choose = (lang: Language) => {
    setSelected(lang);
    update({ language: lang });
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <StepHeader
        title="Choose Your Language"
        subtitle="ImboniX will speak, listen, and have conversations with you in this language."
        onExit={onExit}
      />

      <div className="flex items-center gap-2 mb-6 text-neon-cyan">
        <Languages className="w-5 h-5" />
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
          Select a language
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {LANGUAGE_OPTIONS.map((l) => {
          const active = selected === l.id;
          return (
            <button
              key={l.id}
              onClick={() => choose(l.id)}
              aria-pressed={active}
              className="relative text-left bg-cyber-dark-card border rounded-2xl p-6 transition-all hover:-translate-y-0.5"
              style={{
                borderColor: active ? "#00F5FF" : "#1f1f35",
                boxShadow: active ? "0 0 25px rgba(0,245,255,0.15)" : "none",
              }}
            >
              {active && (
                <span className="absolute top-4 right-4 inline-flex items-center justify-center w-6 h-6 rounded-full bg-neon-cyan text-cyber-dark-1">
                  <Check className="w-4 h-4" />
                </span>
              )}
              <div className="text-4xl mb-3 leading-none">{l.flag}</div>
              <h3 className="font-sans font-bold text-lg text-white">{l.label}</h3>
              <p className="font-sans text-sm text-text-secondary">{l.native}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-xl font-sans font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: "#00F5FF", color: "#0A0A0F", boxShadow: "0 0 25px rgba(0,245,255,0.4)" }}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
