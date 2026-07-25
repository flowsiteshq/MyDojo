import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract token from URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, []);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
      // Redirect to login after 3 seconds
      setTimeout(() => setLocation("/login"), 3000);
    },
    onError: (err) => {
      setError(err.message || "This reset link is invalid or has expired. Please request a new one.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid reset token. Please request a new password reset link.");
      return;
    }

    resetMutation.mutate({ token, password });
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
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-white text-xl font-bold mb-3">Password Updated!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Your password has been successfully reset. Redirecting you to login…
              </p>
              <Link href="/login">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-white text-xl font-bold mb-1">Set New Password</h2>
                <p className="text-zinc-400 text-sm">
                  Choose a strong password for your MyDojo account.
                </p>
              </div>

              {!token && error ? (
                /* Invalid token state */
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <p className="text-zinc-400 text-sm mb-6">{error}</p>
                  <Link href="/forgot-password">
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="password" className="text-zinc-300 text-sm font-medium mb-1.5 block">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500"
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-zinc-300 text-sm font-medium mb-1.5 block">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        className="pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={resetMutation.isPending || !token}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider h-11"
                  >
                    {resetMutation.isPending ? "Updating…" : "Update Password"}
                  </Button>
                </form>
              )}

              {token && (
                <div className="mt-6 text-center">
                  <Link href="/forgot-password">
                    <button className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                      Request a new reset link
                    </button>
                  </Link>
                </div>
              )}
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
