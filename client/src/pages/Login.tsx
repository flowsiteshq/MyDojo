import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back! You've successfully logged in.");
      // Redirect to home page
      setLocation("/");
      // Reload to update auth state
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Login failed: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg"
          alt="MyDojo Background"
          className="w-full h-full object-cover opacity-30" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-primary/20" />
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-2xl border border-zinc-800 shadow-2xl">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-heading font-bold text-white text-center mb-2">
            WELCOME BACK
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Sign in to continue your martial arts journey
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <Link href="/forgot-password">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-heading text-lg py-6 uppercase tracking-wider"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-zinc-900 text-gray-400">
                New to MyDojo?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link href="/register">
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800 font-heading uppercase tracking-wider"
            >
              Create Account
            </Button>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/">
            <button className="text-gray-400 hover:text-white transition-colors text-sm">
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
