import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CalendarDays, CheckCircle2, ChevronRight, CreditCard, ShieldCheck, Sparkles, Trophy, Shirt, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BELTS = [
  "White Belt", "Yellow Belt", "Orange Belt", "Green Belt", "Advanced Green", "Blue Belt", "Advanced Blue",
  "Purple Belt", "Advanced Purple", "Brown Belt", "Advanced Brown", "Probationary Black",
  "Black Belt 1st Dan", "Black Belt 2nd Dan", "Black Belt 3rd Dan", "Black Belt 4th Dan", "Black Belt 5th Dan", "Black Belt 6th Dan",
];
const STRIPE_COLORS = ["none", "white", "yellow", "red", "black"] as const;
const STRIPE_COUNTS = [0, 1, 2, 3, 4] as const;
const PROGRAMS = ["Basic Membership", "Black Belt Program", "Leadership Program", "Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing"];
const EQUIPMENT_SIZES = ["Youth Small", "Youth Medium", "Youth Large", "Adult Small", "Adult Medium", "Adult Large", "Adult XL"];
const ACKNOWLEDGMENT = "I understand that submitting an Intent to Promote form indicates my student's desire to participate in the upcoming belt promotion. Promotion is subject to instructor approval, demonstration of required skills, and completion of all applicable testing requirements.";
const colorLabels: Record<(typeof STRIPE_COLORS)[number], string> = { none: "No Stripes", white: "White", yellow: "Yellow", red: "Red", black: "Black" };
const colorDots: Record<(typeof STRIPE_COLORS)[number], string> = { none: "bg-slate-200", white: "bg-slate-100 border border-slate-300", yellow: "bg-yellow-400", red: "bg-red-500", black: "bg-slate-900" };

function nextOfficialBelt(current: string) {
  const index = BELTS.indexOf(current);
  return index >= 0 && index < BELTS.length - 1 ? BELTS[index + 1] : "";
}

function stripeUnits(color: (typeof STRIPE_COLORS)[number], count: number) {
  if (color === "none") return 0;
  return Math.min(16, (STRIPE_COLORS.indexOf(color) - 1) * 4 + count);
}

export default function BeltPromotion() {
  const { data: config } = trpc.beltPromotion.getConfig.useQuery();
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentBelt, setCurrentBelt] = useState("");
  const [currentStripeColor, setCurrentStripeColor] = useState<(typeof STRIPE_COLORS)[number]>("none");
  const [currentStripeCount, setCurrentStripeCount] = useState(0);
  const [stripeProgressVerified, setStripeProgressVerified] = useState(false);
  const [currentProgram, setCurrentProgram] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<"Basic" | "Black Belt" | "Leadership" | "">("");
  const [equipmentChoice, setEquipmentChoice] = useState<"add" | "already_have" | "later">("later");
  const [equipmentSize, setEquipmentSize] = useState("");
  const [uniformSize, setUniformSize] = useState("");
  const [notes, setNotes] = useState("");
  const [lookupEnabled, setLookupEnabled] = useState(false);
  const [submittedIntentId, setSubmittedIntentId] = useState<number | null>(null);
  const [manualReview, setManualReview] = useState(false);

  const lookup = trpc.beltPromotion.lookupExistingStudent.useQuery(
    { email, phone },
    { enabled: lookupEnabled && email.includes("@") && phone.replace(/\D/g, "").length >= 7 }
  );
  const submit = trpc.beltPromotion.submit.useMutation({
    onSuccess: (result) => {
      setSubmittedIntentId(result.intentId);
      if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
      else { setManualReview(true); toast.success("Intent submitted for staff review."); }
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!lookup.data) return;
    setStudentName(current => current || lookup.data?.studentName || "");
    setParentName(current => current || lookup.data?.parentName || "");
    setCurrentBelt(current => current || lookup.data?.currentBelt || "");
    setCurrentProgram(current => current || lookup.data?.currentProgram || "");
    if (lookup.data.currentStripeColor) setCurrentStripeColor(lookup.data.currentStripeColor as (typeof STRIPE_COLORS)[number]);
    if (typeof lookup.data.currentStripeCount === "number") setCurrentStripeCount(lookup.data.currentStripeCount);
    setStripeProgressVerified(Boolean(lookup.data.stripeProgressVerified));
  }, [lookup.data]);

  const deadlineText = config?.deadline ? new Date(config.deadline).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" }) : "Wednesday, October 28 at 11:59 PM Houston time";
  const ceremonyText = config?.ceremonyAt ? new Date(config.ceremonyAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" }) : "Saturday, October 31 at 11:00 AM Houston time";
  const promotionFee = currentBelt && BELTS.indexOf(currentBelt) >= BELTS.indexOf("Orange Belt") ? 49 : 0;
  const equipmentFee = equipmentChoice === "add" ? 179 : 0;
  const total = promotionFee + equipmentFee;
  const next = useMemo(() => nextOfficialBelt(currentBelt), [currentBelt]);
  const completedStripes = stripeUnits(currentStripeColor, currentStripeCount);
  const eligible = completedStripes === 16;
  const stripeStatus = eligible ? "BELT PROMOTION ELIGIBLE FOR REVIEW" : "STRIPE PROGRESSION INCOMPLETE";

  function handleStripeColorChange(value: (typeof STRIPE_COLORS)[number]) {
    setCurrentStripeColor(value);
    if (value === "none") setCurrentStripeCount(0);
    else if (currentStripeCount === 0) setCurrentStripeCount(1);
    setStripeProgressVerified(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!next) return toast.error("Select an official current belt so we can determine the next belt.");
    if (!acknowledged) return toast.error("Please accept the parent acknowledgment.");
    if (!signatureName.trim()) return toast.error("Please enter the electronic signature.");
    if (equipmentChoice === "add" && !equipmentSize) return toast.error("Please select an equipment size.");
    submit.mutate({
      studentName, parentName, phone, email, currentBelt, currentStripeColor, currentStripeCount, stripeProgressVerified,
      nextBelt: next, currentProgram, instructorRecommendationStatus: "pending", signatureName, signedAt: new Date().toISOString(),
      parentAcknowledgment: true, upgradeTargetPlan: upgradeTargetPlan || undefined, equipmentChoice, equipmentSize: equipmentSize || undefined,
      uniformSize: uniformSize || undefined, notes: notes || undefined,
    });
  }

  if (manualReview) {
    return <div className="min-h-screen bg-[#101014] text-white px-4 py-12"><div className="max-w-2xl mx-auto"><Card className="bg-white/5 border-white/10 text-white"><CardContent className="p-8 md:p-12 text-center"><CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-5" /><h1 className="text-3xl font-black uppercase">Intent Received</h1><p className="text-white/70 mt-4">Your stripe progress and promotion request remain pending instructor review. Completing the form does not award a belt or change recurring billing.</p><p className="text-white/50 text-sm mt-5">Reference #{submittedIntentId}</p><Link href="/"><Button className="mt-8 bg-[#E10600] hover:bg-[#c50500]">Return to MyDojo</Button></Link></CardContent></Card></div></div>;
  }

  return <div className="min-h-screen bg-[#101014] text-white">
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(225,6,0,.28),transparent_35%),linear-gradient(135deg,#19191f,#0b0b0e)]"><div className="max-w-6xl mx-auto px-4 py-14 md:py-20"><div className="max-w-3xl"><Badge className="bg-red-500/15 text-red-200 border border-red-400/30 mb-5"><Award className="w-3.5 h-3.5 mr-1.5" /> October 31, 2026 · Tomball, Texas</Badge><h1 className="text-4xl md:text-6xl font-black uppercase leading-[.95] tracking-tight">Your child&apos;s next belt <span className="text-red-500">awaits.</span></h1><p className="text-white/70 text-lg md:text-xl mt-5 max-w-2xl">Complete the Intent to Promote form, report your student&apos;s official belt and stripe progress, and reserve a place in the October Belt Promotion Ceremony.</p><div className="grid sm:grid-cols-2 gap-3 mt-8 text-sm text-white/80"><div className="flex gap-2 items-center"><CalendarDays className="w-5 h-5 text-red-400" /> Ceremony: {ceremonyText}</div><div className="flex gap-2 items-center"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Deadline: {deadlineText}</div></div></div></div></section>
    <main className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[1.05fr_.95fr] gap-8"><form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white text-slate-900 border-0 shadow-2xl"><CardHeader><CardTitle className="text-2xl uppercase">1. Student information</CardTitle><p className="text-slate-500 text-sm">Existing members can prefill this form with their email and phone. Stripe data is shown as verified only when it comes from the student record.</p></CardHeader><CardContent className="space-y-4"><div className="grid sm:grid-cols-[1fr_auto] gap-3"><div><Label>Email address</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="parent@example.com" required /></div><Button type="button" variant="outline" className="sm:mt-6" onClick={() => setLookupEnabled(true)} disabled={lookup.isFetching}><Search className="w-4 h-4 mr-2" /> {lookup.isFetching ? "Looking up" : "Prefill"}</Button></div><div className="grid sm:grid-cols-2 gap-4"><div><Label>Student full name</Label><Input value={studentName} onChange={e => setStudentName(e.target.value)} required /></div><div><Label>Parent or guardian</Label><Input value={parentName} onChange={e => setParentName(e.target.value)} required /></div></div><div className="grid sm:grid-cols-2 gap-4"><div><Label>Mobile phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required /></div><div><Label>Current membership program</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={currentProgram} onChange={e => setCurrentProgram(e.target.value)}><option value="">Select program</option>{PROGRAMS.map(program => <option key={program} value={program}>{program}</option>)}</select></div></div>
        <div className="grid sm:grid-cols-3 gap-4"><div><Label>Current belt rank</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={currentBelt} onChange={e => setCurrentBelt(e.target.value)} required><option value="">Select current belt</option>{BELTS.map(belt => <option key={belt} value={belt}>{belt}</option>)}</select></div><div><Label>Current stripe color</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={currentStripeColor} onChange={e => handleStripeColorChange(e.target.value as (typeof STRIPE_COLORS)[number])}>{STRIPE_COLORS.map(color => <option key={color} value={color}>{colorLabels[color]}</option>)}</select></div><div><Label>Number of stripes</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={currentStripeCount} onChange={e => { setCurrentStripeCount(Number(e.target.value)); setStripeProgressVerified(false); }} disabled={currentStripeColor === "none"}>{STRIPE_COUNTS.map(count => <option key={count} value={count}>{count}</option>)}</select></div></div>
        <div className={`rounded-lg border p-4 ${eligible ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><div className={`font-black text-sm ${eligible ? "text-emerald-800" : "text-amber-800"}`}>{stripeStatus}</div><p className={`text-xs mt-1 ${eligible ? "text-emerald-700" : "text-amber-700"}`}>{eligible ? "Congratulations! Your student has completed the required stripe progression and is ready for instructor evaluation." : "Your student is progressing toward their next belt. Please consult your instructor regarding promotion eligibility."}</p><div className="flex items-center gap-1.5 mt-3" aria-label={`${completedStripes} of 16 stripes completed`}>{Array.from({ length: 16 }, (_, index) => <span key={index} className={`w-3.5 h-3.5 rounded-full ${index < completedStripes ? colorDots[currentStripeColor] : "bg-slate-200 border border-slate-300"}`} />)}</div><div className="text-xs text-slate-600 mt-2">{completedStripes}/16 stripes completed · {stripeProgressVerified ? "prefilled from student record" : "parent-reported and unverified"}</div></div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600"><strong>Next belt after instructor evaluation:</strong> {next || "Staff review"}. Stripes are progress markers, not separate belt ranks. Completing this form never awards a belt automatically.</div>
      </CardContent></Card>
      <Card className="bg-white text-slate-900 border-0 shadow-2xl"><CardHeader><CardTitle className="text-2xl uppercase">2. Parent acknowledgment</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">{ACKNOWLEDGMENT}</p><div className="flex gap-3 items-start"><Checkbox checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} id="ack" /><Label htmlFor="ack" className="text-sm leading-5">I understand and acknowledge the promotion requirements.</Label></div><div><Label>Electronic signature</Label><Input value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Type your full name" required /></div><div><Label>Notes for the instructor (optional)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything the instructor should know?" /></div></CardContent></Card>
      <Card className="bg-white text-slate-900 border-0 shadow-2xl"><CardHeader><CardTitle className="text-2xl uppercase">3. Optional next steps</CardTitle><p className="text-slate-500 text-sm">Upgrade interest is recorded for staff review only. No recurring membership is changed or charged here.</p></CardHeader><CardContent className="space-y-5"><div><Label>Black Belt Program interest</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1" value={upgradeTargetPlan} onChange={e => setUpgradeTargetPlan(e.target.value as typeof upgradeTargetPlan)}><option value="">Not right now — continue with belt promotion</option><option value="Basic">Basic Membership — $149/month</option><option value="Black Belt">Black Belt Program — $199/month</option><option value="Leadership">Leadership Program — $249/month</option></select><p className="text-xs text-slate-500 mt-2">An approved request will show the actual monthly difference from the student&apos;s current enrollment before any authorization is requested.</p></div><div><Label>Sparring gear special</Label><div className="grid sm:grid-cols-3 gap-2 mt-2">{([["add", "Add gear — $179"], ["already_have", "I have approved gear"], ["later", "I’ll purchase later"]] as const).map(([value, label]) => <button type="button" key={value} onClick={() => setEquipmentChoice(value)} className={`rounded-lg border p-3 text-left text-sm transition ${equipmentChoice === value ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 hover:border-slate-400"}`}>{label}</button>)}</div></div>{equipmentChoice === "add" && <div><Label>Equipment size</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1" value={equipmentSize} onChange={e => setEquipmentSize(e.target.value)}><option value="">Select size</option>{EQUIPMENT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}</select></div>}<div><Label>Uniform size for presentation planning (optional)</Label><Input value={uniformSize} onChange={e => setUniformSize(e.target.value)} placeholder="e.g. Youth Medium" /></div></CardContent></Card>
      <Button type="submit" disabled={submit.isPending || !currentBelt} className="w-full h-14 text-lg font-black uppercase bg-red-600 hover:bg-red-700">{submit.isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving intent</> : total > 0 ? <><CreditCard className="w-5 h-5 mr-2" /> Continue to secure checkout — ${total}</> : <><ChevronRight className="w-5 h-5 mr-2" /> Submit for staff review</>}</Button><p className="text-center text-xs text-white/45">Payment status remains PENDING until the provider confirms the transaction. A browser return alone never marks a payment complete.</p>
    </form>
    <aside className="space-y-5 lg:sticky lg:top-6 self-start"><Card className="bg-gradient-to-br from-red-600 to-rose-800 border-0 text-white shadow-2xl"><CardContent className="p-7"><Sparkles className="w-8 h-8 mb-4 text-amber-200" /><h2 className="text-2xl font-black uppercase">October Belt Promotion</h2><p className="text-white/75 text-sm mt-2">A meaningful milestone in your martial arts journey.</p><ul className="mt-5 space-y-3 text-sm">{["Official new belt only after instructor approval", "Official belt rank certificate", "Updated martial arts curriculum", "Documented stripe progression", "Recognition at the October 31 ceremony"].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 text-amber-200" /> {item}</li>)}</ul><div className="border-t border-white/20 mt-6 pt-5 flex justify-between font-black"><span>Current package</span><span>${total}</span></div><p className="text-xs text-white/70 mt-2">$49 promotion fee applies to Orange Belt and above when applicable; eligibility and approval remain separate.</p></CardContent></Card><Card className="bg-white/5 border-white/10 text-white"><CardContent className="p-6"><div className="flex gap-3"><Trophy className="w-6 h-6 text-amber-300" /><div><h3 className="font-black uppercase">Instructor review</h3><p className="text-white/60 text-sm mt-1">Four black stripes means ready for belt evaluation—not an automatic promotion. Staff may document an authorized exception.</p></div></div><div className="flex gap-3 mt-5"><Shirt className="w-6 h-6 text-pink-300" /><div><h3 className="font-black uppercase">Uniform presentation</h3><p className="text-white/60 text-sm mt-1">Presentation depends on payment verification, eligibility, sizing, and available inventory.</p></div></div></CardContent></Card></aside>
    </main>
  </div>;
}
