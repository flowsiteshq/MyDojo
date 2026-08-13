import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Swords, Calendar, Clock, DollarSign, Award, ChevronRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function MasterYaegerSeminar() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    studentName: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const registerMutation = trpc.eventReg.register.useMutation({
    onSuccess: (data) => {
      if (data.free) {
        setSubmitted(true);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
      setSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.studentName) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    registerMutation.mutate({
      eventId: "seminar-yaeger-aug-2026",
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      studentName: form.studentName,
      amountCents: 2900,
      eventName: "Seminar with Master Yaeger — August 22nd",
      eventDescription: "3-hour intensive seminar with Master Yaeger, 11AM–2PM, August 22nd 2026",
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 border border-blue-500/40 rounded-full p-6">
              <CheckCircle className="h-16 w-16 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-black uppercase mb-4">
            You're Registered! <span className="text-blue-400">🥋</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            See you on <strong className="text-white">August 22nd at 11AM</strong> for the Master Yaeger Seminar!
          </p>
          <Link href="/august-2026">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider px-6">
              View All August Events →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0">
          <img
            src="/images/camp-weeks/board-breaking.jpg"
            alt="Master Yaeger Seminar"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-black/60 to-black" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Award className="h-4 w-4" />
            Special Event
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            SEMINAR WITH<br />
            <span className="text-blue-400">MASTER YAEGER</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            A rare opportunity to train directly with <strong className="text-white">Master Yaeger</strong> in an intensive 3-hour seminar. Advanced techniques, personal instruction, and an unforgettable experience for all belt levels.
          </p>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-400" />
              <div className="text-sm font-bold">Date</div>
              <div className="text-xs text-gray-400">Saturday, August 22nd</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Clock className="h-6 w-6 text-blue-400" />
              <div className="text-sm font-bold">Time</div>
              <div className="text-xs text-gray-400">11:00 AM – 2:00 PM</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <DollarSign className="h-6 w-6 text-blue-400" />
              <div className="text-sm font-bold">Seminar Fee</div>
              <div className="text-xs text-gray-400">$29.00</div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn */}
      <div className="bg-blue-900/20 border-y border-blue-500/20 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-blue-400 font-bold uppercase tracking-wider text-sm mb-4 text-center">What to Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {[
              "3 hours of intensive training with Master Yaeger",
              "Advanced techniques not covered in regular classes",
              "Personal instruction and feedback",
              "Open to all belt levels — beginners welcome",
              "Q&A session with Master Yaeger",
              "Unforgettable experience for serious students",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <ChevronRight className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Register for the Seminar</h2>
              <p className="text-sm text-gray-400">Secure your spot — limited availability</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Your Name (Parent) <span className="text-blue-400">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Parent / Guardian Name"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Student's Name <span className="text-blue-400">*</span></Label>
                <Input
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="Student attending the seminar"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Phone Number <span className="text-blue-400">*</span></Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Email (optional)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="parent@email.com"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Seminar Fee</span>
                <span className="text-white font-bold">$29.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-600 pt-2">
                <span className="text-white font-bold">Total Due Today</span>
                <span className="text-blue-400 font-black text-xl">$29.00</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                You will be redirected to secure checkout to complete payment.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-lg py-6 h-auto rounded-xl"
            >
              {submitting ? "Processing..." : "Register & Pay $29 →"}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? Call us at <a href="tel:8774693656" className="text-blue-400 hover:underline">(877) 4-MYDOJO</a>
        </p>
      </div>
    </div>
  );
}
