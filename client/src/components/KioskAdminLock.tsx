import { useState, useEffect, useCallback } from "react";
import { Lock, LockOpen, RotateCcw, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocation } from "wouter";

const LOCK_PIN = "202020";

interface KioskAdminLockProps {
  onVolumeChange?: (volume: number) => void;
  onReset?: () => void;
}

export function KioskAdminLock({ onVolumeChange, onReset }: KioskAdminLockProps) {
  const [, navigate] = useLocation();

  // Whether fullscreen lock mode is active
  const [isLocked, setIsLocked] = useState(false);
  // Whether the PIN pad overlay is visible
  const [showPinPad, setShowPinPad] = useState(false);
  // PIN input state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinShake, setPinShake] = useState(false);
  // Authenticated = PIN was correct, show settings panel
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Brief lock confirmation flash
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // ── Fullscreen helpers ─────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
    } catch {
      // Browser may block; silently continue
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {}
  }, []);

  // When locked, re-enter fullscreen if the user somehow escapes it
  useEffect(() => {
    if (!isLocked) return;
    const onFsChange = () => {
      if (!document.fullscreenElement && !showPinPad) {
        setTimeout(() => enterFullscreen(), 300);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, [isLocked, showPinPad, enterFullscreen]);

  // Block keyboard shortcuts when locked
  useEffect(() => {
    if (!isLocked) return;
    const blockKeys = (e: KeyboardEvent) => {
      const blocked = ["F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","Escape"];
      if (blocked.includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
      if ((e.ctrlKey || e.metaKey) && ["w","t","n","r","l","u"].includes(e.key.toLowerCase())) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    window.addEventListener("keydown", blockKeys, { capture: true });
    return () => window.removeEventListener("keydown", blockKeys, { capture: true });
  }, [isLocked]);

  // ── Lock icon tap handler ──────────────────────────────────────────────────
  const handleLockIconTap = () => {
    setPin("");
    setPinError(false);
    setPinShake(false);
    setIsAuthenticated(false);
    setShowPinPad(true);
  };

  // ── PIN logic ──────────────────────────────────────────────────────────────
  const handlePinDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    setPinError(false);

    if (next.length === 6) {
      if (next === LOCK_PIN) {
        // Correct PIN — toggle lock state
        if (!isLocked) {
          // Activate lock mode — show confirmation animation first
          setIsLocked(true);
          enterFullscreen();
          setShowPinPad(false);
          setPin("");
          setShowLockConfirm(true);
          setTimeout(() => setShowLockConfirm(false), 1800);
        } else {
          // Deactivate lock mode — show settings panel
          setIsAuthenticated(true);
        }
      } else {
        // Wrong PIN
        setPinError(true);
        setPinShake(true);
        setTimeout(() => {
          setPin("");
          setPinError(false);
          setPinShake(false);
        }, 800);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((p) => p.slice(0, -1));
    setPinError(false);
  };

  const closePinPad = () => {
    setShowPinPad(false);
    setIsAuthenticated(false);
    setPin("");
    setPinError(false);
  };

  // ── Authenticated settings actions ─────────────────────────────────────────
  const handleExitKiosk = async () => {
    setIsLocked(false);
    await exitFullscreen();
    closePinPad();
    navigate("/admin");
    toast.success("Exited kiosk mode");
  };

  const handleReset = () => {
    onReset?.();
    closePinPad();
    toast.success("Kiosk reset to idle");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Visible lock icon at the bottom-center of the screen ── */}
      <button
        onClick={handleLockIconTap}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 group select-none"
        style={{ touchAction: "manipulation" }}
        aria-label={isLocked ? "Unlock kiosk" : "Lock kiosk"}
      >
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center shadow-lg
            transition-all duration-300
            ${isLocked
              ? "bg-red-600 shadow-red-600/40 group-active:scale-95"
              : "bg-black/40 border border-white/20 group-active:scale-95"
            }
          `}
        >
          {isLocked
            ? <Lock className="w-5 h-5 text-white" />
            : <LockOpen className="w-5 h-5 text-white/70" />
          }
        </div>
        <span className={`text-[10px] font-medium tracking-wide select-none ${isLocked ? "text-red-400" : "text-white/40"}`}>
          {isLocked ? "LOCKED" : "LOCK"}
        </span>
      </button>

      {/* ── Lock Confirmation Animation ── */}
      {showLockConfirm && (
        <div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, rgba(220,38,38,0.25) 0%, rgba(0,0,0,0.97) 70%)",
            animation: "lockFadeIn 0.25s ease-out forwards",
          }}
        >
          <style>{`
            @keyframes lockFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes lockPulse {
              0%   { transform: scale(0.6); opacity: 0; }
              40%  { transform: scale(1.15); opacity: 1; }
              65%  { transform: scale(0.95); }
              80%  { transform: scale(1.05); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes lockTextSlide {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes lockRingExpand {
              0%   { transform: scale(0.5); opacity: 0.8; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          `}</style>

          {/* Expanding ring */}
          <div
            className="absolute w-40 h-40 rounded-full border-4 border-red-500"
            style={{ animation: "lockRingExpand 0.9s ease-out 0.1s forwards", opacity: 0 }}
          />
          <div
            className="absolute w-40 h-40 rounded-full border-2 border-red-400"
            style={{ animation: "lockRingExpand 0.9s ease-out 0.3s forwards", opacity: 0 }}
          />

          {/* Lock icon */}
          <div
            className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/50 mb-6"
            style={{ animation: "lockPulse 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
          >
            <Lock className="w-12 h-12 text-white" />
          </div>

          {/* Text */}
          <div style={{ animation: "lockTextSlide 0.4s ease-out 0.35s both" }}>
            <p className="text-white text-4xl font-black tracking-[0.3em] uppercase">Locked</p>
          </div>
          <div style={{ animation: "lockTextSlide 0.4s ease-out 0.5s both" }}>
            <p className="text-red-400 text-sm tracking-widest uppercase mt-2">Kiosk is now secured</p>
          </div>
        </div>
      )}

      {/* ── PIN Pad Overlay ── */}
      {showPinPad && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6">
          <Card className={`w-full max-w-xs bg-zinc-900 border-zinc-700 text-white p-7 ${pinShake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
            <style>{`
              @keyframes shake {
                0%,100% { transform: translateX(0); }
                20% { transform: translateX(-8px); }
                40% { transform: translateX(8px); }
                60% { transform: translateX(-6px); }
                80% { transform: translateX(6px); }
              }
            `}</style>

            {!isAuthenticated ? (
              /* ── PIN entry ── */
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isLocked ? "bg-red-600" : "bg-zinc-700"}`}>
                    {isLocked ? <LockOpen className="w-7 h-7 text-white" /> : <Lock className="w-7 h-7 text-white" />}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {isLocked ? "Unlock Kiosk" : "Lock Kiosk"}
                  </h2>
                  <p className="text-zinc-400 text-sm mt-1">Enter PIN to {isLocked ? "deactivate" : "activate"} screen lock</p>
                </div>

                {/* PIN dots */}
                <div className="flex justify-center gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                        i < pin.length
                          ? pinError ? "bg-red-500 border-red-500" : "bg-white border-white"
                          : "border-zinc-600"
                      }`}
                    />
                  ))}
                </div>
                {pinError && (
                  <p className="text-center text-red-400 text-sm -mt-2">Incorrect PIN. Try again.</p>
                )}

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3">
                  {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (key === "⌫") handlePinDelete();
                        else if (key !== "") handlePinDigit(key);
                      }}
                      disabled={key === ""}
                      className={`h-14 rounded-xl text-xl font-semibold transition-all select-none
                        ${key === "" ? "invisible" : ""}
                        ${key === "⌫"
                          ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300 active:scale-95"
                          : "bg-zinc-800 hover:bg-zinc-700 text-white active:scale-95 active:bg-zinc-600"
                        }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-zinc-500 hover:text-zinc-300"
                  onClick={closePinPad}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              /* ── Authenticated — show settings (only when unlocking) ── */
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockOpen className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Kiosk Unlocked</h2>
                  <p className="text-zinc-400 text-sm mt-1">Choose an action</p>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Kiosk to Idle
                </Button>

                <Button
                  onClick={handleExitKiosk}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Exit to Admin Panel
                </Button>

                <Button
                  onClick={closePinPad}
                  variant="ghost"
                  className="w-full text-zinc-500 hover:text-zinc-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Stay in Kiosk
                </Button>

                <p className="text-center text-zinc-600 text-xs pt-1">MyDojo Kiosk v2.0</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
