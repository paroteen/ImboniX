/**
 * Section 0 Mode B — Desktop pairing modal.
 * Generates a session id, renders a QR + 6-digit code, and waits for the
 * phone to connect via PeerJS (WebRTC). On stream arrival, hands the stream
 * to the camera context and auto-dismisses.
 */
import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import QRCode from "qrcode";
import { CheckCircle2, X, Wifi } from "lucide-react";
import { useCamera } from "./camera";

// Stable session id -> peer id mapping. Phone derives the same peer id.
function makeSession() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
export const peerIdForSession = (s: string) => `imbonix-${s.toLowerCase()}`;

export default function PhonePairingModal({
  onConnected,
  onClose,
}: {
  onConnected: () => void;
  onClose: () => void;
}) {
  const { setStream, setPhoneConnected, setSource } = useCamera();
  const [session] = useState(makeSession);
  const [qr, setQr] = useState("");
  const [connected, setConnected] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const peerRef = useRef<Peer | null>(null);

  const pairUrl = `${window.location.origin}/?session=${session}`;

  useEffect(() => {
    QRCode.toDataURL(pairUrl, { margin: 1, width: 240, color: { dark: "#00F5FF", light: "#0A0A0F" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [pairUrl]);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).RTCPeerConnection) {
      setUnsupported(true);
      return;
    }
    let peer: Peer;
    try {
      peer = new Peer(peerIdForSession(session));
    } catch {
      setUnsupported(true);
      return;
    }
    peerRef.current = peer;

    peer.on("call", (call) => {
      call.answer(); // receive only
      call.on("stream", (remoteStream) => {
        setStream(remoteStream);
        setPhoneConnected(true);
        setSource("phone");
        setConnected(true);
        setTimeout(onConnected, 1400);
      });
    });

    peer.on("error", (err) => {
      console.warn("ImboniX pairing peer error:", err);
    });

    return () => {
      peer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="fixed inset-0 z-[9000] bg-black/92 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-cyber-dark-card border border-neon-purple/40 rounded-2xl p-8 text-center relative shadow-[0_0_50px_rgba(139,0,255,0.2)]">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {unsupported ? (
          <div className="py-6">
            <Wifi className="w-12 h-12 text-neon-magenta mx-auto mb-4" />
            <p className="text-white font-sans text-sm leading-relaxed">
              Your browser does not support remote camera pairing. Please open ImboniX directly on your phone
              browser and use <span className="text-neon-cyan">Use This Device</span>.
            </p>
          </div>
        ) : connected ? (
          <div className="py-10 burst-in">
            <CheckCircle2 className="w-20 h-20 text-neon-green mx-auto mb-4" />
            <h3 className="font-sans font-bold text-xl text-white">Phone camera paired successfully!</h3>
          </div>
        ) : (
          <>
            <h3 className="font-sans font-bold text-xl text-white mb-1">Pair Your Phone Camera</h3>
            <p className="font-sans text-xs text-text-secondary mb-6">
              Scan this QR code with your phone, or open the link and enter the code.
            </p>

            {qr ? (
              <img src={qr} alt="Pairing QR code" className="w-56 h-56 mx-auto rounded-xl border border-neon-cyan/30 bg-cyber-dark-1 p-2" />
            ) : (
              <div className="w-56 h-56 mx-auto rounded-xl bg-cyber-dark-1 animate-pulse" />
            )}

            <div className="my-6">
              <p className="font-mono text-[10px] text-text-secondary uppercase tracking-widest mb-1">Pairing Code</p>
              <p className="font-mono text-4xl font-bold text-neon-cyan tracking-[0.3em] glow-text-cyan">{session}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-neon-purple">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-purple" />
              </span>
              <span className="font-mono text-xs">Waiting for phone to connect...</span>
            </div>

            <p className="mt-4 text-[10px] text-neutral-600 font-mono break-all">{pairUrl}</p>
          </>
        )}
      </div>
    </div>
  );
}
