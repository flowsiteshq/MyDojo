import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Enrollment {
  id: number;
  customerName: string;
  stripeCustomerId?: string | null;
}

interface Props {
  enrollment: Enrollment | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * One secure card-update experience for every membership. Legacy enrollments
 * receive a Stripe customer when this dialog opens; no legacy tokenizer is
 * loaded in the browser.
 */
export function UpdatePaymentMethodModal({ enrollment, open, onClose, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const createSetupIntent = trpc.admin.createSetupIntentForEnrollment.useMutation();
  const updateMethod = trpc.admin.updateEnrollmentPaymentMethod.useMutation({
    onSuccess: (result) => {
      toast.success(`Payment method updated${result.cardLast4 ? ` · ending in ${result.cardLast4}` : ""}`);
      onSuccess?.();
      onClose();
    },
    onError: (error) => toast.error(error.message || "Could not update the payment method."),
  });

  useEffect(() => {
    if (!open || !enrollment) {
      setClientSecret(null);
      return;
    }
    createSetupIntent.mutate({ enrollmentId: enrollment.id }, {
      onSuccess: (result) => setClientSecret(result.clientSecret ?? null),
      onError: (error) => toast.error(error.message || "Could not prepare a secure card update."),
    });
  }, [open, enrollment?.id]);

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Update payment method</DialogTitle>
          <DialogDescription>Replace the saved payment method for <strong>{enrollment?.customerName}</strong>. The updated method will be used for future membership billing.</DialogDescription>
        </DialogHeader>
        {!clientSecret ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="h-6 w-6 animate-spin text-primary" />Preparing secure card update…</div>
        ) : (
          <div className="space-y-4 pt-2">
            <StripePaymentForm
              clientSecret={clientSecret}
              mode="setup"
              submitLabel="Save payment method"
              loading={updateMethod.isPending}
              onSuccess={({ paymentMethodId }) => {
                if (!paymentMethodId || !enrollment) return toast.error("The payment method was not saved. Please try again.");
                updateMethod.mutate({ enrollmentId: enrollment.id, stripePaymentMethodId: paymentMethodId });
              }}
              onError={(message) => toast.error(message)}
            />
            <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Card details are encrypted and never stored by MyDojo.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
