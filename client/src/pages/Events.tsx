import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Award, Gift, PartyPopper } from "lucide-react";
import SEO from "@/components/SEO";

export default function Events() {
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
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Events & Activities"
        description="Join MyDojo's exciting martial arts events including Fun Fridays, Belt Tests, Black Belt Banquets, and Holiday Camps. Special events for students and families throughout the year."
        keywords="martial arts events, belt testing, black belt ceremony, martial arts camp, holiday martial arts camp, fun Friday events, martial arts activities, karate events Tomball, family martial arts events"
      />
      {/* Header */}
      <div className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/SyvAbjUuGnRExiUN.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">EVENTS</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            At MyDojo, kids and families make up an intricate part of our student base. That's why we have special events to keep our students motivated.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 h-auto font-heading uppercase tracking-wider text-lg">
                Contact Us for Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-gray-100"
            >
              <div className={`${event.color} p-6 flex justify-center items-center`}>
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  {event.icon}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-heading font-bold mb-4">{event.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {event.description}
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="w-full border-black text-black hover:bg-black hover:text-white uppercase tracking-wider font-bold">
                    Inquire Now
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Community Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/SyvAbjUuGnRExiUN.jpg" alt="Community" className="rounded-2xl shadow-2xl w-full" loading="lazy" />
            </div>
            <div className="w-full lg:w-1/2">
              <h2 className="text-4xl font-heading font-bold mb-6">JOIN OUR COMMUNITY</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                MyDojo is more than just a place to workout. It's a community where friendships are formed, goals are achieved, and families come together.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                From our annual Black Belt Banquet to our fun holiday camps, there's always something happening at MyDojo. Come be a part of our family!
              </p>
              <Link href="/contact">
                <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 h-auto font-heading uppercase tracking-wider text-lg">
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
