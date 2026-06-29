/**
 * Shared ImboniX emergency setup form (Section 3/5/7 step 2).
 * Single-contact variant with emergency word + SOS toggle.
 */
import React, { useState } from "react";
import { useImbonix } from "./store";
import { Field, SelectField, ToggleCard, PrimaryButton } from "./ui";
import { RELATIONSHIPS } from "./types";
import { ShieldAlert, KeyRound } from "lucide-react";
import { unlockSpeechSynthesis, unlockAudio, ImboniXSpeak } from "./runtime";
import { ui } from "./i18n";

export default function EmergencySetupForm({
  color,
  startLabel,
  onStart,
  forceSos = false,
  deafNote = false,
  vibrationToggle = false,
}: {
  color: string;
  startLabel: string;
  onStart: () => void;
  forceSos?: boolean;
  deafNote?: boolean;
  vibrationToggle?: boolean;
}) {
  const { config, update } = useImbonix();
  const e = config.emergency;
  const [wordConfirm, setWordConfirm] = useState("");

  const setE = (patch: Partial<typeof e>) => update({ emergency: { ...e, ...patch } });

  // This Start click is a genuine user gesture — prime the speech engine here
  // so all subsequent ImboniX speech works without further interaction, then
  // hand off to the live module.
  const handleStart = () => {
    unlockSpeechSynthesis();
    unlockAudio();
    ImboniXSpeak(ui().ready);
    onStart();
  };

  const wordOk = e.emergencyWord.trim().length >= 3 && e.emergencyWord === wordConfirm;
  const complete =
    e.userName.trim() &&
    e.contactName.trim() &&
    e.contactPhone.trim().startsWith("+") &&
    wordOk;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your Name" value={e.userName} onChange={(v) => setE({ userName: v })} placeholder="Used in emergency messages" required />
        <Field label="Emergency Contact Name" value={e.contactName} onChange={(v) => setE({ contactName: v })} required />
        <Field label="Contact Phone (with country code)" value={e.contactPhone} onChange={(v) => setE({ contactPhone: v })} placeholder="+250 7XX XXX XXX" required />
        <SelectField label="Relationship" value={e.relationship} onChange={(v) => setE({ relationship: v as any })} options={RELATIONSHIPS} />
      </div>

      {/* Emergency word */}
      <div className="bg-cyber-dark-card border border-neon-magenta/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-4 h-4 text-neon-magenta" />
          <h4 className="font-sans font-bold text-white text-sm">Set Your Emergency Voice Trigger Word</h4>
        </div>
        <p className="font-sans text-xs text-text-secondary mb-4">
          When ImboniX hears this word, it automatically sends an SMS and WhatsApp message to your emergency
          contact with your GPS location. Choose a word you would not say in normal conversation.
          {deafNote && " Even though you may not hear the response, ImboniX will show a full-screen visual confirmation."}
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Emergency Word" value={e.emergencyWord} onChange={(v) => setE({ emergencyWord: v.toUpperCase() })} placeholder="e.g. GUARDIAN, EAGLE, SHIELD" />
          <Field label="Confirm Word" value={wordConfirm} onChange={(v) => setWordConfirm(v.toUpperCase())} placeholder="Type it again" />
        </div>
        {e.emergencyWord && !wordOk && (
          <p className="text-[11px] text-neon-magenta mt-2 font-mono">Words must match and be at least 3 characters.</p>
        )}
      </div>

      {/* SOS toggle */}
      <ToggleCard
        icon={<ShieldAlert className="w-5 h-5" />}
        title={forceSos ? "Large SOS Button — Always Visible" : "Show SOS Button on screen at all times"}
        description={
          forceSos
            ? "Your primary emergency trigger. Always visible — one tap activates the full emergency sequence."
            : "A red SOS button stays visible in the corner during your session. Tap it anytime."
        }
        on={forceSos ? true : e.showSosButton}
        onToggle={(v) => !forceSos && setE({ showSosButton: v })}
        color="#EF4444"
      />

      {vibrationToggle && (
        <ToggleCard
          icon={<ShieldAlert className="w-5 h-5" />}
          title="Vibration Alerts"
          description="Your device vibrates when ImboniX detects fire alarms, horns, or emergency sounds."
          on={config.hearing.vibrationAlerts}
          onToggle={(v) => update({ hearing: { ...config.hearing, vibrationAlerts: v } })}
          color={color}
        />
      )}

      <p className="text-[11px] text-text-secondary text-center font-mono">Emergency alerts powered by AfricasTalking</p>

      <PrimaryButton onClick={handleStart} disabled={!complete} color={color}>
        {startLabel}
      </PrimaryButton>
    </div>
  );
}
