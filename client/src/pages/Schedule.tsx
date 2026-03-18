import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/lib/calendar";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";

export default function Schedule() {
  const scheduleData = [
    { program: "Little Ninjas (Ages 3-5)", mon: "5:00PM", tue: "5:00PM", wed: "5:00PM", thu: "5:00PM", fri: "N/A", sat: "10:00AM" },
    { program: "Little Ninjas & Me", mon: "N/A", tue: "N/A", wed: "2:00PM", thu: "N/A", fri: "2:00PM", sat: "N/A" },
    { program: "Dragon Kids (Ages 5-12)", mon: "4:00PM", tue: "4:00PM, 6:00PM", wed: "4:00PM", thu: "4:00PM, 6:00PM", fri: "N/A", sat: "10:45AM" },
    { program: "Dragon Kids & Teens (Noon)", mon: "12:00PM", tue: "N/A", wed: "12:00PM", thu: "N/A", fri: "12:00PM", sat: "N/A" },
    { program: "Intro Class (New Students)", mon: "5:00PM", tue: "5:00PM", wed: "5:00PM", thu: "5:00PM", fri: "N/A", sat: "N/A" },
    { program: "Teen Warriors (Ages 12-17)", mon: "6:00PM", tue: "N/A", wed: "6:00PM", thu: "N/A", fri: "N/A", sat: "12:15PM" },
    { program: "Adult Karate + Kickboxing", mon: "N/A", tue: "7:00PM", wed: "N/A", thu: "7:00PM", fri: "N/A", sat: "N/A" },
    { program: "Advanced/Black Belt + Kickboxing", mon: "N/A", tue: "N/A", wed: "7:00PM", thu: "N/A", fri: "N/A", sat: "N/A" },
    { program: "Kickboxing (Dojo 2)", mon: "12:00PM, 7:00PM", tue: "8:00PM", wed: "12:00PM", thu: "8:00PM", fri: "12:00PM", sat: "9:00AM" },
    { program: "Women's Self-Defense", mon: "N/A", tue: "N/A", wed: "N/A", thu: "12:00PM", fri: "N/A", sat: "N/A" },
    { program: "Leadership (Advanced)", mon: "N/A", tue: "N/A", wed: "N/A", thu: "N/A", fri: "5:00PM", sat: "N/A" },
    { program: "Sparring (Advanced)", mon: "N/A", tue: "N/A", wed: "N/A", thu: "N/A", fri: "6:00PM", sat: "N/A" },
    { program: "Weapons Class (Advanced)", mon: "N/A", tue: "N/A", wed: "N/A", thu: "N/A", fri: "7:00PM", sat: "N/A" },
    { program: "Family Class (All Ages)", mon: "N/A", tue: "N/A", wed: "N/A", thu: "N/A", fri: "N/A", sat: "11:30AM" },
    { program: "Instructor Training", mon: "N/A", tue: "N/A", wed: "N/A", thu: "N/A", fri: "N/A", sat: "8:00AM" },
    { program: "Demo/Competition Team", mon: "N/A", tue: "N/A", wed: "N/A", thu: "N/A", fri: "N/A", sat: "1:00PM" },
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

  // Helper function to parse time string and create a Date object for the next occurrence
  const parseTimeToDate = (timeStr: string, dayIndex: number): Date | null => {
    if (timeStr === "N/A") return null;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Convert our dayIndex (0 = Monday) to JS day (1 = Monday)
    const targetDay = dayIndex + 1;
    
    // Calculate days until next occurrence
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7; // If it's today or past, go to next week

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntil);

    // Parse time
    const timeMatch = timeStr.match(/(\d+):?(\d+)?\s*(AM|PM|NOON)?/i);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toUpperCase();

    if (period === "NOON") {
      hours = 12;
    } else if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate;
  };

  // Helper to create calendar event
  const createCalendarEvent = (program: string, timeStr: string, dayIndex: number): CalendarEvent | null => {
    const startTime = parseTimeToDate(timeStr, dayIndex);
    if (!startTime) return null;

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // Assume 1-hour classes

    return {
      title: `${program} Class at MyDojo`,
      description: `Join us for ${program} class at MyDojo. Bring your energy and enthusiasm!`,
      location: "MyDojo Martial Arts & Fitness",
      startTime,
      endTime,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Class Schedule"
        description="View our weekly martial arts class schedule in Tomball. Classes for Little Ninjas, Dragon Kids, Teens, Adults, and Kickboxing. Download to your calendar and never miss a class!"
        keywords="martial arts class schedule, karate class times, kickboxing schedule Tomball, kids martial arts schedule, weekly class schedule, martial arts timetable, class calendar, training schedule"
      />
      <SchemaMarkup
        type="BreadcrumbList"
        items={[
          { name: "Home", url: "/" },
          { name: "Class Schedule", url: "/schedule" },
        ]}
      />
      {/* Recurring class events for Google rich results */}
      <SchemaMarkup type="Event" name="Little Ninjas Martial Arts Class (Ages 3-5)" description="Martial arts for preschoolers ages 3-5 at MyDojo Tomball. Focuses on listening skills, balance, and coordination." startDate="2026-03-09T17:00:00-05:00" endDate="2026-03-09T17:30:00-05:00" isRecurring={true} url="https://www.mydojoma.com/schedule" />
      <SchemaMarkup type="Event" name="Dragon Kids Martial Arts Class (Ages 5-12)" description="Martial arts for kids ages 5-12 at MyDojo Tomball. Builds confidence, discipline, and self-defense skills." startDate="2026-03-09T16:00:00-05:00" endDate="2026-03-09T16:45:00-05:00" isRecurring={true} url="https://www.mydojoma.com/schedule" />
      <SchemaMarkup type="Event" name="Fitness Kickboxing Class" description="High-energy kickboxing at MyDojo Tomball. Burn 800+ calories per session. All fitness levels welcome." startDate="2026-03-10T19:00:00-05:00" endDate="2026-03-10T20:00:00-05:00" isRecurring={true} url="https://www.mydojoma.com/schedule" />
      <SchemaMarkup type="Event" name="Teen Warriors Martial Arts (Ages 12-17)" description="Martial arts for teens ages 12-17 at MyDojo Tomball. Traditional techniques, modern self-defense, and leadership." startDate="2026-03-09T18:00:00-05:00" endDate="2026-03-09T19:00:00-05:00" isRecurring={true} url="https://www.mydojoma.com/schedule" />
      <SchemaMarkup type="Event" name="Adult Karate + Kickboxing" description="Adult martial arts combining traditional karate and kickboxing at MyDojo Tomball. For all skill levels." startDate="2026-03-10T19:00:00-05:00" endDate="2026-03-10T20:00:00-05:00" isRecurring={true} url="https://www.mydojoma.com/schedule" />
      <SchemaMarkup type="Event" name="Women's Self-Defense Class" description="Practical self-defense techniques for women at MyDojo Tomball. Build confidence and situational awareness." startDate="2026-03-12T12:00:00-05:00" endDate="2026-03-12T13:00:00-05:00" isRecurring={true} url="https://www.mydojoma.com/schedule" />     {/* Header */}
      <div className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">CLASS SCHEDULE</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find a class time that fits your busy lifestyle. Click any class to add it to your calendar!
          </p>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto rounded-xl shadow-2xl border border-gray-100"
        >
          <table className="w-full min-w-[800px] border-collapse bg-white">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-6 text-left font-heading text-xl font-bold border-b border-gray-800 sticky left-0 bg-black z-10">Program</th>
                {days.map(day => (
                  <th key={day} className="p-6 text-center font-heading text-lg font-bold border-b border-gray-800 border-l border-gray-800">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`
                    transition-colors hover:bg-gray-50
                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  `}
                >
                  <td className="p-6 font-bold text-lg border-b border-gray-100 sticky left-0 bg-inherit z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {row.program}
                  </td>
                  {dayKeys.map((dayKey, dayIndex) => {
                    const timeStr = row[dayKey];
                    const event = createCalendarEvent(row.program, timeStr, dayIndex);
                    
                    return (
                      <td key={dayKey} className="p-4 text-center border-b border-l border-gray-100">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-gray-600 font-medium text-sm">{timeStr}</span>
                          {event && (
                            <AddToCalendarButton 
                              event={event} 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 px-2"
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="mt-8 text-center flex flex-col items-center gap-6">
          <p className="text-gray-500">*Class schedules are subject to change. Updated February 2026</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <a href="/MyDojo_Schedule.pdf" download="MyDojo_Schedule.pdf">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 px-8 py-6 h-auto font-heading uppercase tracking-wider text-lg skew-x-[-10deg]">
                <span className="skew-x-[10deg] flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Download PDF
                </span>
              </Button>
            </a>

            <Button className="bg-primary hover:bg-primary/90 text-white px-10 py-6 h-auto font-heading uppercase tracking-wider text-lg skew-x-[-10deg]">
              <span className="skew-x-[10deg]">Book Your First Class</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
