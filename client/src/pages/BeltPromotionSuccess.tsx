import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock3, Loader2, AlertTriangle } from "lucide-react";

export default function BeltPromotionSuccess() {
  const query = new URLSearchParams(window.location.search);
  const intentId = Number(query.get("intent_id"));
  const paypalToken = query.get("token");
  const utils = trpc.useUtils();
  const [verificationMessage, setVerificationMessage] = useState("Payment verification is pending.");
  const { data, isLoading, error } = trpc.beltPromotion.getStatus.useQuery(
    { intentId },
    { enabled: Number.isInteger(intentId) && intentId > 0, refetchInterval: 5000 },
  );

  useEffect(() => {
    if (!paypalToken) return;
    setVerificationMessage("Verifying your PayPal payment…");
    fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: paypalToken }),
    }).then((response) => {
      if (!response.ok) throw new Error("Payment verification failed");
      setVerificationMessage("Payment verified successfully.");
      return utils.beltPromotion.getStatus.invalidate({ intentId });
    }).catch(() => {
      setVerificationMessage("Your intent is saved, but PayPal verification is still pending. Please contact MyDojo if you completed checkout.");
    });
  }, [intentId, paypalToken, utils]);

  const paid = data?.paymentStatus === "paid";
  const review = data?.paymentStatus === "manual_review";
  return <div className="min-h-screen bg-[#101014] text-white px-4 py-14"><div className="max-w-xl mx-auto"><Card className="bg-white/5 border-white/10 text-white"><CardContent className="p-8 md:p-12 text-center">{isLoading ? <><Loader2 className="w-14 h-14 animate-spin mx-auto text-red-400" /><h1 className="text-2xl font-black uppercase mt-5">Verifying payment</h1><p className="text-white/60 mt-3">We are checking the provider confirmation. Please keep this window open.</p></> : error ? <><AlertTriangle className="w-14 h-14 mx-auto text-amber-400" /><h1 className="text-2xl font-black uppercase mt-5">Needs staff review</h1><p className="text-white/60 mt-3">We could not verify this reference yet. Please contact MyDojo with reference #{intentId}.</p></> : paid ? <><CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400" /><h1 className="text-3xl font-black uppercase mt-5">Payment verified</h1><p className="text-white/70 mt-3">{data.studentName}&apos;s promotion payment has been confirmed. Staff will complete instructor approval and ceremony readiness.</p><p className="text-white/50 text-sm mt-4">Reference #{data.id} · {data.nextBelt || "Next rank pending"}</p></> : <><Clock3 className="w-16 h-16 mx-auto text-amber-300" /><h1 className="text-3xl font-black uppercase mt-5">Payment pending</h1><p className="text-white/70 mt-3">{verificationMessage} Do not submit another payment. Staff will reconcile the reference.</p><p className="text-white/50 text-sm mt-4">Reference #{intentId}{review ? " · Manual review" : ""}</p></>}<div className="flex gap-3 justify-center mt-8"><Link href="/belt-promotion"><Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Back to promotion</Button></Link><Link href="/"><Button className="bg-red-600 hover:bg-red-700">MyDojo home</Button></Link></div></CardContent></Card></div></div>;
}
