import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Phone, Mail, Star, Shield, Zap, Users, Clock, Check, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { programs } from "@/data/programs";

const JOIN_FAQS = [
  {
    q: "Do I need any experience to start?",
    a: "Absolutely not. All of our programs are designed to welcome complete beginners. Our instructors will guide you step by step from your very first class, and you'll be training alongside other beginners who started exactly where you are."
  },
  {
    q: "What should I wear to my free trial class?",
    a: "Just come in comfortable athletic clothing — shorts or sweatpants and a t-shirt work perfectly. We'll provide a uniform (gi) once you officially enroll. For your trial class, bare feet or clean athletic shoes are fine."
  },
  {
    q: "How old does my child need to be to start?",
    a: "We welcome students as young as 3 years old in our Little Ninjas program. Our Dragon Kids program is for ages 5–12, and our Teens program starts at 13. Adults of all ages are welcome in our Adult Karate and Kickboxing programs."
  },
  {
    q: "How much does membership cost?",
    a: "We offer flexible membership plans starting at competitive monthly rates. During your free trial class, one of our instructors will walk you through all available options with no pressure. We have plans to fit most budgets."
  },
  {
    q: "How long is each class?",
    a: "Most classes run 45–60 minutes. Little Ninjas classes are 30–45 minutes to match younger attention spans. Class schedules vary by program — we'll share the full schedule when you book your trial."
  },
  {
    q: "What if my child is shy or nervous?",
    a: "That's completely normal, and honestly it's one of the most common reasons parents bring their kids to us! Our instructors are trained to work with shy and anxious children. Building confidence is literally what we do — most kids are smiling by the end of their first class."
  },
  {
    q: "Is there a contract or long-term commitment?",
    a: "We offer both month-to-month and longer-term membership options. Your free trial class comes with zero obligation — come try it, and if you love it, we'll find a plan that works for you."
  },
  {
    q: "Where are you located?",
    a: "We are located in Tomball, TX. After you submit the form above, our team will reach out with the exact address and directions, as well as help you pick the best class time for your schedule."
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {JOIN_FAQS.map((faq, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="font-bold text-gray-900 text-base pr-4">{faq.q}</span>
            <ChevronDown
              className={`h-5 w-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === i && (
            <div className="px-6 pb-5 bg-gray-50 text-gray-600 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const PROGRAM_MAP: Record<string, "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "After School" | "Summer Camp" | "Not Sure"> = {
  "little-ninjas": "Little Ninjas",
  "core-kids": "Dragon Kids",
  "teens": "Teens",
  "adult-karate": "Adult Karate",
  "kickboxing": "Kickboxing",
  "after-school": "After School",
  "summer-camp": "Summer Camp",
};

export default function Join() {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [contactMethod, setContactMethod] = useState<"text" | "phone" | "email">("text");
  const [submitted, setSubmitted] = useState(false);

  const createLead = trpc.trialSignups.create.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const isKidsProgram = ["little-ninjas", "core-kids", "after-school", "summer-camp"].includes(selectedProgram);

  const handleProgramSelect = (id: string) => {
    setSelectedProgram(id);
    // Scroll to form
    setTimeout(() => {
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !selectedProgram) {
      toast.error("Please select a program and fill in all required fields.");
      return;
    }
    createLead.mutate({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      program: PROGRAM_MAP[selectedProgram] ?? "Not Sure",
      location: "Tomball HQ",
      preferredContactMethod: contactMethod,
      message: childName ? `Child's name: ${childName}` : undefined,
      source: "landing_page",
    });
  };

  const selectedProgramData = programs.find((p) => p.id === selectedProgram);

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header — no nav distractions */}
      <header className="bg-black py-4 px-6 flex items-center justify-between">
        <img src="/images/logo-icon-white.99cb4daa.webp" alt="MyDojo" className="h-10 w-auto object-contain" />
        <a href="tel:8774693656" className="flex items-center gap-2 text-white font-bold text-lg hover:text-primary transition-colors">
          <Phone className="h-5 w-5 text-primary" />
          (877) 4-MYDOJO
        </a>
      </header>

      {/* Hero */}
      <div className="relative bg-black text-white py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg')" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block bg-primary text-white text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Free Trial Class — No Obligation
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight">
            START YOUR MARTIAL ARTS<br /><span className="text-primary">JOURNEY TODAY</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Choose your program below and claim your complimentary trial class at MyDojo in Tomball, TX.
          </p>
          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <button
              onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="bg-primary hover:bg-primary/90 text-white font-heading font-bold uppercase tracking-wider text-lg px-10 py-5 rounded-lg shadow-lg transition-all hover:scale-105"
            >
              Book Free Trial Class →
            </button>
            <a
              href="tel:8774693656"
              className="flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-black font-heading font-bold uppercase tracking-wider text-lg px-10 py-5 rounded-lg transition-all"
            >
              <Phone className="h-5 w-5" /> Call (877) 4-MYDOJO
            </a>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <span className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> 4.9★ Google Rating</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 500+ Active Members</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Certified Instructors</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Ages 3 & Up</span>
          </div>
        </div>
      </div>

      {/* Step 1 — Choose a Program */}
      <div className="bg-gray-50 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Step 1</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-black">Choose Your Program</h2>
            <p className="text-gray-500 mt-2">Click the program that's right for you or your child</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((program) => (
              <button
                key={program.id}
                onClick={() => handleProgramSelect(program.id)}
                className={`group relative rounded-xl overflow-hidden text-left transition-all duration-300 shadow-md hover:shadow-xl focus:outline-none ${
                  selectedProgram === program.id
                    ? "ring-4 ring-primary scale-[1.02]"
                    : "hover:scale-[1.01]"
                }`}
              >
                <div className="relative h-44">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  {selectedProgram === program.id && (
                    <div className="absolute top-3 right-3 bg-primary rounded-full p-1.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className={`p-4 ${selectedProgram === program.id ? "bg-primary text-white" : "bg-white"}`}>
                  <h3 className={`font-heading font-bold text-lg ${selectedProgram === program.id ? "text-white" : "text-black"}`}>
                    {program.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-sm flex items-center gap-1 ${selectedProgram === program.id ? "text-white/80" : "text-gray-500"}`}>
                      <Users className="h-3.5 w-3.5" /> {program.ages}
                    </span>
                    <span className={`text-sm flex items-center gap-1 ${selectedProgram === program.id ? "text-white/80" : "text-gray-500"}`}>
                      <Clock className="h-3.5 w-3.5" /> {program.duration}
                    </span>
                  </div>
                  <p className={`text-sm mt-2 line-clamp-2 ${selectedProgram === program.id ? "text-white/90" : "text-gray-600"}`}>
                    {program.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* CTA below program cards */}
          <div className="text-center mt-10">
            <button
              onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-heading font-bold uppercase tracking-wider text-lg px-12 py-5 rounded-lg shadow-lg transition-all hover:scale-105"
            >
              Claim Your Free Trial Class →
            </button>
            <p className="text-gray-400 text-sm mt-3">No credit card · No obligation · Beginners welcome</p>
          </div>
        </div>
      </div>

      {/* Step 2 — Lead Capture Form */}
      <div id="lead-form" className="py-14 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Step 2</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-black">Claim Your Free Trial</h2>
            {selectedProgramData ? (
              <p className="text-gray-500 mt-2">
                You selected: <strong className="text-primary">{selectedProgramData.title}</strong>
              </p>
            ) : (
              <p className="text-gray-500 mt-2">Select a program above, then fill in your details</p>
            )}
          </div>

          {submitted ? (
            <div className="bg-white border-2 border-green-300 rounded-2xl p-10 text-center shadow-xl">
              <div className="flex justify-center mb-5">
                <div className="bg-green-100 rounded-full p-5">
                  <CheckCircle2 className="h-14 w-14 text-green-600" />
                </div>
              </div>
              <h3 className="text-3xl font-heading font-bold mb-3 text-gray-900">You're All Set!</h3>
              <p className="text-gray-600 text-lg mb-6">
                We've received your request for <strong>{selectedProgramData?.title ?? "your program"}</strong> and will reach out within 24 hours to schedule your free trial class.
              </p>
              <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">What Happens Next</p>
                <p className="text-gray-700">1. Our team will contact you within 24 hours</p>
                <p className="text-gray-700">2. We'll schedule your free trial class at a time that works for you</p>
                <p className="text-gray-700">3. Come in, meet the team, and experience MyDojo!</p>
              </div>
              <p className="text-sm text-gray-500">Questions? Call us at <strong>(877) 4-MYDOJO</strong></p>
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-primary px-8 py-6 text-white text-center">
                <h3 className="text-2xl font-heading font-bold">
                  {selectedProgramData ? `Free ${selectedProgramData.title} Trial` : "Get Your Free Trial Class"}
                </h3>
                <p className="text-sm opacity-90 mt-1">One complimentary class — no credit card, no obligation</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                {/* Program selector (also selectable from form) */}
                <div className="space-y-1.5">
                  <Label htmlFor="program">
                    Program <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger id="program" className={!selectedProgram ? "border-primary" : ""}>
                      <SelectValue placeholder="Select a program..." />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} ({p.ages})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Parent/Your Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    {isKidsProgram ? "Parent's Full Name" : "Your Full Name"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={isKidsProgram ? "e.g. Jane Smith" : "e.g. John Smith"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Child Name for kids programs */}
                {isKidsProgram && (
                  <div className="space-y-1.5">
                    <Label htmlFor="childName">Child's Name</Label>
                    <Input
                      id="childName"
                      placeholder="e.g. Alex Smith"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(713) 555-0100"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Preferred Contact */}
                <div className="space-y-1.5">
                  <Label htmlFor="contactMethod">Best Way to Reach You</Label>
                  <Select value={contactMethod} onValueChange={(v) => setContactMethod(v as any)}>
                    <SelectTrigger id="contactMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Message</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={createLead.isPending || !selectedProgram}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-7 text-xl font-heading uppercase tracking-wider"
                >
                  {createLead.isPending ? "Submitting..." : "Book My Free Trial Class →"}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  No credit card required. No obligation. Beginners always welcome.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-black text-white py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-heading font-bold mb-10">
            WHAT OUR MEMBERS SAY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "MyDojo changed my son's life. He went from shy and timid to confident and focused in just a few months.", name: "Sarah M.", program: "Dragon Kids Parent" },
              { quote: "The kickboxing classes are incredible. I've lost 30 pounds and feel stronger than I ever have.", name: "James T.", program: "Kickboxing Member" },
              { quote: "Best decision we made for our daughter. The instructors are amazing and she absolutely loves it!", name: "Lisa R.", program: "Little Ninjas Parent" },
            ].map((t, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-4">"{t.quote}"</p>
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-primary text-sm">{t.program}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-black">COMMON QUESTIONS</h2>
            <p className="text-gray-500 mt-3">Everything you need to know before your first class</p>
          </div>

          <FaqAccordion />

          <div className="text-center mt-10">
            <p className="text-gray-500">Still have questions? <a href="tel:8774693656" className="text-primary font-bold hover:underline">(877) 4-MYDOJO</a> or <a href="mailto:info@mydojoma.com" className="text-primary font-bold hover:underline">email us</a></p>
          </div>
        </div>
      </div>

      {/* Final CTA Banner */}
      <div className="bg-primary py-12 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">READY TO GET STARTED?</h2>
        <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">Join hundreds of families in Tomball who have transformed their lives through martial arts.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="bg-white text-primary hover:bg-black hover:text-white font-heading font-bold uppercase tracking-wider text-lg px-10 py-5 rounded-lg shadow-lg transition-all"
          >
            Book Free Trial Class →
          </button>
          <a
            href="tel:8774693656"
            className="flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-primary font-heading font-bold uppercase tracking-wider text-lg px-10 py-5 rounded-lg transition-all"
          >
            <Phone className="h-5 w-5" /> Call Us Now
          </a>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="bg-black border-t border-white/10 py-6 px-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} MyDojo Martial Arts &amp; Fitness · Tomball, TX · <a href="tel:8774693656" className="text-primary hover:underline">(877) 4-MYDOJO</a></p>
        <p className="mt-1">
          <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
          {" · "}
          <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
        </p>
      </footer>

      {/* Sticky Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black border-t border-white/20 flex">
        <button
          onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="flex-1 bg-primary text-white font-heading font-bold uppercase tracking-wider text-sm py-4 flex items-center justify-center gap-2"
        >
          Book Free Trial
        </button>
        <a
          href="tel:8774693656"
          className="flex-1 bg-black text-white font-heading font-bold uppercase tracking-wider text-sm py-4 flex items-center justify-center gap-2 border-l border-white/20"
        >
          <Phone className="h-4 w-4" /> Call Now
        </a>
      </div>
    </div>
  );
}
