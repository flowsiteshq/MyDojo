import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronLeft, Shield, Calendar, DollarSign, Star, User, Users, UserCheck, Award } from "lucide-react";

const INSTRUCTORS = [
  "Master Vincent Holmes",
  "Sensei Kamil Ahmed",
  "Sensei Hector Diosdado",
  "Sensei Dominique Griggs",
  "Other",
];

const BELT_RANKS = [
  "White Belt", "Yellow Belt", "Orange Belt", "Purple Belt",
  "Blue Belt", "Green Belt", "Brown Belt", "Red Belt",
  "Black Belt (1st Dan)", "Black Belt (2nd Dan)", "Black Belt (3rd Dan)",
];

const SELF_REFLECTION_ITEMS = [
  "I attend class consistently.",
  "I always give my best effort.",
  "I practice outside of class.",
  "I show respect to instructors.",
  "I encourage other students.",
  "I have a positive attitude.",
  "I demonstrate self-control.",
  "I know my curriculum well.",
  "I can perform under pressure.",
  "I am ready for more responsibility.",
];

const WRITTEN_QUESTIONS = [
  "Why do you believe you are ready for your next belt?",
  "What has been the hardest thing you've learned at your current rank?",
  "What are you most proud of since earning your last belt?",
  "What do you still need to improve?",
  "How do you show respect at home?",
  "How do you show respect at school?",
  "Describe a time you showed self-control.",
  "Describe a time you helped someone without being asked.",
  "What does being a martial artist mean to you?",
  "If promoted, how will you set a positive example for lower belts?",
];

const PARENT_RATING_ITEMS = [
  "Shows respect at home.",
  "Completes responsibilities.",
  "Demonstrates self-control.",
  "Uses martial arts appropriately.",
  "Practices outside of class.",
  "Has become more confident.",
  "Has improved discipline.",
  "Is more responsible than six months ago.",
  "Is ready for the next belt.",
];

const PARENT_QUESTIONS = [
  "What positive changes have you seen since your child's last promotion?",
  "What area would you like your child to continue improving?",
  "Is there anything our instructors should know that would help us better coach your child?",
];

type TestingFor = "myself" | "my_child" | "someone_else";
const TOTAL_STEPS = 7;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current ? "bg-red-600 w-6" : i === current ? "bg-red-500 w-10" : "bg-zinc-700 w-6"
          }`}
        />
      ))}
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-zinc-800 last:border-0">
      <span className="flex-1 text-sm text-gray-300">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
              value === n
                ? "bg-red-600 text-white shadow-lg"
                : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BeltTestIntent() {
  const [step, setStep] = useState(0);
  const [testingFor, setTestingFor] = useState<TestingFor | "">("");
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentBelt, setCurrentBelt] = useState("");
  const [beltSeeking, setBeltSeeking] = useState("");
  const [instructor, setInstructor] = useState("");
  const [selfRatings, setSelfRatings] = useState<number[]>(Array(SELF_REFLECTION_ITEMS.length).fill(0));
  const [writtenAnswers, setWrittenAnswers] = useState<string[]>(Array(WRITTEN_QUESTIONS.length).fill(""));
  const [parentRatings, setParentRatings] = useState<number[]>(Array(PARENT_RATING_ITEMS.length).fill(0));
  const [parentAnswers, setParentAnswers] = useState<string[]>(Array(PARENT_QUESTIONS.length).fill(""));
  const [parentRecommendation, setParentRecommendation] = useState<"yes" | "not_yet" | "">("");
  const [parentComments, setParentComments] = useState("");
  const [studentPledge, setStudentPledge] = useState(false);
  const [parentCommitment, setParentCommitment] = useState(false);
  const [blackBeltAnswer, setBlackBeltAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitMutation = trpc.beltTestIntent.submit.useMutation();
  const isAdult = testingFor === "myself";

  function validateStep() {
    setError("");
    if (step === 0 && !testingFor) { setError("Please select who is taking the belt test."); return false; }
    if (step === 1) {
      if (!studentName.trim()) { setError("Student name is required."); return false; }
      if (!isAdult && !parentName.trim()) { setError("Parent/guardian name is required."); return false; }
      if (!phone.trim() || phone.replace(/\D/g, "").length < 10) { setError("Valid phone number required."); return false; }
      if (!email.trim() || !email.includes("@")) { setError("Valid email required."); return false; }
      if (!currentBelt) { setError("Please select your current belt."); return false; }
      if (!beltSeeking) { setError("Please select the belt you are seeking."); return false; }
      if (!instructor) { setError("Please select your instructor."); return false; }
    }
    if (step === 2 && selfRatings.some(r => r === 0)) { setError("Please rate all items before continuing."); return false; }
    if (step === 3 && writtenAnswers.some(a => !a.trim())) { setError("Please answer all questions before continuing."); return false; }
    if (step === 4) {
      if (parentRatings.some(r => r === 0)) { setError("Please rate all items."); return false; }
      if (parentAnswers.some(a => !a.trim())) { setError("Please answer all parent questions."); return false; }
      if (!parentRecommendation) { setError("Please select your recommendation."); return false; }
    }
    if (step === 5 && !blackBeltAnswer.trim()) { setError("Please answer the Black Belt Question."); return false; }
    if (step === 6) {
      if (!studentPledge) { setError("Student must agree to the pledge."); return false; }
      if (!isAdult && !parentCommitment) { setError("Parent must agree to the commitment."); return false; }
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError("");
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      const result = await submitMutation.mutateAsync({
        studentName,
        parentName: isAdult ? studentName : parentName,
        phone,
        email,
        currentBelt,
        beltSeeking,
        instructor,
        testingFor,
        selfReflectionRatings: JSON.stringify(
          SELF_REFLECTION_ITEMS.reduce((acc, item, i) => ({ ...acc, [item]: selfRatings[i] }), {} as Record<string, number>)
        ),
        writtenAnswers: JSON.stringify(
          WRITTEN_QUESTIONS.reduce((acc, q, i) => ({ ...acc, [q]: writtenAnswers[i] }), {} as Record<string, string>)
        ),
        parentRatings: JSON.stringify(
          PARENT_RATING_ITEMS.reduce((acc, item, i) => ({ ...acc, [item]: parentRatings[i] }), {} as Record<string, number>)
        ),
        parentAnswers: JSON.stringify(
          PARENT_QUESTIONS.reduce((acc, q, i) => ({ ...acc, [q]: parentAnswers[i] }), {} as Record<string, string>)
        ),
        parentRecommendation,
        parentComments,
        blackBeltQuestion: blackBeltAnswer,
        studentPledgeAgreed: studentPledge,
        parentCommitmentAgreed: parentCommitment,
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative bg-zinc-950 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[url('/images/hero-main.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Award className="h-3 w-3" /> August 15th, 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-3">
            Belt Test<br />
            <span className="text-red-500">Intent to Promote</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            Complete this form to declare your intent to test on <strong className="text-white">August 15th, 2026</strong>. The belt test fee of <span className="text-red-400 font-bold">$49.00</span> is due at registration.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Calendar, label: "Belt Test Date", sub: "August 15th, 2026" },
              { icon: Shield, label: "Spotlight Week", sub: "Aug 10\u201314 Prep" },
              { icon: DollarSign, label: "Test Fee", sub: "$49.00 (paid online)" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-4 text-center min-w-[160px]">
                <Icon className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <div className="text-xs font-bold text-white uppercase tracking-wider">{label}</div>
                <div className="text-xs text-gray-400 mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-red-950/30 border-b border-red-900/40 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-3">
            <Shield className="h-3 w-3" /> Important Reminders
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-300">
            <div className="flex gap-2"><span className="text-red-500">&rsaquo;</span> Form must be submitted <strong className="text-white">prior to August 10th</strong></div>
            <div className="flex gap-2"><span className="text-red-500">&rsaquo;</span> Uniforms must be ordered &mdash; Extra Black or Red Gi available</div>
            <div className="flex gap-2"><span className="text-red-500">&rsaquo;</span> Spotlight Week (Aug 10&ndash;14): Testing Preparation classes</div>
            <div className="flex gap-2"><span className="text-red-500">&rsaquo;</span> Pre-order Sparring Gear, T-Shirts &amp; Apparel available</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* Step 0: Who is testing */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-2 text-center">Who is taking the belt test?</h2>
            <p className="text-gray-400 text-center text-sm mb-8">Select the option that best describes you</p>
            <div className="grid gap-4">
              {([
                { value: "myself" as TestingFor, icon: User, label: "Myself", sub: "I am an adult student registering for myself" },
                { value: "my_child" as TestingFor, icon: Users, label: "My Child", sub: "I am a parent registering my child" },
                { value: "someone_else" as TestingFor, icon: UserCheck, label: "Someone Else", sub: "I am registering on behalf of another student" },
              ] as const).map(({ value, icon: Icon, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTestingFor(value)}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                    testingFor === value ? "border-red-500 bg-red-950/30" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }`}
                >
                  <div className={`p-3 rounded-lg ${testingFor === value ? "bg-red-600" : "bg-zinc-800"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{label}</div>
                    <div className="text-sm text-gray-400">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Student Info */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-2">Student Information</h2>
            <p className="text-gray-400 text-sm mb-6">Fill out all required fields below</p>
            <div className="grid gap-4">
              <div>
                <Label className="text-gray-300 mb-1 block">Student Name *</Label>
                <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Full name of student" className="bg-zinc-900 border-zinc-700 text-white" />
              </div>
              {!isAdult && (
                <div>
                  <Label className="text-gray-300 mb-1 block">Parent / Guardian Name *</Label>
                  <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Parent or guardian name" className="bg-zinc-900 border-zinc-700 text-white" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-1 block">Phone Number *</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" className="bg-zinc-900 border-zinc-700 text-white" />
                </div>
                <div>
                  <Label className="text-gray-300 mb-1 block">Email Address *</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@example.com" className="bg-zinc-900 border-zinc-700 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-1 block">Current Belt *</Label>
                  <Select value={currentBelt} onValueChange={setCurrentBelt}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue placeholder="Select current belt" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {BELT_RANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300 mb-1 block">Belt Seeking *</Label>
                  <Select value={beltSeeking} onValueChange={setBeltSeeking}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue placeholder="Select belt seeking" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {BELT_RANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-300 mb-1 block">Instructor</Label>
                <Select value={instructor} onValueChange={setInstructor}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue placeholder="Select instructor" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {INSTRUCTORS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Self-Reflection */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-1">Section 1: Student Self-Reflection</h2>
            <p className="text-gray-400 text-sm mb-2">Rate yourself from <strong className="text-white">1 (Needs Work)</strong> to <strong className="text-white">5 (Excellent)</strong></p>
            <div className="flex gap-6 text-xs text-gray-500 mb-4">
              <span>1 = Needs Work</span><span>3 = Average</span><span>5 = Excellent</span>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              {SELF_REFLECTION_ITEMS.map((item, i) => (
                <RatingRow key={i} label={item} value={selfRatings[i]}
                  onChange={v => setSelfRatings(r => { const n = [...r]; n[i] = v; return n; })} />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Written Questions */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-1">Section 2: Written Questions</h2>
            <p className="text-gray-400 text-sm mb-6">Please answer each question thoughtfully and honestly.</p>
            <div className="grid gap-6">
              {WRITTEN_QUESTIONS.map((q, i) => (
                <div key={i}>
                  <Label className="text-gray-200 mb-2 block text-sm font-semibold">{i + 1}. {q}</Label>
                  <Textarea value={writtenAnswers[i]}
                    onChange={e => setWrittenAnswers(a => { const n = [...a]; n[i] = e.target.value; return n; })}
                    placeholder="Your answer..." className="bg-zinc-900 border-zinc-700 text-white min-h-[80px]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Parent Evaluation */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-1">Section 3: Parent Evaluation</h2>
            <p className="text-gray-400 text-sm mb-4">Rate 1&ndash;5 for each item. My child&hellip;</p>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 mb-6">
              {PARENT_RATING_ITEMS.map((item, i) => (
                <RatingRow key={i} label={item} value={parentRatings[i]}
                  onChange={v => setParentRatings(r => { const n = [...r]; n[i] = v; return n; })} />
              ))}
            </div>
            <div className="grid gap-5 mb-6">
              {PARENT_QUESTIONS.map((q, i) => (
                <div key={i}>
                  <Label className="text-gray-200 mb-2 block text-sm font-semibold">{q}</Label>
                  <Textarea value={parentAnswers[i]}
                    onChange={e => setParentAnswers(a => { const n = [...a]; n[i] = e.target.value; return n; })}
                    placeholder="Your answer..." className="bg-zinc-900 border-zinc-700 text-white min-h-[80px]" />
                </div>
              ))}
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <Label className="text-gray-200 mb-3 block font-semibold">Would you recommend your child for promotion?</Label>
              <div className="flex gap-4 mb-4">
                {[{ value: "yes", label: "\u2713 Yes" }, { value: "not_yet", label: "\u2717 Not Yet" }].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setParentRecommendation(opt.value as "yes" | "not_yet")}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                      parentRecommendation === opt.value ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}>{opt.label}</button>
                ))}
              </div>
              <Label className="text-gray-300 mb-2 block text-sm">Comments (optional)</Label>
              <Textarea value={parentComments} onChange={e => setParentComments(e.target.value)}
                placeholder="Any additional comments..." className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>
        )}

        {/* Step 5: Black Belt Question */}
        {step === 5 && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-black uppercase mb-2">The Black Belt Question</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">This question reminds us that the journey is bigger than the belt.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
              <p className="text-lg font-semibold text-white mb-4 leading-relaxed">
                &ldquo;If you earn this belt, how will you become a <span className="text-red-400">better person</span>, not just a better martial artist?&rdquo;
              </p>
              <Textarea value={blackBeltAnswer} onChange={e => setBlackBeltAnswer(e.target.value)}
                placeholder="Share your thoughts here..." className="bg-zinc-800 border-zinc-700 text-white min-h-[140px]" />
            </div>
          </div>
        )}

        {/* Step 6: Pledge + Payment */}
        {step === 6 && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-6 text-center">Pledge &amp; Payment</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
              <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm mb-3">Student Pledge</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">
                &ldquo;I understand that earning a new belt is a privilege, not a reward for time. I will continue to train with integrity, respect, discipline, and perseverance. If promoted, I will strive to honor my instructors, my family, and MyDojo by setting a positive example every day.&rdquo;
              </p>
              <div className="flex items-start gap-3">
                <Checkbox id="studentPledge" checked={studentPledge} onCheckedChange={v => setStudentPledge(v === true)} className="mt-0.5 border-zinc-600" />
                <label htmlFor="studentPledge" className="text-sm text-gray-300 cursor-pointer">
                  {isAdult ? "I agree to the Student Pledge" : `${studentName || "Student"} agrees to the Student Pledge`}
                </label>
              </div>
            </div>
            {!isAdult && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
                <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm mb-3">Parent Commitment</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">
                  &ldquo;I will continue encouraging my child to attend class consistently, practice at home, and demonstrate the values taught at MyDojo.&rdquo;
                </p>
                <div className="flex items-start gap-3">
                  <Checkbox id="parentCommitment" checked={parentCommitment} onCheckedChange={v => setParentCommitment(v === true)} className="mt-0.5 border-zinc-600" />
                  <label htmlFor="parentCommitment" className="text-sm text-gray-300 cursor-pointer">I agree to the Parent Commitment</label>
                </div>
              </div>
            )}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-gray-400 text-sm">Belt Test Fee</span>
                <span className="font-bold">$49.00</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-bold text-lg">Total Due Today</span>
                <span className="font-black text-2xl text-red-500">$49.00</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">You will be redirected to a secure Stripe checkout. Your spot is not reserved until payment is received.</p>
            </div>
            <Button onClick={handleSubmit} disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-lg py-6 h-auto">
              {loading ? "Processing..." : "Submit Intent & Pay $49 \u2192"}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-950/50 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={back} className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800 bg-transparent">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {step < TOTAL_STEPS - 1 && (
            <Button type="button" onClick={next} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold">
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Questions? Call us at <a href="tel:8774693656" className="text-red-500">(877) 4-MYDOJO</a> or visit the front desk.
        </p>
      </div>
    </div>
  );
}
