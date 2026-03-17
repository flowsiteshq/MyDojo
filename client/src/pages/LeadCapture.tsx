import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Loader2 } from "lucide-react";

export default function LeadCapture() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    childName: "",
    program: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitLead = trpc.trialSignups.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    submitLead.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      program: formData.program as any,
      location: "Tomball HQ",
      preferredContactMethod: "email",
      message: formData.childName ? `Child's name: ${formData.childName}` : undefined,
      source: "trial_form" as const,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold mb-4 text-black">
            Thank You!
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            We've received your information and will contact you shortly to schedule your free trial class.
          </p>
          <p className="text-gray-500 text-sm">
            Check your email for confirmation and next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/images/mydojo-logo-white.png" 
            alt="MyDojo" 
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            CLAIM YOUR <span className="text-primary">FREE TRIAL</span>
          </h1>
          <p className="text-xl text-gray-300">
            Experience world-class martial arts training. No commitment required.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-base font-semibold text-gray-900">
                Your Name *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-2 h-12 text-base"
                placeholder="John Smith"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-base font-semibold text-gray-900">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-2 h-12 text-base"
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-base font-semibold text-gray-900">
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-2 h-12 text-base"
                placeholder="(281) 555-1234"
              />
            </div>

            {/* Child's Name (Optional) */}
            <div>
              <Label htmlFor="childName" className="text-base font-semibold text-gray-900">
                Child's Name (if applicable)
              </Label>
              <Input
                id="childName"
                name="childName"
                type="text"
                value={formData.childName}
                onChange={handleChange}
                className="mt-2 h-12 text-base"
                placeholder="Optional"
              />
            </div>

            {/* Program Selection */}
            <div>
              <Label htmlFor="program" className="text-base font-semibold text-gray-900">
                Select Program *
              </Label>
              <select
                id="program"
                name="program"
                required
                value={formData.program}
                onChange={handleChange}
                className="mt-2 w-full h-12 px-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Choose a program...</option>
                <option value="Little Ninjas">Little Ninjas (Ages 3-5)</option>
                <option value="Dragon Kids">Dragon Kids (Ages 5-12)</option>
                <option value="Teens">Teens (Ages 12-17)</option>
                <option value="Adults">Adults (Ages 18+)</option>
                <option value="Kickboxing">Kickboxing</option>
                <option value="After School">After School Program</option>
                <option value="Not Sure">Not Sure - Help Me Choose</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitLead.isPending}
              className="w-full h-14 text-lg font-heading font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white"
            >
              {submitLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Claim My Free Trial"
              )}
            </Button>

            {submitLead.error && (
              <p className="text-red-600 text-sm text-center">
                {submitLead.error.message}
              </p>
            )}
          </form>

          {/* Trust Indicators */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">500+</p>
                <p className="text-xs text-gray-600">Happy Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">15+</p>
                <p className="text-xs text-gray-600">Years Experience</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">4.9★</p>
                <p className="text-xs text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-400 text-sm mt-6">
          By submitting this form, you agree to receive communications from MyDojo.
        </p>
      </div>
    </div>
  );
}
