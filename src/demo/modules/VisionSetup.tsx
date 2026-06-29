/**
 * Section 3 — Vision Assist setup (Step 1 profile, Step 2 emergency).
 */
import React, { useState } from "react";
import { Eye, AlertTriangle, User, Pill, Navigation } from "lucide-react";
import { useImbonix, uid } from "../store";
import { ToggleCard, Field, StepHeader, PrimaryButton } from "../ui";
import EmergencySetupForm from "../EmergencySetupForm";
import ContactManager from "./ContactManager";

const CYAN = "#00F5FF";

export default function VisionSetup({ onStart, onExit }: { onStart: () => void; onExit: () => void }) {
  const { config, update } = useImbonix();
  const v = config.vision;
  const [step, setStep] = useState<1 | 2>(1);
  const setV = (patch: Partial<typeof v>) => update({ vision: { ...v, ...patch } });

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <StepHeader title="Emergency Setup" subtitle="Required before starting — your safety depends on it" onExit={onExit} />
        <EmergencySetupForm color={CYAN} startLabel="Start Vision Assist →" onStart={onStart} />
        <button onClick={() => setStep(1)} className="mt-4 w-full text-center font-mono text-xs text-text-secondary hover:text-white">
          ← Back to profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <StepHeader title="Customize Your Vision Profile" onExit={onExit} />

      <div className="space-y-4">
        <ToggleCard icon={<Eye className="w-5 h-5" />} color={CYAN} title="Object Detection & Scene Description"
          description="ImboniX continuously describes what is ahead — objects, people, obstacles, environment"
          on={v.objectDetection} onToggle={(x) => setV({ objectDetection: x })} />

        <ToggleCard icon={<AlertTriangle className="w-5 h-5" />} color={CYAN} title="Obstacle & Hazard Alerts"
          description="ImboniX immediately warns of steps, vehicles, open drainage, low obstacles, moving hazards"
          on={v.hazardAlerts} onToggle={(x) => setV({ hazardAlerts: x })} />

        <ToggleCard icon={<User className="w-5 h-5" />} color={CYAN} title="Face Recognition"
          description="ImboniX identifies saved contacts by face and announces who is approaching"
          on={v.faceRecognition} onToggle={(x) => setV({ faceRecognition: x })}>
          <ContactManager />
        </ToggleCard>

        <ToggleCard icon={<Pill className="w-5 h-5" />} color={CYAN} title="Prescription & Text Reading"
          description="ImboniX reads medicine labels, prescription papers, signage, and printed documents"
          on={v.prescriptionReading} onToggle={(x) => setV({ prescriptionReading: x })} />
      </div>

      {/* Smart navigation */}
      <div className="mt-8">
        <h3 className="font-sans font-bold text-lg text-white mb-3">Smart Navigation (Optional)</h3>
        <ToggleCard icon={<Navigation className="w-5 h-5" />} color={CYAN} title="Enable turn-by-turn audio navigation"
          description="Navigation runs alongside Vision Assist — directions delivered between scene descriptions"
          on={v.navigationEnabled} onToggle={(x) => setV({ navigationEnabled: x })}>
          <div className="space-y-3">
            <Field label="Where do you want to go?" value={v.navigationDestination} onChange={(x) => setV({ navigationDestination: x })} placeholder="e.g. Kacyiru Hospital" />
            <div className="flex gap-2">
              {(["indoor", "outdoor"] as const).map((t) => (
                <button key={t} onClick={() => setV({ navigationType: t })}
                  className={`flex-1 py-2 rounded-lg font-mono text-xs uppercase tracking-wider border transition-colors ${v.navigationType === t ? "bg-neon-cyan/15 text-neon-cyan border-neon-cyan" : "text-text-secondary border-neutral-800"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </ToggleCard>
      </div>

      <div className="mt-8">
        <PrimaryButton color={CYAN} onClick={() => setStep(2)}>Continue to Emergency Setup →</PrimaryButton>
      </div>
    </div>
  );
}
