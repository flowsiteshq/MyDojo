import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

interface LeadCaptureModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PROGRAM_MAP: Record<string, "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "After School" | "Not Sure"> = {
  "little-ninjas": "Little Ninjas",
  "core-kids": "Dragon Kids",
  "teens": "Teens",
  "adults": "Adult Karate",
  "after-school": "After School",
};

export function LeadCaptureModal({ trigger, isOpen, onOpenChange }: LeadCaptureModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.trialSignups.create.useMutation({
    onSuccess: () => {
      // Reset form
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
                <Label htmlFor="firstName" className="text-xs font-bold uppercase text-gray-500">First Name</Label>
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
                <Label htmlFor="lastName" className="text-xs font-bold uppercase text-gray-500">Last Name</Label>
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
              <Label htmlFor="email" className="text-xs font-bold uppercase text-gray-500">Email</Label>
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
              <Label htmlFor="phone" className="text-xs font-bold uppercase text-gray-500">Phone</Label>
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
              <Label htmlFor="program" className="text-xs font-bold uppercase text-gray-500">Interested Program</Label>
              <Select required value={program} onValueChange={setProgram}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="little-ninjas">Little Ninjas (3-5)</SelectItem>
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
              By submitting this form, you agree to receive text messages and emails from MyDojo.
              Msg & data rates may apply.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
