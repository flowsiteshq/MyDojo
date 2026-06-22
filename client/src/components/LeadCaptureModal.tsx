/**
 * LeadCaptureModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Two modes:
 *
 * 1. "Book a Free Class" gate (default) — collects name, phone, email then
 *    saves the lead and opens Kai with a personalised greeting.
 *
 * 2. Legacy Dialog mode (trigger / isOpen / onOpenChange props) — kept for
 *    backward compatibility with any existing usages.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, X, ArrowRight, Phone, Mail, User } from "lucide-react";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface LeadData {
  name: string;
  phone: string;
  email: string;
}

// ─── Legacy dialog props (backward compat) ───────────────────────────────────

interface LegacyLeadCaptureModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When provided, switches to the Kai-gate mode */
  onSuccess?: never;
  onClose?: never;
}

// ─── Kai-gate props ───────────────────────────────────────────────────────────

interface KaiGateLeadCaptureModalProps {
  /** Called after the lead is saved; passes collected data so Kai can greet by name */
  onSuccess: (lead: LeadData) => void;
  onClose: () => void;
  trigger?: never;
  isOpen?: never;
  onOpenChange?: never;
}

type LeadCaptureModalProps = LegacyLeadCaptureModalProps | KaiGateLeadCaptureModalProps;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROGRAM_MAP: Record<
  string,
  | "Little Ninjas"
  | "Dragon Kids"
  | "Teens"
  | "Adult Karate"
  | "Kickboxing"
  | "After School"
  | "Not Sure"
> = {
  "little-ninjas": "Little Ninjas",
  "core-kids": "Dragon Kids",
  teens: "Teens",
  adults: "Adult Karate",
  "after-school": "After School",
};

function normalisePhone(v: string) {
  return v.replace(/\D/g, "");
}

// ─── Kai-gate modal ───────────────────────────────────────────────────────────

function KaiGateModal({
  onSuccess,
  onClose,
}: {
  onSuccess: (lead: LeadData) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  const createLead = trpc.trialSignups.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        onSuccess({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      }, 600);
    },
    onError: () => {
      // Don't block the visitor even if the DB call fails
      onSuccess({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    },
  });

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Please enter your name";
    if (normalisePhone(phone).length < 10) e.phone = "Please enter a valid phone number";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Please enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createLead.mutate({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      program: "Not Sure",
      location: "Tomball, TX",
      source: "website",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-8 pb-6"
          style={{
            background:
              "linear-gradient(135deg, #1a0505 0%, #3d0a0a 50%, #1a0505 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo-icon-white.99cb4daa.webp"
                alt="MyDojo"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Kai</p>
              <p className="text-white/50 text-[10px] leading-none mt-0.5">
                MyDojo Assistant
              </p>
            </div>
          </div>

          <h2 className="text-white text-2xl font-black leading-tight">
            Book Your{" "}
            <span style={{ color: "#E11D2A" }}>Free Class</span>
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Enter your info and Kai will help you find the perfect program.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
              Your Name <span style={{ color: "#E11D2A" }}>*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="First & last name"
                autoFocus
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: errors.name
                    ? "1px solid #E11D2A"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: "#E11D2A" }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
              Phone Number <span style={{ color: "#E11D2A" }}>*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((p) => ({ ...p, phone: undefined }));
                }}
                placeholder="(555) 555-5555"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: errors.phone
                    ? "1px solid #E11D2A"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
            {errors.phone && (
              <p className="text-xs mt-1" style={{ color: "#E11D2A" }}>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
              Email{" "}
              <span className="text-white/30 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: errors.email
                    ? "1px solid #E11D2A"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "#E11D2A" }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createLead.isPending || submitted}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 mt-2"
            style={{ background: "linear-gradient(135deg, #E11D2A, #b01520)" }}
          >
            {createLead.isPending || submitted ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {submitted ? "Opening Kai…" : "Saving…"}
              </>
            ) : (
              <>
                Chat with Kai
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-white/30 leading-relaxed">
            By submitting you agree to receive texts/calls about your free
            class. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Legacy dialog (backward compat) ─────────────────────────────────────────

function LegacyLeadCaptureModal({
  trigger,
  isOpen,
  onOpenChange,
}: LegacyLeadCaptureModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.trialSignups.create.useMutation({
    onSuccess: () => {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setProgram("");
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const mappedProgram = PROGRAM_MAP[program] ?? "Not Sure";
    submitMutation.mutate({
      name: fullName,
      email: email.trim(),
      phone: phone.trim(),
      program: mappedProgram,
      location: "Tomball HQ",
      preferredContactMethod: "email",
      source: "landing_page",
    });
  };

  const isSuccess = submitMutation.isSuccess;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] bg-white text-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold text-center">
            {isSuccess ? "YOU'RE IN!" : "START YOUR JOURNEY"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {isSuccess
              ? "Thanks for your interest! One of our team members will contact you shortly to schedule your first class."
              : "Fill out the form below to claim your free trial class. Limited spots available!"}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-wider mt-4"
              onClick={() => onOpenChange?.(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-xs font-bold uppercase text-gray-500"
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  required
                  placeholder="John"
                  className="bg-gray-50"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-bold uppercase text-gray-500"
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  required
                  placeholder="Doe"
                  className="bg-gray-50"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-bold uppercase text-gray-500"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                className="bg-gray-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-xs font-bold uppercase text-gray-500"
              >
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                placeholder="(555) 123-4567"
                className="bg-gray-50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="program"
                className="text-xs font-bold uppercase text-gray-500"
              >
                Interested Program
              </Label>
              <Select required value={program} onValueChange={setProgram}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="little-ninjas">
                    Little Ninjas (3-5)
                  </SelectItem>
                  <SelectItem value="core-kids">Dragon Kids (5-12)</SelectItem>
                  <SelectItem value="teens">Teens (12-17)</SelectItem>
                  <SelectItem value="adults">Adults (18+)</SelectItem>
                  <SelectItem value="after-school">After School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-heading uppercase tracking-wider text-lg mt-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Claim Free Trial"
              )}
            </Button>

            <p className="text-[10px] text-center text-gray-400 mt-2">
              By submitting this form, you agree to receive text messages and
              emails from MyDojo. Msg & data rates may apply.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function LeadCaptureModal(props: LeadCaptureModalProps) {
  if ("onSuccess" in props && props.onSuccess) {
    return (
      <KaiGateModal onSuccess={props.onSuccess} onClose={props.onClose!} />
    );
  }
  return <LegacyLeadCaptureModal {...(props as LegacyLeadCaptureModalProps)} />;
}
