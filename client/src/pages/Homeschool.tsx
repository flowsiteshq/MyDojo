import { Button } from "@/components/ui/button";
import { Clock, Calendar, Users, BookOpen, Star, Shield, Zap, Heart, CheckCircle, GraduationCap, Sun } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { openIntakeChatbot } from "@/lib/chatbot";

export default function Homeschool() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const noonClasses = [
    {
      day: "Monday",
      classes: [
        { time: "12:00 PM", name: "Kickboxing (Dojo 2)", ageGroup: "Ages 18+", color: "bg-red-100 text-red-700 border-red-200" },
        { time: "12:00 PM", name: "Dragon Kids & Teens", ageGroup: "Ages 5–17", color: "bg-blue-100 text-blue-700 border-blue-200" },
      ],
    },
    {
      day: "Tuesday",
      classes: [
        { time: "12:00 PM", name: "Intro Class", ageGroup: "New Students", color: "bg-green-100 text-green-700 border-green-200" },
      ],
    },
    {
      day: "Wednesday",
      classes: [
        { time: "12:00 PM", name: "Kickboxing (Dojo 2)", ageGroup: "Ages 18+", color: "bg-red-100 text-red-700 border-red-200" },
        { time: "12:00 PM", name: "Dragon Kids & Teens", ageGroup: "Ages 5–17", color: "bg-blue-100 text-blue-700 border-blue-200" },
      ],
    },
    {
      day: "Thursday",
      classes: [
        { time: "12:00 PM", name: "Intro Class", ageGroup: "New Students", color: "bg-green-100 text-green-700 border-green-200" },
      ],
    },
    {
      day: "Friday",
      classes: [
        { time: "12:00 PM", name: "Kickboxing (Dojo 2)", ageGroup: "Ages 18+", color: "bg-red-100 text-red-700 border-red-200" },
        { time: "12:00 PM", name: "Dragon Kids & Teens", ageGroup: "Ages 5–17", color: "bg-blue-100 text-blue-700 border-blue-200" },
      ],
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Midday Convenience",
      description: "Classes scheduled at 12:00 PM — perfectly timed to fit into your homeschool day without disrupting morning lessons.",
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      icon: Users,
      title: "Small Group Setting",
      description: "Enjoy the benefits of a small, focused class environment where instructors give personalized attention to every student.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: BookOpen,
      title: "Complements Your Curriculum",
      description: "Martial arts teaches discipline, focus, and respect — life skills that reinforce the values you're already teaching at home.",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: GraduationCap,
      title: "Physical Education Credit",
      description: "Our structured program can serve as a physical education component in your homeschool curriculum, complete with progress tracking.",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: Shield,
      title: "Self-Defense Skills",
      description: "Give your child practical self-defense knowledge and the confidence to handle real-world situations safely.",
      color: "bg-red-50 text-red-600",
    },
    {
      icon: Heart,
      title: "Social Connection",
      description: "Homeschooled children build friendships with peers in a structured, positive environment that fosters teamwork and community.",
      color: "bg-pink-50 text-pink-600",
    },
  ];

  const programs = [
    {
      name: "Dragon Kids & Teens",
      ages: "Ages 5–17",
      description:
        "Our flagship kids program teaches traditional martial arts with a modern approach. Students progress through belt ranks, building confidence, discipline, and physical fitness along the way.",
      image: "/images/program-core-kids.jpg",
      highlights: ["Belt rank progression", "Character development", "Focus & discipline", "Self-defense techniques"],
    },
    {
      name: "Adult Kickboxing",
      ages: "Ages 18+",
      description:
        "A high-energy, full-body workout that combines real kickboxing techniques with cardio conditioning. Perfect for homeschool parents who want to train while their kids are in class!",
      image: "/images/featured-kickboxing.jpg",
      highlights: ["Burn 600–800 calories", "Real martial arts techniques", "All fitness levels welcome", "Train alongside your kids"],
    },
  ];

  const faqs = [
    {
      question: "Do my kids need any prior martial arts experience?",
      answer:
        "Not at all! Our noon classes welcome complete beginners. Our instructors are experienced in working with students of all backgrounds and will meet your child exactly where they are.",
    },
    {
      question: "Can I train while my child is in class?",
      answer:
        "Yes! We offer simultaneous noon Kickboxing for adults and Dragon Kids & Teens classes on Monday, Wednesday, and Friday — so the whole family can train together at the same time.",
    },
    {
      question: "How do I enroll my homeschooled child?",
      answer:
        "Simply book a free trial class to get started. We'll walk you through the program, answer your questions, and find the right fit for your child's age and experience level.",
    },
    {
      question: "Is there a homeschool group discount?",
      answer:
        "We love supporting the homeschool community! Contact us to ask about our family and group enrollment options. We're happy to work with homeschool co-ops and groups.",
    },
    {
      question: "What should my child wear to their first class?",
      answer:
        "Comfortable athletic clothing is perfect for the first class. Once enrolled, students receive a uniform (gi) as part of their membership. No special equipment is needed to get started.",
    },
    {
      question: "How long are the noon classes?",
      answer:
        "Each class runs approximately 45–60 minutes — the perfect length to keep kids engaged and energized without taking up your entire afternoon.",
    },
  ];

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <SEO
        title="Homeschool Martial Arts Program | MyDojo – Noon Classes Daily"
        description="MyDojo offers daily noon classes designed for homeschool families in Tomball, TX. Dragon Kids & Teens and Adult Kickboxing at 12:00 PM Monday–Friday. Book a free trial today!"
        keywords="homeschool martial arts, homeschool karate, noon classes, homeschool fitness, Tomball TX martial arts, kids martial arts"
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          <img
            src="/images/program-core-kids.jpg"
            alt="Homeschool Martial Arts"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <Sun className="h-4 w-4" />
              Homeschool Program
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight">
              NOON CLASSES <br />
              <span className="text-primary">BUILT FOR</span> <br />
              HOMESCHOOLERS
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
              Daily 12:00 PM classes designed to fit perfectly into your homeschool schedule. Martial arts, fitness, and
              life skills — Monday through Friday.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={openIntakeChatbot}
                className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider"
              >
                Book a Free Trial Class
              </Button>
              <Link href="/schedule">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider"
                >
                  View Full Schedule
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Noon Schedule Highlight */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-14"
          >
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Daily Schedule</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-black">
              NOON CLASSES, <span className="text-primary">EVERY WEEKDAY</span>
            </h3>
            <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
              No more waiting until after school. Our midday classes are designed specifically so homeschool families can
              train when it works best for them.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {noonClasses.map((day, i) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <h4 className="font-heading font-bold text-black text-lg">{day.day}</h4>
                </div>
                <div className="space-y-3">
                  {day.classes.map((cls) => (
                    <div key={cls.name} className={`rounded-xl p-3 border ${cls.color}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-bold">{cls.time}</span>
                      </div>
                      <p className="font-bold text-sm leading-tight">{cls.name}</p>
                      <p className="text-xs opacity-75 mt-0.5">{cls.ageGroup}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-10"
          >
            <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="text-gray-700 font-medium">
                <span className="font-bold text-black">Mon–Fri at 12:00 PM</span> · Located at{" "}
                <span className="font-bold text-black">MyDojo Tomball</span> · 14027 FM 2920, Tomball, TX 77377
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Homeschoolers Love MyDojo */}
      <section className="py-20 bg-zinc-900 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-14"
          >
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Why Choose MyDojo</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-white">
              THE PERFECT FIT FOR <span className="text-primary">HOMESCHOOL FAMILIES</span>
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-zinc-800 rounded-2xl p-8"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${benefit.color}`}>
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-heading font-bold text-white mb-3">{benefit.title}</h4>
                <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-14"
          >
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Our Programs</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-black">
              CLASSES FOR <span className="text-primary">EVERY FAMILY MEMBER</span>
            </h3>
            <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
              Train together as a family. While your kids are in Dragon Kids & Teens, parents can join the simultaneous
              Kickboxing class.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {programs.map((program, i) => (
              <motion.div
                key={program.name}
                initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="rounded-2xl overflow-hidden border border-gray-100 shadow-lg"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h4 className="text-2xl font-heading font-bold text-white">{program.name}</h4>
                    <p className="text-primary font-bold">{program.ages}</p>
                  </div>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-gray-600 leading-relaxed mb-6">{program.description}</p>
                  <ul className="space-y-2">
                    {program.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "12 PM", label: "Daily Start Time" },
              { value: "5 Days", label: "Available Per Week" },
              { value: "All Ages", label: "Kids, Teens & Adults" },
              { value: "Free", label: "First Trial Class" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-heading font-bold mb-2">{stat.value}</div>
                <div className="text-white/80 uppercase tracking-wider text-sm font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-14"
          >
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">FAQ</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-black">
              COMMON <span className="text-primary">QUESTIONS</span>
            </h3>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <h4 className="text-lg font-heading font-bold text-black mb-3">{faq.question}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/program-teens-adults-branded.png"
            alt="Join MyDojo"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black to-black/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
              <Star className="h-4 w-4" />
              First Class Free
            </div>
            <h2 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              START YOUR <span className="text-primary">FREE TRIAL</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join hundreds of homeschool families who have made MyDojo part of their daily routine. Book your free noon
              class today — no commitment required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={openIntakeChatbot}
                className="bg-primary hover:bg-primary/90 text-white text-xl px-12 py-8 h-auto font-heading uppercase tracking-wider shadow-2xl"
              >
                Book Free Trial Class
              </Button>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black text-xl px-12 py-8 h-auto font-heading uppercase tracking-wider"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
            <p className="text-gray-500 mt-6">No experience needed · All ages welcome · Cancel anytime</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
