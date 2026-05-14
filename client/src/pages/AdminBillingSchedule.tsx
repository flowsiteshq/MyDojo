import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Download,
} from "lucide-react";
import { useState, useMemo } from "react";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  paused: "bg-yellow-100 text-yellow-700",
  pending: "bg-blue-100 text-blue-700",
};

const METHOD_BADGE: Record<string, string> = {
  fluidpay: "bg-blue-100 text-blue-700",
  stripe: "bg-purple-100 text-purple-700",
  manual: "bg-gray-100 text-gray-600",
};

export default function AdminBillingSchedule() {
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("all");

  const { data, isLoading, refetch, isFetching } = trpc.admin.getBillingSchedule.useQuery(undefined, {
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((row) => {
      const matchSearch =
        !search ||
        (row.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
        (row.parentName || "").toLowerCase().includes(search.toLowerCase()) ||
        (row.phone || "").includes(search);
      const matchMethod = filterMethod === "all" || row.paymentMethod === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [data, search, filterMethod]);

  // Summary stats
  const totalMonthly = useMemo(() => {
    if (!data) return 0;
    const seen = new Set<string>();
    return data.reduce((sum, row) => {
      if (row.subAmount && row.fluidpaySubscriptionId) {
        if (!seen.has(row.fluidpaySubscriptionId)) {
          seen.add(row.fluidpaySubscriptionId);
          return sum + row.subAmount;
        }
        return sum;
      }
      return sum;
    }, 0);
  }, [data]);

  const noSubCount = useMemo(() => data?.filter((r) => r.paymentMethod === "manual" && parseFloat(String(r.remainingBalance || 0)) > 0).length ?? 0, [data]);
  const failedCount = useMemo(() => data?.filter((r) => r.subStatus === "failed").length ?? 0, [data]);
  const frozenCount = useMemo(() => data?.filter((r) => r.isFrozen).length ?? 0, [data]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Student", "Parent", "Phone", "Email", "Bill Day", "Payment Method", "Sub Status", "Monthly $", "Next Bill Date", "Remaining Balance", "Payments Left", "Frozen", "FluidPay Sub ID"];
    const rows = filtered.map((r) => [
      r.studentName,
      r.parentName,
      r.phone,
      r.email,
      r.billingDay ?? "N/A",
      r.paymentMethod,
      r.subStatus ?? "N/A",
      r.subAmount ? `$${r.subAmount.toFixed(2)}` : "N/A",
      r.nextBillDate ? new Date(r.nextBillDate).toLocaleDateString() : "N/A",
      `$${parseFloat(String(r.remainingBalance || 0)).toFixed(2)}`,
      r.monthlyPaymentsRemaining ?? 0,
      r.isFrozen ? "Yes" : "No",
      r.fluidpaySubscriptionId ?? "",
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing Schedule</h1>
            <p className="text-muted-foreground text-sm mt-1">
              All active students — billing dates, payment methods, and subscription status.
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">${totalMonthly.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Monthly recurring</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">{failedCount}</p>
                  <p className="text-xs text-muted-foreground">Failed payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-yellow-600">{noSubCount}</p>
                  <p className="text-xs text-muted-foreground">No auto-billing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{data?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Active students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search student, parent, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-1">
            {["all", "fluidpay", "stripe", "manual"].map((m) => (
              <Button
                key={m}
                variant={filterMethod === m ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMethod(m)}
                className="capitalize"
              >
                {m === "all" ? "All" : m === "fluidpay" ? "FluidPay" : m === "stripe" ? "Stripe" : "Manual / No Sub"}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading billing data from FluidPay… (this may take 15–30 seconds)
              </div>
            ) : !filtered.length ? (
              <div className="py-12 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No students match your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Bill Day</th>
                      <th className="text-left p-3 font-medium">Student</th>
                      <th className="text-left p-3 font-medium">Parent / Account</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Payment Method</th>
                      <th className="text-left p-3 font-medium">Sub Status</th>
                      <th className="text-left p-3 font-medium">Monthly $</th>
                      <th className="text-left p-3 font-medium">Next Bill Date</th>
                      <th className="text-left p-3 font-medium">Remaining Balance</th>
                      <th className="text-left p-3 font-medium">Pmts Left</th>
                      <th className="text-left p-3 font-medium">Frozen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const hasIssue = row.subStatus === "failed" || (row.paymentMethod === "manual" && parseFloat(String(row.remainingBalance || 0)) > 0);
                      return (
                        <tr key={row.id} className={`border-b hover:bg-muted/30 ${hasIssue ? "bg-red-50" : ""}`}>
                          <td className="p-3 font-mono font-semibold">
                            {row.billingDay ? `${row.billingDay}` : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="p-3 font-medium">{row.studentName || "—"}</td>
                          <td className="p-3 text-muted-foreground">{row.parentName || "—"}</td>
                          <td className="p-3 text-muted-foreground">{row.phone || "—"}</td>
                          <td className="p-3">
                            <Badge className={`text-xs ${METHOD_BADGE[row.paymentMethod] || "bg-gray-100 text-gray-600"}`}>
                              {row.paymentMethod === "fluidpay" ? "FluidPay" : row.paymentMethod === "stripe" ? "Stripe" : "Manual"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {row.subStatus ? (
                              <div className="flex items-center gap-1">
                                {row.subStatus === "active" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                ) : row.subStatus === "failed" ? (
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                ) : (
                                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                                )}
                                <Badge className={`text-xs ${STATUS_BADGE[row.subStatus] || "bg-gray-100 text-gray-600"}`}>
                                  {row.subStatus}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">No sub</span>
                            )}
                          </td>
                          <td className="p-3 font-semibold">
                            {row.subAmount != null ? (
                              <span className="text-green-700">${row.subAmount.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {row.nextBillDate ? new Date(row.nextBillDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </td>
                          <td className="p-3">
                            <span className={parseFloat(String(row.remainingBalance || 0)) > 0 ? "font-semibold" : "text-muted-foreground"}>
                              ${parseFloat(String(row.remainingBalance || 0)).toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3 text-center">{row.monthlyPaymentsRemaining ?? "—"}</td>
                          <td className="p-3">
                            {row.isFrozen ? (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">Frozen</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
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
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p><span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded mr-1" />Red rows = payment issue (failed subscription or active balance with no auto-billing)</p>
            <p><span className="font-semibold">Manual</span> = no FluidPay or Stripe subscription set up — must collect payment manually</p>
            <p><span className="font-semibold">Bill Day</span> = day of month the recurring charge fires (based on enrollment start date)</p>
            <p><span className="font-semibold">Monthly $</span> = actual amount charged per cycle from FluidPay (in dollars)</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
