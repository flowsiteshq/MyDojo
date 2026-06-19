import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { openIntakeChatbot } from "@/lib/chatbot";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Waiver() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    id: number;
    name: string;
    email: string;
    signedAt: string;
  } | null>(null);

  const submitWaiver = trpc.waiver.submit.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setSubmissionData({
        id: data.id,
        name: data.name,
        email: data.email,
        signedAt: data.signedAt,
      });
      // Reset form
      setFormData({ name: "", phone: "", email: "" });
      setAcceptedTerms(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert("Please accept the waiver terms to continue.");
      return;
    }
    submitWaiver.mutate(formData);
  };

  const isFormValid = formData.name && formData.phone && formData.email && acceptedTerms;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-black text-white py-20">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://storage.manus.space/mydojo-website-assets/kickboxing-hero-diverse-women.jpg" 
            alt="MyDojo Training" 
            className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
            LIABILITY WAIVER & <span className="text-primary">PHOTO CONSENT</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Please read carefully before participating in MyDojo programs and activities.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="bg-gray-50 border-l-4 border-primary p-6 mb-8">
            <p className="text-lg font-semibold text-gray-900 mb-2">Important Notice</p>
            <p className="text-gray-700">
              This waiver and release of liability applies to all participants in MyDojo Martial Arts & Fitness programs, classes, events, and activities. By participating, you acknowledge and accept the terms outlined below.
            </p>
          </div>

          {/* Assumption of Risk */}
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Assumption of Risk</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                I understand and acknowledge that participation in martial arts, kickboxing, fitness training, and related activities at MyDojo Martial Arts & Fitness ("MyDojo") involves inherent risks, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Physical contact with other participants, instructors, and equipment</li>
                <li>Sprains, strains, fractures, bruises, and other bodily injuries</li>
                <li>Cardiovascular stress and exertion</li>
                <li>Slips, trips, and falls on training surfaces</li>
                <li>Impact from punching bags, pads, and training equipment</li>
                <li>Injuries resulting from improper technique or overexertion</li>
              </ul>
              <p>
                I voluntarily assume all risks associated with my participation or my child's participation in MyDojo programs and activities, whether known or unknown, and whether caused by the negligence of MyDojo, its owners, instructors, employees, or other participants.
              </p>
            </div>
          </div>

          {/* Release of Liability */}
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Release of Liability</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                In consideration for being permitted to participate in MyDojo programs and activities, I hereby release, waive, discharge, and covenant not to sue MyDojo Martial Arts & Fitness, its owners, directors, officers, employees, instructors, agents, and representatives (collectively, the "Released Parties") from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me or my child, or to any property belonging to me or my child, whether caused by the negligence of the Released Parties or otherwise, while participating in such activities, or while in, on, or upon the premises where the activities are being conducted.
              </p>
              <p>
                I agree to indemnify and hold harmless the Released Parties from any loss, liability, damage, or costs, including court costs and attorney's fees, that may incur due to my participation or my child's participation in MyDojo activities, whether caused by negligence of the Released Parties or otherwise.
              </p>
            </div>
          </div>

          {/* Medical Authorization */}
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Medical Authorization</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                I certify that I (or my child) am in good physical condition and do not suffer from any known disability or condition that would prevent or limit participation in martial arts or fitness activities. I acknowledge that MyDojo has recommended that I consult with a physician before beginning any exercise program.
              </p>
              <p>
                In the event of a medical emergency, I authorize MyDojo staff to secure emergency medical treatment for me or my child, and I agree to be financially responsible for any costs incurred as a result of such treatment. I am aware and understand that I should carry my own health insurance.
              </p>
            </div>
          </div>

          {/* Photo and Video Consent */}
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Photo, Video & <span className="text-primary">Marketing Consent</span>
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                I grant MyDojo Martial Arts & Fitness and its representatives the irrevocable right and permission to photograph, video record, and/or otherwise capture my likeness or my child's likeness (collectively, "Media") in connection with MyDojo programs, classes, events, and activities.
              </p>
              <p>
                I authorize MyDojo to use, reproduce, distribute, display, and publish such Media, in whole or in part, without restriction or limitation, for any lawful purpose, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Marketing and advertising materials (print, digital, social media)</li>
                <li>Website content and promotional videos</li>
                <li>Social media posts and stories (Facebook, Instagram, TikTok, YouTube, etc.)</li>
                <li>Brochures, flyers, and other promotional materials</li>
                <li>Testimonials and success stories</li>
                <li>Internal training and instructional materials</li>
              </ul>
              <p>
                I understand and agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>MyDojo retains all rights, title, and interest in the Media</li>
                <li>I will not receive any compensation or royalties for the use of the Media</li>
                <li>The Media may be used in perpetuity and may be edited, altered, or modified at MyDojo's discretion</li>
                <li>I waive any right to inspect or approve the finished product or any written copy that may be used in connection with the Media</li>
                <li>I release MyDojo from any claims that may arise regarding the use of the Media, including claims of defamation, invasion of privacy, or infringement of moral rights</li>
              </ul>
            </div>
          </div>

          {/* Parent/Guardian Consent */}
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Parent/Guardian Consent for Minors</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                If the participant is under 18 years of age, I certify that I am the parent or legal guardian of the minor named above, and I have the legal authority to execute this waiver and release on behalf of the minor. I have read and understood this document, and I agree to be bound by its terms on behalf of myself and the minor.
              </p>
              <p>
                I understand that this waiver includes any claims based on the actions, omissions, or negligence of MyDojo, its owners, employees, instructors, and agents, whether a COVID-19 infection occurs before, during, or after participation in MyDojo programs.
              </p>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Acknowledgment & Agreement</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                I have read this waiver and release of liability, assumption of risk, and photo/video consent agreement, fully understand its terms, and understand that I am giving up substantial rights, including my right to sue. I acknowledge that I am signing this agreement freely and voluntarily, and intend my signature to be a complete and unconditional release of all liability to the greatest extent allowed by law.
              </p>
              <p className="font-semibold">
                This agreement shall be binding upon me, my heirs, executors, administrators, and assigns.
              </p>
            </div>
          </div>

          {/* Opt-Out Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-12">
            <p className="text-lg font-semibold text-gray-900 mb-2">Photo/Video Opt-Out</p>
            <p className="text-gray-700 mb-4">
              If you do not wish to have your photo or video used for marketing purposes, please notify us in writing at the time of registration or contact us at:
            </p>
            <p className="text-gray-900 font-semibold">
              Email: info@mydojo.com<br />
              Phone: (877) 4-MYDOJO
            </p>
          </div>

          {/* Digital Signature Form */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 mb-8">
            <h2 className="text-3xl font-heading font-bold mb-6 text-center">
              <span className="text-primary">Digital Signature</span>
            </h2>
            
            {submitted && submissionData ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Waiver Submitted Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for signing our waiver, {submissionData.name}!
                </p>

                {/* QR Code Section */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 inline-block">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Your Waiver Confirmation</h4>
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG 
                      value={JSON.stringify({
                        id: submissionData.id,
                        name: submissionData.name,
                        email: submissionData.email,
                        signedAt: submissionData.signedAt,
                        type: 'waiver'
                      })}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-3 max-w-sm mx-auto">
                    Show this QR code at the front desk to confirm your signed waiver
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Waiver ID: #{submissionData.id}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => window.print()}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Print Confirmation
                  </Button>
                  <Button 
                    onClick={() => {
                      setSubmitted(false);
                      setSubmissionData(null);
                    }}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Submit Another Waiver
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-gray-700 mb-6">
                  By providing your information and accepting below, you are digitally signing this waiver and agreeing to all terms outlined above.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base font-semibold">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-base font-semibold">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base font-semibold">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer">
                    I have read and understand the Liability Waiver, Assumption of Risk, Medical Authorization, and Photo/Video Consent outlined above. I agree to all terms and conditions and acknowledge that I am signing this agreement freely and voluntarily. <span className="text-red-500">*</span>
                  </Label>
                </div>

                {submitWaiver.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <p className="font-semibold">Error submitting waiver</p>
                    <p className="text-sm">{submitWaiver.error.message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!isFormValid || submitWaiver.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-heading uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitWaiver.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Sign Waiver & Accept Terms"
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By clicking "Sign Waiver & Accept Terms", your digital signature will be recorded along with the date and time of submission.
                </p>
              </form>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-black text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-heading font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-gray-300 mb-6">
              Join our high-energy, fat-burning 45-minute complimentary Karate or Kickboxing class!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={openIntakeChatbot} className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-heading uppercase">
                Book Free Trial
              </Button>
              <Link href="/contact">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-6 text-lg font-heading uppercase">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-12 text-sm text-gray-500 text-center">
            <p>
              Last Updated: February 2026<br />
              MyDojo Martial Arts & Fitness | Tomball, Texas
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
