import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

export default function StaffInviteAccept() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  const acceptInvite = trpc.admin.acceptStaffInvite.useMutation({
    onSuccess: () => {
      setAccepted(true);
    },
    onError: (err: unknown) => {
      setError((err as { message?: string })?.message || "Failed to accept invitation");
    },
  });

  // Once auth is loaded and user is logged in, auto-accept the invite
  useEffect(() => {
    if (!authLoading && user && token && !accepted && !error && !acceptInvite.isPending) {
      acceptInvite.mutate({ token });
    }
  }, [authLoading, user, token]);

  // Not yet loaded
  if (authLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // User not logged in — prompt them to log in
  if (!user) {
    const loginUrl = getLoginUrl();
    // Store the invite token in sessionStorage so we can redirect back after login
    sessionStorage.setItem('staffInviteToken', token);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full p-4 inline-flex mb-6">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You've been invited!</h1>
          <p className="text-gray-500 mb-6">
            You've been invited to join the <strong>MyDojo</strong> team. Please log in to accept your invitation and access the dashboard.
          </p>
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white text-base py-5"
            onClick={() => { window.location.href = loginUrl; }}
          >
            Log In to Accept Invitation
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            You'll need a Manus account to continue. Sign up is free.
          </p>
        </div>
      </div>
    );
  }

  // Accepting in progress
  if (acceptInvite.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Activating your account...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full p-4 inline-flex mb-6">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full p-4 inline-flex mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the team!</h1>
          <p className="text-gray-500 mb-6">
            Your account has been activated. You now have access to the MyDojo staff dashboard.
          </p>
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white text-base py-5"
            onClick={() => setLocation("/admin")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
