/**
 * Phone pairing page — loaded when the URL contains ?session=CODE.
 * The phone becomes the ImboniX camera, streaming rear video to the desktop
 * session over WebRTC (PeerJS).
 */
import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { Eye, RefreshCw, CheckCircle2 } from "lucide-react";
import { peerIdForSession } from "../demo/PhonePairingModal";

export default function PairPage({ session }: { session: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [status, setStatus] = useState<"init" | "streaming" | "error">("init");
  const [unsupported, setUnsupported] = useState(false);

  const startStream = async (facingMode: "environment" | "user") => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Call the desktop peer with our stream.
      const peer = peerRef.current;
      if (peer) {
        const call = peer.call(peerIdForSession(session), stream);
        if (call) setStatus("streaming");
      }
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).RTCPeerConnection) {
      setUnsupported(true);
      return;
    }
    const peer = new Peer();
    peerRef.current = peer;
    peer.on("open", () => startStream(facing));
    peer.on("error", () => setStatus("error"));
    return () => {
      peer.destroy();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const flip = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startStream(next);
  };

  return (
    <div className="min-h-screen bg-cyber-dark-1 text-white flex flex-col items-center justify-between p-6">
      <div className="flex items-center gap-2 mt-6">
        <div className="p-2 bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 rounded-lg border border-neon-cyan/30">
          <Eye className="w-5 h-5 text-neon-cyan" />
        </div>
        <span className="font-sans font-bold text-lg tracking-wider">
          IMBONI<span className="text-neon-cyan glow-text-cyan">X</span>
        </span>
      </div>

      {unsupported ? (
        <p className="max-w-sm text-center text-sm text-text-secondary">
          This browser does not support camera streaming. Please use a modern mobile browser (Chrome/Safari).
        </p>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center">
          <h1 className="font-sans font-bold text-xl text-center mb-1">You are now the ImboniX camera</h1>
          <p className="font-mono text-xs text-text-secondary mb-5 flex items-center gap-2">
            {status === "streaming" ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-neon-green" /> Streaming to your session...
              </>
            ) : status === "error" ? (
              <span className="text-neon-magenta">Camera access denied. Allow access and refresh.</span>
            ) : (
              "Connecting..."
            )}
          </p>

          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-neon-cyan/50 bg-black scanlines">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 border-l-2 border-t-2 w-8 h-8 border-neon-cyan" />
            <div className="absolute bottom-3 right-3 border-r-2 border-b-2 w-8 h-8 border-neon-cyan" />
          </div>

          <button
            onClick={flip}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-cyber-dark-card border border-neon-cyan/30 hover:border-neon-cyan rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-neon-cyan" />
            Switch to {facing === "environment" ? "front" : "rear"} camera
          </button>
        </div>
      )}

      <p className="font-sans text-sm text-center text-neon-cyan/80 max-w-xs mb-4">
        Hold your phone at eye level, lens facing forward, like glasses.
      </p>
    </div>
  );
}
