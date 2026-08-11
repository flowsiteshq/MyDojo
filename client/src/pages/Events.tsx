import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Award, Gift, PartyPopper } from "lucide-react";
import SEO from "@/components/SEO";

export default function Events() {
  const { t } = useTranslation();
  const events = [
    {
      title: "Fun Friday Events",
      description: "Once a month MyDojo hosts a fun Friday event at select locations. These events are held at the facility and typically last 4 hours.",
      icon: <PartyPopper className="h-8 w-8 text-white" />,
      color: "bg-blue-500"
    },
    {
      title: "Belt Test",
      description: "Belt tests are right-of-passage events held quarterly to promote and commemorate a student to graduate to the next rank.",
      icon: <Award className="h-8 w-8 text-white" />,
      color: "bg-primary"
    },
    {
      title: "Black Belt Banquet",
      description: "Black Belt Banquets are held annually for Black Belts and prospective black belts. This is a fun event for families to attend.",
      icon: <Gift className="h-8 w-8 text-white" />,
      color: "bg-black"
    },
    {
      title: "Holiday Camps",
      description: "Week Long camps are held during Spring Break, Thanksgiving holiday, and winter break at select locations.",
      icon: <Calendar className="h-8 w-8 text-white" />,
      color: "bg-green-600"
    },
    {
      title: "Themed Kickboxing",
      description: "We host special themed Kickboxing classes for adults such as 80's Night, Valentine's Night, Halloween and Christmas Night.",
      icon: <PartyPopper className="h-8 w-8 text-white" />,
      color: "bg-purple-600"
    }
  ];

  return (
    <div className="public-page min-h-screen">
      <SEO 
        title="Events & Activities"
        description="Join MyDojo's exciting martial arts events including Fun Fridays, Belt Tests, Black Belt Banquets, and Holiday Camps. Special events for students and families throughout the year."
        keywords="martial arts events, belt testing, black belt ceremony, martial arts camp, holiday martial arts camp, fun Friday events, martial arts activities, karate events Tomball, family martial arts events"
      />
      {/* Header */}
      <div className="relative overflow-hidden border-b border-black/10 bg-black py-16 text-white md:py-24">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/SyvAbjUuGnRExiUN.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="container relative z-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-[#e63946]">The MyDojo community</p><h1 className="mt-5 font-heading text-[clamp(3.5rem,7vw,7rem)] font-bold uppercase leading-[0.86] tracking-[-0.04em]">Events that<br />bring us together.</h1></div>
          <div><p className="max-w-2xl text-base leading-7 text-gray-300 md:text-lg">
            At MyDojo, kids and families make up an intricate part of our student base. That's why we have special events to keep our students motivated.
          </p><div className="mt-8">
            <Link href="/contact">
              <Button className="h-auto rounded-none bg-primary px-6 py-4 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-primary/90">
                Contact Us for Upcoming Events
              </Button>
            </Link>
          </div></div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="container py-16 md:py-20">
        <div className="grid border-l border-t border-[var(--mydojo-line)] md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="overflow-hidden border-b border-r border-[var(--mydojo-line)] bg-white transition-colors hover:bg-zinc-50"
            >
              <div className={`${event.color} flex items-center justify-center p-7`}>
                <div className="bg-white/20 p-4 backdrop-blur-sm">
                  {event.icon}
                </div>
              </div>
              <div className="p-7 md:p-8">
                <h3 className="text-2xl font-heading font-bold mb-4">{event.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {event.description}
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="w-full rounded-none border-black text-black hover:bg-black hover:text-white uppercase tracking-wider font-bold">
                    Inquire Now
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Community Section */}
      <section className="border-t border-[var(--mydojo-line)] bg-[var(--mydojo-paper)] py-16 md:py-24">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="w-full lg:w-1/2">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/SyvAbjUuGnRExiUN.jpg" alt="Community" className="w-full border border-[var(--mydojo-line)]" loading="lazy" />
            </div>
            <div className="w-full lg:w-1/2">
              <p className="public-eyebrow">A fuller dojo life</p><h2 className="public-title mt-5">Join our community.</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                MyDojo is more than just a place to workout. It's a community where friendships are formed, goals are achieved, and families come together.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                From our annual Black Belt Banquet to our fun holiday camps, there's always something happening at MyDojo. Come be a part of our family!
              </p>
              <Link href="/contact">
                <Button className="mt-2 h-auto rounded-none bg-primary px-6 py-4 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:bg-primary/90">
                  Get Event Updates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
