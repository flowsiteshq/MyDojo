import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OpenStatusBadgeProps {
  hours: string[];
  timezone?: string;
  className?: string;
  onStatusChange?: (status: StatusState) => void;
}

export type StatusState = "open" | "closed" | "closing-soon";

export function OpenStatusBadge({ hours, timezone = "America/Chicago", className, onStatusChange }: OpenStatusBadgeProps) {
  const [status, setStatus] = useState<StatusState | null>(null);
  const [statusText, setStatusText] = useState<string>("");

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const targetTimeStr = now.toLocaleString("en-US", { timeZone: timezone });
      const targetNow = new Date(targetTimeStr);
      
      const currentDay = targetNow.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue, etc.
      const currentHour = targetNow.getHours();
      const currentMinute = targetNow.getMinutes();
      const currentTimeValue = currentHour * 60 + currentMinute;

      let todayHoursStr = "";

      // Find today's hours string
      for (const h of hours) {
        // Handle "Mon-Thu" format
        // We split by ": " first to separate days from time
        const [daysPart, timeRange] = h.split(": ");
        
        if (daysPart.includes("-")) {
          const [startDay, endDay] = daysPart.split("-");
          
          const daysMap: Record<string, number> = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0 };
          const currentDayNum = targetNow.getDay(); // 0 = Sun, 1 = Mon
          
          const startNum = daysMap[startDay];
          const endNum = daysMap[endDay];
          
          // Simple range check (assuming no wrap around Sunday-Monday for now as per data)
          if (currentDayNum >= startNum && currentDayNum <= endNum) {
            todayHoursStr = timeRange;
            break;
          }
        } 
        // Handle single day "Fri", "Sat"
        else if (h.startsWith(currentDay)) {
          todayHoursStr = h.split(": ")[1];
          break;
        }
      }

      if (!todayHoursStr || todayHoursStr === "Closed") {
        setStatus("closed");
        setStatusText("Closed");
        onStatusChange?.("closed");
        return;
      }

      // Parse time range "12:00 PM - 9:00 PM"
      const [startStr, endStr] = todayHoursStr.split(" - ");
      
      const parseTime = (t: string) => {
        const [time, period] = t.split(" ");
        const [h, m] = time.split(":").map(Number);
        let hours = h;
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return hours * 60 + m;
      };

      const startTime = parseTime(startStr);
      const endTime = parseTime(endStr);

      if (currentTimeValue >= startTime && currentTimeValue < endTime) {
        // Check if closing soon (within 30 minutes)
        if (endTime - currentTimeValue <= 30) {
          setStatus("closing-soon");
          setStatusText(`Closing Soon • Closes at ${endStr}`);
          onStatusChange?.("closing-soon");
        } else {
          setStatus("open");
          setStatusText(`Open Now • Closes at ${endStr}`);
          onStatusChange?.("open");
        }
      } else {
        setStatus("closed");
        setStatusText("Closed");
        onStatusChange?.("closed");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [hours, timezone]);

  if (status === null) return null;

  const getStatusStyles = (s: StatusState) => {
    switch (s) {
      case "open":
        return "bg-green-100 text-green-700 border-green-200";
      case "closing-soon":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "closed":
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  const getDotStyles = (s: StatusState) => {
    switch (s) {
      case "open":
        return "bg-green-500 animate-pulse";
      case "closing-soon":
        return "bg-orange-500 animate-pulse";
      case "closed":
        return "bg-red-500";
    }
  };

  return (
    <div className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
      getStatusStyles(status),
      className
    )}>
      <span className={cn(
        "w-2 h-2 rounded-full mr-2",
        getDotStyles(status)
      )}></span>
      {statusText}
    </div>
  );
}
