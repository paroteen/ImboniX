/**
 * Section 4 — Vision Assist live screen.
 * Camera feed + auto scene description (every 3s, spoken), hazard alerts,
 * face badges, response log with manual triggers, optional navigation bar,
 * and the always-on emergency word listener.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Eye, Pill, User, MapPin, Volume2, X, Smartphone, Mic, MicOff, MessageCircle } from "lucide-react";
import { useImbonix } from "../store";
import { useCamera } from "../camera";
import { useEmergency } from "../Emergency";
import { useVoice } from "../voice";
import SosButton from "../SosButton";
import { ImboniXSpeak, captureFrame, analyzeFrame, nowTime, isImboniXSpeaking, assessThreat, Beeps } from "../runtime";
import { ui } from "../i18n";
import { containsWeapon } from "../../server/imbonix-core";
import { loadVisionModel, detectObjects, type Detection } from "../visionML";
import type { ImbonixLogEntry } from "../types";

const CYAN = "#00F5FF";

export default function VisionLive({ onExit }: { onExit: () => void }) {
  const { config } = useImbonix();
  const { stream, source, phoneConnected, startLocal, error } = useCamera();
  const { active: emergencyActive, trigger: triggerEmergency } = useEmergency();
  const { subscribe, supported: voiceSupported, listening } = useVoice();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [logs, setLogs] = useState<ImbonixLogEntry[]>([]);
  const [sceneText, setSceneText] = useState("ImboniX is initializing...");
  const [typed, setTyped] = useState("");
  const [hazard, setHazard] = useState<string | null>(null);
  const [faceBadge, setFaceBadge] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [mlReady, setMlReady] = useState(false);
  const chatModeRef = useRef(false);
  chatModeRef.current = chatMode;
  const busyRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const prevSceneRef = useRef("");
  const threatBusyRef = useRef(false);
  const [listeningPrompt, setListeningPrompt] = useState(false);
  const talkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((text: string, kind: ImbonixLogEntry["kind"] = "INFO") => {
    setLogs((p) => [...p, { time: nowTime(), speaker: "ImboniX", kind, text }]);
  }, []);

  // After a notable scene change, invite the wearer to talk for a few seconds.
  const openTalkWindow = useCallback(() => {
    if (chatModeRef.current) return;
    setChatMode(true);
    setListeningPrompt(true);
    // Confirmation beep + spoken invite once the description has been read.
    setTimeout(() => {
      Beeps.listening();
      ImboniXSpeak(ui().talkToMe);
    }, 600);
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
    talkTimerRef.current = setTimeout(() => {
      setChatMode(false);
      setListeningPrompt(false);
    }, 6000);
  }, []);

  // Significant scene change = 3+ new meaningful words vs the previous scene.
  const detectSceneChange = useCallback((scene: string) => {
    const prev = prevSceneRef.current;
    if (!prev) {
      prevSceneRef.current = scene;
      return false;
    }
    const prevWords = new Set(prev.toLowerCase().split(/\s+/));
    const added = scene
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4 && !prevWords.has(w));
    if (added.length >= 3) {
      prevSceneRef.current = scene;
      return true;
    }
    return false;
  }, []);

  // Layer 2 — escalate a vision description to Claude for a threat decision,
  // and auto-trigger the emergency sequence when life is in danger.
  const runThreatAssessment = useCallback(
    async (visionText: string) => {
      if (threatBusyRef.current || emergencyActive) return;
      threatBusyRef.current = true;
      try {
        Beeps.hazard();
        addLog("ImboniX: Possible weapon/threat — assessing...", "ALERT");
        const a = await assessThreat(visionText, config);
        addLog(`ImboniX threat: ${a.threatLevel} — ${a.reason}`, "ALERT");
        if (a.threatLevel === "CRITICAL" || a.triggerSos) {
          triggerEmergency("weapon", { detail: a.reason, speak: a.speakNow, log: addLog });
        } else if (a.threatLevel === "HIGH") {
          setHazard(a.speakNow);
          ImboniXSpeak(a.speakNow);
          setTimeout(() => setHazard(null), 6000);
        } else {
          ImboniXSpeak(a.speakNow);
        }
      } catch (e: any) {
        addLog(`ImboniX: Threat assessment failed — ${e.message}`, "ALERT");
      } finally {
        threatBusyRef.current = false;
      }
    },
    [config, emergencyActive, triggerEmergency, addLog]
  );

  // Emergency word + "false alarm" cancel are handled globally by EmergencyProvider.

  // Load client-side TensorFlow.js COCO-SSD model
  useEffect(() => {
    let mounted = true;
    loadVisionModel().then((ok) => {
      if (mounted) setMlReady(ok);
    });
    return () => { mounted = false; };
  }, []);

  // Real-time object detection loop (runs independently of AI descriptions)
  useEffect(() => {
    if (!mlReady || !videoRef.current || !overlayRef.current) return;
    let active = true;
    const runDetection = async () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = overlayRef.current;
      if (!video || !canvas || video.readyState < 2) {
        if (active) requestAnimationFrame(runDetection);
        return;
      }
      // Size overlay to match video display
      const rect = video.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      const dets = await detectObjects(video);
      if (active) {
        setDetections(dets);
        // Draw bounding boxes
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;
          dets.forEach((d) => {
            const [x, y, w, h] = d.bbox;
            const dx = x * scaleX;
            const dy = y * scaleY;
            const dw = w * scaleX;
            const dh = h * scaleY;
            // Color by category
            let color = "#00FF88"; // green default
            if (["car", "truck", "bus", "motorcycle", "bicycle", "traffic light", "stop sign", "train"].includes(d.class.toLowerCase())) {
              color = "#FF00C8"; // magenta for navigation hazards
            } else if (["person", "face"].some((c) => d.class.toLowerCase().includes(c))) {
              color = "#00F5FF"; // cyan for people
            } else if (["bottle", "cup", "cell phone", "book", "laptop", "backpack", "handbag", "suitcase"].some((c) => d.class.toLowerCase().includes(c))) {
              color = "#F39C12"; // gold for objects
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(dx, dy, dw, dh);
            // Corner brackets
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            const cs = Math.min(dw, dh, 15);
            ctx.beginPath();
            ctx.moveTo(dx + cs, dy); ctx.lineTo(dx, dy); ctx.lineTo(dx, dy + cs); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(dx + dw - cs, dy + dh); ctx.lineTo(dx + dw, dy + dh); ctx.lineTo(dx + dw, dy + dh - cs); ctx.stroke();
            // Label
            ctx.fillStyle = "rgba(10,10,15,0.9)";
            const label = `${d.class} ${Math.round(d.score * 100)}%`;
            ctx.font = "bold 12px monospace";
            const tw = ctx.measureText(label).width + 8;
            ctx.fillRect(dx, dy - 22, tw, 22);
            ctx.fillStyle = color;
            ctx.fillText(label, dx + 4, dy - 6);
          });
        }
      }
      if (active) requestAnimationFrame(runDetection);
    };
    requestAnimationFrame(runDetection);
    return () => { active = false; };
  }, [mlReady]);

  // Auto-start local camera
  useEffect(() => {
    if (source === "local" && !stream) startLocal();
  }, [source, stream, startLocal]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => () => {
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
  }, []);

  // Typewriter for scene description
  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      setTyped(sceneText.slice(0, i + 1));
      i++;
      if (i >= sceneText.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [sceneText]);

  const buildContext = useCallback(
    () => ({
      userName: config.emergency.userName,
      userType: "blind",
      primaryLanguage: config.language,
      savedContacts: config.vision.faceRecognition
        ? config.contacts.map((c) => ({ name: c.name, relationship: c.relationship }))
        : [],
      navigationDestination: config.vision.navigationEnabled ? config.vision.navigationDestination : "",
    }),
    [config]
  );

  const run = useCallback(
    async (action: string, auto = false, question?: string) => {
      if (busyRef.current) return;
      // In auto mode, don't interrupt ImboniX while it is still speaking —
      // let the wearer hear the full description before capturing again.
      // Uses our self-tracked flag (native speechSynthesis.speaking can hang).
      if (auto && isImboniXSpeaking()) return;
      const img = captureFrame(videoRef.current);
      if (!img && action !== "CONVERSATION") {
        addLog("ImboniX: No camera frame available yet.", "INFO");
        return;
      }
      if (question) addLog(`You: ${question}`, "INFO");
      busyRef.current = true;
      try {
        const data = await analyzeFrame({
          image: img,
          action,
          config,
          context: buildContext(),
          extraInstruction: question ? `The wearer said: "${question}". Respond to them directly.` : undefined,
        });
        const text = data.result;
        const pr = data.structured?.priority || "NORMAL";
        const speaker = "ImboniX";

        // WEAPON RULE — if the description names any weapon/threat, escalate to
        // the Layer-2 threat assessment IMMEDIATELY (do not wait for next tick).
        const weapon = containsWeapon(text);
        if (pr === "HIGH") {
          setHazard(text);
          addLog(`${speaker} ALERT: ${text}`, "ALERT");
          setTimeout(() => setHazard(null), 6000);
        } else {
          addLog(`${speaker}: ${text}`, "INFO");
        }
        if (action === "PERSON") setFaceBadge(text);
        if (action === "SCENE" || action === "AHEAD") setSceneText(text);

        if (weapon) {
          // Don't double-speak the raw text; the threat layer decides what to say.
          runThreatAssessment(text);
        } else {
          ImboniXSpeak(text);
          // Scene-change → soft beep + open a short "talk to me" window.
          if (action === "SCENE" && !chatModeRef.current && detectSceneChange(text)) {
            Beeps.change();
            openTalkWindow();
          }
        }
      } catch (e: any) {
        addLog(`ImboniX: ${e.message || "AI request failed"}`, "ALERT");
        setSceneText("ImboniX cannot reach the AI engine. Add an API key in settings.");
      } finally {
        busyRef.current = false;
      }
    },
    [config, buildContext, addLog, runThreatAssessment, detectSceneChange]
  );

  // Auto-describe loop — checks every 3s but only fires a new capture when
  // ImboniX is idle and not still speaking, so each sentence is heard fully.
  // Pauses while the wearer is in conversation mode or during an emergency.
  useEffect(() => {
    if (!config.vision.objectDetection || chatMode || emergencyActive) {
      console.log("[ImboniX Vision] Auto-describe loop NOT started", {
        objectDetection: config.vision.objectDetection,
        chatMode,
        emergencyActive,
      });
      return;
    }
    console.log("[ImboniX Vision] Auto-describe loop started (every 3s)");
    const first = setTimeout(() => run("SCENE", true), 2500);
    const id = setInterval(() => {
      console.log("ImboniX frame capture triggered");
      run("SCENE", true);
    }, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [config.vision.objectDetection, chatMode, emergencyActive, run]);

  // Conversation: when chat mode is on, treat the wearer's speech as questions
  // and let ImboniX answer using the live camera view. Ignores ImboniX's own
  // voice (while speaking) and the emergency/cancel phrases.
  useEffect(() => {
    const unsub = subscribe((text) => {
      if (!chatModeRef.current) return;
      if (isImboniXSpeaking()) return;
      const word = config.emergency.emergencyWord.trim().toLowerCase();
      if (text.includes("false alarm")) return;
      if (word.length >= 3 && text.includes(word)) return;
      if (text.length < 2) return;
      run("CONVERSATION", false, text);
    });
    return unsub;
  }, [subscribe, run, config.emergency.emergencyWord]);

  return (
    <div className="fixed inset-0 z-[8000] bg-cyber-dark-1 flex flex-col">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neon-cyan/15 bg-cyber-dark-2">
        <div className="flex items-center gap-3">
          <button onClick={onExit} aria-label="Exit" className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <span className="font-sans font-bold tracking-wider text-white">IMBONI<span className="text-neon-cyan">X</span></span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-neon-green">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" /> Vision Assist · ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {source === "phone" && (
            <span className={`font-mono text-[10px] ${phoneConnected ? "text-neon-green" : "text-neon-magenta"}`}>
              <Smartphone className="w-3 h-3 inline mr-1" />
              {phoneConnected ? "Phone Camera · Connected" : "Phone disconnected — reconnecting..."}
            </span>
          )}
          {voiceSupported && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatMode((c) => !c)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                  chatMode
                    ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan animate-pulse"
                    : "bg-cyber-dark-card text-text-secondary border-neutral-800 hover:border-neon-cyan"
                }`}
                title="Talk to ImboniX — ask questions out loud"
              >
                {chatMode ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                {chatMode ? "Listening — talk to ImboniX" : "Talk to ImboniX"}
              </button>
              {/* Mic status indicator */}
              <span
                className={`w-2.5 h-2.5 rounded-full border border-neutral-700 flex-shrink-0 transition-colors ${
                  listening ? "bg-neon-green shadow-[0_0_6px_#00FF88] animate-pulse" : "bg-neutral-800"
                }`}
                title={listening ? "Microphone active" : "Microphone idle"}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* CAMERA ZONE */}
        <div className="lg:w-[65%] relative bg-black flex items-center justify-center scanlines overflow-hidden">
          {error ? (
            <div className="max-w-sm text-center p-8">
              <p className="text-white text-sm">{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas
                ref={overlayRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: "100%", height: "100%" }}
              />
            </>
          )}

          {/* HUD brackets */}
          <div className="absolute top-4 left-4 border-l-2 border-t-2 w-12 h-12 border-neon-cyan animate-pulse pointer-events-none" />
          <div className="absolute bottom-24 right-4 border-r-2 border-b-2 w-12 h-12 border-neon-cyan animate-pulse pointer-events-none" />
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded border border-neon-green">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="font-mono text-[10px] text-neon-green font-bold">● LIVE</span>
          </div>

          {/* Face badge */}
          {faceBadge && config.vision.faceRecognition && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-black/80 border border-neon-green px-3 py-1.5 rounded-lg">
              <span className="font-mono text-xs text-neon-green">{faceBadge.slice(0, 60)}</span>
            </div>
          )}

          {/* Hazard banner */}
          {hazard && (
            <div className="absolute top-0 inset-x-0 bg-red-600/90 py-3 text-center animate-pulse">
              <span className="font-sans font-bold text-white text-sm uppercase tracking-wide">ImboniX ALERT: {hazard}</span>
            </div>
          )}

          {/* Listening indicator (after scene-change "talk to me" prompt) */}
          {listeningPrompt && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neon-cyan/15 border border-neon-cyan px-4 py-2 rounded-full animate-pulse">
              <Mic className="w-4 h-4 text-neon-cyan" />
              <span className="font-mono text-xs text-neon-cyan uppercase tracking-wider">Listening — talk to ImboniX</span>
            </div>
          )}

          {/* Push-to-talk button (always available) */}
          {voiceSupported && (
            <button
              onClick={() => (chatMode ? (setChatMode(false), setListeningPrompt(false)) : openTalkWindow())}
              aria-label="Push to talk"
              className={`absolute bottom-5 left-5 z-20 w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
                chatMode
                  ? "bg-neon-cyan text-cyber-dark-1 border-neon-cyan animate-pulse shadow-[0_0_25px_rgba(0,245,255,0.6)]"
                  : "bg-black/70 text-neon-cyan border-neon-cyan/60 hover:bg-neon-cyan/20"
              }`}
            >
              <Mic className="w-6 h-6" />
              <span className="font-mono text-[8px] uppercase tracking-wider mt-0.5">Talk</span>
            </button>
          )}

          {/* Scene description box */}
          <div className="absolute inset-x-4 bottom-4 ml-24">
            <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-neon-cyan/30">
              <p className="font-mono text-[10px] text-neon-cyan uppercase tracking-widest mb-1">ImboniX sees:</p>
              <p className="font-sans text-sm text-white min-h-[20px]">{typed}<span className="animate-pulse">_</span></p>
            </div>
          </div>
        </div>

        {/* RESPONSE LOG */}
        <div className="lg:w-[35%] flex flex-col bg-[#0A0A0F] border-l border-neon-cyan/10">
          <div className="px-4 py-3 border-b border-neon-cyan/15">
            <span className="font-mono text-xs uppercase tracking-widest text-text-secondary font-bold">ImboniX Response Log</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
            {logs.map((l, i) => (
              <div key={i} className={l.kind === "ALERT" || l.kind === "EMERGENCY" ? "text-neon-magenta" : "text-text-secondary"}>
                <span className="text-neon-cyan">[{l.time}]</span> {l.text}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Manual triggers */}
          <div className="p-3 border-t border-neon-cyan/15 grid grid-cols-2 gap-2">
            <TriggerBtn icon={<Eye className="w-4 h-4" />} label="Describe Scene Now" onClick={() => run("SCENE")} />
            <TriggerBtn icon={<Pill className="w-4 h-4" />} label="Read This Label" onClick={() => run("PRESCRIPTION")} />
            <TriggerBtn icon={<User className="w-4 h-4" />} label="Who Is This?" onClick={() => run("PERSON")} />
            <TriggerBtn icon={<MapPin className="w-4 h-4" />} label="Where Am I?" onClick={() => run("AHEAD")} />
            <button onClick={() => ImboniXSpeak(logs[logs.length - 1]?.text || "")} className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-[11px] uppercase tracking-wider hover:bg-neon-cyan/20">
              <Volume2 className="w-4 h-4" /> Speak Last Response
            </button>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      {config.vision.navigationEnabled && config.vision.navigationDestination && (
        <div className="px-4 py-3 bg-cyber-dark-2 border-t border-neon-cyan/15 flex items-center gap-4">
          <MapPin className="w-4 h-4 text-neon-green" />
          <span className="font-sans text-sm text-white">Navigating to {config.vision.navigationDestination}</span>
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-neon-green w-1/3" />
          </div>
        </div>
      )}

      {config.emergency.showSosButton && <SosButton size={60} log={addLog} />}
    </div>
  );
}

function TriggerBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-cyber-dark-card border border-neutral-800 hover:border-neon-cyan text-white font-sans text-[11px] transition-colors">
      <span className="text-neon-cyan">{icon}</span>
      {label}
    </button>
  );
}
