import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, CheckCircle2, Clock3, Download, ExternalLink, ShieldCheck, Trophy, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const statusClass: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  manual_review: "bg-purple-100 text-purple-700 border-purple-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};
const stripeColors = ["none", "white", "yellow", "red", "black"] as const;
const stripeLabels: Record<string, string> = { none: "No stripes", white: "White", yellow: "Yellow", red: "Red", black: "Black" };
function stripeProgress(color: string, count: number) {
  const phase = stripeColors.indexOf(color as (typeof stripeColors)[number]);
  return color === "none" || phase < 1 ? 0 : Math.min(16, (phase - 1) * 4 + count);
}

export default function AdminBeltPromotions() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.beltPromotion.adminDashboard.useQuery(undefined, { refetchInterval: 15_000 });
  const updateRoster = trpc.beltPromotion.updateRoster.useMutation({ onSuccess: () => utils.beltPromotion.adminDashboard.invalidate(), onError: error => toast.error(error.message) });
  const verifyPayment = trpc.beltPromotion.manuallyVerifyPayment.useMutation({ onSuccess: () => { toast.success("Payment marked verified."); utils.beltPromotion.adminDashboard.invalidate(); }, onError: error => toast.error(error.message) });
  const setDeadline = trpc.beltPromotion.setDeadline.useMutation({ onSuccess: () => { toast.success("Deadline updated."); utils.beltPromotion.adminDashboard.invalidate(); }, onError: error => toast.error(error.message) });
  const [deadline, setDeadlineValue] = useState("");

  function exportCsv() {
    if (!data?.rows.length) return;
    const headers = ["Student", "Parent", "Current Belt", "Stripe Color", "Stripe Count", "Next Belt", "Eligibility", "Intent", "Payment", "Upgrade", "Sparring", "Instructor Approval", "Ceremony"];
    const body = data.rows.map(row => [row.studentName, row.parentName, row.currentBelt, row.currentStripeColor, row.currentStripeCount, row.nextBelt || "", row.promotionEligibility, row.id, row.paymentStatus, row.upgradeStatus, row.equipmentChoice, row.instructorApproved ? "Approved" : "Pending", row.ceremonyStatus]);
    const csv = [headers, ...body].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "october-belt-promotion-roster.csv"; link.click(); URL.revokeObjectURL(url);
  }

  function manualVerify(row: NonNullable<typeof data>["rows"][number]) {
    const provider = window.prompt("Provider (paypal, stripe, fluidpay, cash, other):", "paypal");
    if (!provider || !["paypal", "stripe", "fluidpay", "cash", "other"].includes(provider)) return;
    const reference = window.prompt("Verified transaction/reference ID:");
    if (!reference) return;
    verifyPayment.mutate({ intentId: row.id, amountCents: row.paymentAmountCents, provider: provider as "paypal" | "stripe" | "fluidpay" | "cash" | "other", reference });
  }
  function grantException(row: NonNullable<typeof data>["rows"][number]) {
    const note = window.prompt("Document the authorized instructor/admin exception:");
    if (!note?.trim()) return;
    updateRoster.mutate({ intentId: row.id, eligibilityException: true, exceptionNote: note.trim() });
  }

  return <AdminLayout><div className="space-y-6"><div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4"><div><div className="flex items-center gap-2 text-red-600 text-sm font-bold uppercase tracking-widest"><Trophy className="w-4 h-4" /> Operations</div><h1 className="text-3xl font-black text-gray-900 mt-1">Belt Promotions</h1><p className="text-gray-500 mt-1">October 31, 2026 ceremony · payment verification and promotion roster</p></div><div className="flex gap-2"><Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2" /> Export roster</Button><a href="/belt-promotion" target="_blank" rel="noreferrer"><Button><ExternalLink className="w-4 h-4 mr-2" /> Open registration</Button></a></div></div>

    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3"><Metric label="Eligible / submitted" value={data?.totalEligible ?? 0} icon={Users} /><Metric label="Intent forms" value={data?.intentsSubmitted ?? 0} icon={CheckCircle2} /><Metric label="Fees outstanding" value={money(data?.testingFeesOutstanding ?? 0)} icon={Clock3} /><Metric label="Revenue collected" value={money(data?.totalRevenueCollected ?? 0)} icon={WalletCards} /><Metric label="Ready for ceremony" value={data?.readyForCeremony ?? 0} icon={ShieldCheck} /></div>

    <Card><CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><CardTitle>Event controls</CardTitle><p className="text-sm text-gray-500 mt-1">Houston time · current deadline: {data?.deadline ? new Date(data.deadline).toLocaleString("en-US", { timeZone: "America/Chicago" }) : "loading"}</p></div><div className="flex gap-2"><Input type="datetime-local" value={deadline} onChange={e => setDeadlineValue(e.target.value)} className="w-auto" /><Button variant="outline" disabled={!deadline || setDeadline.isPending} onClick={() => setDeadline.mutate({ deadline: new Date(deadline).toISOString() })}>Extend deadline</Button></div></CardHeader><CardContent><div className="grid sm:grid-cols-3 gap-3 text-sm"><div className="rounded-lg bg-gray-50 p-3"><strong>Testing fee</strong><br />$49 for orange belt and above; lower ranks go to staff review.</div><div className="rounded-lg bg-gray-50 p-3"><strong>Sparring gear</strong><br />$179 special; no implied Saturday delivery.</div><div className="rounded-lg bg-gray-50 p-3"><strong>Upgrade safety</strong><br />Recurring plans are never changed from this dashboard action.</div></div></CardContent></Card>

    <Card><CardHeader><CardTitle>Student promotion roster</CardTitle><p className="text-sm text-gray-500">Verify provider transactions before changing payment status. Browser redirects do not count as payment confirmation.</p></CardHeader><CardContent className="p-0">{isLoading ? <div className="p-8 text-center text-gray-500">Loading roster…</div> : !data?.rows.length ? <div className="p-8 text-center text-gray-500">No October promotion intents yet. Share <a className="text-red-600 underline" href="/belt-promotion">/belt-promotion</a>.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><Th>Student</Th><Th>Current belt</Th><Th>Stripes</Th><Th>Next belt</Th><Th>Eligibility</Th><Th>Payment</Th><Th>Upgrade</Th><Th>Gear</Th><Th>Approval</Th><Th>Ceremony</Th><Th>Actions</Th></tr></thead><tbody>{data.rows.map(row => { const stripeTotal = stripeProgress(row.currentStripeColor, row.currentStripeCount); return <tr key={row.id} className="border-b last:border-0 align-top"><td className="px-4 py-4"><div className="font-bold">{row.studentName}</div><div className="text-xs text-gray-500">{row.parentName} · #{row.id}</div><div className="text-xs text-gray-500">{row.email}</div></td><td className="px-4 py-4"><div className="font-semibold">{row.currentBelt}</div></td><td className="px-4 py-4"><div className="font-semibold">{stripeLabels[row.currentStripeColor] || row.currentStripeColor} {row.currentStripeCount}/4</div><div className="flex flex-wrap gap-1 mt-1 max-w-[110px]">{Array.from({ length: 16 }, (_, i) => <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < stripeTotal ? "bg-red-600" : "bg-gray-200 border border-gray-300"}`} />)}</div><div className="text-[10px] text-gray-500 mt-1">{stripeTotal}/16</div></td><td className="px-4 py-4"><div className="text-red-600">{row.nextBelt || "Staff review"}</div></td><td className="px-4 py-4"><Badge className={row.eligibilityException ? "bg-purple-100 text-purple-700" : row.promotionEligibility === "ready_for_evaluation" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{row.eligibilityException ? "Exception" : row.promotionEligibility === "ready_for_evaluation" ? "Ready for review" : "Incomplete"}</Badge>{row.eligibilityExceptionNote && <div className="text-[10px] text-gray-500 mt-1 max-w-[150px]">{row.eligibilityExceptionNote}</div>}</td><td className="px-4 py-4"><Badge className={statusClass[row.paymentStatus] || ""}>{row.paymentStatus}</Badge><div className="text-xs text-gray-500 mt-1">Expected {money(row.paymentAmountCents)}</div>{row.paymentReference && <div className="text-[10px] text-gray-400 break-all">{row.paymentProvider}: {row.paymentReference}</div>}</td><td className="px-4 py-4"><div className="capitalize">{row.upgradeStatus.replaceAll("_", " ")}</div>{row.upgradeDifferenceCents !== null && row.upgradeDifferenceCents !== undefined && <div className="text-xs text-gray-500">Difference {money(row.upgradeDifferenceCents)}</div>}</td><td className="px-4 py-4"><div className="capitalize">{row.equipmentChoice.replaceAll("_", " ")}</div><div className="text-xs text-gray-500">{row.equipmentSize || "—"}</div></td><td className="px-4 py-4">{row.instructorApproved ? <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge> : <Badge className="bg-amber-100 text-amber-700">Pending</Badge>}</td><td className="px-4 py-4"><Badge className="bg-gray-100 text-gray-700">{row.ceremonyStatus.replaceAll("_", " ")}</Badge></td><td className="px-4 py-4"><div className="flex flex-wrap gap-2 min-w-[190px]">{row.paymentStatus !== "paid" && row.paymentAmountCents > 0 && <Button size="sm" variant="outline" onClick={() => manualVerify(row)}>Verify payment</Button>}{!row.eligibilityException && row.promotionEligibility !== "ready_for_evaluation" && <Button size="sm" variant="outline" onClick={() => grantException(row)}>Grant exception</Button>}<Button size="sm" variant="outline" disabled={updateRoster.isPending} onClick={() => updateRoster.mutate({ intentId: row.id, instructorApproved: !Boolean(row.instructorApproved) })}>{row.instructorApproved ? "Unapprove" : "Approve"}</Button>{row.paymentStatus === "paid" && !row.instructorApproved && <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => updateRoster.mutate({ intentId: row.id, ceremonyStatus: "ready" })}>Mark ready</Button>}</div></td></tr>; })}</tbody></table></div>}</CardContent></Card></div></AdminLayout>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) { return <Card><CardContent className="p-4"><Icon className="w-5 h-5 text-red-600 mb-2" /><div className="text-2xl font-black text-gray-900">{value}</div><div className="text-xs text-gray-500">{label}</div></CardContent></Card>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-bold">{children}</th>; }
