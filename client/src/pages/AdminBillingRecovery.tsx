import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Swords, AlertTriangle, MessageSquareLock } from "lucide-react";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AdminBillingRecovery() {
  const { data: cases, isLoading } = trpc.billingRecovery.listCases.useQuery();
  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 p-6">
            <div className="absolute -right-8 -top-10 opacity-10"><Swords className="h-48 w-48" /></div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-300">MyDojo Billing Recovery</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Guard the ledger before taking action.</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">This queue is review-only. It does not charge, refund, cancel, send SMS, or create PayPal checkouts. Every operational action requires a separate owner approval.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-800 bg-slate-900 text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-emerald-400" />Approval gate</CardTitle></CardHeader><CardContent className="text-sm text-slate-300">No processor mutation is wired to this release.</CardContent></Card>
            <Card className="border-slate-800 bg-slate-900 text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-400" />Review cases</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{isLoading ? "—" : cases?.length ?? 0}</CardContent></Card>
            <Card className="border-slate-800 bg-slate-900 text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquareLock className="h-4 w-4 text-sky-400" />SMS</CardTitle></CardHeader><CardContent className="text-sm text-slate-300">Draft preview only; opt-outs and quiet hours are enforced.</CardContent></Card>
          </div>
          <Card className="border-slate-800 bg-slate-900 text-white">
            <CardHeader><CardTitle>Reconciliation review queue</CardTitle><CardDescription className="text-slate-400">Source evidence is retained for audit. Reported refunds remain unverified until processor evidence is attached.</CardDescription></CardHeader>
            <CardContent>
              {!isLoading && (!cases || cases.length === 0) ? <p className="py-10 text-center text-slate-400">No imported cases yet. Run a read-only source import before making decisions.</p> : (
                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-700 text-xs uppercase text-slate-400"><tr><th className="p-3">Family</th><th className="p-3">Classification</th><th className="p-3">Settled</th><th className="p-3">Overage</th><th className="p-3">Review</th></tr></thead><tbody>{cases?.map((item) => <tr key={item.id} className="border-b border-slate-800"><td className="p-3 font-medium">{item.familyKey}</td><td className="p-3"><Badge variant="outline" className="border-slate-600 text-slate-200">{item.classification}</Badge></td><td className="p-3">{money(item.totalSettledCents)}</td><td className="p-3">{money(item.duplicateOverageCents)}</td><td className="p-3 text-slate-300">{item.reviewStatus}</td></tr>)}</tbody></table></div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
