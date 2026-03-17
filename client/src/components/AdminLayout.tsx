import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Calendar,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  LayoutDashboard,
  UserPlus,
  Flame,
  MessageSquare,
  ShieldAlert,
  Webhook,
  PackageIcon,
  DollarSign,
  Megaphone,
} from "lucide-react";
import { Button } from "./ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();

  // Redirect to admin login if not authenticated or not an admin/staff
  if (!loading && (!user || (user.role !== 'admin' && user.role !== 'staff'))) {
    window.location.href = '/admin/login';
    return null;
  }

  // Show loading state while auth is being checked
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  // Operational tools available to both admin and staff
  const baseNavItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/intro-appointments", label: "Leads", icon: UserPlus },
    { href: "/admin/classes", label: "Class Schedule", icon: Calendar },
    { href: "/admin/students", label: "Members", icon: Users },
    { href: "/admin/attendance", label: "Attendance Logs", icon: ClipboardList },
    { href: "/admin/milestones", label: "Streak Milestones", icon: Flame },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare },
    { href: "/admin/promo-blast", label: "Promo Blast", icon: Megaphone },
    { href: "/admin/commissions", label: "Commissions", icon: DollarSign },
  ];

  // Admin-only tools: staff management, audit log, and settings
  const adminOnlyNavItems = [
    { href: "/admin/staff", label: "Staff", icon: UserPlus },
    { href: "/admin/packages", label: "Packages", icon: PackageIcon },
    { href: "/admin/audit-log", label: "Audit Log", icon: ShieldAlert },
    { href: "/admin/billing", label: "Billing & Webhooks", icon: Webhook },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const navItems = isAdmin
    ? [...baseNavItems, ...adminOnlyNavItems]
    : baseNavItems;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/admin">
            <img
              src="/images/logo-full-black.png"
              alt="MyDojo Admin"
              className="h-10"
              onError={(e) => {
                e.currentTarget.src = "/images/FULLLOGOBLACK.png";
              }}
            />
          </Link>
          <p className="text-sm text-gray-500 mt-2">{isAdmin ? 'Admin Portal' : 'Staff Portal'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#E10600] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "Admin"}
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  isAdmin
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {isAdmin ? 'Admin' : 'Staff'}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
