import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, BookOpen, Star, Phone, ChevronRight, Loader2, Trophy, Calendar, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type Step = "landing" | "info" | "quiz" | "done";

const QUIZ_QUESTIONS = [
  {
    book: "Karate Kids",
    question: "In Karate Kids, what is the name of the main character who goes to karate class?",
    options: ["Lily", "Maya", "Sara", "Zoe"],
    correct: 1,
  },
  {
    book: "Karate Kids",
    question: "In Karate Kids, where do the kids go for their karate class?",
    options: ["The gym", "The park", "The dojo", "The school"],
    correct: 2,
  },
  {
    book: "Karate Kids",
    question: "What is one of the big lessons in Karate Kids?",
    options: ["Always win", "Help and encourage each other", "Train alone", "Be the fastest"],
    correct: 1,
  },
  {
    book: "The Three Ninja Pigs",
    question: "In The Three Ninja Pigs, what martial art does the THIRD pig study?",
    options: ["Judo", "Aikido", "Karate", "Taekwondo"],
    correct: 2,
  },
  {
    book: "The Three Ninja Pigs",
    question: "In The Three Ninja Pigs, why do the pigs decide to train in martial arts?",
    options: ["To win a trophy", "To stop the wolf's bullying", "To impress their friends", "To become famous"],
    correct: 1,
  },
];

function getProgramByAge(age: number) {
  if (age >= 3 && age <= 5) return { program: "Little Ninjas", label: "Little Ninjas", ageRange: "Ages 3–5" };
  if (age >= 6 && age <= 12) return { program: "Dragon Kids", label: "Core Kids", ageRange: "Ages 6–12" };
  if (age >= 13) return { program: "Teens", label: "Teens & Adults", ageRange: "Ages 13+" };
  return { program: "Not Sure", label: "Our Programs", ageRange: "" };
}

function genPromoCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `READ-${part(4)}-${part(4)}`;
}

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export default function ReadToEarn() {
  const [step, setStep] = useState<Step>("landing");
  const [form, setForm] = useState({ parentName: "", parentPhone: "", parentEmail: "", childName: "", childAge: "" });
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [promoCode] = useState(genPromoCode);

  const submitMutation = trpc.readingPromo.submit.useMutation({
    onSuccess: () => setStep("done"),
    onError: (err) => toast.error(err.message),
  });

  const score = answers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length;
  const passed = score >= 4;
  const childAge = parseInt(form.childAge) || 0;
  const { program, label, ageRange } = getProgramByAge(childAge);

  const handleInfoSubmit = () => {
    if (!form.parentName || !form.parentPhone || !form.parentEmail) { toast.error("Please fill in your name, phone, and email."); return; }
    if (!form.childName || !form.childAge) { toast.error("Please fill in your child's name and age."); return; }
    const age = parseInt(form.childAge);
    if (isNaN(age) || age < 3 || age > 17) { toast.error("Please enter a valid age between 3 and 17."); return; }
    setStep("quiz");
  };

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      const age = parseInt(form.childAge);
      const { program: prog } = getProgramByAge(age);
      const finalScore = answers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length;
      // Count the current question's answer too
      const allAnswers = [...answers];
      allAnswers[currentQ] = selected;
      const realScore = allAnswers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length;
      submitMutation.mutate({
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        childName: form.childName,
        childAge: age,
        quizScore: realScore,
        promoCode,
        recommendedProgram: prog,
      });
    }
  };

  const STEPS: Step[] = ["landing", "info", "quiz", "done"];
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/logo-full-white.webp" alt="MyDojo" className="h-8 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <BookOpen className="w-3 h-3 text-red-400" />
          <span>Library Reading Program</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {step !== "landing" && (
          <div className="flex gap-2 mb-8">
            {(["info", "quiz", "done"] as Step[]).map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${stepIndex - 1 >= i ? "bg-red-600" : "bg-zinc-700"}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* LANDING */}
          {step === "landing" && (
            <motion.div key="landing" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="relative rounded-2xl overflow-hidden mb-6 bg-zinc-900">
                <img src="/images/program-core-kids.jpg" alt="Kids Karate" className="w-full h-52 object-cover opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                    <BookOpen className="w-3 h-3" /> Library Reading Program
                  </div>
                  <h1 className="text-3xl font-black uppercase leading-tight">Read to Earn<br /><span className="text-red-500">2 FREE Weeks!</span></h1>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
                <h2 className="text-lg font-black uppercase mb-3 text-white">How It Works</h2>
                <div className="space-y-3">
                  {[
                    { icon: "📚", text: "Read both recommended karate books from your library" },
                    { icon: "✏️", text: "Answer 5 fun questions about what you read" },
                    { icon: "🥋", text: "Earn 2 FREE weeks of karate classes!" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <p className="text-zinc-300 text-sm leading-snug pt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">📖 Read These Two Books</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">🥋</div>
                    <div className="font-black text-sm uppercase leading-tight text-white">Karate Kids</div>
                    <div className="text-xs text-zinc-500 mt-1">by Holly Sterling</div>
                    <div className="text-xs text-red-400 mt-1">Ages 4–8</div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">🐷</div>
                    <div className="font-black text-sm uppercase leading-tight text-white">The Three Ninja Pigs</div>
                    <div className="text-xs text-zinc-500 mt-1">by Corey Rosen Schwartz</div>
                    <div className="text-xs text-red-400 mt-1">Ages 5–8</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">Ask your librarian for these books!</p>
              </div>

              <Button onClick={() => setStep("info")} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base">
                I've Read the Books! Let's Go <ChevronRight className="ml-1 w-5 h-5" />
              </Button>

              <div className="mt-6 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                <span className="text-zinc-400 text-sm ml-2">500+ Five-Star Reviews</span>
              </div>
            </motion.div>
          )}

          {/* INFO FORM */}
          {step === "info" && (
            <motion.div key="info" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  Step 1 of 2 — Your Info
                </div>
                <h2 className="text-2xl font-black uppercase">Tell Us About<br /><span className="text-red-500">You & Your Reader</span></h2>
                <p className="text-zinc-400 text-sm mt-1">We'll use this to set up your free trial.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Parent / Guardian Name</label>
                  <Input value={form.parentName} onChange={(e) => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="Your full name" className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                  <Input value={form.parentPhone} onChange={(e) => setForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="(555) 000-0000" type="tel" className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Email Address</label>
                  <Input value={form.parentEmail} onChange={(e) => setForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="you@email.com" type="email" className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12" />
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Child's Name</label>
                  <Input value={form.childName} onChange={(e) => setForm(f => ({ ...f, childName: e.target.value }))} placeholder="Your child's first name" className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Child's Age</label>
                  <Input value={form.childAge} onChange={(e) => setForm(f => ({ ...f, childAge: e.target.value }))} placeholder="Age (3–17)" type="number" min={3} max={17} className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12" />
                </div>
                <Button onClick={handleInfoSubmit} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base mt-2">
                  Next: Take the Quiz <ChevronRight className="ml-1 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* QUIZ */}
          {step === "quiz" && (
            <motion.div key={`quiz-${currentQ}`} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Step 2 of 2 — Quiz
                </div>
                <span className="text-zinc-500 text-sm font-mono">{currentQ + 1} / {QUIZ_QUESTIONS.length}</span>
              </div>
              <div className="flex gap-1 mb-6">
                {QUIZ_QUESTIONS.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < currentQ ? "bg-green-500" : i === currentQ ? "bg-red-600" : "bg-zinc-700"}`} />
                ))}
              </div>

              <div className="inline-flex items-center gap-2 bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full mb-4">
                <BookOpen className="w-3 h-3" />
                From: <span className="font-bold text-white">{QUIZ_QUESTIONS[currentQ].book}</span>
              </div>

              <h2 className="text-xl font-black uppercase leading-snug mb-6 text-white">{QUIZ_QUESTIONS[currentQ].question}</h2>

              <div className="space-y-3">
                {QUIZ_QUESTIONS[currentQ].options.map((opt, i) => {
                  const isCorrect = i === QUIZ_QUESTIONS[currentQ].correct;
                  const isSelected = selected === i;
                  let btnClass = "bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500";
                  if (showResult) {
                    if (isCorrect) btnClass = "bg-green-600/20 border-green-500 text-green-300";
                    else if (isSelected && !isCorrect) btnClass = "bg-red-600/20 border-red-500 text-red-300";
                    else btnClass = "bg-zinc-900 border-zinc-800 text-zinc-500";
                  }
                  return (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={showResult} className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${btnClass}`}>
                      <span className="text-zinc-500 mr-2 font-mono text-sm">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                      {showResult && isCorrect && <span className="ml-2">✓</span>}
                      {showResult && isSelected && !isCorrect && <span className="ml-2">✗</span>}
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <div className={`text-sm font-bold mb-4 ${selected === QUIZ_QUESTIONS[currentQ].correct ? "text-green-400" : "text-red-400"}`}>
                    {selected === QUIZ_QUESTIONS[currentQ].correct ? "🎉 Correct! Great job!" : `Not quite! The answer is: ${QUIZ_QUESTIONS[currentQ].options[QUIZ_QUESTIONS[currentQ].correct]}`}
                  </div>
                  <Button onClick={handleNext} disabled={submitMutation.isPending} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest">
                    {submitMutation.isPending ? <Loader2 className="animate-spin" /> : currentQ < QUIZ_QUESTIONS.length - 1 ? <>Next Question <ChevronRight className="ml-1 w-4 h-4" /></> : <>See My Results 🏆</>}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* DONE */}
          {step === "done" && (
            <motion.div key="done" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="text-center">
              {passed ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }} className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <Trophy className="w-14 h-14 text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-black uppercase mb-2">🎉 Congratulations<br /><span className="text-red-500">{form.childName}!</span></h2>
                  <p className="text-zinc-300 text-lg mb-1">You scored <span className="text-green-400 font-black">{score}/5</span> on the quiz!</p>
                  <p className="text-zinc-400 text-sm mb-6">You've earned <span className="text-white font-bold">2 FREE weeks of karate!</span></p>

                  <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6 text-left">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Your Free Trial Code</div>
                    <div className="text-2xl font-mono font-black text-red-400 tracking-wider">{promoCode}</div>
                    <div className="text-xs text-zinc-500 mt-1">Show this code when you arrive at the dojo</div>
                  </div>

                  {childAge >= 3 && (
                    <div className="bg-red-600/10 border border-red-600/30 rounded-2xl p-4 mb-6 text-left">
                      <div className="text-xs text-red-400 uppercase tracking-widest mb-1">Recommended Program</div>
                      <div className="text-xl font-black text-white">{label}</div>
                      <div className="text-sm text-zinc-400">{ageRange}</div>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <Link href={`/locations/hq?program=${encodeURIComponent(program)}`}>
                      <Button className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base">
                        <Calendar className="w-5 h-5 mr-2" /> Schedule My First Class
                      </Button>
                    </Link>
                    <a href="tel:8774693656">
                      <Button className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-600">
                        <Phone className="w-4 h-4 mr-2" /> Call Us to Schedule
                      </Button>
                    </a>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-left">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="font-bold text-white">MyDojo Martial Arts</span>
                    </div>
                    <div className="text-zinc-500 text-xs">Tomball, TX • (877) 469-3656</div>
                    <div className="text-zinc-500 text-xs mt-1">mydojomartialarts.com</div>
                  </div>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }} className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-black uppercase mb-2">Almost There,<br /><span className="text-red-500">{form.childName}!</span></h2>
                  <p className="text-zinc-300 mb-2">You scored <span className="text-yellow-400 font-black">{score}/5</span>.</p>
                  <p className="text-zinc-400 text-sm mb-6">You need at least 4 correct to earn the free trial. Re-read the books and try again — you've got this! 💪</p>
                  <Button onClick={() => { setCurrentQ(0); setAnswers(Array(5).fill(null)); setSelected(null); setShowResult(false); setStep("quiz"); }} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base mb-4">
                    Try Again 🔄
                  </Button>
                  <p className="text-zinc-500 text-xs">Still want to try a class? <a href="tel:8774693656" className="text-red-400 underline">Call us</a> and we'll set something up!</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
