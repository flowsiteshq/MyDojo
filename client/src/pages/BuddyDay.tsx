import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Users, Zap, CheckCircle2 } from "lucide-react";

export default function BuddyDay() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    attendeeCount: 1,
    attendeeDetails: "",
    memberType: "member" as "member" | "guest",
    notes: "",
  });

  const submitRsvp = trpc.buddyDay.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("You're on the list! See you Wednesday 🥋");
    },
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter your name.");
    if (!form.phone.trim()) return toast.error("Please enter your phone number.");
    submitRsvp.mutate(form);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="flex justify-center mb-6">
            <div className="bg-primary rounded-full p-6">
              <CheckCircle2 className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">YOU'RE IN! 🎉</h1>
          <p className="text-gray-300 text-lg mb-6">
            We can't wait to see you at <strong className="text-white">Buddy Day — Board Breaking Night!</strong>
          </p>
          <div className="bg-zinc-900 rounded-xl p-6 text-left mb-8 space-y-3">
            <div className="flex items-center gap-3 text-gray-300">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              <span><strong className="text-white">Wednesday, May 20th, 2026</strong></span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
              <span>6:00 PM – 7:30 PM</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span>MyDojo Tomball HQ</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Bring your buddy — all ranks and ages welcome. This is a <strong className="text-white">FREE</strong> event!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-main.jpg"
            alt="Board Breaking"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-primary text-white text-sm font-bold uppercase tracking-widest px-4 py-2 mb-6 rounded-sm">
            🎉 Free Event — May 20th
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4 leading-tight">
            BUDDY DAY<br />
            <span className="text-primary">BOARD BREAKING</span><br />
            NIGHT
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Bring a friend, family member, or anyone you want to introduce to the martial arts lifestyle. All ranks and ages welcome!
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Wednesday, May 20th</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>6:00 PM – 7:30 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>MyDojo Tomball HQ</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>FREE Event</span>
            </div>
          </div>
        </div>
      </div>

      {/* What to Expect */}
      <section className="py-16 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="p-6">
              <div className="text-4xl mb-4">🥋</div>
              <h3 className="font-heading font-bold text-xl mb-2">All Ranks Welcome</h3>
              <p className="text-gray-400 text-sm">White belt to black belt — everyone gets to break boards!</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-heading font-bold text-xl mb-2">Bring a Buddy</h3>
              <p className="text-gray-400 text-sm">Invite a friend, sibling, neighbor — anyone curious about martial arts.</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="font-heading font-bold text-xl mb-2">Totally Free</h3>
              <p className="text-gray-400 text-sm">No cost, no commitment. Just an awesome evening of fun and martial arts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP Form */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
              RSVP NOW
            </h2>
            <p className="text-gray-400">Spots are limited — reserve your place today!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Member type toggle */}
            <div className="flex rounded-lg overflow-hidden border border-zinc-700">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, memberType: "member" }))}
                className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  form.memberType === "member"
                    ? "bg-primary text-white"
                    : "bg-zinc-900 text-gray-400 hover:text-white"
                }`}
              >
                Current Member
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, memberType: "guest" }))}
                className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  form.memberType === "guest"
                    ? "bg-primary text-white"
                    : "bg-zinc-900 text-gray-400 hover:text-white"
                }`}
              >
                Guest / New
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Your Name *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number *</label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(555) 555-5555"
                type="tel"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email (optional)</label>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                type="email"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <Users className="inline h-4 w-4 mr-1" />
                How many people are attending? *
              </label>
              <Input
                value={form.attendeeCount}
                onChange={e => setForm(f => ({ ...f, attendeeCount: Math.max(1, parseInt(e.target.value) || 1) }))}
                type="number"
                min={1}
                max={20}
                className="bg-zinc-900 border-zinc-700 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Names &amp; ages of attendees (optional)
              </label>
              <Textarea
                value={form.attendeeDetails}
                onChange={e => setForm(f => ({ ...f, attendeeDetails: e.target.value }))}
                placeholder="e.g. John (adult), Sarah (age 8), Mike (age 10)"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Any notes or questions? (optional)</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Questions, special accommodations, etc."
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 resize-none"
                rows={2}
              />
            </div>

            <Button
              type="submit"
              disabled={submitRsvp.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-6 h-auto font-heading uppercase tracking-wider"
            >
              {submitRsvp.isPending ? "Submitting..." : "RSVP — Reserve My Spot 🥋"}
            </Button>

            <p className="text-center text-xs text-gray-500">
              This is a free event. No payment required. We'll send a reminder closer to the date.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
