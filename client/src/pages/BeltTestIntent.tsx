import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Award, ChevronRight, Shield, Star, Calendar, Clock, DollarSign } from "lucide-react";

const BELTS = [
  "White Belt",
  "Yellow Belt",
  "Orange Belt",
  "Green Belt",
  "Blue Belt",
  "Purple Belt",
  "Red Belt",
  "Brown Belt",
  "Black Belt Candidate",
];

const INSTRUCTORS = [
  "Master Vincent Holmes",
  "Sensei Kamil Ahmed",
  "Sensei Hector Diosdado",
  "Sensei Dominique Griggs",
  "Other",
];

export default function BeltTestIntent() {
  const [form, setForm] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    email: "",
    currentBelt: "",
    instructor: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submitMutation = trpc.beltTestIntent.submit.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName || !form.parentName || !form.phone || !form.email || !form.currentBelt) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    submitMutation.mutate({ ...form, eventId: "aug-2026-belt-test" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          <img
            src="/images/camp-weeks/black-belt.jpg"
            alt="Belt Test"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E10600]/20 border border-[#E10600]/40 text-[#E10600] text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Award className="h-4 w-4" />
            August 15th, 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            BELT TEST<br />
            <span className="text-[#E10600]">INTENT TO PROMOTE</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Ready to advance to your next rank? Complete this form to declare your intent to test on <strong className="text-white">August 15th, 2026</strong>. The belt test fee of <strong className="text-[#E10600]">$49.00</strong> is due at registration.
          </p>

          {/* Key Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Calendar className="h-6 w-6 text-[#E10600]" />
              <div className="text-sm font-bold">Belt Test Date</div>
              <div className="text-xs text-gray-400">August 15th, 2026</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Clock className="h-6 w-6 text-[#E10600]" />
              <div className="text-sm font-bold">Spotlight Week</div>
              <div className="text-xs text-gray-400">Aug 10–14 Prep</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <DollarSign className="h-6 w-6 text-[#E10600]" />
              <div className="text-sm font-bold">Test Fee</div>
              <div className="text-xs text-gray-400">$49.00 (paid online)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Reminders */}
      <div className="bg-[#E10600]/10 border-y border-[#E10600]/30 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-[#E10600] font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Important Reminders
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[#E10600] mt-0.5 shrink-0" /> Intent to Promote form must be submitted <strong className="text-white">prior to August 10th</strong></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[#E10600] mt-0.5 shrink-0" /> Uniforms must be ordered — Extra Black or Red Gi available</li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[#E10600] mt-0.5 shrink-0" /> Spotlight Week (Aug 10–14): Testing Preparation classes</li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[#E10600] mt-0.5 shrink-0" /> Pre-order Sparring Gear, T-Shirts &amp; Apparel available</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#E10600] p-2 rounded-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Student Registration</h2>
              <p className="text-sm text-gray-400">Fill out all required fields below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="studentName" className="text-gray-300">Student Name <span className="text-[#E10600]">*</span></Label>
                <Input
                  id="studentName"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="First and Last Name"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-[#E10600]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentName" className="text-gray-300">Parent / Guardian Name <span className="text-[#E10600]">*</span></Label>
                <Input
                  id="parentName"
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  placeholder="Parent or Guardian"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-[#E10600]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Phone Number <span className="text-[#E10600]">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-[#E10600]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email Address <span className="text-[#E10600]">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="parent@email.com"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-[#E10600]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Current Belt <span className="text-[#E10600]">*</span></Label>
                <Select value={form.currentBelt} onValueChange={(v) => setForm({ ...form, currentBelt: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-[#E10600]">
                    <SelectValue placeholder="Select current belt" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    {BELTS.map((b) => (
                      <SelectItem key={b} value={b} className="text-white hover:bg-zinc-700">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Instructor</Label>
                <Select value={form.instructor} onValueChange={(v) => setForm({ ...form, instructor: v })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-[#E10600]">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    {INSTRUCTORS.map((i) => (
                      <SelectItem key={i} value={i} className="text-white hover:bg-zinc-700">{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special notes for your instructor..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-[#E10600] min-h-[80px]"
              />
            </div>

            {/* Payment Summary */}
            <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Belt Test Fee</span>
                <span className="text-white font-bold">$49.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-600 pt-2">
                <span className="text-white font-bold">Total Due Today</span>
                <span className="text-[#E10600] font-black text-xl">$49.00</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                You will be redirected to a secure Stripe checkout to complete payment. Your spot is not reserved until payment is received.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#E10600] hover:bg-[#c00500] text-white font-black uppercase tracking-wider text-lg py-6 h-auto rounded-xl"
            >
              {submitting ? "Processing..." : "Submit Intent & Pay $49 →"}
            </Button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? Call us at <a href="tel:8774693656" className="text-[#E10600] hover:underline">(877) 4-MYDOJO</a> or visit the front desk.
        </p>
      </div>
    </div>
  );
}
