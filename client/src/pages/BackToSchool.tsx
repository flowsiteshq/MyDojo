import { FormEvent, useMemo, useState } from "react";
import { Check, ChevronRight, CircleDollarSign, Clock3, Plus, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type PlanKey = "basic" | "black_belt";
type FamilyMember = { studentName: string; plan: PlanKey };

const PLANS: Record<PlanKey, { name: string; monthly: number; highlight: string; benefits: string[] }> = {
  basic: {
    name: "Basic Program",
    monthly: 149,
    highlight: "A strong martial arts foundation for confident, capable students.",
    benefits: ["Traditional Wado Ryu karate instruction", "Confidence, focus, and self-defense training", "Belt progress and structured curriculum"],
  },
  black_belt: {
    name: "Black Belt Program",
    monthly: 199,
    highlight: "An expanded path for students committed to long-term growth and leadership.",
    benefits: ["Everything in the Basic Program", "Advanced curriculum and black belt preparation", "Leadership-focused development and training opportunities"],
  },
};

export default function BackToSchool() {
  const [members, setMembers] = useState<FamilyMember[]>([{ studentName: "", plan: "basic" }]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const tuitionStart = useMemo(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), []);
  const tuitionStartLabel = tuitionStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const displayedRecurringTuition = (member: FamilyMember, index: number) => PLANS[member.plan].monthly * (index === 1 || index === 2 ? 0.5 : 1);

  const singleCheckout = trpc.member.createBackToSchoolCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => { window.location.assign(checkoutUrl); },
    onError: (error) => toast.error(error.message || "Unable to start secure checkout. Please try again."),
  });
  const familyCheckout = trpc.member.createBackToSchoolFamilyCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => { window.location.assign(checkoutUrl); },
    onError: (error) => toast.error(error.message || "Unable to start secure family checkout. Please try again."),
  });
  const checkoutPending = singleCheckout.isPending || familyCheckout.isPending;

  const updateMember = (index: number, patch: Partial<FamilyMember>) => {
    setMembers((current) => current.map((member, memberIndex) => memberIndex === index ? { ...member, ...patch } : member));
  };
  const addMember = () => {
    if (members.length < 3) setMembers((current) => [...current, { studentName: "", plan: "basic" }]);
  };
  const removeMember = (index: number) => {
    if (members.length > 1) setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanMembers = members.map((member) => ({ ...member, studentName: member.studentName.trim() }));
    if (cleanMembers.some((member) => !member.studentName)) {
      toast.error("Enter a name for every student you are enrolling.");
      return;
    }
    if (new Set(cleanMembers.map((member) => member.studentName.toLowerCase())).size !== cleanMembers.length) {
      toast.error("Each enrolled family member needs a different name.");
      return;
    }
    if (!termsAccepted) {
      toast.error("Please confirm that you understand the $1 promotion and the 14-day tuition start.");
      return;
    }
    const common = { customerName, customerEmail, customerPhone, termsAccepted: true as const };
    if (cleanMembers.length === 1) {
      singleCheckout.mutate({ ...common, plan: cleanMembers[0].plan, studentName: cleanMembers[0].studentName });
    } else {
      familyCheckout.mutate({ ...common, members: cleanMembers });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#151515]">
      <header className="bg-black px-6 py-5"><img src="/images/logo-full-white.webp" alt="MyDojo" className="h-9 w-auto" /></header>
      <main className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 bg-[#e10600] px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-white"><CircleDollarSign className="h-4 w-4" /> Back-to-School Special</div>
            <h1 className="font-heading text-4xl font-black uppercase leading-none md:text-6xl">Start your family for <span className="text-[#e10600]">$1</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-700">Enroll one, two, or three family members in a single secure checkout. Pay $1 today; the selected monthly tuition for each student begins exactly two weeks later.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {Object.values(PLANS).map((option) => (
                <div key={option.name} className="border border-neutral-200 bg-white p-5">
                  <h2 className="font-heading text-xl font-bold uppercase">{option.name}</h2>
                  <p className="mt-2 text-sm text-neutral-600">{option.highlight}</p>
                  <p className="mt-4 text-2xl font-black">${option.monthly}<span className="text-sm font-medium">/month</span></p>
                  <ul className="mt-4 space-y-2 text-sm">{option.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#e10600]" />{benefit}</li>)}</ul>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2"><p className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-[#e10600]" />One secure checkout saves a payment method for each selected recurring plan.</p><p className="flex gap-2"><Clock3 className="h-5 w-5 shrink-0 text-[#e10600]" />No $99 enrollment fee is charged with this special.</p><p className="flex gap-2 sm:col-span-2"><Check className="h-5 w-5 shrink-0 text-[#e10600]" />The second and third family members receive 50% off their monthly recurring tuition.</p></div>
          </div>
          <form onSubmit={submit} className="bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-heading text-2xl font-bold uppercase">Claim your family offer</h2>
            <p className="mt-2 text-sm text-neutral-600">Enroll up to three students. Choose a program for each student below.</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-bold">Parent or guardian name<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1.5 w-full border border-neutral-300 px-3 py-3 font-normal" /></label>
              <label className="block text-sm font-bold">Email<input required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className="mt-1.5 w-full border border-neutral-300 px-3 py-3 font-normal" /></label>
              <label className="block text-sm font-bold">Mobile phone<input required type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="mt-1.5 w-full border border-neutral-300 px-3 py-3 font-normal" /></label>
            </div>
            <div className="mt-6 space-y-4 border-t border-neutral-200 pt-5">
              {members.map((member, index) => (
                <div key={index} className="border border-neutral-200 p-4">
                  <div className="flex items-center justify-between gap-3"><p className="font-heading text-base font-bold uppercase">Student {index + 1}</p>{members.length > 1 && <button type="button" onClick={() => removeMember(index)} className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-[#e10600]"><X className="h-4 w-4" />Remove</button>}</div>
                  <label className="mt-3 block text-sm font-bold">Student name<input required value={member.studentName} onChange={(event) => updateMember(index, { studentName: event.target.value })} className="mt-1.5 w-full border border-neutral-300 px-3 py-2.5 font-normal" /></label>
                  <p className="mt-3 text-sm font-bold">Choose program</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(Object.entries(PLANS) as [PlanKey, typeof PLANS.basic][]).map(([key, option]) => <button key={key} type="button" onClick={() => updateMember(index, { plan: key })} className={`border px-3 py-2 text-left text-xs font-bold ${member.plan === key ? "border-[#e10600] bg-black text-white" : "border-neutral-300 bg-white text-black"}`}><span className="block">{option.name}</span><span className="font-normal">${option.monthly}/mo</span></button>)}
                  </div>
                </div>
              ))}
              {members.length < 3 && <button type="button" onClick={addMember} className="flex w-full items-center justify-center gap-2 border border-dashed border-neutral-400 px-4 py-3 text-sm font-bold text-neutral-700 hover:border-[#e10600] hover:text-[#e10600]"><Plus className="h-4 w-4" />Add another family member</button>}
            </div>
            <div className="mt-6 border-y border-neutral-200 py-4 text-sm"><div className="flex justify-between"><span>Due today for the whole family</span><strong>$1.00</strong></div>{members.map((member, index) => <div key={`${member.studentName}-${index}`} className="mt-2 flex justify-between gap-3"><span>Student {index + 1}: {PLANS[member.plan].name}{index > 0 ? " — family rate" : ""} begins {tuitionStartLabel}</span><strong>${displayedRecurringTuition(member, index).toFixed(2)}</strong></div>)}<p className="mt-3 text-neutral-600">Each selected tuition amount will be charged automatically in 14 days, then monthly thereafter.</p></div>
            <label className="mt-5 flex cursor-pointer gap-3 text-sm leading-relaxed"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#e10600]" />I understand that I pay $1 today and that the tuition shown for each enrolled student will be charged automatically in 14 days, then monthly thereafter.</label>
            <button disabled={checkoutPending} className="mt-6 flex w-full items-center justify-center gap-2 bg-[#e10600] px-5 py-4 font-heading font-bold uppercase tracking-wide text-white disabled:opacity-60">{checkoutPending ? "Opening secure checkout…" : "Enroll family for $1"}<ChevronRight className="h-5 w-5" /></button>
          </form>
        </section>
      </main>
    </div>
  );
}
