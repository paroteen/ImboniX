/**
 * Section 6 — Hearing Assist live screen.
 * Large live captions + waveform, sound detection log, vibration alerts,
 * and a prominent (70px) always-visible SOS button.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, FileText, Repeat, Users, X } from "lucide-react";
import { useImbonix } from "../store";
import { useVoice } from "../voice";
import SosButton from "../SosButton";
import { haptic, nowTime, getApiStatus, transcribeAudio } from "../runtime";
import type { ImbonixLogEntry } from "../types";

interface Caption {
  time: string;
  text: string;
  speaker: string;
}

// Demo critical-sound cycle for sandboxes without real audio classification.
const SOUND_EVENTS = [
  { icon: "🔔", text: "Fire alarm detected — move to nearest exit", critical: true },
  { icon: "📣", text: "Car horn detected nearby — stop and wait", critical: false },
  { icon: "🐕", text: "Dog barking close by on your left", critical: false },
  { icon: "🚪", text: "Someone is calling your name", critical: false },
];

export default function HearingLive({ onExit }: { onExit: () => void }) {
  const { config } = useImbonix();
  const { supported: voiceSupported, listening: micLive, subscribeRaw } = useVoice();
  // "listening" here means the user has activated captioning in this screen.
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);
  listeningRef.current = listening;
  const [caption, setCaption] = useState("Press Start Listening and speak...");
  const [history, setHistory] = useState<Caption[]>([]);
  const [soundLog, setSoundLog] = useState<ImbonixLogEntry[]>([]);
  const [criticalAlert, setCriticalAlert] = useState<string | null>(null);
  const [engine, setEngine] = useState<"whisper" | "webspeech" | "demo">("webspeech");
  const demoTimerRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const whisperTimerRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const addSound = useCallback((icon: string, text: string, kind: ImbonixLogEntry["kind"] = "INFO") => {
    setSoundLog((p) => [...p, { time: nowTime(), speaker: "ImboniX", kind, text, icon }]);
  }, []);

  const pushCaption = useCallback((text: string) => {
    if (!text.trim()) return;
    setCaption(text);
    setHistory((p) => [{ time: nowTime(), text, speaker: "Person 1" }, ...p].slice(0, 8));
  }, []);

  // Detect whether OpenAI Whisper is available (preferred captions engine).
  useEffect(() => {
    getApiStatus(config).then((s) => {
      const canWhisper = s.openai && typeof window !== "undefined" && "MediaRecorder" in window;
      setEngine(canWhisper ? "whisper" : voiceSupported ? "webspeech" : "demo");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Whisper caption engine — records 4s chunks and transcribes server-side.
  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(4000);
      console.log("[ImboniX Hearing] Whisper recorder started");
      whisperTimerRef.current = setInterval(async () => {
        if (!listeningRef.current || chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        try {
          const text = await transcribeAudio(blob, config);
          if (text) {
            console.log("[ImboniX Hearing] Whisper:", text);
            pushCaption(text);
          }
        } catch (err) {
          console.error("[ImboniX Hearing] Whisper failed, falling back to Web Speech:", err);
          setEngine("webspeech");
          stopWhisper();
        }
      }, 4000);
    } catch (err) {
      console.error("[ImboniX Hearing] Could not start Whisper recorder:", err);
      setEngine(voiceSupported ? "webspeech" : "demo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, pushCaption, voiceSupported]);

  const stopWhisper = useCallback(() => {
    if (whisperTimerRef.current) clearInterval(whisperTimerRef.current);
    whisperTimerRef.current = null;
    try {
      recorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    audioStreamRef.current = null;
  }, []);

  // Emergency word + "false alarm" cancel handled globally by EmergencyProvider.

  const stopListening = useCallback(() => {
    setListening(false);
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    stopWhisper();
    setCaption("Captions paused. Press Start Listening to resume.");
  }, [stopWhisper]);

  const startListening = useCallback(() => {
    setListening(true);
    setCaption("Listening...");
    console.log("[ImboniX Hearing] Caption engine:", engine);
    if (engine === "whisper") {
      startWhisper();
    } else if (engine === "demo") {
      // No SpeechRecognition — run fallback demo captions so the UI still works.
      console.warn("[ImboniX Hearing] No speech engine — using demo captions");
      const phrases = [
        "Hello, welcome to the ImboniX hearing demo.",
        "The bus to Kigali Central Market leaves in ten minutes.",
        "Doctor said take the blue tablet after breakfast.",
      ];
      let i = 0;
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      demoTimerRef.current = setInterval(() => {
        if (i >= phrases.length) i = 0;
        pushCaption(phrases[i]);
        i++;
      }, 4000);
    }
    // webspeech engine relies on the shared subscribeRaw effect below.
  }, [engine, startWhisper, pushCaption]);

  // Consume the SHARED Web Speech recognition for captions (only when that is
  // the active engine — avoids duplicating Whisper captions). The shared
  // provider always runs for emergency-word detection regardless.
  useEffect(() => {
    const unsub = subscribeRaw((text, isFinal) => {
      if (!listeningRef.current || engine !== "webspeech") return;
      if (isFinal) {
        console.log("[ImboniX Hearing] Final caption:", text);
        pushCaption(text);
      } else {
        setCaption(text || "Listening...");
      }
    });
    return unsub;
  }, [subscribeRaw, engine, pushCaption]);

  useEffect(() => () => {
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    stopWhisper();
  }, [stopWhisper]);

  // Simulated sound recognition cycle
  useEffect(() => {
    if (!config.hearing.soundRecognition) return;
    let i = 0;
    const id = setInterval(() => {
      const ev = SOUND_EVENTS[i % SOUND_EVENTS.length];
      addSound(ev.icon, `ImboniX: ${ev.text}`, ev.critical ? "ALERT" : "INFO");
      if (ev.critical) {
        setCriticalAlert(ev.text);
        if (config.hearing.vibrationAlerts) haptic([500, 200, 500]);
        setTimeout(() => setCriticalAlert(null), 5000);
      }
      i++;
    }, 12000);
    return () => clearInterval(id);
  }, [config.hearing.soundRecognition, config.hearing.vibrationAlerts, addSound]);

  return (
    <div className="fixed inset-0 z-[8000] bg-cyber-dark-1 flex flex-col">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neon-purple/15 bg-cyber-dark-2">
        <div className="flex items-center gap-3">
          <button onClick={onExit} aria-label="Exit" className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white"><X className="w-5 h-5" /></button>
          <span className="font-sans font-bold tracking-wider text-white">IMBONI<span className="text-neon-purple">X</span></span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-neon-green"><span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" /> Hearing Assist · ACTIVE</span>
          <span className="font-mono text-[10px] text-text-secondary hidden sm:inline">
            {engine === "whisper" ? "Whisper" : engine === "webspeech" ? "Web Speech" : "Demo"} captions
          </span>
        </div>
        <button onClick={listening ? stopListening : startListening} className={`px-4 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider border ${listening ? "bg-neon-magenta/20 text-neon-magenta border-neon-magenta" : "bg-neon-purple text-white border-neon-purple"}`}>
          {listening ? <><MicOff className="w-3.5 h-3.5 inline mr-1" />Stop</> : <><Mic className="w-3.5 h-3.5 inline mr-1" />Start Listening</>}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* CAPTIONS */}
        <div className="lg:w-[60%] flex flex-col items-center justify-center p-8 relative">
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <span className="font-mono text-[11px] text-neon-purple uppercase tracking-widest mb-3">Person 1</span>
            <p className="font-sans font-medium text-center text-white leading-relaxed" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>{caption}</p>
          </div>
          {/* Waveform */}
          <div className="flex items-end gap-1 h-12 mt-6">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="wave-bar w-1.5 bg-neon-purple/60 rounded-full" style={{ height: "100%", animationDelay: `${i * 0.05}s`, opacity: listening && micLive ? 1 : 0.25 }} />
            ))}
          </div>
          {/* scrolled history */}
          <div className="w-full max-w-xl mt-6 space-y-1 max-h-32 overflow-y-auto">
            {history.map((c, i) => (
              <div key={i} className="flex justify-between font-mono text-[11px] text-text-secondary border-b border-white/5 pb-1">
                <span>"{c.text}"</span><span>{c.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SOUND LOG */}
        <div className="lg:w-[40%] flex flex-col bg-[#0A0A0F] border-l border-neon-purple/10">
          <div className="px-4 py-3 border-b border-neon-purple/15"><span className="font-mono text-xs uppercase tracking-widest text-text-secondary font-bold">ImboniX Sound Log</span></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
            {soundLog.map((l, i) => (
              <div key={i} className={l.kind === "ALERT" || l.kind === "EMERGENCY" ? "text-neon-magenta" : "text-text-secondary"}>
                {l.icon} <span className="text-neon-purple">[{l.time}]</span> {l.text}
              </div>
            ))}
            {soundLog.length === 0 && <p className="text-text-secondary">Monitoring for critical sounds...</p>}
          </div>
          <div className="p-3 border-t border-neon-purple/15 grid grid-cols-1 gap-2">
            <SBtn icon={<FileText className="w-4 h-4" />} label="Summarize Last 2 Minutes" onClick={() => setCaption(history.slice(0, 4).map((h) => h.text).join(" ") || "Nothing to summarize yet.")} />
            <SBtn icon={<Repeat className="w-4 h-4" />} label="Repeat Last Sentence" onClick={() => setCaption(history[0]?.text || "No sentence captured yet.")} />
            <SBtn icon={<Users className="w-4 h-4" />} label="Who Is Speaking?" onClick={() => setCaption("Person 1 is speaking.")} />
          </div>
        </div>
      </div>

      {/* Critical sound alert */}
      {criticalAlert && (
        <div className="fixed inset-0 z-[9500] bg-red-600/90 flex items-center justify-center p-8">
          <p className="font-sans font-bold text-3xl text-white text-center uppercase">ImboniX ALERT: {criticalAlert}</p>
        </div>
      )}

      <SosButton size={70} log={(t, k) => addSound("🆘", t, k)} />
    </div>
  );
}

function SBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-cyber-dark-card border border-neutral-800 hover:border-neon-purple text-white font-sans text-[11px] transition-colors">
      <span className="text-neon-purple">{icon}</span>{label}
    </button>
  );
}
