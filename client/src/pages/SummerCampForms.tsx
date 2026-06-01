import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle, Loader2, Shirt, ClipboardList } from "lucide-react";

const TSHIRT_SIZES = [
  { value: "YXS", label: "Youth XS (4-6)" },
  { value: "YS", label: "Youth S (6-8)" },
  { value: "YM", label: "Youth M (10-12)" },
  { value: "YL", label: "Youth L (14-16)" },
  { value: "YXL", label: "Youth XL (18-20)" },
  { value: "AS", label: "Adult S" },
  { value: "AM", label: "Adult M" },
  { value: "AL", label: "Adult L" },
  { value: "AXL", label: "Adult XL" },
  { value: "A2XL", label: "Adult 2XL" },
];

export default function SummerCampForms() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const enrollmentId = parseInt(params.get("id") || "0");
  const rawPhone = params.get("phone") || "";

  const [step, setStep] = useState<"verify" | "forms" | "done">("verify");
  const [phone, setPhone] = useState(rawPhone);
  const [verifyError, setVerifyError] = useState("");
  const [enrollment, setEnrollment] = useState<any>(null);

  // T-shirt sizes state: one per student
  const [tshirtSizes, setTshirtSizes] = useState<{ studentName: string; size: string }[]>([]);

  // Medical info state
  const [medical, setMedical] = useState({
    allergies: "",
    medications: "",
    conditions: "",
    emergencyContact: "",
    emergencyPhone: "",
    doctorName: "",
    doctorPhone: "",
    canSwim: false,
    photoRelease: false,
    medicalRelease: false,
  });

  const [submitError, setSubmitError] = useState("");

  const getByPhone = trpc.campEnrollments.getByPhone.useQuery(
    { enrollmentId, parentPhone: phone },
    { enabled: false, retry: false }
  );

  const submitForms = trpc.campEnrollments.submitForms.useMutation();

  // Auto-verify if phone is in URL
  useEffect(() => {
    if (rawPhone && enrollmentId > 0) {
      handleVerify(rawPhone);
    }
  }, []);

  async function handleVerify(phoneToUse?: string) {
    setVerifyError("");
    const p = (phoneToUse || phone).replace(/\D/g, "");
    if (p.length < 7) {
      setVerifyError("Please enter a valid phone number.");
      return;
    }
    try {
      const result = await getByPhone.refetch();
      if (result.data) {
        setEnrollment(result.data);
        // Initialize t-shirt sizes for each student
        setTshirtSizes(result.data.students.map((s: any) => ({ studentName: s.name, size: "" })));
        if (result.data.formsCompleted) {
          setStep("done");
        } else {
          setStep("forms");
        }
      } else {
        setVerifyError("Enrollment not found. Please check your phone number.");
      }
    } catch (e: any) {
      setVerifyError(e?.message || "Enrollment not found. Please check your phone number.");
    }
  }

  async function handleSubmit() {
    setSubmitError("");
    // Validate
    if (tshirtSizes.some(t => !t.size)) {
      setSubmitError("Please select a t-shirt size for every camper.");
      return;
    }
    if (!medical.emergencyContact || !medical.emergencyPhone) {
      setSubmitError("Emergency contact name and phone are required.");
      return;
    }
    if (!medical.medicalRelease || !medical.photoRelease) {
      setSubmitError("Please check both the medical release and photo release to continue.");
      return;
    }
    try {
      await submitForms.mutateAsync({
        enrollmentId,
        parentPhone: phone.replace(/\D/g, ""),
        tshirtSizes: tshirtSizes as any,
        medicalInfo: medical,
      });
      setStep("done");
    } catch (e: any) {
      setSubmitError(e?.message || "Something went wrong. Please try again.");
    }
  }

  if (!enrollmentId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">This link is missing required information. Please use the link sent to you via text message.</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">All Done!</h1>
          <p className="text-gray-600 text-lg mb-2">Your t-shirt sizes and medical information have been submitted.</p>
          <p className="text-gray-500">We'll see you at MyDojo Summer Camp! Questions? Call us at <a href="tel:8774693656" className="text-red-600 font-semibold">(877) 469-3656</a>.</p>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <img src="/images/mydojo-logo.png" alt="MyDojo" className="h-12 mx-auto mb-4" onError={e => (e.currentTarget.style.display = 'none')} />
            <h1 className="text-2xl font-bold text-gray-900">Summer Camp Forms</h1>
            <p className="text-gray-500 mt-2">Enter your phone number to access your enrollment forms.</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Parent Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 555-5555"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="mt-1"
                onKeyDown={e => e.key === "Enter" && handleVerify()}
              />
            </div>
            {verifyError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {verifyError}
              </div>
            )}
            <Button
              onClick={() => handleVerify()}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={getByPhone.isFetching}
            >
              {getByPhone.isFetching ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying...</> : "Access My Forms"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step: forms
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/images/mydojo-logo.png" alt="MyDojo" className="h-12 mx-auto mb-4" onError={e => (e.currentTarget.style.display = 'none')} />
          <h1 className="text-3xl font-bold text-gray-900">Summer Camp Forms</h1>
          <p className="text-gray-500 mt-1">Hi {enrollment?.parentName?.split(" ")[0]}! Please complete the forms below for your camper{enrollment?.students?.length > 1 ? "s" : ""}.</p>
        </div>

        {/* T-Shirt Sizes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-red-100 p-2 rounded-lg">
              <Shirt className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">T-Shirt Sizes</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">Each camper receives a MyDojo Summer Camp t-shirt. Please select the correct size for each child.</p>
          <div className="space-y-4">
            {tshirtSizes.map((ts, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-gray-700 font-medium">{ts.studentName}</Label>
                </div>
                <div className="w-48">
                  <Select value={ts.size} onValueChange={val => {
                    const updated = [...tshirtSizes];
                    updated[i] = { ...updated[i], size: val };
                    setTshirtSizes(updated);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TSHIRT_SIZES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Questionnaire */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Medical Questionnaire</h2>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="allergies">Allergies <span className="text-gray-400 font-normal">(food, medication, environmental)</span></Label>
              <Textarea
                id="allergies"
                placeholder="List any allergies, or type 'None'"
                value={medical.allergies}
                onChange={e => setMedical({ ...medical, allergies: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                placeholder="List any medications your child takes, or type 'None'"
                value={medical.medications}
                onChange={e => setMedical({ ...medical, medications: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="conditions">Medical Conditions or Special Needs</Label>
              <Textarea
                id="conditions"
                placeholder="Asthma, ADHD, diabetes, mobility issues, etc. — or type 'None'"
                value={medical.conditions}
                onChange={e => setMedical({ ...medical, conditions: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name <span className="text-red-500">*</span></Label>
                <Input
                  id="emergencyContact"
                  placeholder="Full name"
                  value={medical.emergencyContact}
                  onChange={e => setMedical({ ...medical, emergencyContact: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone <span className="text-red-500">*</span></Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={medical.emergencyPhone}
                  onChange={e => setMedical({ ...medical, emergencyPhone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorName">Doctor's Name <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  id="doctorName"
                  placeholder="Dr. Smith"
                  value={medical.doctorName}
                  onChange={e => setMedical({ ...medical, doctorName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="doctorPhone">Doctor's Phone <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input
                  id="doctorPhone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={medical.doctorPhone}
                  onChange={e => setMedical({ ...medical, doctorPhone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="canSwim"
                checked={medical.canSwim}
                onCheckedChange={v => setMedical({ ...medical, canSwim: !!v })}
              />
              <Label htmlFor="canSwim" className="cursor-pointer">My child can swim independently</Label>
            </div>

            {/* Releases */}
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Releases & Agreements</h3>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="photoRelease"
                  checked={medical.photoRelease}
                  onCheckedChange={v => setMedical({ ...medical, photoRelease: !!v })}
                  className="mt-0.5"
                />
                <Label htmlFor="photoRelease" className="cursor-pointer text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold">Photo/Video Release:</span> I give MyDojo Martial Arts & Fitness permission to photograph and/or video record my child during summer camp activities for use in promotional materials, social media, and the MyDojo website.
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="medicalRelease"
                  checked={medical.medicalRelease}
                  onCheckedChange={v => setMedical({ ...medical, medicalRelease: !!v })}
                  className="mt-0.5"
                />
                <Label htmlFor="medicalRelease" className="cursor-pointer text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold">Medical Release:</span> In the event of a medical emergency, I authorize MyDojo staff to seek medical attention for my child. I certify that the medical information provided above is accurate to the best of my knowledge.
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        {submitError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}
        <Button
          onClick={handleSubmit}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6 h-auto font-bold"
          disabled={submitForms.isPending}
        >
          {submitForms.isPending ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Submitting...</> : "Submit Forms"}
        </Button>
        <p className="text-center text-gray-400 text-xs mt-3">Your information is kept private and used only for camp operations.</p>
      </div>
    </div>
  );
}
