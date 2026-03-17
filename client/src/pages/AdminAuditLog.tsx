import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShieldAlert, Trash2, User, Clock, Search, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PAGE_SIZE = 50;

export default function AdminAuditLog() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // PIN setup dialog
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const { data, isLoading, refetch } = trpc.admin.getDeletionAuditLog.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const { data: pinStatus } = trpc.admin.getDeletePinStatus.useQuery();

  const setDeletePin = trpc.admin.setDeletePin.useMutation({
    onSuccess: () => {
      toast.success("Delete PIN set successfully");
      setPinSetupOpen(false);
      setNewPin("");
      setConfirmPin("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to set PIN");
    },
  });

  const handleSetPin = () => {
    if (!/^\d{6}$/.test(newPin)) {
      toast.error("PIN must be exactly 6 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    setDeletePin.mutate({ pin: newPin });
  };

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredRows = searchQuery
    ? rows.filter(
        (r) =>
          r.targetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.performedByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.performedByEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rows;

  const formatDate = (ts: Date | string | null | undefined) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("en-US", {
      timeZone: "America/Chicago",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " CST";
  };

  return (
    <AdminLayout>
      <div>
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-red-500" />
              Deletion Audit Log
            </h1>
            <p className="text-gray-600">
              A permanent record of every lead or student deletion — who did it and when.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setPinSetupOpen(true)}
          >
            <Settings2 className="w-4 h-4" />
            {pinStatus?.configured ? "Change Delete PIN" : "Set Delete PIN"}
          </Button>
        </div>

        {/* PIN status banner */}
        {!pinStatus?.configured && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">No delete PIN configured</p>
              <p className="text-xs mt-0.5">
                Staff will not be able to delete leads or students until a 6-digit PIN is set.{" "}
                <button
                  className="underline font-medium"
                  onClick={() => setPinSetupOpen(true)}
                >
                  Set PIN now
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or staff member…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-gray-500">
            {total} total deletion{total === 1 ? "" : "s"}
          </span>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Deleted Record
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date &amp; Time (CST)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      {searchQuery ? "No results match your search." : "No deletions recorded yet."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {row.targetName ?? `#${row.targetId}`}
                            </p>
                            <p className="text-xs text-gray-400">ID #{row.targetId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          row.targetType === "lead"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {row.targetType === "lead" ? "Lead" : "Student"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {row.performedByName ?? "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">{row.performedByEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(row.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {row.notes ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Set PIN dialog */}
        <Dialog open={pinSetupOpen} onOpenChange={setPinSetupOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                {pinStatus?.configured ? "Change Delete PIN" : "Set Delete PIN"}
              </DialogTitle>
              <DialogDescription>
                This 6-digit PIN will be required before any lead or student can be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-pin">New PIN (6 digits)</Label>
                <Input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPinSetupOpen(false); setNewPin(""); setConfirmPin(""); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSetPin}
                disabled={newPin.length !== 6 || confirmPin.length !== 6 || setDeletePin.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {setDeletePin.isPending ? "Saving…" : "Save PIN"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
