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
  const [paymentOption, setPaymentOption] = useState<"full" | "pastDue" | "custom">("full");
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const maxCents = useMemo(() => Math.round(charges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0) * 100), [charges]);
  const pastDueCents = useMemo(
    () => Math.round(charges
      .filter((charge) => ["open", "overdue", "past_due", "partial", "partially_paid"].includes(String(charge.status).toLowerCase()))
      .reduce((sum, charge) => sum + Number(charge.amount || 0), 0) * 100),
    [charges],
  );
  const selectedCents = paymentOption === "full" ? maxCents : paymentOption === "pastDue" ? pastDueCents : Math.round(Number(amount || 0) * 100);
  const createAttempt = trpc.member.createPartialBalancePayment.useMutation();
  const recordResult = trpc.member.recordPartialBalancePaymentResult.useMutation();

  const startPayment = () => {
    if (maxCents < 100) return toast.error("No verified balance is currently available.");
    if (!Number.isFinite(selectedCents) || selectedCents < 100) return toast.error("Enter at least $1.00.");
    if (selectedCents > maxCents) return toast.error("The payment cannot exceed the verified balance.");
    setConfirmed(true);
  };

  const confirmPayment = () => {
    const idempotencyKey = `member-balance-${Date.now()}-${crypto.randomUUID()}`;
    createAttempt.mutate({ amountCents: selectedCents, idempotencyKey }, {
      onSuccess: (result) => {
        if (!result.clientSecret || !result.paymentIntentId) {
          toast.error("This provider is not enabled for staging checkout yet.");
          return;
        }
        setAttemptId(result.attemptId);
        setPaymentIntentId(result.paymentIntentId);
        setClientSecret(result.clientSecret);
        setConfirmed(false);
      },
      onError: (error) => toast.error(error.message || "Could not prepare the staging payment."),
    });
  };

  if (complete) {
    return <div className={`rounded-xl border p-4 ${isDark ? "border-emerald-400/30 bg-emerald-400/10" : "border-emerald-200 bg-emerald-50"}`}><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="text-sm font-bold text-emerald-800">Payment submitted</p></div><p className="mt-1 text-xs text-emerald-700">Your payment was confirmed by the payment processor and recorded for account reconciliation.</p></div>;
  }

  return (
    <div className={`rounded-xl border p-5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#E11D2A]/10 p-2"><CreditCard className="h-5 w-5 text-[#E11D2A]" /></div>
        <div className="min-w-0 flex-1"><h3 className={`font-black ${isDark ? "text-white" : "text-gray-900"}`}>Pay toward your balance</h3><p className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-gray-600"}`}>Choose any amount from $1.00 up to your verified outstanding balance of ${(maxCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}.</p></div>
      </div>
      <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-xs ${isDark ? "bg-amber-400/10 text-amber-200" : "bg-amber-50 text-amber-800"}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>This is a one-time payment toward your verified balance. It does not change your recurring membership amount or schedule.</span></div>
      {!clientSecret ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(["full", "pastDue", "custom"] as const).map((option) => (
              <button key={option} type="button" onClick={() => { setPaymentOption(option); setConfirmed(false); }} className={`rounded-lg border px-3 py-3 text-left text-sm ${paymentOption === option ? "border-[#E11D2A] bg-red-50 text-[#E11D2A]" : isDark ? "border-white/10 text-white/70" : "border-gray-200 text-gray-600"}`}>
                <span className="block font-bold">{option === "full" ? "Pay full balance" : option === "pastDue" ? "Pay past due" : "Custom amount"}</span>
                <span className="mt-1 block text-xs opacity-75">{option === "full" ? `$${(maxCents / 100).toFixed(2)}` : option === "pastDue" ? `$${(pastDueCents / 100).toFixed(2)}` : "Choose amount"}</span>
              </button>
            ))}
          </div>
          {paymentOption === "custom" && (
            <div className="mt-3 flex gap-2">
              <span className={`flex items-center rounded-lg border px-3 text-sm ${isDark ? "border-white/10 text-white/60" : "border-gray-200 text-gray-500"}`}>$</span>
              <input type="number" min="1" max={maxCents / 100} step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setConfirmed(false); }} placeholder="1.00" className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm ${isDark ? "border-white/10 bg-white/5 text-white" : "border-gray-200 bg-white text-gray-900"}`} aria-label="Custom payment amount" />
            </div>
          )}
          <div className={`mt-4 rounded-lg border p-4 text-sm ${isDark ? "border-white/10 bg-white/5 text-white/80" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
            <div className="flex justify-between"><span>Outstanding balance</span><strong>${(maxCents / 100).toFixed(2)}</strong></div>
            <div className="mt-1 flex justify-between"><span>Payment amount</span><strong>${(selectedCents / 100).toFixed(2)}</strong></div>
            <div className="mt-1 flex justify-between"><span>Remaining after payment</span><strong>${Math.max(0, (maxCents - selectedCents) / 100).toFixed(2)}</strong></div>
          </div>
          {!confirmed ? (
            <button type="button" disabled={maxCents < 100 || selectedCents < 100} onClick={startPayment} className="mt-4 w-full rounded-lg bg-[#E11D2A] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Review payment</button>
          ) : (
            <div className={`mt-4 rounded-lg border p-4 ${isDark ? "border-red-400/30 bg-red-400/10" : "border-red-200 bg-red-50"}`}>
              <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Confirm your payment</p>
              <p className={`mt-1 text-xs ${isDark ? "text-white/70" : "text-gray-600"}`}>You are authorizing a one-time payment of ${((selectedCents) / 100).toFixed(2)} toward your verified balance. This will charge the payment method you submit.</p>
              <div className="mt-3 flex gap-2"><button type="button" onClick={() => setConfirmed(false)} className="flex-1 rounded-lg border px-3 py-2 text-sm font-bold">Back</button><button type="button" disabled={createAttempt.isPending} onClick={confirmPayment} className="flex-1 rounded-lg bg-[#E11D2A] px-3 py-2 text-sm font-bold text-white">{createAttempt.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : `Confirm & pay $${(selectedCents / 100).toFixed(2)}`}</button></div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4"><StripePaymentForm clientSecret={clientSecret} mode="payment" submitLabel={`Pay $${(selectedCents / 100).toFixed(2)}`} loading={recordResult.isPending} onSuccess={({ paymentIntentId: confirmedId }) => { const id = confirmedId || paymentIntentId; if (!id || !attemptId) return toast.error("Payment confirmation could not be verified."); recordResult.mutate({ attemptId, paymentIntentId: id }, { onSuccess: (result) => { if (result.verified) setComplete(true); else toast.error("The provider did not confirm this payment."); }, onError: (error) => toast.error(error.message || "Could not verify the payment result.") }); }} onError={(message) => toast.error(message)} /></div>
      )}
      <p className={`mt-3 flex items-center justify-center gap-1 text-center text-[11px] ${isDark ? "text-white/50" : "text-gray-500"}`}><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />No card details are stored by MyDojo.</p>
    </div>
  );
}
