import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Flame, Heart, Zap, Users, Music, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { openIntakeChatbot } from "@/lib/chatbot";

export default function Kickboxing() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/35CYYUnc6BwhasfDP62sKy-img-1_1771507294000_na1fn_a2lja2JveGluZy1oZXJvLWRpdmVyc2Utd29tZW4.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94LzM1Q1lZVW5jNkJ3aGFzZkRQNjJzS3ktaW1nLTFfMTc3MTUwNzI5NDAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTFvWlhKdkxXUnBkbVZ5YzJVdGQyOXRaVzQuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=a6KaND9mtW3wNiCQQtgCHHKO-lgDU-0XXgSg7QVznmcUI5K62b8h~cjQwYenAaBH5BlkZd3BRD7wGqjxIB7TcJh65HDBB0SuBgJYyVN33CkTxYdlw5AoP3fI~WuL6Bz13fZHxYqCD6MUJRnqgpVlYtzek5cZ5UEXnDF2hWGcGnDwX-uCjZITPYfcJ77twXOIKW53Z9ttUcCYthguaOEcyoPR0GjDl4tJ~tUDoVRAppfPkzHcMKAPow4NMOpBeGxLT-nwDPoxEuxqWaI~QyHNa01gXQLc64pgZrAOQvNMce9UgJp-JW5ICfUzELrLaXVmCjc0TaM0JqvPgERMDO3dSQ__" 
            alt="Diverse Women Kickboxing Class" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeIn}
            className="max-w-3xl"
          >
            <div className="inline-block bg-primary text-white text-sm font-bold uppercase tracking-widest px-4 py-2 mb-6 rounded-sm">
              High-Energy Fitness
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight">
              A FULL-BODY WORKOUT THAT <span className="text-primary">HITS DIFFERENT</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Burn up to 800 calories in 45 minutes with our high-energy kickboxing classes. Set to pumping music with dynamic hex lights, you'll punch and kick your way to the best shape of your life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="https://checkout.dojo-flow.ai/b/4gM9AS1Evfwgfgn7rm9Zm00" target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-7 h-auto font-heading uppercase tracking-wider">
                  Get Your $29 Trial
                </Button>
              </a>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-black text-lg px-10 py-7 h-auto font-heading uppercase tracking-wider"
              >
                Watch Class Video
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Repeating Tagline */}
        <div className="absolute bottom-0 left-0 right-0 bg-primary py-4 overflow-hidden">
          <div className="flex whitespace-nowrap animate-scroll">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-white font-heading font-bold text-2xl mx-8">
                GLOVES ON • WORLD OFF
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Energy Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-primary font-bold tracking-widest uppercase mb-4">The MyDojo Difference</h2>
              <h3 className="text-4xl md:text-5xl font-heading font-bold text-black mb-6">
                FITNESS CLASSES THAT BRING THE <span className="text-primary">ENERGY</span>
              </h3>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Not all gyms are created equal. Our high-energy kickboxing classes deliver powerful results while helping you unleash your inner strength. Burn calories, sweat away stress, and discover a fitness studio where you can truly let go and be yourself.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                We're all about fitness, community, and lifting each other up. Whether you're just getting started or looking for something new, you'll find your place here. From the supportive coaches who help you push beyond your limits to the people sweating it out alongside you, every 45-minute workout is a team effort—where encouragement and energy fuel your journey.
              </p>
              <Button onClick={openIntakeChatbot} className="bg-black hover:bg-black/90 text-white text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider">
                Start Your Journey
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/35CYYUnc6BwhasfDP62sKy-img-3_1771507282000_na1fn_a2lja2JveGluZy1iYWctd29yay1hY3Rpb24.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94LzM1Q1lZVW5jNkJ3aGFzZkRQNjJzS3ktaW1nLTNfMTc3MTUwNzI4MjAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTFpWVdjdGQyOXlheTFoWTNScGIyNC5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=CZGoy9oZdtBrMiJ9YYBCOduy84g9Q30oXZ4KeWkkCYaThfdP67b0Vr0bLRSTbrTUtNEv0AVURb59xZGQom-KDXIfSxo4fnX51opjqo0fBtyxOugTdhJ3nkI-mdvhaUyVqLhst7ah2TdbcTPPDZWVXFUCyJ4k0pZzKyLkL4C0Xvd-1lTrRKzU1v8E3iCMqFq4Lyxis6p~1hXUSEE~WWg5L07ggkSsFeJFgwmraz4c2s60yQzo-wc5UaVIZYZ2CsR6DWXWaXtp~yEknR2UigiOOR3dXk4YAb9ptzO9ukmQ82bKOpHW4Fb~k2ohg4QSyzkDe0-LFLnhCwQR7Nl7gasbnw__" 
                  alt="Women Kickboxing Training" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-full h-full border-4 border-primary rounded-2xl z-0"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-4">Why Kickboxing?</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-white">
              TRANSFORM YOUR BODY & MIND
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Flame,
                title: "Burn 800 Calories",
                description: "Torch calories with our high-intensity 45-minute workouts. Real kickboxing techniques combined with cardio conditioning for maximum fat burn."
              },
              {
                icon: Heart,
                title: "Stress Relief",
                description: "Punch and kick away the stress of your day. There's nothing more satisfying than unleashing your power on a heavy bag."
              },
              {
                icon: Zap,
                title: "Full-Body Workout",
                description: "Every muscle group gets worked. Build lean muscle, improve cardio endurance, and increase flexibility all in one session."
              },
              {
                icon: Users,
                title: "Supportive Community",
                description: "Train alongside people who lift you up. Our coaches and members create an encouraging environment where everyone belongs."
              },
              {
                icon: Music,
                title: "Energizing Music",
                description: "Feel the beat as you train. Our curated playlists keep your energy high and make every class feel like a party."
              },
              {
                icon: Lightbulb,
                title: "Dynamic Hex Lights",
                description: "Experience the electric atmosphere with our signature hex lights that pulse with the music. It's a workout and a show."
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-zinc-800 p-8 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                <benefit.icon className="w-12 h-12 text-primary mb-4" />
                <h4 className="text-2xl font-heading font-bold text-white mb-3">{benefit.title}</h4>
                <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/images/hero-main.jpg')] bg-cover bg-center"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-white font-bold tracking-widest uppercase mb-4">Our Mission</h2>
          <h3 className="text-4xl md:text-6xl font-heading font-bold text-white mb-8">
            CHANGING LIVES WITH KICKBOXING
          </h3>
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
            Kickboxing fitness isn't just about getting stronger—it's about unlocking your physical and mental power. Our instructor-led classes push you to go further, hit harder, and grow stronger every time you show up. You won't walk off the mat the same—and that's exactly the point. At MyDojo, it's not just a workout. It's a total transformation.
          </p>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-primary font-bold tracking-widest uppercase mb-4">First-Time Fighter?</h2>
              <h3 className="text-4xl md:text-5xl font-heading font-bold text-black mb-6">
                WHAT TO EXPECT AT YOUR FIRST CLASS
              </h3>
              <p className="text-xl text-gray-600">
                Getting ready for your first MyDojo Kickboxing class? We can't wait to meet you! Here's what you need to know to show up ready to crush your 45-minute workout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {[
                {
                  step: "01",
                  title: "Arrive Early",
                  description: "Please arrive 15 minutes before your first class so we can help you get set up with gloves and hand wraps."
                },
                {
                  step: "02",
                  title: "What to Wear",
                  description: "Comfortable workout clothes and bare feet—we train barefoot like traditional martial arts studios."
                },
                {
                  step: "03",
                  title: "Gear You'll Need",
                  description: "Hand wraps and boxing gloves are required. We'll help you secure the right gear before your first class."
                },
                {
                  step: "04",
                  title: "Class Structure",
                  description: "Warm-up → Kickboxing bag work → Core exercises → Cooldown. Your coach guides you every step of the way."
                },
                {
                  step: "05",
                  title: "Real Techniques",
                  description: "You'll learn authentic kickboxing skills—exciting, empowering moves that keep you engaged and help you reach your goals."
                },
                {
                  step: "06",
                  title: "Your Pace",
                  description: "Take each exercise at your own pace. Your coach will provide modifications and support whenever you need it."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-50 p-6 rounded-xl border-l-4 border-primary"
                >
                  <div className="text-primary font-heading font-bold text-3xl mb-2">{item.step}</div>
                  <h4 className="text-xl font-heading font-bold text-black mb-2">{item.title}</h4>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button onClick={openIntakeChatbot} className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-7 h-auto font-heading uppercase tracking-wider">
                Book Your Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Class Breakdown Section */}
      <section className="py-24 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-4">The Workout</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-white">
              YOUR 45-MINUTE TRANSFORMATION
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                time: "0-10 min",
                title: "Warm-Up",
                description: "Dynamic stretches and movement prep to get your body ready for action.",
                image: "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/hayHxM7ppprx0Ka6XXioTt-img-1_1771508066000_na1fn_a2lja2JveGluZy13YXJtdXAtaGV4LWxpZ2h0cw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L2hheUh4TTdwcHByeDBLYTZYWGlvVHQtaW1nLTFfMTc3MTUwODA2NjAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTEzWVhKdGRYQXRhR1Y0TFd4cFoyaDBjdy5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=QlkBeY-9BCiBKq0uNu2PRuaKbfqYQtQIEwO9Y-bVb49l48RdxtWRHo3klxqI~VZT8xSwB23rApzOUY5~2pYaztaWm~Pe~t~FkzsircTSiUujdzptYHcrPKdsJgPgriQ7WqpWzmltwYk1VHn4MykdttlMejIzgN7s3uTYNGFqUzGgcZgzi7be6kKyIFt-GMeMWqNtFwtbbc6FWqE6~0~TOOEv5~6nOYbZCbjLGylcPiDqbbrPKfeDrhflWMeywQMKu6WYcrvoNZIuyFy6YgDIOFdcItmY84ZFfo~ZVgEDsLrumHp3e9GtbuQuStbNg4lCCmsHO2lSDrwTFG4zivc0kg__"
              },
              {
                time: "10-35 min",
                title: "Bag Work",
                description: "High-intensity kickboxing combinations on heavy bags. This is where the magic happens.",
                image: "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/35CYYUnc6BwhasfDP62sKy-img-3_1771507282000_na1fn_a2lja2JveGluZy1iYWctd29yay1hY3Rpb24.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94LzM1Q1lZVW5jNkJ3aGFzZkRQNjJzS3ktaW1nLTNfMTc3MTUwNzI4MjAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTFpWVdjdGQyOXlheTFoWTNScGIyNC5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=CZGoy9oZdtBrMiJ9YYBCOduy84g9Q30oXZ4KeWkkCYaThfdP67b0Vr0bLRSTbrTUtNEv0AVURb59xZGQom-KDXIfSxo4fnX51opjqo0fBtyxOugTdhJ3nkI-mdvhaUyVqLhst7ah2TdbcTPPDZWVXFUCyJ4k0pZzKyLkL4C0Xvd-1lTrRKzU1v8E3iCMqFq4Lyxis6p~1hXUSEE~WWg5L07ggkSsFeJFgwmraz4c2s60yQzo-wc5UaVIZYZ2CsR6DWXWaXtp~yEknR2UigiOOR3dXk4YAb9ptzO9ukmQ82bKOpHW4Fb~k2ohg4QSyzkDe0-LFLnhCwQR7Nl7gasbnw__"
              },
              {
                time: "35-42 min",
                title: "Core Work",
                description: "Targeted ab and core exercises to build strength and definition.",
                image: "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/lpyUBgxOWNkdoBxn3w7Gog-img-1_1771509922000_na1fn_a2lja2JveGluZy1jb3JlLWhleC1saWdodHM.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L2xweVVCZ3hPV05rZG9CeG4zdzdHb2ctaW1nLTFfMTc3MTUwOTkyMjAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTFqYjNKbExXaGxlQzFzYVdkb2RITS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=PdKtQL5tMuTZ1VTz8469xMe1~3CyIpxhhqRwXX6IoroPXv1UmF2Fi3IUtVXjCm9mH9QxjeCl8oNROtxnVXcvFFF296fe2hFCeSJv170zflCEbY~rVWsGp19HMx2EnYZ2qxpmVOSiN48wDfolnxaeS5Klfpvt-eUmwURuYbH-lpK8zqzcAjoU2ZqvBJRZtqZ97DaktWesY8psyDO9~QrQW4rY2fxKI~tl-NKJ2C8oy7bkeXS~noFanuuZOlFIP9MZwRHO1sMEqCXsCVhybKkJ2aBU3LbsdqSJt7vDrdGyqB00PS~iR7usOJ4I7iA4iHi4ho6OW32n0Y9RgelFE1zhMQ__"
              },
              {
                time: "42-45 min",
                title: "Cool Down",
                description: "Stretching and recovery to help your muscles repair and grow stronger.",
                image: "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/hayHxM7ppprx0Ka6XXioTt-img-2_1771508055000_na1fn_a2lja2JveGluZy1jb29sZG93bi1oZXgtbGlnaHRz.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L2hheUh4TTdwcHByeDBLYTZYWGlvVHQtaW1nLTJfMTc3MTUwODA1NTAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTFqYjI5c1pHOTNiaTFvWlhndGJHbG5hSFJ6LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=g2fqR6xs5SvtUq7vhe9u2LYG6xQ1rX2Kha-2NIhdh74ragAphJIcHNukUbrjJnV8Vgx8OmBns2ysDHV0miA24~X2GzEjpdy21Izp9GoHaozbS72z~uRFtaXcELq2GjrhHsBeZN2xs6wDslywc-LJKtMvVy7KXhUdACnwadKfpErGqoDMTZFhPlufFxsyjIBYw0LEFdSQ58N3G-IOjWIyuMRlLGfcm9cuiFO2v2-FgP-l0Fk3lZE~t7UEPSOv5fTNMHkhFcjPov8JZg9J6z~lzT5askwZtff2gbjkFEgj~USUDoVkdcWNx-vrAB13gAliP6XGMr3YSjXS9Fr2mS9IKg__"
              }
            ].map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-zinc-800 p-8 rounded-xl text-center hover:bg-zinc-700 transition-colors"
              >
                <div className="mb-4 rounded-lg overflow-hidden h-48">
                  <img src={phase.image} alt={phase.title} className="w-full h-full object-cover" />
                </div>
                <div className="text-primary font-bold text-sm uppercase tracking-wider mb-2">{phase.time}</div>
                <h4 className="text-2xl font-heading font-bold text-white mb-3">{phase.title}</h4>
                <p className="text-gray-400">{phase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-4">Member Love</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-black">
              HEAR FROM OUR FIGHTERS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                location: "Tomball, TX",
                text: "I've been coming to MyDojo Kickboxing for 6 months and I've lost 25 pounds! The music and lights make it feel like a party, not a workout. The coaches are amazing and push you to be your best.",
                rating: 5
              },
              {
                name: "Mike T.",
                location: "Tomball, TX",
                text: "Best workout I've ever done. I was skeptical at first, but after one class I was hooked. The energy is incredible and you can really feel the burn. Highly recommend!",
                rating: 5
              },
              {
                name: "Jessica L.",
                location: "Tomball, TX",
                text: "This place changed my life. I was never a 'gym person' but kickboxing is different. It's fun, it's challenging, and the community is so supportive. I look forward to every class!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-gray-50 p-8 rounded-xl shadow-lg"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-primary text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-heading font-bold text-black">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* $29 Trial Offer Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-7xl font-heading font-bold mb-6">
              SPECIAL INTRO OFFER: $29
            </h2>
            <p className="text-2xl md:text-3xl mb-8 max-w-3xl mx-auto">
              Get 3 kickboxing classes + FREE gloves + nutrition guide
            </p>
            <a href="https://checkout.dojo-flow.ai/b/4gM9AS1Evfwgfgn7rm9Zm00" target="_blank" rel="noopener noreferrer">
              <Button className="bg-white text-primary hover:bg-black hover:text-white text-xl px-12 py-8 h-auto font-heading uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all">
                PURCHASE NOW
              </Button>
            </a>
            <p className="text-white/90 mt-6 text-lg italic">For first-time clients only. Limit one per person.</p>
          </motion.div>
        </div>
      </section>

      {/* Class Schedule Section */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-6xl font-heading font-bold mb-4">
              CLASS SCHEDULE
            </h3>
            <p className="text-xl text-gray-400">All classes are 45 minutes • Signature Kickboxing</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-6xl mx-auto">
            {[
              { day: "Monday", times: ["6:00 AM", "12:00 PM", "5:00 PM", "7:00 PM"] },
              { day: "Tuesday", times: ["6:00 AM", "5:00 PM", "7:00 PM"] },
              { day: "Wednesday", times: ["6:00 AM", "12:00 PM", "5:00 PM", "7:00 PM"] },
              { day: "Thursday", times: ["6:00 AM", "5:00 PM", "7:00 PM"] },
              { day: "Friday", times: ["6:00 AM", "12:00 PM", "5:00 PM"] },
              { day: "Saturday", times: ["9:00 AM", "10:30 AM"] },
              { day: "Sunday", times: ["9:00 AM", "10:30 AM"] }
            ].map((schedule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-zinc-900 rounded-xl p-6 text-center"
              >
                <h4 className="font-heading font-bold text-primary text-xl mb-4">{schedule.day}</h4>
                <div className="space-y-2">
                  {schedule.times.map((time, timeIndex) => (
                    <div key={timeIndex} className="bg-primary text-white py-2 px-4 rounded-lg text-sm font-bold">
                      {time}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="https://checkout.dojo-flow.ai/b/4gM9AS1Evfwgfgn7rm9Zm00" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider">
                BOOK YOUR CLASS
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="py-24 bg-zinc-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-4xl md:text-5xl font-heading font-bold mb-8 text-primary">
                WHERE WE ARE
              </h3>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-xl font-heading font-bold mb-2">Address</h4>
                  <p className="text-gray-300 text-lg">
                    123 Main Street<br />
                    Your City, ST 12345
                  </p>
                </div>

                <div>
                  <h4 className="text-xl font-heading font-bold mb-2">Phone</h4>
                  <a href="tel:+15551234567" className="text-primary hover:text-primary/80 text-lg">
                    (555) 123-4567
                  </a>
                </div>

                <div>
                  <h4 className="text-xl font-heading font-bold mb-2">Email</h4>
                  <a href="mailto:kickboxing@mydojo.com" className="text-primary hover:text-primary/80 text-lg">
                    kickboxing@mydojo.com
                  </a>
                </div>

                <div>
                  <h4 className="text-xl font-heading font-bold mb-2">Studio Hours</h4>
                  <p className="text-gray-300">
                    Monday - Friday: 6:00 AM - 8:00 PM<br />
                    Saturday - Sunday: 8:00 AM - 12:00 PM
                  </p>
                </div>
              </div>

              <h4 className="text-2xl font-heading font-bold mb-4 text-primary">Studio Amenities</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🅿️", text: "Free Parking" },
                  { icon: "🚿", text: "Locker Rooms" },
                  { icon: "🛍️", text: "Pro Shop" },
                  { icon: "💧", text: "Water Station" },
                  { icon: "📱", text: "Heart Rate Monitors" },
                  { icon: "🎵", text: "Premium Sound System" }
                ].map((amenity, index) => (
                  <div key={index} className="flex items-center gap-3 bg-zinc-800 p-4 rounded-lg">
                    <span className="text-2xl">{amenity.icon}</span>
                    <span className="text-gray-300">{amenity.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="h-[600px] rounded-xl overflow-hidden shadow-2xl"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1841524890814!2d-73.98823492346449!3d40.75889797138558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1708372800000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-zinc-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-4">Got Questions?</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-bold text-white">
              KICKBOXING FAQ
            </h3>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                question: "Do I need any experience to start?",
                answer: "Absolutely not! Our kickboxing classes are designed for all fitness levels. Our certified instructors will guide you through proper form and technique, whether you're a complete beginner or have martial arts experience."
              },
              {
                question: "What should I wear and bring?",
                answer: "Wear comfortable athletic clothing (sports bra/tank top and leggings work great). We provide gloves for your first class, but you'll want to purchase your own pair after that. Bring water, a towel, and your energy!"
              },
              {
                question: "How many calories will I burn?",
                answer: "Most members burn between 600-800 calories in a single 45-minute class! The high-intensity intervals combined with strength training create an incredible calorie-burning effect that continues even after class ends."
              },
              {
                question: "Will I get bulky from kickboxing?",
                answer: "No! Kickboxing creates lean, toned muscle definition rather than bulk. The combination of cardio and resistance training helps you burn fat while building strong, sculpted muscles. You'll get that athletic, toned look."
              },
              {
                question: "How often should I attend classes?",
                answer: "We recommend 3-4 classes per week for optimal results. This gives your body time to recover while maintaining consistency. Many members see significant changes in their fitness and physique within the first month!"
              },
              {
                question: "What makes your kickboxing different?",
                answer: "Our classes feature dynamic hex lights, pumping music, and an energetic club-like atmosphere that makes working out feel like a party. Plus, our certified instructors create a supportive community where everyone pushes each other to be their best."
              },
              {
                question: "Is there a contract?",
                answer: "We offer flexible membership options with no long-term contracts required. You can cancel anytime. We believe in earning your membership every month by delivering an amazing experience."
              },
              {
                question: "Can I try a class before committing?",
                answer: "Yes! Your first class is completely FREE. Come experience the energy, meet our instructors, and see if kickboxing is right for you. No credit card required to book your trial class."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-zinc-800 rounded-xl p-8 hover:bg-zinc-700 transition-colors"
              >
                <h4 className="text-xl font-heading font-bold text-primary mb-4">{faq.question}</h4>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/35CYYUnc6BwhasfDP62sKy-img-1_1771507294000_na1fn_a2lja2JveGluZy1oZXJvLWRpdmVyc2Utd29tZW4.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94LzM1Q1lZVW5jNkJ3aGFzZkRQNjJzS3ktaW1nLTFfMTc3MTUwNzI5NDAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTFvWlhKdkxXUnBkbVZ5YzJVdGQyOXRaVzQuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=a6KaND9mtW3wNiCQQtgCHHKO-lgDU-0XXgSg7QVznmcUI5K62b8h~cjQwYenAaBH5BlkZd3BRD7wGqjxIB7TcJh65HDBB0SuBgJYyVN33CkTxYdlw5AoP3fI~WuL6Bz13fZHxYqCD6MUJRnqgpVlYtzek5cZ5UEXnDF2hWGcGnDwX-uCjZITPYfcJ77twXOIKW53Z9ttUcCYthguaOEcyoPR0GjDl4tJ~tUDoVRAppfPkzHcMKAPow4NMOpBeGxLT-nwDPoxEuxqWaI~QyHNa01gXQLc64pgZrAOQvNMce9UgJp-JW5ICfUzELrLaXVmCjc0TaM0JqvPgERMDO3dSQ__" 
            alt="Kickboxing Community" 
            className="w-full h-full object-cover opacity-20 mix-blend-overlay"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-heading font-bold text-white mb-8">
              READY TO UNLEASH YOUR POWER?
            </h2>
            <p className="text-2xl md:text-3xl text-white/90 mb-12 max-w-3xl mx-auto">
              Join our high-energy kickboxing community and transform your body and mind. Your first class is FREE!
            </p>
            <a href="https://checkout.dojo-flow.ai/b/4gM9AS1Evfwgfgn7rm9Zm00" target="_blank" rel="noopener noreferrer">
              <Button className="bg-white text-primary hover:bg-black hover:text-white text-xl px-12 py-8 h-auto font-heading uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all">
                Get Your $29 Trial
              </Button>
            </a>
            <p className="text-white/80 mt-6 text-lg">No experience necessary • All fitness levels welcome • Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
