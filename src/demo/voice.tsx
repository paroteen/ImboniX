/**
 * ImboniX shared voice listener — a SINGLE continuous SpeechRecognition for
 * the whole demo. Components subscribe to receive final transcripts (lowercased).
 * This avoids multiple microphone instances fighting over the mic.
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useImbonix } from "./store";
import { LANG_TO_BCP47 } from "../server/imbonix-core";

type Handler = (text: string) => void;
type InterimHandler = (text: string, isFinal: boolean) => void;

interface VoiceCtx {
  supported: boolean;
  listening: boolean;
  /** Subscribe to final transcripts (lowercased). Returns an unsubscribe fn. */
  subscribe: (fn: Handler) => () => void;
  /** Subscribe to raw transcripts incl. interim (original casing). */
  subscribeRaw: (fn: InterimHandler) => () => void;
}

const Ctx = createContext<VoiceCtx | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { config } = useImbonix();
  const recLang = LANG_TO_BCP47[config.language] || "en-US";
  const handlers = useRef<Set<Handler>>(new Set());
  const rawHandlers = useRef<Set<InterimHandler>>(new Set());
  const recognitionRef = useRef<any>(null);
  const stoppedRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  const subscribe = useCallback((fn: Handler) => {
    handlers.current.add(fn);
    return () => {
      handlers.current.delete(fn);
    };
  }, []);

  const subscribeRaw = useCallback((fn: InterimHandler) => {
    rawHandlers.current.add(fn);
    return () => {
      rawHandlers.current.delete(fn);
    };
  }, []);

  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn("[ImboniX Voice] SpeechRecognition not supported in this browser");
      setSupported(false);
      return;
    }
    stoppedRef.current = false;
    let rec: any;
    try {
      rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = recLang;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        console.log("[ImboniX Voice] Listening started");
        setListening(true);
      };

      rec.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const raw = (event.results[i][0].transcript || "").trim();
          const isFinal = event.results[i].isFinal;
          // Emit every result (interim + final) to raw subscribers for captions.
          if (raw) rawHandlers.current.forEach((h) => h(raw, isFinal));
          if (isFinal) {
            const text = raw.toLowerCase();
            if (text) {
              console.log("[ImboniX Voice] Heard (final):", text);
              handlers.current.forEach((h) => h(text));
            }
          }
        }
      };

      rec.onend = () => {
        console.log("[ImboniX Voice] Listening ended, restarting...");
        setListening(false);
        if (!stoppedRef.current) {
          try {
            rec.start();
          } catch {
            /* restart race — ignore */
          }
        }
      };

      rec.onerror = (err: any) => {
        console.error("[ImboniX Voice] Recognition error:", err?.error || err);
        if (err?.error === "not-allowed" || err?.error === "service-not-allowed" || err?.error === "audio-capture") {
          console.error("[ImboniX Voice] Microphone unavailable or permission denied:", err.error);
          // Stop the onend auto-restart, otherwise it retries in a tight loop forever.
          stoppedRef.current = true;
          setSupported(false);
        } else if (err?.error === "no-speech") {
          console.log("[ImboniX Voice] No speech detected, will restart on next onend");
        } else if (err?.error === "network") {
          console.error("[ImboniX Voice] Network error in speech recognition");
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("[ImboniX Voice] Failed to start:", e);
      setSupported(false);
    }
  }, [recLang]);

  useEffect(() => {
    startRecognition();
    return () => {
      stoppedRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, [startRecognition]);

  return <Ctx.Provider value={{ supported, listening, subscribe, subscribeRaw }}>{children}</Ctx.Provider>;
}

export function useVoice(): VoiceCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useVoice must be used inside VoiceProvider");
  return c;
}
