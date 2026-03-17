import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Clock, Calendar, Users, Trophy, Flame, Shield, Heart, MapPin, Waves } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { openIntakeChatbot } from "@/lib/chatbot";

export default function SummerCamp() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const weeklyThemes = [
    { 
      dates: "June 5-9", 
      theme: "Kickstart Karate Week", 
      fieldTrip: "Trampoline Park Adventure",
      available: true,
      color: "from-red-500 to-orange-500",
      image: "/images/camp-weeks/karate-kids.jpg"
    },
    { 
      dates: "June 12-16", 
      theme: "Self-Defense Mastery", 
      fieldTrip: "Local Police Station Tour",
      available: true,
      color: "from-blue-400 to-cyan-400",
      image: "/images/camp-weeks/self-defense.jpg"
    },
    { 
      dates: "June 19-23", 
      theme: "Board Breaking Challenge", 
      fieldTrip: "Martial Arts Museum",
      available: true,
      color: "from-yellow-400 to-orange-500",
      image: "/images/camp-weeks/board-breaking.jpg"
    },
    { 
      dates: "June 26-30", 
      theme: "Weapons Training Week", 
      fieldTrip: "Medieval Times Experience",
      available: true,
      color: "from-orange-500 to-red-400",
      image: "/images/camp-weeks/weapons.jpg"
    },
    { 
      dates: "July 3-7", 
      theme: "Independence Day Special", 
      fieldTrip: "Fireworks & Field Games",
      available: true,
      color: "from-blue-600 to-red-600",
      image: "/images/camp-weeks/independence-day.jpg"
    },
    { 
      dates: "July 10-14", 
      theme: "Tournament Prep Week", 
      fieldTrip: "Professional Dojo Visit",
      available: true,
      color: "from-blue-500 to-indigo-500",
      image: "/images/camp-weeks/tournament.jpg"
    },
    { 
      dates: "July 17-21", 
      theme: "Leadership & Life Skills", 
      fieldTrip: "Community Service Day",
      available: true,
      color: "from-yellow-400 to-amber-500",
      image: "/images/camp-weeks/leadership.jpg"
    },
    { 
      dates: "July 24-28", 
      theme: "Water Warriors Week", 
      fieldTrip: "Water Park Day!",
      available: true,
      color: "from-cyan-400 to-blue-500",
      image: "/images/camp-weeks/water-park.jpg"
    },
    { 
      dates: "July 31 - Aug 4", 
      theme: "Black Belt Bootcamp", 
      fieldTrip: "Championship Tournament",
      available: true,
      color: "from-orange-600 to-yellow-500",
      image: "/images/camp-weeks/black-belt.jpg"
    },
    { 
      dates: "Aug 7-10", 
      theme: "Summer Finale Celebration", 
      fieldTrip: "Awards Ceremony & Pizza Party",
      available: true,
      color: "from-purple-500 to-pink-500",
      image: "/images/camp-weeks/finale.jpg"
    },
  ];

  const benefits = [
    { icon: Calendar, title: "New Themes Each Week", description: "Every week brings a new adventure to keep things fun, fresh, and exciting", color: "bg-yellow-100 text-yellow-600" },
    { icon: Trophy, title: "Indoor Activities & Challenges", description: "Martial arts, games, obstacle courses, and team-based challenges—all air-conditioned!", color: "bg-orange-100 text-orange-600" },
    { icon: Clock, title: "Half Day & Full Day Options", description: "Flexible scheduling: morning (8AM-12PM), afternoon (1PM-5PM), or full-day (8AM-4PM)", color: "bg-blue-100 text-blue-600" },
    { icon: Users, title: "All Levels - No Experience Needed", description: "Great for beginners and experienced students alike—everyone is welcome!", color: "bg-green-100 text-green-600" },
    { icon: Waves, title: "Water Activities & Field Trips", description: "Cool off with water games and exciting weekly field trip adventures", color: "bg-cyan-100 text-cyan-600" },
    { icon: Heart, title: "Ages 5-14 Welcome", description: "Age-appropriate programming designed for elementary and middle school kids", color: "bg-pink-100 text-pink-600" },
  ];

  const dailySchedule = [
    { time: "8:00 AM", activity: "Drop-off & Warm-up Games", icon: "☀️" },
    { time: "8:30 AM", activity: "Martial Arts Training Session 1", icon: "🥋" },
    { time: "10:00 AM", activity: "Snack Break & Hydration", icon: "🍎" },
    { time: "10:30 AM", activity: "Life Skills Workshop", icon: "🧠" },
    { time: "11:30 AM", activity: "Martial Arts Training Session 2", icon: "💪" },
    { time: "12:30 PM", activity: "Lunch (Bring your own)", icon: "🥪" },
    { time: "1:00 PM", activity: "Fun Activities & Games", icon: "🎮" },
    { time: "2:30 PM", activity: "Water Play / Outdoor Activities", icon: "💦" },
    { time: "4:00 PM", activity: "Afternoon Snack & Free Play", icon: "🍪" },
    { time: "4:30 PM", activity: "Team Challenges & Group Games", icon: "🏆" },
    { time: "5:30 PM", activity: "Cool Down & Stretching", icon: "🧘" },
    { time: "6:00 PM", activity: "Pick-up", icon: "👋" },
  ];

  return (
    <>
      <SEO
        title="Summer Camp 2026 - Martial Arts Training for Kids"
        description="Join MyDojo's action-packed Summer Camp! Week-long programs combining martial arts training, life skills, and fun activities for ages 5-14. Register now for summer 2026!"
      />

      <div className="flex flex-col w-full">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/summer-camp/hero-colorful.jpg"
              alt="MyDojo Summer Camp"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 via-yellow-500/80 to-blue-500/70"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeIn}
              className="max-w-3xl"
            >
              <div className="inline-block bg-white text-orange-600 text-sm font-bold uppercase tracking-widest px-4 py-2 mb-6 rounded-full shadow-lg">
                ☀️ Summer 2026 ☀️
              </div>
              <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight drop-shadow-lg">
                SUMMER CAMP <span className="text-yellow-300">ADVENTURE!</span>
              </h1>
              <p className="text-xl md:text-2xl text-white mb-4 leading-relaxed drop-shadow-md font-semibold">
                Built for families who want more. More structure. More purpose. More growth.
              </p>
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow-md">
                Kids don't just stay busy—they build confidence, learn real martial arts, and come home every day proud of what they've accomplished. <strong>No experience needed!</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={openIntakeChatbot}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black text-lg px-10 py-7 h-auto font-heading uppercase tracking-wider shadow-xl"
                >
                  Register Now
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-white bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-orange-600 text-lg px-10 py-7 h-auto font-heading uppercase tracking-wider"
                  onClick={() => document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Schedule
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-b from-yellow-50 to-orange-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                WHY CHOOSE <span className="text-orange-600">MYDOJO SUMMER CAMP?</span>
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                More than just a summer camp—it's a transformative experience filled with adventure, growth, and endless fun!
              </p>
            </div>

            {/* Activity Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-2xl shadow-2xl group"
              >
                <img 
                  src="/images/social/instagram-post-2.jpg" 
                  alt="Expert martial arts instruction" 
                  className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
                  <h3 className="text-2xl font-heading font-bold text-white">🥋 Expert Instruction</h3>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-2xl shadow-2xl group"
              >
                <img 
                  src="/images/summer-camp/group-activity.jpg" 
                  alt="Group activities and fun" 
                  className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-6">
                  <h3 className="text-2xl font-heading font-bold text-white">🎉 Fun & Friendship</h3>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-8 h-full hover:shadow-2xl transition-all hover:-translate-y-2 border-2">
                      <div className={`${benefit.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Weekly Themes Section */}
        <section id="schedule" className="py-20 bg-gradient-to-b from-blue-50 to-cyan-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                WEEKLY <span className="text-blue-600">THEMES & FIELD TRIPS</span>
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Each week features a unique theme with specialized training, exciting field trips, and unforgettable adventures!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {weeklyThemes.map((week, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`h-full ${!week.available ? 'opacity-60' : 'hover:shadow-2xl transition-all hover:-translate-y-2'} border-2 overflow-hidden relative p-0`}>
                    {week.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={week.image} 
                          alt={week.theme}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${week.color} opacity-40`}></div>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-700 font-bold">
                        <Calendar className="w-5 h-5" />
                        <span>{week.dates}</span>
                      </div>
                      {week.available ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                          OPEN
                        </span>
                      ) : (
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                          CLOSED
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{week.theme}</h3>
                    <div className="flex items-start gap-2 mb-4 text-gray-600">
                      <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-500" />
                      <span className="text-sm font-medium">{week.fieldTrip}</span>
                    </div>
                    {week.available && (
                      <Button
                        onClick={openIntakeChatbot}
                        className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                      >
                        Register for This Week
                      </Button>
                    )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Daily Schedule Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                  DAILY <span className="text-orange-600">SCHEDULE</span>
                </h2>
                <p className="text-xl text-gray-600">
                  A typical day at MyDojo Summer Camp (8:00 AM - 4:00 PM)
                </p>
              </div>

              <div className="space-y-4">
                {dailySchedule.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl hover:shadow-lg transition-all border-2 border-transparent hover:border-orange-300"
                  >
                    <div className="text-3xl">{item.icon}</div>
                    <div className="flex items-center gap-2 text-orange-600 font-bold min-w-[100px]">
                      <Clock className="w-5 h-5" />
                      <span>{item.time}</span>
                    </div>
                    <div className="flex-1 font-medium text-gray-800">{item.activity}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* What to Bring Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-12">
                WHAT TO <span className="text-orange-600">BRING</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 border-2 border-green-200 bg-green-50">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-green-700">
                    <Check className="w-6 h-6" />
                    Required Items
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <span>Comfortable athletic clothing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <span>Water bottle (labeled with name)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <span>Packed lunch & snacks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <span>Sunscreen & hat</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-xl">•</span>
                      <span>Swimsuit & towel (for water days)</span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-8 border-2 border-blue-200 bg-blue-50">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-700">
                    <Check className="w-6 h-6" />
                    Optional Items
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-bold text-xl">•</span>
                      <span>Martial arts uniform (if you have one)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-bold text-xl">•</span>
                      <span>Change of clothes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-bold text-xl">•</span>
                      <span>Personal protective gear (we provide)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-bold text-xl">•</span>
                      <span>Spending money for field trips</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Join Year-Round Section */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                JOIN US THIS <span className="text-orange-600">SUMMER!</span>
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                <strong>Summer camp is a great way to get started—no experience needed!</strong>
              </p>
              <p className="text-gray-600 mb-8">
                But if your child is ready to jump in now, you don't have to wait. Enroll in a martial arts program today and keep the momentum going all year long.
              </p>
              <Button
                onClick={openIntakeChatbot}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider"
              >
                Enroll in Year-Round Programs
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-orange-600 via-yellow-500 to-blue-500 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/summer-camp/activities-colorful.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 drop-shadow-lg">
              READY FOR AN EPIC SUMMER? ☀️
            </h2>
            <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto drop-shadow-md">
              Spots fill up fast! Register today to secure your child's place in the most exciting summer camp experience.
            </p>
            <Button
              onClick={openIntakeChatbot}
              className="bg-white text-orange-600 hover:bg-yellow-100 hover:text-orange-700 text-lg px-12 py-8 h-auto font-heading uppercase tracking-wider shadow-2xl text-xl"
            >
              🎉 Register Now 🎉
            </Button>
            <p className="mt-8 text-lg drop-shadow-md">
              Questions? Call us at (877) 4-MYDOJO or email info@mydojo.com
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
