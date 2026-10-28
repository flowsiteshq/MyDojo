import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type OutstandingCharge = { id: string; amount?: number; status?: string; description?: string };

interface Props {
  isDark: boolean;
  charges: OutstandingCharge[];
}

export function PartialBalancePaymentCard({ isDark, charges }: Props) {
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const maxCents = useMemo(() => Math.round(charges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0) * 100), [charges]);
  const amountCents = Math.round(Number(amount || 0) * 100);
  const createAttempt = trpc.member.createPartialBalancePayment.useMutation();
  const recordResult = trpc.member.recordPartialBalancePaymentResult.useMutation();

  const startPayment = () => {
    if (maxCents < 1000) return toast.error("No verified balance is currently available.");
    if (!Number.isFinite(amountCents) || amountCents < 1000) return toast.error("Enter at least $10.00.");
    if (amountCents > maxCents) return toast.error("The payment cannot exceed the verified balance.");
    const idempotencyKey = `member-balance-${Date.now()}-${crypto.randomUUID()}`;
    createAttempt.mutate({ amountCents, idempotencyKey }, {
      onSuccess: (result) => {
        if (!result.clientSecret || !result.paymentIntentId) {
          toast.error("This provider is not enabled for staging checkout yet.");
          return;
        }
        setAttemptId(result.attemptId);
        setPaymentIntentId(result.paymentIntentId);
        setClientSecret(result.clientSecret);
      },
      onError: (error) => toast.error(error.message || "Could not prepare the staging payment."),
    });
  };

  if (complete) {
    return <div className={`rounded-xl border p-4 ${isDark ? "border-emerald-400/30 bg-emerald-400/10" : "border-emerald-200 bg-emerald-50"}`}><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="text-sm font-bold text-emerald-800">Staging payment verified</p></div><p className="mt-1 text-xs text-emerald-700">The payment attempt was recorded for reconciliation. Your live account was not charged.</p></div>;
  }

  return (
    <div className={`rounded-xl border p-5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#E11D2A]/10 p-2"><CreditCard className="h-5 w-5 text-[#E11D2A]" /></div>
        <div className="min-w-0 flex-1"><h3 className={`font-black ${isDark ? "text-white" : "text-gray-900"}`}>Pay toward your balance</h3><p className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-gray-600"}`}>Choose any amount from $10.00 up to your verified outstanding balance of ${(maxCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}.</p></div>
      </div>
      <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-xs ${isDark ? "bg-amber-400/10 text-amber-200" : "bg-amber-50 text-amber-800"}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>Staging checkout only. No live card or subscription charge is made from this test flow.</span></div>
      {!clientSecret ? (
        <div className="mt-4 flex gap-2">
          <span className={`flex items-center rounded-lg border px-3 text-sm ${isDark ? "border-white/10 text-white/60" : "border-gray-200 text-gray-500"}`}>$</span>
          <input type="number" min="10" max={maxCents / 100} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="10.00" className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm ${isDark ? "border-white/10 bg-white/5 text-white" : "border-gray-200 bg-white text-gray-900"}`} aria-label="Partial payment amount" />
          <button type="button" disabled={createAttempt.isPending || maxCents < 1000} onClick={startPayment} className="rounded-lg bg-[#E11D2A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{createAttempt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}</button>
        </div>
      ) : (
        <div className="mt-4"><StripePaymentForm clientSecret={clientSecret} mode="payment" submitLabel={`Pay $${(amountCents / 100).toFixed(2)} (staging)`} loading={recordResult.isPending} onSuccess={({ paymentIntentId: confirmedId }) => { const id = confirmedId || paymentIntentId; if (!id || !attemptId) return toast.error("Payment confirmation could not be verified."); recordResult.mutate({ attemptId, paymentIntentId: id }, { onSuccess: (result) => { if (result.verified) setComplete(true); else toast.error("The provider did not confirm this payment."); }, onError: (error) => toast.error(error.message || "Could not verify the payment result.") }); }} onError={(message) => toast.error(message)} /></div>
      )}
      <p className={`mt-3 flex items-center justify-center gap-1 text-center text-[11px] ${isDark ? "text-white/50" : "text-gray-500"}`}><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />No card details are stored by MyDojo.</p>
    </div>
  );
}
