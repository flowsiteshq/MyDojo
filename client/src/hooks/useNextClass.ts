import { useState, useEffect } from "react";
import { DaySchedule, ClassSession } from "@/data/locations";

export interface NextClassInfo {
  class: ClassSession;
  startsIn: string;
  isToday: boolean;
  date: Date;
}

export function useNextClass(schedule?: DaySchedule[], timezone: string = "America/Chicago") {
  const [nextClass, setNextClass] = useState<NextClassInfo | null>(null);

  useEffect(() => {
    if (!schedule) return;

    const calculateNextClass = () => {
      const now = new Date();
      
      // robust way to get target timezone parts
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      });

      const parts = formatter.formatToParts(now);
      const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');

      // Construct a date object that represents the "wall clock" time in the target timezone
      // We use the browser's local timezone to hold these values to perform relative math
      const targetNow = new Date(
        getPart('year'),
        getPart('month') - 1,
        getPart('day'),
        getPart('hour'),
        getPart('minute'),
        getPart('second')
      );

      let foundClass: NextClassInfo | null = null;
      let minDiff = Infinity;

      // Helper to parse time string (e.g., "4:30 PM")
      const parseTime = (timeStr: string, baseDate: Date) => {
        const [time, period] = timeStr.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let h = hours;
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        
        const date = new Date(baseDate);
        date.setHours(h, minutes, 0, 0);
        return date;
      };

      // Check today and next 6 days
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(targetNow);
        checkDate.setDate(targetNow.getDate() + i);
        
        // Get the day name for this date (e.g., "Monday")
        // Since checkDate is constructed from target timezone parts, its local day name matches the target day name
        const checkDayName = checkDate.toLocaleDateString("en-US", { weekday: "long" });
        
        const daySchedule = schedule.find(s => s.day === checkDayName);
        if (!daySchedule) continue;

        for (const cls of daySchedule.classes) {
          const classDate = parseTime(cls.time, checkDate);
          const diff = classDate.getTime() - targetNow.getTime();

          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            
            // Format countdown
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            let startsIn = "";
            if (hours > 0) startsIn += `${hours}h `;
            startsIn += `${minutes}m ${seconds}s`;

            foundClass = {
              class: cls,
              startsIn,
              isToday: i === 0,
              date: classDate
            };
          }
        }
        
        if (foundClass && i === 0) break;
        if (foundClass) break;
      }

      setNextClass(foundClass);
    };

    calculateNextClass();
    const interval = setInterval(calculateNextClass, 1000);

    return () => clearInterval(interval);
  }, [schedule, timezone]);

  return nextClass;
}
