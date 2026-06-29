/**
 * ImboniX camera context — holds the active MediaStream, whether it comes
 * from the local device (getUserMedia) or a paired phone (PeerJS WebRTC).
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { CameraSource } from "./types";

interface CameraCtx {
  source: CameraSource | null;
  stream: MediaStream | null;
  phoneConnected: boolean;
  error: string;
  setSource: (s: CameraSource | null) => void;
  setStream: (s: MediaStream | null) => void;
  setPhoneConnected: (v: boolean) => void;
  startLocal: () => Promise<boolean>;
  stop: () => void;
}

const Ctx = createContext<CameraCtx | null>(null);

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<CameraSource | null>(null);
  const [stream, setStreamState] = useState<MediaStream | null>(null);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);

  const setStream = useCallback((s: MediaStream | null) => {
    streamRef.current = s;
    setStreamState(s);
  }, []);

  const startLocal = useCallback(async () => {
    if (startingRef.current) return false;
    startingRef.current = true;
    setError("");
    const tryGet = async (facing: "environment" | "user") =>
      navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
    try {
      let s: MediaStream;
      try {
        s = await tryGet("environment");
      } catch {
        s = await tryGet("user");
      }
      setStream(s);
      startingRef.current = false;
      return true;
    } catch {
      setError("ImboniX needs camera access for this module. Please allow access in browser settings and refresh.");
      startingRef.current = false;
      return false;
    }
  }, [setStream]);

  // Auto-start local camera when source becomes "local"
  useEffect(() => {
    if (source === "local" && !stream && !startingRef.current) {
      startLocal();
    }
  }, [source, stream, startLocal]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setPhoneConnected(false);
  }, [setStream]);

  return (
    <Ctx.Provider
      value={{ source, stream, phoneConnected, error, setSource, setStream, setPhoneConnected, startLocal, stop }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCamera(): CameraCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCamera must be used inside CameraProvider");
  return c;
}
