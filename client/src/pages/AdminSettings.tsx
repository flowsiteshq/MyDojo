import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ticket, KeyRound, CheckCircle2, AlertCircle, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

// ─── Day Pass Price Section ───────────────────────────────────────────────────
function DayPassPriceSection() {
  const { data, isLoading, refetch } = trpc.admin.getDayPassPrice.useQuery();
  const setPrice = trpc.admin.setDayPassPrice.useMutation({
    onSuccess: (result) => {
      toast.success(`Day pass price set to $${(result.amountCents / 100).toFixed(2)}.`);
      refetch();
      setEditing(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update price");
    },
  });

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const currentDollars = data ? (data.amountCents / 100).toFixed(2) : "20.00";

  const handleStartEdit = () => {
    setInputValue(currentDollars);
    setEditing(true);
  };

  const handleSave = () => {
    const dollars = parseFloat(inputValue);
    if (isNaN(dollars) || dollars < 0.5) {
      toast.error("Price must be at least $0.50.");
      return;
    }
    const cents = Math.round(dollars * 100);
    setPrice.mutate({ amountCents: cents });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-[#E10600]" />
          </div>
          <div>
            <CardTitle className="text-lg">Day Pass Price</CardTitle>
            <CardDescription>
              The price charged to walk-in guests who purchase a day pass at the kiosk.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading current price…</span>
          </div>
        ) : editing ? (
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="day-pass-price" className="text-sm font-medium mb-1.5 block">
                Price (USD)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="day-pass-price"
                  type="number"
                  min="0.50"
                  step="0.50"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="pl-8"
                  placeholder="20.00"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={setPrice.isPending}
              className="bg-[#E10600] hover:bg-[#C10500] text-white"
            >
              {setPrice.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Save</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={setPrice.isPending}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900">${currentDollars}</span>
              <span className="text-sm text-gray-500">per visit</span>
            </div>
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="ml-auto"
            >
              Edit Price
            </Button>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400">
          Minimum price is $0.50 (Stripe requirement). Changes take effect immediately at the kiosk.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Delete PIN Section ───────────────────────────────────────────────────────
function DeletePinSection() {
  const { data: pinStatus, refetch } = trpc.admin.getDeletePinStatus.useQuery();
  const setPin = trpc.admin.setDeletePin.useMutation({
    onSuccess: () => {
      toast.success("Delete PIN has been saved.");
      refetch();
      setPinInput("");
      setConfirmInput("");
      setEditingPin(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to set PIN");
    },
  });

  const [editingPin, setEditingPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");

  const handleSavePin = () => {
    if (pinInput.length !== 6 || !/^\d{6}$/.test(pinInput)) {
      toast.error("PIN must be exactly 6 digits.");
      return;
    }
    if (pinInput !== confirmInput) {
      toast.error("PINs don't match — please re-enter the same PIN in both fields.");
      return;
    }
    setPin.mutate({ pin: pinInput });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Delete PIN</CardTitle>
            <CardDescription>
              A 6-digit PIN required to delete students or leads from the admin dashboard.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          {pinStatus?.configured ? (
            <Badge className="bg-green-50 text-green-700 border-green-200 gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> PIN configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> No PIN set
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingPin(!editingPin)}
            className="ml-auto"
          >
            {pinStatus?.configured ? "Change PIN" : "Set PIN"}
          </Button>
        </div>

        {editingPin && (
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="pin-input" className="text-sm font-medium mb-1.5 block">
                New 6-digit PIN
              </Label>
              <Input
                id="pin-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="max-w-xs font-mono tracking-widest"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="pin-confirm" className="text-sm font-medium mb-1.5 block">
                Confirm PIN
              </Label>
              <Input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="max-w-xs font-mono tracking-widest"
                onKeyDown={(e) => { if (e.key === "Enter") handleSavePin(); }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSavePin}
                disabled={setPin.isPending}
                className="bg-[#E10600] hover:bg-[#C10500] text-white"
              >
                {setPin.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save PIN"}
              </Button>
              <Button variant="outline" onClick={() => { setEditingPin(false); setPinInput(""); setConfirmInput(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage kiosk configuration and security settings.</p>
        </div>

        <div className="space-y-6">
          {/* Kiosk section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Kiosk
            </h2>
            <DayPassPriceSection />
          </div>

          <Separator />

          {/* Security section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Security
            </h2>
            <DeletePinSection />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
