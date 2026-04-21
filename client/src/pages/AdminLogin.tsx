import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Shield, Award, Users, Calendar, ChevronRight, Lock } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin' || user.role === 'staff') {
        setLocation("/admin");
      }
      // Users without admin/staff role stay on this page and see the access denied state
    }
  }, [user, loading, setLocation]);

  const handleLogin = () => {
    setIsRedirecting(true);
    window.location.href = getLoginUrl();
  };

  const handleLogout = async () => {
    // Clear session and reload so they can try a different account
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '/admin/login';
  };

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Authenticating…</p>
        </div>
      </div>
    );
  }

  // Logged in but NOT an admin or staff — show access denied
  if (user && user.role !== 'admin' && user.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-10 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-2">
              Your account (<span className="text-gray-300">{user.email || user.name}</span>) does not have instructor or staff privileges.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Contact your dojo manager to request access, or sign in with a different account.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider text-sm px-6 py-3 rounded-xl transition-all"
              >
                Sign Out & Try Another Account
              </button>
              <a
                href="/"
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors py-2"
              >
                ← Back to MyDojo website
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-6">
            Need access? Call{" "}
            <a href="tel:8774693656" className="text-primary hover:underline">(877) 4-MYDOJO</a>
          </p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Users, label: "Student Roster", desc: "View and manage all enrolled students" },
    { icon: Calendar, label: "Class Schedule", desc: "Today's classes and attendance tracking" },
    { icon: Award, label: "Progress & Feedback", desc: "Track belt progress and leave feedback" },
    { icon: Shield, label: "Enrollment Management", desc: "Review memberships and change requests" },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-main.webp"
            alt="MyDojo"
            className="w-full h-full object-cover opacity-30" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-primary/20" />
        </div>

        <div className="relative z-10">
          <a href="/" className="inline-block">
            <img
              src="/images/logo-full-white.webp"
              alt="MyDojo"
              className="h-12"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/images/FULLLOGOWHITE.webp";
              }}
            />
          </a>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-full px-4 py-1.5 mb-6">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Staff Access Only</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 leading-tight">
            INSTRUCTOR &<br />
            <span className="text-primary">STAFF PORTAL</span>
          </h1>
          <p className="text-gray-300 text-lg mb-10 max-w-md">
            Your command center for managing students, classes, and dojo operations — all in one place.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="bg-white/10 border border-white/20 rounded-lg p-2 flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-gray-400 text-xs leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-10">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} MyDojo Martial Arts & Fitness · Tomball, TX
          </p>
        </div>
      </div>

      {/* Right panel — login */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="mb-8">
              <div className="w-14 h-14 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center mb-5">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Staff Sign In</h2>
              <p className="text-gray-400 text-sm">
                Sign in with your MyDojo account to access the instructor portal.
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-between bg-primary hover:bg-primary/90 text-white font-heading font-bold uppercase tracking-wider text-sm px-6 py-4 rounded-xl transition-all shadow-lg shadow-primary/20 group"
            >
              <span>Sign In to Staff Portal</span>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-xs uppercase tracking-wider">Secure Login</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium mb-1">Admin access required</p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    This portal is restricted to authorized instructors and staff. If you need access, contact your dojo manager.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                ← Back to MyDojo website
              </a>
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            Having trouble? Call{" "}
            <a href="tel:8774693656" className="text-primary hover:underline">
              (877) 4-MYDOJO
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
