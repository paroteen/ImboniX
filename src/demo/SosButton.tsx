/**
 * ImboniX SOS button — fixed bottom-right, always on top (z-9999).
 * Size varies per module: Vision 60px · Hearing 70px · ElderCare 80px.
 */
import React from "react";
import { ShieldAlert } from "lucide-react";
import { useEmergency } from "./Emergency";

export default function SosButton({
  size = 60,
  log,
}: {
  size?: number;
  log?: (text: string, kind?: "ALERT" | "EMERGENCY") => void;
}) {
  const { trigger } = useEmergency();
  return (
    <button
      aria-label="Emergency SOS"
      onClick={() => trigger("sos", log)}
      style={{ width: size, height: size }}
      className="fixed bottom-5 right-5 z-[9999] rounded-full bg-red-600 hover:bg-red-500 text-white font-sans font-bold flex flex-col items-center justify-center sos-pulse shadow-[0_0_25px_rgba(239,68,68,0.6)] active:scale-95 transition-transform"
    >
      <ShieldAlert style={{ width: size * 0.32, height: size * 0.32 }} />
      <span style={{ fontSize: size * 0.18 }} className="font-bold tracking-wider">
        SOS
      </span>
    </button>
  );
}
