import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Lock, Tag, ChevronLeft, CreditCard, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { EnrollmentAgreement, type AgreementSignature } from "@/components/EnrollmentAgreement";

interface EnrollmentData {
  packageId?: number;
  packageName: string;
  downPayment?: number;
  enrollmentFee?: number;
  monthlyPrice?: number;
  durationMonths?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  studentName?: string;
  // Summer camp specific
  type?: string;
  weekLabel?: string;
  totalAmount?: number;
  childName?: string;
  // Staff-only: enrollment fee waiver
  waiveEnrollmentFee?: boolean;
  waiverReason?: string;
  // Deferred tuition: charge only $99 now, first month tuition on a later date
  deferTuition?: boolean;
  deferredTuitionDate?: string; // YYYY-MM-DD within same calendar month
  // Full down payment waiver: $0 today, recurring starts immediately
  waiveDownPayment?: boolean;
}

interface FluidPayEnrollmentFormProps {
  enrollmentData: EnrollmentData;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  initialPromo?: string; // pre-applied promo code from URL
}

declare global {
  interface Window {
    Tokenizer?: new (config: {
      apikey: string;
      container: string;
      submission: (resp: { token?: string; status?: string; error?: string }) => void;
      onLoad?: () => void;
      settings?: {
        payment?: { types?: string[] };
        styles?: {
          body?: Record<string, string>;
          inputs?: Record<string, string>;
          labels?: Record<string, string>;
        };
      };
    }) => { submit: (amount?: string) => void };
  }
}

// Step indicator component
function StepIndicator({ current, total }: { current: number; total: number }) {
  const steps = [
    { label: "Agreement", icon: FileCheck },
    { label: "Payment", icon: CreditCard },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        const Icon = step.icon;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                  ${isDone ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}
              >
                {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={`text-xs font-medium ${isActive ? "text-primary" : isDone ? "text-green-600" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-16 h-1 mx-2 mb-4 rounded-full transition-all ${isDone ? "bg-green-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FluidPayEnrollmentForm({ enrollmentData, onSuccess, onError, initialPromo }: FluidPayEnrollmentFormProps) {
  const [step, setStep] = useState<"agreement" | "payment">("agreement");
  const [agreementSig, setAgreementSig] = useState<AgreementSignature | null>(null);

  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokenizerInstanceRef = useRef<{ submit: (amount?: string) => void } | null>(null);
  const scriptLoadedRef = useRef(false);
  const tokenizerInitializedRef = useRef(false);
  // Promo code state
  const [promoInput, setPromoInput] = useState(initialPromo || "");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountType: string; discountValue: number; description: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const validatePromo = trpc.promo.validate.useMutation();
  const markPromoUsed = trpc.promo.markUsed.useMutation();

  // Auto-apply promo code from URL on first render
  useEffect(() => {
    if (!initialPromo) return;
    validatePromo.mutate(
      { code: initialPromo.trim() },
      {
        onSuccess: (result) => {
          setAppliedPromo(result);
          setPromoInput(result.code);
          toast.success(`Promo code applied: ${result.description}`);
        },
        onError: () => {
          // silently ignore invalid initial promo
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError(null);
    setPromoLoading(true);
    try {
      const result = await validatePromo.mutateAsync({ code: promoInput.trim() });
      setAppliedPromo(result);
      toast.success(`Promo code applied: ${result.description}`);
    } catch (e: any) {
      setPromoError(e?.message || "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const isSummerCamp = enrollmentData.type === "summer_camp";
  const waiveEnrollmentFee = !isSummerCamp && (enrollmentData.waiveEnrollmentFee ?? false);
  const enrollmentFee = enrollmentData.enrollmentFee ?? 149;
  const baseAmount = isSummerCamp
    ? (enrollmentData.totalAmount || 298)
    : waiveEnrollmentFee
      ? Math.max(0, (enrollmentData.downPayment || 0) - enrollmentFee)
      : (enrollmentData.downPayment || 0);
  // waive_down_payment only removes the one-time enrollment/registration fee ($99),
  // NOT the first month's tuition — so the student still pays their first month.
  const promoDiscount = appliedPromo
    ? appliedPromo.discountType === "waive_down_payment"
      ? enrollmentFee  // only waive the $99 registration fee
      : appliedPromo.discountType === "percent"
        ? baseAmount * (appliedPromo.discountValue / 100)
        : Math.min(appliedPromo.discountValue, baseAmount)
    : 0;
  const totalAmount = Math.max(0, baseAmount - promoDiscount);

  const createEnrollmentMutation = trpc.member.createEnrollmentCheckout.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      setSuccess(true);
      const msg = isSummerCamp
        ? `🎉 Summer Camp registration confirmed! Welcome to MyDojo! See you at camp.`
        : `🎉 Welcome to MyDojo! Your ${enrollmentData.packageName} membership is active. We'll see you on the mat!`;
      onSuccess?.(msg);
      toast.success("Enrollment complete!", { description: "Check your email for confirmation details." });
    },
    onError: (error) => {
      setIsSubmitting(false);
      const msg = error.message || "Payment failed. Please try again or contact us at (877) 4-MYDOJO.";
      setErrorMessage(msg);
      onError?.(msg);
      toast.error("Payment failed", { description: msg });
    },
  });

  // Pre-load the FluidPay script immediately so it's ready when user reaches payment step
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    if (window.Tokenizer) { setTokenizerReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerReady(true);
    script.onerror = () =>
      setErrorMessage("Failed to load payment form. Please check your internet connection and refresh.");
    document.head.appendChild(script);
  }, []);

  // Initialize tokenizer when payment step is shown
  useEffect(() => {
    if (step !== "payment") return;
    if (!tokenizerReady || tokenizerInitializedRef.current) return;
    if (!window.Tokenizer) return;
    tokenizerInitializedRef.current = true;
    try {
      const instance = new window.Tokenizer({
        apikey: import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "",
        container: "#fluidpay-tokenizer-container",
        submission: (resp) => {
          if (!resp.token || resp.status === "error") {
            const msg = resp.error || "Card tokenization failed. Please check your card details and try again.";
            setErrorMessage(msg);
            setIsSubmitting(false);
            return;
          }
          createEnrollmentMutation.mutate({
            token: resp.token,
            packageId: enrollmentData.packageId || 0,
            customerName: enrollmentData.customerName,
            customerEmail: enrollmentData.customerEmail,
            customerPhone: enrollmentData.customerPhone,
            studentName: enrollmentData.studentName || enrollmentData.childName || enrollmentData.customerName,
            isSummerCamp: isSummerCamp,
            summerCampWeek: enrollmentData.weekLabel,
            waiveEnrollmentFee: waiveEnrollmentFee || undefined,
            waiverReason: enrollmentData.waiverReason || undefined,
            deferTuition: enrollmentData.deferTuition || undefined,
            deferredTuitionDate: enrollmentData.deferredTuitionDate || undefined,
            waiveDownPayment: enrollmentData.waiveDownPayment || undefined,
            agreementSignature: agreementSig?.signedName,
            agreementSignedAt: agreementSig?.signedAt?.toISOString(),
          });
        },
        onLoad: () => {},
        settings: {
          payment: { types: ["card"] },
          styles: {
            body: { "font-family": "inherit", "background-color": "transparent" },
            inputs: {
              "border-radius": "8px",
              "border": "2px solid #e2e8f0",
              "padding": "14px 16px",
              "font-size": "18px",   // Larger text for mobile readability
              "height": "56px",
            },
            labels: {
              "font-size": "15px",
              "font-weight": "600",
              "color": "#374151",
              "margin-bottom": "6px",
            },
          },
        },
      });
      tokenizerInstanceRef.current = instance;
    } catch (err: any) {
      setErrorMessage(`Payment form error: ${err?.message || "Unknown error"}. Please refresh and try again.`);
    }
  }, [step, tokenizerReady]);

  const handleSubmit = () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    if (tokenizerInstanceRef.current) {
      tokenizerInstanceRef.current.submit(totalAmount.toFixed(2));
    } else {
      setErrorMessage("Payment form not ready. Please refresh and try again.");
      setIsSubmitting(false);
    }
  };

  const handleAgreementAccepted = (sig: AgreementSignature) => {
    setAgreementSig(sig);
    setStep("payment");
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToAgreement = () => {
    setStep("agreement");
    tokenizerInitializedRef.current = false;
    tokenizerInstanceRef.current = null;
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">You're In!</h2>
        <p className="text-gray-600 text-base max-w-xs">
          Welcome to MyDojo! Check your email for confirmation and next steps.
        </p>
      </div>
    );
  }

  const currentStepNum = step === "agreement" ? 1 : 2;

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <StepIndicator current={currentStepNum} total={2} />

      {/* ── Step 1: Agreement ── */}
      {step === "agreement" && (
        <EnrollmentAgreement
          customerName={enrollmentData.customerName}
          studentName={enrollmentData.studentName || enrollmentData.childName}
          packageName={isSummerCamp ? `Summer Camp — ${enrollmentData.weekLabel}` : enrollmentData.packageName}
          monthlyPrice={enrollmentData.monthlyPrice || 0}
          totalDueToday={totalAmount}
          enrollmentFeeWaived={waiveEnrollmentFee}
          onAccepted={handleAgreementAccepted}
        />
      )}

      {/* ── Step 2: Payment ── */}
      {step === "payment" && (
        <div className="space-y-5">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBackToAgreement}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-base font-medium py-2"
            style={{ minHeight: 44 }}
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Agreement
          </button>

          {/* Agreement signed confirmation */}
          {agreementSig && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-green-800 font-semibold text-sm">Agreement signed</p>
                <p className="text-green-700 text-xs truncate">
                  Signed as <strong>{agreementSig.signedName}</strong> on{" "}
                  {agreementSig.signedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Promo code input */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Tag className="w-4 h-4" /> Promo Code</p>
            {appliedPromo ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-green-800 font-bold text-sm">{appliedPromo.code}</p>
                  <p className="text-green-700 text-xs">{appliedPromo.description}</p>
                </div>
                <button onClick={() => setAppliedPromo(null)} className="text-green-600 hover:text-green-800 text-xs underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                  placeholder="Enter promo code"
                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-primary"
                />
                <Button type="button" variant="outline" onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()} className="shrink-0">
                  {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
            {promoError && <p className="text-red-600 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{promoError}</p>}
          </div>

          {/* Order summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 space-y-2">
            <p className="font-bold text-gray-900 text-base">
              {isSummerCamp ? `Summer Camp — ${enrollmentData.weekLabel}` : enrollmentData.packageName}
            </p>
            {isSummerCamp ? (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Camp fee</span><span>$199.00</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Registration fee</span><span>$149.00</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>First month's membership</span>
                  <span>${(enrollmentData.monthlyPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    One-time enrollment fee
                    {waiveEnrollmentFee && (
                      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs px-1.5 py-0 h-auto">
                        <Tag className="h-2.5 w-2.5 mr-0.5" />WAIVED
                      </Badge>
                    )}
                  </span>
                  <span className={waiveEnrollmentFee ? "line-through text-gray-400" : ""}>
                    ${enrollmentFee.toFixed(2)}
                  </span>
                </div>
                {waiveEnrollmentFee && (
                  <div className="flex justify-between text-sm text-green-700 font-medium">
                    <span>Discount</span><span>-${enrollmentFee.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            {appliedPromo && promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-700 font-medium">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Promo ({appliedPromo.code})</span>
                <span>-${promoDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
              <span>Total due today</span>
              <span>{totalAmount === 0 ? <span className="text-green-600 font-bold">FREE</span> : `$${totalAmount.toFixed(2)}`}</span>
            </div>
            {!isSummerCamp && (
              <p className="text-xs text-gray-400">
                Then ${(enrollmentData.monthlyPrice || 0).toFixed(2)}/mo recurring
              </p>
            )}
          </div>

          {/* Payment form */}
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <p className="font-semibold text-gray-900 text-base">Card Details</p>
            </div>
            {!tokenizerReady && !errorMessage && (
              <div className="flex items-center justify-center py-10 gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base">Loading secure payment form…</span>
              </div>
            )}
            <div id="fluidpay-tokenizer-container" className={tokenizerReady ? "block" : "hidden"} />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <span className="text-base">{errorMessage}</span>
            </div>
          )}

          {totalAmount === 0 && !enrollmentData.waiveDownPayment ? (
            <Button
              onClick={() => {
                if (appliedPromo) markPromoUsed.mutate({ code: appliedPromo.code });
                createEnrollmentMutation.mutate({
                  token: "PROMO_FREE",
                  packageId: enrollmentData.packageId || 0,
                  customerName: enrollmentData.customerName,
                  customerEmail: enrollmentData.customerEmail,
                  customerPhone: enrollmentData.customerPhone,
                  studentName: enrollmentData.studentName || enrollmentData.childName || enrollmentData.customerName,
                  isSummerCamp: isSummerCamp,
                  summerCampWeek: enrollmentData.weekLabel,
                  waiveEnrollmentFee: true,
                  waiverReason: `Promo code: ${appliedPromo?.code}`,
                  agreementSignature: agreementSig?.signedName,
                  agreementSignedAt: agreementSig?.signedAt?.toISOString(),
                });
              }}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
              style={{ minHeight: 60 }}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing…</>
              ) : (
                "Complete Enrollment — FREE"
              )}
            </Button>
          ) : tokenizerReady && !errorMessage ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg"
              style={{ minHeight: 60 }}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing…</>
              ) : (
                enrollmentData.waiveDownPayment ? `Save Card & Complete Enrollment — $0 Today` : `Pay $${totalAmount.toFixed(2)} & Complete Enrollment`
              )}
            </Button>
          ) : null}

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pb-2">
            <Lock className="w-4 h-4" />
            <span>Secured by Fluid Pay · PCI DSS Compliant</span>
          </div>
        </div>
      )}
    </div>
  );
}
