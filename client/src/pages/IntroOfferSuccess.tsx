import { useTranslation } from "react-i18next";
/**
 * IntroOfferSuccess.tsx
 * Shown after a successful free class booking.
 * URL: /intro-offer-success?name=John&program=Little+Ninjas
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, Calendar, MapPin, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IntroOfferSuccess() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "there";
  const program = params.get("program") || "your program";
  const firstName = name.split(" ")[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 px-6 py-4">
        <Link href="/">
          <img src="/images/mydojo-logo.png" alt="MyDojo" className="h-10 object-contain" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>

          {/* Headline */}
          <div className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4 rounded-sm">
            Payment Confirmed
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase mb-3">
            Welcome to <span className="text-primary">MyDojo</span>,<br />
            {firstName}! 🥋
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Your <strong className="text-white">{program}</strong> free class is confirmed.
            Welcome to MyDojo — we can’t wait to see you on the mat!
          </p>

          {/* What's Next Card */}
          <div className="bg-gray-900 rounded-2xl p-6 text-left mb-6 border border-gray-800">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-4 text-primary">
              What Happens Next
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Check your email</p>
                  <p className="text-gray-400 text-sm">
                    A confirmation with your receipt and class details is on its way.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-white">We'll call you to schedule</p>
                  <p className="text-gray-400 text-sm">
                    Our team will reach out within 24 hours to book your first class at a time that works for you.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Show up &amp; get your uniform</p>
                  <p className="text-gray-400 text-sm">
                    Arrive 10–15 minutes early. Wear comfortable clothes — we'll provide your uniform on the spot!
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Location Info */}
          <div className="bg-gray-900 rounded-2xl p-5 text-left mb-6 border border-gray-800">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-3 text-gray-400">
              Find Us
            </h2>
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">MyDojo Martial Arts &amp; Fitness</p>
                <p className="text-gray-400 text-sm">11721 Spring Cypress Rd, Tomball, TX 77377</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary flex-shrink-0" />
              <a href="tel:+18774693656" className="text-white hover:text-primary transition-colors font-semibold">
                (877) 4-MYDOJO
              </a>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://maps.google.com/?q=11721+Spring+Cypress+Rd+Tomball+TX+77377"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-800 gap-2">
                <MapPin className="w-4 h-4" /> Get Directions
              </Button>
            </a>
            <Link href="/schedule" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white gap-2">
                <Calendar className="w-4 h-4" /> View Schedule <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <p className="text-gray-600 text-xs mt-6">
            Questions? Call or text us at{" "}
            <a href="tel:+18774693656" className="text-gray-400 hover:text-white">
              (877) 4-MYDOJO
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
