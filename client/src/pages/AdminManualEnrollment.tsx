import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, RefreshCw, DollarSign, Calendar, User, CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";



const PROGRAM_OPTIONS = [
  { value: "kickboxing", label: "Kickboxing", frequency: "monthly", color: "bg-orange-100 text-orange-800" },
  { value: "martial_arts", label: "Martial Arts", frequency: "monthly", color: "bg-blue-100 text-blue-800" },
  { value: "summer_camp", label: "Summer Camp", frequency: "weekly", color: "bg-green-100 text-green-800" },
  { value: "after_school", label: "After School", frequency: "weekly", color: "bg-purple-100 text-purple-800" },
] as const;

type Program = typeof PROGRAM_OPTIONS[number]["value"];

function getFrequency(program: Program): "monthly" | "weekly" {
  return program === "kickboxing" || program === "martial_arts" ? "monthly" : "weekly";
}

function getDefaultNextChargeDate(frequency: "monthly" | "weekly"): string {
  const d = new Date();
  if (frequency === "monthly") {
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
  } else {
    // Next Monday
    const day = d.getDay();
    const daysUntilMonday = (8 - day) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMonday);
  }
  return d.toISOString().slice(0, 10);
}

interface EnrollmentFormData {
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  program: Program;
  customPrice: string;
  nextChargeDate: string;
  preAuthOnly: boolean;
  notes: string;
}

const defaultForm: EnrollmentFormData = {
  studentName: "",
  parentName: "",
  phone: "",
  email: "",
  program: "martial_arts",
  customPrice: "149",
  nextChargeDate: getDefaultNextChargeDate("monthly"),
  preAuthOnly: false,
  notes: "",
};

export default function AdminManualEnrollment() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EnrollmentFormData>(defaultForm);
  const [step, setStep] = useState<"info" | "payment" | "success">("info");
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const tokenizerInstanceRef = useRef<any>(null);
  const tokenizerInitializedRef = useRef(false);

  // List enrollments
  const { data: enrollments, refetch } = trpc.manualEnrollments.list.useQuery(undefined, {
    enabled: !showForm,
  });

  // Create mutation
  const createMutation = trpc.manualEnrollments.create.useMutation({
    onSuccess: (data) => {
      setSuccessData(data);
      setStep("success");
      setIsSubmitting(false);
      refetch();
    },
    onError: (err) => {
      setErrorMessage(err.message);
      setIsSubmitting(false);
      // Reset tokenizer so staff can retry
      tokenizerInitializedRef.current = false;
      tokenizerInstanceRef.current = null;
    },
  });

  // Charge mutation
  const chargeMutation = trpc.manualEnrollments.charge.useMutation({
    onSuccess: (data: { success: boolean; transactionId: string; amountCharged: number }) => {
      toast.success(`Charge successful — $${data.amountCharged} charged. Transaction: ${data.transactionId}`);
      refetch();
    },
    onError: (err: { message: string }) => {
      toast.error(`Charge failed: ${err.message}`);
    },
  });

  // Load FluidPay tokenizer script
  useEffect(() => {
    if (window.Tokenizer) { setTokenizerReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerReady(true);
    script.onerror = () => setErrorMessage("Failed to load payment form. Please refresh.");
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
        container: "#manual-enroll-tokenizer",
        submission: (resp: any) => {
          if (!resp.token || resp.status === "error") {
            setErrorMessage(resp.error || "Card tokenization failed. Please check card details and try again.");
            setIsSubmitting(false);
            return;
          }
          createMutation.mutate({
            studentName: form.studentName,
            parentName: form.parentName || undefined,
            phone: form.phone,
            email: form.email || undefined,
            program: form.program,
            customPrice: parseFloat(form.customPrice),
            nextChargeDate: form.nextChargeDate,
            token: resp.token,
            preAuthOnly: form.preAuthOnly,
            notes: form.notes || undefined,
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
              "padding": "12px 14px",
              "font-size": "16px",
              "height": "48px",
            },
            labels: {
              "font-size": "14px",
              "font-weight": "600",
              "color": "#374151",
              "margin-bottom": "4px",
            },
          },
        },
      });
      tokenizerInstanceRef.current = instance;
    } catch (err: any) {
      setErrorMessage(`Payment form error: ${err?.message || "Unknown error"}. Please refresh.`);
    }
  }, [step, tokenizerReady]);

  const handleProgramChange = (program: Program) => {
    const freq = getFrequency(program);
    setForm(prev => ({
      ...prev,
      program,
      nextChargeDate: getDefaultNextChargeDate(freq),
      customPrice: program === "kickboxing" ? "149" : program === "martial_arts" ? "149" : program === "summer_camp" ? "250" : "120",
    }));
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName || !form.phone || !form.customPrice || !form.nextChargeDate) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    const price = parseFloat(form.customPrice);
    if (isNaN(price) || price <= 0) {
      setErrorMessage("Please enter a valid price.");
      return;
    }
    setErrorMessage(null);
    setStep("payment");
  };

  const handlePaymentSubmit = () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    if (tokenizerInstanceRef.current) {
      tokenizerInstanceRef.current.submit(parseFloat(form.customPrice).toFixed(2));
    } else {
      setErrorMessage("Payment form not ready. Please refresh.");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm);
    setStep("info");
    setSuccessData(null);
    setErrorMessage(null);
    setIsSubmitting(false);
    tokenizerInitializedRef.current = false;
    tokenizerInstanceRef.current = null;
    setShowForm(false);
  };

  const frequency = getFrequency(form.program);
  const programOption = PROGRAM_OPTIONS.find(p => p.value === form.program);

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (step === "success" && successData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Created!</h2>
            <p className="text-gray-600 mb-6">
              <strong>{form.studentName}</strong> has been enrolled in <strong>{programOption?.label}</strong>.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Program</span>
                <span className="font-medium">{programOption?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Billing</span>
                <span className="font-medium">${parseFloat(form.customPrice).toFixed(2)} / {frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Next Charge</span>
                <span className="font-medium">{form.nextChargeDate}</span>
              </div>
              {form.preAuthOnly ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pre-Auth</span>
                  <span className="font-medium text-blue-600">$1.00 authorization</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-500">Charged Today</span>
                  <span className="font-medium text-green-600">${parseFloat(form.customPrice).toFixed(2)}</span>
                </div>
              )}
              {successData.fpSubscriptionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Subscription ID</span>
                  <span className="font-mono text-xs text-gray-600">{successData.fpSubscriptionId}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleReset} className="flex-1 bg-black hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4 mr-2" /> Enroll Another Student
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setStep("info"); setSuccessData(null); refetch(); }} className="flex-1">
                View All Enrollments
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Enrollment Form ─────────────────────────────────────────────────────────
  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={handleReset} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manual Enrollment</h1>
              <p className="text-sm text-gray-500">Transfer student from old system</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${step === "info" ? "bg-black text-white" : "bg-green-100 text-green-700"}`}>
              <span>1</span> <span>Student Info</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${step === "payment" ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>
              <span>2</span> <span>Payment</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* ── Step 1: Student Info ── */}
            {step === "info" && (
              <form onSubmit={handleInfoSubmit} className="space-y-5">
                {/* Program selector */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Program *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROGRAM_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleProgramChange(opt.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.program === opt.value
                            ? "border-black bg-black text-white"
                            : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className={`text-xs mt-0.5 ${form.program === opt.value ? "text-gray-300" : "text-gray-400"}`}>
                          Billed {opt.frequency}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Student name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentName" className="text-sm font-semibold text-gray-700">Student Name *</Label>
                    <Input
                      id="studentName"
                      value={form.studentName}
                      onChange={e => setForm(prev => ({ ...prev, studentName: e.target.value }))}
                      placeholder="e.g. John Smith"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentName" className="text-sm font-semibold text-gray-700">Parent Name</Label>
                    <Input
                      id="parentName"
                      value={form.parentName}
                      onChange={e => setForm(prev => ({ ...prev, parentName: e.target.value }))}
                      placeholder="(if minor)"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(281) 555-1234"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="optional"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Pricing & billing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customPrice" className="text-sm font-semibold text-gray-700">
                      Price (${" "}/{frequency}) *
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="customPrice"
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.customPrice}
                        onChange={e => setForm(prev => ({ ...prev, customPrice: e.target.value }))}
                        className="pl-8 mt-0"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Recurring {frequency} charge</p>
                  </div>
                  <div>
                    <Label htmlFor="nextChargeDate" className="text-sm font-semibold text-gray-700">
                      Next Charge Date *
                    </Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="nextChargeDate"
                        type="date"
                        value={form.nextChargeDate}
                        onChange={e => setForm(prev => ({ ...prev, nextChargeDate: e.target.value }))}
                        className="pl-8 mt-0"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Recurring starts on this date</p>
                  </div>
                </div>

                {/* Pre-auth toggle */}
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-amber-900">Pre-Authorization Only</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Runs a $1.00 hold to verify the card. No charge today — first full charge on {form.nextChargeDate}.
                    </p>
                  </div>
                  <Switch
                    checked={form.preAuthOnly}
                    onCheckedChange={checked => setForm(prev => ({ ...prev, preAuthOnly: checked }))}
                  />
                </div>

                {/* Summary box */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Charged today</span>
                    <span className="font-semibold text-gray-900">
                      {form.preAuthOnly ? "$1.00 (pre-auth)" : `$${parseFloat(form.customPrice || "0").toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Then {frequency}</span>
                    <span className="font-semibold text-gray-900">
                      ${parseFloat(form.customPrice || "0").toFixed(2)} starting {form.nextChargeDate}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Staff Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Transfer from old system, special pricing reason, etc."
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-semibold">
                  Continue to Payment
                </Button>
              </form>
            )}

            {/* ── Step 2: Payment ── */}
            {step === "payment" && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">{form.studentName}</span>
                    <Badge className={`text-xs ${programOption?.color}`}>{programOption?.label}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Charge today</span>
                      <span className="font-semibold text-gray-900">
                        {form.preAuthOnly ? "$1.00 (pre-auth)" : `$${parseFloat(form.customPrice).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recurring {frequency}</span>
                      <span className="font-semibold text-gray-900">${parseFloat(form.customPrice).toFixed(2)} from {form.nextChargeDate}</span>
                    </div>
                  </div>
                </div>

                {/* FluidPay tokenizer */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    <CreditCard className="w-4 h-4 inline mr-1.5" />
                    Card Details
                  </Label>
                  {!tokenizerReady && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading payment form...
                    </div>
                  )}
                  <div id="manual-enroll-tokenizer" className={tokenizerReady ? "block" : "hidden"} />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("info");
                      setErrorMessage(null);
                      tokenizerInitializedRef.current = false;
                      tokenizerInstanceRef.current = null;
                    }}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={isSubmitting || !tokenizerReady}
                    className="flex-1 bg-black hover:bg-gray-800 text-white h-12 font-semibold"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : form.preAuthOnly ? (
                      "Run Pre-Authorization"
                    ) : (
                      `Charge $${parseFloat(form.customPrice).toFixed(2)} & Enroll`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Enrollments List ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manual Enrollments</h1>
              <p className="text-sm text-gray-500">Staff-transferred students from legacy system</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
            <Button
              onClick={() => { setShowForm(true); setStep("info"); setForm(defaultForm); setErrorMessage(null); }}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Enroll Student
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {PROGRAM_OPTIONS.map(opt => {
            const count = enrollments?.filter((e: any) => e.program === opt.value && e.status === "active").length ?? 0;
            return (
              <div key={opt.value} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{opt.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                <p className="text-xs text-gray-400">active</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {!enrollments ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No manual enrollments yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Enroll Student" to transfer a student from the old system.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Next Charge</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment: any) => {
                  const progOpt = PROGRAM_OPTIONS.find(p => p.value === enrollment.program);
                  return (
                    <TableRow key={enrollment.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{enrollment.studentName}</p>
                          {enrollment.parentName && (
                            <p className="text-xs text-gray-400">Parent: {enrollment.parentName}</p>
                          )}
                          <p className="text-xs text-gray-400">{enrollment.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${progOpt?.color ?? "bg-gray-100 text-gray-700"}`}>
                          {progOpt?.label ?? enrollment.program}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">{enrollment.billingFrequency}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">${parseFloat(enrollment.customPrice as string).toFixed(2)}</span>
                        <span className="text-xs text-gray-400">/{enrollment.billingFrequency}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{enrollment.nextChargeDate}</span>
                        {enrollment.preAuthEnabled === 1 && (
                          <Badge className="ml-1 text-xs bg-amber-100 text-amber-800">Pre-Auth</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.cardType && enrollment.cardLast4 ? (
                          <span className="text-sm text-gray-600">{enrollment.cardType} ···{enrollment.cardLast4}</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          enrollment.status === "active" ? "bg-green-100 text-green-800" :
                          enrollment.status === "cancelled" ? "bg-red-100 text-red-800" :
                          enrollment.status === "failed" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{enrollment.createdByStaffName || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          disabled={chargeMutation.isPending}
                          onClick={() => {
                            if (confirm(`Charge $${parseFloat(enrollment.customPrice as string).toFixed(2)} to ${enrollment.studentName}?`)) {
                              chargeMutation.mutate({ id: enrollment.id });
                            }
                          }}
                        >
                          <DollarSign className="w-3 h-3 mr-1" /> Charge
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
