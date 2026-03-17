/**
 * KioskDayPass.tsx
 * Shows a QR code on the kiosk that students scan with their phone
 * to open the mobile day pass checkout page (/buy-day-pass).
 */
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, X, RefreshCw } from "lucide-react";

interface KioskDayPassProps {
  onClose: () => void;
  preSelectedClass?: { id: number; program: string; startTime: string; instructor?: string } | null;
}

export function KioskDayPass({ onClose }: KioskDayPassProps) {
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2-minute auto-close
  const [refreshKey, setRefreshKey] = useState(0);

  // Build the checkout URL using the current domain
  useEffect(() => {
    const base = window.location.origin;
    setCheckoutUrl(`${base}/buy-day-pass`);
  }, [refreshKey]);

  // Countdown timer — auto-close after 2 minutes
  useEffect(() => {
    setTimeLeft(120);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshKey, onClose]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(180,10,10,0.5) 0%, rgba(0,0,0,0.92) 70%)",
        }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-8 flex flex-col items-center gap-6"
        style={{
          background: "linear-gradient(135deg, #1a0000 0%, #0d0000 100%)",
          border: "2px solid rgba(225,6,0,0.5)",
          boxShadow:
            "0 0 80px rgba(225,6,0,0.5), inset 0 0 40px rgba(225,6,0,0.05)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-wider">
            Buy a Day Pass
          </h2>
          <p className="text-white/50 text-sm mt-1">Scan with your phone to checkout</p>
        </div>

        {/* QR Code */}
        <div
          className="bg-white rounded-2xl p-5 shadow-2xl"
          style={{ boxShadow: "0 0 40px rgba(225,6,0,0.4)" }}
        >
          {checkoutUrl ? (
            <QRCodeSVG
              value={checkoutUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#0a0000"
              level="M"
              includeMargin={false}
            />
          ) : (
            <div className="w-[220px] h-[220px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 border border-white/10 w-full">
          <Smartphone className="w-6 h-6 text-[#E10600] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm">How to use:</p>
            <ol className="text-white/60 text-sm mt-1 space-y-1 list-decimal list-inside">
              <li>Open your phone's camera app</li>
              <li>Point it at the QR code above</li>
              <li>Tap the link that appears</li>
              <li>Complete checkout on your phone</li>
            </ol>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E10600] rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 120) * 100}%` }}
            />
          </div>
          <span className="text-white/40 text-sm font-mono tabular-nums">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>

        <p className="text-white/30 text-xs text-center">
          Screen closes automatically in {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
