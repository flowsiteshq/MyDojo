import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { DaySchedule } from "@/data/locations";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Filter } from "lucide-react";
import { openIntakeChatbot } from "@/lib/chatbot";

interface ScheduleWidgetProps {
  schedule: DaySchedule[];
}

export function ScheduleWidget({ schedule }: ScheduleWidgetProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [activeDay, setActiveDay] = useState("Monday");
  const [filter, setFilter] = useState("all");
  const searchString = useSearch();
  const [nextClass, setNextClass] = useState<{ day: string; time: string; name: string; daysUntil: number } | null>(null);

  useEffect(() => {
    // Set active day to current day on load
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (days.includes(today)) {
      setActiveDay(today);
    }

    // Find next class
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Map JS getDay() (0=Sun) to our schedule array order if needed, 
    // but simpler to just iterate through days starting from today
    
    let foundNext = null;

    // Check today and future days
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      const daySchedule = schedule.find(s => s.day === dayName);
      if (!daySchedule) continue;

      // Sort classes by time to ensure we check in order
      const sortedClasses = [...daySchedule.classes].sort((a, b) => {
        const getMinutes = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        return getMinutes(a.time) - getMinutes(b.time);
      });

      for (const cls of sortedClasses) {
        const [time, period] = cls.time.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const classTime = hours * 60 + minutes;

        // If checking today, class must be in future
        // If checking future days, take the first class
        if (i === 0) {
          if (classTime > currentTime) {
            foundNext = { day: dayName, time: cls.time, name: cls.name, daysUntil: i };
            break;
          }
        } else {
          foundNext = { day: dayName, time: cls.time, name: cls.name, daysUntil: i };
          break;
        }
      }
      if (foundNext) break;
    }

    setNextClass(foundNext);
  }, [schedule]);

  // Extract unique programs/age groups for filter
  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    schedule.forEach(day => {
      day.classes.forEach(cls => {
        // Add both name (program) and age group to filters
        options.add(cls.name);
        options.add(cls.ageGroup);
      });
    });
    return Array.from(options).sort();
  }, [schedule]);

  // Initialize filter from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const programParam = params.get("program");
    if (programParam && filterOptions.includes(programParam)) {
      setFilter(programParam);
    }
  }, [searchString, filterOptions]);

  const currentSchedule = schedule.find(s => s.day === activeDay);
  
  const filteredClasses = currentSchedule?.classes.filter(cls => {
    if (filter === "all") return true;
    return cls.name === filter || cls.ageGroup === filter;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Day Selector */}
        <div className="flex flex-wrap gap-2 flex-1">
          {days.map((day) => (
            <Button
              key={day}
              variant={activeDay === day ? "default" : "outline"}
              onClick={() => setActiveDay(day)}
              className={`flex-1 min-w-[80px] ${
                activeDay === day 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {day}
            </Button>
          ))}
        </div>

        {/* Filter */}
        <div className="w-full md:w-auto min-w-[200px]">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-white">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by Program" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs & Ages</SelectItem>
              {filterOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-gray-50 rounded-xl p-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {filteredClasses && filteredClasses.length > 0 ? (
              filteredClasses.map((session, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow ${
                    nextClass && nextClass.day === activeDay && nextClass.time === session.time && nextClass.name === session.name
                      ? "bg-primary/5 border-primary ring-1 ring-primary" 
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`font-bold px-3 py-2 rounded-md min-w-[90px] text-center ${
                      nextClass && nextClass.day === activeDay && nextClass.time === session.time && nextClass.name === session.name
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {session.time}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-lg">{session.name}</h4>
                        {nextClass && nextClass.day === activeDay && nextClass.time === session.time && nextClass.name === session.name && (
                          <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                            {nextClass.daysUntil === 0 ? "Starting Soon" : `Starts in ${nextClass.daysUntil} day${nextClass.daysUntil > 1 ? 's' : ''}`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Users className="w-4 h-4 mr-1" />
                        {session.ageGroup}
                        {session.instructor && (
                          <span className="ml-3 border-l pl-3 border-gray-300">
                            Instr. {session.instructor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0" onClick={openIntakeChatbot}>
                    Book Trial
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>{currentSchedule ? "No classes match your filter." : "No classes scheduled for this day."}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
