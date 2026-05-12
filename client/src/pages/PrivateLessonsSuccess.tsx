import { useSearch } from "wouter";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PrivateLessonsSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const instructor = params.get("instructor") || "your instructor";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tight mb-3">
          You're All Set!
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          Your 3 private classes with <span className="text-white font-semibold">{instructor}</span> have been confirmed.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          We'll be in touch shortly to schedule your sessions. Classes are valid for 60 days.
        </p>
        <Link href="/">
          <Button className="bg-[#E10600] hover:bg-[#c10500] text-white font-bold uppercase tracking-wider px-8 py-4 h-auto">
            Back to MyDojo
          </Button>
        </Link>
      </div>
    </div>
  );
}
