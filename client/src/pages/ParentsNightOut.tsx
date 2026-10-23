import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EVENT_ID = "pno-oct-2026" as const;

export default function ParentsNightOut() {
  const [submitted, setSubmitted] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [form, setForm] = useState({
    parentName: "",
    phone: "",
    email: "",
    studentNames: "",
    studentCount: 1,
    bringingFriend: false,
    friendName: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
    waiverAccepted: false,
  });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    setPaymentMessage("Verifying your PayPal payment…");
    fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: token }),
    }).then((response) => {
      if (!response.ok) throw new Error("Payment verification failed");
      setSubmitted(true);
    }).catch(() => setPaymentMessage("Your registration is saved, but payment verification is still pending. Please contact support if you completed PayPal checkout."));
  }, []);

  const submitRsvp = trpc.pno.submitRsvp.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentName || !form.phone || !form.studentNames || !form.emergencyContactName || !form.emergencyContactPhone) {
      toast.error("Please complete the required contact and emergency fields.");
      return;
    }
    if (!form.waiverAccepted) {
      toast.error("Please accept the event waiver to continue.");
      return;
    }
    submitRsvp.mutate({
      eventId: EVENT_ID,
      parentName: form.parentName,
      phone: form.phone,
      email: form.email || undefined,
      studentNames: form.studentNames,
      studentCount: form.studentCount,
      bringingFriend: form.bringingFriend,
      friendName: form.bringingFriend ? form.friendName : undefined,
      emergencyContactName: form.emergencyContactName,
      emergencyContactPhone: form.emergencyContactPhone,
      notes: form.notes || undefined,
      waiverAccepted: true,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 text-white">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">🎃🥋🎃</div>
          <h1 className="text-4xl font-black uppercase mb-3">You’re Registered!</h1>
          <p className="text-xl text-orange-300 font-bold mb-4">HAUNTED DOJO — FRIDAY, OCTOBER 30</p>
          <p className="text-zinc-300">Your registration is saved. We’ll send confirmation after PayPal verifies your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-[#24110d] to-[#09090b]">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="inline-block rounded-full border border-orange-400/50 bg-orange-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-orange-300 mb-6">
            🎃 Parents’ Night Out · Haunted Dojo
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none mb-5">HAUNTED DOJO</h1>
          <p className="text-xl md:text-2xl font-semibold text-orange-200 mb-2">Friday, October 30 · 6:00 PM – 9:00 PM</p>
          <p className="text-zinc-400 mb-8">MyDojo Martial Arts · 11721 Spring Cypress Rd, Tomball TX</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["👻 Halloween games", "🥋 Martial-arts activities", "🧟 Costume fun", "$15 per child", "👫 Bring a friend FREE"].map((perk) => (
              <span key={perk} className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm font-semibold">{perk}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pb-16 -mt-4">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 md:p-8 shadow-2xl">
          <h2 className="text-2xl font-black uppercase text-center mb-1">Reserve Your Spot</h2>
          <p className="text-zinc-400 text-sm text-center mb-6">Capacity is limited to 30 children, including free guests.</p>
          {paymentMessage && <p className="mb-4 rounded-lg border border-orange-400/40 bg-orange-400/10 p-3 text-center text-sm text-orange-200">{paymentMessage}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input className="bg-zinc-800 border-zinc-600 text-white" placeholder="Parent / guardian name *" value={form.parentName} onChange={(e) => setField("parentName", e.target.value)} required />
            <Input className="bg-zinc-800 border-zinc-600 text-white" placeholder="Parent phone *" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} required />
            <Input className="bg-zinc-800 border-zinc-600 text-white" placeholder="Parent email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
            <Input className="bg-zinc-800 border-zinc-600 text-white" placeholder="Student name(s) attending *" value={form.studentNames} onChange={(e) => setField("studentNames", e.target.value)} required />

            <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">How many MyDojo children? ($15 each)</label>
              <div className="mt-3 flex items-center gap-4">
                <button type="button" className="h-10 w-10 rounded-full bg-zinc-700 text-xl" onClick={() => setField("studentCount", Math.max(1, form.studentCount - 1))}>−</button>
                <span className="w-8 text-center text-2xl font-black">{form.studentCount}</span>
                <button type="button" className="h-10 w-10 rounded-full bg-zinc-700 text-xl" onClick={() => setField("studentCount", Math.min(30, form.studentCount + 1))}>+</button>
                <span className="ml-auto font-bold text-orange-300">${(form.studentCount * 15).toFixed(2)}</span>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-4 cursor-pointer">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-orange-400" checked={form.bringingFriend} onChange={(e) => setField("bringingFriend", e.target.checked)} />
              <span><strong>Bringing a friend?</strong><br /><small className="text-zinc-400">Your friend attends free. Add their name below.</small></span>
            </label>
            {form.bringingFriend && <Input className="bg-zinc-800 border-zinc-600 text-white" placeholder="Friend’s name" value={form.friendName} onChange={(e) => setField("friendName", e.target.value)} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input className="bg-zinc-800 border-zinc-600 text-white" placeholder="Emergency contact name *" value={form.emergencyContactName} onChange={(e) => setField("emergencyContactName", e.target.value)} required />
              <Input className="bg-zinc-800 border-zinc-600 text-white" placeholder="Emergency contact phone *" type="tel" value={form.emergencyContactPhone} onChange={(e) => setField("emergencyContactPhone", e.target.value)} required />
            </div>
            <Textarea className="bg-zinc-800 border-zinc-600 text-white" placeholder="Allergies, medical notes, or other instructions" rows={3} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
            <label className="flex items-start gap-3 text-sm text-zinc-300">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-orange-400" checked={form.waiverAccepted} onChange={(e) => setField("waiverAccepted", e.target.checked)} />
              <span>I acknowledge the event waiver and confirm that costumes must be safe for physical activities. *</span>
            </label>
            <Button type="submit" disabled={submitRsvp.isPending} className="w-full h-14 text-lg font-black uppercase bg-orange-500 hover:bg-orange-400 text-black rounded-xl">
              {submitRsvp.isPending ? "Saving your spot…" : `Reserve & Pay $${(form.studentCount * 15).toFixed(2)}`}
            </Button>
            <p className="text-center text-zinc-500 text-xs">Your registration is saved before secure PayPal checkout. It is not confirmed as paid until PayPal verifies the transaction.</p>
          </form>
        </div>
        <div className="mt-8 text-center text-zinc-500 text-sm">Questions? <a href="mailto:support@mydojomartialarts.com" className="text-orange-300">support@mydojomartialarts.com</a></div>
      </div>
    </div>
  );
}
