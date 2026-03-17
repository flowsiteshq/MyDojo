import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Webhook,
  XCircle,
  DollarSign,
  User,
} from "lucide-react";

// ─── Payment Failures Tab ─────────────────────────────────────────────────────

function PaymentFailuresTab() {
  const { data: failures, isLoading, refetch } = trpc.admin.getPaymentFailures.useQuery({ limit: 100 });

  const resolve = trpc.admin.resolvePaymentFailure.useMutation({
    onSuccess: () => {
      toast.success("Payment failure resolved — enrollment re-activated.");
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to resolve"),
  });

  const openFailures = failures?.filter((f) => f.status === "open") ?? [];
  const resolvedFailures = failures?.filter((f) => f.status !== "open") ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading payment failures…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{openFailures.length}</p>
                <p className="text-sm text-muted-foreground">Open failures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{resolvedFailures.length}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(
                    openFailures.reduce((sum, f) => sum + (f.amountCents ?? 0), 0) / 100
                  ).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">At-risk revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Failures */}
      {openFailures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold">No open payment failures</p>
            <p className="text-muted-foreground text-sm">All subscriptions are billing normally.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Open Payment Failures ({openFailures.length})
            </CardTitle>
            <CardDescription>
              These members have failed payments and their enrollment has been paused.
              Resolve once payment is collected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openFailures.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {f.enrollment?.customerName ?? `Enrollment #${f.enrollmentId}`}
                      </span>
                      {f.enrollment?.studentName && f.enrollment.studentName !== f.enrollment.customerName && (
                        <span className="text-sm text-muted-foreground">
                          (student: {f.enrollment.studentName})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {f.enrollment?.customerEmail}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="destructive">
                        ${((f.amountCents ?? 0) / 100).toFixed(2)} failed
                      </Badge>
                      {f.retryCount > 0 && (
                        <Badge variant="outline">{f.retryCount} retries</Badge>
                      )}
                      {f.emailSent && (
                        <Badge variant="secondary">Dunning email sent</Badge>
                      )}
                    </div>
                    {f.failureReason && (
                      <p className="text-xs text-red-600 font-medium">{f.failureReason}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => resolve.mutate({ failureId: f.id })}
                    disabled={resolve.isPending}
                    className="shrink-0"
                  >
                    {resolve.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Mark Resolved
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved History */}
      {resolvedFailures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-base">
              Resolved History ({resolvedFailures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedFailures.slice(0, 20).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {f.enrollment?.customerName ?? `Enrollment #${f.enrollmentId}`}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ${((f.amountCents ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      {f.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Webhook Events Tab ───────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  settled: "bg-green-100 text-green-700",
  pending_settlement: "bg-blue-100 text-blue-700",
  authorized: "bg-blue-100 text-blue-700",
  declined: "bg-red-100 text-red-700",
  returned: "bg-orange-100 text-orange-700",
  voided: "bg-gray-100 text-gray-700",
  processed: "bg-green-100 text-green-700",
  ignored: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

function WebhookEventsTab() {
  const { data: events, isLoading, refetch } = trpc.admin.getWebhookEvents.useQuery({ limit: 100 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading webhook events…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing the last {events?.length ?? 0} webhook events received from Fluid Pay.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {!events || events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold">No webhook events yet</p>
            <p className="text-muted-foreground text-sm">
              Events will appear here once Fluid Pay starts sending them to{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                /api/fluidpay/webhook
              </code>
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Subscription</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Processing</th>
                    <th className="text-left p-3 font-medium">Sig</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={e.id} className={`border-b ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-xs">{e.eventType}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_COLORS[e.eventStatus ?? ""] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {e.eventStatus ?? "—"}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {e.fpSubscriptionId ? (
                          <span className="truncate max-w-[120px] block">{e.fpSubscriptionId}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        {e.amountCents != null
                          ? `$${(e.amountCents / 100).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_COLORS[e.processingStatus] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {e.processingStatus}
                        </span>
                        {e.processingError && (
                          <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={e.processingError}>
                            {e.processingError}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        {e.signatureValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <span title="Signature not verified"><XCircle className="h-4 w-4 text-red-400" /></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup instructions */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Fluid Pay Webhook Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>To start receiving events, configure a webhook in Fluid Pay:</p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>Log in to <strong>app.fluidpay.com</strong></li>
            <li>Go to <strong>Manage → Settings → Webhooks</strong></li>
            <li>
              Set the endpoint URL to:{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                https://mydojo-fitness-lu5er8yq.manus.space/api/fluidpay/webhook
              </code>
            </li>
            <li>Select event types: <strong>Transaction</strong> (all)</li>
            <li>Copy the <strong>Signature UUID</strong> and add it as <code className="text-xs">FLUIDPAY_WEBHOOK_SECRET</code> in Settings → Secrets</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBilling() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing &amp; Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor subscription renewals, payment failures, and Fluid Pay webhook events.
          </p>
        </div>

        <Tabs defaultValue="failures">
          <TabsList>
            <TabsTrigger value="failures">Payment Failures</TabsTrigger>
            <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
          </TabsList>
          <TabsContent value="failures" className="pt-4">
            <PaymentFailuresTab />
          </TabsContent>
          <TabsContent value="webhooks" className="pt-4">
            <WebhookEventsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
