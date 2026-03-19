import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  TrendingUp,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type CommissionStatus = "pending" | "paid" | "voided" | "all";

const STATUS_CONFIG = {
  pending: { label: "Pending",  color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid:    { label: "Paid",     color: "bg-green-100 text-green-800",   icon: CheckCircle },
  voided:  { label: "Voided",   color: "bg-gray-100 text-gray-500",     icon: XCircle },
};

// ─── Bonus Settings Modal ─────────────────────────────────────────────────────

function BonusSettingsModal({ onClose }: { onClose: () => void }) {
  const { data: current } = trpc.commissions.getBonusAmount.useQuery();
  const [dollars, setDollars] = useState<string>("");
  const utils = trpc.useUtils();

  const setBonus = trpc.commissions.setBonusAmount.useMutation({
    onSuccess: (data) => {
      toast.success(`Enrollment bonus set to $${(data.bonusAmountCents / 100).toFixed(2)}`);
      utils.commissions.getBonusAmount.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message ?? "Failed to update bonus"),
  });

  const currentDollars = current ? (current.bonusAmountCents / 100).toFixed(2) : "50.00";

  const handleSave = () => {
    const val = parseFloat(dollars);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid dollar amount");
      return;
    }
    setBonus.mutate({ bonusAmountCents: Math.round(val * 100) });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm z-[200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Enrollment Commission Bonus
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Current Bonus Amount</p>
            <p className="text-2xl font-bold text-gray-900">${currentDollars}</p>
            <p className="text-xs text-gray-400 mt-1">Awarded to the assigned staff member when a lead is moved to Enrolled</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
              New Bonus Amount ($)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">$</span>
              <Input
                type="number"
                min="0"
                max="1000"
                step="0.01"
                placeholder={currentDollars}
                value={dollars}
                onChange={(e) => setDollars(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Set to 0 to disable commissions</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!dollars || setBonus.isPending}
            className="bg-[#E10600] hover:bg-red-700 text-white"
          >
            {setBonus.isPending ? "Saving…" : "Save Bonus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mark Paid / Void Modal ───────────────────────────────────────────────────

function ActionModal({
  commissionId,
  action,
  staffName,
  amount,
  onClose,
}: {
  commissionId: number;
  action: "pay" | "void";
  staffName: string;
  amount: number;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const utils = trpc.useUtils();

  const markPaid = trpc.commissions.markPaid.useMutation({
    onSuccess: () => {
      toast.success(`Commission marked as paid for ${staffName}`);
      utils.commissions.listCommissions.invalidate();
      utils.commissions.getStaffSummary.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message ?? "Failed"),
  });

  const voidCommission = trpc.commissions.voidCommission.useMutation({
    onSuccess: () => {
      toast.success("Commission voided");
      utils.commissions.listCommissions.invalidate();
      utils.commissions.getStaffSummary.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message ?? "Failed"),
  });

  const handleConfirm = () => {
    if (action === "pay") {
      markPaid.mutate({ commissionId, adminNotes: notes || undefined });
    } else {
      voidCommission.mutate({ commissionId, adminNotes: notes || undefined });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm z-[200]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "pay" ? (
              <><CheckCircle className="w-5 h-5 text-green-600" /> Mark as Paid</>
            ) : (
              <><XCircle className="w-5 h-5 text-gray-500" /> Void Commission</>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-600">
              {action === "pay" ? "Confirm payment of" : "Void commission of"}{" "}
              <span className="font-bold text-gray-900">${(amount / 100).toFixed(2)}</span>{" "}
              to <span className="font-bold text-gray-900">{staffName}</span>
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Admin Notes (optional)
            </label>
            <Input
              placeholder="e.g. Paid via Venmo, check #1234…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={markPaid.isPending || voidCommission.isPending}
            className={action === "pay" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"}
          >
            {markPaid.isPending || voidCommission.isPending ? "Processing…" : action === "pay" ? "Confirm Payment" : "Void"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCommissions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [statusFilter, setStatusFilter] = useState<CommissionStatus>("all");
  const [showBonusSettings, setShowBonusSettings] = useState(false);
  const [actionModal, setActionModal] = useState<{
    id: number;
    action: "pay" | "void";
    staffName: string;
    amount: number;
  } | null>(null);

  const { data: commissions, isLoading } = trpc.commissions.listCommissions.useQuery(
    { status: statusFilter },
    { refetchInterval: 30_000 }
  );

  const { data: summary } = trpc.commissions.getStaffSummary.useQuery(undefined, {
    enabled: isAdmin,
  });

  const { data: bonusData } = trpc.commissions.getBonusAmount.useQuery();

  // Aggregate summary per staff
  const staffSummary = summary?.reduce<Record<number, { name: string; pending: number; paid: number; pendingCount: number; paidCount: number }>>((acc, row) => {
    const id = row.staffUserId;
    if (!acc[id]) acc[id] = { name: row.staffName, pending: 0, paid: 0, pendingCount: 0, paidCount: 0 };
    if (row.status === "pending") {
      acc[id].pending += Number(row.totalBonusCents);
      acc[id].pendingCount += Number(row.count);
    } else if (row.status === "paid") {
      acc[id].paid += Number(row.totalBonusCents);
      acc[id].paidCount += Number(row.count);
    }
    return acc;
  }, {});

  const totalPending = commissions?.filter(c => c.status === "pending").reduce((s, c) => s + c.bonusAmountCents, 0) ?? 0;
  const totalPaid = commissions?.filter(c => c.status === "paid").reduce((s, c) => s + c.bonusAmountCents, 0) ?? 0;

  return (
    <AdminLayout>
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E10600]" />
              Commissions
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track enrollment bonuses for staff members
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowBonusSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Bonus Settings
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Pending Payout</p>
                <p className="text-xl font-bold text-gray-900">${(totalPending / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Paid Out</p>
                <p className="text-xl font-bold text-gray-900">${(totalPaid / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Bonus Per Enrollment</p>
                <p className="text-xl font-bold text-gray-900">${((bonusData?.bonusAmountCents ?? 5000) / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff summary (admin only) */}
        {isAdmin && staffSummary && Object.keys(staffSummary).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Staff Summary</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(staffSummary).map(([id, s]) => (
                <div key={id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400">
                      {s.paidCount} paid · {s.pendingCount} pending
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${((s.pending + s.paid) / 100).toFixed(2)} total</p>
                    {s.pending > 0 && (
                      <p className="text-xs text-yellow-600 font-medium">${(s.pending / 100).toFixed(2)} pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commission list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Commission Records</h2>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CommissionStatus)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-[#E10600] rounded-full" />
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No commissions yet</p>
              <p className="text-xs mt-1">Commissions are created when a lead is moved to Enrolled</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {commissions.map((c) => {
                const conf = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG];
                const Icon = conf?.icon ?? Clock;
                return (
                  <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-gray-900 text-sm truncate">{c.leadName}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${conf?.color}`}>
                          {conf?.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Assigned to <span className="font-medium text-gray-700">{c.staffName}</span>
                        {c.program && <> · {c.program}</>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                        {c.paidAt && (
                          <> · Paid {new Date(c.paidAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          })}</>
                        )}
                        {c.adminNotes && <> · {c.adminNotes}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-bold text-gray-900">${(c.bonusAmountCents / 100).toFixed(2)}</p>
                      {isAdmin && c.status === "pending" && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            onClick={() => setActionModal({ id: c.id, action: "pay", staffName: c.staffName, amount: c.bonusAmountCents })}
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-2"
                          >
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActionModal({ id: c.id, action: "void", staffName: c.staffName, amount: c.bonusAmountCents })}
                            className="h-7 text-xs px-2"
                          >
                            Void
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showBonusSettings && <BonusSettingsModal onClose={() => setShowBonusSettings(false)} />}
      {actionModal && (
        <ActionModal
          commissionId={actionModal.id}
          action={actionModal.action}
          staffName={actionModal.staffName}
          amount={actionModal.amount}
          onClose={() => setActionModal(null)}
        />
      )}
    </div>
    </AdminLayout>
  );
}
