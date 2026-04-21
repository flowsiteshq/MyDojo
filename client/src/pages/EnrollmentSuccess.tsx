import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, UserPlus, Home } from "lucide-react";

export default function EnrollmentSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Image Section */}
      <div className="relative h-64 bg-black overflow-hidden">
        <img
          src="/images/hero-main.webp"
          alt="MyDojo Training"
          className="w-full h-full object-cover opacity-40" loading="lazy" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white text-center px-4">
            WELCOME TO MYDOJO!
          </h1>
        </div>
      </div>

      {/* Success Content */}
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <Card className="p-8 md:p-12 text-center shadow-xl">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-gray-900">
            Enrollment Complete!
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Thank you for joining the MyDojo family. Your payment has been processed successfully.
          </p>

          {/* Next Step CTA — Primary Action */}
          <div className="bg-primary/5 border-2 border-primary/30 rounded-xl p-6 mb-8">
            <div className="flex justify-center mb-3">
              <div className="bg-primary/10 rounded-full p-3">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">One More Step!</h3>
            <p className="text-gray-600 mb-5">
              Please complete your student profile so we can prepare for your first class. We need your student's name, date of birth, and program details.
            </p>
            <Button
              onClick={() => setLocation("/dashboard?newStudent=true")}
              className="bg-primary hover:bg-primary/90 text-white px-10 py-6 h-auto font-heading uppercase tracking-wider text-lg w-full sm:w-auto"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Complete Student Profile
            </Button>
          </div>

          {/* What's Next Section */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-xl font-bold mb-4 text-gray-900">What Happens Next?</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary mr-2 font-bold">1.</span>
                <span>Complete your student profile (click the button above)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 font-bold">2.</span>
                <span>You'll receive a confirmation email with your enrollment details</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 font-bold">3.</span>
                <span>Our team will contact you within 24 hours to schedule your first class</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 font-bold">4.</span>
                <span>Your monthly membership will begin billing automatically</span>
              </li>
            </ul>
          </div>

          {/* What to Bring */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left border border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900">What to Bring to Your First Class</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Comfortable athletic clothing (t-shirt and athletic pants/shorts)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Water bottle to stay hydrated</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Positive attitude and willingness to learn!</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span className="italic text-sm">Note: Training barefoot is required — no shoes on the mat</span>
              </li>
            </ul>
          </div>

          {/* Secondary Action */}
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 px-8 py-4 h-auto"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Homepage
          </Button>

          {/* Session ID for reference */}
          {sessionId && (
            <p className="text-xs text-gray-400 mt-8">
              Reference ID: {sessionId.substring(0, 20)}...
            </p>
          )}
        </Card>

        {/* Contact Info */}
        <div className="text-center mt-8 text-gray-600">
          <p className="mb-2">Questions? We're here to help!</p>
          <p className="font-bold text-gray-900">(877) 4-MYDOJO</p>
        </div>
      </div>
    </div>
  );
}
