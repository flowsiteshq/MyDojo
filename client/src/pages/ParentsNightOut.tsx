import { useTranslation } from "react-i18next";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ParentsNightOut() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    parentName: "",
    phone: "",
    email: "",
    studentNames: "",
    studentCount: 1,
    bringingFriend: false,
    friendName: "",
    notes: "",
  });

  const submitRsvp = trpc.pno.submitRsvp.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentName || !form.phone || !form.studentNames) {
      toast.error("Please fill in all required fields.");
      return;
    }
    submitRsvp.mutate({
      parentName: form.parentName,
      phone: form.phone,
      email: form.email || undefined,
      studentNames: form.studentNames,
      studentCount: form.studentCount,
      bringingFriend: form.bringingFriend,
      friendName: form.bringingFriend ? form.friendName : undefined,
      notes: form.notes || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Confetti-style icons */}
          <div className="text-6xl mb-4">🎉🎯🎉</div>
          <h1 className="text-4xl font-black text-white uppercase mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
            You're In!
          </h1>
          <p className="text-xl text-yellow-400 font-bold mb-4">NERF WARS — FRIDAY, APRIL 25TH</p>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-white font-semibold">MyDojo Martial Arts</p>
                <p className="text-zinc-400 text-sm">11721 Spring Cypress Rd, Tomball TX 77377</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🕕</span>
              <div>
                <p className="text-white font-semibold">6:00 PM – 9:00 PM</p>
                <p className="text-zinc-400 text-sm">Drop off at 6, pick up by 9</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍕</span>
              <div>
                <p className="text-white font-semibold">Pizza, Drinks & Snacks</p>
                <p className="text-zinc-400 text-sm">All included — FREE event!</p>
              </div>
            </div>
          </div>
          <p className="text-zinc-400 text-sm">We'll send a reminder text before the event. See you on the mat! 🥋</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black">
        {/* Background accent */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
          {/* Badge */}
          <div className="inline-block bg-yellow-400 text-black text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            🎉 FREE EVENT — Parents Night Out
          </div>

          {/* Title */}
          <h1
            className="text-6xl md:text-8xl font-black uppercase text-white leading-none mb-2"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em" }}
          >
            NERF
          </h1>
          <h1
            className="text-6xl md:text-8xl font-black uppercase leading-none mb-6"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.03em", color: "#FACC15" }}
          >
            WARS
          </h1>

          {/* Date */}
          <p className="text-xl md:text-2xl text-zinc-300 font-semibold mb-2">
            Friday, April 25th &nbsp;·&nbsp; 6:00 PM – 9:00 PM
          </p>
          <p className="text-zinc-400 mb-8">MyDojo Martial Arts · 11721 Spring Cypress Rd, Tomball TX</p>

          {/* Perks */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["🍕 Pizza & Snacks", "🥤 Drinks", "🎯 Nerf Battles", "👫 Bring a Friend", "✅ FREE"].map((perk) => (
              <span key={perk} className="bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-full">
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RSVP Form */}
      <div className="max-w-lg mx-auto px-4 pb-16 -mt-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
          <h2 className="text-2xl font-black uppercase text-white mb-1 text-center" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
            RSVP Now — It's Free!
          </h2>
          <p className="text-zinc-400 text-sm text-center mb-6">We just need to know how many kids are coming 🎯</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Parent Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Parent / Guardian Name *</label>
              <Input
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-yellow-400"
                placeholder="Your full name"
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Phone Number *</label>
              <Input
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-yellow-400"
                placeholder="(555) 000-0000"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Email (optional)</label>
              <Input
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-yellow-400"
                placeholder="your@email.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Student Names */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Student Name(s) Attending *</label>
              <Input
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-yellow-400"
                placeholder="e.g. Jake, Emma"
                value={form.studentNames}
                onChange={(e) => setForm({ ...form, studentNames: e.target.value })}
                required
              />
            </div>

            {/* Student Count */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">How many students attending?</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xl flex items-center justify-center"
                  onClick={() => setForm({ ...form, studentCount: Math.max(1, form.studentCount - 1) })}
                >
                  −
                </button>
                <span className="text-2xl font-black text-white w-8 text-center">{form.studentCount}</span>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xl flex items-center justify-center"
                  onClick={() => setForm({ ...form, studentCount: Math.min(10, form.studentCount + 1) })}
                >
                  +
                </button>
              </div>
            </div>

            {/* Bringing a Friend */}
            <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 accent-yellow-400"
                  checked={form.bringingFriend}
                  onChange={(e) => setForm({ ...form, bringingFriend: e.target.checked })}
                />
                <div>
                  <p className="text-white font-semibold">Bringing a friend? 👫</p>
                  <p className="text-zinc-400 text-sm">Non-MyDojo kids are welcome too!</p>
                </div>
              </label>
              {form.bringingFriend && (
                <div className="mt-3">
                  <Input
                    className="bg-zinc-700 border-zinc-500 text-white placeholder:text-zinc-500 focus:border-yellow-400"
                    placeholder="Friend's name"
                    value={form.friendName}
                    onChange={(e) => setForm({ ...form, friendName: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 block">Any allergies or notes? (optional)</label>
              <Textarea
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 focus:border-yellow-400 resize-none"
                placeholder="e.g. nut allergy, vegetarian..."
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitRsvp.isPending}
              className="w-full h-14 text-lg font-black uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl"
            >
              {submitRsvp.isPending ? "Saving your spot..." : "🎯 COUNT ME IN!"}
            </Button>

            <p className="text-center text-zinc-500 text-xs">
              This is a FREE event. No payment required. 🥋
            </p>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-zinc-500 text-sm">Questions? Call or text us at</p>
          <a href="tel:8774693656" className="text-yellow-400 font-bold text-lg hover:text-yellow-300">(877) 4-MYDOJO</a>
          <p className="text-zinc-600 text-xs">MyDojo Martial Arts · 11721 Spring Cypress Rd, Tomball TX 77377</p>
        </div>
      </div>
    </div>
  );
}
