/**
 * Admin: Scheduled (Future-Dated) Payments
 *
 * Allows staff to schedule a payment for a future date.
 *
 * Flow:
 *  1. Staff fills in customer info, amount, description, and scheduled date
 *  2. Staff enters card details via the FluidPay tokenizer iframe
 *  3. On submit: backend vaults the card, runs a $1 auth to keep the token alive,
 *     voids the auth, and stores the record
 *  4. On the scheduled date the heartbeat job auto-charges the card
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarClock, Plus, XCircle, Zap, Loader2, CreditCard } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    charged: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] ?? ""}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function fmt(amount: string | number) {
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

// ─── Create Payment Modal ─────────────────────────────────────────────────────

function CreatePaymentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<"info" | "card">("info");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    amount: "",
    description: "",
    scheduledDate: "",
  });
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenizerRef = useRef<{ submit: (amount?: string) => void } | null>(null);
  const tokenizerInitRef = useRef(false);
  const scriptLoadedRef = useRef(false);

  const createMutation = trpc.scheduledPayments.create.useMutation({
    onSuccess: () => {
      toast.success(`Payment scheduled — $${parseFloat(form.amount).toFixed(2)} will be charged on ${form.scheduledDate}.`);
      onCreated();
      handleClose();
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  // Load FluidPay tokenizer script
  useEffect(() => {
    if (!open || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    if (window.Tokenizer) { setTokenizerReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerReady(true);
    script.onerror = () => setError("Failed to load payment form. Please check your connection and try again.");
    document.head.appendChild(script);
  }, [open]);

  // Initialize tokenizer when card step is shown
  useEffect(() => {
    if (step !== "card") return;
    if (!tokenizerReady || tokenizerInitRef.current) return;
    if (!window.Tokenizer) return;
    tokenizerInitRef.current = true;
    try {
      const instance = new window.Tokenizer({
        apikey: import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "",
        container: "#scheduled-payment-tokenizer",
        submission: (resp: any) => {
          if (!resp.token || resp.status === "error") {
            setError(resp.error || "Card tokenization failed. Please check your card details.");
            setIsSubmitting(false);
            return;
          }
          // Submit to backend
          createMutation.mutate({
            customerName: form.customerName,
            customerEmail: form.customerEmail || undefined,
            customerPhone: form.customerPhone || undefined,
            amount: parseFloat(form.amount),
            description: form.description,
            scheduledDate: form.scheduledDate,
            paymentNonce: resp.token,
          });
        },
        settings: {
          payment: { types: ["card"] },
          styles: {
            body: { "font-family": "inherit", "background-color": "transparent" },
            inputs: {
              "border-radius": "8px",
              border: "2px solid #e2e8f0",
              padding: "12px 14px",
              "font-size": "16px",
              height: "50px",
            },
            labels: {
              "font-size": "14px",
              "font-weight": "600",
              color: "#374151",
              "margin-bottom": "4px",
            },
          },
        },
      });
      tokenizerRef.current = instance;
    } catch (err: any) {
      setError(`Payment form error: ${err?.message || "Unknown error"}. Please refresh and try again.`);
    }
  }, [step, tokenizerReady]);

  function handleClose() {
    setStep("info");
    setForm({ customerName: "", customerEmail: "", customerPhone: "", amount: "", description: "", scheduledDate: "" });
    setError(null);
    setIsSubmitting(false);
    tokenizerRef.current = null;
    tokenizerInitRef.current = false;
    onClose();
  }

  function handleInfoNext() {
    if (!form.customerName.trim()) { setError("Customer name is required."); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Please enter a valid amount."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }
    if (!form.scheduledDate) { setError("Scheduled date is required."); return; }
    const today = new Date().toISOString().split("T")[0];
    if (form.scheduledDate <= today) { setError("Scheduled date must be in the future."); return; }
    setError(null);
    setStep("card");
  }

  function handleCardSubmit() {
    setError(null);
    setIsSubmitting(true);
    if (tokenizerRef.current) {
      tokenizerRef.current.submit(parseFloat(form.amount).toFixed(2));
    } else {
      setError("Payment form not ready. Please refresh and try again.");
      setIsSubmitting(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Schedule a Future Payment
          </DialogTitle>
          <DialogDescription>
            {step === "info"
              ? "Enter the customer and payment details."
              : "Enter the card to be charged on the scheduled date. A $1 authorization will be run now to keep the card token active, then immediately voided."}
          </DialogDescription>
        </DialogHeader>

        {step === "info" && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Customer Name *</Label>
                <Input placeholder="John Smith" {...field("customerName")} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="john@example.com" {...field("customerEmail")} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="(555) 000-0000" {...field("customerPhone")} />
              </div>
              <div>
                <Label>Amount ($) *</Label>
                <Input type="number" min="0.01" step="0.01" placeholder="149.00" {...field("amount")} />
              </div>
              <div>
                <Label>Scheduled Date *</Label>
                <Input type="date" {...field("scheduledDate")} min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} />
              </div>
              <div className="col-span-2">
                <Label>Description *</Label>
                <Input placeholder="e.g. First month tuition — John Smith" {...field("description")} />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleInfoNext}>
                Next: Enter Card <CreditCard className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "card" && (
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Note:</strong> A $1 authorization will be run on this card to keep the token active, then immediately voided. The customer will <strong>not</strong> be charged today.
            </div>

            <div className="border rounded-lg p-4 bg-white min-h-[200px] flex items-center justify-center">
              {!tokenizerReady ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading payment form…
                </div>
              ) : (
                <div id="scheduled-payment-tokenizer" className="w-full" />
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => { setStep("info"); setError(null); tokenizerRef.current = null; tokenizerInitRef.current = false; }}>
                Back
              </Button>
              <Button onClick={handleCardSubmit} disabled={isSubmitting || !tokenizerReady}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <>Schedule Payment — {fmt(form.amount || "0")}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminScheduledPayments() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "charged" | "failed" | "cancelled">("all");
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [chargeNowId, setChargeNowId] = useState<number | null>(null);

  const { data: payments, isLoading, refetch } = trpc.scheduledPayments.list.useQuery({ status: statusFilter });

  const cancelMutation = trpc.scheduledPayments.cancel.useMutation({
    onSuccess: () => {
      toast.success("Payment cancelled");
      setCancelId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const chargeNowMutation = trpc.scheduledPayments.chargeNow.useMutation({
    onSuccess: (data) => {
      toast.success(`Payment charged — Transaction ID: ${data.transactionId}`);
      setChargeNowId(null);
      refetch();
    },
    onError: (err) => {
      toast.error(`Charge failed: ${err.message}`);
      setChargeNowId(null);
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Scheduled Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule a charge for a future date. A $1 auth keeps the card token active until the charge date.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Schedule Payment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Label className="text-sm font-medium">Filter:</Label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="charged">Charged</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">
          {payments?.length ?? 0} record{payments?.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Card</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading…
                </TableCell>
              </TableRow>
            ) : !payments?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  No scheduled payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.customerName}</div>
                    {p.customerPhone && <div className="text-xs text-gray-500">{p.customerPhone}</div>}
                    {p.customerEmail && <div className="text-xs text-gray-500">{p.customerEmail}</div>}
                  </TableCell>
                  <TableCell className="font-semibold">{fmt(p.amount)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{p.description}</TableCell>
                  <TableCell className="text-sm">
                    {p.scheduledDate ? String(p.scheduledDate).split("T")[0] : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.cardBrand && p.cardLast4 ? (
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                        {p.cardBrand} ···{p.cardLast4}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => setChargeNowId(p.id)}
                          >
                            <Zap className="h-3.5 w-3.5 mr-1" /> Charge Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => setCancelId(p.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                      {p.status === "failed" && (
                        <span className="text-xs text-red-500 max-w-[160px] truncate" title={p.failureReason ?? ""}>
                          {p.failureReason || "Unknown error"}
                        </span>
                      )}
                      {p.status === "charged" && p.chargeTransactionId && (
                        <span className="text-xs text-gray-400">Txn: {p.chargeTransactionId}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
      <CreatePaymentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => refetch()}
      />

      {/* Cancel Confirm Dialog */}
      <Dialog open={cancelId !== null} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Scheduled Payment?</DialogTitle>
            <DialogDescription>
              This will mark the payment as cancelled. The card token will remain in the vault but the payment will not be charged.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>No, Keep It</Button>
            <Button
              variant="destructive"
              onClick={() => cancelId !== null && cancelMutation.mutate({ id: cancelId })}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Charge Now Confirm Dialog */}
      <Dialog open={chargeNowId !== null} onOpenChange={(o) => !o && setChargeNowId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Charge Now?</DialogTitle>
            <DialogDescription>
              This will immediately charge the full amount to the customer's card, regardless of the scheduled date.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setChargeNowId(null)}>Cancel</Button>
            <Button
              onClick={() => chargeNowId !== null && chargeNowMutation.mutate({ id: chargeNowId })}
              disabled={chargeNowMutation.isPending}
            >
              {chargeNowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Charge Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
