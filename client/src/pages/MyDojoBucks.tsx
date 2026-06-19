import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Coins,
  Gift,
  Share2,
  Copy,
  Check,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  Users,
  ShoppingBag,
} from "lucide-react";

export default function MyDojoBucks() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemItem, setRedeemItem] = useState("");

  const { data, isLoading, refetch } = trpc.mydojoBucks.getMyDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const redeemMutation = trpc.mydojoBucks.requestRedemption.useMutation({
    onSuccess: () => {
      toast.success("Redemption requested! We'll process your request within 1-2 business days.");
      setRedeemOpen(false);
      setRedeemAmount("");
      setRedeemItem("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const referralUrl = data?.referralCode
    ? `${window.location.origin}/join?ref=${data.referralCode}`
    : "";

  const copyReferralLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
      toast.success("Referral link copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    if (!referralUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join MyDojo Martial Arts!",
        text: `I train at MyDojo and think you'd love it! Use my referral link to get started:`,
        url: referralUrl,
      });
    } else {
      copyReferralLink();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E10600]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <Coins className="h-16 w-16 text-[#E10600] mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">MyDojo Bucks</h1>
          <p className="text-gray-400 mb-6">Sign in to view your bucks balance and referral link.</p>
          <Link href="/login">
            <Button className="bg-[#E10600] hover:bg-[#c00500] text-white">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const balance = data?.balance ?? 0;
  const bucksPerReferral = data?.bucksPerReferral ?? 500;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#E10600] p-3 rounded-xl">
              <Coins className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">MyDojo Bucks</h1>
              <p className="text-gray-400 text-sm">Earn rewards by referring friends & family</p>
            </div>
          </div>

          {/* Balance + Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-[#E10600] border-0 col-span-1">
              <CardContent className="p-5">
                <p className="text-red-200 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
                <p className="text-4xl font-black text-white">{balance.toLocaleString()}</p>
                <p className="text-red-200 text-sm mt-1">MyDojo Bucks</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Earned</p>
                </div>
                <p className="text-2xl font-black text-white">{(data?.totalEarned ?? 0).toLocaleString()}</p>
                <p className="text-gray-500 text-sm">lifetime bucks</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-400" />
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Referrals</p>
                </div>
                <p className="text-2xl font-black text-white">{data?.totalReferrals ?? 0}</p>
                <p className="text-gray-500 text-sm">students referred</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Referral Link Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#E10600]" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">Your code</p>
              <p className="text-2xl font-black text-[#E10600] tracking-widest">{data?.referralCode}</p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono truncate">
                {referralUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyReferralLink}
                className="border-zinc-700 text-white bg-zinc-800 hover:bg-zinc-700 shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button
              onClick={shareReferralLink}
              className="w-full bg-[#E10600] hover:bg-[#c00500] text-white font-bold"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Your Link
            </Button>

            <div className="bg-zinc-800 rounded-lg p-4 flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold text-sm">Earn {bucksPerReferral.toLocaleString()} bucks per referral</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  When someone enrolls using your link or code, you automatically earn {bucksPerReferral.toLocaleString()} MyDojo Bucks — redeemable for sparring gear, apparel, and more!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redeem Bucks Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#E10600]" />
              Redeem Your Bucks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { item: "Sparring Gloves", bucks: 2500, icon: "🥊" },
                { item: "MyDojo T-Shirt", bucks: 1500, icon: "👕" },
                { item: "Sparring Headgear", bucks: 3500, icon: "⛑️" },
                { item: "Shin Guards", bucks: 2000, icon: "🦵" },
                { item: "MyDojo Hoodie", bucks: 3000, icon: "🧥" },
                { item: "Custom Item", bucks: null, icon: "✨" },
              ].map((item) => (
                <button
                  key={item.item}
                  onClick={() => {
                    setRedeemItem(item.item === "Custom Item" ? "" : item.item);
                    setRedeemAmount(item.bucks ? String(item.bucks) : "");
                    setRedeemOpen(true);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 rounded-lg p-4 text-left transition-colors border border-zinc-700 hover:border-[#E10600]/50"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-white font-bold text-sm">{item.item}</p>
                  {item.bucks && (
                    <p className="text-[#E10600] text-xs font-bold mt-1">{item.bucks.toLocaleString()} bucks</p>
                  )}
                  {!item.bucks && (
                    <p className="text-gray-400 text-xs mt-1">Choose your amount</p>
                  )}
                </button>
              ))}
            </div>

            {redeemOpen && (
              <div className="bg-zinc-800 rounded-lg p-5 space-y-4 border border-zinc-700">
                <h3 className="text-white font-bold">Request Redemption</h3>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Item / What you want</Label>
                  <Input
                    value={redeemItem}
                    onChange={(e) => setRedeemItem(e.target.value)}
                    placeholder="e.g. Sparring gloves, size M"
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Bucks to redeem</Label>
                  <Input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="e.g. 2500"
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                  <p className="text-gray-500 text-xs">Your balance: {balance.toLocaleString()} bucks</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const amt = parseInt(redeemAmount);
                      if (!redeemItem.trim() || isNaN(amt) || amt < 100) {
                        toast.error("Please fill in all fields");
                        return;
                      }
                      redeemMutation.mutate({ bucksAmount: amt, itemDescription: redeemItem.trim() });
                    }}
                    disabled={redeemMutation.isPending}
                    className="bg-[#E10600] hover:bg-[#c00500] text-white font-bold flex-1"
                  >
                    {redeemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                    Submit Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRedeemOpen(false)}
                    className="border-zinc-600 text-white bg-zinc-700 hover:bg-zinc-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Pending redemptions */}
            {(data?.pendingRedemptions?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Pending Requests</p>
                {data!.pendingRedemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{r.itemDescription}</p>
                      <p className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#E10600] font-bold text-sm">{r.bucksAmount.toLocaleString()} bucks</span>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#E10600]" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.transactions?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Coins className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet.</p>
                <p className="text-gray-600 text-sm mt-1">Share your referral link to start earning!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data!.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.amount > 0 ? "bg-green-900/40" : "bg-red-900/40"}`}>
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-400" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{tx.description}</p>
                        <p className="text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`font-black text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral History */}
        {(data?.referralHistory?.length ?? 0) > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#E10600]" />
                People You've Referred
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data!.referralHistory.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-800 rounded-full p-2">
                        <Users className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{r.referredName}</p>
                        <p className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === "enrolled" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-green-400 font-bold text-sm">+{r.bucksAwarded.toLocaleString()}</span>
                        </>
                      ) : r.status === "pending" ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">Pending</Badge>
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
