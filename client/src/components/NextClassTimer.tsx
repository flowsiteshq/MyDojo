import { DaySchedule } from "@/data/locations";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNextClass } from "@/hooks/useNextClass";

interface NextClassTimerProps {
  schedule?: DaySchedule[];
  timezone?: string;
  className?: string;
}

export function NextClassTimer({ schedule, timezone = "America/Chicago", className }: NextClassTimerProps) {
  const nextClass = useNextClass(schedule, timezone);

  if (!nextClass) return null;

  return (
    <div className={cn("bg-primary text-white p-4 rounded-lg shadow-lg inline-flex items-center gap-4", className)}>
      <div className="bg-white/20 p-2 rounded-full animate-pulse">
        <Clock className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-0.5">
          Next Class Starts In
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-heading font-bold tabular-nums">
            {nextClass.startsIn}
          </span>
          <span className="text-sm font-medium truncate max-w-[200px]">
            • {nextClass.class.name}
          </span>
        </div>
        {!nextClass.isToday && (
          <p className="text-xs opacity-75 mt-1">
            {nextClass.date.toLocaleDateString("en-US", { weekday: "long" })} at {nextClass.class.time}
          </p>
        )}
      </div>
    </div>
  );
}
