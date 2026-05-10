import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Shield, Zap, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import { FAQ } from "@/components/FAQ";
import { MasonryGallery } from "@/components/MasonryGallery";
import { HeroSlider } from "@/components/HeroSlider";
import { BeltJourney } from "@/components/BeltJourney";
import { ProgramFinder } from "@/components/ProgramFinder";
import { SocialProofTicker } from "@/components/SocialProofTicker";
import { IntroOfferModal } from "@/components/IntroOfferModal";
import type { ProgramId } from "@/components/IntroOfferModal";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { openIntakeChatbot } from "@/lib/chatbot";
import { ChatGPTChatbot } from "@/components/ChatGPTChatbot";
import { IntakeChatbot } from "@/components/IntakeChatbot";
import { useState, useEffect } from "react";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const [showChatGPT, setShowChatGPT] = useState(false);
  const [showIntakeBot, setShowIntakeBot] = useState(false);
  const [useLegacyBot, setUseLegacyBot] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerProgramId, setOfferProgramId] = useState<ProgramId | undefined>();

  const openOffer = (programId?: ProgramId) => {
    setOfferProgramId(programId);
    setOfferModalOpen(true);
  };

  // Check for legacy bot flag in URL (?bot=legacy)
  // Check for enroll parameter to open intake chatbot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bot') === 'legacy') {
      setUseLegacyBot(true);
    }
    if (params.get('enroll') === 'true') {
      setShowIntakeBot(true);
      // Clean up URL parameter
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <SEO 
        title="MyDojo Martial Arts & Fitness - Transform Your Life Through Martial Arts"
        description="Premier martial arts training in Tomball, Texas. Programs for all ages: Little Ninjas (3-5), Dragon Kids (5-12), Teens, and Adults. Expert instructors, proven results. Start your free trial today!"
        keywords="martial arts Tomball, karate classes Tomball TX, kickboxing Tomball, kids martial arts, children's karate, self defense classes, fitness martial arts, Little Ninjas, after school program, martial arts near me, best martial arts school Tomball"
      />
      {/* Schema Markup — LocalBusiness, SportsActivityLocation, FAQPage, WebSite */}
      <SchemaMarkup type="LocalBusiness" />
      <SchemaMarkup type="WebSite" />
      <SchemaMarkup
        type="FAQPage"
        faqs={[
          { question: "Do I need any prior martial arts experience?", answer: "Not at all! Our programs are designed for all skill levels, from complete beginners to advanced practitioners. Our instructors will guide you through the basics and help you progress at your own pace." },
          { question: "What should I wear to my first class?", answer: "For your first trial class, comfortable workout clothes (t-shirt and sweatpants/shorts) are perfect. We train barefoot on the mats. If you decide to join, we'll help you get fitted for a proper uniform (Gi)." },
          { question: "How much do classes cost?", answer: "We offer various membership options to fit different budgets and training goals. Since every student's needs are different, we recommend coming in for a free trial class where we can discuss the best program for you." },
          { question: "At what age can children start?", answer: "Our Little Ninjas program is specifically designed for children ages 3-5, focusing on listening skills, balance, and coordination. We have specific programs for every age group thereafter." },
          { question: "Is sparring required?", answer: "Sparring is an optional part of our advanced curriculum. Beginners focus on technique, fitness, and drills. You will never be forced to spar before you are ready and willing." },
          { question: "How do I get started?", answer: "The best way to start is by booking a free trial class! You can sign up right here on our website or give us a call. This gives you a chance to meet the instructors, see the facility, and try a workout risk-free." },
          { question: "Where is MyDojo located?", answer: "MyDojo is located at 11721 Spring Cypress Rd, Tomball, TX 77377. We serve families from Tomball, Spring, Cypress, Klein, and The Woodlands." },
          { question: "What programs do you offer?", answer: "We offer Little Ninjas (ages 3-5), Dragon Kids (ages 5-12), After School Program, Teen Warriors (ages 12-17), Adult Karate, Fitness Kickboxing, Women's Self-Defense, and Family Classes." },
        ]}
      />
      {/* Hero Section */}
      <HeroSlider onOpenChatbot={openIntakeChatbot} />

      {/* Social Proof Ticker */}
      <SocialProofTicker />

      {/* Philosophy Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 skew-x-[-12deg] transform translate-x-20 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-black">
                MORE THAN JUST <span className="text-primary">KICKS & PUNCHES</span>
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                At MyDojo, we believe martial arts is a vehicle for personal growth. Our programs are designed to not only provide a rigorous physical workout but also to strengthen the mind and spirit.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Whether you're looking to instill discipline in your child, find a stress-relieving workout for yourself, or learn practical self-defense, our world-class instructors are here to guide you every step of the way.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-black p-3 rounded-lg text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Self Defense</h4>
                    <p className="text-sm text-gray-500">Practical techniques for real-world safety.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-black p-3 rounded-lg text-white">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Fitness</h4>
                    <p className="text-sm text-gray-500">Full-body conditioning and cardio health.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-black p-3 rounded-lg text-white">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Confidence</h4>
                    <p className="text-sm text-gray-500">Building self-esteem through achievement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-black p-3 rounded-lg text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Community</h4>
                    <p className="text-sm text-gray-500">Supportive environment for all ages.</p>
                  </div>
                </div>
              </div>

              <Link href="/about">
                <Button variant="link" className="text-black font-bold uppercase tracking-wider p-0 hover:text-primary transition-colors group">
                  About MyDojo Martial Arts <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/community_7e1d84a3.webp" alt="MyDojo Community" loading="lazy" className="w-full h-auto" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-primary rounded-2xl z-0"></div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-gray-100 rounded-full z-0 opacity-50"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Belt Journey Section */}
      <BeltJourney />

      {/* Featured Program Section */}
      <section className="py-24 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/kickboxing-bg_d4fcc4c5.webp" alt="Adult Kickboxing" loading="lazy" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-block bg-primary text-white text-sm font-bold uppercase tracking-widest px-3 py-1 mb-6 rounded-sm">
              Featured Program
            </div>
            <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
              ADULT <span className="text-primary">KICKBOXING</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Burn up to 800 calories in a single session! Our high-energy kickboxing classes combine real martial arts techniques with a full-body cardio workout. Perfect for all fitness levels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/locations/hq?program=Kickboxing">
                <Button className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider">
                  View Class Schedule
                </Button>
              </Link>
              <Link href="/programs">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider">
                  View Kickboxing Classes in Tomball
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Program Finder Quiz */}
      <ProgramFinder />

      {/* Programs Section */}
      <section className="py-24 bg-black text-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2">Explore All Programs</h2>
            <h3 className="text-4xl md:text-6xl font-heading font-bold text-white">CHOOSE YOUR DISCIPLINE</h3>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
          >
            {/* Program Card 1 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 100, scale: 0.9 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { 
                    type: "spring",
                    stiffness: 50,
                    damping: 20,
                    mass: 1
                  }
                }
              }}
              whileHover={{ y: -15, scale: 1.02, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-xl bg-zinc-900 h-[500px] shadow-2xl"
            >
              <div className="absolute inset-0">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/little-ninjas_25d41024.webp" alt="Little Ninjas" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>
              <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full">
                2 Classes $29 + Uniform!
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="w-12 h-1 bg-primary mb-4 transform origin-left transition-all duration-300 group-hover:w-24"></div>
                <h4 className="text-3xl font-heading font-bold mb-2">LITTLE NINJAS</h4>
                <p className="text-gray-300 mb-2 text-sm uppercase tracking-wider">Ages 3–5</p>
                <p className="text-gray-400 mb-4 line-clamp-3 group-hover:text-white transition-colors">
                  Big Confidence Starts Here. Builds focus, listening skills, and self-esteem in a fun, safe environment.
                </p>
                <button
                  onClick={() => openOffer("little-ninjas")}
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full uppercase tracking-wider py-2.5 text-sm font-bold transition-colors rounded"
                >
                  Claim $29 Intro Offer →
                </button>
              </div>
            </motion.div>

            {/* Program Card 2 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 100, scale: 0.9 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { 
                    type: "spring",
                    stiffness: 50,
                    damping: 20,
                    mass: 1
                  }
                }
              }}
              whileHover={{ y: -15, scale: 1.02, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-xl bg-zinc-900 h-[500px] shadow-2xl"
            >
              <div className="absolute inset-0">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/core-kids_baf3bc26.webp" alt="Dragon Kids" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>
              <div className="absolute top-4 right-4 bg-blue-700 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full">
                2 Classes $29 + Uniform!
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="w-12 h-1 bg-primary mb-4 transform origin-left transition-all duration-300 group-hover:w-24"></div>
                <h4 className="text-3xl font-heading font-bold mb-2">KIDS MARTIAL ARTS</h4>
                <p className="text-gray-300 mb-2 text-sm uppercase tracking-wider">Ages 6–12</p>
                <p className="text-gray-400 mb-4 line-clamp-3 group-hover:text-white transition-colors">
                  Strong Today. Leader Tomorrow. Builds discipline, anti-bullying skills, fitness, and leadership.
                </p>
                <button
                  onClick={() => openOffer("kids-martial-arts")}
                  className="bg-blue-700 hover:bg-blue-800 text-white w-full uppercase tracking-wider py-2.5 text-sm font-bold transition-colors rounded"
                >
                  Claim $29 Intro Offer →
                </button>
              </div>
            </motion.div>

            {/* Program Card 3 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 100, scale: 0.9 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { 
                    type: "spring",
                    stiffness: 50,
                    damping: 20,
                    mass: 1
                  }
                }
              }}
              whileHover={{ y: -15, scale: 1.02, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-xl bg-zinc-900 h-[500px] shadow-2xl"
            >
              <div className="absolute inset-0">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/teens-adults_e35f9895.webp" alt="Adults & Teens" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>
              <div className="absolute top-4 right-4 bg-red-700 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full">
                2 Classes $29 + Uniform!
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="w-12 h-1 bg-primary mb-4 transform origin-left transition-all duration-300 group-hover:w-24"></div>
                <h4 className="text-3xl font-heading font-bold mb-2">TEENS & ADULTS</h4>
                <p className="text-gray-300 mb-2 text-sm uppercase tracking-wider">Ages 13+</p>
                <p className="text-gray-400 mb-4 line-clamp-3 group-hover:text-white transition-colors">
                  Confidence. Focus. Strength. Self-defense skills, stress relief, and improved fitness.
                </p>
                <button
                  onClick={() => openOffer("teens-adults")}
                  className="bg-red-700 hover:bg-red-800 text-white w-full uppercase tracking-wider py-2.5 text-sm font-bold transition-colors rounded"
                >
                  Claim $29 Intro Offer →
                </button>
              </div>
            </motion.div>

            {/* Program Card 4 - Adult Karate */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 100, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 50, damping: 20, mass: 1 } }
              }}
              whileHover={{ y: -15, scale: 1.02, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-xl bg-zinc-900 h-[500px] shadow-2xl"
            >
              <div className="absolute inset-0">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero3_6fed392b.webp" alt="Adult Karate" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>
              <div className="absolute top-4 right-4 bg-gray-800 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full">
                2 Classes $29 + Uniform!
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="w-12 h-1 bg-primary mb-4 transform origin-left transition-all duration-300 group-hover:w-24"></div>
                <h4 className="text-3xl font-heading font-bold mb-2">ADULT KARATE</h4>
                <p className="text-gray-300 mb-2 text-sm uppercase tracking-wider">Adults</p>
                <p className="text-gray-400 mb-4 line-clamp-3 group-hover:text-white transition-colors">
                  Discipline. Power. Mastery. Traditional karate with real self-defense and mental discipline.
                </p>
                <button
                  onClick={() => openOffer("adult-karate")}
                  className="bg-gray-700 hover:bg-gray-600 text-white w-full uppercase tracking-wider py-2.5 text-sm font-bold transition-colors rounded"
                >
                  Claim $29 Intro Offer →
                </button>
              </div>
            </motion.div>

            {/* Program Card 5 - Kickboxing Fitness */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 100, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 50, damping: 20, mass: 1 } }
              }}
              whileHover={{ y: -15, scale: 1.02, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-xl bg-zinc-900 h-[500px] shadow-2xl"
            >
              <div className="absolute inset-0">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/kickboxing-bg_d4fcc4c5.webp" alt="Kickboxing Fitness" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              </div>
              <div className="absolute top-4 right-4 bg-green-700 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full">
                🔥 First Class FREE!
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8">
                <div className="w-12 h-1 bg-primary mb-4 transform origin-left transition-all duration-300 group-hover:w-24"></div>
                <h4 className="text-3xl font-heading font-bold mb-2">KICKBOXING</h4>
                <p className="text-gray-300 mb-2 text-sm uppercase tracking-wider">Teens & Adults</p>
                <p className="text-gray-400 mb-4 line-clamp-3 group-hover:text-white transition-colors">
                  Sweat Today. Feel Amazing. Burn 800 calories, relieve stress, and boost endurance.
                </p>
                <button
                  onClick={() => openOffer("kickboxing")}
                  className="bg-green-700 hover:bg-green-800 text-white w-full uppercase tracking-wider py-2.5 text-sm font-bold transition-colors rounded"
                >
                  Claim First Class FREE →
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <TestimonialCarousel />
      </section>

      <MasonryGallery />

      {/* FAQ Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <FAQ />
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/cta-bg_5eebb32b.webp')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6">READY TO START?</h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
            Join our high-energy, fat-burning 45-minute complimentary Karate or Kickboxing class!
          </p>
          <Button 
            onClick={openIntakeChatbot}
            className="bg-white text-primary hover:bg-black hover:text-white text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] transition-all duration-300 shadow-xl"
          >
            <span className="skew-x-[10deg]">Book Free Trial</span>
          </Button>
        </div>
      </section>

      {/* ChatGPT Chatbot */}
      {showChatGPT && <ChatGPTChatbot onClose={() => setShowChatGPT(false)} />}
      
      {/* Intake Chatbot (State Machine POC) */}
      {showIntakeBot && <IntakeChatbot onClose={() => setShowIntakeBot(false)} />}

      {/* Intro Offer Modal */}
      <IntroOfferModal
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        defaultProgramId={offerProgramId}
      />
    </div>
  );
}
