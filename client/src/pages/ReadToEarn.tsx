import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle, BookOpen, Star, Phone, ChevronRight,
  Loader2, Trophy, Calendar, MapPin, Check, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type Step = "landing" | "books" | "info" | "quiz1" | "quiz2" | "done";

// ─── Book catalog (must match IDs in BOOK_QUESTIONS) ──────────────────────────
const ALL_BOOKS = [
  { id: "karate-kids",          title: "Karate Kids",                author: "Cheryl Malnor",              ages: "Ages 4–8",  icon: "🥋", color: "#E53E3E" },
  { id: "three-ninja-pigs",     title: "Three Ninja Pigs",           author: "Corey Rosen Schwartz",       ages: "Ages 5–8",  icon: "🐷", color: "#ED8936" },
  { id: "my-first-karate-class",title: "My First Karate Class",      author: "Alyssa Satin Capucilli",     ages: "Ages 3–6",  icon: "⭐", color: "#48BB78" },
  { id: "karate-hour",          title: "Karate Hour",                author: "Carol Nevius",               ages: "Ages 3–7",  icon: "⏰", color: "#9F7AEA" },
  { id: "lets-go-to-taekwondo", title: "Let's Go to Taekwondo!",     author: "Bridget Heos",               ages: "Ages 4–8",  icon: "🦵", color: "#4299E1" },
  { id: "grandmasters-daughter",title: "The Grandmaster's Daughter", author: "H.Y. Lee",                   ages: "Ages 5–9",  icon: "🏆", color: "#F6AD55" },
  { id: "karate-kid",           title: "Karate Kid",                 author: "Jackie Chan & Will Smith",   ages: "Ages 5–10", icon: "🎬", color: "#FC8181" },
  { id: "morning-with-grandpa", title: "A Morning With Grandpa",     author: "Sylvia Liu",                 ages: "Ages 4–8",  icon: "🌅", color: "#68D391" },
  { id: "karate-kid-storybook", title: "Karate Kid Storybook",       author: "Various",                    ages: "Ages 5–10", icon: "📖", color: "#F687B3" },
  { id: "ninja-red-riding-hood",title: "Ninja Red Riding Hood",      author: "Corey Rosen Schwartz",       ages: "Ages 4–8",  icon: "🐺", color: "#FC8181" },
  { id: "bunjitsu-bunny",       title: "Bunjitsu Bunny",             author: "John Himmelman",             ages: "Ages 5–9",  icon: "🐰", color: "#76E4F7" },
  { id: "way-of-warrior-kid",   title: "Way of the Warrior Kid",     author: "Jocko Willink",              ages: "Ages 8–12", icon: "💪", color: "#2D3748" },
];

type QuizQ = { q: string; options: string[]; answer: number };

// ─── 5 questions per book ─────────────────────────────────────────────────────
const BOOK_QUESTIONS: Record<string, QuizQ[]> = {
  "karate-kids": [
    { q: "What do the children in the book learn at karate class?", options: ["How to fight their enemies", "Discipline, respect, and self-defense", "How to win trophies", "How to run faster"], answer: 1 },
    { q: "What do students say at the beginning and end of karate class?", options: ["Hello and goodbye", "Yes sir and no sir", "A bow and a respectful greeting", "A loud battle cry"], answer: 2 },
    { q: "What color belt do beginners usually start with in karate?", options: ["Black", "Yellow", "White", "Red"], answer: 2 },
    { q: "What is the most important lesson the children learn in the book?", options: ["Karate is only for winning fights", "Karate teaches self-control and respect", "The strongest person always wins", "You need special powers to do karate"], answer: 1 },
    { q: "How do karate students show respect to their instructor?", options: ["By clapping loudly", "By bowing", "By shouting their name", "By giving a high five"], answer: 1 },
  ],
  "three-ninja-pigs": [
    { q: "Why do the three pigs decide to learn martial arts?", options: ["To become famous", "To protect themselves from the Big Bad Wolf", "To win a tournament", "To impress their friends"], answer: 1 },
    { q: "Which pig works the hardest at training?", options: ["The first pig", "The second pig", "The third pig", "All three equally"], answer: 2 },
    { q: "What happens to the pigs who don't train hard enough?", options: ["They win anyway", "They are defeated by the wolf", "They quit and go home", "They find a different way to win"], answer: 1 },
    { q: "What is the main lesson of Three Ninja Pigs?", options: ["Natural talent is all you need", "Hard work and dedication lead to success", "Bigger is always stronger", "It's okay to give up when things get hard"], answer: 1 },
    { q: "What style of martial arts does the third pig master?", options: ["Boxing", "Judo", "Aikido", "Karate"], answer: 2 },
  ],
  "my-first-karate-class": [
    { q: "How does the main character feel before their first karate class?", options: ["Excited and not nervous at all", "A little nervous but also excited", "Angry and upset", "Bored and uninterested"], answer: 1 },
    { q: "What does the instructor teach the students first?", options: ["How to kick and punch", "How to bow and show respect", "How to do a backflip", "How to tie their belt"], answer: 1 },
    { q: "What does the child wear to karate class?", options: ["Regular clothes", "A gi (karate uniform)", "A superhero costume", "Sports jersey"], answer: 1 },
    { q: "How does the main character feel at the END of their first class?", options: ["Still nervous and wants to quit", "Happy, proud, and wants to come back", "Tired and bored", "Sad because they made mistakes"], answer: 1 },
    { q: "What is a 'gi'?", options: ["A karate move", "The karate training uniform", "A Japanese greeting", "A type of belt"], answer: 1 },
  ],
  "karate-hour": [
    { q: "What happens during the karate hour described in the book?", options: ["Kids watch a karate movie", "Kids practice kicks, punches, and kata", "Kids take a nap", "Kids play video games about karate"], answer: 1 },
    { q: "What is a 'kata' in karate?", options: ["A type of kick", "A series of movements practiced in a pattern", "A karate belt", "The name of the dojo"], answer: 1 },
    { q: "What do students shout when they perform a technique?", options: ["Ouch!", "Kiai!", "Hello!", "Help!"], answer: 1 },
    { q: "What does the book show about karate practice?", options: ["It is easy and requires no effort", "It takes focus, energy, and practice", "Only adults can do it", "You only need to practice once"], answer: 1 },
    { q: "How do the kids in the book feel about karate class?", options: ["Bored and uninterested", "Energized and enthusiastic", "Scared and nervous", "Confused and lost"], answer: 1 },
  ],
  "lets-go-to-taekwondo": [
    { q: "What is Taekwondo most famous for?", options: ["Its powerful punches", "Its high kicks and jumping techniques", "Its wrestling moves", "Its sword fighting"], answer: 1 },
    { q: "Where did Taekwondo originally come from?", options: ["Japan", "China", "Korea", "Brazil"], answer: 2 },
    { q: "What do Taekwondo students wear on their hands and feet during sparring?", options: ["Nothing", "Gloves and boots", "Protective pads and gear", "Mittens and socks"], answer: 2 },
    { q: "What does 'Taekwondo' mean?", options: ["The way of the fist", "The way of the foot and fist", "The art of jumping", "The path of the warrior"], answer: 1 },
    { q: "Is Taekwondo an Olympic sport?", options: ["No, it has never been in the Olympics", "Yes, it became an Olympic sport", "Only for adults, not kids", "It was removed from the Olympics"], answer: 1 },
  ],
  "grandmasters-daughter": [
    { q: "What challenge does the grandmaster's daughter face?", options: ["She is not allowed to train", "She must prove herself worthy despite others doubting her", "She is too young to compete", "She loses all her matches"], answer: 1 },
    { q: "What does the grandmaster's daughter do to overcome challenges?", options: ["She gives up and tries something else", "She trains harder and perseveres", "She asks someone else to fight for her", "She cheats to win"], answer: 1 },
    { q: "What important value does this story teach?", options: ["Only the strongest deserve to win", "Perseverance and believing in yourself", "Girls should not do martial arts", "Winning is the only thing that matters"], answer: 1 },
    { q: "How does the grandmaster feel about his daughter's abilities?", options: ["He thinks she is too weak", "He believes in her potential", "He ignores her completely", "He wants her to quit"], answer: 1 },
    { q: "What does the story show about martial arts training?", options: ["It is only for boys", "Anyone with dedication can succeed", "You must be born talented", "It takes no effort at all"], answer: 1 },
  ],
  "karate-kid": [
    { q: "Where does Dre Parker move to at the start of the story?", options: ["Japan", "China", "Korea", "Brazil"], answer: 1 },
    { q: "Who teaches Dre martial arts?", options: ["His father", "Mr. Han, the maintenance man", "His school teacher", "A famous champion"], answer: 1 },
    { q: "What famous lesson does Mr. Han teach Dre using his jacket?", options: ["How to punch harder", "Put it on, take it off — every movement is kung fu", "How to run faster", "How to bow properly"], answer: 1 },
    { q: "What does Dre learn beyond just fighting?", options: ["How to become famous", "Respect, discipline, and inner strength", "How to defeat everyone easily", "That fighting solves all problems"], answer: 1 },
    { q: "What is the main message of Karate Kid?", options: ["The strongest always wins", "With heart and hard work, you can overcome any obstacle", "Only natural talent matters", "You need a famous teacher to succeed"], answer: 1 },
  ],
  "morning-with-grandpa": [
    { q: "What does Grandpa practice every morning in the story?", options: ["Karate", "Tai Chi", "Yoga", "Boxing"], answer: 1 },
    { q: "What does Mei want to teach her grandpa?", options: ["Tai Chi", "Yoga", "Her own exercises and movements", "Swimming"], answer: 2 },
    { q: "What does Grandpa teach Mei about Tai Chi?", options: ["It is only for old people", "It requires slow, peaceful, flowing movements", "It is the same as karate", "You need special equipment"], answer: 1 },
    { q: "What is the relationship between Mei and her grandpa like?", options: ["They argue all the time", "They lovingly share and learn from each other", "They never spend time together", "Grandpa is too strict with Mei"], answer: 1 },
    { q: "What does the story show about learning from family?", options: ["Grandparents don't know anything useful", "Sharing traditions and activities brings families closer", "Kids should only learn from teachers at school", "Old people can't learn new things"], answer: 1 },
  ],
  "karate-kid-storybook": [
    { q: "What is the first thing a new karate student must learn?", options: ["The most powerful kick", "Respect and the dojo rules", "How to win a tournament", "How to break boards"], answer: 1 },
    { q: "What does a student earn as they improve in karate?", options: ["Money and prizes", "Higher belt ranks", "A new uniform", "A trophy"], answer: 1 },
    { q: "What does it mean to have a 'beginner's mind' in martial arts?", options: ["Being confused all the time", "Always being open to learning, no matter your level", "Only beginners can improve", "Forgetting everything you know"], answer: 1 },
    { q: "Why is practice important in karate?", options: ["To show off to friends", "Skills improve through consistent, dedicated practice", "Practice is not really necessary", "Only natural talent matters"], answer: 1 },
    { q: "What makes a true martial artist?", options: ["Winning every fight", "Having the best equipment", "Discipline, respect, and a good heart", "Being the biggest and strongest"], answer: 2 },
  ],
  "ninja-red-riding-hood": [
    { q: "How is this story different from the original Little Red Riding Hood?", options: ["Red Riding Hood has a different grandmother", "Red Riding Hood trains as a ninja to protect herself", "The wolf is friendly in this version", "Red Riding Hood gets lost in the forest"], answer: 1 },
    { q: "Why does Red Riding Hood decide to train as a ninja?", options: ["She wants to become famous", "To protect herself and her grandmother from the wolf", "Her grandmother forces her to train", "She wants to scare her friends"], answer: 1 },
    { q: "What happens to the wolf when he tries to trick Red Riding Hood?", options: ["He succeeds and wins", "Red Riding Hood uses her ninja skills to outsmart him", "The wolf runs away on his own", "Grandma defeats the wolf"], answer: 1 },
    { q: "What is the main lesson of Ninja Red Riding Hood?", options: ["Always trust strangers", "Being prepared and trained helps you stay safe", "Running away is always the best option", "Only adults can protect themselves"], answer: 1 },
    { q: "What does the story teach about self-defense?", options: ["Self-defense is only for boys", "Learning self-defense helps you feel confident and safe", "You should always fight first", "Self-defense is too hard to learn"], answer: 1 },
  ],
  "bunjitsu-bunny": [
    { q: "What is Isabel the bunny best at?", options: ["Running very fast", "Bunjitsu — a martial art", "Jumping the highest", "Making friends"], answer: 1 },
    { q: "What is Isabel's most important rule about her martial arts skills?", options: ["Always use them to show off", "Only use them when absolutely necessary, never to hurt others", "Use them to win every argument", "Practice only when someone is watching"], answer: 1 },
    { q: "How does Isabel usually solve problems in the book?", options: ["By fighting immediately", "By using wisdom and creativity instead of force", "By asking adults to solve them", "By running away"], answer: 1 },
    { q: "What does Bunjitsu Bunny teach about being the best at something?", options: ["Use your skills to bully others", "True skill comes with responsibility and kindness", "Show off your abilities as much as possible", "Being the best means you never have to listen to anyone"], answer: 1 },
    { q: "What kind of character is Isabel?", options: ["Mean and selfish", "Humble, wise, and kind", "Boastful and arrogant", "Lazy and unmotivated"], answer: 1 },
  ],
  "way-of-warrior-kid": [
    { q: "Who helps Marc transform into a warrior kid?", options: ["His school teacher", "His Uncle Jake, a Navy SEAL", "His best friend", "A famous martial arts champion"], answer: 1 },
    { q: "What problems does Marc face at the beginning of the story?", options: ["He is too popular and busy", "He struggles in school, can't do pull-ups, and is bullied", "He is bored because life is too easy", "He has too many friends"], answer: 1 },
    { q: "What martial art does Uncle Jake teach Marc?", options: ["Karate", "Taekwondo", "Jiu-Jitsu", "Boxing"], answer: 2 },
    { q: "What does 'Discipline Equals Freedom' mean in the book?", options: ["If you follow rules, you get a day off", "When you are disciplined and work hard, you earn more freedom and choices in life", "Freedom means doing whatever you want", "Discipline is a punishment"], answer: 1 },
    { q: "What is the main message of Way of the Warrior Kid?", options: ["Life is easy if you're smart", "Hard work, discipline, and facing your fears makes you stronger", "You need to be born tough to succeed", "Asking for help is a sign of weakness"], answer: 1 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getProgramByAge(age: number) {
  if (age >= 3 && age <= 5) return { program: "Little Ninjas", label: "Little Ninjas", ageRange: "Ages 3–5" };
  if (age >= 6 && age <= 12) return { program: "Core Kids", label: "Core Kids", ageRange: "Ages 6–12" };
  if (age >= 13) return { program: "Teens & Adults", label: "Teens & Adults", ageRange: "Ages 13+" };
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
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [form, setForm] = useState({ parentName: "", parentPhone: "", parentEmail: "", childName: "", childAge: "" });

  // Quiz state — separate per book (5 questions each)
  const [currentQ, setCurrentQ] = useState(0);
  const [book1Answers, setBook1Answers] = useState<(number | null)[]>(Array(5).fill(null));
  const [book2Answers, setBook2Answers] = useState<(number | null)[]>(Array(5).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const [promoCode] = useState(genPromoCode);

  const submitMutation = trpc.readingPromo.submit.useMutation({
    onSuccess: () => setStep("done"),
    onError: (err) => toast.error(err.message),
  });

  const book1 = ALL_BOOKS.find(b => b.id === selectedBooks[0]);
  const book2 = ALL_BOOKS.find(b => b.id === selectedBooks[1]);
  const book1Questions = selectedBooks[0] ? (BOOK_QUESTIONS[selectedBooks[0]] ?? []) : [];
  const book2Questions = selectedBooks[1] ? (BOOK_QUESTIONS[selectedBooks[1]] ?? []) : [];

  const isQuiz1 = step === "quiz1";
  const activeQuestions = isQuiz1 ? book1Questions : book2Questions;
  const activeAnswers = isQuiz1 ? book1Answers : book2Answers;
  const setActiveAnswers = isQuiz1 ? setBook1Answers : setBook2Answers;
  const activeBook = isQuiz1 ? book1 : book2;

  const book1Score = book1Answers.filter((a, i) => a === book1Questions[i]?.answer).length;
  const book2Score = book2Answers.filter((a, i) => a === book2Questions[i]?.answer).length;
  const book1Passed = book1Score >= 3;
  const book2Passed = book2Score >= 3;
  const bothPassed = book1Passed && book2Passed;

  const childAge = parseInt(form.childAge) || 0;
  const { program, label, ageRange } = getProgramByAge(childAge);

  const toggleBook = (id: string) => {
    setSelectedBooks(prev => {
      if (prev.includes(id)) return prev.filter(b => b !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleBooksSubmit = () => {
    if (selectedBooks.length < 2) { toast.error("Please select 2 books you've read."); return; }
    setStep("info");
  };

  const handleInfoSubmit = () => {
    if (!form.parentName || !form.parentPhone || !form.parentEmail) { toast.error("Please fill in your name, phone, and email."); return; }
    if (!form.childName || !form.childAge) { toast.error("Please fill in your child's name and age."); return; }
    const age = parseInt(form.childAge);
    if (isNaN(age) || age < 3 || age > 17) { toast.error("Please enter a valid age between 3 and 17."); return; }
    setCurrentQ(0);
    setBook1Answers(Array(5).fill(null));
    setBook2Answers(Array(5).fill(null));
    setSelected(null);
    setShowResult(false);
    setStep("quiz1");
  };

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    const newAnswers = [...activeAnswers];
    newAnswers[currentQ] = idx;
    setActiveAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ < activeQuestions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
        // Finished this book's quiz
        if (step === "quiz1") {
          // Move to book 2 quiz
          setCurrentQ(0);
          setSelected(null);
          setShowResult(false);
          setStep("quiz2");
        } else {
          // Both quizzes done — submit
          // book1 answers already fully set; book2 last answer already set by handleAnswer
          const finalBook1Score = book1Answers.filter((a, i) => a === book1Questions[i]?.answer).length;
          const finalBook2Score = book2Answers.filter((a, i) => a === book2Questions[i]?.answer).length;
          const age = parseInt(form.childAge);
          const { program: prog } = getProgramByAge(age);
          submitMutation.mutate({
            parentName: form.parentName,
            parentPhone: form.parentPhone,
            parentEmail: form.parentEmail,
            childName: form.childName,
            childAge: age,
            book1Id: selectedBooks[0],
            book1Title: book1?.title ?? selectedBooks[0],
            book1Score: finalBook1Score,
            book2Id: selectedBooks[1],
            book2Title: book2?.title ?? selectedBooks[1],
            book2Score: finalBook2Score,
            promoCode,
            recommendedProgram: prog,
          });
        }
      }
  };

  const currentQuestion = activeQuestions[currentQ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-full-white.webp"
            alt="MyDojo"
            className="h-8 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <BookOpen className="w-3 h-3 text-red-400" />
          <span>Read to Earn Program</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress bar */}
        {step !== "landing" && (
          <div className="flex gap-2 mb-8">
            {(["books", "info", "quiz1", "quiz2", "done"] as Step[]).map((s) => {
              const stepOrder: Step[] = ["landing", "books", "info", "quiz1", "quiz2", "done"];
              const currentIdx = stepOrder.indexOf(step);
              const sIdx = stepOrder.indexOf(s);
              return (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${currentIdx >= sIdx ? "bg-red-600" : "bg-zinc-700"}`}
                />
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ─── LANDING ─────────────────────────────────────────────────────── */}
          {step === "landing" && (
            <motion.div key="landing" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="relative rounded-2xl overflow-hidden mb-6 bg-zinc-900">
                <img
                  src="/images/program-core-kids.jpg"
                  alt="Kids Karate"
                  className="w-full h-52 object-cover opacity-70"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                    <BookOpen className="w-3 h-3" /> Library Reading Program
                  </div>
                  <h1 className="text-3xl font-black uppercase leading-tight">
                    Read to Earn<br /><span className="text-red-500">2 FREE Weeks!</span>
                  </h1>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
                <h2 className="text-lg font-black uppercase mb-3 text-white">How It Works</h2>
                <div className="space-y-3">
                  {[
                    { num: "1", text: "Pick any 2 martial arts books from our list" },
                    { num: "2", text: "Read them — ask your librarian for help finding them!" },
                    { num: "3", text: "Answer 5 quiz questions about each book (10 total)" },
                    { num: "4", text: "Score 3+ on each book and earn 2 FREE weeks of karate!" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 mt-0.5">
                        {item.num}
                      </div>
                      <p className="text-zinc-300 text-sm leading-snug pt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep("books")}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base"
              >
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
                  Step 1 of 4 — Choose Your Books
                </div>
                <h2 className="text-2xl font-black uppercase">
                  Which 2 Books<br /><span className="text-red-500">Did You Read?</span>
                </h2>
                <p className="text-zinc-400 text-sm mt-1">Select exactly 2 books. ({selectedBooks.length}/2 selected)</p>
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
                {selectedBooks.length < 2
                  ? `Select ${2 - selectedBooks.length} More Book${2 - selectedBooks.length !== 1 ? "s" : ""}`
                  : "Next: Enter Your Info"}{" "}
                <ChevronRight className="ml-1 w-5 h-5" />
              </Button>

              <p className="text-xs text-zinc-500 mt-3 text-center">Ask your librarian for these books — they're free to borrow!</p>
            </motion.div>
          )}

          {/* ─── INFO FORM ────────────────────────────────────────────────────── */}
          {step === "info" && (
            <motion.div key="info" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  Step 2 of 4 — Your Info
                </div>
                <h2 className="text-2xl font-black uppercase">
                  Tell Us About<br /><span className="text-red-500">You & Your Reader</span>
                </h2>
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
                  <Input
                    value={form.parentName}
                    onChange={(e) => setForm(f => ({ ...f, parentName: e.target.value }))}
                    placeholder="Your full name"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                  <Input
                    value={form.parentPhone}
                    onChange={(e) => setForm(f => ({ ...f, parentPhone: e.target.value }))}
                    placeholder="(555) 000-0000"
                    type="tel"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Email Address</label>
                  <Input
                    value={form.parentEmail}
                    onChange={(e) => setForm(f => ({ ...f, parentEmail: e.target.value }))}
                    placeholder="you@email.com"
                    type="email"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  />
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Child's Name</label>
                  <Input
                    value={form.childName}
                    onChange={(e) => setForm(f => ({ ...f, childName: e.target.value }))}
                    placeholder="Your child's first name"
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-widest mb-1 block">Child's Age</label>
                  <Input
                    value={form.childAge}
                    onChange={(e) => setForm(f => ({ ...f, childAge: e.target.value }))}
                    placeholder="Age (3–17)"
                    type="number"
                    min={3}
                    max={17}
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                  />
                </div>
                <Button
                  onClick={handleInfoSubmit}
                  className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base mt-2"
                >
                  Next: Quiz on Book 1 <ChevronRight className="ml-1 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── QUIZ (Book 1 or Book 2) ──────────────────────────────────────── */}
          {(step === "quiz1" || step === "quiz2") && currentQuestion && (
            <motion.div
              key={`${step}-q${currentQ}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {/* Book indicator */}
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {step === "quiz1" ? "Step 3 of 4" : "Step 4 of 4"} — Quiz
                </div>
                <span className="text-zinc-500 text-sm font-mono">{currentQ + 1} / {activeQuestions.length}</span>
              </div>

              {/* Per-question progress */}
              <div className="flex gap-1 mb-4">
                {activeQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < currentQ ? "bg-green-500" : i === currentQ ? "bg-red-600" : "bg-zinc-700"
                    }`}
                  />
                ))}
              </div>

              {/* Book label */}
              <div className="inline-flex items-center gap-2 bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full mb-4">
                <span className="text-base">{activeBook?.icon}</span>
                <span className="font-bold text-white">{activeBook?.title}</span>
                <span className="text-zinc-500">({step === "quiz1" ? "Book 1" : "Book 2"})</span>
              </div>

              <h2 className="text-xl font-black uppercase leading-snug mb-6 text-white">
                {currentQuestion.q}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((opt, i) => {
                  const isCorrect = i === currentQuestion.answer;
                  const isSelected = selected === i;
                  let btnClass = "bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500";
                  if (showResult) {
                    if (isCorrect) btnClass = "bg-green-600/20 border-green-500 text-green-300";
                    else if (isSelected && !isCorrect) btnClass = "bg-red-600/20 border-red-500 text-red-300";
                    else btnClass = "bg-zinc-900 border-zinc-800 text-zinc-500";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={showResult}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${btnClass}`}
                    >
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
                  <div className={`text-sm font-bold mb-4 ${selected === currentQuestion.answer ? "text-green-400" : "text-red-400"}`}>
                    {selected === currentQuestion.answer
                      ? "🎉 Correct! Great job!"
                      : `Not quite! The answer is: ${currentQuestion.options[currentQuestion.answer]}`}
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={submitMutation.isPending}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : currentQ < activeQuestions.length - 1 ? (
                      <>Next Question <ChevronRight className="ml-1 w-4 h-4" /></>
                    ) : step === "quiz1" ? (
                      <>Start Book 2 Quiz <ChevronRight className="ml-1 w-4 h-4" /></>
                    ) : (
                      <>See My Results 🏆</>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── DONE ─────────────────────────────────────────────────────────── */}
          {step === "done" && (
            <motion.div
              key="done"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {bothPassed ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                  >
                    <Trophy className="w-14 h-14 text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-black uppercase mb-2">
                    🎉 Congratulations<br /><span className="text-red-500">{form.childName}!</span>
                  </h2>
                  <p className="text-zinc-300 text-lg mb-1">
                    You scored <span className="text-green-400 font-black">{book1Score}/5</span> on Book 1 and{" "}
                    <span className="text-green-400 font-black">{book2Score}/5</span> on Book 2!
                  </p>
                  <p className="text-zinc-400 text-sm mb-6">
                    You've earned <span className="text-white font-bold">2 FREE weeks of karate!</span>
                  </p>

                  <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6 text-left">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Your Free Trial Code</div>
                    <div className="text-2xl font-mono font-black text-red-400 tracking-wider">{promoCode}</div>
                    <div className="text-xs text-zinc-500 mt-1">Show this code when you arrive at the dojo</div>
                  </div>

                  {/* Per-book score breakdown */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { book: book1, score: book1Score, passed: book1Passed },
                      { book: book2, score: book2Score, passed: book2Passed },
                    ].map(({ book, score, passed: p }, idx) => (
                      <div key={idx} className={`rounded-xl p-3 border text-left ${p ? "bg-green-600/10 border-green-600/30" : "bg-red-600/10 border-red-600/30"}`}>
                        <div className="text-lg mb-1">{book?.icon}</div>
                        <div className="text-xs font-bold text-zinc-300 leading-tight mb-1">{book?.title}</div>
                        <div className={`text-xl font-black ${p ? "text-green-400" : "text-red-400"}`}>{score}/5</div>
                        <div className="text-xs text-zinc-500">{p ? "✓ Passed" : "✗ Try again"}</div>
                      </div>
                    ))}
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
                    <a href="tel:8327918378">
                      <Button className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-600">
                        <Phone className="w-4 h-4 mr-2" /> Call Us to Schedule
                      </Button>
                    </a>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-left">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span className="font-bold text-white">MyDojo Martial Arts & Fitness</span>
                    </div>
                    <div className="text-zinc-500 text-xs">11721 Spring Cypress Rd, Tomball, TX 77377</div>
                    <div className="text-zinc-500 text-xs mt-0.5">(832) 791-8378 · mydojoma.com</div>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <BookOpen className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-black uppercase mb-2">
                    Almost There,<br /><span className="text-red-500">{form.childName}!</span>
                  </h2>

                  {/* Per-book score breakdown */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { book: book1, score: book1Score, passed: book1Passed },
                      { book: book2, score: book2Score, passed: book2Passed },
                    ].map(({ book, score, passed: p }, idx) => (
                      <div key={idx} className={`rounded-xl p-3 border text-left ${p ? "bg-green-600/10 border-green-600/30" : "bg-red-600/10 border-red-600/30"}`}>
                        <div className="text-lg mb-1">{book?.icon}</div>
                        <div className="text-xs font-bold text-zinc-300 leading-tight mb-1">{book?.title}</div>
                        <div className={`text-xl font-black ${p ? "text-green-400" : "text-red-400"}`}>{score}/5</div>
                        <div className="text-xs text-zinc-500">{p ? "✓ Passed" : "Need 3+ to pass"}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-zinc-400 text-sm mb-6">
                    You need at least 3/5 on <strong className="text-white">each book</strong> to earn the free trial.
                    Re-read the books you didn't pass and try again — you've got this! 💪
                  </p>
                  <Button
                    onClick={() => {
                      setCurrentQ(0);
                      setBook1Answers(Array(5).fill(null));
                      setBook2Answers(Array(5).fill(null));
                      setSelected(null);
                      setShowResult(false);
                      setStep("quiz1");
                    }}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base mb-4"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" /> Try Again
                  </Button>
                  <p className="text-zinc-500 text-xs">
                    Still want to try a class?{" "}
                    <a href="tel:8327918378" className="text-red-400 underline">Call us</a> and we'll set something up!
                  </p>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
