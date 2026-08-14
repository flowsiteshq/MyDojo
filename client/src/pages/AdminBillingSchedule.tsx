import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CreditCard,
  Download,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  ChevronRight,
  MessageSquare,
  Zap,
  Plus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentTx = {
  date: string;
  amount: number;
  description: string;
  txId: string;
};

type BillingRow = {
  id: number;
  studentName: string | null;
  parentName: string | null;
  phone: string | null;
  email: string | null;
  programName: string;
  startDate: Date | null;
  billingDay: number | null;
  paymentMethod: string;
  enrollmentStatus: string;
  fluidpaySubscriptionId: string | null;
  stripeSubscriptionId: string | null;
  subAmount: number | null;
  subStatus: string | null;
  nextBillDate: string | null;
  paidThisMonth: boolean;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  lastPaymentDescription: string | null;
  paymentHistory: PaymentTx[];
  totalSuccessfulPayments: number;
  totalFailedPayments: number;
  remainingBalance: string | number | null;
  monthlyPaymentsRemaining: number | null;
  isFrozen: number | boolean | null;
  downPaymentAmount: string | number | null;
  cancellationRequestedAt: Date | null;
  cancellationEffectiveDate: Date | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPaymentStatus(row: BillingRow): "paid" | "overdue" | "due-soon" | "unpaid" | "cancelled" | "no-billing" | "pending" {
  if (row.enrollmentStatus === "cancelled" || row.enrollmentStatus === "inactive") return "cancelled";
  if (row.enrollmentStatus === "pending") return "pending";
  if (row.isFrozen) return "unpaid";
  if (row.paidThisMonth) return "paid";
  if (row.subStatus === "failed") return "overdue";
  if (!row.nextBillDate && row.paymentMethod === "manual") return "no-billing";
  if (row.nextBillDate) {
    const daysUntil = Math.ceil((new Date(row.nextBillDate).getTime() - Date.now()) / 86400000);
    if (daysUntil < 0) return "overdue";
    if (daysUntil <= 7) return "due-soon";
  }
  return "unpaid";
}

const STATUS_CONFIG = {
  paid:        { label: "Paid",         color: "bg-green-100 text-green-700",  rowBg: "",                    dot: "bg-green-500" },
  overdue:     { label: "Overdue",      color: "bg-red-100 text-red-700",      rowBg: "bg-red-50/40",        dot: "bg-red-500" },
  "due-soon":  { label: "Due Soon",     color: "bg-amber-100 text-amber-700",  rowBg: "bg-amber-50/40",      dot: "bg-amber-500" },
  unpaid:      { label: "Unpaid",       color: "bg-yellow-100 text-yellow-700",rowBg: "",                    dot: "bg-yellow-400" },
  cancelled:   { label: "Cancelled",    color: "bg-gray-100 text-gray-500",    rowBg: "opacity-60",          dot: "bg-gray-400" },
  "no-billing":{ label: "No Billing",   color: "bg-orange-100 text-orange-700",rowBg: "bg-orange-50/30",     dot: "bg-orange-400" },
  pending:     { label: "Pending",      color: "bg-purple-100 text-purple-700",rowBg: "bg-purple-50/30",     dot: "bg-purple-500" },
};

function fmt(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `$${Number(amount).toFixed(2)}`;
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMonth(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const FILTER_TABS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "⚠️ Pending" },
  { key: "paid",        label: "Paid This Month" },
  { key: "unpaid",      label: "Unpaid" },
  { key: "overdue",     label: "Overdue" },
  { key: "due-soon",    label: "Due Soon" },
  { key: "cancelled",   label: "Cancelled" },
  { key: "no-billing",  label: "No Billing" },
];

// ── Create Subscription Dialog ────────────────────────────────────────────────
function CreateSubscriptionDialog({
  enrollment,
  open,
  onClose,
  onSuccess,
}: {
  enrollment: BillingRow | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-600" />
            Create Missing Subscription
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertTriangle className="inline w-4 h-4 mr-1" />
            This legacy enrollment needs a secure payment-method update before recurring billing can resume. Use the member’s Account payment update flow; new subscriptions are created through secure checkout only.
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Student</p>
            <p className="text-sm text-muted-foreground">{enrollment.studentName || enrollment.parentName}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Program</p>
            <p className="text-sm text-muted-foreground">{enrollment.programName}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminBillingSchedule() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<BillingRow | null>(null);
  const [createSubFor, setCreateSubFor] = useState<BillingRow | null>(null);

  const { data, isLoading, refetch, isFetching } = trpc.admin.getBillingSchedule.useQuery(undefined, {
    staleTime: 2 * 60_000,
  });

  const sendSms = trpc.admin.sendPaymentReminderSms.useMutation({
    onSuccess: () => toast.success("SMS reminder sent successfully!"),
    onError: (err) => toast.error(err.message || "Failed to send SMS"),
  });

  const enriched = useMemo(() => {
    if (!data) return [];
    return (data as BillingRow[]).map(row => ({ ...row, _status: getPaymentStatus(row) }));
  }, [data]);

  const filtered = useMemo(() => {
    return enriched.filter(row => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (row.studentName || "").toLowerCase().includes(q) ||
        (row.parentName || "").toLowerCase().includes(q) ||
        (row.phone || "").includes(q) ||
        (row.email || "").toLowerCase().includes(q) ||
        (row.programName || "").toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || row._status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [enriched, search, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const active = enriched.filter(r => r.enrollmentStatus === "active");
    const paid = active.filter(r => r.paidThisMonth);
    const overdue = active.filter(r => r._status === "overdue");
    const unpaid = active.filter(r => !r.paidThisMonth);
    const revenue = paid.reduce((s, r) => s + (r.lastPaymentAmount || r.subAmount || 0), 0);
    const missingSub = enriched.filter(r =>
      r.enrollmentStatus === "active" &&
      !r.stripeSubscriptionId
    );
    const pendingCount = enriched.filter(r => r.enrollmentStatus === "pending");
    return { total: enriched.length, active: active.length, paid: paid.length, overdue: overdue.length, unpaid: unpaid.length, revenue, missingSub: missingSub.length, pendingCount: pendingCount.length };
  }, [enriched]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Student","Parent","Phone","Email","Program","Enrollment","Payment Status","Paid This Month","Last Payment Date","Last Payment Amount","Next Due Date","Monthly Rate","Payments Made","Payments Left","Remaining Balance"];
    const rows = filtered.map(r => [
      r.studentName ?? "", r.parentName ?? "", r.phone ?? "", r.email ?? "",
      r.programName, r.enrollmentStatus, r._status,
      r.paidThisMonth ? "Yes" : "No",
      r.lastPaymentDate ? fmtDate(r.lastPaymentDate) : "",
      r.lastPaymentAmount ? fmt(r.lastPaymentAmount) : "",
      r.nextBillDate ? fmtDate(r.nextBillDate) : "",
      r.subAmount ? fmt(r.subAmount) : "",
      r.totalSuccessfulPayments, r.monthlyPaymentsRemaining ?? "",
      parseFloat(String(r.remainingBalance || 0)).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `billing-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Billing & Payments</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Real transaction data — who paid, what program, what month, how much, and next due date.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* ── Billing Health Alerts ── */}
        {(stats.missingSub > 0 || stats.pendingCount > 0) && (
          <div className="space-y-2">
            {stats.pendingCount > 0 && (
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-purple-900">
                    {stats.pendingCount} enrollment{stats.pendingCount > 1 ? "s" : ""} in PENDING status
                  </p>
                  <p className="text-sm text-purple-700 mt-0.5">
                    These students were charged but their recurring subscription failed to create. Use the "Create Sub" button on each row to fix them.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 shrink-0"
                  onClick={() => setFilterStatus("pending")}
                >
                  View {stats.pendingCount} pending
                </Button>
              </div>
            )}
            {stats.missingSub > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900">
                    {stats.missingSub} active member{stats.missingSub > 1 ? "s" : ""} with NO recurring subscription
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    These enrollments are active but have no Stripe subscription. They will not be billed automatically until a secure payment method is updated.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                  onClick={() => { setSearch(""); setFilterStatus("all"); }}
                >
                  View all
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg shrink-0"><TrendingUp className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xl font-bold text-green-600">{fmt(stats.revenue)}</p>
                  <p className="text-xs text-muted-foreground">Collected this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg shrink-0"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xl font-bold text-green-700">{stats.paid}</p>
                  <p className="text-xs text-muted-foreground">Paid this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg shrink-0"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
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
                <div className="p-2 bg-yellow-100 rounded-lg shrink-0"><Users className="h-5 w-5 text-yellow-600" /></div>
                <div>
                  <p className="text-xl font-bold text-yellow-700">{stats.unpaid}</p>
                  <p className="text-xs text-muted-foreground">Not yet paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map(tab => {
              const count = tab.key === "all" ? enriched.length : enriched.filter(r => r._status === tab.key).length;
              return (
                <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filterStatus === tab.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {tab.label} <span className="ml-1 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
          <Input placeholder="Search name, phone, program…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs h-8 text-sm ml-auto" />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading payment data…
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
                      <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Student</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Program</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Last Payment</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Month Paid</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Amount Paid</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Monthly Rate</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Next Due</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Pmts Made</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(row => {
                      const cfg = STATUS_CONFIG[row._status as keyof typeof STATUS_CONFIG];
                      const isMissingSub = row.enrollmentStatus === "active" && !row.stripeSubscriptionId;
                      const isPending = row.enrollmentStatus === "pending";
                      return (
                        <tr key={row.id} className={`border-b hover:bg-muted/20 ${cfg.rowBg}`}>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                              {(isMissingSub || isPending) && (
                                <div className="flex items-center gap-1 text-xs text-amber-700">
                                  <AlertTriangle className="w-3 h-3" />
                                  No subscription
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <div className="font-medium text-gray-900">{row.studentName || row.parentName || "—"}</div>
                            {row.parentName && row.parentName !== row.studentName && (
                              <div className="text-xs text-gray-400">{row.parentName}</div>
                            )}
                            {row.phone && <div className="text-xs text-gray-400">{row.phone}</div>}
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <span className="text-gray-700">{row.programName || "—"}</span>
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <span className="text-gray-700">{fmtDate(row.lastPaymentDate)}</span>
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <span className="text-gray-700">{fmtMonth(row.lastPaymentDate)}</span>
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <span className={`font-semibold ${row.lastPaymentAmount ? "text-green-700" : "text-gray-400"}`}>
                              {fmt(row.lastPaymentAmount)}
                            </span>
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <span className="text-gray-700">{fmt(row.subAmount)}/mo</span>
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => setSelected(row)}>
                            <span className={`text-gray-700 ${row.nextBillDate && new Date(row.nextBillDate) < new Date() ? "text-red-600 font-medium" : ""}`}>
                              {fmtDate(row.nextBillDate)}
                            </span>
                          </td>
                          <td className="p-3 text-center cursor-pointer" onClick={() => setSelected(row)}>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {row.totalSuccessfulPayments}
                            </span>
                          </td>
                          {/* Action buttons */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              {/* Create Subscription button — shown for pending or active-but-missing-sub */}
                              {(isPending || isMissingSub) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                                  title="Recover Stripe subscription"
                                  onClick={() => setCreateSubFor(row)}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Create Sub
                                </Button>
                              )}
                              {/* Send SMS Reminder */}
                              {row.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                  title="Send SMS payment reminder"
                                  disabled={sendSms.isPending}
                                  onClick={() => sendSms.mutate({ enrollmentId: row.id })}
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  SMS
                                </Button>
                              )}
                              {/* View details */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => setSelected(row)}
                              >
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </Button>
                            </div>
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
      </div>

      {/* Payment History Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              {selected?.studentName || selected?.parentName} — Payment History
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              {/* Billing health warning */}
              {(selected.enrollmentStatus === "pending" || (!selected.stripeSubscriptionId && selected.enrollmentStatus === "active")) && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">No recurring subscription found</p>
                    <p className="mt-0.5">This enrollment has no Stripe subscription. The member will not be billed automatically until their secure payment method is updated.</p>
                    <Button
                      size="sm"
                      className="mt-2 bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
                      onClick={() => { setSelected(null); setCreateSubFor(selected); }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Subscription
                    </Button>
                  </div>
                </div>
              )}

              {/* Member summary */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 text-sm">
                <div><span className="text-gray-500">Program:</span> <span className="font-medium ml-1">{selected.programName}</span></div>
                <div><span className="text-gray-500">Monthly Rate:</span> <span className="font-medium ml-1">{fmt(selected.subAmount)}/mo</span></div>
                <div><span className="text-gray-500">Next Due:</span> <span className="font-medium ml-1">{fmtDate(selected.nextBillDate)}</span></div>
                <div><span className="text-gray-500">Remaining Balance:</span> <span className="font-medium ml-1">{fmt(parseFloat(String(selected.remainingBalance || 0)))}</span></div>
                <div><span className="text-gray-500">Payments Made:</span> <span className="font-medium text-green-700 ml-1">{selected.totalSuccessfulPayments}</span></div>
                <div><span className="text-gray-500">Payments Left:</span> <span className="font-medium ml-1">{selected.monthlyPaymentsRemaining ?? "—"}</span></div>
                <div><span className="text-gray-500">Stripe Subscription:</span> <span className="font-mono text-xs ml-1 text-gray-600">{selected.stripeSubscriptionId || "None"}</span></div>
                <div><span className="text-gray-500">Sub Status:</span> <span className={`font-medium ml-1 ${selected.subStatus === "active" ? "text-green-700" : selected.subStatus === "failed" ? "text-red-600" : "text-gray-600"}`}>{selected.subStatus || "—"}</span></div>
                {selected.totalFailedPayments > 0 && (
                  <div className="col-span-2 text-red-600">
                    <AlertTriangle className="inline w-3.5 h-3.5 mr-1" />
                    {selected.totalFailedPayments} failed payment{selected.totalFailedPayments > 1 ? "s" : ""} on record
                  </div>
                )}
              </div>

              {/* Quick actions */}
              {selected.phone && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Quick Actions</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-700 border-blue-300 hover:bg-blue-50"
                      disabled={sendSms.isPending}
                      onClick={() => sendSms.mutate({ enrollmentId: selected.id })}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Send SMS Reminder
                    </Button>
                    <a href={`tel:${selected.phone}`}>
                      <Button size="sm" variant="outline">
                        Call {selected.phone}
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Transaction history */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Transaction History
                </h3>
                {selected.paymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg text-sm">
                    No payment transactions found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selected.paymentHistory.map((tx, i) => (
                      <div key={tx.txId || i} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="font-medium text-gray-900">{fmtDate(tx.date)}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {fmtMonth(tx.date)}
                            </span>
                          </div>
                          {tx.description && (
                            <div className="text-xs text-gray-500 mt-0.5 ml-6 truncate max-w-xs">{tx.description}</div>
                          )}
                        </div>
                        <span className="font-semibold text-green-700 shrink-0">{fmt(tx.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Subscription Dialog */}
      <CreateSubscriptionDialog
        enrollment={createSubFor}
        open={!!createSubFor}
        onClose={() => setCreateSubFor(null)}
        onSuccess={() => refetch()}
      />
    </AdminLayout>
  );
}
