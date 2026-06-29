/**
 * ImboniX demo orchestrator — full-screen overlay state machine.
 * Flow: camera-source → (phone pairing) → orbit → module setup → live screen.
 * Wraps everything in the camera + emergency providers and adds a settings gear.
 */
import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { CameraProvider, useCamera } from "./camera";
import { VoiceProvider } from "./voice";
import { EmergencyProvider } from "./Emergency";
import { startLocationTracking, stopLocationTracking, setSpeechLang } from "./runtime";
import { setUiLanguage } from "./i18n";
import { useImbonix } from "./store";
import type { ModuleId } from "./types";
import LanguageSelector from "./LanguageSelector";
import CameraSourceSelector from "./CameraSourceSelector";
import PhonePairingModal from "./PhonePairingModal";
import OrbitSelector from "./OrbitSelector";
import VisionSetup from "./modules/VisionSetup";
import VisionLive from "./modules/VisionLive";
import HearingSetup from "./modules/HearingSetup";
import HearingLive from "./modules/HearingLive";
import EldercareSetup from "./modules/EldercareSetup";
import EldercareLive from "./modules/EldercareLive";
import Settings from "./Settings";

type Step = "language" | "camera" | "pairing" | "orbit" | "setup" | "live";

function Flow({ onClose }: { onClose: () => void }) {
  const { setSource, stop } = useCamera();
  const { config } = useImbonix();
  const [step, setStep] = useState<Step>("language");
  const [module, setModule] = useState<ModuleId | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    startLocationTracking();
    return () => stopLocationTracking();
  }, []);

  // Apply the saved language to speech synthesis + app phrases when it changes.
  useEffect(() => {
    setSpeechLang(config.language);
    setUiLanguage(config.language);
  }, [config.language]);

  const exitToOrbit = () => {
    setModule(null);
    setStep("orbit");
  };

  const closeAll = () => {
    stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-black/[0.94] overflow-y-auto">
      {/* Gear (hidden during live screens which have their own chrome) */}
      {step !== "live" && (
        <button onClick={() => setShowSettings(true)} aria-label="Settings" className="fixed top-4 right-4 z-[7100] p-2.5 rounded-lg bg-cyber-dark-card border border-neutral-800 hover:border-neon-cyan text-text-secondary hover:text-white">
          <SettingsIcon className="w-5 h-5" />
        </button>
      )}

      {step !== "live" && (
        <div className="min-h-screen flex items-center justify-center p-6 py-16">
          {step === "language" && (
            <LanguageSelector onContinue={() => setStep("camera")} onExit={closeAll} />
          )}

          {step === "camera" && (
            <CameraSourceSelector
              onLocal={() => {
                setSource("local");
                setStep("orbit");
              }}
              onPair={() => setStep("pairing")}
              onExit={closeAll}
            />
          )}

          {step === "orbit" && (
            <OrbitSelector
              onSelect={(m) => {
                setModule(m);
                setStep("setup");
              }}
              onExit={closeAll}
            />
          )}

          {step === "setup" && module === "vision" && <VisionSetup onStart={() => setStep("live")} onExit={exitToOrbit} />}
          {step === "setup" && module === "hearing" && <HearingSetup onStart={() => setStep("live")} onExit={exitToOrbit} />}
          {step === "setup" && module === "eldercare" && <EldercareSetup onStart={() => setStep("live")} onExit={exitToOrbit} />}
        </div>
      )}

      {/* Pairing modal sits over the camera step */}
      {step === "pairing" && (
        <PhonePairingModal onConnected={() => setStep("orbit")} onClose={() => setStep("camera")} />
      )}

      {/* Live screens are their own full-screen layers */}
      {step === "live" && module === "vision" && <VisionLive onExit={exitToOrbit} />}
      {step === "live" && module === "hearing" && <HearingLive onExit={exitToOrbit} />}
      {step === "live" && module === "eldercare" && <EldercareLive onExit={exitToOrbit} />}

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function DemoOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CameraProvider>
      <VoiceProvider>
        <EmergencyProvider>
          <Flow onClose={onClose} />
        </EmergencyProvider>
      </VoiceProvider>
    </CameraProvider>
  );
}
