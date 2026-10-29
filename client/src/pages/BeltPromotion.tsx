import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CalendarDays, CheckCircle2, ChevronRight, CreditCard, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BELTS = [
  "White Belt", "Yellow Belt", "Orange Belt", "Green Belt", "Advanced Green", "Blue Belt", "Advanced Blue",
  "Purple Belt", "Advanced Purple", "Brown Belt", "Advanced Brown", "Probationary Black",
  "Black Belt 1st Dan", "Black Belt 2nd Dan", "Black Belt 3rd Dan", "Black Belt 4th Dan", "Black Belt 5th Dan", "Black Belt 6th Dan",
];
const STRIPE_COLORS = ["none", "white", "yellow", "red", "black"] as const;
const PROGRAMS = ["Basic Membership", "Black Belt Program", "Leadership Program", "Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing"];
const EQUIPMENT_SIZES = ["Youth Small", "Youth Medium", "Youth Large", "Adult Small", "Adult Medium", "Adult Large", "Adult XL"];
const ACKNOWLEDGMENT = "I understand that submitting an Intent to Promote form indicates my student's desire to participate in the upcoming belt promotion. Promotion is subject to instructor approval, demonstration of required skills, and completion of all applicable testing requirements.";

type StripeColor = (typeof STRIPE_COLORS)[number];
type Plan = "Basic" | "Black Belt" | "Leadership" | "";
type Child = {
  studentName: string;
  currentBelt: string;
  currentStripeColor: StripeColor;
  currentStripeCount: number;
  currentProgram: string;
  upgradeTargetPlan: Plan;
  equipmentChoice: "add" | "already_have" | "later";
  equipmentSize: string;
  equipmentQuantity: number;
  uniformSize: string;
  notes: string;
};

const emptyChild = (): Child => ({
  studentName: "", currentBelt: "", currentStripeColor: "none", currentStripeCount: 0,
  currentProgram: "", upgradeTargetPlan: "", equipmentChoice: "later", equipmentSize: "",
  equipmentQuantity: 0, uniformSize: "", notes: "",
});

function nextOfficialBelt(current: string) {
  const index = BELTS.indexOf(current);
  return index >= 0 && index < BELTS.length - 1 ? BELTS[index + 1] : "";
}

function stripeUnits(color: StripeColor, count: number) {
  if (color === "none") return 0;
  return Math.min(16, (STRIPE_COLORS.indexOf(color) - 1) * 4 + count);
}

function childTotal(child: Child) {
  const promotion = child.currentBelt && BELTS.indexOf(child.currentBelt) >= BELTS.indexOf("Orange Belt") ? 49 : 0;
  return promotion + (child.equipmentChoice === "add" ? 179 * child.equipmentQuantity : 0);
}

export default function BeltPromotion() {
  const { data: config } = trpc.beltPromotion.getConfig.useQuery();
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [children, setChildren] = useState<Child[]>([emptyChild()]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [parentNotes, setParentNotes] = useState("");
  const [submittedIds, setSubmittedIds] = useState<number[]>([]);
  const [manualReview, setManualReview] = useState(false);

  const submit = trpc.beltTestIntent.submitMulti.useMutation({
    onSuccess: result => {
      setSubmittedIds(result.intentIds);
      if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
      else { setManualReview(true); toast.success("Intent submitted for staff review."); }
    },
    onError: error => toast.error(error.message),
  });

  const total = useMemo(() => children.reduce((sum, child) => sum + childTotal(child), 0), [children]);
  const deadlineText = config?.deadline ? new Date(config.deadline).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" }) : "No registration deadline";
  const ceremonyText = config?.ceremonyAt ? new Date(config.ceremonyAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" }) : "Saturday, October 31 at 11:00 AM Houston time";

  function updateChild(index: number, patch: Partial<Child>) {
    setChildren(current => current.map((child, i) => i === index ? { ...child, ...patch } : child));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!parentName.trim() || !phone.trim() || !email.trim()) return toast.error("Enter the parent contact information.");
    if (!acknowledged) return toast.error("Please accept the parent acknowledgment.");
    if (!signatureName.trim()) return toast.error("Please enter the electronic signature.");
    for (const child of children) {
      if (!child.studentName.trim() || !child.currentBelt) return toast.error("Complete each child's name and current belt.");
      if (!nextOfficialBelt(child.currentBelt)) return toast.error(`The current belt for ${child.studentName || "this student"} is not on the official promotion path.`);
      if (child.equipmentChoice === "add" && (!child.equipmentSize || child.equipmentQuantity < 1)) return toast.error(`Select the gear size and quantity for ${child.studentName}.`);
    }
    submit.mutate({
      parentName: parentName.trim(), phone: phone.trim(), email: email.trim(),
      parentCommitmentAgreed: true, parentComments: parentNotes || undefined,
      eventId: "oct-2026-belt-promotion",
      children: children.map(child => ({
        studentName: child.studentName.trim(), currentBelt: child.currentBelt,
        currentStripeColor: child.currentStripeColor, currentStripeCount: child.currentStripeCount,
        stripeProgressVerified: false, currentProgram: child.currentProgram || undefined,
        upgradeTargetPlan: child.upgradeTargetPlan || undefined,
        equipmentChoice: child.equipmentChoice, equipmentSize: child.equipmentSize || undefined,
        equipmentQuantity: child.equipmentChoice === "add" ? child.equipmentQuantity : 0,
        uniformSize: child.uniformSize || undefined, notes: child.notes || undefined,
      })),
    });
  }

  if (manualReview) {
    return <div className="min-h-screen bg-[#101014] text-white px-4 py-12"><div className="max-w-2xl mx-auto"><Card className="bg-white/5 border-white/10 text-white"><CardContent className="p-8 md:p-12 text-center"><CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-5" /><h1 className="text-3xl font-black uppercase">Intent Received</h1><p className="text-white/70 mt-4">Your promotion requests remain pending instructor review. Completing the form does not award a belt or change recurring billing.</p><p className="text-white/50 text-sm mt-5">References: {submittedIds.join(", ")}</p><Link href="/"><Button className="mt-8 bg-[#E10600] hover:bg-[#c50500]">Return to MyDojo</Button></Link></CardContent></Card></div></div>;
  }

  return <div className="min-h-screen bg-[#101014] text-white">
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(225,6,0,.28),transparent_35%),linear-gradient(135deg,#19191f,#0b0b0e)]"><div className="max-w-6xl mx-auto px-4 py-14 md:py-20"><div className="max-w-3xl"><Badge className="bg-red-500/15 text-red-200 border border-red-400/30 mb-5"><Award className="w-3.5 h-3.5 mr-1.5" /> October 31, 2026 · Tomball, Texas</Badge><h1 className="text-4xl md:text-6xl font-black uppercase leading-[.95] tracking-tight">Your child&apos;s next belt <span className="text-red-500">awaits.</span></h1><p className="text-white/70 text-lg md:text-xl mt-5 max-w-2xl">Submit one secure form for every child testing. Add the exact gear quantity each child needs, then pay the combined total through PayPal.</p><div className="grid sm:grid-cols-2 gap-3 mt-8 text-sm text-white/80"><div className="flex gap-2 items-center"><CalendarDays className="w-5 h-5 text-red-400" /> Ceremony: {ceremonyText}</div><div className="flex gap-2 items-center"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Deadline: {deadlineText}</div></div></div></div></section>
    <main className="max-w-6xl mx-auto px-4 py-10"><form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white text-slate-900 border-0 shadow-2xl"><CardHeader><CardTitle className="text-2xl uppercase">1. Parent and contact information</CardTitle><p className="text-slate-500 text-sm">One parent account can submit multiple children and one combined PayPal checkout.</p></CardHeader><CardContent className="grid sm:grid-cols-3 gap-4"><div><Label>Parent or guardian</Label><Input value={parentName} onChange={e => setParentName(e.target.value)} required /></div><div><Label>Email address</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></div><div><Label>Mobile phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required /></div></CardContent></Card>
      {children.map((child, index) => { const completed = stripeUnits(child.currentStripeColor, child.currentStripeCount); const next = nextOfficialBelt(child.currentBelt); return <Card key={index} className="bg-white text-slate-900 border-0 shadow-2xl"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-2xl uppercase">{index + 1}. Student {index + 1}</CardTitle><p className="text-slate-500 text-sm">Each child receives a separate eligibility and payment record.</p></div>{children.length > 1 && <Button type="button" variant="outline" onClick={() => setChildren(current => current.filter((_, i) => i !== index))}><Trash2 className="w-4 h-4 mr-2" /> Remove</Button>}</CardHeader><CardContent className="space-y-4"><div className="grid sm:grid-cols-2 gap-4"><div><Label>Student full name</Label><Input value={child.studentName} onChange={e => updateChild(index, { studentName: e.target.value })} required /></div><div><Label>Current membership program</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={child.currentProgram} onChange={e => updateChild(index, { currentProgram: e.target.value })}><option value="">Select program</option>{PROGRAMS.map(program => <option key={program} value={program}>{program}</option>)}</select></div></div><div className="grid sm:grid-cols-3 gap-4"><div><Label>Current belt rank</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={child.currentBelt} onChange={e => updateChild(index, { currentBelt: e.target.value })} required><option value="">Select current belt</option>{BELTS.map(belt => <option key={belt} value={belt}>{belt}</option>)}</select></div><div><Label>Current stripe color</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={child.currentStripeColor} onChange={e => { const color = e.target.value as StripeColor; updateChild(index, { currentStripeColor: color, currentStripeCount: color === "none" ? 0 : Math.max(1, child.currentStripeCount) }); }}><option value="none">No Stripes</option><option value="white">White</option><option value="yellow">Yellow</option><option value="red">Red</option><option value="black">Black</option></select></div><div><Label>Number of stripes</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={child.currentStripeCount} disabled={child.currentStripeColor === "none"} onChange={e => updateChild(index, { currentStripeCount: Number(e.target.value) })}>{[0, 1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}</select></div></div><div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"><div className="font-bold">{completed === 16 ? "BELT PROMOTION ELIGIBLE FOR REVIEW" : "STRIPE PROGRESSION INCOMPLETE"}</div><div className="text-slate-600 mt-1">Next belt after instructor evaluation: {next || "Staff review"} · {completed}/16 stripes recorded.</div></div><div className="rounded-lg border border-red-100 bg-red-50 p-4"><Label>Sparring gear sets for {child.studentName || "this student"}</Label><div className="grid sm:grid-cols-3 gap-2 mt-2">{([['add', 'Add gear'], ['already_have', 'Already have gear'], ['later', 'Purchase later']] as const).map(([value, label]) => <button type="button" key={value} onClick={() => updateChild(index, { equipmentChoice: value, equipmentQuantity: value === "add" ? Math.max(1, child.equipmentQuantity) : 0 })} className={`rounded-lg border p-3 text-left text-sm ${child.equipmentChoice === value ? "border-red-500 bg-red-100 text-red-800" : "border-slate-200 bg-white"}`}>{label}</button>)}</div>{child.equipmentChoice === "add" && <div className="grid sm:grid-cols-2 gap-4 mt-3"><div><Label>Gear size</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={child.equipmentSize} onChange={e => updateChild(index, { equipmentSize: e.target.value })}><option value="">Select size</option>{EQUIPMENT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}</select></div><div><Label>Number of gear sets</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={child.equipmentQuantity} onChange={e => updateChild(index, { equipmentQuantity: Number(e.target.value) })}>{[1, 2, 3].map(value => <option key={value} value={value}>{value} set{value > 1 ? "s" : ""} — ${(value * 179).toFixed(2)}</option>)}</select></div></div>}</div><div><Label>Notes for this student (optional)</Label><Textarea value={child.notes} onChange={e => updateChild(index, { notes: e.target.value })} /></div></CardContent></Card>; })}
      <Button type="button" variant="outline" className="w-full border-white/30 text-white hover:bg-white/10" disabled={children.length >= 10} onClick={() => setChildren(current => [...current, emptyChild()])}><Plus className="w-4 h-4 mr-2" /> Add another child</Button>
      <Card className="bg-white text-slate-900 border-0 shadow-2xl"><CardHeader><CardTitle className="text-2xl uppercase">3. Parent acknowledgment</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-600">{ACKNOWLEDGMENT}</p><div className="flex gap-3 items-start"><Checkbox checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} id="ack" /><Label htmlFor="ack" className="text-sm leading-5">I understand and acknowledge the promotion requirements.</Label></div><div><Label>Electronic signature</Label><Input value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Type your full name" required /></div><div><Label>Parent notes (optional)</Label><Textarea value={parentNotes} onChange={e => setParentNotes(e.target.value)} /></div></CardContent></Card>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4"><div><div className="text-sm text-white/60">Combined PayPal checkout</div><div className="text-3xl font-black">${total.toFixed(2)}</div><div className="text-xs text-white/50">{children.length} student{children.length > 1 ? "s" : ""} · gear quantities are itemized per student</div></div><Button type="submit" disabled={submit.isPending} className="w-full sm:w-auto h-14 px-8 text-lg font-black uppercase bg-red-600 hover:bg-red-700">{submit.isPending ? "Preparing checkout" : total > 0 ? <><CreditCard className="w-5 h-5 mr-2" /> Continue to PayPal</> : <><ChevronRight className="w-5 h-5 mr-2" /> Submit for staff review</>}</Button></div><p className="text-center text-xs text-white/45">Payment remains pending until PayPal confirms the transaction. A browser return alone never marks a payment complete.</p>
    </form></main>
  </div>;
}
