/**
 * KioskEnrollQR.tsx
 * Shows a program selector, then a QR code on the kiosk that students
 * scan with their phone to open the enrollment page pre-filled with
 * their chosen program.
 */
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, X, RefreshCw, ChevronLeft } from "lucide-react";

interface KioskEnrollQRProps {
  onClose: () => void;
}

const PROGRAMS = [
  { id: "Summer Camp",    label: "Summer Camp",    emoji: "☀️",  color: "from-yellow-500/40 to-orange-500/30", border: "border-yellow-500/40", badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  { id: "Kickboxing",     label: "Kickboxing",      emoji: "🥊",  color: "from-red-600/40 to-red-800/30",      border: "border-red-500/40",    badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  { id: "Little Ninjas",  label: "Little Ninjas",   emoji: "🥷",  color: "from-purple-500/40 to-purple-800/30", border: "border-purple-500/40", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { id: "Dragon Kids",    label: "Dragon Kids",     emoji: "🐉",  color: "from-blue-500/40 to-blue-800/30",    border: "border-blue-500/40",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { id: "Teens",          label: "Teens",           emoji: "⚡",  color: "from-cyan-500/40 to-cyan-800/30",    border: "border-cyan-500/40",   badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { id: "Adult Karate",   label: "Adult Karate",    emoji: "🥋",  color: "from-green-600/40 to-green-900/30",  border: "border-green-500/40",  badge: "bg-green-500/20 text-green-300 border-green-500/30" },
];

export function KioskEnrollQR({ onClose }: KioskEnrollQRProps) {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [enrollUrl, setEnrollUrl] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3-minute auto-close

  // Build the enrollment URL when a program is selected
  useEffect(() => {
    const base = window.location.origin;
    if (selectedProgram) {
      setEnrollUrl(`${base}/enroll?program=${encodeURIComponent(selectedProgram)}`);
    } else {
      setEnrollUrl(`${base}/enroll`);
    }
  }, [selectedProgram]);

  // Countdown timer — auto-close after 3 minutes
  useEffect(() => {
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
  }, [onClose]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const prog = PROGRAMS.find((p) => p.id === selectedProgram);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16,100,50,0.5) 0%, rgba(0,0,0,0.92) 70%)",
        }}
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl p-7 flex flex-col items-center gap-5"
        style={{
          background: "linear-gradient(135deg, #001a0a 0%, #000d05 100%)",
          border: "2px solid rgba(34,197,94,0.5)",
          boxShadow: "0 0 80px rgba(34,197,94,0.35), inset 0 0 40px rgba(34,197,94,0.05)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Back button (only when program selected) */}
        {selectedProgram && (
          <button
            onClick={() => setSelectedProgram(null)}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {/* ── STEP 1: Program Selector ── */}
        {!selectedProgram && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-2">🥋</div>
              <h2 className="text-3xl font-black text-white uppercase tracking-wider">
                Enroll Now
              </h2>
              <p className="text-white/50 text-sm mt-1">
                Choose a program to get started
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {PROGRAMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProgram(p.id)}
                  className={`group relative overflow-hidden rounded-2xl p-px transition-all duration-200 active:scale-95 hover:scale-105`}
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)`,
                  }}
                >
                  <div
                    className={`relative bg-gradient-to-br ${p.color} backdrop-blur-xl rounded-2xl py-5 px-4 flex flex-col items-center gap-2 border ${p.border}`}
                  >
                    <span className="text-4xl">{p.emoji}</span>
                    <span className="text-base font-black text-white uppercase tracking-wide text-center leading-tight">
                      {p.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / 180) * 100}%` }}
                />
              </div>
              <span className="text-white/40 text-xs font-mono tabular-nums">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </div>
          </>
        )}

        {/* ── STEP 2: QR Code ── */}
        {selectedProgram && prog && (
          <>
            {/* Title */}
            <div className="text-center">
              <div className="text-5xl mb-2">{prog.emoji}</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                {prog.label}
              </h2>
              <p className="text-white/50 text-sm mt-1">
                Scan with your phone to enroll
              </p>
            </div>

            {/* QR Code */}
            <div
              className="bg-white rounded-2xl p-5 shadow-2xl"
              style={{ boxShadow: "0 0 40px rgba(34,197,94,0.4)" }}
            >
              {enrollUrl ? (
                <QRCodeSVG
                  value={enrollUrl}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000d05"
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Instructions */}
            <div
              className="flex items-start gap-3 rounded-2xl p-4 border w-full"
              style={{
                background: "rgba(34,197,94,0.08)",
                borderColor: "rgba(34,197,94,0.25)",
              }}
            >
              <Smartphone className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">How to enroll:</p>
                <ol className="text-white/60 text-sm mt-1 space-y-0.5 list-decimal list-inside">
                  <li>Open your phone's camera app</li>
                  <li>Point it at the QR code above</li>
                  <li>Tap the link that appears</li>
                  <li>Complete enrollment on your phone</li>
                </ol>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / 180) * 100}%` }}
                />
              </div>
              <span className="text-white/40 text-xs font-mono tabular-nums">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
