import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, Award, Star, Users, Swords, ChevronRight, Bell, ShoppingBag } from "lucide-react";

const EVENTS = [
  {
    date: "Aug 10–14",
    day: "Mon–Fri",
    title: "Spotlight Week",
    subtitle: "Testing Preparation",
    color: "bg-yellow-500",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
    icon: <Star className="h-5 w-5" />,
    details: [
      "Special testing preparation classes all week",
      "Focus on form, technique, and confidence",
      "Intent to Promote form must be submitted BEFORE Aug 10th",
      "Uniform orders (Extra Black or Red Gi) must be placed",
    ],
    cta: { label: "Submit Intent to Promote", href: "/belt-test-intent" },
  },
  {
    date: "Aug 15",
    day: "Friday",
    title: "Belt Test",
    subtitle: "$49 Test Fee",
    color: "bg-[#E10600]",
    textColor: "text-[#E10600]",
    borderColor: "border-[#E10600]/30",
    bgColor: "bg-[#E10600]/10",
    icon: <Award className="h-5 w-5" />,
    details: [
      "Official belt promotion ceremony",
      "Pre-order Sparring Gear, T-Shirts & Apparel",
      "Extra Black or Red Gi available — must be ordered in advance",
      "Test fee: $49 (paid online via Intent to Promote form)",
    ],
    cta: { label: "Register for Belt Test", href: "/belt-test-intent" },
  },
  {
    date: "Aug 21",
    day: "Thursday",
    title: "Parents Night Out",
    subtitle: "6PM – 9:30PM",
    color: "bg-purple-500",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    icon: <Users className="h-5 w-5" />,
    details: [
      "Theme: NINJA WARRIOR COURSE GLOW NIGHT 🌟",
      "Drop off the kids and enjoy a night out!",
      "Admission: Bring a Friend OR $15",
      "Ages: All current MyDojo students",
    ],
    cta: { label: "RSVP for Parents Night Out", href: "/parents-night-out-aug" },
  },
  {
    date: "Aug 22",
    day: "Saturday",
    title: "Seminar with Master Yaeger",
    subtitle: "11AM – 2PM · $29",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    icon: <Swords className="h-5 w-5" />,
    details: [
      "3-hour intensive seminar with Master Yaeger",
      "Advanced techniques and personal instruction",
      "Open to all belt levels",
      "Seminar fee: $29",
    ],
    cta: { label: "Register for Seminar", href: "/master-yaeger-seminar" },
  },
];

const CALENDAR_DAYS = [
  { day: 1, events: [] },
  { day: 2, events: [] },
  { day: 3, events: [] },
  { day: 4, events: [] },
  { day: 5, events: [] },
  { day: 6, events: [] },
  { day: 7, events: [] },
  { day: 8, events: [] },
  { day: 9, events: [] },
  { day: 10, events: ["spotlight"] },
  { day: 11, events: ["spotlight"] },
  { day: 12, events: ["spotlight"] },
  { day: 13, events: ["spotlight"] },
  { day: 14, events: ["spotlight"] },
  { day: 15, events: ["belttest"] },
  { day: 16, events: [] },
  { day: 17, events: [] },
  { day: 18, events: [] },
  { day: 19, events: [] },
  { day: 20, events: [] },
  { day: 21, events: ["pno"] },
  { day: 22, events: ["seminar"] },
  { day: 23, events: [] },
  { day: 24, events: [] },
  { day: 25, events: [] },
  { day: 26, events: [] },
  { day: 27, events: [] },
  { day: 28, events: [] },
  { day: 29, events: [] },
  { day: 30, events: [] },
  { day: 31, events: [] },
];

// August 2026 starts on a Saturday (day 6 in 0-indexed Sun=0)
const START_DAY_OF_WEEK = 6; // Saturday

const EVENT_COLORS: Record<string, string> = {
  spotlight: "bg-yellow-500",
  belttest: "bg-[#E10600]",
  pno: "bg-purple-500",
  seminar: "bg-blue-500",
};

const EVENT_LABELS: Record<string, string> = {
  spotlight: "Spotlight",
  belttest: "Belt Test",
  pno: "PNO",
  seminar: "Seminar",
};

export default function AugustCalendar() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-zinc-950 border-b border-zinc-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E10600]/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E10600]/20 border border-[#E10600]/40 text-[#E10600] text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Calendar className="h-4 w-4" />
            Parent Newsletter
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4">
            AUGUST <span className="text-[#E10600]">2026</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            An exciting month ahead at MyDojo! Belt tests, special events, and a night out for parents. Here's everything you need to know.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Bell className="h-4 w-4" />
            <span>Text reminders will be sent for each event</span>
          </div>
        </div>
      </div>

      {/* Visual Calendar */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold uppercase tracking-wider text-gray-400 mb-4">August 2026 At a Glance</h2>
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase py-3">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before Aug 1 (Saturday = index 6) */}
            {Array.from({ length: START_DAY_OF_WEEK }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[70px] border-b border-r border-zinc-800 bg-zinc-950/50" />
            ))}
            {CALENDAR_DAYS.map(({ day, events }) => {
              const isToday = day === 3; // Aug 3 is today
              return (
                <div
                  key={day}
                  className={`min-h-[70px] border-b border-r border-zinc-800 p-1.5 ${isToday ? "bg-zinc-800/60" : ""} ${(day + START_DAY_OF_WEEK - 1) % 7 === 6 ? "border-r-0" : ""}`}
                >
                  <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#E10600] text-white" : "text-gray-400"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {events.map((ev) => (
                      <div key={ev} className={`${EVENT_COLORS[ev]} text-white text-[9px] font-bold rounded px-1 py-0.5 truncate`}>
                        {EVENT_LABELS[ev]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(EVENT_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-sm text-gray-400">
              <div className={`w-3 h-3 rounded ${EVENT_COLORS[key]}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Event Cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-6">
        <h2 className="text-xl font-bold uppercase tracking-wider text-gray-400">Event Details</h2>
        {EVENTS.map((event) => (
          <div key={event.title} className={`${event.bgColor} border ${event.borderColor} rounded-2xl p-6`}>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className={`${event.color} text-white rounded-xl p-4 text-center min-w-[90px]`}>
                  <div className="text-xs font-bold uppercase opacity-80">{event.day}</div>
                  <div className="text-2xl font-black">{event.date}</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={event.textColor}>{event.icon}</span>
                  <h3 className="text-xl font-black uppercase">{event.title}</h3>
                </div>
                <div className={`text-sm font-bold ${event.textColor} mb-4`}>{event.subtitle}</div>
                <ul className="space-y-2 mb-5">
                  {event.details.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ChevronRight className={`h-4 w-4 ${event.textColor} mt-0.5 shrink-0`} />
                      {d}
                    </li>
                  ))}
                </ul>
                <Link href={event.cta.href}>
                  <Button className={`${event.color} hover:opacity-90 text-white font-bold uppercase tracking-wider`}>
                    {event.cta.label} →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Bo Staff In-Class */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-zinc-700 p-3 rounded-xl">
              <Swords className="h-6 w-6 text-gray-300" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase mb-1">In-Class: Bo Staff Training Begins</h3>
              <p className="text-gray-400 text-sm mb-3">
                This month we begin <strong className="text-white">Bo Staff training</strong> in class! Students will need their own Bo Staff to participate. Available for purchase at the front desk.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <ShoppingBag className="h-4 w-4 text-gray-400" />
                <span>Bo Staffs available for purchase — see the front desk</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="bg-[#E10600] rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-black uppercase mb-2">Don't Miss Out!</h3>
          <p className="text-white/80 mb-6">Register for events early — spots are limited. Questions? We're here to help.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/belt-test-intent">
              <Button className="bg-white text-[#E10600] hover:bg-gray-100 font-bold uppercase tracking-wider px-6">
                Belt Test Intent Form
              </Button>
            </Link>
            <Link href="/parents-night-out-aug">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 font-bold uppercase tracking-wider px-6">
                Parents Night Out RSVP
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
