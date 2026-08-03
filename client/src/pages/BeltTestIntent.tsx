import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronLeft, Shield, Calendar, DollarSign, Star, User, Users, UserCheck, Award, Plus, Trash2, Search, CheckCircle } from "lucide-react";

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

type TestingFor = "myself" | "my_child" | "myself_and_child" | "someone_else";

interface ChildData {
  studentName: string;
  currentBelt: string;
  beltSeeking: string;
  instructor: string;
  selfRatings: number[];
  writtenAnswers: string[];
  blackBeltAnswer: string;
  studentPledge: boolean;
}

function makeChild(): ChildData {
  return {
    studentName: "",
    currentBelt: "",
    beltSeeking: "",
    instructor: "",
    selfRatings: Array(SELF_REFLECTION_ITEMS.length).fill(0),
    writtenAnswers: Array(WRITTEN_QUESTIONS.length).fill(""),
    blackBeltAnswer: "",
    studentPledge: false,
  };
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
          i < current ? "bg-red-600 w-6" : i === current ? "bg-red-500 w-10" : "bg-zinc-700 w-6"
        }`} />
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
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
              value === n ? "bg-red-600 text-white shadow-lg" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
            }`}>{n}</button>
        ))}
      </div>
    </div>
  );
}

// TOTAL_STEPS depends on testingFor:
// myself: 0(who) 1(info) 2(self-reflect) 3(written) 4(black-belt) 5(pledge+pay) = 6
// my_child: 0(who) 1(parent info) 2(children list) 3(per-child self-reflect) 4(per-child written) 5(parent eval) 6(black-belt) 7(pledge+pay) = 8

export default function BeltTestIntent() {
  const [testingFor, setTestingFor] = useState<TestingFor | "">("");
  const [step, setStep] = useState(0);

  // Parent / shared info
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Children array
  const [children, setChildren] = useState<ChildData[]>([makeChild()]);
  const [activeChildIdx, setActiveChildIdx] = useState(0);

  // Parent evaluation (shared for all children)
  const [parentRatings, setParentRatings] = useState<number[]>(Array(PARENT_RATING_ITEMS.length).fill(0));
  const [parentAnswers, setParentAnswers] = useState<string[]>(Array(PARENT_QUESTIONS.length).fill(""));
  const [parentRecommendation, setParentRecommendation] = useState<"yes" | "not_yet" | "">("");
  const [parentComments, setParentComments] = useState("");
  const [parentCommitment, setParentCommitment] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdult = testingFor === "myself";
  const isMyselfAndChild = testingFor === "myself_and_child";
  const isChild = testingFor === "my_child" || testingFor === "someone_else" || isMyselfAndChild;

  // For adult: 6 steps (0-5). For child: 8 steps (0-7)
  const TOTAL_STEPS = isAdult ? 6 : 8;

  const submitMultiMutation = trpc.beltTestIntent.submitMulti.useMutation();
  const submitMutation = trpc.beltTestIntent.submit.useMutation();
  // Student lookup
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupEnabled, setLookupEnabled] = useState(false);
  const lookupResults = trpc.beltTestIntent.lookupStudent.useQuery(
    { query: lookupQuery },
    { enabled: lookupEnabled && lookupQuery.length >= 2 }
  );
  function applyLookup(student: { name: string; phone: string; email: string | null; program: string | null }) {
    // Pre-fill parent/contact info
    setParentName(student.name);
    setPhone(student.phone);
    setEmail(student.email || "");
    // Pre-fill first child with student name
    setChildren(prev => prev.map((c, i) => i === 0 ? { ...c, studentName: student.name } : c));
    setLookupQuery("");
    setLookupEnabled(false);
  }

  function updateChild(idx: number, patch: Partial<ChildData>) {
    setChildren(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }

  function addChild() {
    setChildren(prev => [...prev, makeChild()]);
    setActiveChildIdx(children.length);
  }

  function removeChild(idx: number) {
    if (children.length === 1) return;
    setChildren(prev => prev.filter((_, i) => i !== idx));
    setActiveChildIdx(Math.max(0, idx - 1));
  }

  function validateStep(): boolean {
    setError("");
    if (step === 0 && !testingFor) { setError("Please select who is taking the belt test."); return false; }

    if (isAdult) {
      // Adult flow
      if (step === 1) {
        const c = children[0];
        if (!c.studentName.trim()) { setError("Your name is required."); return false; }
        if (!phone.trim() || phone.replace(/\D/g, "").length < 10) { setError("Valid phone number required."); return false; }
        if (!email.trim() || !email.includes("@")) { setError("Valid email required."); return false; }
        if (!c.currentBelt) { setError("Please select your current belt."); return false; }
        if (!c.beltSeeking) { setError("Please select the belt you are seeking."); return false; }
        if (!c.instructor) { setError("Please select your instructor."); return false; }
      }
      if (step === 2 && children[0].selfRatings.some(r => r === 0)) { setError("Please rate all items."); return false; }
      if (step === 3 && children[0].writtenAnswers.some(a => !a.trim())) { setError("Please answer all questions."); return false; }
      if (step === 4 && !children[0].blackBeltAnswer.trim()) { setError("Please answer the Black Belt Question."); return false; }
      if (step === 5 && !children[0].studentPledge) { setError("Please agree to the Student Pledge."); return false; }
    } else {
      // Child/multi flow
      if (step === 1) {
        if (!parentName.trim()) { setError("Parent/guardian name is required."); return false; }
        if (!phone.trim() || phone.replace(/\D/g, "").length < 10) { setError("Valid phone number required."); return false; }
        if (!email.trim() || !email.includes("@")) { setError("Valid email required."); return false; }
      }
      if (step === 2) {
        for (let i = 0; i < children.length; i++) {
          const c = children[i];
          if (!c.studentName.trim()) { setError(`Child ${i + 1}: name is required.`); return false; }
          if (!c.currentBelt) { setError(`Child ${i + 1}: please select current belt.`); return false; }
          if (!c.beltSeeking) { setError(`Child ${i + 1}: please select belt seeking.`); return false; }
          if (!c.instructor) { setError(`Child ${i + 1}: please select instructor.`); return false; }
        }
      }
      // step 3: per-child self-reflect for activeChildIdx
      if (step === 3 && children[activeChildIdx].selfRatings.some(r => r === 0)) {
        setError(`Please rate all items for ${children[activeChildIdx].studentName || `Child ${activeChildIdx + 1}`}.`); return false;
      }
      // step 4: per-child written for activeChildIdx
      if (step === 4 && children[activeChildIdx].writtenAnswers.some(a => !a.trim())) {
        setError(`Please answer all questions for ${children[activeChildIdx].studentName || `Child ${activeChildIdx + 1}`}.`); return false;
      }
      if (step === 5) {
        if (parentRatings.some(r => r === 0)) { setError("Please rate all parent evaluation items."); return false; }
        if (parentAnswers.some(a => !a.trim())) { setError("Please answer all parent questions."); return false; }
        if (!parentRecommendation) { setError("Please select your recommendation."); return false; }
      }
      if (step === 6) {
        for (let i = 0; i < children.length; i++) {
          if (!children[i].blackBeltAnswer.trim()) {
            setError(`Please answer the Black Belt Question for ${children[i].studentName || `Child ${i + 1}`}.`);
            return false;
          }
        }
      }
      if (step === 7) {
        for (let i = 0; i < children.length; i++) {
          if (!children[i].studentPledge) {
            setError(`${children[i].studentName || `Child ${i + 1}`} must agree to the Student Pledge.`);
            return false;
          }
        }
        if (!parentCommitment) { setError("Parent must agree to the commitment."); return false; }
      }
    }
    return true;
  }

  // For multi-child per-child steps, advance child index before advancing step
  function next() {
    if (!validateStep()) return;
    // For child flow steps 3 and 4, cycle through children before advancing
    if (!isAdult && (step === 3 || step === 4)) {
      if (activeChildIdx < children.length - 1) {
        setActiveChildIdx(i => i + 1);
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      } else {
        setActiveChildIdx(0);
      }
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError("");
    if (!isAdult && (step === 3 || step === 4)) {
      if (activeChildIdx > 0) {
        setActiveChildIdx(i => i - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      } else {
        setActiveChildIdx(0);
      }
    }
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      if (isAdult) {
        const c = children[0];
        const result = await submitMutation.mutateAsync({
          studentName: c.studentName,
          parentName: c.studentName,
          phone,
          email,
          currentBelt: c.currentBelt,
          beltSeeking: c.beltSeeking,
          instructor: c.instructor,
          testingFor: "myself",
          selfReflectionRatings: JSON.stringify(SELF_REFLECTION_ITEMS.reduce((acc, item, i) => ({ ...acc, [item]: c.selfRatings[i] }), {} as Record<string, number>)),
          writtenAnswers: JSON.stringify(WRITTEN_QUESTIONS.reduce((acc, q, i) => ({ ...acc, [q]: c.writtenAnswers[i] }), {} as Record<string, string>)),
          blackBeltQuestion: c.blackBeltAnswer,
          studentPledgeAgreed: c.studentPledge,
        });
        if (result.checkoutUrl) window.location.href = result.checkoutUrl;
      } else {
        const result = await submitMultiMutation.mutateAsync({
          parentName,
          phone,
          email,
          testingFor: testingFor as string,
          parentRatings: JSON.stringify(PARENT_RATING_ITEMS.reduce((acc, item, i) => ({ ...acc, [item]: parentRatings[i] }), {} as Record<string, number>)),
          parentAnswers: JSON.stringify(PARENT_QUESTIONS.reduce((acc, q, i) => ({ ...acc, [q]: parentAnswers[i] }), {} as Record<string, string>)),
          parentRecommendation,
          parentComments,
          parentCommitmentAgreed: parentCommitment,
          children: children.map(c => ({
            studentName: c.studentName,
            currentBelt: c.currentBelt,
            beltSeeking: c.beltSeeking,
            instructor: c.instructor,
            selfReflectionRatings: JSON.stringify(SELF_REFLECTION_ITEMS.reduce((acc, item, i) => ({ ...acc, [item]: c.selfRatings[i] }), {} as Record<string, number>)),
            writtenAnswers: JSON.stringify(WRITTEN_QUESTIONS.reduce((acc, q, i) => ({ ...acc, [q]: c.writtenAnswers[i] }), {} as Record<string, string>)),
            blackBeltQuestion: c.blackBeltAnswer,
            studentPledgeAgreed: c.studentPledge,
          })),
        });
        if (result.checkoutUrl) window.location.href = result.checkoutUrl;
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const totalAmount = children.length * 49;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative bg-zinc-950 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[url('/images/hero-main.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Award className="h-3 w-3" /> Saturday, August 15th, 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-3">
            Belt Test<br /><span className="text-red-500">Intent to Promote</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            Complete this form to declare your intent to test on <strong className="text-white">Saturday, August 15th, 2026</strong>. The belt test fee of <span className="text-red-400 font-bold">$49.00 per student</span> is due at registration.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Calendar, label: "Belt Test Date", sub: "Saturday, August 15th, 2026" },
              { icon: Shield, label: "Spotlight Week", sub: "Aug 10\u201314 Prep" },
              { icon: DollarSign, label: "Test Fee", sub: "$49.00 per student" },
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
                { value: "my_child" as TestingFor, icon: Users, label: "My Child / Children", sub: "I am a parent registering one or more children" },
                { value: "myself_and_child" as TestingFor, icon: Users, label: "Myself AND My Child / Children", sub: "I train too — register both myself and my children" },
                { value: "someone_else" as TestingFor, icon: UserCheck, label: "Someone Else", sub: "I am registering on behalf of another student" },
              ] as const).map(({ value, icon: Icon, label, sub }) => (
                <button key={value} type="button" onClick={() => setTestingFor(value)}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                    testingFor === value ? "border-red-500 bg-red-950/30" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }`}>
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

        {/* Step 1 Adult: Student Info */}
        {step === 1 && isAdult && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-2">Your Information</h2>
            <p className="text-gray-400 text-sm mb-6">Fill out all required fields below</p>
            <div className="grid gap-4">
              <div>
                <Label className="text-gray-300 mb-1 block">Your Full Name *</Label>
                <Input value={children[0].studentName} onChange={e => updateChild(0, { studentName: e.target.value })} placeholder="First and Last Name" className="bg-zinc-900 border-zinc-700 text-white" />
              </div>
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
                  <Select value={children[0].currentBelt} onValueChange={v => updateChild(0, { currentBelt: v })}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue placeholder="Select current belt" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">{BELT_RANKS.map(b => <SelectItem key={b} value={b} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300 mb-1 block">Belt Seeking *</Label>
                  <Select value={children[0].beltSeeking} onValueChange={v => updateChild(0, { beltSeeking: v })}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue placeholder="Select belt seeking" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">{BELT_RANKS.map(b => <SelectItem key={b} value={b} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-300 mb-1 block">Instructor</Label>
                <Select value={children[0].instructor} onValueChange={v => updateChild(0, { instructor: v })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue placeholder="Select instructor" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">{INSTRUCTORS.map(i => <SelectItem key={i} value={i} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 Child: Parent Info */}
        {step === 1 && !isAdult && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-2">{isMyselfAndChild ? "Your Information" : "Parent / Guardian Information"}</h2>
            <p className="text-gray-400 text-sm mb-6">{isMyselfAndChild ? "Your contact info — you will be added as a student along with your children" : "Your contact information (shared for all children)"}</p>
            {/* Smart lookup */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
              <Label className="text-gray-300 mb-2 block text-sm font-semibold flex items-center gap-2"><Search className="h-4 w-4 text-red-400" /> Quick Lookup (Optional)</Label>
              <p className="text-xs text-gray-500 mb-3">Type your phone number or student name to auto-fill the form.</p>
              <div className="flex gap-2">
                <Input
                  value={lookupQuery}
                  onChange={e => { setLookupQuery(e.target.value); setLookupEnabled(true); }}
                  placeholder="Phone number or student name..."
                  className="bg-zinc-800 border-zinc-700 text-white flex-1"
                />
              </div>
              {lookupResults.data && lookupResults.data.length > 0 && lookupQuery.length >= 2 && (
                <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                  {lookupResults.data.map((s) => (
                    <button key={s.id} type="button" onClick={() => applyLookup(s)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700 transition-colors text-left border-b border-zinc-700 last:border-0">
                      <div>
                        <p className="text-white font-semibold text-sm">{s.name}</p>
                        <p className="text-gray-400 text-xs">{s.phone} {s.program ? `· ${s.program}` : ""}</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {lookupResults.data && lookupResults.data.length === 0 && lookupQuery.length >= 3 && !lookupResults.isLoading && (
                <p className="text-xs text-gray-500 mt-2">No matching students found — fill in manually below.</p>
              )}
            </div>
            <div className="grid gap-4">
              <div>
                <Label className="text-gray-300 mb-1 block">Parent / Guardian Name *</Label>
                <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Your full name" className="bg-zinc-900 border-zinc-700 text-white" />
              </div>
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
            </div>
          </div>
        )}

        {/* Step 2 Child: Children List */}
        {step === 2 && !isAdult && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-2">Student(s) Information</h2>
            <p className="text-gray-400 text-sm mb-6">{isMyselfAndChild ? "Add yourself and each child testing. You can register multiple students at once." : "Add each child testing. You can register multiple children at once."}</p>
            <div className="grid gap-4">
              {children.map((child, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm">
                      {isMyselfAndChild && idx === 0 ? "Myself (Parent/Adult)" : children.length > 1 ? `Child ${idx + 1}` : "Student"}
                    </h3>
                    {children.length > 1 && (
                      <button type="button" onClick={() => removeChild(idx)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-gray-300 mb-1 block text-sm">Student Name *</Label>
                      <Input value={child.studentName} onChange={e => updateChild(idx, { studentName: e.target.value })} placeholder="Student's full name" className="bg-zinc-800 border-zinc-700 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-300 mb-1 block text-sm">Current Belt *</Label>
                        <Select value={child.currentBelt} onValueChange={v => updateChild(idx, { currentBelt: v })}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Current belt" /></SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">{BELT_RANKS.map(b => <SelectItem key={b} value={b} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">{b}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300 mb-1 block text-sm">Belt Seeking *</Label>
                        <Select value={child.beltSeeking} onValueChange={v => updateChild(idx, { beltSeeking: v })}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Belt seeking" /></SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">{BELT_RANKS.map(b => <SelectItem key={b} value={b} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">{b}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-1 block text-sm">Instructor</Label>
                      <Select value={child.instructor} onValueChange={v => updateChild(idx, { instructor: v })}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Select instructor" /></SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">{INSTRUCTORS.map(i => <SelectItem key={i} value={i} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">{i}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addChild}
                className="flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 hover:border-red-500 text-gray-400 hover:text-red-400 rounded-xl py-4 transition-all">
                <Plus className="h-5 w-5" /> {isMyselfAndChild ? "Add Another Student" : "Add Another Child"}
              </button>
            </div>
            {children.length > 1 && (
              <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-gray-300">
                <span className="text-white font-bold">{children.length} student{children.length > 1 ? "s" : ""}</span> — Total: <span className="text-red-400 font-bold">${children.length * 49}.00</span> ($49 each)
              </div>
            )}
          </div>
        )}

        {/* Step 2 Adult / Step 3 Child: Self-Reflection (per child) */}
        {((isAdult && step === 2) || (!isAdult && step === 3)) && (
          <div>
            {!isAdult && children.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {children.map((c, i) => (
                  <button key={i} type="button" onClick={() => setActiveChildIdx(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activeChildIdx === i ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400"
                    }`}>{c.studentName || `Child ${i + 1}`}</button>
                ))}
              </div>
            )}
            <h2 className="text-2xl font-black uppercase mb-1">
              Section 1: Self-Reflection
              {!isAdult && <span className="text-red-400"> — {children[activeChildIdx].studentName || `Child ${activeChildIdx + 1}`}</span>}
            </h2>
            <p className="text-gray-400 text-sm mb-2">Rate from <strong className="text-white">1 (Needs Work)</strong> to <strong className="text-white">5 (Excellent)</strong></p>
            <div className="flex gap-6 text-xs text-gray-500 mb-4"><span>1 = Needs Work</span><span>3 = Average</span><span>5 = Excellent</span></div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              {SELF_REFLECTION_ITEMS.map((item, i) => {
                const idx = isAdult ? 0 : activeChildIdx;
                return <RatingRow key={i} label={item} value={children[idx].selfRatings[i]}
                  onChange={v => {
                    const newRatings = [...children[idx].selfRatings];
                    newRatings[i] = v;
                    updateChild(idx, { selfRatings: newRatings });
                  }} />;
              })}
            </div>
            {!isAdult && children.length > 1 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                {activeChildIdx < children.length - 1
                  ? `After saving, you'll complete this for ${children[activeChildIdx + 1].studentName || `Child ${activeChildIdx + 2}`}`
                  : "This is the last child for this section"}
              </p>
            )}
          </div>
        )}

        {/* Step 3 Adult / Step 4 Child: Written Questions (per child) */}
        {((isAdult && step === 3) || (!isAdult && step === 4)) && (
          <div>
            {!isAdult && children.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {children.map((c, i) => (
                  <button key={i} type="button" onClick={() => setActiveChildIdx(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activeChildIdx === i ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400"
                    }`}>{c.studentName || `Child ${i + 1}`}</button>
                ))}
              </div>
            )}
            <h2 className="text-2xl font-black uppercase mb-1">
              Section 2: Written Questions
              {!isAdult && <span className="text-red-400"> — {children[activeChildIdx].studentName || `Child ${activeChildIdx + 1}`}</span>}
            </h2>
            <p className="text-gray-400 text-sm mb-6">Please answer each question thoughtfully and honestly.</p>
            <div className="grid gap-6">
              {WRITTEN_QUESTIONS.map((q, i) => {
                const idx = isAdult ? 0 : activeChildIdx;
                return (
                  <div key={i}>
                    <Label className="text-gray-200 mb-2 block text-sm font-semibold">{i + 1}. {q}</Label>
                    <Textarea value={children[idx].writtenAnswers[i]}
                      onChange={e => {
                        const newAnswers = [...children[idx].writtenAnswers];
                        newAnswers[i] = e.target.value;
                        updateChild(idx, { writtenAnswers: newAnswers });
                      }}
                      placeholder="Your answer..." className="bg-zinc-900 border-zinc-700 text-white min-h-[80px]" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5 Child only: Parent Evaluation */}
        {!isAdult && step === 5 && (
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

        {/* Black Belt Question: Step 4 Adult / Step 6 Child */}
        {((isAdult && step === 4) || (!isAdult && step === 6)) && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-black uppercase mb-2">The Black Belt Question</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">This question reminds us that the journey is bigger than the belt.</p>
            </div>
            <div className="grid gap-6">
              {children.map((child, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
                  {children.length > 1 && <h3 className="font-bold text-red-400 text-sm uppercase mb-3">{child.studentName || `Child ${idx + 1}`}</h3>}
                  <p className="text-base font-semibold text-white mb-4 leading-relaxed">
                    &ldquo;If you earn this belt, how will you become a <span className="text-red-400">better person</span>, not just a better martial artist?&rdquo;
                  </p>
                  <Textarea value={child.blackBeltAnswer} onChange={e => updateChild(idx, { blackBeltAnswer: e.target.value })}
                    placeholder="Share your thoughts here..." className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pledge + Payment: Step 5 Adult / Step 7 Child */}
        {((isAdult && step === 5) || (!isAdult && step === 7)) && (
          <div>
            <h2 className="text-2xl font-black uppercase mb-6 text-center">Pledge &amp; Payment</h2>
            {children.map((child, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
                <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm mb-3">
                  Student Pledge {children.length > 1 ? `— ${child.studentName || `Child ${idx + 1}`}` : ""}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">
                  &ldquo;I understand that earning a new belt is a privilege, not a reward for time. I will continue to train with integrity, respect, discipline, and perseverance. If promoted, I will strive to honor my instructors, my family, and MyDojo by setting a positive example every day.&rdquo;
                </p>
                <div className="flex items-start gap-3">
                  <Checkbox id={`pledge-${idx}`} checked={child.studentPledge} onCheckedChange={v => updateChild(idx, { studentPledge: v === true })} className="mt-0.5 border-zinc-600" />
                  <label htmlFor={`pledge-${idx}`} className="text-sm text-gray-300 cursor-pointer">
                    {isAdult ? "I agree to the Student Pledge" : `${child.studentName || `Child ${idx + 1}`} agrees to the Student Pledge`}
                  </label>
                </div>
              </div>
            ))}
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
              {children.map((child, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-gray-400 text-sm">Belt Test Fee — {child.studentName || `Child ${idx + 1}`}</span>
                  <span className="font-bold">$49.00</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="font-bold text-lg">Total Due Today</span>
                <span className="font-black text-2xl text-red-500">${totalAmount}.00</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">You will be redirected to a secure Stripe checkout. Your spot is not reserved until payment is received.</p>
            </div>
            <Button onClick={handleSubmit} disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-lg py-6 h-auto">
              {loading ? "Processing..." : `Submit Intent & Pay $${totalAmount} \u2192`}
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
              {!isAdult && (step === 3 || step === 4) && activeChildIdx < children.length - 1
                ? `Next: ${children[activeChildIdx + 1].studentName || `Child ${activeChildIdx + 2}`}`
                : "Continue"
              } <ChevronRight className="h-4 w-4 ml-1" />
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
