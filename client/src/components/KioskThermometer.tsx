import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface KioskThermometerProps {
  onDismiss: () => void;
}

/**
 * Full-screen thermometer overlay shown on the kiosk idle screen after 20 seconds
 * of inactivity. Displays live progress toward the 100-new-member drive goal.
 * Tapping anywhere dismisses it and returns to the normal idle screen.
 */
export function KioskThermometer({ onDismiss }: KioskThermometerProps) {
  const { data, isLoading } = trpc.kiosk.getMemberDriveProgress.useQuery(undefined, {
    refetchInterval: 30_000, // refresh every 30s while visible
    staleTime: 0,
  });

  const current = data?.current ?? 0;
  const goal = data?.goal ?? 100;
  const deadline = data?.deadline ?? null;
  const daysLeft = data?.daysLeft ?? null;

  const pct = Math.min(100, Math.round((current / goal) * 100));

  // Animate the mercury fill from 0 → pct on mount
  const [displayPct, setDisplayPct] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) return;
    // Animate fill over 1.8 seconds
    const steps = 60;
    const duration = 1800;
    const stepMs = duration / steps;
    let step = 0;
    const tick = () => {
      step++;
      const progress = step / steps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPct(Math.round(eased * pct));
      setDisplayCount(Math.round(eased * current));
      if (step < steps) {
        animRef.current = setTimeout(tick, stepMs);
      } else {
        setDisplayPct(pct);
        setDisplayCount(current);
      }
    };
    animRef.current = setTimeout(tick, 200); // small initial delay
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [isLoading, pct, current]);

  // Format deadline as "July 25" style
  const deadlineLabel = deadline
    ? new Date(deadline + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null;

  const isNearGoal = pct >= 80;
  const isComplete = pct >= 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0000 40%, #0d0d0d 100%)",
      }}
      onClick={onDismiss}
    >
      {/* Ambient glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(225,6,0,${isNearGoal ? "0.18" : "0.10"}) 0%, transparent 70%)`,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 3 === 0 ? "#E10600" : i % 3 === 1 ? "#FF6B00" : "#FFD700",
              left: `${5 + (i * 5.2) % 90}%`,
              top: `${10 + (i * 7.3) % 80}%`,
              opacity: 0.25 + (i % 4) * 0.12,
              animation: `float ${4 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 select-none w-full max-w-2xl">

        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-3">🥋</div>
          <h1
            className="text-5xl font-black text-white uppercase tracking-tight"
            style={{ textShadow: "0 0 40px rgba(225,6,0,0.8)" }}
          >
            STUDENT DRIVE
          </h1>
          <p className="text-xl text-white/60 mt-2 font-medium uppercase tracking-widest">
            {isComplete ? "🎉 GOAL REACHED!" : `${goal - current} spots left!`}
          </p>
        </div>

        {/* Thermometer */}
        <div className="flex items-end gap-10">
          {/* Thermometer tube */}
          <div className="flex flex-col items-center">
            {/* Fire at top */}
            <div
              className="text-5xl mb-2"
              style={{
                filter: isNearGoal ? "drop-shadow(0 0 16px #FF6B00)" : "none",
                animation: isNearGoal ? "pulse 1s ease-in-out infinite" : "none",
              }}
            >
              🔥
            </div>

            {/* Tube outer */}
            <div
              className="relative rounded-full overflow-hidden"
              style={{
                width: "72px",
                height: "420px",
                background: "rgba(255,255,255,0.08)",
                border: "3px solid rgba(255,255,255,0.15)",
                boxShadow: "0 0 30px rgba(225,6,0,0.3), inset 0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              {/* Mercury fill — grows from bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full transition-none"
                style={{
                  height: `${displayPct}%`,
                  background: isComplete
                    ? "linear-gradient(to top, #FFD700, #FF6B00, #E10600)"
                    : isNearGoal
                    ? "linear-gradient(to top, #FF6B00, #E10600, #FF2200)"
                    : "linear-gradient(to top, #8B0000, #CC0000, #E10600)",
                  boxShadow: `0 0 20px rgba(225,6,0,0.8), inset 0 0 10px rgba(255,255,255,0.2)`,
                  transition: "height 0.05s linear",
                }}
              />

              {/* Tick marks */}
              {[25, 50, 75].map((tick) => (
                <div
                  key={tick}
                  className="absolute left-0 right-0 flex items-center"
                  style={{ bottom: `${tick}%` }}
                >
                  <div
                    className="h-px w-full"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  />
                </div>
              ))}

              {/* Shine overlay */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 60%)",
                }}
              />
            </div>

            {/* Bulb at bottom */}
            <div
              className="rounded-full mt-[-4px]"
              style={{
                width: "88px",
                height: "88px",
                background: isComplete
                  ? "radial-gradient(circle at 35% 35%, #FFD700, #E10600)"
                  : "radial-gradient(circle at 35% 35%, #FF4444, #8B0000)",
                border: "3px solid rgba(255,255,255,0.15)",
                boxShadow: `0 0 40px rgba(225,6,0,0.9), 0 0 80px rgba(225,6,0,0.5)`,
              }}
            />
          </div>

          {/* Stats panel */}
          <div className="flex flex-col gap-6 pb-6">
            {/* Big count */}
            <div className="text-center">
              <div
                className="text-9xl font-black leading-none"
                style={{
                  background: isComplete
                    ? "linear-gradient(135deg, #FFD700, #FF6B00)"
                    : "linear-gradient(135deg, #ffffff, #E10600)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "none",
                  filter: `drop-shadow(0 0 20px rgba(225,6,0,0.6))`,
                }}
              >
                {displayCount}
              </div>
              <div className="text-2xl text-white/50 font-bold uppercase tracking-widest mt-1">
                out of {goal}
              </div>
            </div>

            {/* Percentage pill */}
            <div
              className="text-center px-6 py-3 rounded-2xl"
              style={{
                background: "rgba(225,6,0,0.2)",
                border: "1px solid rgba(225,6,0,0.4)",
              }}
            >
              <span className="text-4xl font-black text-white">{displayPct}%</span>
              <span className="text-white/50 text-lg ml-2">complete</span>
            </div>

            {/* Deadline */}
            {deadlineLabel && (
              <div className="text-center">
                <p className="text-white/40 text-sm uppercase tracking-widest">Goal deadline</p>
                <p className="text-white font-bold text-xl">{deadlineLabel}</p>
                {daysLeft !== null && daysLeft > 0 && (
                  <p className="text-[#E10600] font-bold text-lg">
                    {daysLeft} day{daysLeft !== 1 ? "s" : ""} left!
                  </p>
                )}
                {daysLeft === 0 && (
                  <p className="text-yellow-400 font-bold text-lg">Last day!</p>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div>
              <div
                className="rounded-full overflow-hidden"
                style={{
                  height: "12px",
                  width: "260px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${displayPct}%`,
                    background: "linear-gradient(90deg, #8B0000, #E10600, #FF6B00)",
                    boxShadow: "0 0 10px rgba(225,6,0,0.8)",
                    transition: "width 0.05s linear",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white/30 text-xs">0</span>
                <span className="text-white/30 text-xs">{goal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-white/30 text-sm uppercase tracking-widest">
            Tap anywhere to check in
          </p>
        </div>
      </div>

      {/* CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
