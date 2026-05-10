import { useState, useEffect } from "react";
import { X, Star, ChevronRight, Shield, Zap, Users, Award, Flame, ArrowRight, Check, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CHILD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/popup-card-child-bLGQWmY93vixcyFEBo3Jf9.webp";
const MYSELF_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/popup-card-myself-Q28shwqFCizjLa57ncRJDq.webp";
const FAMILY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/popup-card-family-AsxQoWfuzLKSK4vLwUoDoW.webp";

type Audience = "child" | "myself" | "family" | null;
type Step = 1 | 2 | 3;

interface Program {
  id: string;
  name: string;
  age: string;
  tagline: string;
  benefits: string[];
  offer: string;
  price: string | null;
  color: string;
  icon: React.ReactNode;
  isFree?: boolean;
}

const PROGRAMS: Record<string, Program[]> = {
  child: [
    {
      id: "little-ninjas",
      name: "Little Ninjas",
      age: "Ages 3–5",
      tagline: "Big confidence starts here.",
      benefits: ["Builds confidence & focus", "Listening & social skills", "Fun, safe environment"],
      offer: "2 Classes + Uniform",
      price: "$29",
      color: "from-purple-600 to-purple-900",
      icon: <Star className="w-5 h-5" />,
    },
    {
      id: "kids-martial-arts",
      name: "Kids Martial Arts",
      age: "Ages 6–12",
      tagline: "Strong today. Leader tomorrow.",
      benefits: ["Anti-bullying skills", "Discipline & respect", "Improved fitness"],
      offer: "2 Classes + Uniform",
      price: "$29",
      color: "from-blue-600 to-blue-900",
      icon: <Shield className="w-5 h-5" />,
    },
  ],
  myself: [
    {
      id: "teens-adults",
      name: "Teens & Adults Martial Arts",
      age: "Ages 13+",
      tagline: "Confidence. Focus. Strength.",
      benefits: ["Real self-defense skills", "Stress relief", "Build confidence"],
      offer: "2 Classes + Uniform",
      price: "$29",
      color: "from-red-600 to-red-900",
      icon: <Award className="w-5 h-5" />,
    },
    {
      id: "adult-karate",
      name: "Adult Karate",
      age: "Adults",
      tagline: "Discipline meets transformation.",
      benefits: ["Traditional martial arts", "Mental clarity", "Physical conditioning"],
      offer: "2 Classes + Uniform",
      price: "$29",
      color: "from-gray-600 to-gray-900",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: "kickboxing",
      name: "Kickboxing Fitness",
      age: "Teens & Adults",
      tagline: "Sweat today. Feel amazing.",
      benefits: ["Burn 800 calories/session", "Relieve stress", "High-energy workouts"],
      offer: "First Class Free",
      price: null,
      isFree: true,
      color: "from-orange-600 to-orange-900",
      icon: <Flame className="w-5 h-5" />,
    },
  ],
  family: [
    {
      id: "kids-martial-arts",
      name: "Kids Martial Arts",
      age: "Ages 6–12",
      tagline: "Strong today. Leader tomorrow.",
      benefits: ["Anti-bullying skills", "Discipline & respect", "Improved fitness"],
      offer: "2 Classes + Uniform",
      price: "$29",
      color: "from-blue-600 to-blue-900",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: "teens-adults",
      name: "Teens & Adults Martial Arts",
      age: "Ages 13+",
      tagline: "Train together. Grow together.",
      benefits: ["Family bonding", "Shared goals", "Mutual accountability"],
      offer: "2 Classes + Uniform",
      price: "$29",
      color: "from-red-600 to-red-900",
      icon: <Users className="w-5 h-5" />,
    },
  ],
};

const TESTIMONIALS = [
  { name: "Sarah M.", text: "My son used to be shy and lacked confidence. Now he's focused, respectful, and proud to be at MyDojo!", stars: 5 },
  { name: "Jessica P.", text: "The best decision we've ever made for our family. The instructors truly care.", stars: 5 },
  { name: "Michael R.", text: "I've lost 30 lbs and gained more confidence than I've had in years. This place is life-changing.", stars: 5 },
  { name: "Amanda T.", text: "I feel stronger, healthier, and happier! The community here is incredible.", stars: 5 },
  { name: "Carlos D.", text: "My daughter went from being bullied to standing tall. MyDojo changed her life.", stars: 5 },
];

const AUDIENCE_CARDS = [
  {
    id: "child" as Audience,
    label: "My Child",
    sub: "Build confidence, focus, and discipline for life.",
    image: CHILD_IMG,
    reviews: 320,
    tag: "MOST POPULAR",
    tagColor: "bg-red-600",
  },
  {
    id: "myself" as Audience,
    label: "Myself",
    sub: "Get fit, learn self-defense, and feel unstoppable.",
    image: MYSELF_IMG,
    reviews: 185,
    tag: null,
    tagColor: "",
  },
  {
    id: "family" as Audience,
    label: "Whole Family",
    sub: "Train together, grow together, succeed together.",
    image: FAMILY_IMG,
    reviews: 120,
    tag: null,
    tagColor: "",
  },
];

interface ProgramFinderPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProgramFinderPopup({ isOpen, onClose }: ProgramFinderPopupProps) {
  const [step, setStep] = useState<Step>(1);
  const [audience, setAudience] = useState<Audience>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutMutation = trpc.popup.createIntroOfferCheckout.useMutation();


  // Rotate testimonials
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setAudience(null);
        setSelectedProgram(null);
        setForm({ name: "", email: "", phone: "" });
      }, 300);
    }
  }, [isOpen]);

  const handleAudienceSelect = (a: Audience) => {
    setAudience(a);
    setStep(2);
  };

  const handleProgramSelect = (p: Program) => {
    setSelectedProgram(p);
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !form.name || !form.email || !form.phone) return;
    setIsSubmitting(true);
    try {
      if (selectedProgram.isFree) {
        // Free class — schedule directly
        toast.success("You're booked! We'll contact you shortly to confirm your free class.");
        onClose();
      } else {
        const result = await checkoutMutation.mutateAsync({
          name: form.name,
          email: form.email,
          phone: form.phone,
          program: selectedProgram.id,
        });
        if (result?.checkoutUrl) {
          window.open(result.checkoutUrl, "_blank");
          onClose();
        }
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const testimonial = TESTIMONIALS[testimonialIndex];
  const programs = audience ? PROGRAMS[audience] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%)",
          border: "1px solid rgba(220,38,38,0.3)",
          boxShadow: "0 0 80px rgba(220,38,38,0.2), 0 25px 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex h-full" style={{ minHeight: "560px", maxHeight: "88vh" }}>
          {/* LEFT PANEL */}
          <div className="hidden lg:flex lg:w-[38%] flex-col relative overflow-hidden">
            {/* Background image based on audience */}
            <div className="absolute inset-0">
              <img
                src={audience === "myself" ? MYSELF_IMG : audience === "family" ? FAMILY_IMG : CHILD_IMG}
                alt="MyDojo"
                className="w-full h-full object-cover object-top transition-all duration-700"
                style={{ filter: "brightness(0.55)" }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, #0a0a0a 100%), linear-gradient(to top, #0a0a0a 0%, transparent 40%)" }} />
            </div>

            {/* Left content */}
            <div className="relative z-10 flex flex-col h-full p-7 justify-between">
              {/* Logo + title */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <img src="/images/logo.png" alt="MyDojo" className="h-10 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div>
                    <div className="text-white font-black text-lg leading-none">MYDOJO</div>
                    <div className="text-red-400 text-xs tracking-widest uppercase">Martial Arts</div>
                  </div>
                </div>
                <h2 className="text-white font-black text-3xl leading-tight mb-2">
                  FIND YOUR<br />
                  <span className="text-red-500">PERFECT</span><br />
                  PROGRAM
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Answer 1 quick question and we'll match you with the best program for your goals.
                </p>
              </div>

              {/* Rotating testimonial */}
              <div
                className="rounded-xl p-4 transition-all duration-500"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
              >
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-white text-sm leading-relaxed mb-2 italic">"{testimonial.text}"</p>
                <p className="text-red-400 text-xs font-semibold">— {testimonial.name}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[["500+", "5-Star Reviews"], ["10+", "Years of Impact"], ["10,000+", "Transformed"]].map(([num, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-yellow-400 font-black text-lg leading-none">{num}</div>
                    <div className="text-gray-400 text-xs mt-0.5 leading-tight">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: s === step ? "48px" : "24px",
                        background: s <= step ? "#dc2626" : "rgba(255,255,255,0.15)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <span className="text-gray-400 text-xs">STEP {step} OF 3</span>
            </div>

            <div className="flex-1 px-6 pb-6">
              {/* STEP 1: Audience selection */}
              {step === 1 && (
                <div>
                  <h3 className="text-white font-black text-2xl mb-1">WHO IS THIS PROGRAM FOR?</h3>
                  <p className="text-gray-400 text-sm mb-5">Select one to get started</p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {AUDIENCE_CARDS.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleAudienceSelect(card.id)}
                        className="relative rounded-xl overflow-hidden group cursor-pointer text-left transition-all duration-300 hover:scale-[1.03]"
                        style={{
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        }}
                      >
                        {/* Card image */}
                        <div className="relative h-36 overflow-hidden">
                          <img
                            src={card.image}
                            alt={card.label}
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%)" }} />
                          {/* Glow on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: "inset 0 0 30px rgba(220,38,38,0.4)" }} />
                          {card.tag && (
                            <div className={`absolute top-2 left-2 ${card.tagColor} text-white text-xs font-black px-2 py-0.5 rounded-full`}>
                              {card.tag}
                            </div>
                          )}
                        </div>
                        {/* Card content */}
                        <div className="p-3" style={{ background: "rgba(15,15,15,0.95)" }}>
                          <div className="text-white font-black text-base mb-1">{card.label}</div>
                          <div className="text-gray-400 text-xs leading-tight mb-2">{card.sub}</div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-yellow-400 text-xs font-bold">4.9</span>
                            <span className="text-gray-500 text-xs">({card.reviews})</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Trust bar */}
                  <div className="flex items-center justify-center gap-6 py-3 border-t border-white/10">
                    {[["Expert Instructors", Shield], ["Proven Results", Award], ["Positive Community", Users]].map(([label, Icon]) => (
                      <div key={label as string} className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-gray-400 text-xs">{label as string}</span>
                      </div>
                    ))}
                  </div>

                  {/* Urgency + CTA */}
                  <div className="mt-4 rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)" }}>
                    <div className="flex items-center gap-3">
                      <div className="text-red-500">
                        <Clock className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-white font-black text-lg leading-none">2 CLASSES FOR ONLY <span className="text-red-500">$29</span></div>
                        <div className="text-gray-400 text-xs mt-0.5">LIMITED INTRO SPOTS AVAILABLE</div>
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs text-right">
                      <div className="text-white font-semibold">Uniform</div>
                      <div>Included</div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Program selection */}
              {step === 2 && audience && (
                <div>
                  <button onClick={() => setStep(1)} className="text-gray-400 text-xs mb-4 hover:text-white transition-colors flex items-center gap-1">
                    ← Back
                  </button>
                  <h3 className="text-white font-black text-2xl mb-1">YOUR RECOMMENDED PROGRAMS</h3>
                  <p className="text-gray-400 text-sm mb-5">Based on your selection — choose the best fit</p>

                  <div className="space-y-3 mb-6">
                    {programs.map((program) => (
                      <button
                        key={program.id}
                        onClick={() => handleProgramSelect(program)}
                        className="w-full rounded-xl p-4 text-left group transition-all duration-300 hover:scale-[1.01]"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${program.color} flex items-center justify-center text-white flex-shrink-0`}>
                              {program.icon}
                            </div>
                            <div>
                              <div className="text-white font-bold text-base">{program.name}</div>
                              <div className="text-gray-400 text-xs mb-2">{program.age} · {program.tagline}</div>
                              <div className="flex flex-wrap gap-1.5">
                                {program.benefits.map((b) => (
                                  <span key={b} className="text-xs px-2 py-0.5 rounded-full text-gray-300" style={{ background: "rgba(255,255,255,0.08)" }}>
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {program.isFree ? (
                              <div className="text-green-400 font-black text-sm">FREE</div>
                            ) : (
                              <>
                                <div className="text-red-500 font-black text-xl">{program.price}</div>
                                <div className="text-gray-500 text-xs">{program.offer}</div>
                              </>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-500 mt-1 ml-auto group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Urgency badge */}
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-xs font-semibold">Limited intro spots available — spots fill fast</span>
                  </div>
                </div>
              )}

              {/* STEP 3: Contact form */}
              {step === 3 && selectedProgram && (
                <div>
                  <button onClick={() => setStep(2)} className="text-gray-400 text-xs mb-4 hover:text-white transition-colors flex items-center gap-1">
                    ← Back
                  </button>

                  {/* Selected program summary */}
                  <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedProgram.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {selectedProgram.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold">{selectedProgram.name}</div>
                      <div className="text-gray-400 text-xs">{selectedProgram.age}</div>
                    </div>
                    <div className="text-right">
                      {selectedProgram.isFree ? (
                        <div className="text-green-400 font-black">FREE</div>
                      ) : (
                        <>
                          <div className="text-red-500 font-black text-xl">{selectedProgram.price}</div>
                          <div className="text-gray-500 text-xs">{selectedProgram.offer}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-white font-black text-xl mb-1">
                    {selectedProgram.isFree ? "BOOK YOUR FREE CLASS" : "CLAIM YOUR INTRO OFFER"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {selectedProgram.isFree
                      ? "Enter your info and we'll reach out to schedule your free class."
                      : "Enter your info to proceed to secure checkout."}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:ring-1 focus:ring-red-500 transition-all"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:ring-1 focus:ring-red-500 transition-all"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                        className="w-full rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:ring-1 focus:ring-red-500 transition-all"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl font-black text-white text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", boxShadow: "0 4px 20px rgba(220,38,38,0.4)" }}
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : selectedProgram.isFree ? (
                        <>Book My Free Class <ArrowRight className="w-5 h-5" /></>
                      ) : (
                        <>Claim 2 Classes for $29 <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-4 pt-1">
                      {[["No contracts", Check], ["Cancel anytime", Check], ["Secure checkout", Shield]].map(([label, Icon]) => (
                        <div key={label as string} className="flex items-center gap-1">
                          <Icon className="w-3 h-3 text-green-400" />
                          <span className="text-gray-500 text-xs">{label as string}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-center text-gray-600 text-xs">
                      🔒 Your information is secure &amp; never shared.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
