import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const resetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    resetMutation.mutate({ email: email.trim() });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/images/logo-white.png"
              alt="MyDojo"
              className="h-14 mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Link>
          <h1 className="text-white text-2xl font-bold mt-4 uppercase tracking-widest">
            MyDojo
          </h1>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          {submitted ? (
            /* Success State */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-white text-xl font-bold mb-3">Check Your Email</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                If an account exists for <span className="text-white font-medium">{email}</span>,
                we've sent a password reset link. Check your inbox (and spam folder) — the link
                expires in 1 hour.
              </p>
              <Link href="/login">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="mb-6">
                <h2 className="text-white text-xl font-bold mb-1">Forgot Password?</h2>
                <p className="text-zinc-400 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-zinc-300 text-sm font-medium mb-1.5 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider h-11"
                >
                  {resetMutation.isPending ? "Sending…" : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login">
                  <button className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 mx-auto transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Login
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Need help?{" "}
          <a href="tel:8774693656" className="text-zinc-400 hover:text-white transition-colors">
            Call (877) 4-MYDOJO
          </a>
        </p>
      </div>
    </div>
  );
}
