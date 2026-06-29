/**
 * ImboniX settings panel — AfricasTalking credentials + sandbox toggle and
 * the AI engine (Gemini/Claude/OpenAI) API keys with live connection status.
 * Includes a Test Emergency button. Stored in localStorage via store.
 */
import React, { useEffect, useState, useCallback } from "react";
import { X, MessageSquare, Sparkles, ShieldAlert, Globe } from "lucide-react";
import { useImbonix } from "./store";
import { useEmergency } from "./Emergency";
import { getApiStatus, setSpeechLang, type ApiStatus } from "./runtime";
import { LANGUAGE_OPTIONS, type Language } from "../server/imbonix-core";
import { Field, SelectField, ToggleCard } from "./ui";

function StatusDot({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between bg-cyber-dark-1 border border-neutral-800 rounded-lg px-3 py-2">
      <span className="font-sans text-sm text-white">{label}</span>
      <span className={`flex items-center gap-1.5 font-mono text-[10px] ${ok ? "text-neon-green" : "text-neon-magenta"}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${ok ? "bg-neon-green shadow-[0_0_6px_#00FF88]" : "bg-neon-magenta"}`} />
        {ok ? "Connected" : hint}
      </span>
    </div>
  );
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const { config, update } = useImbonix();
  const { trigger } = useEmergency();
  const at = config.africasTalking;
  const atReady = !!at.apiKey && !!at.username;

  const [status, setStatus] = useState<ApiStatus>({ gemini: false, claude: false, openai: false });
  const refreshStatus = useCallback(() => {
    getApiStatus(config).then(setStatus);
  }, [config]);
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const providerLabel =
    config.aiProvider === "claude" ? "Claude"
    : config.aiProvider === "gemini" ? "Gemini"
    : config.aiProvider === "openai" ? "OpenAI"
    : "Auto (recommended)";
  const labelToProvider = (v: string) =>
    v === "Claude" ? "claude" : v === "Gemini" ? "gemini" : v === "OpenAI" ? "openai" : "auto";

  const langLabel = (id: Language) =>
    `${LANGUAGE_OPTIONS.find((o) => o.id === id)?.native} (${LANGUAGE_OPTIONS.find((o) => o.id === id)?.label})`;
  const labelToLang = (v: string) =>
    (LANGUAGE_OPTIONS.find((o) => `${o.native} (${o.label})` === v)?.id || "english") as Language;

  return (
    <div className="fixed inset-0 z-[9200] bg-black/92 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-cyber-dark-card border border-neon-cyan/30 rounded-2xl p-7 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-text-secondary hover:text-white"><X className="w-5 h-5" /></button>
        <h2 className="font-sans font-bold text-xl text-white mb-1">ImboniX Settings</h2>
        <p className="font-sans text-xs text-text-secondary mb-6">Stored only in this browser.</p>

        {/* Language */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-neon-cyan" />
            <h3 className="font-sans font-bold text-white text-sm">Language</h3>
          </div>
          <SelectField
            label="ImboniX speaks, listens, and converses in"
            value={langLabel(config.language)}
            onChange={(v) => {
              const lang = labelToLang(v);
              update({ language: lang });
              setSpeechLang(lang);
            }}
            options={LANGUAGE_OPTIONS.map((o) => `${o.native} (${o.label})`)}
          />
        </div>

        {/* AfricasTalking */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-neon-cyan" /><h3 className="font-sans font-bold text-white text-sm">Emergency SMS (AfricasTalking)</h3></div>
            <span className={`flex items-center gap-1.5 font-mono text-[10px] ${atReady ? "text-neon-green" : "text-neon-magenta"}`}>
              <span className={`w-2 h-2 rounded-full ${atReady ? "bg-neon-green" : "bg-neon-magenta"}`} />
              {atReady ? "Connected" : "Not configured — SMS disabled"}
            </span>
          </div>
          <div className="space-y-3">
            <Field label="API Key" type="password" value={at.apiKey} onChange={(v) => update({ africasTalking: { ...at, apiKey: v } })} placeholder="AfricasTalking API key" />
            <Field label="Username" value={at.username} onChange={(v) => update({ africasTalking: { ...at, username: v } })} placeholder="sandbox" />
            <ToggleCard icon={<MessageSquare className="w-5 h-5" />} title="Use AfricasTalking Sandbox (testing mode)"
              description="Recommended for MVP — sends through the sandbox endpoint."
              on={at.sandbox} onToggle={(v) => update({ africasTalking: { ...at, sandbox: v } })} />
          </div>
        </div>

        {/* AI engine — multi-API */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-neon-purple" /><h3 className="font-sans font-bold text-white text-sm">AI Engines</h3></div>
            <button onClick={refreshStatus} className="font-mono text-[10px] text-text-secondary hover:text-white">Refresh ↻</button>
          </div>

          {/* Live connection status */}
          <div className="space-y-2 mb-4">
            <StatusDot ok={status.gemini} label="🟢 Gemini — Vision" hint="Key missing" />
            <StatusDot ok={status.claude} label="🟣 Claude — Reasoning" hint="Key missing" />
            <StatusDot ok={status.openai} label="🔵 OpenAI — Speech" hint="Key missing" />
          </div>

          <div className="space-y-3">
            <SelectField
              label="Preferred engine (Auto uses the best per task with fallback)"
              value={providerLabel}
              onChange={(v) => update({ aiProvider: labelToProvider(v) as any })}
              options={["Auto (recommended)", "Gemini", "Claude", "OpenAI"]}
            />
            <Field label="Gemini API Key (vision)" type="password" value={config.geminiKey} onChange={(v) => update({ geminiKey: v })} placeholder="Leave blank to use server key" />
            <Field label="Claude API Key (conversation)" type="password" value={config.claudeKey} onChange={(v) => update({ claudeKey: v })} placeholder="sk-ant-..." />
            <Field label="OpenAI API Key (Whisper speech)" type="password" value={config.openaiKey} onChange={(v) => update({ openaiKey: v })} placeholder="sk-..." />
          </div>
        </div>

        {/* Emergency test */}
        <div>
          <div className="flex items-center gap-2 mb-3"><ShieldAlert className="w-4 h-4 text-red-500" /><h3 className="font-sans font-bold text-white text-sm">Emergency System</h3></div>
          <p className="font-sans text-xs text-text-secondary mb-3">
            Runs the full emergency sequence (overlay, voice, countdown) in TEST mode — no real SMS or call is sent.
          </p>
          <button
            onClick={() => { trigger("test", { test: true }); onClose(); }}
            className="w-full py-3 rounded-lg bg-red-600/15 border border-red-600/50 text-red-400 font-mono text-xs uppercase tracking-wider hover:bg-red-600/25 transition-colors"
          >
            Test Emergency System
          </button>
        </div>
      </div>
    </div>
  );
}
