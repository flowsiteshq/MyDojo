import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";

const PROGRAMS = ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Open Training"];

export default function BuyDayPass() {
  const search = useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState("");
  const { data: config } = trpc.kiosk.getDayPassConfig.useQuery();
  const createCheckout = trpc.kiosk.createDayPassCheckout.useMutation({ onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl) });
  const success = new URLSearchParams(search).get("success") === "1";
  const cancelled = new URLSearchParams(search).get("cancelled") === "1";
  const price = useMemo(() => (config?.amountCents ?? 2000) / 100, [config]);
  const canCheckout = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && Boolean(program);

  if (success) return <main className="min-h-screen bg-[#101114] px-4 py-16 text-white"><section className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center text-slate-950"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="mt-5 text-3xl font-bold">Day pass confirmed.</h1><p className="mt-3 leading-6 text-slate-600">Your day pass has been paid. Please check in with the MyDojo team when you arrive.</p><a href="/" className="mt-7 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">Return to MyDojo</a></section></main>;

  return <main className="min-h-screen bg-[#101114] px-4 py-10 text-white"><section className="mx-auto max-w-md"><header className="text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">MyDojo guest training</p><h1 className="mt-3 text-4xl font-bold">Train today.</h1><p className="mt-3 text-white/65">Purchase a one-day pass and check in when you arrive.</p></header>{cancelled && <p className="mt-6 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-center text-sm text-amber-100">Your checkout was cancelled. No payment was made.</p>}<section className="mt-8 rounded-3xl bg-white p-6 text-slate-950 shadow-2xl"><div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">One-day pass</p><p className="mt-1 text-sm text-slate-600">Valid for today’s training</p></div><p className="text-3xl font-bold">${price.toFixed(2)}</p></div><div className="mt-6 space-y-4"><label className="block text-sm font-semibold">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" placeholder="Your name" /></label><label className="block text-sm font-semibold">Email<input value={email} type="email" onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" placeholder="you@example.com" /></label><label className="block text-sm font-semibold">Phone <span className="font-normal text-slate-400">(optional)</span><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal" placeholder="(555) 000-0000" /></label><label className="block text-sm font-semibold">Program<select value={program} onChange={(event) => setProgram(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal"><option value="">Select a program</option>{PROGRAMS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><button disabled={!canCheckout || createCheckout.isPending} onClick={() => createCheckout.mutate({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, program, programType: program, origin: window.location.origin })} className="mt-6 flex h-13 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">{createCheckout.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening secure checkout…</> : <><CreditCard className="mr-2 h-4 w-4" />Continue securely · ${price.toFixed(2)}</>}</button><p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Payment details are encrypted. MyDojo never stores full card numbers.</p></section></section></main>;
}
