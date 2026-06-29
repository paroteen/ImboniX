/**
 * ImboniX config store — React context backed by localStorage.
 * Holds every setup value across the three assist modules so that
 * configuration is preserved when the user exits back to the orbit selector.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import type { ImbonixConfig } from "./types";

const STORAGE_KEY = "IMBONIX_CONFIG_V1";

export const DEFAULT_CONFIG: ImbonixConfig = {
  language: "english",
  contacts: [],
  medications: [],
  appointments: [],
  emergency: {
    userName: "",
    contactName: "",
    contactPhone: "",
    relationship: "Family",
    emergencyWord: "",
    showSosButton: true,
  },
  eldercareContacts: [],
  autoEscalation: true,
  vision: {
    objectDetection: true,
    hazardAlerts: true,
    faceRecognition: false,
    prescriptionReading: true,
    navigationEnabled: false,
    navigationDestination: "",
    navigationType: "outdoor",
  },
  hearing: {
    liveCaptions: true,
    soundRecognition: true,
    speakerId: false,
    conversationSummary: true,
    vibrationAlerts: true,
  },
  eldercare: {
    fallDetection: true,
    medicationReminders: true,
    appointmentReminders: true,
    dailyCheckIn: true,
    checkInHours: 4,
    memoryAssistance: true,
  },
  africasTalking: {
    apiKey: "",
    username: "sandbox",
    sandbox: true,
  },
  aiProvider: "auto",
  geminiKey: "",
  claudeKey: "",
  openaiKey: "",
};

function loadConfig(): ImbonixConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeDeep(DEFAULT_CONFIG, JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return structuredClone(DEFAULT_CONFIG);
}

function mergeDeep<T>(base: T, patch: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const k in patch) {
    const v: any = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object") {
      out[k] = mergeDeep(out[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

interface StoreCtx {
  config: ImbonixConfig;
  update: (patch: Partial<ImbonixConfig>) => void;
  reset: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function ImbonixProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ImbonixConfig>(() => loadConfig());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* ignore */
    }
  }, [config]);

  const update = (patch: Partial<ImbonixConfig>) =>
    setConfig((prev) => mergeDeep(prev, patch));

  const reset = () => setConfig(structuredClone(DEFAULT_CONFIG));

  return <Ctx.Provider value={{ config, update, reset }}>{children}</Ctx.Provider>;
}

export function useImbonix(): StoreCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useImbonix must be used inside ImbonixProvider");
  return c;
}

export const uid = () => Math.random().toString(36).slice(2, 11);
