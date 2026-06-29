/**
 * ImboniX Global Emergency System (Section 9).
 * Triggers: emergency word, SOS button, fall, inactivity.
 * Sequence: red flash → overlay → vibrate → SMS (AfricasTalking) →
 * WhatsApp fallback → auto-dial → 10s two-tap cancel → auto-escalation.
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useImbonix } from "./store";
import { useVoice } from "./voice";
import {
  ImboniXSpeak,
  haptic,
  EMERGENCY_HAPTIC,
  geo,
  nowTime,
} from "./runtime";
import type { EmergencyContact } from "./types";
import { ui } from "./i18n";
import { ShieldAlert, PhoneCall, MapPin, MessageSquare, X } from "lucide-react";

export type EmergencyReason =
  | "word"
  | "sos"
  | "fall"
  | "inactivity"
  | "weapon"
  | "threat"
  | "sound"
  | "test";

interface TriggerOpts {
  log?: (text: string, kind?: "ALERT" | "EMERGENCY") => void;
  /** Custom detail line (e.g. "handgun, center, near"). */
  detail?: string;
  /** Override the spoken announcement (e.g. Claude's SPEAK_NOW text). */
  speak?: string;
  /** Test mode — runs the visual/voice sequence but skips real SMS/call. */
  test?: boolean;
}

interface EmergencyCtx {
  active: boolean;
  trigger: (
    reason: EmergencyReason,
    logOrOpts?: ((text: string, kind?: "ALERT" | "EMERGENCY") => void) | TriggerOpts
  ) => void;
  cancel: () => void;
}

/** Phrase the wearer can say at any time to cancel an active emergency. */
export const CANCEL_PHRASE = "false alarm";

const Ctx = createContext<EmergencyCtx | null>(null);

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
  const { config } = useImbonix();
  const { subscribe } = useVoice();
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  activeRef.current = active;
  const [reason, setReason] = useState<EmergencyReason>("sos");
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [statusLines, setStatusLines] = useState<string[]>([]);
  const logRef = useRef<((t: string, k?: "ALERT" | "EMERGENCY") => void) | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const escalateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushStatus = (line: string) => setStatusLines((p) => [...p, line]);

  const recipients = useCallback((): EmergencyContact[] => {
    const list: EmergencyContact[] = [];
    // ElderCare contacts (priority ordered) take precedence if present.
    if (config.eldercareContacts.length) {
      return [...config.eldercareContacts].sort(
        (a, b) => (a.priority || 9) - (b.priority || 9)
      );
    }
    // Otherwise the single emergency contact from setup.
    if (config.emergency.contactPhone) {
      list.push({
        id: "primary",
        name: config.emergency.contactName || "Emergency Contact",
        phone: config.emergency.contactPhone,
        relationship: config.emergency.relationship,
        priority: 1,
      });
    }
    return list;
  }, [config]);

  const buildMessage = (name: string) => {
    const loc = geo.available
      ? `https://maps.google.com/?q=${geo.lat},${geo.lng}`
      : "Location unavailable";
    return (
      `IMBONIX EMERGENCY ALERT\n` +
      `${name} needs immediate help.\n` +
      `Location: ${loc}\n` +
      `Time: ${new Date().toLocaleString()}\n` +
      `Sent automatically by ImboniX.`
    );
  };

  const sendSMS = async (c: EmergencyContact) => {
    const message = buildMessage(config.emergency.userName || "An ImboniX user");
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: c.phone,
          message,
          apiKey: config.africasTalking.apiKey || undefined,
          username: config.africasTalking.username || undefined,
          sandbox: config.africasTalking.sandbox,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const line = `SMS sent to ${c.name} via AfricasTalking ✓`;
        pushStatus(line);
        logRef.current?.(`ImboniX: ${line}`, "EMERGENCY");
        return true;
      }
      throw new Error(data.message || "SMS failed");
    } catch (e: any) {
      const line = `SMS to ${c.name} failed — trying WhatsApp...`;
      pushStatus(line);
      logRef.current?.(`ImboniX: ${line}`, "EMERGENCY");
      openWhatsApp(c);
      return false;
    }
  };

  const openWhatsApp = (c: EmergencyContact) => {
    const msg = encodeURIComponent(
      `🆘 IMBONIX EMERGENCY ALERT\n` +
        `${config.emergency.userName || "An ImboniX user"} needs immediate help.\n` +
        `📍 Location: ${geo.available ? `https://maps.google.com/?q=${geo.lat},${geo.lng}` : "Unavailable"}\n` +
        `⏰ Time: ${new Date().toLocaleString()}\n` +
        `Sent automatically by ImboniX.`
    );
    const phone = c.phone.replace(/[^0-9]/g, "");
    try {
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    } catch {
      /* ignore popup block */
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (escalateRef.current) clearTimeout(escalateRef.current);
    timerRef.current = null;
    escalateRef.current = null;
  };

  const cancel = () => {
    cleanup();
    setActive(false);
    setConfirmCancel(false);
    setStatusLines([]);
    setCountdown(10);
    logRef.current?.("ImboniX: False alarm — emergency cancelled", "ALERT");
    ImboniXSpeak(ui().emergencyCancelled);
  };

  const handleCancelTap = () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    cancel();
  };

  const trigger = useCallback(
    (
      r: EmergencyReason,
      logOrOpts?: ((t: string, k?: "ALERT" | "EMERGENCY") => void) | TriggerOpts
    ) => {
      if (active) return;
      const opts: TriggerOpts = typeof logOrOpts === "function" ? { log: logOrOpts } : logOrOpts || {};
      const log = opts.log;
      const isTest = !!opts.test || r === "test";
      logRef.current = log;
      setReason(r);
      setActive(true);
      setConfirmCancel(false);
      setStatusLines([]);
      setCountdown(10);
      console.log("[ImboniX EMERGENCY] Triggered:", r, opts.detail || "", isTest ? "(TEST)" : "");

      // Step 1 — red flash 3x
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);

      // Step 3 — vibrate
      haptic(EMERGENCY_HAPTIC);

      const contacts = recipients();
      const reasonLabel = ui().reason[r];
      const speakName = contacts[0]?.name || ui().defaultContact;
      const label = opts.detail ? `${reasonLabel} — ${opts.detail}` : reasonLabel;
      if (isTest) {
        pushStatus("TEST MODE — no real SMS or call will be sent");
      }
      // Speak: prefer Claude's actionable SPEAK_NOW text when provided.
      ImboniXSpeak(opts.speak || ui().emergencyActivated(reasonLabel, speakName));
      log?.(`ImboniX EMERGENCY: ${label} — activating sequence`, "EMERGENCY");

      if (contacts.length === 0) {
        pushStatus("WARNING: No emergency contacts saved. Add contacts in setup.");
        ImboniXSpeak(ui().noContacts);
      }

      if (!geo.available) {
        pushStatus("Location unavailable — share your address manually with your contact");
      }

      if (isTest) {
        // Test mode stops here — visual + voice only, no outbound messaging.
        contacts.forEach((c) => pushStatus(`[TEST] Would send SMS to ${c.name} (${c.phone})`));
        timerRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
        return;
      }

      // Step 4/5 — SMS to every contact (WhatsApp fallback inside)
      contacts.forEach((c) => sendSMS(c));

      // Step 6 — auto-dial first contact
      if (contacts[0]) {
        pushStatus(`ImboniX is dialing ${contacts[0].name}...`);
        try {
          window.open(`tel:${contacts[0].phone}`);
        } catch {
          /* ignore */
        }
      }

      // Step 9 — auto-escalation to 2nd contact after 30s
      if (config.autoEscalation && contacts[1]) {
        escalateRef.current = setTimeout(() => {
          pushStatus(`ImboniX: Contacting ${contacts[1].name}...`);
          logRef.current?.(`ImboniX: Escalating to ${contacts[1].name}`, "EMERGENCY");
          sendSMS(contacts[1]);
        }, 30000);
      }

      // Step 7 — 10s countdown
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    },
    [active, config, recipients]
  );

  // Subscribe to the shared voice listener: detect the emergency word to
  // trigger, and the cancel phrase ("false alarm") to stand down.
  useEffect(() => {
    const word = config.emergency.emergencyWord.trim().toLowerCase();
    const unsub = subscribe((text) => {
      if (activeRef.current && text.includes(CANCEL_PHRASE)) {
        cancel();
        return;
      }
      if (!activeRef.current && word.length >= 3 && text.includes(word)) {
        trigger("word");
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.emergency.emergencyWord, subscribe]);

  const contacts = recipients();

  return (
    <Ctx.Provider value={{ active, trigger, cancel }}>
      {children}

      {/* Red flash overlay */}
      {flash && <div className="fixed inset-0 z-[10000] emergency-flash pointer-events-none" />}

      {/* Emergency overlay */}
      {active && (
        <div className="fixed inset-0 z-[10001] bg-black/95 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-red-950/40 border-2 border-red-600 rounded-2xl p-8 text-center shadow-[0_0_60px_rgba(239,68,68,0.5)]">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
            <h2 className="font-sans font-bold text-2xl text-white mb-1 uppercase tracking-wide">
              ImboniX Emergency Activated
            </h2>
            <p className="font-mono text-xs text-red-300 mb-6 uppercase">{ui().reason[reason]}</p>

            <div className="space-y-3 text-left mb-6">
              {contacts.length === 0 && (
                <p className="text-red-300 text-sm">No emergency contact configured.</p>
              )}
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-black/40 rounded-lg p-3 border border-red-900/50">
                  <PhoneCall className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-white text-sm font-medium">{c.name}</span>
                  <span className="text-red-300 text-xs font-mono ml-auto">{c.phone}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 bg-black/40 rounded-lg p-3 border border-red-900/50">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-white text-xs font-mono">
                  {geo.available ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}` : "Location unavailable"}
                </span>
              </div>
            </div>

            {/* Status log */}
            <div className="bg-black/50 rounded-lg p-3 mb-6 text-left max-h-32 overflow-y-auto">
              {statusLines.length === 0 ? (
                <p className="font-mono text-[11px] text-red-300/70">Initiating contact sequence...</p>
              ) : (
                statusLines.map((l, i) => (
                  <p key={i} className="font-mono text-[11px] text-green-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {l}
                  </p>
                ))
              )}
            </div>

            {/* Countdown + cancel */}
            <div className="mb-4">
              <span className="font-mono text-5xl font-bold text-red-500 tabular-nums">{countdown}</span>
              <p className="font-mono text-[10px] text-red-300 uppercase tracking-widest mt-1">
                seconds — auto-confirming
              </p>
            </div>

            <button
              onClick={handleCancelTap}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all ${
                confirmCancel
                  ? "bg-yellow-500 text-black animate-pulse"
                  : "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-600"
              }`}
            >
              <X className="w-4 h-4" />
              {confirmCancel ? "Tap again to confirm cancel" : "Cancel — False alarm"}
            </button>
            <p className="text-[11px] text-neutral-300 mt-3 font-mono">
              Or say <span className="text-yellow-400 font-bold">"False Alarm"</span> to cancel by voice
            </p>
            <p className="text-[10px] text-neutral-500 mt-2 font-mono">
              Emergency SMS by AfricasTalking
            </p>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useEmergency(): EmergencyCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEmergency must be used inside EmergencyProvider");
  return c;
}
