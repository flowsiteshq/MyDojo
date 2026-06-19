import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { programs } from "@/data/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ArrowLeft, Clock, Users, Calendar, Phone, Mail, CheckCircle2, Star, Shield, Zap } from "lucide-react";
import SEO from "../components/SEO";
import SchemaMarkup from "../components/SchemaMarkup";
import NotFound from "./NotFound";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProgramDetail() {
  const { t } = useTranslation();
  const [match, params] = useRoute("/programs/:id");

  // Lead form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [contactMethod, setContactMethod] = useState<"text" | "phone" | "email">("text");
  const [submitted, setSubmitted] = useState(false);

  const createLead = trpc.trialSignups.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  if (!match) return <NotFound />;
  const program = programs.find((p) => p.id === params.id);
  if (!program) return <NotFound />;

  const isKidsProgram = ["little-ninjas", "dragon-kids", "after-school", "summer-camp"].includes(program.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createLead.mutate({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      program: program.id === "little-ninjas" ? "Little Ninjas"
        : program.id === "dragon-kids" ? "Dragon Kids"
        : program.id === "teens" ? "Teens"
        : program.id === "adult-karate" ? "Adult Karate"
        : program.id === "kickboxing" ? "Kickboxing"
        : program.id === "after-school" ? "After School"
        : program.id === "summer-camp" ? "Summer Camp"
        : "Not Sure",
      location: "Tomball HQ",
      preferredContactMethod: contactMethod,
      message: childName ? `Child's name: ${childName}` : undefined,
      source: "landing_page",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <SchemaMarkup
        type="Course"
        name={program.title}
        description={program.description}
        url={`https://www.mydojoma.com/programs/${program.id}`}
        ageRange={program.ages}
        courseMode="onsite"
      />
      <SchemaMarkup
        type="BreadcrumbList"
        items={[
          { name: "Home", url: "/" },
          { name: "Programs", url: "/programs" },
          { name: program.title, url: `/programs/${program.id}` },
        ]}
      />
      <SEO
        title={`${program.title} Program — Free Trial`}
        description={program.description}
        image={program.image}
        type="article"
      />

      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px]">
        <img
          src={program.image}
          alt={program.title}
          className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="container mx-auto">
            <Link href="/programs">
              <Button variant="ghost" className="text-white/80 hover:text-white mb-6 pl-0 hover:bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Programs
              </Button>
            </Link>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
              {program.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium text-lg">{program.ages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium text-lg">{program.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-heading font-bold mb-6">About the Program</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-12">
              {program.longDescription}
            </p>

            {/* Benefits Grid */}
            <h3 className="text-2xl font-heading font-bold mb-6">Key Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {program.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="bg-primary/10 text-primary p-1.5 rounded-full shrink-0">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-gray-800 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* What to Expect */}
            <h3 className="text-2xl font-heading font-bold mb-6">What to Expect</h3>
            <ul className="space-y-4 mb-12">
              {program.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 shrink-0" />
                  <span className="text-gray-600 text-lg">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Why MyDojo */}
            <div className="bg-black text-white rounded-2xl p-8 mb-12">
              <h3 className="text-2xl font-heading font-bold mb-6">Why Choose MyDojo?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="bg-primary/20 p-4 rounded-full">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">World-Class Instructors</h4>
                  <p className="text-gray-400 text-sm">Certified, background-checked, passionate about student growth.</p>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="bg-primary/20 p-4 rounded-full">
                    <Star className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Proven Results</h4>
                  <p className="text-gray-400 text-sm">Thousands of students transformed through our programs.</p>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="bg-primary/20 p-4 rounded-full">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Fun & Engaging</h4>
                  <p className="text-gray-400 text-sm">Classes designed to keep students motivated and coming back.</p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-6">
              <Calendar className="h-6 w-6 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-lg mb-1">Class Schedule</h4>
                <p className="text-gray-600">{program.schedule}</p>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar — Lead Capture Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {submitted ? (
                /* Success State */
                <div className="bg-white border-2 border-green-300 rounded-2xl p-8 text-center shadow-xl">
                  <div className="flex justify-center mb-4">
                    <div className="bg-green-100 rounded-full p-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-3 text-gray-900">You're All Set!</h3>
                  <p className="text-gray-600 mb-6">
                    We've received your request and will reach out shortly to schedule your free trial class for <strong>{program.title}</strong>.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 mb-6">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">What Happens Next</p>
                    <p className="text-sm text-gray-700">1. Our team will contact you within 24 hours</p>
                    <p className="text-sm text-gray-700">2. We'll schedule your free trial class</p>
                    <p className="text-sm text-gray-700">3. Come in and experience MyDojo!</p>
                  </div>
                  <p className="text-sm text-gray-500">Questions? Call us at <strong>(877) 4-MYDOJO</strong></p>
                </div>
              ) : (
                /* Lead Form */
                <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                  {/* Form Header */}
                  <div className="bg-primary px-8 py-6 text-white text-center">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Limited Spots Available</p>
                    <h3 className="text-2xl font-heading font-bold">Claim Your Free Trial</h3>
                    <p className="text-sm opacity-90 mt-2">
                      One complimentary {program.title} class — no obligation
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    {/* Parent/Student Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name">
                        {isKidsProgram ? "Parent's Full Name" : "Your Full Name"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder={isKidsProgram ? "e.g. Jane Smith" : "e.g. John Smith"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Child's Name (kids programs only) */}
                    {isKidsProgram && (
                      <div className="space-y-1.5">
                        <Label htmlFor="childName">Child's Name</Label>
                        <Input
                          id="childName"
                          placeholder="e.g. Alex Smith"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(713) 555-0100"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Preferred Contact */}
                    <div className="space-y-1.5">
                      <Label htmlFor="contactMethod">Best Way to Reach You</Label>
                      <Select value={contactMethod} onValueChange={(v) => setContactMethod(v as any)}>
                        <SelectTrigger id="contactMethod">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Message</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      disabled={createLead.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-heading uppercase tracking-wider mt-2"
                    >
                      {createLead.isPending ? "Submitting..." : "Book My Free Trial"}
                    </Button>

                    <p className="text-xs text-center text-gray-400">
                      No credit card required. No obligation. Beginners welcome.
                    </p>
                  </form>
                </div>
              )}

              {/* Trust Signals */}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary">500+</p>
                  <p className="text-xs text-gray-500">Active Members</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary">15+</p>
                  <p className="text-xs text-gray-500">Years Training</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary">4.9★</p>
                  <p className="text-xs text-gray-500">Google Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
            READY TO START YOUR <span className="text-primary">{program.title.toUpperCase()}</span> JOURNEY?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of students who have transformed their lives at MyDojo. Your first class is on us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/programs">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-6 h-auto font-heading uppercase tracking-wider text-lg">
                View All Programs
              </Button>
            </Link>
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 h-auto font-heading uppercase tracking-wider text-lg"
            >
              Claim Free Trial ↑
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
