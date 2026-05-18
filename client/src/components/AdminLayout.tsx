import { ReactNode, useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Activity,
  CalendarDays,
  Share2,
  Clock,
  PartyPopper,
  Tent,
  BarChart3,
} from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

interface AdminLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

// ── Active Now Indicator ──────────────────────────────────────────────────────
function ActiveNowBadge({ collapsed }: { collapsed: boolean }) {
  const { data, isLoading } = trpc.admin.getActiveNow.useQuery(undefined, {
    refetchInterval: 30_000, // refresh every 30 seconds
    staleTime: 25_000,
  });

  const count = data?.count ?? 0;
  const names = data?.recentNames ?? [];

  // Tooltip content
  const tooltipLines =
    names.length > 0
      ? names.map((n) => `• ${n}`).join("\n")
      : "No check-ins yet today";

  if (collapsed) {
    // Icon-only mode: show count bubble on the activity icon
    return (
      <div className="relative group flex justify-center py-2 border-t border-gray-100">
        <div className="relative">
          <Activity className="w-5 h-5 text-emerald-600" />
          {!isLoading && (
            <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </div>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-pre z-50 transition-opacity min-w-[140px]">
          <p className="font-semibold mb-1">{count} Active Today</p>
          <p className="text-gray-300 whitespace-pre-line">{tooltipLines}</p>
        </div>
      </div>
    );
  }

  // Expanded mode: full card
  return (
    <div className="mx-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Pulsing green dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-800">Active Now</span>
        </div>
        <span className="text-lg font-bold text-emerald-700 leading-none">
          {isLoading ? "—" : count}
        </span>
      </div>
      {names.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {names.slice(0, 3).map((name, i) => (
            <p key={i} className="text-[11px] text-emerald-700 truncate">
              {name}
            </p>
          ))}
          {names.length > 3 && (
            <p className="text-[11px] text-emerald-500">
              +{names.length - 3} more
            </p>
          )}
        </div>
      )}
      {!isLoading && names.length === 0 && (
        <p className="text-[11px] text-emerald-500 mt-1">No check-ins yet today</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Redirect to admin login if not authenticated or not an admin/staff
  if (!loading && (!user || (user.role !== "admin" && user.role !== "staff"))) {
    window.location.href = "/admin/login";
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

  const isAdmin = user.role === "admin";

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
    { href: "/admin/pno-rsvps", label: "PNO RSVPs", icon: PartyPopper },
    { href: "/admin/camp-enrollments", label: "Camp Enrollments", icon: Tent },
    { href: "/admin/facebook-ads", label: "Facebook Ads", icon: BarChart3 },
    { href: "/admin/billing-schedule", label: "Billing Schedule", icon: CalendarDays },
    { href: "/admin/class-roster", label: "Class Roster", icon: ClipboardList },
    { href: "/admin/buddy-day", label: "Buddy Day RSVPs", icon: Users },
    { href: "/admin/social-media", label: "Social Media", icon: Share2 },
    { href: "/admin/commissions", label: "Commissions", icon: DollarSign },
  ];

  // Admin-only tools
  const adminOnlyNavItems = [
    { href: "/admin/staff", label: "Staff", icon: UserPlus },
    { href: "/admin/staff-schedule", label: "Staff Schedule", icon: CalendarDays },
    { href: "/admin/staff-hours", label: "Staff Hours", icon: Clock },
    { href: "/admin/family-groups", label: "Family Groups", icon: Users },
    { href: "/admin/calendar", label: "Staff Calendar", icon: Calendar },
    { href: "/admin/packages", label: "Packages", icon: PackageIcon },
    { href: "/admin/audit-log", label: "Audit Log", icon: ShieldAlert },
    { href: "/admin/billing", label: "Billing & Webhooks", icon: Webhook },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const navItems = isAdmin ? [...baseNavItems, ...adminOnlyNavItems] : baseNavItems;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/admin/login";
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo / Header */}
      <div
        className={`flex items-center border-b border-gray-200 ${
          isCollapsed && !mobile ? "justify-center p-4" : "justify-between p-5"
        }`}
      >
        {/* Logo — clicking it toggles collapse on desktop */}
        <button
          onClick={() => {
            if (mobile) return;
            setIsCollapsed((c) => !c);
          }}
          className={`focus:outline-none ${mobile ? "cursor-default" : "cursor-pointer"}`}
          aria-label="Toggle sidebar"
        >
          {isCollapsed && !mobile ? (
            <img
              src="/images/logo-icon.99cb4daa.webp"
              alt="MyDojo"
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <img
              src="/images/logo-full-black.webp"
              alt="MyDojo Admin"
              className="h-9 object-contain"
              onError={(e) => {
                e.currentTarget.src = "/images/FULLLOGOBLACK.webp";
              }}
            />
          )}
        </button>

        {/* Collapse toggle button (desktop only, expanded state) */}
        {!isCollapsed && !mobile && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Close button (mobile only) */}
        {mobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role badge */}
      {(!isCollapsed || mobile) && (
        <div className="px-5 pt-2 pb-1">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              isAdmin ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {isAdmin ? "Admin Portal" : "Staff Portal"}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed && !mobile ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors group relative ${
                isCollapsed && !mobile
                  ? "justify-center px-2 py-2"
                  : "px-3 py-1.5"
              } ${
                isActive
                  ? "bg-[#E10600] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {(!isCollapsed || mobile) && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {/* Tooltip for collapsed state */}
              {isCollapsed && !mobile && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Active Now Indicator ── */}
      <ActiveNowBadge collapsed={isCollapsed && !mobile} />

      {/* User Info & Logout */}
      <div className="p-3 border-t border-gray-200">
        {isCollapsed && !mobile ? (
          /* Collapsed: just avatar + logout icon */
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Expanded: full user card */
          <>
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700 shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </>
        )}
      </div>

      {/* Expand button when collapsed (desktop only) */}
      {isCollapsed && !mobile && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-center py-2 border-t border-gray-200 hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 flex flex-col md:hidden transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent mobile />
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar with hamburger */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src="/images/logo-full-black.webp"
            alt="MyDojo"
            className="h-7 object-contain"
            onError={(e) => {
              e.currentTarget.src = "/images/FULLLOGOBLACK.webp";
            }}
          />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
