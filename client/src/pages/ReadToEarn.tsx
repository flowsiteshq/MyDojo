import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, BookOpen, Star, Phone, ChevronRight, Loader2, Trophy, Calendar, MapPin, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type Step = "landing" | "books" | "info" | "quiz" | "done";

// ─── All 12 books ─────────────────────────────────────────────────────────────
const ALL_BOOKS = [
  { id: "karate-kids", title: "Karate Kids", author: "Holly Sterling", ages: "Ages 4–8", icon: "🥋" },
  { id: "three-ninja-pigs", title: "The Three Ninja Pigs", author: "Corey Rosen Schwartz", ages: "Ages 5–8", icon: "🐷" },
  { id: "my-first-karate", title: "My First Karate Class", author: "Alyssa Satin Capucilli", ages: "Ages 3–6", icon: "🤍" },
  { id: "karate-hour", title: "Karate Hour", author: "Carol Nevius", ages: "Ages 3–7", icon: "⏱️" },
  { id: "lets-go-taekwondo", title: "Let's Go to Taekwondo!", author: "Aram Kim", ages: "Ages 4–8", icon: "🏆" },
  { id: "grandmasters-daughter", title: "The Grandmaster's Daughter", author: "Dan-ah Kim", ages: "Ages 5–9", icon: "⭐" },
  { id: "karate-kid-book", title: "Karate Kid", author: "Rosanne L. Kurstedt", ages: "Ages 3–7", icon: "🐐" },
  { id: "morning-grandpa", title: "A Morning With Grandpa", author: "Sylvia Liu", ages: "Ages 4–8", icon: "🌅" },
  { id: "karate-kid-storybook", title: "The Karate Kid Storybook", author: "Kim Smith", ages: "Ages 5–10", icon: "🎬" },
  { id: "ninja-red-riding-hood", title: "Ninja Red Riding Hood", author: "Corey Rosen Schwartz", ages: "Ages 4–8", icon: "🐺" },
  { id: "bunjitsu-bunny", title: "Bunjitsu Bunny", author: "John Himmelman", ages: "Ages 5–9", icon: "🐰" },
  { id: "warrior-kid", title: "Way of the Warrior Kid", author: "Jocko Willink", ages: "Ages 8–12", icon: "💪" },
];

// ─── Quiz questions per book ───────────────────────────────────────────────────
const BOOK_QUESTIONS: Record<string, { question: string; options: string[]; correct: number }[]> = {
  "karate-kids": [
    { question: "What is the name of the main character in Karate Kids?", options: ["Lily", "Maya", "Sara", "Zoe"], correct: 1 },
    { question: "Where do the kids go for their karate class?", options: ["The gym", "The park", "The dojo", "The school"], correct: 2 },
    { question: "What is one of the big lessons in Karate Kids?", options: ["Always win", "Help and encourage each other", "Train alone", "Be the fastest"], correct: 1 },
    { question: "What day do they have karate class?", options: ["Sunday", "Monday", "Saturday", "Friday"], correct: 2 },
    { question: "What does Maya feel nervous about at first?", options: ["Making friends", "Trying new moves", "The uniform", "The teacher"], correct: 1 },
  ],
  "three-ninja-pigs": [
    { question: "What martial art does the FIRST pig study?", options: ["Karate", "Aikido", "Judo", "Taekwondo"], correct: 1 },
    { question: "What martial art does the SECOND pig study?", options: ["Karate", "Judo", "Jujitsu", "Kung Fu"], correct: 2 },
    { question: "What martial art does the THIRD pig study?", options: ["Judo", "Aikido", "Taekwondo", "Karate"], correct: 3 },
    { question: "Why do the pigs decide to train in martial arts?", options: ["To win a trophy", "To stop the wolf's bullying", "To impress their friends", "To become famous"], correct: 1 },
    { question: "Which pig's training was strong enough to stop the wolf?", options: ["The first pig", "The second pig", "The third pig", "All three together"], correct: 2 },
  ],
  "my-first-karate": [
    { question: "What do students wear to karate class?", options: ["Shorts and a t-shirt", "A gi (uniform)", "A swimsuit", "A tracksuit"], correct: 1 },
    { question: "What do students do at the beginning and end of class?", options: ["High five", "Bow", "Shake hands", "Clap"], correct: 1 },
    { question: "What color belt do beginners usually start with?", options: ["Yellow", "Blue", "White", "Green"], correct: 2 },
    { question: "What is the name of the place where karate is practiced?", options: ["Gym", "Arena", "Dojo", "Studio"], correct: 2 },
    { question: "What is one rule in karate class?", options: ["Talk loudly", "Respect your teacher", "Run around", "Skip stretching"], correct: 1 },
  ],
  "karate-hour": [
    { question: "What do students do at the very start of karate class?", options: ["Run laps", "Bow", "Spar", "Sit down"], correct: 1 },
    { question: "What do students do to warm up?", options: ["Sleep", "Stretch", "Eat", "Watch TV"], correct: 1 },
    { question: "What is the book's writing style?", options: ["Scary", "Rhyming", "Sad", "Funny jokes"], correct: 1 },
    { question: "What do students practice during class?", options: ["Swimming", "Kicks, punches, and stances", "Dancing", "Painting"], correct: 1 },
    { question: "What does the back of the book teach about?", options: ["Cooking", "Animals", "The history of karate", "Math"], correct: 2 },
  ],
  "lets-go-taekwondo": [
    { question: "What is the main character's name?", options: ["Mia", "Yoomi", "Lily", "Hana"], correct: 1 },
    { question: "What belt is Yoomi trying to earn?", options: ["Black belt", "Red belt", "Yellow belt", "Blue belt"], correct: 2 },
    { question: "Who is learning something new at the same time as Yoomi?", options: ["Her father", "Her teacher", "Her grandmother", "Her sister"], correct: 2 },
    { question: "What is Yoomi's grandmother trying to learn?", options: ["How to drive", "How to cook", "How to use the computer", "How to dance"], correct: 2 },
    { question: "What do Yoomi and her grandmother do for each other?", options: ["Compete", "Encourage each other", "Argue", "Race"], correct: 1 },
  ],
  "grandmasters-daughter": [
    { question: "What martial art does Sunny practice?", options: ["Karate", "Kung Fu", "Tae kwon do", "Judo"], correct: 2 },
    { question: "What rank does Sunny hold?", options: ["White belt", "Yellow belt", "Red belt", "Black belt"], correct: 3 },
    { question: "Where does the story take place?", options: ["Japan", "China", "Korea", "America"], correct: 2 },
    { question: "What is Sunny's father?", options: ["A chef", "A teacher", "A grandmaster", "A doctor"], correct: 2 },
    { question: "What do the students work together to do?", options: ["Win a tournament", "Protect each other from imaginary animals", "Build a dojo", "Learn to fly"], correct: 1 },
  ],
  "karate-kid-book": [
    { question: "What animals are used to show karate moves?", options: ["Cats", "Dogs", "Goats", "Rabbits"], correct: 2 },
    { question: "What is this book's style?", options: ["Mystery", "How-to / instructional", "Fantasy", "Horror"], correct: 1 },
    { question: "What do you call the basic positions in karate?", options: ["Poses", "Stances", "Dances", "Jumps"], correct: 1 },
    { question: "What is the spirit of karate about?", options: ["Winning fights", "Discipline and respect", "Being the strongest", "Showing off"], correct: 1 },
    { question: "What can kids do while reading this book?", options: ["Cook dinner", "Try the moves themselves", "Go to sleep", "Draw pictures"], correct: 1 },
  ],
  "morning-grandpa": [
    { question: "What is the main character's name?", options: ["Lily", "Mei Mei", "Yuki", "Sora"], correct: 1 },
    { question: "What is Grandfather practicing in the yard?", options: ["Karate", "Yoga", "Tai chi", "Judo"], correct: 2 },
    { question: "What does Mei Mei teach Grandfather in return?", options: ["Karate", "Yoga", "Cooking", "Dancing"], correct: 1 },
    { question: "What is tai chi about?", options: ["Fast punches", "Focus and good energy", "Winning fights", "Running fast"], correct: 1 },
    { question: "What does the back of the book include?", options: ["Recipes", "Information about tai chi and yoga", "A map", "Song lyrics"], correct: 1 },
  ],
  "karate-kid-storybook": [
    { question: "What famous phrase is in the book?", options: ["Just do it", "Wax on, wax off", "Never give up", "Be the best"], correct: 1 },
    { question: "Who teaches the main character karate?", options: ["His dad", "A robot", "Mr. Miyagi", "His friend"], correct: 2 },
    { question: "What is the main character's name?", options: ["Tommy", "Jake", "Daniel", "Mike"], correct: 2 },
    { question: "What does Daniel learn through karate?", options: ["How to cook", "Discipline, confidence, and self-defense", "How to swim", "How to fly"], correct: 1 },
    { question: "What is this book based on?", options: ["A video game", "A TV show", "The classic movie The Karate Kid", "A comic book"], correct: 2 },
  ],
  "ninja-red-riding-hood": [
    { question: "What classic fairy tale is this book based on?", options: ["Cinderella", "Little Red Riding Hood", "Goldilocks", "Snow White"], correct: 1 },
    { question: "What does Red Riding Hood train in?", options: ["Ballet", "Swimming", "Martial arts / ninja skills", "Gymnastics"], correct: 2 },
    { question: "Who is the villain in the story?", options: ["A bear", "A dragon", "The wolf", "A witch"], correct: 2 },
    { question: "How does Red Riding Hood outsmart the wolf?", options: ["She runs away", "She calls for help", "Using her ninja/martial arts skills", "She hides"], correct: 2 },
    { question: "What is the main message of the book?", options: ["Always run from danger", "Be prepared and use your skills wisely", "Never go outside", "Ask for help always"], correct: 1 },
  ],
  "bunjitsu-bunny": [
    { question: "What is the main character's name?", options: ["Bella", "Isabel", "Rosie", "Luna"], correct: 1 },
    { question: "What is Isabel the best at in school?", options: ["Running", "Singing", "Fighting / martial arts", "Painting"], correct: 2 },
    { question: "What does Isabel use instead of force?", options: ["Anger", "Kindness and cleverness", "Speed", "Weapons"], correct: 1 },
    { question: "What animal is the main character?", options: ["A cat", "A dog", "A bunny", "A fox"], correct: 2 },
    { question: "What is the big lesson in Bunjitsu Bunny?", options: ["Always fight back", "Use your brain and heart, not just your fists", "Be the strongest", "Never back down"], correct: 1 },
  ],
  "warrior-kid": [
    { question: "What is the main character's name?", options: ["Jake", "Marc", "Tyler", "Sam"], correct: 1 },
    { question: "Who teaches Marc martial arts?", options: ["His dad", "A coach at school", "His Navy SEAL uncle", "His older brother"], correct: 2 },
    { question: "What martial art does Marc learn?", options: ["Karate", "Taekwondo", "Jiu-jitsu", "Kung Fu"], correct: 2 },
    { question: "What does Marc improve through training?", options: ["His cooking", "Discipline, fitness, and confidence", "His drawing skills", "His singing"], correct: 1 },
    { question: "What is the main theme of the book?", options: ["Having fun", "Hard work and discipline lead to growth", "Being popular", "Winning at all costs"], correct: 1 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function buildQuiz(bookIds: string[]): { book: string; question: string; options: string[]; correct: number }[] {
  // Pick 3 questions from book1 and 2 from book2 (or 2+3 if reversed)
  const q1 = (BOOK_QUESTIONS[bookIds[0]] || []).slice(0, 3).map(q => ({ ...q, book: ALL_BOOKS.find(b => b.id === bookIds[0])?.title || bookIds[0] }));
  const q2 = (BOOK_QUESTIONS[bookIds[1]] || []).slice(0, 2).map(q => ({ ...q, book: ALL_BOOKS.find(b => b.id === bookIds[1])?.title || bookIds[1] }));
  return [...q1, ...q2];
}

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export default function ReadToEarn() {
  const [step, setStep] = useState<Step>("landing");
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [form, setForm] = useState({ parentName: "", parentPhone: "", parentEmail: "", childName: "", childAge: "" });
  const [quizQuestions, setQuizQuestions] = useState<ReturnType<typeof buildQuiz>>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [promoCode] = useState(genPromoCode);

  const submitMutation = trpc.readingPromo.submit.useMutation({
    onSuccess: () => setStep("done"),
    onError: (err) => toast.error(err.message),
  });

  const score = answers.filter((a, i) => a === quizQuestions[i]?.correct).length;
  const passed = score >= 4;
  const childAge = parseInt(form.childAge) || 0;
  const { program, label, ageRange } = getProgramByAge(childAge);

  const toggleBook = (id: string) => {
    setSelectedBooks(prev => {
      if (prev.includes(id)) return prev.filter(b => b !== id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, id];
    });
  };

  const handleBooksSubmit = () => {
    if (selectedBooks.length < 2) { toast.error("Please select 2 books you've read."); return; }
    const quiz = buildQuiz(selectedBooks);
    setQuizQuestions(quiz);
    setAnswers(Array(quiz.length).fill(null));
    setStep("info");
  };

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
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      const allAnswers = [...answers];
      allAnswers[currentQ] = selected;
      const realScore = allAnswers.filter((a, i) => a === quizQuestions[i]?.correct).length;
      const age = parseInt(form.childAge);
      const { program: prog } = getProgramByAge(age);
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
        {/* Progress bar */}
        {step !== "landing" && (
          <div className="flex gap-2 mb-8">
            {(["books", "info", "quiz", "done"] as Step[]).map((s, i) => {
              const stepOrder: Step[] = ["landing", "books", "info", "quiz", "done"];
              const currentIdx = stepOrder.indexOf(step);
              const sIdx = stepOrder.indexOf(s);
              return (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${currentIdx >= sIdx ? "bg-red-600" : "bg-zinc-700"}`} />
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ─── LANDING ─────────────────────────────────────────────────────── */}
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
                    { num: "1", text: "Pick any 2 martial arts books from our list" },
                    { num: "2", text: "Read them — ask your librarian for help finding them!" },
                    { num: "3", text: "Answer 5 fun quiz questions about what you read" },
                    { num: "4", text: "Score 4 or more and earn 2 FREE weeks of karate!" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 mt-0.5">{item.num}</div>
                      <p className="text-zinc-300 text-sm leading-snug pt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep("books")} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base">
                I've Read the Books! Let's Go <ChevronRight className="ml-1 w-5 h-5" />
              </Button>

              <div className="mt-6 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                <span className="text-zinc-400 text-sm ml-2">500+ Five-Star Reviews</span>
              </div>
            </motion.div>
          )}

          {/* ─── BOOK SELECTION ───────────────────────────────────────────────── */}
          {step === "books" && (
            <motion.div key="books" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  Step 1 of 3 — Choose Your Books
                </div>
                <h2 className="text-2xl font-black uppercase">Which 2 Books<br /><span className="text-red-500">Did You Read?</span></h2>
                <p className="text-zinc-400 text-sm mt-1">Select exactly 2 books from the list below. ({selectedBooks.length}/2 selected)</p>
              </div>

              <div className="space-y-2 mb-6">
                {ALL_BOOKS.map((book) => {
                  const isSelected = selectedBooks.includes(book.id);
                  const isDisabled = !isSelected && selectedBooks.length >= 2;
                  return (
                    <button
                      key={book.id}
                      onClick={() => toggleBook(book.id)}
                      disabled={isDisabled}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                        isSelected
                          ? "bg-red-600/20 border-red-500 text-white"
                          : isDisabled
                          ? "bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed"
                          : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500"
                      }`}
                    >
                      <span className="text-xl w-8 text-center flex-shrink-0">{book.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm leading-tight">{book.title}</div>
                        <div className="text-xs text-zinc-500 truncate">by {book.author} · {book.ages}</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleBooksSubmit}
                disabled={selectedBooks.length < 2}
                className="w-full h-14 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black uppercase tracking-widest text-base"
              >
                {selectedBooks.length < 2 ? `Select ${2 - selectedBooks.length} More Book${2 - selectedBooks.length !== 1 ? "s" : ""}` : "Next: Enter Your Info"} <ChevronRight className="ml-1 w-5 h-5" />
              </Button>

              <p className="text-xs text-zinc-500 mt-3 text-center">Ask your librarian for these books — they're free to borrow!</p>
            </motion.div>
          )}

          {/* ─── INFO FORM ────────────────────────────────────────────────────── */}
          {step === "info" && (
            <motion.div key="info" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  Step 2 of 3 — Your Info
                </div>
                <h2 className="text-2xl font-black uppercase">Tell Us About<br /><span className="text-red-500">You & Your Reader</span></h2>
                <p className="text-zinc-400 text-sm mt-1">We'll use this to set up your free trial.</p>
              </div>

              {/* Selected books summary */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 mb-5">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Books Selected</div>
                <div className="flex gap-2 flex-wrap">
                  {selectedBooks.map(id => {
                    const book = ALL_BOOKS.find(b => b.id === id);
                    return book ? (
                      <div key={id} className="flex items-center gap-1.5 bg-red-600/20 border border-red-600/30 rounded-lg px-2 py-1">
                        <span className="text-sm">{book.icon}</span>
                        <span className="text-xs font-bold text-red-300">{book.title}</span>
                      </div>
                    ) : null;
                  })}
                </div>
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

          {/* ─── QUIZ ─────────────────────────────────────────────────────────── */}
          {step === "quiz" && quizQuestions.length > 0 && (
            <motion.div key={`quiz-${currentQ}`} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Step 3 of 3 — Quiz
                </div>
                <span className="text-zinc-500 text-sm font-mono">{currentQ + 1} / {quizQuestions.length}</span>
              </div>
              <div className="flex gap-1 mb-6">
                {quizQuestions.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < currentQ ? "bg-green-500" : i === currentQ ? "bg-red-600" : "bg-zinc-700"}`} />
                ))}
              </div>

              <div className="inline-flex items-center gap-2 bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full mb-4">
                <BookOpen className="w-3 h-3" />
                From: <span className="font-bold text-white">{quizQuestions[currentQ].book}</span>
              </div>

              <h2 className="text-xl font-black uppercase leading-snug mb-6 text-white">{quizQuestions[currentQ].question}</h2>

              <div className="space-y-3">
                {quizQuestions[currentQ].options.map((opt, i) => {
                  const isCorrect = i === quizQuestions[currentQ].correct;
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
                      {showResult && isCorrect && <span className="ml-2 text-green-400">✓</span>}
                      {showResult && isSelected && !isCorrect && <span className="ml-2 text-red-400">✗</span>}
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <div className={`text-sm font-bold mb-4 ${selected === quizQuestions[currentQ].correct ? "text-green-400" : "text-red-400"}`}>
                    {selected === quizQuestions[currentQ].correct ? "🎉 Correct! Great job!" : `Not quite! The answer is: ${quizQuestions[currentQ].options[quizQuestions[currentQ].correct]}`}
                  </div>
                  <Button onClick={handleNext} disabled={submitMutation.isPending} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest">
                    {submitMutation.isPending ? <Loader2 className="animate-spin" /> : currentQ < quizQuestions.length - 1 ? <>Next Question <ChevronRight className="ml-1 w-4 h-4" /></> : <>See My Results 🏆</>}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── DONE ─────────────────────────────────────────────────────────── */}
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
                  <Button onClick={() => { setCurrentQ(0); setAnswers(Array(quizQuestions.length).fill(null)); setSelected(null); setShowResult(false); setStep("quiz"); }} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base mb-4">
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
