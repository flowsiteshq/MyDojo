import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, Gift, Star, Phone, Mail, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CERT_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/chikfila-cert-XYm4bjuueBxNtqRRnhCrso.png";
const FLYER_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/chikfila-flyer-4XpfTUcV36NPiwfKxYjFMv.png";

type Step = "code" | "form" | "done";

export default function GiftCertRedeem() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [validatedCode, setValidatedCode] = useState("");
  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    lessonsFor: "myself",
    childName: "",
    childAge: "",
    mailRequested: false,
    mailingAddress: "",
  });

  // Pre-fill code from URL param
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) setCode(c.toUpperCase());
  });

  const validateQuery = trpc.giftCert.validateCode.useQuery(
    { code: code.toUpperCase().trim() },
    { enabled: false }
  );

  const redeemMutation = trpc.giftCert.redeemCode.useMutation({
    onSuccess: () => setStep("done"),
    onError: (err) => toast.error(err.message),
  });

  const handleValidate = async () => {
    if (!code.trim()) { toast.error("Please enter the code from your certificate."); return; }
    const result = await validateQuery.refetch();
    if (result.data?.valid) {
      setValidatedCode(code.toUpperCase().trim());
      setStep("form");
    } else {
      toast.error(result.data?.reason || "Code not found.");
    }
  };

  const handleSubmit = () => {
    if (!form.recipientName || !form.recipientPhone || !form.recipientEmail) {
      toast.error("Please fill in your name, phone, and email."); return;
    }
    if (form.lessonsFor === "child" && !form.childName) {
      toast.error("Please enter the child's name."); return;
    }
    if (form.mailRequested && !form.mailingAddress) {
      toast.error("Please enter your mailing address."); return;
    }
    redeemMutation.mutate({ ...form, code: validatedCode });
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black tracking-tight text-white">MYDOJO</div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest">× Chick-fil-A</div>
        </div>
        <div className="text-xs text-zinc-400">2-Week Free Trial</div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {(["code", "form", "done"] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              step === "done" ? "bg-red-600" :
              i <= ["code", "form", "done"].indexOf(step) ? "bg-red-600" : "bg-zinc-700"
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Enter Code */}
          {step === "code" && (
            <motion.div key="code" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              {/* Certificate Preview */}
              <div className="mb-6 rounded-xl overflow-hidden shadow-2xl">
                <img src={CERT_IMAGE} alt="Gift Certificate" className="w-full object-contain" />
              </div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  <Gift className="w-3 h-3" /> Chick-fil-A × MyDojo
                </div>
                <h1 className="text-3xl font-black uppercase mb-2">Claim Your<br /><span className="text-red-500">Free Trial</span></h1>
                <p className="text-zinc-400 text-sm">Enter the code from your gift certificate below</p>
              </div>

              <div className="space-y-4">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CFA-XXXX-XXXX"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-center text-lg font-mono tracking-widest h-14"
                  onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                />
                <Button
                  onClick={handleValidate}
                  disabled={validateQuery.isFetching}
                  className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base"
                >
                  {validateQuery.isFetching ? <Loader2 className="animate-spin" /> : <>Redeem Code <ChevronRight className="ml-1 w-5 h-5" /></>}
                </Button>
              </div>

              {/* Social proof */}
              <div className="mt-8 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                <span className="text-zinc-400 text-sm ml-2">500+ Five-Star Reviews</span>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Fill Out Form */}
          {step === "form" && (
            <motion.div key="form" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  <CheckCircle className="w-3 h-3" /> Code Verified ✓
                </div>
                <h2 className="text-2xl font-black uppercase">Almost There!<br /><span className="text-red-500">Tell Us About You</span></h2>
                <p className="text-zinc-400 text-sm mt-1">Code: <span className="text-white font-mono font-bold">{validatedCode}</span></p>
              </div>

              <div className="space-y-4">
                <Input
                  value={form.recipientName}
                  onChange={(e) => setForm(f => ({ ...f, recipientName: e.target.value }))}
                  placeholder="Full Name"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                />
                <Input
                  value={form.recipientPhone}
                  onChange={(e) => setForm(f => ({ ...f, recipientPhone: e.target.value }))}
                  placeholder="Phone Number"
                  type="tel"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                />
                <Input
                  value={form.recipientEmail}
                  onChange={(e) => setForm(f => ({ ...f, recipientEmail: e.target.value }))}
                  placeholder="Email Address"
                  type="email"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                />

                {/* Who are lessons for */}
                <div>
                  <p className="text-zinc-400 text-sm mb-2 font-medium">Who are the lessons for?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "myself", label: "Myself" },
                      { value: "child", label: "My Child" },
                      { value: "someone", label: "Someone Else" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, lessonsFor: opt.value }))}
                        className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-all ${
                          form.lessonsFor === opt.value
                            ? "bg-red-600 border-red-600 text-white"
                            : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {form.lessonsFor === "child" && (
                    <motion.div key="child" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                      <Input
                        value={form.childName}
                        onChange={(e) => setForm(f => ({ ...f, childName: e.target.value }))}
                        placeholder="Child's Name"
                        className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                      />
                      <Input
                        value={form.childAge}
                        onChange={(e) => setForm(f => ({ ...f, childAge: e.target.value }))}
                        placeholder="Child's Age"
                        type="number"
                        className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mail option */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.mailRequested}
                      onChange={(e) => setForm(f => ({ ...f, mailRequested: e.target.checked }))}
                      className="w-5 h-5 accent-red-600"
                    />
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-red-400" /> Mail me a physical certificate
                      </div>
                      <div className="text-zinc-500 text-xs">We'll send a printed certificate to your address</div>
                    </div>
                  </label>
                  <AnimatePresence>
                    {form.mailRequested && (
                      <motion.div key="address" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Input
                          value={form.mailingAddress}
                          onChange={(e) => setForm(f => ({ ...f, mailingAddress: e.target.value }))}
                          placeholder="Street, City, State, ZIP"
                          className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 h-12 mt-3"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={redeemMutation.isPending}
                  className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-base"
                >
                  {redeemMutation.isPending ? <Loader2 className="animate-spin" /> : <>Claim My Free Trial 🥋</>}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Done */}
          {step === "done" && (
            <motion.div key="done" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-3xl font-black uppercase mb-2">You're In! 🎉</h2>
              <p className="text-zinc-400 mb-2">Your 2-week free trial is confirmed.</p>
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6 text-left">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Your Code</div>
                <div className="text-2xl font-mono font-black text-red-400">{validatedCode}</div>
                <div className="text-xs text-zinc-500 mt-1">Show this when you arrive at the dojo</div>
              </div>

              <p className="text-zinc-400 text-sm mb-6">We just texted you a confirmation. Check your messages!</p>

              {/* Download certificate */}
              <a
                href={CERT_IMAGE}
                download="MyDojo-Gift-Certificate.png"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full mb-3"
              >
                <Button className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-600">
                  📥 Download Your Certificate
                </Button>
              </a>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <a href="tel:8774693656">
                  <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold">
                    <Phone className="w-4 h-4 mr-2" /> Call Us
                  </Button>
                </a>
                <a href="sms:8774693656">
                  <Button className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-600">
                    💬 Text Us
                  </Button>
                </a>
              </div>

              <a href="https://mydojoma.com" className="text-red-400 text-sm underline">
                Visit mydojoma.com to book your first class →
              </a>

              {/* Flyer */}
              <div className="mt-8 rounded-xl overflow-hidden opacity-60">
                <img src={FLYER_IMAGE} alt="MyDojo x Chick-fil-A" className="w-full object-contain" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
