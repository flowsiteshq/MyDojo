import { useTranslation } from "react-i18next";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Star } from "lucide-react";

const INSTRUCTORS = [
  {
    id: "master-vincent-holmes",
    name: "Master Vincent Holmes",
    title: "Head Instructor & Founder",
    price: 200,
    priceLabel: "$200",
    description: "3 Private Classes",
    bio: "Master Holmes brings decades of martial arts mastery and championship coaching experience. Training with him is a transformative experience.",
    badge: "⭐ Premium",
    badgeColor: "bg-yellow-500",
    highlight: true,
  },
  {
    id: "sensei-kamil-ahmed",
    name: "Sensei Kamil Ahmed",
    title: "Certified Instructor",
    price: 100,
    priceLabel: "$100",
    description: "3 Private Classes",
    bio: "Sensei Kamil is known for his technical precision and ability to connect with students of all ages and skill levels.",
    badge: null,
    badgeColor: "",
    highlight: false,
  },
  {
    id: "sensei-hector-diosdado",
    name: "Sensei Hector Diosdado",
    title: "Certified Instructor",
    price: 100,
    priceLabel: "$100",
    description: "3 Private Classes",
    bio: "Sensei Hector specializes in building strong fundamentals and helping students unlock their full potential on the mat.",
    badge: null,
    badgeColor: "",
    highlight: false,
  },
  {
    id: "sensei-dominique-griggs",
    name: "Sensei Dominique Griggs",
    title: "Certified Instructor",
    price: 100,
    priceLabel: "$100",
    description: "3 Private Classes",
    bio: "Sensei Dominique brings energy, encouragement, and expert technique to every private session.",
    badge: null,
    badgeColor: "",
    highlight: false,
  },
];

export default function PrivateLessons() {
  const { t } = useTranslation();
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createCheckout = trpc.privateLessons.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecting to secure checkout...");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    },
    onSettled: () => setLoading(false),
  });

  const handleCheckout = () => {
    if (!selectedInstructor) {
      toast.error("Please select an instructor first.");
      return;
    }
    const instructor = INSTRUCTORS.find((i) => i.id === selectedInstructor);
    if (!instructor) return;
    setLoading(true);
    createCheckout.mutate({ instructorId: instructor.id });
  };

  const selected = INSTRUCTORS.find((i) => i.id === selectedInstructor);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-zinc-900 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[url('/images/hero-main.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 text-center">
          <div className="inline-block bg-[#E10600] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4 rounded-sm">
            Private Training
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3">
            3 Private Classes
          </h1>
          <p className="text-gray-400 text-lg">
            One-on-one instruction tailored to your goals. Select your instructor below.
          </p>
        </div>
      </div>

      {/* Instructor Grid */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-6 text-center">
          Choose Your Instructor
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INSTRUCTORS.map((instructor) => {
            const isSelected = selectedInstructor === instructor.id;
            return (
              <button
                key={instructor.id}
                onClick={() => setSelectedInstructor(instructor.id)}
                className={`relative text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                  isSelected
                    ? "border-[#E10600] bg-zinc-800"
                    : instructor.highlight
                    ? "border-yellow-500/40 bg-zinc-900 hover:border-yellow-500/70"
                    : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                }`}
              >
                {/* Badge */}
                {instructor.badge && (
                  <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full text-black ${instructor.badgeColor}`}>
                    {instructor.badge}
                  </span>
                )}

                {/* Selected checkmark */}
                {isSelected && (
                  <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-[#E10600]" />
                )}

                <div className="mb-3">
                  <h3 className={`font-bold text-lg leading-tight ${instructor.highlight ? "text-yellow-400" : "text-white"}`}>
                    {instructor.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{instructor.title}</p>
                </div>

                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {instructor.bio}
                </p>

                <div className="flex items-end justify-between">
                  <div>
                    <span className={`text-2xl font-black ${instructor.highlight ? "text-yellow-400" : "text-[#E10600]"}`}>
                      {instructor.priceLabel}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">{instructor.description}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary + CTA */}
        <div className="mt-8 bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          {selected ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Selected</p>
                <p className="font-bold text-white text-lg">{selected.name}</p>
                <p className="text-gray-400 text-sm">3 Private Classes · {selected.priceLabel}</p>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="bg-[#E10600] hover:bg-[#c10500] text-white font-bold uppercase tracking-wider px-8 py-6 h-auto text-base rounded-lg"
              >
                {loading ? "Redirecting..." : `Pay ${selected.priceLabel} →`}
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Star className="h-6 w-6 mx-auto mb-2 opacity-40" />
              <p>Select an instructor above to continue</p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          🔒 Secure checkout · No commitment required · Classes valid for 60 days
        </p>
      </div>
    </div>
  );
}
