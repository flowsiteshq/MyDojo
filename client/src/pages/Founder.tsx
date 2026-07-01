import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { openBookFreeClassGate } from "@/lib/chatbot";
import { motion } from "framer-motion";
import {
  Award,
  Star,
  Shield,
  Users,
  Trophy,
  ChevronRight,
  BookOpen,
  Heart,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const CREDENTIALS = [
  {
    icon: Award,
    label: "8th Degree Black Belt",
    sub: "Highest rank in the MyDojo system",
  },
  {
    icon: Trophy,
    label: "Champion Competitor",
    sub: "Decorated tournament career",
  },
  {
    icon: Users,
    label: "Thousands of Students",
    sub: "Trained across multiple locations",
  },
  {
    icon: BookOpen,
    label: "30+ Years of Teaching",
    sub: "Decades of martial arts instruction",
  },
  {
    icon: Shield,
    label: "Certified Master Instructor",
    sub: "Nationally recognized credentials",
  },
  {
    icon: Heart,
    label: "Community Leader",
    sub: "Dedicated to youth development",
  },
];

const BELT_MILESTONES = [
  { belt: "White", color: "bg-white border border-gray-300", year: "Early Career", note: "Began his martial arts journey" },
  { belt: "Yellow", color: "bg-yellow-400", year: "", note: "Demonstrated foundational discipline" },
  { belt: "Orange", color: "bg-orange-500", year: "", note: "Developed core striking techniques" },
  { belt: "Green", color: "bg-green-600", year: "", note: "Advanced sparring and forms mastery" },
  { belt: "Blue", color: "bg-blue-600", year: "", note: "Leadership and teaching began" },
  { belt: "Purple", color: "bg-purple-700", year: "", note: "Competitive tournament success" },
  { belt: "Brown", color: "bg-amber-800", year: "", note: "Mentored next generation of students" },
  { belt: "Black", color: "bg-black", year: "", note: "Achieved 1st Degree Black Belt" },
  { belt: "8th Degree Black Belt", color: "bg-black", year: "Present", note: "Founder of MyDojo — the pinnacle of mastery" },
];

export default function Founder() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-white">

      {/* Hero Section */}
      <section className="relative min-h-[70vh] bg-black flex items-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://files.manuscdn.com/manus-storage/master-holmes-kick_b53d8ff8.jpeg"
            alt="Master Vincent Holmes"
            className="w-full h-full object-cover object-top opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pb-16 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-sm mb-6">
              <Star className="h-4 w-4 fill-primary" />
              Founder & Head Instructor
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-black text-white mb-4 leading-none">
              MASTER<br />
              <span className="text-primary">VINCENT</span><br />
              HOLMES
            </h1>
            <p className="text-xl text-gray-300 mb-2 font-semibold tracking-wider uppercase">
              8th Degree Black Belt
            </p>
            <p className="text-gray-400 text-lg max-w-xl">
              Founder of MyDojo Martial Arts & Fitness — dedicated to transforming lives through the discipline, respect, and power of martial arts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Credentials Bar */}
      <section className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CREDENTIALS.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex flex-col items-center text-center text-white"
              >
                <c.icon className="h-6 w-6 mb-1 opacity-90" />
                <span className="font-bold text-sm leading-tight">{c.label}</span>
                <span className="text-xs opacity-75 mt-0.5">{c.sub}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl aspect-[3/4]">
                <img
                  src="https://files.manuscdn.com/manus-storage/master-holmes-seiza_260a2caf.jpg"
                  alt="Master Vincent Holmes in seiza on the mat"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-primary rounded-2xl z-0" />
              <div className="absolute -top-8 -left-8 w-28 h-28 bg-gray-100 rounded-full z-0 opacity-60" />
              {/* Badge */}
              <div className="absolute top-6 -right-4 z-20 bg-black text-white px-4 py-3 rounded-lg shadow-xl text-center">
                <div className="text-3xl font-black text-primary">8th</div>
                <div className="text-xs font-bold uppercase tracking-widest">Degree</div>
                <div className="text-xs font-bold uppercase tracking-widest">Black Belt</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-3">His Story</h2>
              <h3 className="text-4xl md:text-5xl font-heading font-black text-black mb-8 leading-tight">
                A LIFE BUILT<br />ON THE MAT
              </h3>

              <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
                <p>
                  Master Vincent Holmes didn't just discover martial arts — he was called to it. From his earliest years on the mat, it was clear that this was more than a sport or a hobby. It was a way of life, a code of conduct, and a vehicle for personal transformation.
                </p>
                <p>
                  Over decades of dedicated training, competition, and teaching, Master Holmes climbed to the pinnacle of his discipline — earning his <strong className="text-black">8th Degree Black Belt</strong>, one of the highest ranks achievable in the martial arts world. Along the way, he competed at the highest levels, earned championship titles, and mentored hundreds of students who have gone on to become champions and instructors themselves.
                </p>
                <p>
                  His vision was simple but powerful: build a place where anyone — from a 3-year-old taking their first class to an adult rediscovering their strength — could experience the life-changing power of martial arts. That vision became <strong className="text-black">MyDojo</strong>.
                </p>
                <p>
                  Today, Master Holmes leads with the same fire that drove him as a young student. He still teaches, still trains, and still believes that every person who walks through the dojo doors has unlimited potential waiting to be unlocked.
                </p>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/programs">
                  <Button className="bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-wider px-8 py-6 h-auto text-base">
                    Explore Our Programs <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button onClick={() => openBookFreeClassGate()} variant="outline" className="border-black text-black hover:bg-black hover:text-white font-heading uppercase tracking-wider px-8 py-6 h-auto text-base">
                    Talk to Kai
                  </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/kickboxing-bg_d4fcc4c5.webp"
            alt="Dojo background"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4">His Philosophy</h2>
              <h3 className="text-4xl md:text-6xl font-heading font-black mb-10 leading-tight">
                MORE THAN KICKS & PUNCHES
              </h3>
              <blockquote className="text-2xl md:text-3xl text-gray-200 italic leading-relaxed mb-10 font-light">
                "Martial arts is not about fighting. It's about building a person — mind, body, and spirit — so they can face any challenge life throws at them."
              </blockquote>
              <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                Master Holmes has always believed that the dojo is a classroom for life. The discipline learned on the mat — respect, perseverance, focus, and confidence — carries over into school, work, relationships, and every corner of a student's world.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Belt Journey */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-3">The Journey</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-black text-black">FROM WHITE TO 8TH DEGREE</h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {BELT_MILESTONES.map((m, i) => (
              <motion.div
                key={m.belt}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-6 p-4 rounded-xl ${m.belt === "8th Degree Black Belt" ? "bg-black text-white" : "bg-white"} shadow-sm`}
              >
                <div className={`w-12 h-4 rounded-sm flex-shrink-0 ${m.color}`} />
                <div className="flex-1">
                  <div className={`font-bold text-base ${m.belt === "8th Degree Black Belt" ? "text-primary" : "text-black"}`}>
                    {m.belt}
                    {m.year && <span className="ml-2 text-xs font-normal text-gray-400 uppercase tracking-wider">{m.year}</span>}
                  </div>
                  <div className={`text-sm ${m.belt === "8th Degree Black Belt" ? "text-gray-300" : "text-gray-500"}`}>{m.note}</div>
                </div>
                {m.belt === "8th Degree Black Belt" && (
                  <Star className="h-6 w-6 text-primary fill-primary flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery / Action shots */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-3">The Dojo</h2>
            <h3 className="text-4xl font-heading font-black text-black">MASTER HOLMES IN ACTION</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
            "https://files.manuscdn.com/manus-storage/master-holmes-kick_b53d8ff8.jpeg",
            "https://files.manuscdn.com/manus-storage/master-holmes-stance_86d12feb.jpeg",
            "https://files.manuscdn.com/manus-storage/master-holmes-seiza_260a2caf.jpg",
            "https://files.manuscdn.com/manus-storage/master-holmes-rashguard_fdaa5c57.jpeg",
            "https://files.manuscdn.com/manus-storage/master-holmes-headshot_cd686d71.jpg",
            "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero2_cef79f5f.webp",
            ].map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="aspect-square overflow-hidden rounded-xl shadow-md"
              >
                <img src={src} alt={`MyDojo gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero1_1d3d63d3.webp')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl md:text-6xl font-heading font-black mb-6">READY TO BEGIN?</h2>
            <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
              Take the first step on your martial arts journey. Chat with Kai to find the right program for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => openBookFreeClassGate()} className="bg-white text-primary hover:bg-black hover:text-white text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider shadow-xl">
                Book Your Free Class
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
