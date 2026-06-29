/**
 * ImboniX runtime helpers — voice, frame capture, haptics, location, and
 * the AI bridge to /api/analyze. All AI output is spoken AND displayed.
 */
import type { ImbonixConfig } from "./types";
import { LANG_TO_BCP47, type Language } from "../server/imbonix-core";

let speechUnlocked = false;

// The BCP-47 tag ImboniX currently speaks in. Updated when the wearer picks a
// language so the TTS voice (and accent) matches the conversation language.
let speechLang = "en-US";

/** Set the language ImboniX speaks in (call when the wearer selects one). */
export function setSpeechLang(lang: Language) {
  speechLang = LANG_TO_BCP47[lang] || "en-US";
}

/** Pick the best installed voice for a BCP-47 tag, falling back by base lang. */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices?.length) return null;
    const base = lang.split("-")[0].toLowerCase();
    return (
      voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase()) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(base)) ||
      null
    );
  } catch {
    return null;
  }
}
// We track speaking state ourselves because Chrome's native
// `speechSynthesis.speaking` flag can get stuck `true` forever (a known bug),
// which would permanently block the auto-describe loop.
let imbonixSpeaking = false;

/** True while ImboniX is actively speaking (reliable, self-tracked). */
export function isImboniXSpeaking(): boolean {
  return imbonixSpeaking;
}

/** Prime speech synthesis on first user gesture. Call once on Start button. */
export function unlockSpeechSynthesis() {
  if (speechUnlocked || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(u);
    speechUnlocked = true;
    console.log("[ImboniX] Speech synthesis unlocked");
  } catch {
    /* ignore */
  }
}

/** ImboniX voice — speaks any text aloud. */
export function ImboniXSpeak(text: string) {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;
    const voice = pickVoice(speechLang);
    if (voice) u.voice = voice;
    u.rate = 0.85;
    u.pitch = 1.0;
    u.volume = 1.0;
    imbonixSpeaking = true;
    u.onend = () => {
      imbonixSpeaking = false;
    };
    u.onerror = () => {
      imbonixSpeaking = false;
    };
    // Safety net: never let the speaking flag stay stuck. Clear it after a
    // generous timeout proportional to text length even if onend never fires.
    const ms = Math.min(15000, 1500 + text.length * 90);
    setTimeout(() => {
      imbonixSpeaking = false;
    }, ms);
    window.speechSynthesis.speak(u);
  } catch {
    imbonixSpeaking = false;
  }
}

/** Capture the current video frame as base64 PNG (no data: prefix). */
export function captureFrame(video: HTMLVideoElement | null): string {
  if (!video || !video.videoWidth) {
    console.log("[ImboniX Vision] captureFrame: no video or videoWidth");
    return "";
  }
  if (video.readyState < 2) {
    console.log("[ImboniX Vision] captureFrame: video not ready, readyState:", video.readyState);
    return "";
  }
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.log("[ImboniX Vision] captureFrame: no canvas context");
    return "";
  }
  ctx.drawImage(video, 0, 0);
  const dataURL = canvas.toDataURL("image/png");
  const base64 = dataURL.split(",")[1];
  console.log("[ImboniX Vision] Frame captured, base64 length:", base64?.length || 0);
  return base64 || "";
}

// ───────────────────────── Beep engine (Web Audio) ─────────────────────────
// A single shared AudioContext, unlocked on the first user gesture so beeps
// play reliably. Distinct tones signal distinct events.
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** Prime the audio engine on a user gesture (call alongside speech unlock). */
export function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

/** Play a short sine tone. */
export function playBeep(frequency = 880, duration = 200, volume = 0.3) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    /* ignore */
  }
}

/** Named event beeps, per ImboniX spec. */
export const Beeps = {
  change: () => playBeep(880, 200),
  hazard: () => playBeep(440, 500),
  emergency: () => playBeep(220, 1000, 0.4),
  listening: () => playBeep(1200, 100),
  chime: () => {
    playBeep(523, 300);
    setTimeout(() => playBeep(659, 300), 350);
    setTimeout(() => playBeep(784, 500), 700);
  },
};

/** Trigger device vibration if supported. */
export function haptic(pattern: number | number[] = [200, 100, 200]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export const EMERGENCY_HAPTIC = [500, 200, 500, 200, 500];

/** Rolling location store, refreshed in the background. */
export const geo = { lat: NaN, lng: NaN, available: false };

let geoTimer: ReturnType<typeof setInterval> | null = null;

export function startLocationTracking() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  const grab = () =>
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geo.lat = pos.coords.latitude;
        geo.lng = pos.coords.longitude;
        geo.available = true;
      },
      () => {
        geo.available = false;
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  grab();
  if (geoTimer) clearInterval(geoTimer);
  geoTimer = setInterval(grab, 60000);
}

export function stopLocationTracking() {
  if (geoTimer) clearInterval(geoTimer);
  geoTimer = null;
}

export interface AnalyzeResult {
  result: string;
  structured?: {
    type: string;
    priority: string;
    output_mode: string;
    language: string;
    response: string;
  };
}

/**
 * Send a frame + ImboniX action to the backend (prompt built server-side).
 */
export async function analyzeFrame(opts: {
  image: string;
  action: string;
  config: ImbonixConfig;
  context?: Record<string, unknown>;
  extraInstruction?: string;
}): Promise<AnalyzeResult> {
  const { image, action, config, context, extraInstruction } = opts;
  console.log("[ImboniX Vision] Sending frame to AI API...", { action, provider: config.aiProvider, imageLength: image?.length });
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image,
      action,
      context: context || {},
      extraInstruction,
      provider: config.aiProvider,
      clientApiKey: config.geminiKey || undefined,
      clientClaudeApiKey: config.claudeKey || undefined,
      clientOpenaiApiKey: config.openaiKey || undefined,
    }),
  });
  const data = await res.json();
  console.log("[ImboniX Vision] AI API response:", JSON.stringify(data).slice(0, 500), "via", data?.provider);
  if (!res.ok) throw new Error(data.message || data.error || "ImboniX AI request failed.");
  return data;
}

export interface ThreatAssessment {
  threatLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  speakNow: string;
  triggerSos: boolean;
  reason: string;
}

/** Layer 2 — send a vision description to Claude for a threat decision. */
export async function assessThreat(visionText: string, config: ImbonixConfig): Promise<ThreatAssessment> {
  console.log("[ImboniX Threat] Assessing:", visionText.slice(0, 120));
  const res = await fetch("/api/threat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visionText,
      clientApiKey: config.geminiKey || undefined,
      clientClaudeApiKey: config.claudeKey || undefined,
      clientOpenaiApiKey: config.openaiKey || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Threat assessment failed.");
  console.log("[ImboniX Threat] Assessment:", JSON.stringify(data.assessment), "via", data.provider);
  return data.assessment as ThreatAssessment;
}

export interface ApiStatus {
  gemini: boolean;
  claude: boolean;
  openai: boolean;
}

/** Ask the server which AI engines are currently usable (env + client keys). */
export async function getApiStatus(config: ImbonixConfig): Promise<ApiStatus> {
  try {
    const res = await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientApiKey: config.geminiKey || undefined,
        clientClaudeApiKey: config.claudeKey || undefined,
        clientOpenaiApiKey: config.openaiKey || undefined,
      }),
    });
    return (await res.json()) as ApiStatus;
  } catch {
    return { gemini: false, claude: false, openai: false };
  }
}

/** Transcribe a recorded audio blob with OpenAI Whisper (server-proxied). */
export async function transcribeAudio(blob: Blob, config: ImbonixConfig): Promise<string> {
  const qs = config.openaiKey ? `?key=${encodeURIComponent(config.openaiKey)}` : "";
  const res = await fetch(`/api/transcribe${qs}`, {
    method: "POST",
    headers: { "Content-Type": "audio/webm" },
    body: blob,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Whisper transcription failed.");
  return (data.text || "").trim();
}

export const nowTime = () => new Date().toLocaleTimeString();
