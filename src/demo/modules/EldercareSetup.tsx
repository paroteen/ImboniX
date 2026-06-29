/**
 * Section 7 — ElderCare setup. Profile (Step 1) + multi-contact emergency (Step 2).
 */
import React, { useState } from "react";
import { Activity, Pill, Calendar, Clock, Brain, Plus, X, ShieldAlert } from "lucide-react";
import { useImbonix, uid } from "../store";
import { ToggleCard, Field, SelectField, StepHeader, PrimaryButton } from "../ui";
import { RELATIONSHIPS } from "../types";

const GOLD = "#F39C12";

export default function EldercareSetup({ onStart, onExit }: { onStart: () => void; onExit: () => void }) {
  const { config, update } = useImbonix();
  const e = config.eldercare;
  const [step, setStep] = useState<1 | 2>(1);
  const setE = (patch: Partial<typeof e>) => update({ eldercare: { ...e, ...patch } });

  // medication draft
  const [med, setMed] = useState({ name: "", dosage: "", time: "", notes: "" });
  const addMed = () => {
    if (!med.name.trim()) return;
    update({ medications: [...config.medications, { id: uid(), name: med.name, dosage: med.dosage, times: med.time ? [med.time] : [], notes: med.notes }] });
    setMed({ name: "", dosage: "", time: "", notes: "" });
  };

  // appointment draft
  const [appt, setAppt] = useState({ title: "", location: "", datetime: "", notifyBefore: "30min" as const });
  const addAppt = () => {
    if (!appt.title.trim()) return;
    update({ appointments: [...config.appointments, { id: uid(), ...appt }] });
    setAppt({ title: "", location: "", datetime: "", notifyBefore: "30min" });
  };

  if (step === 2) {
    return <EmergencyStep onStart={onStart} onExit={onExit} onBack={() => setStep(1)} />;
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <StepHeader title="Set Up Your Care Profile" subtitle="ImboniX watches over you quietly in the background" onExit={onExit} />
      <div className="space-y-4">
        <ToggleCard icon={<Activity className="w-5 h-5" />} color={GOLD} title="Fall Detection"
          description="ImboniX uses your device motion sensor to detect sudden falls and alert your family"
          on={e.fallDetection} onToggle={(x) => setE({ fallDetection: x })} />

        <ToggleCard icon={<Pill className="w-5 h-5" />} color={GOLD} title="Medication Reminders"
          description="ImboniX reminds you to take your medication on schedule"
          on={e.medicationReminders} onToggle={(x) => setE({ medicationReminders: x })}>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Medicine Name" value={med.name} onChange={(v) => setMed({ ...med, name: v })} />
              <Field label="Dosage" value={med.dosage} onChange={(v) => setMed({ ...med, dosage: v })} placeholder="e.g. 1 tablet" />
              <Field label="Reminder Time" type="time" value={med.time} onChange={(v) => setMed({ ...med, time: v })} />
              <Field label="Notes (optional)" value={med.notes} onChange={(v) => setMed({ ...med, notes: v })} />
            </div>
            <button onClick={addMed} className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#F39C12]"><Plus className="w-4 h-4" /> Add Another Medication</button>
            {config.medications.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-cyber-dark-1 rounded-lg p-2.5 text-sm">
                <span className="text-white font-medium">{m.name}</span>
                <span className="text-text-secondary text-xs">{m.dosage} · {m.times.join(", ")}</span>
                <button onClick={() => update({ medications: config.medications.filter((x) => x.id !== m.id) })} className="ml-auto text-text-secondary hover:text-neon-magenta"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </ToggleCard>

        <ToggleCard icon={<Calendar className="w-5 h-5" />} color={GOLD} title="Appointment Reminders"
          description="ImboniX reminds you before appointments and offers navigation"
          on={e.appointmentReminders} onToggle={(x) => setE({ appointmentReminders: x })}>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Title" value={appt.title} onChange={(v) => setAppt({ ...appt, title: v })} />
              <Field label="Location" value={appt.location} onChange={(v) => setAppt({ ...appt, location: v })} />
              <Field label="Date / Time" type="datetime-local" value={appt.datetime} onChange={(v) => setAppt({ ...appt, datetime: v })} />
              <SelectField label="Notify Before" value={appt.notifyBefore} onChange={(v) => setAppt({ ...appt, notifyBefore: v as any })} options={["30min", "1hr", "2hrs"]} />
            </div>
            <button onClick={addAppt} className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#F39C12]"><Plus className="w-4 h-4" /> Add Appointment</button>
            {config.appointments.map((a) => (
              <div key={a.id} className="flex items-center gap-2 bg-cyber-dark-1 rounded-lg p-2.5 text-sm">
                <span className="text-white font-medium">{a.title}</span>
                <span className="text-text-secondary text-xs">{a.location}</span>
                <button onClick={() => update({ appointments: config.appointments.filter((x) => x.id !== a.id) })} className="ml-auto text-text-secondary hover:text-neon-magenta"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </ToggleCard>

        <ToggleCard icon={<Clock className="w-5 h-5" />} color={GOLD} title="Daily Check-In"
          description="ImboniX gently checks in if no activity detected for a set period"
          on={e.dailyCheckIn} onToggle={(x) => setE({ dailyCheckIn: x })}>
          <div className="flex gap-2">
            {([2, 4, 6, 8] as const).map((hr) => (
              <button key={hr} onClick={() => setE({ checkInHours: hr })} className={`flex-1 py-2 rounded-lg font-mono text-xs border ${e.checkInHours === hr ? "bg-[#F39C12]/15 text-[#F39C12] border-[#F39C12]" : "text-text-secondary border-neutral-800"}`}>{hr}h</button>
            ))}
          </div>
        </ToggleCard>

        <ToggleCard icon={<Brain className="w-5 h-5" />} color={GOLD} title="Memory Assistance"
          description="Ask ImboniX where you last placed items or what you were doing"
          on={e.memoryAssistance} onToggle={(x) => setE({ memoryAssistance: x })} />
      </div>

      <div className="mt-8"><PrimaryButton color={GOLD} onClick={() => setStep(2)}>Continue to Emergency Setup →</PrimaryButton></div>
    </div>
  );
}

/** ElderCare emergency step — up to 3 priority contacts + auto-escalation. */
function EmergencyStep({ onStart, onExit, onBack }: { onStart: () => void; onExit: () => void; onBack: () => void }) {
  const { config, update } = useImbonix();
  const e = config.emergency;
  const [wordConfirm, setWordConfirm] = useState("");
  const setE = (patch: Partial<typeof e>) => update({ emergency: { ...e, ...patch } });

  const addContact = () => {
    if (config.eldercareContacts.length >= 3) return;
    update({ eldercareContacts: [...config.eldercareContacts, { id: uid(), name: "", phone: "", relationship: "Family", priority: (config.eldercareContacts.length + 1) as 1 | 2 | 3 }] });
  };
  const setContact = (id: string, patch: any) =>
    update({ eldercareContacts: config.eldercareContacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const removeContact = (id: string) => update({ eldercareContacts: config.eldercareContacts.filter((c) => c.id !== id) });

  const wordOk = e.emergencyWord.trim().length >= 3 && e.emergencyWord === wordConfirm;
  const hasContact = config.eldercareContacts.some((c) => c.phone.startsWith("+") && c.name.trim());
  const complete = e.userName.trim() && hasContact && wordOk;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <StepHeader title="Emergency Setup" subtitle="ElderCare users are highest risk — SOS is always on" onExit={onExit} />
      <div className="space-y-6">
        <Field label="Your Name" value={e.userName} onChange={(v) => setE({ userName: v })} required />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-sans font-bold text-white text-sm">Emergency Contacts (up to 3)</h4>
            <button onClick={addContact} disabled={config.eldercareContacts.length >= 3} className="flex items-center gap-1 text-xs font-mono uppercase text-[#F39C12] disabled:opacity-40"><Plus className="w-4 h-4" /> Add</button>
          </div>
          <div className="space-y-3">
            {config.eldercareContacts.map((c) => (
              <div key={c.id} className="bg-cyber-dark-card border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-[#F39C12] uppercase">Priority {c.priority}</span>
                  <button onClick={() => removeContact(c.id)} className="text-text-secondary hover:text-neon-magenta"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Name" value={c.name} onChange={(v) => setContact(c.id, { name: v })} />
                  <Field label="Phone (+code)" value={c.phone} onChange={(v) => setContact(c.id, { phone: v })} placeholder="+250..." />
                  <SelectField label="Relationship" value={c.relationship} onChange={(v) => setContact(c.id, { relationship: v })} options={RELATIONSHIPS} />
                </div>
              </div>
            ))}
            {config.eldercareContacts.length === 0 && <p className="text-xs text-text-secondary">Add at least one emergency contact.</p>}
          </div>
        </div>

        {/* Emergency word */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Emergency Word" value={e.emergencyWord} onChange={(v) => setE({ emergencyWord: v.toUpperCase() })} placeholder="e.g. GUARDIAN" />
          <Field label="Confirm Word" value={wordConfirm} onChange={(v) => setWordConfirm(v.toUpperCase())} />
        </div>

        <ToggleCard icon={<ShieldAlert className="w-5 h-5" />} color="#EF4444" title="Auto-Escalation"
          description="If your first contact does not respond, ImboniX automatically contacts the next person on your list after 30 seconds"
          on={config.autoEscalation} onToggle={(x) => update({ autoEscalation: x })} />

        <p className="text-[11px] text-text-secondary text-center font-mono">Emergency alerts powered by AfricasTalking · SOS button always visible</p>

        <PrimaryButton color={GOLD} onClick={onStart} disabled={!complete}>Activate ElderCare Mode →</PrimaryButton>
        <button onClick={onBack} className="w-full text-center font-mono text-xs text-text-secondary hover:text-white">← Back to profile</button>
      </div>
    </div>
  );
}
