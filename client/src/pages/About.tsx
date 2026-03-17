import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { openIntakeChatbot } from "@/lib/chatbot";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="About Us"
        description="Learn about MyDojo's mission to empower lives through martial arts. Experienced instructors, proven curriculum, and a supportive community dedicated to building confidence, discipline, and strength."
        keywords="about MyDojo, martial arts philosophy, karate school mission, experienced martial arts instructors, martial arts values, community dojo, family martial arts school Tomball"
      />
      <SchemaMarkup type="LocalBusiness" />
      <SchemaMarkup
        type="BreadcrumbList"
        items={[
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" },
        ]}
      />
      {/* Header */}
      <div className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">ABOUT US</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Empowering lives through the art of self-defense and fitness.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-4">Our Mission</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold mb-8">BUILDING CONFIDENCE, DISCIPLINE, AND STRENGTH</h3>
            <p className="text-xl text-gray-600 leading-relaxed mb-12">
              At MyDojo, our goal is to help every student be the best they can be at everything they put their minds to. We believe that martial arts is a vehicle for developing life skills that extend far beyond the dojo walls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="text-6xl font-heading font-bold text-gray-200 mb-4">01</div>
              <h4 className="text-2xl font-bold mb-4">Fun</h4>
              <p className="text-gray-600">
                We believe learning should be enjoyable. Our classes are high-energy, engaging, and designed to keep students motivated.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="text-6xl font-heading font-bold text-gray-200 mb-4">02</div>
              <h4 className="text-2xl font-bold mb-4">Fit</h4>
              <p className="text-gray-600">
                Physical fitness is the foundation of a healthy life. Our programs improve strength, flexibility, and cardiovascular health.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="text-6xl font-heading font-bold text-gray-200 mb-4">03</div>
              <h4 className="text-2xl font-bold mb-4">Strong</h4>
              <p className="text-gray-600">
                Strength of body and mind. We teach mental fortitude, focus, and the resilience to overcome challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/BRDAWpxDTQGxESXr.jpg')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-center text-4xl font-heading font-bold mb-16">WHAT OUR STUDENTS SAY</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 relative"
            >
              <div className="text-primary text-6xl font-serif absolute top-4 left-4 opacity-30">"</div>
              <p className="text-gray-300 text-lg italic mb-6 relative z-10 pt-4">
                Enrolling my toddler in the Mydojo Little Ninjas program has been a fantastic experience, as it promotes physical fitness, discipline, and respect while creating a fun and supportive environment. The skilled and patient instructors make learning engaging... I highly recommend MyDojo Martial Arts!
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                <div>
                  <h5 className="font-bold">J. Thompson</h5>
                  <p className="text-sm text-gray-500">Parent</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 relative"
            >
              <div className="text-primary text-6xl font-serif absolute top-4 left-4 opacity-30">"</div>
              <p className="text-gray-300 text-lg italic mb-6 relative z-10 pt-4">
                My mindset has changed toward fitness! MyDojo Martial Arts has shifted my way of thinking when it comes to my health and fitness journey! The classes are AMAZING!!!
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                <div>
                  <h5 className="font-bold">S. Joy</h5>
                  <p className="text-sm text-gray-500">Adult Student</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-heading font-bold mb-8">JOIN THE MYDOJO FAMILY</h2>
          <Button 
            onClick={openIntakeChatbot}
            className="bg-white text-primary hover:bg-black hover:text-white text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] shadow-xl"
          >
            <span className="skew-x-[10deg]">Start Your Journey Today</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
