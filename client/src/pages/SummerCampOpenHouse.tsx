import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, Clock, MapPin, Users, Star, ChevronRight, Flame } from "lucide-react";
import { motion } from "framer-motion";

const scheduleItems = [
  { time: "8:00 AM", label: "Drop Off", icon: "🚗", description: "Doors open — kids check in and get settled" },
  { time: "9:00 AM", label: "Martial Arts Training", icon: "🥋", description: "Karate & kickboxing fundamentals with expert instructors" },
  { time: "11:00 AM", label: "Games & Challenges", icon: "🎯", description: "Ninja obstacle courses, team competitions & fun drills" },
  { time: "12:00 PM", label: "Lunch Time", icon: "🍕", description: "Bring your own lunch or add our lunch option" },
  { time: "1:00 PM", label: "Team Activities", icon: "🏆", description: "Group games, leadership challenges & themed adventures" },
  { time: "5:30 PM", label: "Pick Up", icon: "🏠", description: "Safe dismissal — daily recap shared with parents" },
];

const themeWeeks = [
  { dates: "June 3–7", name: "Ninja Warrior Week", desc: "Obstacle courses, speed challenges & ninja games!", emoji: "🥷", color: "from-red-600 to-red-800" },
  { dates: "June 10–14", name: "Water War Week", desc: "Water games, slip n' slide & splash battles!", emoji: "💦", color: "from-blue-600 to-blue-800" },
  { dates: "June 17–21", name: "Board Breaking Week", desc: "Break barriers & boards. Build power & confidence!", emoji: "🪵", color: "from-yellow-600 to-yellow-800" },
  { dates: "June 24–28", name: "Nerf Battle Week", desc: "Team battles, missions & strategy challenges!", emoji: "🎯", color: "from-green-600 to-green-800" },
  { dates: "July 1–5", name: "Glow Night Week", desc: "Glow games, lasers & epic night adventures!", emoji: "✨", color: "from-purple-600 to-purple-800" },
  { dates: "July 10–14", name: "Leadership Week", desc: "Life skills, team building & community service!", emoji: "⭐", color: "from-orange-600 to-orange-800" },
  { dates: "July 17–21", name: "Tournament Prep Week", desc: "Sparring, drills & championship mindset training!", emoji: "🏅", color: "from-gray-600 to-gray-800" },
];

export default function SummerCampOpenHouse() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-black text-white">

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/summer-camp/hero-colorful.jpg"
            alt="MyDojo Summer Camp"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center py-20">
          {/* Event Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold uppercase tracking-widest px-4 py-2 mb-6 rounded-full"
          >
            <Calendar className="w-4 h-4" />
            Special Event — You're Invited!
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-heading font-black mb-4 leading-tight"
          >
            SUMMER CAMP
            <span className="block text-primary">OPEN HOUSE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Come meet our instructors, tour the facility, and register your child for the most epic summer ever!
          </motion.p>

          {/* Event Details Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
          >
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
              <Calendar className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Date</p>
                <p className="font-bold text-lg">Wednesday, May 27th</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
              <Clock className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Time</p>
                <p className="font-bold text-lg">6:00 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
              <MapPin className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Location</p>
                <p className="font-bold text-lg">MyDojo Friendswood</p>
              </div>
            </div>
          </motion.div>

          {/* Urgency Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center gap-2 bg-yellow-500 text-black font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-full mb-8"
          >
            <Flame className="w-4 h-4" />
            Only 12 Spots Remaining — Register at the Open House!
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/summer-camp">
              <Button className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider">
                View Summer Camp Details <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/summer-camp/enroll">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider bg-transparent">
                Enroll Now — $49 for 3 Days
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What to Expect at Open House */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Open House Night</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-black">WHAT TO EXPECT</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: "🥋", title: "Meet the Instructors", desc: "Get to know the coaches who will be leading your child through an amazing summer of martial arts, games, and growth." },
              { icon: "🏛️", title: "Tour the Facility", desc: "See our state-of-the-art training floor, mat areas, and all the spaces where the magic happens every day." },
              { icon: "📋", title: "Register On the Spot", desc: "Spots are extremely limited. Come ready to enroll and lock in your child's spot before they're gone!" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-heading font-bold mb-3">{item.title}</h4>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Camp Program</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-black">A DAY AT SUMMER CAMP</h3>
            <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">Every day is packed with martial arts, games, teamwork, and fun. Here's what a typical camp day looks like:</p>
          </div>

          <div className="max-w-3xl mx-auto">
            {scheduleItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6 mb-6 last:mb-0"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-xl font-bold flex-shrink-0 text-white">
                    {item.icon}
                  </div>
                  {i < scheduleItems.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/30 mt-2 min-h-[2rem]" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-6 flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-primary font-bold text-lg font-heading">{item.time}</span>
                    <span className="text-white font-bold text-xl font-heading uppercase">{item.label}</span>
                  </div>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Camp Photo */}
      <section className="relative h-64 md:h-96 overflow-hidden">
        <img
          src="/images/summer-camp/kids-training.jpg"
          alt="Kids training at MyDojo Summer Camp"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl md:text-5xl font-heading font-black max-w-lg">
              CONFIDENCE. FRIENDSHIP. <span className="text-primary">FUN.</span>
            </h3>
          </div>
        </div>
      </section>

      {/* Theme Weeks */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Summer 2026</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-black">EPIC THEME WEEKS</h3>
            <p className="text-gray-400 mt-4 text-lg">Each week is a brand new adventure. Pick your weeks at the Open House!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {themeWeeks.map((week, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`bg-gradient-to-br ${week.color} rounded-xl p-6 border border-white/10`}
              >
                <div className="text-4xl mb-3">{week.emoji}</div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">{week.dates}</p>
                <h4 className="font-heading font-black text-lg mb-2 text-white">{week.name}</h4>
                <p className="text-sm text-white/80">{week.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Photo */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src="/images/summer-camp/activities-colorful.jpg"
          alt="Summer camp activities"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <p className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Limited Availability</p>
            <h3 className="text-4xl md:text-6xl font-heading font-black">SPOTS ARE FILLING FAST!</h3>
            <p className="text-gray-300 text-xl mt-3">Only 12 spots remaining for Summer 2026</p>
          </div>
        </div>
      </section>

      {/* Why MyDojo */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Why Choose Us</h2>
              <h3 className="text-4xl md:text-5xl font-heading font-black mb-8">WHY PARENTS LOVE MYDOJO</h3>
              <div className="space-y-5">
                {[
                  { icon: "🛡️", title: "Safe & Secure", desc: "A structured, supervised environment parents can trust." },
                  { icon: "⚡", title: "Active & Engaging", desc: "High-energy activities that keep kids moving and learning all day." },
                  { icon: "⭐", title: "Build Confidence", desc: "Martial arts training that builds focus, respect & self-esteem." },
                  { icon: "👥", title: "Make New Friends", desc: "Kids build friendships and social skills in a positive community." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="bg-zinc-900 p-3 rounded-lg text-2xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="/images/summer-camp/group-activity.jpg"
                alt="Kids enjoying summer camp"
                className="rounded-2xl w-full h-auto shadow-2xl"
              />
              <div className="absolute -bottom-4 -right-4 bg-primary text-white rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-white" />
                  <span className="font-bold text-lg">500+ Families</span>
                </div>
                <p className="text-sm text-white/80">Trust MyDojo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/summer-camp/hero.jpg')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-black/30 text-white text-sm font-bold uppercase tracking-widest px-4 py-2 mb-6 rounded-full">
            <Calendar className="w-4 h-4" />
            Wednesday, May 27th at 6:00 PM
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-black mb-6">
            JOIN US AT THE OPEN HOUSE!
          </h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
            Meet our coaches, see the facility, and secure your child's spot before summer camp fills up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/summer-camp/enroll">
              <Button className="bg-white text-primary hover:bg-black hover:text-white text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider shadow-xl">
                Enroll Now — 3 Days for $49
              </Button>
            </Link>
            <a href="tel:8774693656">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider bg-transparent">
                Call (877) 4-MYDOJO
              </Button>
            </a>
          </div>
          <p className="mt-8 text-white/70 text-sm">
            MyDojo Friendswood · <Users className="inline w-4 h-4" /> Only 12 spots remaining
          </p>
        </div>
      </section>

    </div>
  );
}
