import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Award, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function BeltTestIntentSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const name = params.get("name") || "Student";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-500/20 border border-green-500/40 rounded-full p-6">
            <CheckCircle className="h-16 w-16 text-green-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-[#E10600]/20 border border-[#E10600]/40 text-[#E10600] text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
          <Award className="h-4 w-4" />
          Intent Submitted
        </div>

        <h1 className="text-4xl font-black uppercase mb-4">
          You're Registered,<br />
          <span className="text-[#E10600]">{name}!</span>
        </h1>

        <p className="text-gray-300 text-lg mb-8">
          Your Intent to Promote for the <strong className="text-white">August 15th Belt Test</strong> has been received and your $49 test fee has been paid. Get ready to shine!
        </p>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-8 text-left space-y-4">
          <h3 className="font-bold text-white uppercase tracking-wider text-sm">What's Next</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-[#E10600] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <div>
                <div className="font-bold text-sm">Spotlight Week — Aug 10–14</div>
                <div className="text-gray-400 text-sm">Attend Testing Preparation classes all week to sharpen your skills.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-[#E10600] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <div>
                <div className="font-bold text-sm">Order Your Uniform</div>
                <div className="text-gray-400 text-sm">Extra Black or Red Gi must be ordered before the test. See the front desk.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-[#E10600] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <div>
                <div className="font-bold text-sm">Belt Test — August 15th</div>
                <div className="text-gray-400 text-sm">Show up ready, confident, and proud. You've earned this!</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/august-2026">
            <Button className="bg-[#E10600] hover:bg-[#c00500] text-white font-bold uppercase tracking-wider px-6">
              <Calendar className="h-4 w-4 mr-2" />
              View August Events
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 font-bold uppercase tracking-wider px-6">
              Back to Home <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
