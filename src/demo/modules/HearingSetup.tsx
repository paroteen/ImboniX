/**
 * Section 5 — Hearing Assist setup.
 */
import React, { useState } from "react";
import { Captions, Volume2, Users, FileText } from "lucide-react";
import { useImbonix } from "../store";
import { ToggleCard, StepHeader, PrimaryButton } from "../ui";
import EmergencySetupForm from "../EmergencySetupForm";
import ContactManager from "./ContactManager";

const PURPLE = "#8B00FF";

export default function HearingSetup({ onStart, onExit }: { onStart: () => void; onExit: () => void }) {
  const { config, update } = useImbonix();
  const h = config.hearing;
  const [step, setStep] = useState<1 | 2>(1);
  const setH = (patch: Partial<typeof h>) => update({ hearing: { ...h, ...patch } });

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <StepHeader title="Emergency Setup" subtitle="Required before starting — your safety depends on it" onExit={onExit} />
        <EmergencySetupForm color={PURPLE} startLabel="Start Hearing Assist →" onStart={onStart} forceSos deafNote vibrationToggle />
        <button onClick={() => setStep(1)} className="mt-4 w-full text-center font-mono text-xs text-text-secondary hover:text-white">← Back to profile</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <StepHeader title="Customize Your Hearing Profile" onExit={onExit} />
      <div className="space-y-4">
        <ToggleCard icon={<Captions className="w-5 h-5" />} color={PURPLE} title="Live Speech Captions"
          description="ImboniX transcribes all speech in real time with speaker labels"
          on={h.liveCaptions} onToggle={(x) => setH({ liveCaptions: x })} />
        <ToggleCard icon={<Volume2 className="w-5 h-5" />} color={PURPLE} title="Sound Recognition & Alerts"
          description="ImboniX detects fire alarms, horns, dog barks, sirens, and other critical sounds"
          on={h.soundRecognition} onToggle={(x) => setH({ soundRecognition: x })} />
        <ToggleCard icon={<Users className="w-5 h-5" />} color={PURPLE} title="Speaker Identification"
          description="ImboniX recognises saved contacts and labels who is speaking"
          on={h.speakerId} onToggle={(x) => setH({ speakerId: x })}>
          <ContactManager />
        </ToggleCard>
        <ToggleCard icon={<FileText className="w-5 h-5" />} color={PURPLE} title="Conversation Summary"
          description="ImboniX summarizes the last 2 minutes of conversation on demand"
          on={h.conversationSummary} onToggle={(x) => setH({ conversationSummary: x })} />
      </div>
      <div className="mt-8">
        <PrimaryButton color={PURPLE} onClick={() => setStep(2)}>Continue to Emergency Setup →</PrimaryButton>
      </div>
    </div>
  );
}
