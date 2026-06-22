import { useTranslation } from "react-i18next";
import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { DaySchedule } from "@/data/locations";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Filter, LayoutList, CalendarDays } from "lucide-react";
import { openBookFreeClassGate } from "@/lib/chatbot";

interface ScheduleWidgetProps {
  schedule: DaySchedule[];
}

// Color palette for programs in calendar view
const PROGRAM_COLORS: Record<string, string> = {
  "Little Ninjas": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Little Ninjas & Me": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Dragon Kids": "bg-blue-100 text-blue-800 border-blue-200",
  "Dragon Kids & Teens": "bg-blue-100 text-blue-800 border-blue-200",
  "Teens": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Teen Warriors": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Adult Karate": "bg-green-100 text-green-800 border-green-200",
  "Adult Karate + Kickboxing": "bg-green-100 text-green-800 border-green-200",
  "Kickboxing": "bg-red-100 text-red-800 border-red-200",
  "Advanced/Black Belt + Kickboxing": "bg-red-100 text-red-800 border-red-200",
  "After School": "bg-orange-100 text-orange-800 border-orange-200",
  "Summer Camp": "bg-teal-100 text-teal-800 border-teal-200",
  "Intro Class": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Leadership": "bg-purple-100 text-purple-800 border-purple-200",
  "Sparring": "bg-rose-100 text-rose-800 border-rose-200",
  "Weapons Class": "bg-gray-100 text-gray-800 border-gray-200",
  "Women's Self-Defense": "bg-pink-100 text-pink-800 border-pink-200",
  "Family Class": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Instructor Training": "bg-violet-100 text-violet-800 border-violet-200",
  "Demo/Competition Team": "bg-amber-100 text-amber-800 border-amber-200",
};

function getProgramColor(name: string): string {
  return PROGRAM_COLORS[name] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export function ScheduleWidget({ schedule }: ScheduleWidgetProps) {
  const { t } = useTranslation();
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [activeDay, setActiveDay] = useState("Monday");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
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
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let foundNext = null;

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });

      const daySchedule = schedule.find(s => s.day === dayName);
      if (!daySchedule) continue;

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

  // For calendar view: collect all unique time slots across all days
  const allTimeSlots = useMemo(() => {
    const times = new Set<string>();
    schedule.forEach(day => {
      day.classes.forEach(cls => {
        if (filter === "all" || cls.name === filter || cls.ageGroup === filter) {
          times.add(cls.time);
        }
      });
    });
    // Sort by time
    return Array.from(times).sort((a, b) => {
      const getMinutes = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, mins] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + mins;
      };
      return getMinutes(a) - getMinutes(b);
    });
  }, [schedule, filter]);

  return (
    <div className="w-full">
      {/* Controls Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutList className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === "calendar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Calendar
          </button>
        </div>

        {/* Day Selector (list view only) */}
        {viewMode === "list" && (
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
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        )}

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

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          /* ── LIST VIEW ── */
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
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
                        <Button size="sm" variant="outline" className="shrink-0" onClick={openBookFreeClassGate}>
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
          </motion.div>
        ) : (
          /* ── CALENDAR VIEW ── */
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-gray-500 font-semibold w-[100px]">Time</th>
                    {days.map(day => {
                      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                      return (
                        <th
                          key={day}
                          className={`py-3 px-3 text-center font-semibold ${
                            day === today ? "text-primary" : "text-gray-700"
                          }`}
                        >
                          <div>{day.slice(0, 3)}</div>
                          {day === today && (
                            <div className="text-xs font-normal text-primary/70 mt-0.5">Today</div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {allTimeSlots.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No classes match your filter.
                      </td>
                    </tr>
                  ) : (
                    allTimeSlots.map((timeSlot, rowIdx) => (
                      <tr
                        key={timeSlot}
                        className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      >
                        <td className="py-3 px-4 font-semibold text-gray-600 whitespace-nowrap border-r border-gray-100">
                          {timeSlot}
                        </td>
                        {days.map(day => {
                          const daySchedule = schedule.find(s => s.day === day);
                          const classesAtTime = daySchedule?.classes.filter(cls => {
                            if (cls.time !== timeSlot) return false;
                            if (filter === "all") return true;
                            return cls.name === filter || cls.ageGroup === filter;
                          }) ?? [];

                          const isNextClass = classesAtTime.some(
                            cls => nextClass && nextClass.day === day && nextClass.time === timeSlot && nextClass.name === cls.name
                          );

                          return (
                            <td
                              key={day}
                              className={`py-2 px-2 align-top border-r border-gray-100 last:border-r-0 ${
                                isNextClass ? "bg-primary/5" : ""
                              }`}
                            >
                              {classesAtTime.length > 0 ? (
                                <div className="space-y-1">
                                  {classesAtTime.map((cls, i) => (
                                    <button
                                      key={i}
                                      onClick={openBookFreeClassGate}
                                      className={`w-full text-left rounded-md border px-2 py-1.5 text-xs font-medium leading-tight hover:opacity-80 transition-opacity ${getProgramColor(cls.name)}`}
                                    >
                                      <div className="font-semibold truncate">{cls.name}</div>
                                      <div className="opacity-70 truncate">{cls.ageGroup}</div>
                                      {isNextClass && nextClass?.name === cls.name && (
                                        <div className="text-[10px] font-bold uppercase tracking-wide text-primary mt-0.5">
                                          {nextClass.daysUntil === 0 ? "Soon" : `In ${nextClass.daysUntil}d`}
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-gray-200 text-center py-1">—</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">Click any class to book a free trial</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
