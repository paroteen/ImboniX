/**
 * Section 8 — ElderCare live dashboard. Calm, large-font UI.
 * Status cards, medication/appointment reminders, fall detection (DeviceMotion
 * + simulate button), daily check-in, 80px SOS.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Pill, Calendar, Activity, Clock, X, Check } from "lucide-react";
import { useImbonix } from "../store";
import { useEmergency } from "../Emergency";
import { useVoice } from "../voice";
import SosButton from "../SosButton";
import { ImboniXSpeak, haptic, Beeps, nowTime } from "../runtime";
import { ui } from "../i18n";

export default function EldercareLive({ onExit }: { onExit: () => void }) {
  const { config } = useImbonix();
  const { trigger, active: emergencyActive } = useEmergency();
  const { subscribe } = useVoice();
  const [now, setNow] = useState(new Date());
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [reminder, setReminder] = useState<{ medicine: string; dosage: string } | null>(null);
  const [checkIn, setCheckIn] = useState(false);
  const lastActivityRef = useRef(Date.now());
  lastActivityRef.current = lastActivity;
  const checkInRef = useRef(false);
  checkInRef.current = checkIn;
  const awaitingResponseRef = useRef(false);

  // Emergency word + "false alarm" cancel are handled globally by the shared
  // voice listener in EmergencyProvider.

  // clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // activity tracking
  useEffect(() => {
    const bump = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", bump);
    window.addEventListener("touchstart", bump);
    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("touchstart", bump);
    };
  }, []);

  // fall detection via DeviceMotion
  useEffect(() => {
    if (!config.eldercare.fallDetection) return;
    const handler = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity;
      if (!a) return;
      const force = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      if (force > 25) trigger("fall");
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [config.eldercare.fallDetection, trigger]);

  // medication reminder engine
  useEffect(() => {
    if (!config.eldercare.medicationReminders) return;
    const id = setInterval(() => {
      const n = new Date();
      const t = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
      config.medications.forEach((m) => {
        if (m.times.includes(t)) {
          setReminder({ medicine: m.name, dosage: m.dosage });
          ImboniXSpeak(ui().medReminder(m.name, m.dosage));
          haptic([300, 100, 300]);
          Beeps.chime();
        }
      });
    }, 60000);
    return () => clearInterval(id);
  }, [config.eldercare.medicationReminders, config.medications]);

  // Inactivity check-in — after the configured idle window, ImboniX asks the
  // wearer if they're okay. If no "I'm fine" response, escalate to emergency.
  useEffect(() => {
    if (!config.eldercare.dailyCheckIn) return;
    const idleMs = (config.eldercare.checkInHours || 4) * 60 * 60 * 1000;
    const id = setInterval(() => {
      if (checkInRef.current || emergencyActive) return;
      if (Date.now() - lastActivityRef.current >= idleMs) {
        setCheckIn(true);
        awaitingResponseRef.current = true;
        Beeps.chime();
        ImboniXSpeak(ui().checkIn);
        // No response within 30s → notify emergency contacts.
        setTimeout(() => {
          if (awaitingResponseRef.current) {
            awaitingResponseRef.current = false;
            setCheckIn(false);
            trigger("inactivity", {
              detail: `No check-in response after ${config.eldercare.checkInHours} hours idle`,
            });
          }
        }, 30000);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [config.eldercare.dailyCheckIn, config.eldercare.checkInHours, emergencyActive, trigger]);

  // Listen for the wearer's spoken check-in response via the shared mic.
  useEffect(() => {
    const unsub = subscribe((text) => {
      // Any speech counts as activity.
      setLastActivity(Date.now());
      if (!checkInRef.current) return;
      if (text.includes("fine") || text.includes("okay") || text.includes("i am ok") || text.includes("good")) {
        awaitingResponseRef.current = false;
        setCheckIn(false);
        ImboniXSpeak(ui().goodToHearHere);
      } else if (text.includes("help")) {
        awaitingResponseRef.current = false;
        setCheckIn(false);
        trigger("inactivity", { detail: "Wearer asked for help during check-in" });
      }
    });
    return unsub;
  }, [subscribe, trigger]);

  const nextMed = config.medications[0];
  const nextAppt = config.appointments[0];
  const minsAgo = Math.floor((Date.now() - lastActivity) / 60000);

  const cardCls = "bg-cyber-dark-card border border-[#F39C12]/25 rounded-2xl p-6";

  return (
    <div className="fixed inset-0 z-[8000] bg-cyber-dark-1 flex flex-col text-white">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F39C12]/15 bg-cyber-dark-2">
        <button onClick={onExit} aria-label="Exit" className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white"><X className="w-6 h-6" /></button>
        <div className="text-center">
          <div className="font-sans font-bold text-2xl">{now.toLocaleTimeString()}</div>
          <div className="font-sans text-sm text-text-secondary">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
        <span className="font-sans text-base text-neon-green hidden sm:block">ImboniX is watching over you ✓</span>
      </div>

      {/* DASHBOARD */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-5">
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-[#F39C12] mb-2"><Pill className="w-6 h-6" /><span className="font-sans font-bold text-xl">Next Medication</span></div>
            <p className="font-sans text-lg text-white">{nextMed ? `${nextMed.name} at ${nextMed.times[0] || "—"}` : "No medication scheduled"}</p>
            {nextMed && <p className="text-text-secondary text-base">{nextMed.dosage}</p>}
          </div>
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-[#F39C12] mb-2"><Calendar className="w-6 h-6" /><span className="font-sans font-bold text-xl">Next Appointment</span></div>
            <p className="font-sans text-lg text-white">{nextAppt ? `${nextAppt.title}` : "No appointments"}</p>
            {nextAppt && <p className="text-text-secondary text-base">{nextAppt.location}</p>}
          </div>
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-[#F39C12] mb-2"><Activity className="w-6 h-6" /><span className="font-sans font-bold text-xl">Fall Detection</span></div>
            <p className="font-sans text-lg text-white">{config.eldercare.fallDetection ? "ImboniX is monitoring your movement — Active" : "Disabled"}</p>
          </div>
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-[#F39C12] mb-2"><Clock className="w-6 h-6" /><span className="font-sans font-bold text-xl">Last Activity</span></div>
            <p className="font-sans text-lg text-white">Last movement: {minsAgo === 0 ? "just now" : `${minsAgo} minutes ago`}</p>
          </div>
        </div>

        {/* Fall simulation (demo) */}
        <div className="max-w-3xl mx-auto mt-6 text-center">
          <button onClick={() => trigger("fall")} className="px-5 py-2.5 rounded-lg bg-cyber-dark-card border border-neutral-700 hover:border-red-500 text-text-secondary hover:text-white font-sans text-sm transition-colors">
            Simulate Fall Detection
          </button>
        </div>
      </div>

      {/* Reminder overlay */}
      {reminder && (
        <div className="fixed inset-0 z-[9500] bg-[#2a1a05]/95 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <Pill className="w-16 h-16 text-[#F39C12] mx-auto mb-5" />
            <h2 className="font-sans font-bold text-3xl text-white mb-2">Time to take your {reminder.medicine}</h2>
            <p className="font-sans text-2xl text-[#F39C12] mb-8">{reminder.dosage}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setReminder(null)} className="py-4 rounded-xl bg-neon-green text-cyber-dark-1 font-bold text-xl flex items-center justify-center gap-2"><Check className="w-6 h-6" /> Taken</button>
              <button onClick={() => setReminder(null)} className="py-4 rounded-xl bg-cyber-dark-card border border-neutral-700 text-white text-lg">Remind me in 10 minutes</button>
            </div>
          </div>
        </div>
      )}

      {/* Daily check-in overlay */}
      {checkIn && (
        <div className="fixed inset-0 z-[9400] bg-[#05161a]/95 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <Activity className="w-16 h-16 text-neon-green mx-auto mb-5 animate-pulse" />
            <h2 className="font-sans font-bold text-3xl text-white mb-2">ImboniX Check-In</h2>
            <p className="font-sans text-xl text-text-secondary mb-8">Are you okay? Say "I am fine", or tap below.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { awaitingResponseRef.current = false; setCheckIn(false); setLastActivity(Date.now()); ImboniXSpeak(ui().goodToHear); }} className="py-4 rounded-xl bg-neon-green text-cyber-dark-1 font-bold text-xl flex items-center justify-center gap-2"><Check className="w-6 h-6" /> I am fine</button>
              <button onClick={() => { awaitingResponseRef.current = false; setCheckIn(false); trigger("inactivity", { detail: "Wearer requested help at check-in" }); }} className="py-4 rounded-xl bg-red-600 text-white font-bold text-xl">I need help</button>
            </div>
          </div>
        </div>
      )}

      <SosButton size={80} />
    </div>
  );
}
