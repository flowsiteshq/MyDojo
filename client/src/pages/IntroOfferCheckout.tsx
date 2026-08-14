import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";

type PackageId = "starter" | "explorer";

const PACKAGES: Record<PackageId, { label: string; price: number; classes: number; note: string; featured?: boolean }> = {
  starter: { label: "Starter Pack", price: 29, classes: 3, note: "A simple way to try any MyDojo program." },
  explorer: { label: "Explorer Pack", price: 49, classes: 5, note: "More training time and the best value for new members.", featured: true },
};

function queryValue(search: string, key: string) {
  return new URLSearchParams(search).get(key);
}

export default function IntroOfferCheckout() {
  const search = useSearch();
  const preset = queryValue(search, "package");
  const [packageId, setPackageId] = useState<PackageId>(preset === "explorer" ? "explorer" : "starter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const selected = PACKAGES[packageId];
  const success = queryValue(search, "success") === "1";
  const cancelled = queryValue(search, "cancelled") === "1";

  const createCheckout = trpc.kiosk.createIntroOfferCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
  });

  const canContinue = useMemo(() => name.trim().length > 1 && /\S+@\S+\.\S+/.test(email), [name, email]);

  if (success) {
    return (
      <main className="min-h-screen bg-[#f7f7f8] px-4 py-16">
        <section className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="h-9 w-9 text-emerald-600" /></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">MyDojo</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">You’re all set.</h1>
          <p className="mt-3 leading-6 text-slate-600">Your intro offer is confirmed. We will send your class details and next steps to the email address you provided.</p>
          <a className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-white" href="/">Return to MyDojo</a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101114] px-4 py-10 text-white sm:py-16">
      <section className="mx-auto max-w-3xl">
        <header className="text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">MyDojo introductory training</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Start training with confidence.</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-white/65">Choose your introductory package, then continue to a secure checkout. There is no recurring commitment.</p></header>
        {cancelled && <p className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-100">Your checkout was cancelled. No payment was made.</p>}
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {(Object.keys(PACKAGES) as PackageId[]).map((id) => {
            const pkg = PACKAGES[id];
            const active = packageId === id;
            return <button key={id} type="button" onClick={() => setPackageId(id)} className={`relative rounded-3xl border p-6 text-left transition ${active ? "border-red-500 bg-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,.35)]" : "border-white/10 bg-white/[.04] hover:border-white/30"}`}>
              {pkg.featured && <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Best value</span>}
              <Sparkles className={`h-6 w-6 ${active ? "text-red-300" : "text-white/50"}`} /><h2 className="mt-5 text-2xl font-bold">{pkg.label}</h2><p className="mt-1 text-sm text-white/60">{pkg.note}</p><p className="mt-6 text-4xl font-bold">${pkg.price}<span className="ml-2 text-sm font-medium text-white/60">for {pkg.classes} classes</span></p><ul className="mt-6 space-y-2 text-sm text-white/75"><li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Attend any MyDojo program</li><li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Valid for 30 days</li><li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" />No recurring commitment</li></ul>
            </button>;
          })}
        </div>
        <section className="mt-6 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-black/25 sm:p-8"><h2 className="text-xl font-bold">Your details</h2><p className="mt-1 text-sm text-slate-600">We’ll use these details for your class confirmation and receipt.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none ring-primary focus:ring-2" placeholder="Your name" /></label><label className="text-sm font-semibold">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none ring-primary focus:ring-2" placeholder="you@example.com" /></label><label className="text-sm font-semibold sm:col-span-2">Phone <span className="font-normal text-slate-400">(optional)</span><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none ring-primary focus:ring-2" placeholder="(555) 000-0000" /></label></div><button disabled={!canContinue || createCheckout.isPending} onClick={() => createCheckout.mutate({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, packageId, origin: window.location.origin })} className="mt-6 flex h-13 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">{createCheckout.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening secure checkout…</> : <>Continue securely · ${selected.price}<ArrowRight className="ml-2 h-4 w-4" /></>}</button><p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Your payment details are encrypted. MyDojo never stores full card numbers.</p></section>
      </section>
    </main>
  );
}
