import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ParticleButton } from "@/components/ui/ParticleButton";
import { Link } from "wouter";
import { openIntakeChatbot } from "@/lib/chatbot";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { ProgramFinderPopup } from "@/components/ProgramFinderPopup";

// Base slides (always available)
const BASE_SLIDES = [
  {
    id: 1,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero1_1d3d63d3.webp",
    position: "center"
  },
  {
    id: 2,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero2_cef79f5f.webp",
    position: "center"
  },
  {
    id: 3,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero3_6fed392b.webp",
    position: "center"
  },
  {
    id: 4,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero4_98841652.webp",
    position: "center"
  },
  {
    id: 5,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero5_e53b2006.webp",
    position: "center"
  },
  {
    id: 6,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero6_32ad6fad.webp",
    position: "center"
  }
];

// Holiday-specific slide images
const HOLIDAY_SLIDES: Record<string, typeof BASE_SLIDES> = {
  "Mother's Day": [
    { id: 1, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero4_98841652.webp", position: "center" },
    { id: 2, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero5_e53b2006.webp", position: "center" },
    { id: 3, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero1_1d3d63d3.webp", position: "center" },
  ],
  "Summer Camp": [
    { id: 1, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero4_98841652.webp", position: "center" },
    { id: 2, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero1_1d3d63d3.webp", position: "center" },
    { id: 3, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero5_e53b2006.webp", position: "center" },
  ],
  "Back to School": [
    { id: 1, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero4_98841652.webp", position: "center" },
    { id: 2, image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero1_1d3d63d3.webp", position: "center" },
  ],
};

const DEFAULT_CONTENT = {
  headline: "FUN. FIT. STRONG.",
  subheadline: "PROGRAMS FOR EVERY AGE",
  targetMessage: "Experience martial arts training for every age. Build confidence, discipline, and strength.",
  ctaText: "Book Your Free Class",
  badgeText: "Limited Spots Available",
  holiday: null as string | null,
  season: "general" as string,
  targetAudience: "everyone" as string,
  urgency: "" as string,
  isSummerCamp: false,
  isMothersDay: false,
};

interface HeroSliderProps {
  onOpenChatbot?: () => void;
}

export function HeroSlider({ onOpenChatbot }: HeroSliderProps = {}) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const { userCity, closestLocation } = useLocationContext();

  const { data: heroContent } = trpc.heroContent.getHeroContent.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const content = heroContent || DEFAULT_CONTENT;

  // Use holiday-specific slides if available, otherwise fall back to base slides
  const slides = (content.holiday && HOLIDAY_SLIDES[content.holiday]) ? HOLIDAY_SLIDES[content.holiday] : BASE_SLIDES;

  const getBadge = () => {
    if (content.isMothersDay) return { text: "🌸 Happy Mother's Day — Give the Gift of Confidence!", color: "#be185d" };
    if (content.isSummerCamp) return { text: "☀️ Summer Camp Now Enrolling — Limited Spots!", color: "#0891B2" };
    if (content.holiday) return { text: `🎉 ${content.holiday} Special Offer!`, color: "#E10600" };
    return { text: "Limited Spots Available — Book Your Free Class Today!", color: "#E10600" };
  };

  const badge = getBadge();

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
    if (paused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 10000);
    return () => clearInterval(timer);
  }, [currentSlide, paused]);

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
    <>
    <section 
      className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Holiday/seasonal banner strip */}
      <div
        className="absolute top-0 left-0 right-0 z-20 py-2 px-4 text-center text-xs font-bold uppercase tracking-widest text-white"
        style={{ backgroundColor: badge.color }}
      >
        {badge.text}
      </div>
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
            alt="MyDojo Martial Arts"
            loading={currentSlide === 0 ? "eager" : "lazy"}
            fetchPriority={currentSlide === 0 ? "high" : "low"}
            className={`w-full h-full object-cover ${
              slides[currentSlide].position === "top" ? "object-top" : "object-center"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent"></div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 flex flex-col justify-end md:justify-center h-full pb-20 md:pb-0 pt-8">
        <motion.div
          key={`content-${currentSlide}-${content.holiday}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h2 className="text-primary font-bold tracking-widest uppercase mb-4 text-lg md:text-xl">
            {content.subheadline || "PROGRAMS FOR EVERY AGE"}
          </h2>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white leading-tight mb-4 md:mb-6">
            {content.isMothersDay
              ? <><span>EMPOWER</span><br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-white">MOM'S CHOICE.</span></>
              : content.isSummerCamp
              ? <><span>SUMMER</span><br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-white">CAMP IS HERE.</span></>
              : <>{content.headline || "FUN. FIT."}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">STRONG.</span></>}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-6 md:mb-8 max-w-xl leading-relaxed line-clamp-3 md:line-clamp-none">
            {(content as typeof DEFAULT_CONTENT & { description?: string }).description || (content as typeof DEFAULT_CONTENT).targetMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Primary CTA */}
            <button
              onClick={() => setOfferModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-5 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] w-full sm:w-auto transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <span className="skew-x-[10deg] flex items-center">
                <span className="font-black">{content.ctaText || t("general.book_free_class")}</span>
              </span>
            </button>
            <Link href={closestLocation ? `/locations/${closestLocation.id}` : (userCity ? `/locations?city=${encodeURIComponent(userCity)}` : "/locations")}>
              <Button className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] w-full sm:w-auto">
                <span className="skew-x-[10deg]">
                  {closestLocation ? `${t("schedule.all_classes")} in ${closestLocation.city}` : (userCity ? `${t("schedule.all_classes")} in ${userCity}` : t("general.view_schedule"))}
                </span>
              </Button>
            </Link>
            <Link href="/programs">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black text-lg px-8 py-6 h-auto font-heading uppercase tracking-wider skew-x-[-10deg] w-full sm:w-auto"
              >
                <span className="skew-x-[10deg]">{t("general.view_all")}</span>
              </Button>
            </Link>
          </div>
          {/* Social proof mini-stat */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex -space-x-2">
              {[11, 12, 13, 14].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-600 overflow-hidden">
                  <img src={`https://i.pravatar.cc/32?img=${i}`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-300">
              <span className="text-white font-bold">500+</span> {t("lang.english") === "English" ? "families enrolled this year" : "familias inscritas este año"}
            </p>
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
      {/* Pause/play */}
      <button
        onClick={() => setPaused((p) => !p)}
        className="absolute bottom-10 left-4 z-20 text-white/50 hover:text-white transition-colors hidden md:block"
        aria-label={paused ? "Resume" : "Pause"}
      >
        {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>
    </section>
    <ProgramFinderPopup isOpen={offerModalOpen} onClose={() => setOfferModalOpen(false)} />
    </>
  );
}
