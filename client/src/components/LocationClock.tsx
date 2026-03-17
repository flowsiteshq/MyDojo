import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationClockProps {
  timezone: string;
  className?: string;
  label?: string;
}

export function LocationClock({ timezone, className, label = "Current Time" }: LocationClockProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [period, setPeriod] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Use Intl.DateTimeFormat for robust timezone handling
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const parts = formatter.formatToParts(now);
      const hour = parts.find(p => p.type === 'hour')?.value;
      const minute = parts.find(p => p.type === 'minute')?.value;
      const second = parts.find(p => p.type === 'second')?.value;
      const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value;

      setTimeStr(`${hour}:${minute}:${second}`);
      setPeriod(dayPeriod || "");
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!timeStr) return null;

  return (
    <div className={cn("inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-white border border-white/10", className)}>
      <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
      <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}:</span>
      <span className="font-mono font-bold tabular-nums tracking-widest">
        {timeStr} <span className="text-xs ml-0.5 opacity-75">{period}</span>
      </span>
    </div>
  );
}
