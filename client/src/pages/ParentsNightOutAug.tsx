import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Star, Clock, Calendar, Zap, Music, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function ParentsNightOutAug() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    studentName: "",
    bringingFriend: false,
    friendName: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const registerMutation = trpc.eventReg.register.useMutation({
    onSuccess: (data) => {
      if (data.free) {
        setSubmitted(true);
        toast.success("You're registered! See you August 21st! 🎉");
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
      eventId: "pno-aug-2026",
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      studentName: form.studentName,
      bringingFriend: form.bringingFriend ? 1 : 0,
      friendName: form.friendName || undefined,
      amountCents: form.bringingFriend ? 0 : 1500,
      eventName: "Parents Night Out — August 21st",
      eventDescription: "Ninja Warrior Course Glow Night at MyDojo, 6PM–9:30PM",
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-500/20 border border-purple-500/40 rounded-full p-6">
              <CheckCircle className="h-16 w-16 text-purple-400" />
            </div>
          </div>
          <h1 className="text-4xl font-black uppercase mb-4">
            You're In! <span className="text-purple-400">🌟</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            {form.name}, you're registered for <strong className="text-white">Parents Night Out on August 21st</strong>! We sent a confirmation text to {form.phone}. See you at 6PM!
          </p>
          <Link href="/august-2026">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-wider px-6">
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
            src="/images/camp-weeks/karate-kids.jpg"
            alt="Parents Night Out"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black/60 to-black" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Star className="h-4 w-4" />
            August 21st, 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            PARENTS<br />
            <span className="text-purple-400">NIGHT OUT</span>
          </h1>
          <p className="text-2xl font-bold text-white mb-2">🥷 NINJA WARRIOR COURSE GLOW NIGHT 🌟</p>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Drop off the kids for a <strong className="text-white">3.5-hour glow-in-the-dark ninja warrior adventure</strong> while you enjoy a night out! Games, obstacles, music, and fun.
          </p>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-400" />
              <div className="text-sm font-bold">Date</div>
              <div className="text-xs text-gray-400">Friday, August 21st</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Clock className="h-6 w-6 text-purple-400" />
              <div className="text-sm font-bold">Time</div>
              <div className="text-xs text-gray-400">6:00 PM – 9:30 PM</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Users className="h-6 w-6 text-purple-400" />
              <div className="text-sm font-bold">Admission</div>
              <div className="text-xs text-gray-400">Bring a Friend OR $15</div>
            </div>
          </div>
        </div>
      </div>

      {/* What to Expect */}
      <div className="bg-purple-900/20 border-y border-purple-500/20 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-purple-400 font-bold uppercase tracking-wider text-sm mb-4 text-center">What to Expect</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Zap className="h-5 w-5" />, label: "Ninja Warrior Course" },
              { icon: <Star className="h-5 w-5" />, label: "Glow-in-the-Dark Fun" },
              { icon: <Music className="h-5 w-5" />, label: "Music & Energy" },
              { icon: <Users className="h-5 w-5" />, label: "Safe Supervised" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <div className="text-purple-400">{icon}</div>
                <div className="text-sm font-bold text-white">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admission Info */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-green-400" />
              <h4 className="font-bold text-green-400 uppercase text-sm">FREE Admission</h4>
            </div>
            <p className="text-sm text-gray-300">Bring a friend who is <strong className="text-white">not currently enrolled</strong> at MyDojo — your child gets in FREE! Great way to introduce a friend to the dojo.</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-purple-400" />
              <h4 className="font-bold text-purple-400 uppercase text-sm">$15 Admission</h4>
            </div>
            <p className="text-sm text-gray-300">Not bringing a guest? No problem! Admission is just <strong className="text-white">$15 per child</strong>. Pay online when you RSVP below.</p>
          </div>
        </div>
      </div>

      {/* RSVP Form */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">RSVP Now</h2>
              <p className="text-sm text-gray-400">Reserve your child's spot</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Your Name (Parent) <span className="text-purple-400">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Parent / Guardian Name"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Student's Name <span className="text-purple-400">*</span></Label>
                <Input
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  placeholder="Child's Name"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-gray-300">Phone Number <span className="text-purple-400">*</span></Label>
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

            {/* Bringing a friend toggle */}
            <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="bringingFriend"
                  checked={form.bringingFriend}
                  onChange={(e) => setForm({ ...form, bringingFriend: e.target.checked, friendName: "" })}
                  className="w-5 h-5 accent-purple-500"
                />
                <Label htmlFor="bringingFriend" className="text-white font-bold cursor-pointer">
                  I'm bringing a friend (FREE admission!)
                </Label>
              </div>
              {form.bringingFriend && (
                <div className="space-y-2 mt-3">
                  <Label className="text-gray-300 text-sm">Friend's Name</Label>
                  <Input
                    value={form.friendName}
                    onChange={(e) => setForm({ ...form, friendName: e.target.value })}
                    placeholder="Friend's child's name"
                    className="bg-zinc-700 border-zinc-500 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-green-400">✓ Your child gets in FREE when you bring a non-enrolled friend!</p>
                </div>
              )}
              {!form.bringingFriend && (
                <p className="text-sm text-gray-400">Not bringing a friend? Admission is $15 — you'll be directed to pay after submitting.</p>
              )}
            </div>

            {/* Price summary */}
            <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-300">Admission</span>
              <span className={`font-black text-xl ${form.bringingFriend ? "text-green-400" : "text-purple-400"}`}>
                {form.bringingFriend ? "FREE" : "$15.00"}
              </span>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-wider text-lg py-6 h-auto rounded-xl"
            >
              {submitting ? "Processing..." : form.bringingFriend ? "RSVP — FREE →" : "RSVP & Pay $15 →"}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? Call us at <a href="tel:8774693656" className="text-purple-400 hover:underline">(877) 4-MYDOJO</a>
        </p>
      </div>
    </div>
  );
}
