/**
 * SocialProofTicker.tsx
 * Real-time social proof notifications showing recent enrollments.
 * Displays as a bottom-left toast-style popup that cycles through recent signups.
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Users, X } from "lucide-react";

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

const PROGRAM_COLORS: Record<string, string> = {
  "Little Ninjas": "#7C3AED",
  "Kids Martial Arts": "#1D4ED8",
  "Teens & Adults Martial Arts": "#B91C1C",
  "Adult Karate": "#1F2937",
  "Kickboxing Fitness": "#15803D",
  "After School Program": "#D97706",
  "Summer Camp": "#0891B2",
};

export function SocialProofTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [items, setItems] = useState<ProofItem[]>([]);

  const { data: recentEnrollments } = trpc.heroContent.getRecentEnrollments.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (recentEnrollments && recentEnrollments.length > 0) {
      setItems(recentEnrollments);
    } else {
      // Use fallback items with fake IDs
      setItems(FALLBACK_ITEMS.map((item, i) => ({ ...item, id: -(i + 1) })));
    }
  }, [recentEnrollments]);

  const showNext = useCallback(() => {
    if (dismissed || items.length === 0) return;
    setVisible(true);
    // Hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => clearTimeout(hideTimer);
  }, [dismissed, items.length]);

  useEffect(() => {
    if (items.length === 0) return;

    // Initial delay before first notification
    const initialDelay = setTimeout(() => {
      showNext();
    }, 8000);

    return () => clearTimeout(initialDelay);
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0 || dismissed) return;

    // Cycle through items every 12 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      showNext();
    }, 12000);

    return () => clearInterval(interval);
  }, [items.length, dismissed, showNext]);

  if (dismissed || items.length === 0) return null;

  const current = items[currentIndex];
  if (!current) return null;

  const programColor = PROGRAM_COLORS[current.program] || "#E10600";

  return (
    <div
      className={`fixed bottom-6 left-4 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ maxWidth: "320px" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        style={{ borderLeft: `4px solid ${programColor}` }}
      >
        <div className="flex items-start gap-3 p-3 pr-8 relative">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: programColor }}
          >
            <Users className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {current.displayName}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Just enrolled in{" "}
              <span className="font-medium" style={{ color: programColor }}>
                {current.program}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{current.timeAgo}</p>
          </div>

          {/* Close */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full transition-all ease-linear"
            style={{
              backgroundColor: programColor,
              width: visible ? "0%" : "100%",
              transitionDuration: visible ? "5000ms" : "0ms",
            }}
          />
        </div>
      </div>
    </div>
  );
}
