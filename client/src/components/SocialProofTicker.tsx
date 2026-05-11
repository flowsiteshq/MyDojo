/**
 * SocialProofTicker.tsx
 * Real-time social proof notifications showing recent enrollments.
 * Premium dark glassmorphism style with animated entrance.
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { X, Flame, Zap, Shield, Star, Trophy, Users } from "lucide-react";

interface ProofItem {
  id: number;
  displayName: string;
  program: string;
  timeAgo: string;
  message: string;
}

// Fallback items in case DB has no recent signups
const FALLBACK_ITEMS: Omit<ProofItem, "id">[] = [
  { displayName: "Maria S.", program: "Little Ninjas", timeAgo: "2h ago", message: "Maria S. just signed up for Little Ninjas!" },
  { displayName: "James T.", program: "Kids Martial Arts", timeAgo: "4h ago", message: "James T. just signed up for Kids Martial Arts!" },
  { displayName: "Priya K.", program: "Kickboxing Fitness", timeAgo: "yesterday", message: "Priya K. just signed up for Kickboxing Fitness!" },
  { displayName: "Carlos M.", program: "Teens & Adults Martial Arts", timeAgo: "2 days ago", message: "Carlos M. just signed up for Teens & Adults Martial Arts!" },
  { displayName: "Ashley R.", program: "Adult Karate", timeAgo: "3 days ago", message: "Ashley R. just signed up for Adult Karate!" },
  { displayName: "Destiny L.", program: "Little Ninjas", timeAgo: "3 days ago", message: "Destiny L. just signed up for Little Ninjas!" },
];

interface ProgramConfig {
  color: string;
  gradient: string;
  icon: React.ReactNode;
  emoji: string;
}

const PROGRAM_CONFIG: Record<string, ProgramConfig> = {
  "Little Ninjas":               { color: "#a855f7", gradient: "from-purple-600 to-purple-400",   icon: <Star className="w-4 h-4" />,   emoji: "⭐" },
  "Kids Martial Arts":           { color: "#3b82f6", gradient: "from-blue-600 to-blue-400",       icon: <Shield className="w-4 h-4" />, emoji: "🥋" },
  "Teens & Adults Martial Arts": { color: "#ef4444", gradient: "from-red-600 to-red-400",         icon: <Flame className="w-4 h-4" />,  emoji: "🔥" },
  "Adult Karate":                { color: "#f97316", gradient: "from-orange-600 to-orange-400",   icon: <Zap className="w-4 h-4" />,    emoji: "⚡" },
  "Kickboxing Fitness":          { color: "#22c55e", gradient: "from-green-600 to-green-400",     icon: <Zap className="w-4 h-4" />,    emoji: "💪" },
  "After School Program":        { color: "#eab308", gradient: "from-yellow-600 to-yellow-400",   icon: <Trophy className="w-4 h-4" />, emoji: "🏆" },
  "Summer Camp":                 { color: "#06b6d4", gradient: "from-cyan-600 to-cyan-400",       icon: <Star className="w-4 h-4" />,   emoji: "🏕️" },
};

const DEFAULT_CONFIG: ProgramConfig = {
  color: "#E10600",
  gradient: "from-red-600 to-red-400",
  icon: <Users className="w-4 h-4" />,
  emoji: "🥊",
};

/** Get initials from display name like "Maria S." → "MS" */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SocialProofTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [items, setItems] = useState<ProofItem[]>([]);
  const [progress, setProgress] = useState(100);

  const { data: recentEnrollments } = trpc.heroContent.getRecentEnrollments.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (recentEnrollments && recentEnrollments.length > 0) {
      setItems(recentEnrollments);
    } else {
      setItems(FALLBACK_ITEMS.map((item, i) => ({ ...item, id: -(i + 1) })));
    }
  }, [recentEnrollments]);

  const showNext = useCallback(() => {
    if (dismissed || items.length === 0) return;
    setProgress(100);
    setVisible(true);
    // Animate progress bar down
    const start = Date.now();
    const duration = 5000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, duration);
    return () => clearTimeout(hideTimer);
  }, [dismissed, items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    const initialDelay = setTimeout(() => { showNext(); }, 6000);
    return () => clearTimeout(initialDelay);
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0 || dismissed) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      showNext();
    }, 12000);
    return () => clearInterval(interval);
  }, [items.length, dismissed, showNext]);

  if (dismissed || items.length === 0) return null;

  const current = items[currentIndex];
  if (!current) return null;

  const cfg = PROGRAM_CONFIG[current.program] ?? DEFAULT_CONFIG;

  return (
    <div
      className={`fixed bottom-6 left-4 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      }`}
      style={{ maxWidth: "300px", minWidth: "260px" }}
    >
      {/* Main card — dark glass */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(20,20,20,0.97) 0%, rgba(30,30,30,0.97) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Colored glow strip at top */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
        />

        {/* Subtle background glow */}
        <div
          className="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ background: cfg.color }}
        />

        <div className="flex items-start gap-3 p-4 pr-9">
          {/* Avatar circle with gradient */}
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm bg-gradient-to-br ${cfg.gradient} shadow-lg`}
            style={{ boxShadow: `0 4px 16px ${cfg.color}55` }}
          >
            {getInitials(current.displayName)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* "JUST ENROLLED" badge */}
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                style={{ background: `${cfg.color}22`, color: cfg.color }}
              >
                {cfg.emoji} Just Enrolled
              </span>
            </div>

            <p className="text-white font-bold text-sm leading-tight">
              {current.displayName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              signed up for{" "}
              <span className="font-semibold" style={{ color: cfg.color }}>
                {current.program}
              </span>
            </p>
            <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#22c55e" }}
              />
              {current.timeAgo}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 rounded-full p-0.5 transition-colors"
            style={{ color: "rgba(255,255,255,0.25)" }}
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 mx-4 mb-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
