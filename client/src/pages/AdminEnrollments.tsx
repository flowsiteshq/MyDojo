import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  PlusCircle,
  Tag,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { FluidPayEnrollmentForm } from "@/components/FluidPayEnrollmentForm";

// ─── Staff Enrollment Dialog ──────────────────────────────────────────────────

interface StaffEnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}

function StaffEnrollmentDialog({ open, onClose, onEnrolled }: StaffEnrollmentDialogProps) {
  const { data: packages, isLoading: pkgsLoading } = trpc.admin.getPackages.useQuery(undefined, {
    enabled: open,
  });

  const [step, setStep] = useState<"form" | "payment">("form");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [waiveEnrollmentFee, setWaiveEnrollmentFee] = useState(false);
  const [waiverReason, setWaiverReason] = useState("");
  const [deferTuition, setDeferTuition] = useState(false);
  const [deferredTuitionDate, setDeferredTuitionDate] = useState("");
  const [enrollmentData, setEnrollmentData] = useState<any | null>(null);

  const activePackages = packages?.filter((p) => p.isActive) ?? [];

  const selectedPkg = activePackages.find((p) => String(p.id) === selectedPackageId);
  const enrollmentFee = selectedPkg ? parseFloat(selectedPkg.enrollmentFee as string) : 149;
  const monthlyPrice = selectedPkg ? parseFloat(selectedPkg.monthlyPrice as string) : 0;
  const downPayment = selectedPkg ? parseFloat(selectedPkg.downPayment as string) : 0;
  const effectiveTotal = deferTuition
    ? enrollmentFee
    : waiveEnrollmentFee
    ? Math.max(0, downPayment - enrollmentFee)
    : downPayment;
  // Get today's date and end of current month for deferred tuition date picker
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const handleContinueToPayment = () => {
    if (!selectedPkg || !customerName || !customerEmail || !customerPhone) return;
    setEnrollmentData({
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      downPayment,
      enrollmentFee,
      monthlyPrice,
      durationMonths: selectedPkg.durationMonths,
      customerName,
      customerEmail,
      customerPhone,
      studentName: studentName || customerName,
      waiveEnrollmentFee,
      waiverReason: waiverReason.trim() || undefined,
      deferTuition: deferTuition || undefined,
      deferredTuitionDate: deferTuition ? deferredTuitionDate : undefined,
    });
    setStep("payment");
  };

  const handleClose = () => {
    setStep("form");
    setSelectedPackageId("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setStudentName("");
    setWaiveEnrollmentFee(false);
    setWaiverReason("");
    setDeferTuition(false);
    setDeferredTuitionDate("");
    setEnrollmentData(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            New Staff Enrollment
          </DialogTitle>
          <DialogDescription>
            Enroll a new member manually. Toggle the waiver to remove the enrollment fee for
            promotions or returning members.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 pt-2">
            {/* Package selector */}
            <div className="space-y-1.5">
              <Label htmlFor="package">Membership Package *</Label>
              {pkgsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading packages…
                </div>
              ) : (
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger id="package">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={String(pkg.id)}>
                        {pkg.name} — ${parseFloat(pkg.monthlyPrice as string).toFixed(2)}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Parent / Member Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone">Phone *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="studentName">Student Name (if different)</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Leave blank if same as above"
                />
              </div>
            </div>

            {/* ── Enrollment Fee Waiver ── */}
            <div className="rounded-lg border border-dashed border-border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="waiver-toggle" className="flex items-center gap-1.5 cursor-pointer">
                    <Tag className="h-4 w-4 text-green-600" />
                    Waive Enrollment Fee
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Removes the ${enrollmentFee.toFixed(2)} one-time fee for promotions or returning members.
                  </p>
                </div>
                <Switch
                  id="waiver-toggle"
                  checked={waiveEnrollmentFee}
                  onCheckedChange={setWaiveEnrollmentFee}
                />
              </div>

              {waiveEnrollmentFee && (
                <div className="space-y-1.5">
                  <Label htmlFor="waiverReason">Reason for Waiver</Label>
                  <Textarea
                    id="waiverReason"
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    placeholder="e.g. Returning member, summer promotion, staff family…"
                    rows={2}
                    maxLength={200}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground text-right">{waiverReason.length}/200</p>
                </div>
              )}

              {/* Deferred Tuition Toggle */}
              {!waiveEnrollmentFee && (
                <div className="flex items-center justify-between rounded-lg border p-3 bg-blue-50/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="defer-toggle" className="flex items-center gap-1.5 cursor-pointer">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      Defer First Month Tuition
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Charge only the ${enrollmentFee.toFixed(2)} enrollment fee today; collect ${monthlyPrice.toFixed(2)} tuition on a later date this month.
                    </p>
                  </div>
                  <Switch
                    id="defer-toggle"
                    checked={deferTuition}
                    onCheckedChange={(v) => { setDeferTuition(v); if (!v) setDeferredTuitionDate(""); }}
                  />
                </div>
              )}
              {deferTuition && (
                <div className="space-y-1.5">
                  <Label htmlFor="deferredDate">Tuition Charge Date (this month)</Label>
                  <Input
                    id="deferredDate"
                    type="date"
                    min={todayStr}
                    max={endOfMonth}
                    value={deferredTuitionDate}
                    onChange={(e) => setDeferredTuitionDate(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Must be a future date within the current calendar month.</p>
                </div>
              )}
            </div>

            {/* Price preview */}
            {selectedPkg && (
              <div className="rounded-lg bg-card border p-3 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>First month's membership</span>
                  <span className={deferTuition ? "line-through text-muted-foreground/40" : ""}>${monthlyPrice.toFixed(2)}</span>
                </div>
                {deferTuition && (
                  <div className="flex justify-between text-blue-700 text-xs font-medium">
                    <span>Tuition deferred to {deferredTuitionDate || "(select date)"}</span>
                    <span>-${monthlyPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Enrollment fee
                    {waiveEnrollmentFee && (
                      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs px-1.5 py-0 h-auto">
                        WAIVED
                      </Badge>
                    )}
                  </span>
                  <span className={waiveEnrollmentFee ? "line-through text-muted-foreground/40" : ""}>
                    ${enrollmentFee.toFixed(2)}
                  </span>
                </div>
                {waiveEnrollmentFee && (
                  <div className="flex justify-between text-green-700 text-xs font-medium">
                    <span>Enrollment fee discount</span>
                    <span>-${enrollmentFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground border-t pt-1 mt-1">
                  <span>Total due today</span>
                  <span>${effectiveTotal.toFixed(2)}</span>
                </div>
                {deferTuition ? (
                  <p className="text-xs text-blue-600 font-medium">
                    ${monthlyPrice.toFixed(2)} tuition will be auto-charged on {deferredTuitionDate || "the selected date"}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/70">
                    Then ${monthlyPrice.toFixed(2)}/mo recurring
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedPackageId || !customerName || !customerEmail || !customerPhone || (deferTuition && !deferredTuitionDate)}
                onClick={handleContinueToPayment}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-2 space-y-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setStep("form")}>
              ← Back to details
            </Button>
            {enrollmentData && (
              <FluidPayEnrollmentForm
                enrollmentData={enrollmentData}
                onSuccess={() => {
                  handleClose();
                  onEnrolled();
                }}
                onError={() => {
                  // Stay on payment step so staff can retry
                }}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminEnrollments() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: enrollments, isLoading, error } = trpc.member.getAllEnrollments.useQuery();
  const [showNewEnrollment, setShowNewEnrollment] = useState(false);

  // Redirect if not admin
  if (!authLoading && (!user || user.role !== "admin")) {
    setLocation("/");
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Error Loading Enrollments</h2>
          <p className="text-gray-600 text-center">{error.message}</p>
        </Card>
      </div>
    );
  }

  const totalEnrollments = enrollments?.length || 0;
  const activeSubscriptions = enrollments?.filter((e) => e.subscriptionActive).length || 0;
  const totalRevenue =
    enrollments?.reduce((sum, e) => {
      const monthly = parseFloat(e.packageMonthlyPrice || "0");
      return sum + monthly;
    }, 0) || 0;

  const getStatusBadge = (status: string, subscriptionStatus: string | null) => {
    if (status === "active" && subscriptionStatus === "active") {
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (status === "active" && subscriptionStatus === "past_due") {
      return (
        <Badge className="bg-yellow-500">
          <AlertCircle className="h-3 w-3 mr-1" />
          Past Due
        </Badge>
      );
    }
    if (status === "cancelled" || subscriptionStatus === "canceled") {
      return (
        <Badge className="bg-red-500">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    }
    if (subscriptionStatus === "trialing") {
      return <Badge className="bg-blue-500">Trial</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <AdminLayout>
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">Student Enrollments</h1>
              <p className="text-gray-600 mt-1">Manage all student enrollments and subscriptions</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowNewEnrollment(true)}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                New Enrollment
              </Button>
              <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
                <p className="text-3xl font-bold text-gray-900">{totalEnrollments}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
                <p className="text-3xl font-bold text-green-600">{activeSubscriptions}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Enrollments Table */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b bg-white flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">All Enrollments</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewEnrollment(true)}
              className="flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          {enrollments && enrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Monthly Price</TableHead>
                    <TableHead>Belt Rank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Agreement</TableHead>
                    <TableHead>Membership State</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.customerName}</TableCell>
                      <TableCell>{enrollment.customerEmail}</TableCell>
                      <TableCell>{enrollment.customerPhone}</TableCell>
                      <TableCell>{enrollment.packageName || "N/A"}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${parseFloat(enrollment.packageMonthlyPrice || "0").toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{enrollment.beltRank}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(enrollment.status, enrollment.subscriptionStatus)}
                      </TableCell>
                      <TableCell>
                        {enrollment.nextPaymentDate
                          ? format(new Date(enrollment.nextPaymentDate), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(enrollment.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {enrollment.agreementSignedAt ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              Signed
                            </span>
                            <span className="text-xs text-gray-500">
                              {enrollment.agreementSignature}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(enrollment.agreementSignedAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-xs">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            Not signed
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.isFrozen ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-blue-700 text-xs font-medium">
                              <span>❄️</span> Frozen
                            </span>
                            {enrollment.freezeStartDate && enrollment.freezeEndDate && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(enrollment.freezeStartDate), "MMM d")} – {format(new Date(enrollment.freezeEndDate), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        ) : enrollment.cancellationRequestedAt ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-amber-700 text-xs font-medium">
                              <span>⏳</span> Cancelling
                            </span>
                            {enrollment.cancellationEffectiveDate && (
                              <span className="text-xs text-gray-500">
                                Final bill: {format(new Date(enrollment.cancellationEffectiveDate), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Active</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.discountApplied?.startsWith("enrollment_fee_waived") && (
                          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs whitespace-nowrap">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            Fee Waived
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrollments Yet</h3>
              <p className="text-gray-600 mb-4">
                Student enrollments will appear here once they complete the signup process.
              </p>
              <Button onClick={() => setShowNewEnrollment(true)} className="flex items-center gap-2 mx-auto">
                <PlusCircle className="h-4 w-4" />
                Create First Enrollment
              </Button>
            </div>
          )}
        </Card>

        {/* Subscription Details */}
        {enrollments && enrollments.length > 0 && (
          <Card className="mt-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Details</h2>
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{enrollment.customerName}</p>
                      <p className="text-sm text-gray-600">{enrollment.customerEmail}</p>
                      {enrollment.discountApplied?.startsWith("enrollment_fee_waived") && (
                        <Badge variant="outline" className="mt-1 text-green-700 border-green-300 bg-green-50 text-xs">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          Enrollment fee waived
                          {enrollment.discountApplied.includes(":") && (
                            <span className="ml-1 font-normal">
                              — {enrollment.discountApplied.split(":")[1]}
                            </span>
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      {enrollment.stripeSubscriptionId ? (
                        <>
                          <p className="text-sm text-gray-600">Subscription ID</p>
                          <p className="text-xs font-mono text-gray-500">
                            {enrollment.stripeSubscriptionId}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No subscription</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-600">Down Payment</p>
                      <p className="font-semibold">
                        ${parseFloat(enrollment.downPaymentAmount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Remaining Balance</p>
                      <p className="font-semibold">
                        ${parseFloat(enrollment.remainingBalance).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Payments Left</p>
                      <p className="font-semibold">{enrollment.monthlyPaymentsRemaining}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Subscription Status</p>
                      <p className="font-semibold capitalize">
                        {enrollment.subscriptionStatus || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Staff Enrollment Dialog */}
      <StaffEnrollmentDialog
        open={showNewEnrollment}
        onClose={() => setShowNewEnrollment(false)}
        onEnrolled={() => {
          utils.member.getAllEnrollments.invalidate();
        }}
      />
    </div>
    </AdminLayout>
  );
}
