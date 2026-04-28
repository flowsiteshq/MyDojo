/**
 * Enroll.tsx
 * Standalone enrollment page that students reach by scanning the kiosk QR code.
 * Shows a package selector → personal info form → FluidPay payment form.
 * URL: /enroll?program=Kickboxing
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { FluidPayEnrollmentForm } from "@/components/FluidPayEnrollmentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, ChevronLeft, User, Phone, Mail, Star } from "lucide-react";
import { toast } from "sonner";

type Step = "package" | "info" | "payment";

interface PersonalInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  studentName: string;
}

export default function Enroll() {
  const [step, setStep] = useState<Step>("package");
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [info, setInfo] = useState<PersonalInfo>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    studentName: "",
  });
  const [enrollmentData, setEnrollmentData] = useState<any | null>(null);

  // Read ?program= and ?promo= from URL
  const programParam = new URLSearchParams(window.location.search).get("program") || "";
  const promoParam = new URLSearchParams(window.location.search).get("promo") || undefined;
  const packageParam = new URLSearchParams(window.location.search).get("package");
  const noDownPayment = new URLSearchParams(window.location.search).get("nodp") === "true";

  // Fetch active packages
  const { data: packages, isLoading: pkgsLoading } = trpc.member.getActivePackages.useQuery();

  const selectedPkg = packages?.find((p) => p.id === selectedPackageId);

  // Auto-select package from URL param once packages load
  useEffect(() => {
    if (packageParam && packages && !selectedPackageId) {
      const pkgId = parseInt(packageParam, 10);
      const found = packages.find((p) => p.id === pkgId);
      if (found) {
        setSelectedPackageId(pkgId);
        setStep("info");
      }
    }
  }, [packages, packageParam]);

  // When package is chosen, move to info step
  function handleSelectPackage(pkgId: number) {
    setSelectedPackageId(pkgId);
    setStep("info");
  }

  function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!info.customerName.trim()) return toast.error("Please enter your name.");
    if (!info.customerPhone.trim() || info.customerPhone.replace(/\D/g, "").length < 10)
      return toast.error("Please enter a valid 10-digit phone number.");
    if (info.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.customerEmail))
      return toast.error("Please enter a valid email address.");

    if (!selectedPkg) return;

    setEnrollmentData({
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      downPayment: noDownPayment ? 0 : parseFloat(selectedPkg.downPayment as string),
      enrollmentFee: noDownPayment ? 0 : parseFloat(selectedPkg.enrollmentFee as string),
      monthlyPrice: parseFloat(selectedPkg.monthlyPrice as string),
      durationMonths: selectedPkg.durationMonths,
      customerName: info.customerName.trim(),
      customerEmail: info.customerEmail.trim(),
      customerPhone: info.customerPhone.trim(),
      studentName: info.studentName.trim() || info.customerName.trim(),
      waiveDownPayment: noDownPayment || undefined,
    });
    setStep("payment");
  }

  function handleEnrollmentSuccess(message: string) {
    window.location.href = "/enrollment/success";
  }

  function handleEnrollmentError(message: string) {
    toast.error(message);
  }

  const PROGRAM_EMOJI: Record<string, string> = {
    "Kickboxing": "🥊",
    "Little Ninjas": "🥷",
    "Dragon Kids": "🐉",
    "Teens": "⚡",
    "Adult Karate": "🥋",
    "Summer Camp": "☀️",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <img src="/images/logo-white.webp" alt="MyDojo" className="h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <h1 className="text-2xl font-heading font-bold uppercase tracking-wide">
              {programParam ? `${PROGRAM_EMOJI[programParam] || "🥋"} ${programParam} Enrollment` : "Join MyDojo"}
            </h1>
            <p className="text-gray-400 text-sm">Tomball, TX · Premier Martial Arts Training</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm">
          {(["package", "info", "payment"] as Step[]).map((s, i) => {
            const labels = ["Choose Plan", "Your Info", "Payment"];
            const isDone = ["package", "info", "payment"].indexOf(step) > i;
            const isActive = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                <span
                  className={`font-medium ${isActive ? "text-primary" : isDone ? "text-green-600" : "text-gray-400"}`}
                >
                  {i + 1}. {labels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Package selection */}
        {step === "package" && (
          <div>
            <h2 className="text-xl font-heading font-bold uppercase mb-1">Choose Your Membership</h2>
            <p className="text-gray-500 text-sm mb-6">
              {programParam ? `Enrolling in: ${programParam}` : "Select the plan that fits your goals."}
            </p>

            {pkgsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !packages?.length ? (
              <p className="text-center text-gray-500 py-16">No packages available. Please contact the front desk.</p>
            ) : (
              <div className="grid gap-4">
                {packages.map((pkg) => {
                  const monthly = parseFloat(pkg.monthlyPrice as string);
                  const down = parseFloat(pkg.downPayment as string);
                  let benefits: string[] = [];
                  try { benefits = pkg.benefits ? JSON.parse(pkg.benefits as string) : []; } catch { benefits = []; }
                  return (
                    <Card
                      key={pkg.id}
                      className="cursor-pointer border-2 hover:border-primary transition-all"
                      onClick={() => handleSelectPackage(pkg.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg font-heading uppercase">{pkg.name}</CardTitle>
                            <p className="text-gray-500 text-sm mt-1">{pkg.description || `${pkg.durationMonths}-month program`}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">${monthly.toFixed(0)}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                            <div className="text-xs text-gray-400">Down: ${down.toFixed(0)} today</div>
                          </div>
                        </div>
                      </CardHeader>
                      {benefits.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1 mt-2">
                            {benefits.slice(0, 4).map((b, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />{b}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Personal info */}
        {step === "info" && selectedPkg && (
          <div>
            <button
              onClick={() => setStep("package")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Back to plans
            </button>
            <h2 className="text-xl font-heading font-bold uppercase mb-1">Your Information</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enrolling in: <strong>{selectedPkg.name}</strong> — ${parseFloat(selectedPkg.monthlyPrice as string).toFixed(0)}/mo
            </p>

            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customerName" className="flex items-center gap-1 mb-1">
                  <User className="w-4 h-4" /> Your Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  placeholder="Jane Smith"
                  value={info.customerName}
                  onChange={(e) => setInfo({ ...info, customerName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerPhone" className="flex items-center gap-1 mb-1">
                  <Phone className="w-4 h-4" /> Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={info.customerPhone}
                  onChange={(e) => setInfo({ ...info, customerPhone: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerEmail" className="flex items-center gap-1 mb-1">
                  <Mail className="w-4 h-4" /> Email Address <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="jane@example.com"
                  value={info.customerEmail}
                  onChange={(e) => setInfo({ ...info, customerEmail: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="studentName" className="flex items-center gap-1 mb-1">
                  <User className="w-4 h-4" /> Student Name <span className="text-gray-400 text-xs">(if different from above)</span>
                </Label>
                <Input
                  id="studentName"
                  placeholder="Leave blank if same as above"
                  value={info.studentName}
                  onChange={(e) => setInfo({ ...info, studentName: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full mt-2" size="lg">
                Continue to Payment <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && enrollmentData && (
          <div>
            <button
              onClick={() => setStep("info")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Back to info
            </button>
            <FluidPayEnrollmentForm
              enrollmentData={enrollmentData}
              onSuccess={handleEnrollmentSuccess}
              onError={handleEnrollmentError}
              initialPromo={promoParam}
            />
          </div>
        )}
      </div>
    </div>
  );
}
