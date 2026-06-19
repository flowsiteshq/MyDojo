import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Coins,
  Trophy,
  Users,
  Gift,
  CheckCircle2,
  XCircle,
  Settings,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";

type Tab = "redemptions" | "accounts" | "referrals" | "settings";

export default function AdminMyDojoBucks() {
  const [activeTab, setActiveTab] = useState<Tab>("redemptions");
  const [adjustUserId, setAdjustUserId] = useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const { data: redemptions, isLoading: loadingRedemptions, refetch: refetchRedemptions } =
    trpc.mydojoBucks.adminGetPendingRedemptions.useQuery();

  const { data: accounts, isLoading: loadingAccounts } =
    trpc.mydojoBucks.adminGetAllAccounts.useQuery();

  const { data: referrals, isLoading: loadingReferrals } =
    trpc.mydojoBucks.adminGetAllReferrals.useQuery();

  const { data: config, refetch: refetchConfig } =
    trpc.mydojoBucks.adminGetConfig.useQuery();

  const [configBucks, setConfigBucks] = useState<string>("");

  const processRedemption = trpc.mydojoBucks.adminProcessRedemption.useMutation({
    onSuccess: () => {
      toast.success("Redemption updated!");
      refetchRedemptions();
    },
    onError: (err) => toast.error(err.message),
  });

  const adjustBalance = trpc.mydojoBucks.adminAdjustBalance.useMutation({
    onSuccess: () => {
      toast.success("Balance adjusted!");
      setAdjustUserId(null);
      setAdjustAmount("");
      setAdjustReason("");
    },
    onError: (err) => toast.error(err.message),
  });

  const setConfig = trpc.mydojoBucks.adminSetConfig.useMutation({
    onSuccess: () => {
      toast.success("Config saved!");
      refetchConfig();
    },
    onError: (err) => toast.error(err.message),
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "redemptions", label: "Redemptions", icon: <Gift className="h-4 w-4" /> },
    { id: "accounts", label: "Accounts", icon: <Coins className="h-4 w-4" /> },
    { id: "referrals", label: "Referrals", icon: <Users className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  const pendingCount = redemptions?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#E10600] p-3 rounded-xl">
          <Coins className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">MyDojo Bucks</h1>
          <p className="text-gray-400 text-sm">Manage referral rewards and redemptions</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Accounts</p>
            <p className="text-2xl font-black text-white">{accounts?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Bucks Issued</p>
            <p className="text-2xl font-black text-white">
              {(accounts?.reduce((s, a) => s + a.totalEarned, 0) ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Referrals</p>
            <p className="text-2xl font-black text-white">{referrals?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className={`border-zinc-800 ${pendingCount > 0 ? "bg-yellow-900/30" : "bg-zinc-900"}`}>
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pending Redemptions</p>
            <p className={`text-2xl font-black ${pendingCount > 0 ? "text-yellow-400" : "text-white"}`}>
              {pendingCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#E10600] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "redemptions" && pendingCount > 0 && (
              <span className="bg-yellow-500 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Redemptions Tab */}
      {activeTab === "redemptions" && (
        <div className="space-y-3">
          {loadingRedemptions ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#E10600]" /></div>
          ) : (redemptions?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-gray-500">No redemption requests yet.</div>
          ) : (
            redemptions!.map((r) => (
              <Card key={r.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{r.userName || r.userEmail}</p>
                        <Badge
                          variant="outline"
                          className={
                            r.status === "pending"
                              ? "border-yellow-500 text-yellow-400"
                              : r.status === "fulfilled"
                              ? "border-green-500 text-green-400"
                              : r.status === "approved"
                              ? "border-blue-500 text-blue-400"
                              : "border-red-500 text-red-400"
                          }
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm">{r.itemDescription}</p>
                      <p className="text-[#E10600] font-bold text-sm mt-1">{r.bucksAmount.toLocaleString()} bucks</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                      {r.adminNotes && (
                        <p className="text-gray-400 text-xs mt-1 italic">Note: {r.adminNotes}</p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => processRedemption.mutate({ redemptionId: r.id, action: "approved" })}
                          disabled={processRedemption.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => processRedemption.mutate({ redemptionId: r.id, action: "fulfilled" })}
                          disabled={processRedemption.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Fulfilled
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processRedemption.mutate({ redemptionId: r.id, action: "rejected" })}
                          disabled={processRedemption.isPending}
                          className="border-red-700 text-red-400 hover:bg-red-900/30 text-xs"
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {r.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => processRedemption.mutate({ redemptionId: r.id, action: "fulfilled" })}
                        disabled={processRedemption.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs shrink-0"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Fulfilled
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === "accounts" && (
        <div className="space-y-3">
          {loadingAccounts ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#E10600]" /></div>
          ) : (accounts?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-gray-500">No bucks accounts yet.</div>
          ) : (
            accounts!.map((a) => (
              <Card key={a.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white font-bold">{a.userName || a.userEmail}</p>
                      <p className="text-gray-500 text-xs">{a.userEmail}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[#E10600] font-black text-lg">{a.balance.toLocaleString()} bucks</span>
                        <span className="text-gray-400 text-sm">Earned: {a.totalEarned.toLocaleString()}</span>
                        <span className="text-gray-400 text-sm">Redeemed: {a.totalRedeemed.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAdjustUserId(adjustUserId === a.userId ? null : a.userId)}
                      className="border-zinc-700 text-white bg-zinc-800 hover:bg-zinc-700 text-xs shrink-0"
                    >
                      Adjust Balance
                    </Button>
                  </div>
                  {adjustUserId === a.userId && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-300 text-xs">Amount (+ add, - deduct)</Label>
                          <Input
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            placeholder="e.g. 500 or -200"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-xs">Reason</Label>
                          <Input
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="e.g. Bonus for event"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const amt = parseInt(adjustAmount);
                          if (isNaN(amt) || !adjustReason.trim()) {
                            toast.error("Fill in amount and reason");
                            return;
                          }
                          adjustBalance.mutate({ userId: a.userId, amount: amt, reason: adjustReason });
                        }}
                        disabled={adjustBalance.isPending}
                        className="bg-[#E10600] hover:bg-[#c00500] text-white"
                      >
                        {adjustBalance.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Apply Adjustment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <div className="space-y-3">
          {loadingReferrals ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#E10600]" /></div>
          ) : (referrals?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-gray-500">No referrals yet.</div>
          ) : (
            referrals!.map((r) => (
              <Card key={r.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">{r.referredName}</p>
                      <p className="text-gray-400 text-sm">
                        Referred by: <span className="text-[#E10600]">{r.referrerName || r.referrerEmail}</span>
                      </p>
                      {r.referredPhone && <p className="text-gray-500 text-xs">{r.referredPhone}</p>}
                      <p className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === "enrolled" && (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-green-400 font-bold text-sm">+{r.bucksAwarded.toLocaleString()}</span>
                        </>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          r.status === "enrolled"
                            ? "border-green-500 text-green-400"
                            : "border-yellow-500 text-yellow-400"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <Card className="bg-zinc-900 border-zinc-800 max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Bucks Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Bucks per successful referral</Label>
              <p className="text-gray-500 text-xs mb-2">Current: {config?.bucksPerReferral ?? 500} bucks</p>
              <Input
                type="number"
                value={configBucks || String(config?.bucksPerReferral ?? 500)}
                onChange={(e) => setConfigBucks(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Button
              onClick={() => {
                const val = parseInt(configBucks || String(config?.bucksPerReferral ?? 500));
                if (isNaN(val) || val < 1) {
                  toast.error("Invalid value");
                  return;
                }
                setConfig.mutate({ bucksPerReferral: val });
              }}
              disabled={setConfig.isPending}
              className="bg-[#E10600] hover:bg-[#c00500] text-white"
            >
              {setConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
