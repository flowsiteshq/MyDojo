import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ParticleButton } from "@/components/ui/ParticleButton";
import { Link } from "wouter";
import { openIntakeChatbot } from "@/lib/chatbot";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";

const slides = [
  {
    id: 1,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/zIDoaCehCnpgStnX.jpg",

    title: "FUN. FIT.",
    highlight: "STRONG.",
    description: "Experience the next evolution of martial arts training. Build confidence, discipline, and strength in a supportive, high-energy environment.",
    position: "center"
  },
  {
    id: 2,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/tlUXUuBPYHXCQoOD.jpg",

    title: "UNLEASH YOUR",
    highlight: "POTENTIAL.",
    description: "Push your limits with high-intensity kickboxing classes designed to burn calories and build lean muscle.",
    position: "center"
  },
  {
    id: 3,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/KsKIrIzsdElltAKx.jpg",

    title: "EMPOWER",
    highlight: "YOURSELF.",
    description: "Learn practical self-defense skills while getting in the best shape of your life.",
    position: "center"
  },
  {
    id: 4,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/KukjRoGgDzvifvHU.jpg",

    title: "CONFIDENCE",
    highlight: "FOR LIFE.",
    description: "Give your child the tools they need to succeed: focus, respect, and unshakeable self-belief.",
    position: "center"
  },
  {
    id: 5,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QCDmgxbjdlfUOCPT.jpg",

    title: "COMMUNITY",
    highlight: "DRIVEN.",
    description: "Join a supportive family of martial artists who will cheer you on every step of the way.",
    position: "center"
  },
  {
    id: 6,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/GGgzogAzEZfRZNKu.jpg",

    title: "TRAIN LIKE",
    highlight: "A PRO.",
    description: "World-class instruction in a state-of-the-art facility. Your journey to black belt starts here.",
    position: "center"
  }
];

interface HeroSliderProps {
  onOpenChatbot?: () => void;
}

export function HeroSlider({ onOpenChatbot }: HeroSliderProps = {}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { userCity, closestLocation } = useLocationContext();

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 10000); // Slowed down from 6s to 10s
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section 
      className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0 z-0"
        >
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className={`w-full h-full object-cover ${
              slides[currentSlide].position === "top" ? "object-top" : "object-center"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent"></div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col justify-end md:justify-center h-full pb-20 md:pb-0">
        <motion.div
          key={`content-${currentSlide}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h2 className="text-primary font-bold tracking-widest uppercase mb-4 text-lg md:text-xl">
            Welcome to MyDojo
          </h2>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white leading-tight mb-4 md:mb-6">
            {slides[currentSlide].title}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {slides[currentSlide].highlight}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-6 md:mb-8 max-w-xl leading-relaxed line-clamp-3 md:line-clamp-none">
            {slides[currentSlide].description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <ParticleButton 
              onClick={onOpenChatbot || openIntakeChatbot}
              className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] w-full sm:w-auto"
              particleColor="#ef4444"
              particleCount={20}
            >
              <span className="skew-x-[10deg]">Start Your Journey</span>
            </ParticleButton>
            <Link href={closestLocation ? `/locations/${closestLocation.id}` : (userCity ? `/locations?city=${encodeURIComponent(userCity)}` : "/locations")}>
              <Button className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] w-full sm:w-auto">
                <span className="skew-x-[10deg]">
                  {closestLocation ? `Find Classes in ${closestLocation.city}` : (userCity ? `Find Classes in ${userCity}` : "Find a Class Near Me")}
                </span>
              </Button>
            </Link>
            <Link href="/programs">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] w-full sm:w-auto"
              >
                <span className="skew-x-[10deg]">View Programs</span>
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-10 right-10 z-20 flex gap-4 hidden md:flex">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="rounded-full border-white/30 text-white hover:bg-white hover:text-black"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="rounded-full border-white/30 text-white hover:bg-white hover:text-black"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 md:hidden">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1);
              setCurrentSlide(index);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? "bg-primary w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
