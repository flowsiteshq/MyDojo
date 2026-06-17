import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Download,
  Clock,
  CalendarClock,
  Ban,
} from "lucide-react";
import { useState, useMemo } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Derive a human-readable payment status for a billing row */
function getPaymentStatus(row: BillingRow): "paid" | "overdue" | "due-soon" | "upcoming" | "cancelled" | "no-billing" {
  if (row.enrollmentStatus === "cancelled" || row.enrollmentStatus === "inactive") return "cancelled";
  if (row.subStatus === "failed") return "overdue";
  if (!row.nextBillDate && row.paymentMethod === "manual") return "no-billing";

  if (row.nextBillDate) {
    const next = new Date(row.nextBillDate);
    const now = new Date();
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "due-soon";
    if (diffDays <= 30) return "upcoming";
    return "paid"; // next bill is > 30 days away → current month is paid
  }

  // Stripe or manual with no next date
  return "upcoming";
}

const PAYMENT_STATUS_CONFIG = {
  paid:       { label: "Paid",        bg: "bg-green-100 text-green-700",  icon: CheckCircle2,  rowBg: "" },
  overdue:    { label: "Overdue",     bg: "bg-red-100 text-red-700",      icon: XCircle,       rowBg: "bg-red-50" },
  "due-soon": { label: "Due Soon",    bg: "bg-amber-100 text-amber-700",  icon: Clock,         rowBg: "bg-amber-50" },
  upcoming:   { label: "Upcoming",    bg: "bg-blue-100 text-blue-700",    icon: CalendarClock, rowBg: "" },
  cancelled:  { label: "Cancelled",   bg: "bg-gray-100 text-gray-500",    icon: Ban,           rowBg: "bg-gray-50 opacity-60" },
  "no-billing":{ label: "No Billing", bg: "bg-orange-100 text-orange-700",icon: AlertTriangle, rowBg: "bg-orange-50" },
};

const ENROLLMENT_STATUS_BADGE: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  pending:   "bg-blue-100 text-blue-700",
  inactive:  "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
  failed:    "bg-red-100 text-red-600",
};

const METHOD_BADGE: Record<string, string> = {
  fluidpay: "bg-blue-100 text-blue-700",
  stripe:   "bg-purple-100 text-purple-700",
  manual:   "bg-gray-100 text-gray-600",
};

type BillingRow = {
  id: number;
  studentName: string | null;
  parentName: string | null;
  phone: string | null;
  email: string | null;
  startDate: Date | null;
  billingDay: number | null;
  paymentMethod: string;
  enrollmentStatus: string;
  fluidpaySubscriptionId: string | null;
  stripeSubscriptionId: string | null;
  subAmount: number | null;
  subStatus: string | null;
  nextBillDate: string | null;
  remainingBalance: string | number | null;
  monthlyPaymentsRemaining: number | null;
  isFrozen: number | boolean | null;
  downPaymentAmount: string | number | null;
  cancellationRequestedAt: Date | null;
  cancellationEffectiveDate: Date | null;
};

const FILTER_TABS = [
  { key: "all",        label: "All Members" },
  { key: "overdue",    label: "Overdue" },
  { key: "due-soon",   label: "Due Soon (7 days)" },
  { key: "upcoming",   label: "Upcoming" },
  { key: "paid",       label: "Paid" },
  { key: "cancelled",  label: "Cancelled / Inactive" },
  { key: "no-billing", label: "No Billing Setup" },
];

export default function AdminBillingSchedule() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");

  const { data, isLoading, refetch, isFetching } = trpc.admin.getBillingSchedule.useQuery(undefined, {
    staleTime: 60_000,
  });

  const enriched = useMemo(() => {
    if (!data) return [];
    return (data as BillingRow[]).map((row) => ({
      ...row,
      paymentStatus: getPaymentStatus(row),
    }));
  }, [data]);

  const filtered = useMemo(() => {
    return enriched.filter((row) => {
      const matchSearch =
        !search ||
        (row.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
        (row.parentName || "").toLowerCase().includes(search.toLowerCase()) ||
        (row.phone || "").includes(search) ||
        (row.email || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || row.paymentStatus === filterStatus;
      const matchMethod = filterMethod === "all" || row.paymentMethod === filterMethod;
      return matchSearch && matchStatus && matchMethod;
    });
  }, [enriched, search, filterStatus, filterMethod]);

  // Summary stats
  const stats = useMemo(() => {
    const overdue   = enriched.filter((r) => r.paymentStatus === "overdue").length;
    const dueSoon   = enriched.filter((r) => r.paymentStatus === "due-soon").length;
    const paid      = enriched.filter((r) => r.paymentStatus === "paid").length;
    const noBilling = enriched.filter((r) => r.paymentStatus === "no-billing").length;
    const seen = new Set<string>();
    const mrr = enriched.reduce((sum, r) => {
      if (r.subAmount && r.fluidpaySubscriptionId && !seen.has(r.fluidpaySubscriptionId)) {
        seen.add(r.fluidpaySubscriptionId);
        return sum + r.subAmount;
      }
      return sum;
    }, 0);
    return { overdue, dueSoon, paid, noBilling, mrr };
  }, [enriched]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Student", "Parent", "Phone", "Email", "Enrollment Status", "Payment Status", "Bill Day", "Payment Method", "Sub Status", "Monthly $", "Next Bill Date", "Remaining Balance", "Payments Left", "Frozen"];
    const rows = filtered.map((r) => [
      r.studentName ?? "",
      r.parentName ?? "",
      r.phone ?? "",
      r.email ?? "",
      r.enrollmentStatus,
      r.paymentStatus,
      r.billingDay ?? "N/A",
      r.paymentMethod,
      r.subStatus ?? "N/A",
      r.subAmount ? `$${r.subAmount.toFixed(2)}` : "N/A",
      r.nextBillDate ? new Date(r.nextBillDate).toLocaleDateString() : "N/A",
      `$${parseFloat(String(r.remainingBalance || 0)).toFixed(2)}`,
      r.monthlyPaymentsRemaining ?? 0,
      r.isFrozen ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billing-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Billing Schedule</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              All members — who paid, who hasn't, and upcoming due dates.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg shrink-0"><DollarSign className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xl font-bold text-green-600">${stats.mrr.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Monthly recurring</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg shrink-0"><XCircle className="h-5 w-5 text-red-600" /></div>
                <div>
                  <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue / Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0"><Clock className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{stats.dueSoon}</p>
                  <p className="text-xs text-muted-foreground">Due within 7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg shrink-0"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
                <div>
                  <p className="text-xl font-bold text-orange-600">{stats.noBilling}</p>
                  <p className="text-xs text-muted-foreground">No billing setup</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Payment status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map((tab) => {
              const count = tab.key === "all"
                ? enriched.length
                : enriched.filter((r) => r.paymentStatus === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filterStatus === tab.key
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {tab.label} <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search + method filter */}
          <div className="flex gap-3 flex-wrap items-center">
            <Input
              placeholder="Search name, phone, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-8 text-sm"
            />
            <div className="flex gap-1">
              {["all", "fluidpay", "stripe", "manual"].map((m) => (
                <Button
                  key={m}
                  variant={filterMethod === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterMethod(m)}
                  className="h-8 text-xs capitalize"
                >
                  {m === "all" ? "All Methods" : m === "fluidpay" ? "FluidPay" : m === "stripe" ? "Stripe" : "Manual"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading billing data… (may take 15–30 seconds for FluidPay subscriptions)
              </div>
            ) : !filtered.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No members match your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Payment Status</th>
                      <th className="text-left p-3 font-medium">Student / Member</th>
                      <th className="text-left p-3 font-medium">Contact</th>
                      <th className="text-left p-3 font-medium">Enrollment</th>
                      <th className="text-left p-3 font-medium">Method</th>
                      <th className="text-left p-3 font-medium">Monthly $</th>
                      <th className="text-left p-3 font-medium">Next Due Date</th>
                      <th className="text-left p-3 font-medium">Bill Day</th>
                      <th className="text-left p-3 font-medium">Remaining Balance</th>
                      <th className="text-left p-3 font-medium">Pmts Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const cfg = PAYMENT_STATUS_CONFIG[row.paymentStatus];
                      const Icon = cfg.icon;
                      const nextDate = row.nextBillDate ? new Date(row.nextBillDate) : null;
                      const now = new Date();
                      const daysUntil = nextDate ? Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      return (
                        <tr key={row.id} className={`border-b hover:bg-muted/20 ${cfg.rowBg}`}>
                          {/* Payment Status */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`h-3.5 w-3.5 ${
                                row.paymentStatus === "paid" ? "text-green-500" :
                                row.paymentStatus === "overdue" ? "text-red-500" :
                                row.paymentStatus === "due-soon" ? "text-amber-500" :
                                row.paymentStatus === "no-billing" ? "text-orange-500" :
                                "text-gray-400"
                              }`} />
                              <Badge className={`text-xs ${cfg.bg}`}>{cfg.label}</Badge>
                            </div>
                          </td>
                          {/* Student */}
                          <td className="p-3">
                            <div className="font-medium">{row.studentName || row.parentName || "—"}</div>
                            {row.studentName && row.parentName && row.studentName !== row.parentName && (
                              <div className="text-xs text-muted-foreground">Parent: {row.parentName}</div>
                            )}
                          </td>
                          {/* Contact */}
                          <td className="p-3">
                            <div className="text-xs text-muted-foreground">{row.phone || "—"}</div>
                            <div className="text-xs text-muted-foreground">{row.email || "—"}</div>
                          </td>
                          {/* Enrollment Status */}
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <Badge className={`text-xs w-fit ${ENROLLMENT_STATUS_BADGE[row.enrollmentStatus] || "bg-gray-100 text-gray-600"}`}>
                                {row.enrollmentStatus.charAt(0).toUpperCase() + row.enrollmentStatus.slice(1)}
                              </Badge>
                              {row.isFrozen ? <Badge className="text-xs w-fit bg-blue-100 text-blue-700">Frozen</Badge> : null}
                            </div>
                          </td>
                          {/* Method */}
                          <td className="p-3">
                            <Badge className={`text-xs ${METHOD_BADGE[row.paymentMethod] || "bg-gray-100 text-gray-600"}`}>
                              {row.paymentMethod === "fluidpay" ? "FluidPay" : row.paymentMethod === "stripe" ? "Stripe" : "Manual"}
                            </Badge>
                          </td>
                          {/* Monthly $ */}
                          <td className="p-3 font-semibold">
                            {row.subAmount != null ? (
                              <span className="text-green-700">${row.subAmount.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Next Due Date */}
                          <td className="p-3">
                            {nextDate ? (
                              <div>
                                <div className={`font-medium text-sm ${daysUntil !== null && daysUntil < 0 ? "text-red-600" : daysUntil !== null && daysUntil <= 7 ? "text-amber-600" : ""}`}>
                                  {nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {daysUntil !== null && daysUntil < 0
                                    ? `${Math.abs(daysUntil)} days overdue`
                                    : daysUntil === 0
                                    ? "Due today"
                                    : daysUntil !== null
                                    ? `In ${daysUntil} days`
                                    : ""}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          {/* Bill Day */}
                          <td className="p-3 font-mono text-center">
                            {row.billingDay ? (
                              <span className="font-semibold">{row.billingDay}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Remaining Balance */}
                          <td className="p-3">
                            {parseFloat(String(row.remainingBalance || 0)) > 0 ? (
                              <span className="font-semibold">${parseFloat(String(row.remainingBalance)).toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">$0.00</span>
                            )}
                          </td>
                          {/* Payments Left */}
                          <td className="p-3 text-center text-muted-foreground">
                            {row.monthlyPaymentsRemaining ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="text-xs text-muted-foreground space-y-1 border rounded-lg p-4 bg-muted/20">
          <p className="font-semibold text-foreground mb-2">Legend</p>
          <p><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> <strong>Paid</strong></span> — Next bill date is more than 30 days away; current month is settled.</p>
          <p><span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> <strong>Overdue</strong></span> — Subscription failed or next bill date has already passed.</p>
          <p><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" /> <strong>Due Soon</strong></span> — Payment due within the next 7 days.</p>
          <p><span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3 text-blue-500" /> <strong>Upcoming</strong></span> — Payment due in 8–30 days.</p>
          <p><span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-orange-500" /> <strong>No Billing</strong></span> — Active member with no FluidPay or Stripe subscription; must collect manually.</p>
          <p><span className="inline-flex items-center gap-1"><Ban className="h-3 w-3 text-gray-400" /> <strong>Cancelled / Inactive</strong></span> — Membership ended or deactivated.</p>
          <p className="mt-2"><strong>Bill Day</strong> = day of the month the recurring charge fires (based on enrollment start date).</p>
        </div>
      </div>
    </AdminLayout>
  );
}
