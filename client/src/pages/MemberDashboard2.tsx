import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Calendar,
  Award,
  Clock,
  BookOpen,
  ChevronRight,
  MessageCircle,
  Flame,
  QrCode,
  Zap,
  Target,
  CheckCircle2,
  Circle,
  Lock,
  Users,
  Play,
  ChevronDown,
  Star,
  Trophy,
  Sun,
  Moon,
  SunMoon,
  LayoutDashboard,
  GraduationCap,
  BarChart2,
  Mail,
  X,
  AlertTriangle,
  PauseCircle,
  XCircle,
  Snowflake,
  Baby,
  Camera,
  Upload,
  Check,
  CreditCard,
  Receipt,
  ChevronUp,
  Package,
  MapPin,
  Search,
  Home as HomeIcon,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { CurriculumViewer } from "@/components/CurriculumViewer";
import { MessagesTab } from "@/components/MessagesTab";
import { Chart, registerables } from "chart.js";
import { useDashboardTheme, type DashboardThemeMode } from "@/hooks/useDashboardTheme";
import { MyChildren } from "@/components/MyChildren";
import { MealPlanTab } from "@/components/MealPlanTab";
import MyDojoBucksPage from "./MyDojoBucks";
import { toast } from "sonner";
import { programs } from "@/data/programs";
Chart.register(...registerables);

// ─── Theme-aware token helper ─────────────────────────────────────────────────
function useTokens(isDark: boolean) {
  return {
    // Backgrounds
    pageBg: isDark ? "radial-gradient(ellipse at 50% 90%, #3d0a0a 0%, #1c0a0a 25%, #111111 55%, #0d0d0d 100%)" : undefined,
    pageBgClass: isDark ? "" : "bg-gray-50",
    navBg: isDark ? "bg-black/70 backdrop-blur-xl border-white/10" : "bg-white shadow-sm border-gray-200",
    cardBg: isDark ? "" : "bg-white border-gray-200",
    cardStyle: isDark ? { background: "rgba(28, 18, 18, 0.85)", backdropFilter: "blur(12px)" } : undefined,
    cardBorder: isDark ? "border-white/8" : "border-gray-200",
    // Text
    textPrimary: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-white/60" : "text-gray-500",
    textMuted: isDark ? "text-white/40" : "text-gray-400",
    textLabel: isDark ? "text-white/70" : "text-gray-500",
    // Interactive
    navActive: isDark ? "text-white" : "text-[#E11D2A]",
    navInactive: isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
    iconBtn: isDark ? "hover:bg-white/10" : "hover:bg-gray-100",
    iconColor: isDark ? "text-white/70" : "text-gray-500",
    // Inputs / borders
    borderSubtle: isDark ? "border-white/10" : "border-gray-200",
    bgSubtle: isDark ? "bg-white/5" : "bg-gray-50",
    bgHover: isDark ? "hover:bg-white/10" : "hover:bg-gray-50",
    // Bars / tracks
    trackBg: isDark ? "bg-white/10" : "bg-gray-100",
    // Dropdown
    dropdownBg: isDark ? "bg-zinc-900/95 border-white/10" : "bg-white border-gray-200 shadow-lg",
    dropdownText: isDark ? "text-white/70 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
    // Streak badge
    streakBg: isDark ? "bg-orange-500/20 border-orange-500/30" : "bg-orange-50 border-orange-200",
    streakText: isDark ? "text-orange-300" : "text-orange-600",
    streakIcon: isDark ? "text-orange-400" : "text-orange-500",
    // Chart
    chartGrid: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    chartTick: isDark ? "rgba(255,255,255,0.5)" : "#6b7280",
    chartTooltipBg: isDark ? "#1a1a1a" : "#111827",
    // Quick action buttons
    qaCard: isDark ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#E11D2A]/40" : "border-gray-200 bg-white hover:bg-red-50 hover:border-red-200",
    qaIcon: isDark ? "bg-[#E11D2A]/20 group-hover:bg-[#E11D2A]/30" : "bg-red-50 group-hover:bg-red-100",
    qaText: isDark ? "text-white/70" : "text-gray-600",
    // Announcement rows
    announcementRow: isDark ? "bg-white/5 hover:bg-white/10 border-transparent" : "bg-gray-50 hover:bg-red-50 border-transparent hover:border-red-100",
    announcementChevron: isDark ? "text-white/20 group-hover:text-white/60" : "text-gray-300 group-hover:text-[#E11D2A]",
    // Resource cards
    resourceCard: isDark ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#E11D2A]/30" : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50",
    resourceText: isDark ? "text-white/70 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900",
    // Profile name
    profileName: isDark ? "text-white/80" : "text-gray-700",
    profileChevron: isDark ? "text-white/50" : "text-gray-400",
  };
}

// ─── Theme Toggle Button ──────────────────────────────────────────────────────
function ThemeToggle({
  mode,
  setMode,
  isDark,
}: {
  mode: DashboardThemeMode;
  setMode: (m: DashboardThemeMode) => void;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options: { value: DashboardThemeMode; label: string; Icon: React.ElementType }[] = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Night", Icon: Moon },
    { value: "auto", label: "Auto", Icon: SunMoon },
  ];

  const ActiveIcon = options.find((o) => o.value === mode)?.Icon ?? Sun;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-gray-100 text-gray-500"}`}
        title="Theme"
      >
        <ActiveIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-36 rounded-xl border py-1 z-50 shadow-xl ${isDark ? "bg-zinc-900/95 border-white/10" : "bg-white border-gray-200"}`}
        >
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => { setMode(value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                mode === value
                  ? "text-[#E11D2A] bg-red-500/10"
                  : isDark
                  ? "text-white/70 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {mode === value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E11D2A]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card component ───────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  isDark,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  isDark: boolean;
  style?: React.CSSProperties;
}) {
  const t = useTokens(isDark);
  return (
    <div
      className={`rounded-2xl border shadow-sm ${t.cardBorder} ${isDark ? "" : "bg-white"} ${className}`}
      style={isDark ? { background: "rgba(28, 18, 18, 0.85)", backdropFilter: "blur(12px)", ...style } : style}
    >
      {children}
    </div>
  );
}

// ─── Circular progress ring ───────────────────────────────────────────────────
const ProgressRing = ({
  pct,
  size = 120,
  stroke = 10,
  color = "#E11D2A",
  isDark,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  isDark: boolean;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke={isDark ? "#ffffff15" : "#f3f4f6"} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${color}88)`, transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
};

// ─── Belt color map ─────────────────────────────────────────────────────────
const BELT_COLORS: Record<string, string> = {
  "No Belt": "#9ca3af",
  "White Belt": "#d1d5db",
  "Yellow Belt": "#facc15",
  "Orange Belt": "#fb923c",
  "Green Belt": "#22c55e",
  "Advanced Green": "#16a34a",
  "Blue Belt": "#3b82f6",
  "Advanced Blue": "#1d4ed8",
  "Purple Belt": "#a855f7",
  "Advanced Purple": "#7e22ce",
  "Brown Belt": "#92400e",
  "Advanced Brown": "#78350f",
  "Probationary Black": "#374151",
  "Black Belt 1st Dan": "#111827",
  "Black Belt 2nd Dan": "#111827",
  "Black Belt 3rd Dan": "#111827",
};

// ─── Progress Tab ─────────────────────────────────────────────────────────────
function ProgressTab({ isDark }: { isDark: boolean }) {
  const t = useTokens(isDark);
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading } = trpc.member.getProgressStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !stats?.weeklyAttendance?.length) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: (stats.weeklyAttendance as {week:string;count:number;weekStart:string}[]).map((w) => w.week),
        datasets: [
          {
            label: "Classes Attended",
            data: (stats.weeklyAttendance as {week:string;count:number;weekStart:string}[]).map((w) => w.count),
            backgroundColor: "rgba(225, 29, 42, 0.15)",
            borderColor: "#E11D2A",
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: t.chartTooltipBg,
            titleColor: "#fff",
            bodyColor: "rgba(255,255,255,0.7)",
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} class${ctx.parsed.y !== 1 ? "es" : ""}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: t.chartGrid },
            ticks: { color: t.chartTick, font: { size: 11 } },
          },
          y: {
            grid: { color: t.chartGrid },
            ticks: { color: t.chartTick, stepSize: 1 },
            beginAtZero: true,
          },
        },
      },
    });
    return () => { chartInstance.current?.destroy(); };
  }, [stats, isDark]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-4 border-[#E11D2A] border-t-transparent animate-spin" />
      </div>
    );
  }

  const totalClasses = stats?.totalClasses ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalXP = stats?.totalXP ?? 0;
  const beltRank = stats?.beltRank ?? "No Belt";
  const beltColor = BELT_COLORS[beltRank] ?? "#9ca3af";
  const beltHistory = stats?.beltHistory ?? [];
  const programBreakdown = stats?.programBreakdown ?? [];

  // Belt test readiness & stripe system
  const classesAtCurrentBelt = stats?.classesAtCurrentBelt ?? 0;
  const classesRequired = stats?.classesRequired ?? 16;
  const beltProgressPct = stats?.beltProgressPct ?? 0;
  const nextBelt = stats?.nextBelt ?? null;
  const qualifiesForTest = stats?.qualifiesForTest ?? false;
  const allPhasesComplete = stats?.allPhasesComplete ?? false;
  const needsExam = stats?.needsExam ?? false;
  const beltExamFee = stats?.beltExamFee ?? 49;
  const beltExamFeePaid = stats?.beltExamFeePaid ?? 0;
  const isAdvancedBelt = stats?.isAdvancedBelt ?? false;
  // stripePositions: array of { filled, color, phaseColor } from the server
  const rawStripePositions = (stats as any)?.stripePositions as Array<{ filled: boolean; color: string | null; phaseColor: string }> | undefined;
  // Fallback: build 4 empty positions if data not yet loaded
  const stripePositionData = rawStripePositions ?? Array.from({ length: isAdvancedBelt ? 8 : 4 }, () => ({ filled: false, color: null, phaseColor: 'white' }));
  // Color hex map
  const STRIPE_HEX: Record<string, string> = { white: '#f3f4f6', yellow: '#fbbf24', red: '#ef4444', black: '#1f2937' };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: totalClasses, icon: <Trophy className="h-5 w-5 text-yellow-500" />, bg: isDark ? "bg-yellow-500/10" : "bg-yellow-50" },
          { label: "Current Streak", value: `${currentStreak} days`, icon: <Flame className="h-5 w-5 text-orange-500" />, bg: isDark ? "bg-orange-500/10" : "bg-orange-50" },
          { label: "Best Streak", value: `${longestStreak} days`, icon: <Star className="h-5 w-5 text-purple-400" />, bg: isDark ? "bg-purple-500/10" : "bg-purple-50" },
          { label: "Total XP", value: totalXP.toLocaleString(), icon: <Zap className="h-5 w-5 text-[#E11D2A]" />, bg: isDark ? "bg-red-500/10" : "bg-red-50" },
        ].map((s) => (
          <Card key={s.label} className="p-5 flex items-center gap-4" isDark={isDark}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-2xl font-black ${t.textPrimary}`}>{s.value}</p>
              <p className={`text-xs ${t.textMuted} mt-0.5`}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Belt Stripe Progress */}
      <Card className="p-6" isDark={isDark}>
        <div className="flex items-center gap-3 mb-5">
          <Award className="h-5 w-5 text-[#E11D2A]" />
          <h3 className={`text-lg font-bold ${t.textPrimary}`}>Belt Stripe Progress</h3>
          {allPhasesComplete && (
            <span className="ml-auto text-xs font-bold text-green-500 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full">
              ✓ All Stripes Earned!
            </span>
          )}
        </div>

        {/* Belt rank header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-6 h-6 rounded-full border-2 border-white/20" style={{ background: beltColor }} />
          <div>
            <p className={`font-bold ${t.textPrimary}`}>{beltRank}</p>
            <p className={`text-xs ${t.textMuted}`}>{classesAtCurrentBelt} of {classesRequired} classes completed</p>
          </div>
          {nextBelt && (
            <div className="ml-auto text-right">
              <p className={`text-xs ${t.textMuted}`}>Next belt</p>
              <p className={`text-sm font-bold ${t.textPrimary}`}>{nextBelt}</p>
            </div>
          )}
        </div>

        {/* Stripe position dots — physical belt representation */}
        {isAdvancedBelt ? (
          // Advanced belt (Green+): 4 dots top + 4 dots bottom
          <div className="space-y-3">
            <p className={`text-xs font-semibold uppercase tracking-wider ${t.textMuted} mb-1`}>Top of Belt</p>
            <div className="flex gap-3 justify-center">
              {stripePositionData.slice(0, 4).map((pos, i) => {
                const hex = pos.color ? (STRIPE_HEX[pos.color] ?? pos.color) : 'transparent';
                const borderHex = pos.color ? (STRIPE_HEX[pos.color] ?? pos.color) : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)');
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{
                        background: pos.color ? hex : 'transparent',
                        borderColor: borderHex,
                        boxShadow: pos.color ? `0 0 8px ${hex}90` : 'none',
                      }}
                    />
                    <span className={`text-[10px] ${t.textMuted}`}>{i + 1}</span>
                  </div>
                );
              })}
            </div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${t.textMuted} mb-1 mt-3`}>Bottom of Belt</p>
            <div className="flex gap-3 justify-center">
              {stripePositionData.slice(4, 8).map((pos, i) => {
                const hex = pos.color ? (STRIPE_HEX[pos.color] ?? pos.color) : 'transparent';
                const borderHex = pos.color ? (STRIPE_HEX[pos.color] ?? pos.color) : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)');
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{
                        background: pos.color ? hex : 'transparent',
                        borderColor: borderHex,
                        boxShadow: pos.color ? `0 0 8px ${hex}90` : 'none',
                      }}
                    />
                    <span className={`text-[10px] ${t.textMuted}`}>{i + 5}</span>
                  </div>
                );
              })}
            </div>
            <p className={`text-xs text-center ${t.textMuted} mt-2`}>
              {classesAtCurrentBelt} of {classesRequired} classes · Each position cycles White → Yellow → Red → Black
            </p>
          </div>
        ) : (
          // Beginner belt (White–Orange): single row of 4 dots
          <div className="space-y-3">
            <div className="flex gap-4 justify-center">
              {stripePositionData.slice(0, 4).map((pos, i) => {
                const hex = pos.color ? (STRIPE_HEX[pos.color] ?? pos.color) : 'transparent';
                const borderHex = pos.color ? (STRIPE_HEX[pos.color] ?? pos.color) : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)');
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        background: pos.color ? hex : 'transparent',
                        borderColor: borderHex,
                        boxShadow: pos.color ? `0 0 10px ${hex}90` : 'none',
                      }}
                    />
                    <span className={`text-[10px] capitalize ${t.textMuted}`}>{pos.color ?? 'empty'}</span>
                  </div>
                );
              })}
            </div>
            <p className={`text-xs text-center ${t.textMuted}`}>
              {classesAtCurrentBelt} of {classesRequired} classes · Stripes cycle White → Yellow → Red → Black
            </p>
          </div>
        )}

        {/* Belt exam CTA */}
        {allPhasesComplete && needsExam && (
          <div className={`mt-5 rounded-xl p-4 border ${isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🥋</div>
              <div className="flex-1">
                <p className={`font-bold ${t.textPrimary} mb-1`}>Belt Exam Required</p>
                <p className={`text-sm ${t.textMuted} mb-3`}>
                  You've earned all {classesRequired} stripes! To advance to <strong>{nextBelt ?? 'the next rank'}</strong>, you must pass the belt exam.
                  {!beltExamFeePaid && ` Exam fee: $${beltExamFee}.`}
                </p>
                {beltExamFeePaid ? (
                  <span className="text-xs font-bold text-green-500 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full">
                    ✓ Exam Fee Paid — Contact your instructor to schedule
                  </span>
                ) : (
                  <button
                    className="text-sm font-bold bg-[#E11D2A] hover:bg-[#c01020] text-white px-4 py-2 rounded-lg"
                    onClick={() => window.location.href = '/belt-exam-payment'}
                  >
                    Pay Belt Exam Fee (${beltExamFee})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* In-class belt note */}
        {allPhasesComplete && !needsExam && (
          <div className={`mt-5 rounded-xl p-4 border ${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <p className={`font-bold text-green-500 mb-1`}>Ready for Belt Promotion!</p>
                <p className={`text-sm ${t.textMuted}`}>
                  You've completed all {classesRequired} classes. Your instructor will award your <strong>{nextBelt ?? 'next belt'}</strong> in class.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary footer */}
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'} flex justify-between text-xs ${t.textMuted}`}>
          <span>{classesAtCurrentBelt} classes at current belt</span>
          <span>{Math.max(0, classesRequired - classesAtCurrentBelt)} classes remaining</span>
        </div>
      </Card>

      {/* Attendance Chart + Program Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6" isDark={isDark}>
          <h3 className={`text-lg font-bold mb-1 ${t.textPrimary}`}>Weekly Attendance</h3>
          <p className={`text-xs ${t.textMuted} mb-4`}>Last 12 weeks</p>
          <div style={{ height: 240 }}>
            {totalClasses === 0 ? (
              <div className={`h-full flex items-center justify-center ${t.textMuted} text-sm`}>
                No attendance records yet. Check in to your first class!
              </div>
            ) : (
              <canvas ref={chartRef} />
            )}
          </div>
        </Card>

        <Card className="p-6" isDark={isDark}>
          <h3 className={`text-lg font-bold ${t.textPrimary} mb-4`}>Program Breakdown</h3>
          {programBreakdown.length === 0 ? (
            <p className={`${t.textMuted} text-sm`}>No data yet.</p>
          ) : (
            <div className="space-y-3">
              {(programBreakdown as {program:string;count:number}[]).map((p) => {
                const pct = totalClasses > 0 ? Math.round((p.count / totalClasses) * 100) : 0;
                return (
                  <div key={p.program}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`${isDark ? "text-white/80" : "text-gray-700"} truncate`}>{p.program}</span>
                      <span className={`${t.textMuted} ml-2 shrink-0`}>{p.count} ({pct}%)</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${t.trackBg}`}>
                      <div className="h-1.5 rounded-full bg-[#E11D2A]" style={{ width: `${pct}%`, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Belt Advancement Timeline */}
      <Card className="p-6" isDark={isDark}>
        <div className="flex items-center gap-3 mb-6">
          <Award className="h-5 w-5 text-[#E11D2A]" />
          <h3 className={`text-lg font-bold ${t.textPrimary}`}>Belt Advancement History</h3>
          <div
            className="ml-auto px-3 py-1 rounded-full text-xs font-bold border"
            style={{ borderColor: beltColor, color: beltColor === "#d1d5db" ? "#374151" : beltColor, background: `${beltColor}20` }}
          >
            {beltRank}
          </div>
        </div>
        {beltHistory.length === 0 ? (
          <p className={`${t.textMuted} text-sm`}>No belt history recorded yet.</p>
        ) : (
          <div className="relative">
            <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
            <div className="space-y-6 pl-12">
              {(beltHistory as {belt:string;date:string;classesAtBelt:number}[]).map((b, i) => {
                const color = BELT_COLORS[b.belt] ?? "#9ca3af";
                const isLatest = i === beltHistory.length - 1;
                return (
                  <div key={i} className="relative">
                    <div
                      className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2"
                      style={{ borderColor: color, background: isLatest ? color : isDark ? "#1c1212" : "white" }}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`font-bold ${t.textPrimary}`}>{b.belt}</span>
                      {isLatest && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-red-50 text-[#E11D2A] border border-red-200 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className={`flex gap-4 mt-1 text-xs ${t.textMuted}`}>
                      <span>{new Date(b.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                      <span>{b.classesAtBelt} class{b.classesAtBelt !== 1 ? "es" : ""} at this belt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Account Tab (Premium Member Dashboard) ──────────────────────────────────
function AccountTab({
  isDark,
  user,
  selfPhotoUrl,
  initials,
  enrollment,
  myEnrollment,
  progressStats,
  schedules,
  setShowFreezeDialog,
  setShowCancelDialog,
  unfreezeMutation,
  setActiveTab,
}: {
  isDark: boolean;
  user: any;
  selfPhotoUrl: string | null;
  initials: string;
  enrollment: any;
  myEnrollment: any;
  progressStats: any;
  schedules: any;
  setShowFreezeDialog: (v: boolean) => void;
  setShowCancelDialog: (v: boolean) => void;
  unfreezeMutation: any;
  setActiveTab: (tab: any) => void;
}) {
  const t = useTokens(isDark);
  const { isAuthenticated, logout } = useAuth();
  const [accountSection, setAccountSection] = useState<string | null>(null);
  const [paymentSearch, setPaymentSearch] = useState("");

  const { data: payments, isLoading: paymentsLoading } = trpc.member.getPaymentHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // Derived data
  const memberName = user?.name || "Member";
  const memberEmail = user?.email || "";
  const beltRank = progressStats?.beltRank ?? enrollment?.enrollment?.beltRank ?? "No Belt";
  const beltColor = BELT_COLORS[beltRank] ?? "#9ca3af";
  const totalClasses = progressStats?.totalClasses ?? 0;
  const currentStreak = progressStats?.currentStreak ?? 0;
  const nextBelt = progressStats?.nextBelt ?? null;
  const packageName = myEnrollment?.packageName ?? enrollment?.package?.name ?? "—";
  const monthlyPrice = myEnrollment?.packageMonthlyPrice ?? enrollment?.package?.monthlyPrice ?? null;
  const memberSince = myEnrollment?.createdAt ?? enrollment?.enrollment?.createdAt;
  const memberStatus = myEnrollment?.isFrozen ? "Frozen" : myEnrollment?.cancellationRequestedAt ? "Cancelling" : myEnrollment?.status ?? "Active";

  // Upcoming payment (first item with status "upcoming")
  const upcomingPayment = payments?.find((p: any) => p.status === "upcoming");

  // Filtered payments for search
  const filteredPayments = (payments ?? []).filter((p: any) => {
    if (!paymentSearch.trim()) return true;
    const q = paymentSearch.toLowerCase();
    return (
      p.description?.toLowerCase().includes(q) ||
      formatDate(p.created).toLowerCase().includes(q) ||
      formatAmount(p.amount).includes(q)
    );
  });

  // If a sub-section is open, render that
  if (accountSection === "billing") {
    return (
      <div className="space-y-5">
        <button onClick={() => setAccountSection(null)} className={`flex items-center gap-2 text-sm font-semibold ${t.textSecondary} hover:text-[#E11D2A] transition-colors`}>
          <ChevronRight className="h-4 w-4 rotate-180" /> Back
        </button>
        <h2 className={`text-2xl font-black ${t.textPrimary}`}>Membership & Billing</h2>

        {/* Plan Summary Card */}
        <Card isDark={isDark} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${t.textMuted}`}>Current Plan</p>
              <p className={`text-xl font-black mt-1 ${t.textPrimary}`}>{packageName}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              memberStatus === "Active" ? "bg-green-100 text-green-700 border border-green-200" :
              memberStatus === "Frozen" ? "bg-blue-100 text-blue-700 border border-blue-200" :
              "bg-amber-100 text-amber-700 border border-amber-200"
            }`}>
              {memberStatus}
            </div>
          </div>
          {monthlyPrice && (
            <div className={`flex items-baseline gap-1 mb-4`}>
              <span className={`text-3xl font-black ${t.textPrimary}`}>{formatAmount(Number(monthlyPrice))}</span>
              <span className={`text-sm ${t.textMuted}`}>/month</span>
            </div>
          )}
          {upcomingPayment && (
            <div className={`rounded-xl p-4 border ${isDark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-100 bg-blue-50"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-blue-400" : "text-blue-600"}`}>Next Payment</p>
                  <p className={`text-lg font-bold mt-0.5 ${t.textPrimary}`}>{formatAmount(upcomingPayment.amount)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${t.textMuted}`}>Due</p>
                  <p className={`text-sm font-semibold ${t.textPrimary}`}>{formatDate(upcomingPayment.created)}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Payment History with Search */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textMuted}`}>Payment History</h3>
            <span className={`text-xs ${t.textMuted}`}>{filteredPayments.length} transaction{filteredPayments.length !== 1 ? "s" : ""}</span>
          </div>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${t.textMuted}`} />
            <input
              type="text"
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              placeholder="Search payments..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              }`}
            />
          </div>
          <PaymentHistorySection isDark={isDark} payments={filteredPayments} isLoading={paymentsLoading} />
        </div>

        {/* Membership Actions */}
        {myEnrollment && (
          <div className="space-y-3">
            <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textMuted}`}>Manage Membership</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!myEnrollment.cancellationRequestedAt && !myEnrollment.isFrozen && (
                <button
                  onClick={() => setShowFreezeDialog(true)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
                    isDark ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <PauseCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className={`font-semibold text-sm ${t.textPrimary}`}>Pause Membership</p>
                    <p className={`text-xs ${t.textMuted}`}>Freeze billing temporarily</p>
                  </div>
                </button>
              )}
              {myEnrollment.isFrozen && (
                <button
                  onClick={() => myEnrollment.id && unfreezeMutation.mutate({ enrollmentId: myEnrollment.id })}
                  className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                >
                  <Snowflake className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-blue-800">Unfreeze Membership</p>
                    <p className="text-xs text-blue-600">Resume your membership now</p>
                  </div>
                </button>
              )}
              {!myEnrollment.cancellationRequestedAt && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
                    isDark ? "border-red-900/40 hover:bg-red-950/30" : "border-red-100 hover:bg-red-50"
                  }`}
                >
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? "text-red-400" : "text-red-700"}`}>Request Cancellation</p>
                    <p className={`text-xs ${isDark ? "text-red-400/60" : "text-red-500"}`}>30-day notice required</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (accountSection === "perks") {
    return (
      <div className="space-y-8">
        <button onClick={() => setAccountSection(null)} className={`flex items-center gap-2 text-sm font-semibold ${t.textSecondary} hover:text-[#E11D2A] transition-colors`}>
          <ChevronRight className="h-4 w-4 rotate-180" /> Back
        </button>

        {/* Your Plan */}
        <div>
          <h2 className={`text-2xl font-black ${t.textPrimary}`}>Your Plan</h2>
          <p className={`text-sm ${t.textMuted} mt-1`}>Here's what's included with your membership</p>
          <div className={`mt-4 rounded-2xl border p-6 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#E11D2A]">
                  {(enrollment as any)?.enrollment?.program || "Foundation"} Plan
                </p>
                <p className={`text-3xl font-black mt-1 ${t.textPrimary}`}>
                  ${(enrollment as any)?.enrollment?.monthlyRate || "149"}<span className={`text-sm font-normal ${t.textMuted}`}>/month</span>
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">Active</div>
            </div>
            <div className="space-y-3 mt-6">
              {[
                "Unlimited classes per week",
                "Access to all programs (Karate, Kickboxing, Self-Defense)",
                "Belt testing eligibility",
                "Free uniform on enrollment",
                "Access to member events and seminars",
                "Priority registration for camps and workshops",
                "Progress tracking and digital belt card",
                "Family member discounts available",
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#E11D2A]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-[#E11D2A]" />
                  </div>
                  <p className={`text-sm ${t.textSecondary}`}>{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refer & Earn */}
        <div>
          <h2 className={`text-2xl font-black ${t.textPrimary}`}>Refer & Earn</h2>
          <p className={`text-sm ${t.textMuted} mt-1`}>Share MyDojo with friends and unlock exclusive rewards</p>
          <div className={`mt-4 rounded-2xl border p-5 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${t.textLabel} mb-2`}>Your Referral Link</p>
            <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
              <input type="text" readOnly value={`https://mydojoma.com/refer/${user?.id ? btoa(String(user.id)).slice(0, 8) : "member"}`} className={`flex-1 text-sm bg-transparent outline-none ${t.textPrimary} font-mono`} />
              <button onClick={() => { navigator.clipboard.writeText(`https://mydojoma.com/refer/${user?.id ? btoa(String(user.id)).slice(0, 8) : "member"}`); alert("Referral link copied!"); }} className="px-3 py-1.5 rounded-lg bg-[#E11D2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#c41824] transition-colors">Copy</button>
            </div>
            <p className={`text-xs ${t.textMuted} mt-2`}>When your friend enrolls using this link, you earn rewards automatically.</p>
          </div>
          <div className="mt-4 space-y-4">
            {[
              { referrals: 1, reward: "Free MyDojo T-Shirt", img: "/manus-storage/reward-tshirt_5911ff60.jpg", desc: "Refer 1 friend who enrolls and receive a premium MyDojo training t-shirt." },
              { referrals: 3, reward: "Free Karate Uniform (Gi)", img: "/manus-storage/reward-uniform_9d478357.jpg", desc: "Refer 3 friends who enroll and receive a brand new Kihon Gi karate uniform." },
              { referrals: 6, reward: "Free Sparring Gear Set", img: "/manus-storage/reward-sparring_10b760f1.jpg", desc: "Refer 6 friends who enroll and receive a complete sparring gear set." },
              { referrals: 8, reward: "One Month Free Tuition", img: "/manus-storage/reward-tuition_d47d2400.jpg", desc: "Refer 8 friends who enroll and your next month of tuition is on us." },
              { referrals: 10, reward: "$500 Cash Reward", img: "/manus-storage/reward-cash_02508018.jpg", desc: "Refer 10 friends who enroll and receive $500 cash. No strings attached." },
            ].map((tier, i) => (
              <div key={i} className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <div className="flex items-stretch">
                  <div className="w-24 h-24 shrink-0 overflow-hidden"><img src={tier.img} alt={tier.reward} className="w-full h-full object-cover" loading="lazy" /></div>
                  <div className="flex-1 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className={`font-bold text-sm ${t.textPrimary}`}>{tier.reward}</p><p className={`text-xs ${t.textMuted} mt-1 leading-relaxed`}>{tier.desc}</p></div>
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#E11D2A] flex items-center justify-center"><span className="text-white font-black text-sm">{tier.referrals}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-4 rounded-2xl border p-5 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
            <div className="flex items-center justify-between mb-3"><p className={`text-xs font-bold uppercase tracking-widest ${t.textLabel}`}>Your Referrals</p><p className={`text-2xl font-black ${t.textPrimary}`}>0</p></div>
            <div className={`h-3 rounded-full ${isDark ? "bg-white/5" : "bg-gray-100"} overflow-hidden`}><div className="h-full rounded-full bg-[#E11D2A]" style={{ width: "0%" }} /></div>
            <p className={`text-xs ${t.textMuted} mt-2`}>Refer 1 more friend to earn your first reward!</p>
          </div>
        </div>

        {/* Partner Deals */}
        <div>
          <h2 className={`text-2xl font-black ${t.textPrimary}`}>Partner Deals</h2>
          <p className={`text-sm ${t.textMuted} mt-1`}>Exclusive discounts from our local partners</p>
          <div className="mt-4 space-y-3">
            {[
              { name: "Mia Bella Restaurant", deal: "Exclusive member offer — details coming soon", location: "Tomball, TX", category: "Dining" },
              { name: "Hatchki Cafe", deal: "Exclusive member offer — details coming soon", location: "Tomball, TX", category: "Cafe" },
              { name: "Coco Restaurant", deal: "Exclusive member offer — details coming soon", location: "Tomball, TX", category: "Dining" },
              { name: "180 Rodeo Rink", deal: "Exclusive member offer — details coming soon", location: "Tomball, TX", category: "Entertainment" },
              { name: "Chick-fil-A", deal: "Exclusive member offer — details coming soon", location: "Tomball, TX", category: "Food" },
            ].map((partner, i) => (
              <div key={i} className={`p-4 rounded-xl border ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div><p className={`font-bold text-sm ${t.textPrimary}`}>{partner.name}</p><p className="text-[#E11D2A] text-xs font-semibold mt-0.5">{partner.deal}</p><p className={`text-xs ${t.textMuted} mt-1`}>{partner.location}</p></div>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500"}`}>{partner.category}</div>
                </div>
              </div>
            ))}
            <p className={`text-xs ${t.textMuted} text-center mt-2`}>Show your MyDojo member ID at checkout to redeem. More partners coming soon!</p>
          </div>
        </div>
      </div>
    );
  }

  if (accountSection === "family") {
    return (
      <div className="space-y-5">
        <button onClick={() => setAccountSection(null)} className={`flex items-center gap-2 text-sm font-semibold ${t.textSecondary} hover:text-[#E11D2A] transition-colors`}>
          <ChevronRight className="h-4 w-4 rotate-180" /> Back
        </button>
        <h2 className={`text-2xl font-black ${t.textPrimary}`}>My Family</h2>
        <MyChildren isDark={isDark} />
      </div>
    );
  }

  if (accountSection === "settings") {
    return (
      <div className="space-y-5">
        <button onClick={() => setAccountSection(null)} className={`flex items-center gap-2 text-sm font-semibold ${t.textSecondary} hover:text-[#E11D2A] transition-colors`}>
          <ChevronRight className="h-4 w-4 rotate-180" /> Back
        </button>
        <h2 className={`text-2xl font-black ${t.textPrimary}`}>Settings</h2>
        <div className="space-y-2">
          {[
            { label: "Edit Profile", icon: <UserIcon className="h-5 w-5" />, onClick: () => {} },
            { label: "Change Password", icon: <Lock className="h-5 w-5" />, onClick: () => window.location.href = "/forgot-password" },
            { label: "Notification Preferences", icon: <Bell className="h-5 w-5" />, onClick: () => {} },
            { label: "Emergency Contact", icon: <Users className="h-5 w-5" />, onClick: () => {} },
            { label: "Privacy & Terms", icon: <BookOpen className="h-5 w-5" />, onClick: () => {} },
            { label: "Help / FAQ", icon: <MessageCircle className="h-5 w-5" />, onClick: () => {} },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                isDark ? "border-white/8 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50"
              }`}
            >
              <div className={`${t.textMuted}`}>{item.icon}</div>
              <span className={`font-medium text-sm ${t.textPrimary}`}>{item.label}</span>
              <ChevronRight className={`h-4 w-4 ml-auto ${t.textMuted}`} />
            </button>
          ))}
          <button
            onClick={() => { if (confirm("Are you sure you want to sign out?")) logout(); }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-left mt-4"
          >
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-sm text-red-600">Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Main Account Overview ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Member Hero Card ── */}
      <Card isDark={isDark} className="overflow-hidden">
        <div className="relative p-6 pb-5" style={{ background: isDark ? "linear-gradient(135deg, #1a0505, #2d0808)" : "linear-gradient(135deg, #fef2f2, #fff)" }}>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#E11D2A] to-red-700 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg">
              {selfPhotoUrl ? (
                <img src={selfPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className={`text-xl font-black leading-tight ${t.textPrimary}`}>{memberName}</h2>
              <p className={`text-sm ${t.textMuted} mt-0.5`}>{packageName} Program</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3.5 h-3.5 rounded-full border-2" style={{ background: beltColor, borderColor: beltColor }} />
                <span className={`text-sm font-semibold ${t.textPrimary}`}>{beltRank}</span>
              </div>
            </div>
            {/* Status badge */}
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              memberStatus === "Active" ? "bg-green-100 text-green-700" :
              memberStatus === "Frozen" ? "bg-blue-100 text-blue-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {memberStatus}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`grid grid-cols-3 gap-3 mt-5 pt-5 border-t ${isDark ? "border-white/10" : "border-gray-200/60"}`}>
            <div className="text-center">
              <p className={`text-2xl font-black ${t.textPrimary}`}>{totalClasses}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.textMuted}`}>Classes</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-black text-orange-500`}>{currentStreak}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.textMuted}`}>Streak</p>
            </div>
            <div className="text-center">
              <p className={`text-sm font-bold ${t.textPrimary} leading-tight`}>{nextBelt ?? "—"}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.textMuted}`}>Next Goal</p>
            </div>
          </div>

          {/* View My Progress button */}
          <button
            onClick={() => setActiveTab("training")}
            className="w-full mt-5 py-3 rounded-xl bg-[#E11D2A] hover:bg-[#c01020] text-white text-sm font-bold uppercase tracking-wider transition-colors"
          >
            View My Progress
          </button>

          {/* Member since */}
          {memberSince && (
            <p className={`text-center text-xs ${t.textMuted} mt-3`}>
              Member since {new Date(memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </Card>

      {/* ── Upcoming Payment Card ── */}
      {upcomingPayment && (
        <Card isDark={isDark} className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-blue-400" : "text-blue-600"}`}>Next Payment</p>
              <p className={`text-2xl font-black mt-1 ${t.textPrimary}`}>{formatAmount(upcomingPayment.amount)}</p>
              <p className={`text-xs ${t.textMuted} mt-0.5`}>{upcomingPayment.description}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${t.textPrimary}`}>{formatDate(upcomingPayment.created)}</p>
              <p className={`text-xs ${t.textMuted}`}>Due date</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Quick Actions / Section Navigation ── */}
      <div className="space-y-2">
        {[
          { id: "billing", label: "Membership & Billing", sublabel: monthlyPrice ? `${formatAmount(Number(monthlyPrice))}/mo · ${packageName}` : packageName, icon: <CreditCard className="h-5 w-5 text-green-500" /> },
          { id: "family", label: "My Family", sublabel: "Manage family members", icon: <Users className="h-5 w-5 text-purple-500" /> },
          { id: "documents", label: "Documents", sublabel: "Waivers, certificates, receipts", icon: <BookOpen className="h-5 w-5 text-orange-500" /> },
          { id: "notifications", label: "Notifications", sublabel: "SMS, email, push preferences", icon: <Bell className="h-5 w-5 text-yellow-500" /> },
          { id: "settings", label: "Settings", sublabel: "Profile, password, sign out", icon: <LayoutDashboard className="h-5 w-5 text-gray-500" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "documents" || item.id === "notifications") {
                toast("Coming soon — this feature is being built.");
              } else {
                setAccountSection(item.id);
              }
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
              isDark ? "border-white/8 hover:bg-white/5 hover:border-white/15" : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${t.textPrimary}`}>{item.label}</p>
              <p className={`text-xs ${t.textMuted} truncate`}>{item.sublabel}</p>
            </div>
            <ChevronRight className={`h-4 w-4 ${t.textMuted} group-hover:text-[#E11D2A] transition-colors`} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Payment History Section ─────────────────────────────────────────────────
function PaymentHistorySection({ isDark, payments: externalPayments, isLoading: externalLoading }: { isDark: boolean; payments?: any[]; isLoading?: boolean }) {
  const t = useTokens(isDark);
  const { isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const { data: fetchedPayments, isLoading: fetchedLoading } = trpc.member.getPaymentHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const payments = externalPayments ?? fetchedPayments;
  const isLoading = externalLoading ?? fetchedLoading;
  const displayedPayments = expanded ? (payments ?? []) : (payments ?? []).slice(0, 5);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div>
      <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textMuted} mb-4`}>Payment History</h3>
      <div
        className={`rounded-2xl border shadow-sm ${t.cardBorder} overflow-hidden`}
        style={isDark ? { background: "rgba(28, 18, 18, 0.85)", backdropFilter: "blur(12px)" } : { background: "#fff" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#E11D2A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-10 gap-3 ${t.textSecondary}`}>
            <Receipt className="h-10 w-10 opacity-30" />
            <p className="text-sm">No payment records found</p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              className={`grid grid-cols-3 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b ${t.textMuted} ${t.borderSubtle}`}
            >
              <span>Date</span>
              <span>Description</span>
              <span className="text-right">Amount</span>
            </div>
            {/* Payment rows */}
            {displayedPayments.map((p) => (
              <div
                key={p.id}
                className={`grid grid-cols-3 gap-4 px-5 py-4 border-b last:border-b-0 ${t.borderSubtle} ${t.bgHover} transition-colors`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      p.status === "upcoming"
                        ? isDark ? "bg-blue-500/15" : "bg-blue-50"
                        : isDark ? "bg-green-500/15" : "bg-green-50"
                    }`}
                  >
                    <CreditCard className={`h-4 w-4 ${p.status === "upcoming" ? "text-blue-500" : "text-green-500"}`} />
                  </div>
                  <span className={`text-sm ${t.textSecondary}`}>{formatDate(p.created)}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm ${t.textPrimary}`}>{p.description}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-sm font-semibold ${
                    p.status === "upcoming"
                      ? isDark ? "text-blue-400" : "text-blue-600"
                      : isDark ? "text-green-400" : "text-green-600"
                  }`}>
                    {formatAmount(p.amount)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "upcoming"
                        ? isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"
                        : isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600"
                    }`}
                  >
                    {p.status === "upcoming" ? "Scheduled" : "Paid"}
                  </span>
                </div>
              </div>
            ))}
            {/* Show more / less */}
            {payments.length > 5 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {expanded ? (
                  <><ChevronUp className="h-4 w-4" /> Show less</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> Show all {payments.length} payments</>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MemberDashboard2() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "benefits" | "training" | "locate" | "shop" | "account">("home");
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showAddKickboxingDialog, setShowAddKickboxingDialog] = useState(false);
  const [kickboxingStep, setKickboxingStep] = useState<"info" | "payment" | "success">("info");
  const [kickboxingMemberName, setKickboxingMemberName] = useState("");
  const [kickboxingMemberEmail, setKickboxingMemberEmail] = useState("");
  const [kickboxingMemberPhone, setKickboxingMemberPhone] = useState("");
  const [kickboxingTokenizerReady, setKickboxingTokenizerReady] = useState(false);
  const kickboxingTokenizerRef = useRef<any>(null);
  const kickboxingTokenizerInitRef = useRef(false);
  const [kickboxingIsSubmitting, setKickboxingIsSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [freezeStartDate, setFreezeStartDate] = useState("");
  const [freezeEndDate, setFreezeEndDate] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [selfPhotoUrl, setSelfPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { mode, setMode, isDark } = useDashboardTheme();
  const t = useTokens(isDark);

  const uploadSelfPhotoMutation = trpc.member.uploadSelfPhoto.useMutation({
    onSuccess: (data) => {
      setSelfPhotoUrl(data.url);
      setPhotoUploading(false);
      setPhotoUploadSuccess(true);
      setTimeout(() => setPhotoUploadSuccess(false), 3000);
    },
    onError: () => {
      setPhotoUploading(false);
      alert('Photo upload failed. Please try again.');
    },
  });

  const handlePhotoFile = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5 MB');
      return;
    }
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      setPhotoUploading(true);
      uploadSelfPhotoMutation.mutate({ imageBase64: base64, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const { data: myEnrollment, refetch: refetchMyEnrollment } = trpc.member.getMyEnrollment.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();

  const requestCancellationMutation = trpc.member.requestCancellation.useMutation({
    onSuccess: () => {
      setShowCancelDialog(false);
      setCancelReason("");
      refetchMyEnrollment();
      utils.member.getEnrollment.invalidate();
      alert("Cancellation request submitted. You will receive a confirmation email with your final billing date.");
    },
    onError: (err) => alert("Error: " + err.message),
  });

  const freezeMutation = trpc.member.freezeMembership.useMutation({
    onSuccess: () => {
      setShowFreezeDialog(false);
      setFreezeStartDate("");
      setFreezeEndDate("");
      setFreezeReason("");
      refetchMyEnrollment();
      utils.member.getEnrollment.invalidate();
      alert("Freeze request submitted. You will receive a confirmation email once approved.");
    },
    onError: (err) => alert("Error: " + err.message),
  });

  const unfreezeMutation = trpc.member.unfreezeMembership.useMutation({
    onSuccess: () => {
      refetchMyEnrollment();
      utils.member.getEnrollment.invalidate();
      alert("Your membership has been unfrozen.");
    },
    onError: (err) => alert("Error: " + err.message),
  });

  const addKickboxingMutation = trpc.family.addFamilyKickboxingMember.useMutation({
    onSuccess: () => {
      setKickboxingStep("success");
      setKickboxingIsSubmitting(false);
    },
    onError: (err) => {
      setKickboxingIsSubmitting(false);
      alert("Payment failed: " + err.message);
    },
  });

  // Load FluidPay tokenizer when kickboxing payment step is shown
  useEffect(() => {
    if (!showAddKickboxingDialog || kickboxingStep !== "payment") return;
    if (kickboxingTokenizerInitRef.current) return;
    const initTokenizer = () => {
      if (!window.Tokenizer) return;
      kickboxingTokenizerInitRef.current = true;
      const publicKey = import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "";
      const instance = new window.Tokenizer({
        apikey: publicKey,
        container: "#kickboxing-tokenizer-container",
        submission: (resp: { token?: string; status?: string; error?: string }) => {
          if (!resp.token || resp.status === "error") {
            alert(resp.error || "Card tokenization failed. Please check your card details.");
            setKickboxingIsSubmitting(false);
            return;
          }
          addKickboxingMutation.mutate({
            memberName: kickboxingMemberName,
            memberEmail: kickboxingMemberEmail,
            memberPhone: kickboxingMemberPhone || undefined,
            cardToken: resp.token,
          });
        },
        onLoad: () => setKickboxingTokenizerReady(true),
        settings: {
          payment: { types: ["card"] },
          styles: {
            body: { "font-family": "inherit", "background-color": "transparent" },
            inputs: { "border-radius": "8px", "border": "2px solid #e2e8f0", "padding": "14px 16px", "font-size": "16px" },
          },
        },
      });
      kickboxingTokenizerRef.current = instance;
    };
    if (window.Tokenizer) {
      initTokenizer();
    } else {
      const existing = document.getElementById("fluidpay-tokenizer-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "fluidpay-tokenizer-script";
        script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
        script.async = true;
        script.onload = initTokenizer;
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", initTokenizer);
      }
    }
  }, [showAddKickboxingDialog, kickboxingStep]);

  const { data: enrollment, isLoading: enrollmentLoading } = trpc.member.getEnrollment.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: schedules } = trpc.member.getClassSchedules.useQuery(undefined, {
    enabled: isAuthenticated && !!enrollment,
  });

  // ── Today's classes (dashboard home tab) ─────────────────────────────────
  const { data: todayClasses, isLoading: todayClassesLoading, refetch: refetchTodayClasses } = trpc.attendance.getTodayClasses.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<(typeof todayClasses extends (infer T)[] | undefined ? T : never) | null>(null);

  const checkInMutation = trpc.attendance.checkIn.useMutation({
    onSuccess: () => {
      refetchTodayClasses();
      setCheckingInId(null);
      toast.success("Checked in! See you on the mat.");
    },
    onError: (err) => {
      toast.error(err.message || "Check-in failed. Please try again.");
      setCheckingInId(null);
    },
  });

  const handleCheckIn = (classScheduleId: number) => {
    setCheckingInId(classScheduleId);
    const today = new Date().toISOString().split('T')[0];
    checkInMutation.mutate({ classScheduleId, attendanceDate: today });
  };

  // Map class program name to programs data for the detail modal
  const PROGRAM_TITLE_MAP: Record<string, string> = {
    "Little Ninjas": "little-ninjas",
    "Little Ninjas & Me": "little-ninjas",
    "Dragon Kids": "core-kids",
    "Dragon Kids & Teens": "core-kids",
    "Teens": "teens",
    "Teen Warriors": "teens",
    "Adult Karate": "adult-karate",
    "Adult Karate + Kickboxing": "adult-karate",
    "Kickboxing": "kickboxing",
    "After School": "after-school",
    "Summer Camp": "summer-camp",
    "Intro Class": "adult-karate",
    "Leadership": "adult-karate",
    "Sparring": "adult-karate",
    "Weapons Class": "adult-karate",
    "Women's Self-Defense": "adult-karate",
    "Advanced/Black Belt + Kickboxing": "adult-karate",
    "Family Class": "core-kids",
    "Instructor Training": "adult-karate",
    "Demo/Competition Team": "adult-karate",
  };

  // Belt progress stats (used by both dashboard tab progress card and Progress tab)
  const { data: progressStats } = trpc.member.getProgressStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: unreadData } = trpc.member.getUnreadMessageCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15_000, // poll every 15s
  });
  const unreadCount = unreadData?.unreadCount ?? 0;

  // ── New-message banner ────────────────────────────────────────────────────
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const prevUnreadRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch latest message for the banner preview
  const { data: convData } = trpc.member.getConversations.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });

  const dismissBanner = useCallback(() => {
    setBannerVisible(false);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
  }, []);

  useEffect(() => {
    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadCount;
      return;
    }
    // New unread messages arrived AND student is not on the messages tab
    if (unreadCount > prevUnreadRef.current && activeTab !== "home") {
      const latestConv = convData?.[0];
      const lastMsg = latestConv?.lastMessage;
      const senderName = lastMsg?.senderName ?? "Instructor";
      const preview = lastMsg?.body
        ? lastMsg.body.slice(0, 60) + (lastMsg.body.length > 60 ? "…" : "")
        : "You have a new message";
      setBannerMsg(`${senderName}: ${preview}`);
      setBannerVisible(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => setBannerVisible(false), 6000);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, activeTab, convData]);

  // Clean up timer on unmount
  useEffect(() => () => { if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current); }, []);

  // Initialize selfPhotoUrl from enrollment data
  useEffect(() => {
    if (enrollment && (enrollment as any).photoUrl && !selfPhotoUrl) {
      setSelfPhotoUrl((enrollment as any).photoUrl);
    }
  }, [enrollment]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login?returnTo=/dashboard";
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || enrollmentLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "" : "bg-gray-50"}`}
        style={isDark ? { background: "radial-gradient(ellipse at 50% 80%, #3d0a0a 0%, #1c0a0a 30%, #111111 60%, #0d0d0d 100%)" } : undefined}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-[#E11D2A] border-t-transparent animate-spin" />
          <p className={`${t.textSecondary} text-sm`}>Loading your dojo…</p>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Student";
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const getNextClass = () => {
    if (!schedules?.length) return null;
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayIdx = now.getDay();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    for (let i = 0; i < 7; i++) {
      const dayName = days[(todayIdx + i) % 7];
      const dayClasses = schedules.filter((s) => s.dayOfWeek === dayName);
      for (const c of dayClasses) {
        const [h, m] = c.startTime.split(":").map(Number);
        if (i === 0 && h * 60 + m <= nowMins) continue;
        return { ...c, day: dayName };
      }
    }
    return null;
  };
  const nextClass = getNextClass();
  const goals = [
    { label: "Train 5 times this week", current: 3, total: 5, done: false },
    { label: "Watch 2 training videos", current: 2, total: 2, done: true },
    { label: "Complete practice drill", current: 0, total: 1, done: false },
  ];

  const achievements = [
    { label: "Advanced Punching Techniques", unlocked: true },
    { label: "Defensive Blocks and Counters", unlocked: true },
    { label: "Complete Advanced Forms", unlocked: false },
    { label: "Sparring Strategies", unlocked: false },
  ];

  const resources = [
    { icon: <Play className="h-6 w-6" />, label: "Video Library", bg: isDark ? "bg-red-500/20" : "bg-red-100", iconColor: "text-[#E11D2A]" },
    { icon: <Target className="h-6 w-6" />, label: "Practice Drills", bg: isDark ? "bg-orange-500/20" : "bg-orange-100", iconColor: "text-orange-500" },
    { icon: <BookOpen className="h-6 w-6" />, label: "Skill Guides", bg: isDark ? "bg-white/10" : "bg-gray-100", iconColor: isDark ? "text-white/70" : "text-gray-700" },
    { icon: <BookOpen className="h-6 w-6" />, label: "Skill Guides II", bg: isDark ? "bg-white/10" : "bg-gray-100", iconColor: isDark ? "text-white/70" : "text-gray-700" },
    { icon: <Users className="h-6 w-6" />, label: "Community Forum", bg: isDark ? "bg-blue-500/20" : "bg-blue-50", iconColor: "text-blue-500" },
  ];

  const quickActions = [
    { icon: <QrCode className="h-6 w-6" />, label: "QR Check-in", onClick: () => (window.location.href = "/check-in") },
    { icon: <Calendar className="h-6 w-6" />, label: "Book a Class", onClick: () => {} },
    { icon: <Zap className="h-6 w-6" />, label: "Join Live Class", onClick: () => {} },
    { icon: <Clock className="h-6 w-6" />, label: "Training Timer", onClick: () => {} },
  ];

  // Detect if this member is in a kickboxing program
  const memberProgram = (enrollment as any)?.enrollment?.program ?? "";
  const isKickboxing = true; // Show kickboxing add-on to all enrolled members

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "curriculum", label: "Curriculum" },
    ...(isKickboxing ? [{ id: "meal_plan", label: "Meal Plan" }] : []),
    { id: "progress", label: "Progress" },
    { id: "messages", label: "Messages" },
    { id: "children", label: "My Children" },
    { id: "billing", label: "Billing" },
    { id: "bucks", label: "🪙 MyDojo Bucks" },
  ];

  return (
    <div
      className={`min-h-screen ${t.textPrimary} ${isDark ? "" : t.pageBgClass}`}
      style={isDark ? { background: t.pageBg } : undefined}
    >
      {/* ── New Message Banner ── */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none"
        style={{ transition: "none" }}
      >
        <div
          className="pointer-events-auto mx-4 mt-3 max-w-md w-full"
          style={{
            transform: bannerVisible ? "translateY(0)" : "translateY(-120%)",
            opacity: bannerVisible ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
          }}
        >
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border"
            style={{
              background: isDark ? "rgba(20,8,8,0.96)" : "#ffffff",
              borderColor: isDark ? "rgba(225,29,42,0.4)" : "#fca5a5",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#E11D2A] flex items-center justify-center shadow-md">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 text-[#E11D2A]`}>
                New Message
              </p>
              <p className={`text-sm truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>
                {bannerMsg}
              </p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { setActiveTab("home"); dismissBanner(); }}
                className="text-xs font-bold text-[#E11D2A] hover:text-red-400 transition-colors whitespace-nowrap"
              >
                View
              </button>
              <button
                onClick={dismissBanner}
                className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-400"}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Nav ── */}
      <header className={`sticky top-0 z-50 border-b ${t.navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img
                src={isDark ? "/images/logo-icon-white.99cb4daa.webp" : "/images/logo-icon.99cb4daa.webp"}
                alt="MyDojo"
                className="h-9 w-9 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo-icon-white.99cb4daa.webp"; }}
              />
              <span className={`text-xl font-black tracking-widest ${t.textPrimary}`}>MYDOJO</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Streak badge */}
            <div className={`hidden sm:flex items-center gap-1.5 ${t.streakBg} border rounded-full px-3 py-1 mr-1`}>
              <Flame className={`h-4 w-4 ${t.streakIcon}`} />
              <span className={`text-xs font-bold ${t.streakText}`}>5 Day Streak</span>
            </div>

            {/* Theme toggle */}
            <ThemeToggle mode={mode} setMode={setMode} isDark={isDark} />

            {/* Bell */}
            <button className={`relative p-2 rounded-full transition-colors ${t.iconBtn}`}>
              <Bell className={`h-5 w-5 ${t.iconColor}`} />
            </button>

            {/* Messages */}
            <button
              className={`relative p-2 rounded-full transition-colors ${t.iconBtn}`}
              onClick={() => setActiveTab("home")}
            >
              <MessageCircle className={`h-5 w-5 ${t.iconColor}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#E11D2A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            {/* Hidden file inputs for photo upload */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); e.target.value = ''; }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); e.target.value = ''; }}
            />
            <div className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-full transition-colors ${t.iconBtn}`}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#E11D2A] to-red-700 flex items-center justify-center text-sm font-bold text-white">
                  {selfPhotoUrl ? (
                    <img src={selfPhotoUrl} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    initials
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {photoUploadSuccess && (
                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <span className={`hidden sm:block text-sm font-medium ${t.profileName}`}>{firstName}</span>
                <ChevronDown className={`h-4 w-4 ${t.profileChevron}`} />
              </button>
              {profileOpen && (
                <div className={`absolute right-0 mt-2 w-52 rounded-xl border py-1 z-50 ${t.dropdownBg}`}>
                  {/* Photo preview + name */}
                  <div className={`px-4 py-3 border-b ${t.borderSubtle} flex items-center gap-3`}>
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#E11D2A] to-red-700 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                      {selfPhotoUrl ? (
                        <img src={selfPhotoUrl} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${t.textPrimary} truncate`}>{user?.name}</p>
                      <p className={`text-xs ${t.textMuted} truncate`}>{user?.email}</p>
                    </div>
                  </div>
                  {/* Photo upload options */}
                  <div className={`px-3 py-2 border-b ${t.borderSubtle}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t.textMuted}`}>Profile Photo</p>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-white/10 text-white/70 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => { setProfileOpen(false); photoInputRef.current?.click(); }}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-white/10 text-white/70 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => { setProfileOpen(false); cameraInputRef.current?.click(); }}
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Camera
                      </button>
                    </div>
                  </div>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${t.dropdownText}`}
                    onClick={() => (window.location.href = "/")}
                  >
                    Back to Website
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">

        {/* ── BENEFITS TAB ── */}
        {activeTab === "benefits" && (
          <div className="space-y-8">

            {/* Your Plan */}
            <div>
              <h2 className={`text-2xl font-black ${t.textPrimary}`}>Your Plan</h2>
              <p className={`text-sm ${t.textMuted} mt-1`}>Here's what's included with your membership</p>
              <div className={`mt-4 rounded-2xl border p-6 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#E11D2A]">
                      {(enrollment as any)?.enrollment?.program || "Foundation"} Plan
                    </p>
                    <p className={`text-3xl font-black mt-1 ${t.textPrimary}`}>
                      ${(enrollment as any)?.enrollment?.monthlyRate || "149"}<span className={`text-sm font-normal ${t.textMuted}`}>/month</span>
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">Active</div>
                </div>
                <div className="space-y-3 mt-6">
                  {[
                    "Unlimited classes per week",
                    "Access to all programs (Karate, Kickboxing, Self-Defense)",
                    "Belt testing eligibility",
                    "Free uniform on enrollment",
                    "Access to member events and seminars",
                    "Priority registration for camps and workshops",
                    "Progress tracking and digital belt card",
                    "Family member discounts available",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#E11D2A]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3 w-3 text-[#E11D2A]" />
                      </div>
                      <p className={`text-sm ${t.textSecondary}`}>{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Refer & Earn */}
            <div>
              <h2 className={`text-2xl font-black ${t.textPrimary}`}>Refer & Earn</h2>
              <p className={`text-sm ${t.textMuted} mt-1`}>Share MyDojo with friends and unlock exclusive rewards</p>
              <div className={`mt-4 rounded-2xl border p-5 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${t.textLabel} mb-2`}>Your Referral Link</p>
                <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}>
                  <input type="text" readOnly value={`https://mydojoma.com/refer/${user?.id ? btoa(String(user.id)).slice(0, 8) : "member"}`} className={`flex-1 text-sm bg-transparent outline-none ${t.textPrimary} font-mono`} />
                  <button onClick={() => { navigator.clipboard.writeText(`https://mydojoma.com/refer/${user?.id ? btoa(String(user.id)).slice(0, 8) : "member"}`); alert("Referral link copied!"); }} className="px-3 py-1.5 rounded-lg bg-[#E11D2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#c41824] transition-colors">Copy</button>
                </div>
                <p className={`text-xs ${t.textMuted} mt-2`}>When your friend enrolls using this link, you earn rewards automatically.</p>
              </div>
              <div className="mt-4 space-y-4">
                {[
                  { referrals: 1, reward: "Free MyDojo T-Shirt", img: "/manus-storage/reward-tshirt_5911ff60.jpg", desc: "Refer 1 friend who enrolls and receive a premium MyDojo training t-shirt." },
                  { referrals: 3, reward: "Free Karate Uniform (Gi)", img: "/manus-storage/reward-uniform_9d478357.jpg", desc: "Refer 3 friends who enroll and receive a brand new Kihon Gi karate uniform." },
                  { referrals: 6, reward: "Free Sparring Gear Set", img: "/manus-storage/reward-sparring_10b760f1.jpg", desc: "Refer 6 friends who enroll and receive a complete sparring gear set." },
                  { referrals: 8, reward: "One Month Free Tuition", img: "/manus-storage/reward-tuition_d47d2400.jpg", desc: "Refer 8 friends who enroll and your next month of tuition is on us." },
                  { referrals: 10, reward: "$500 Cash Reward", img: "/manus-storage/reward-cash_02508018.jpg", desc: "Refer 10 friends who enroll and receive $500 cash. No strings attached." },
                ].map((tier, i) => (
                  <div key={i} className={`rounded-2xl border overflow-hidden ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                    <div className="flex items-stretch">
                      <div className="w-24 h-24 shrink-0 overflow-hidden"><img src={tier.img} alt={tier.reward} className="w-full h-full object-cover" loading="lazy" /></div>
                      <div className="flex-1 p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0"><p className={`font-bold text-sm ${t.textPrimary}`}>{tier.reward}</p><p className={`text-xs ${t.textMuted} mt-1 leading-relaxed`}>{tier.desc}</p></div>
                        <div className="shrink-0 w-10 h-10 rounded-full bg-[#E11D2A] flex items-center justify-center"><span className="text-white font-black text-sm">{tier.referrals}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`mt-4 rounded-2xl border p-5 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <div className="flex items-center justify-between mb-3"><p className={`text-xs font-bold uppercase tracking-widest ${t.textLabel}`}>Your Referrals</p><p className={`text-2xl font-black ${t.textPrimary}`}>0</p></div>
                <div className={`h-3 rounded-full ${isDark ? "bg-white/5" : "bg-gray-100"} overflow-hidden`}><div className="h-full rounded-full bg-[#E11D2A]" style={{ width: "0%" }} /></div>
                <p className={`text-xs ${t.textMuted} mt-2`}>Refer 1 more friend to earn your first reward!</p>
              </div>
            </div>

            {/* Partner Deals */}
            <div>
              <h2 className={`text-2xl font-black ${t.textPrimary}`}>Partner Deals</h2>
              <p className={`text-sm ${t.textMuted} mt-1`}>Member offers and local favorites, curated for the MyDojo community.</p>

              {/* Hatchki Cafe */}
              <div className={`mt-4 rounded-2xl border overflow-hidden ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <div className={`p-5 border-b ${isDark ? "border-white/8 bg-white/[0.02]" : "border-gray-100 bg-stone-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-lg font-black ${t.textPrimary}`}>Hatchki Cafe</p>
                      <p className={`text-xs ${t.textMuted} mt-1`}>Exclusive MyDojo member menu</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#E11D2A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E11D2A]">Cafe</span>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-black uppercase tracking-wide ${t.textPrimary}`}>The School Drop-Off Combo</p>
                      <span className={`text-xs font-semibold ${t.textMuted}`}>8–10 AM</span>
                    </div>
                    <div className={`mt-3 divide-y ${isDark ? "divide-white/8" : "divide-gray-100"}`}>
                      <div className="flex items-center justify-between gap-4 py-2"><span className={`text-sm ${t.textSecondary}`}>16 oz latte + empanada</span><span className={`text-sm font-black ${t.textPrimary}`}>$8.99</span></div>
                      <div className="flex items-center justify-between gap-4 py-2"><span className={`text-sm ${t.textSecondary}`}>16 oz latte + kolache</span><span className={`text-sm font-black ${t.textPrimary}`}>$9.49</span></div>
                    </div>
                  </div>
                  <div className={`border-t pt-5 ${isDark ? "border-white/8" : "border-gray-100"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-black uppercase tracking-wide ${t.textPrimary}`}>Crepe Night</p>
                      <span className={`text-xs font-semibold ${t.textMuted}`}>Thursday–Saturday evenings</span>
                    </div>
                    <p className={`text-sm ${t.textSecondary} mt-2`}>Crepes <span className="font-black">$9–$11</span></p>
                    <p className={`text-xs ${t.textMuted} mt-2`}>Add a 16 oz latte for $5 or a 16 oz refresher for $3.50.</p>
                  </div>
                  <div className={`border-t pt-5 ${isDark ? "border-white/8" : "border-gray-100"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-sm font-black uppercase tracking-wide ${t.textPrimary}`}>The Hall Pass</p>
                        <p className={`text-xs ${t.textMuted} mt-1`}>Secret menu • Thursday–Saturday</p>
                      </div>
                      <span className="rounded-full bg-[#E11D2A] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Member special</span>
                    </div>
                    <p className={`text-sm font-semibold ${t.textSecondary} mt-3`}>Strawberry Pineapple Lemonade</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[
                        ["12 oz", "$3.50"],
                        ["16 oz", "$4.50"],
                        ["24 oz", "$6.50"],
                      ].map(([size, price]) => (
                        <div key={size} className={`rounded-xl p-3 text-center ${isDark ? "bg-white/5" : "bg-stone-50"}`}>
                          <p className={`text-[11px] ${t.textMuted}`}>{size}</p>
                          <p className={`text-sm font-black mt-0.5 ${t.textPrimary}`}>{price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplied partner flyers */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <a href="/manus-storage/mia-bella-flyer_c9bcdf96.jpeg" target="_blank" rel="noreferrer" className={`group rounded-2xl border overflow-hidden transition-colors ${isDark ? "border-white/8 bg-zinc-900 hover:border-white/20" : "border-gray-100 bg-white hover:border-gray-200"} shadow-sm`}>
                  <img src="/manus-storage/mia-bella-flyer_c9bcdf96.jpeg" alt="Mia Bella Trattoria weekly specials flyer" className="block w-full h-auto" loading="lazy" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className={`text-lg font-black ${t.textPrimary}`}>Mia Bella Trattoria</p><p className={`text-sm ${t.textMuted} mt-1`}>Italian dining, brunch, and weekly specials in Vintage Park.</p></div>
                      <ChevronRight className={`h-5 w-5 shrink-0 ${t.textMuted} group-hover:text-[#E11D2A]`} />
                    </div>
                  </div>
                </a>
                <a href="/manus-storage/coco-flyer_d22898ad.png" target="_blank" rel="noreferrer" className={`group rounded-2xl border overflow-hidden transition-colors ${isDark ? "border-white/8 bg-zinc-900 hover:border-white/20" : "border-gray-100 bg-white hover:border-gray-200"} shadow-sm`}>
                  <img src="/manus-storage/coco-flyer_d22898ad.png" alt="COCO Crêpes, Waffles and Coffee opening flyer" className="block w-full h-auto" loading="lazy" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className={`text-lg font-black ${t.textPrimary}`}>COCO Crêpes, Waffles & Coffee</p><p className={`text-sm ${t.textMuted} mt-1`}>Coming this fall to Elyson Town Center, Cypress.</p></div>
                      <ChevronRight className={`h-5 w-5 shrink-0 ${t.textMuted} group-hover:text-[#E11D2A]`} />
                    </div>
                  </div>
                </a>
              </div>

              <div className={`mt-4 grid gap-3 sm:grid-cols-2`}>
                {[
                  { name: "180 Rodeo Rink", category: "Entertainment" },
                  { name: "Chick-fil-A", category: "Food" },
                ].map((partner) => (
                  <div key={partner.name} className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                    <div><p className={`font-bold text-sm ${t.textPrimary}`}>{partner.name}</p><p className={`text-xs ${t.textMuted} mt-1`}>Member offer details coming soon</p></div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500"}`}>{partner.category}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── TRAINING TAB ── */}
        {activeTab === "training" && (
          <div className="space-y-8">

            {/* ── Training Dashboard Header ── */}
            <div>
              <p className={`text-sm font-medium ${t.textMuted}`}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</p>
              <h1 className={`text-3xl font-black ${t.textPrimary} mt-1`}>{firstName}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-semibold ${t.textSecondary}`}>{progressStats?.beltRank ?? "No Belt"}</span>
                <span className={`text-xs ${t.textMuted}`}>•</span>
                <span className={`text-sm ${t.textSecondary}`}>{(enrollment as any)?.enrollment?.program || "Foundation"} Program</span>
              </div>
            </div>

            {/* ── Belt Progress Visual ── */}
            <div className={`rounded-2xl border p-6 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E11D2A]">
                    {progressStats?.beltRank ?? "No Belt"} → {progressStats?.nextBelt ?? "White Belt"}
                  </p>
                  <p className={`text-2xl font-black mt-1 ${t.textPrimary}`}>
                    {progressStats?.beltProgressPct ?? 0}% <span className={`text-sm font-normal ${t.textMuted}`}>to next rank</span>
                  </p>
                </div>
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke={isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6"} strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#E11D2A" strokeWidth="3"
                      strokeDasharray={`${progressStats?.beltProgressPct ?? 0}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Award className="h-5 w-5 text-[#E11D2A]" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className={`text-xl font-black ${t.textPrimary}`}>{progressStats?.totalClasses ?? 0}</p>
                  <p className={`text-xs ${t.textMuted}`}>Classes</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-black ${t.textPrimary}`}>{progressStats?.currentStreak ?? 0}</p>
                  <p className={`text-xs ${t.textMuted}`}>Day Streak</p>
                </div>
                <div className="text-center">
                  <p className={`text-xl font-black ${t.textPrimary}`}>{(progressStats as any)?.skillsRemaining ?? 4}</p>
                  <p className={`text-xs ${t.textMuted}`}>Skills Left</p>
                </div>
              </div>
            </div>

            {/* ── Next Class ── */}
            {todayClasses && todayClasses.length > 0 && (() => {
              const now = new Date();
              const nowMins = now.getHours() * 60 + now.getMinutes();
              const upcoming = todayClasses.find((cls) => {
                const [rawH, rawM] = cls.startTime.replace(/(AM|PM)/i, '').trim().split(':').map(Number);
                const isPM = /PM/i.test(cls.startTime);
                const h24 = isPM && rawH !== 12 ? rawH + 12 : (!isPM && rawH === 12 ? 0 : rawH);
                return (h24 * 60 + (rawM || 0)) > nowMins;
              });
              if (!upcoming) return null;
              return (
                <div className={`rounded-2xl border p-5 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E11D2A] mb-2">Next Class</p>
                  <h3 className={`text-lg font-black ${t.textPrimary}`}>{upcoming.program}</h3>
                  <p className={`text-sm ${t.textSecondary} mt-1`}>Today • {upcoming.startTime}</p>
                  <p className={`text-xs ${t.textMuted} mt-0.5`}>{upcoming.location || "MyDojo Tomball"}</p>
                  {upcoming.instructor && <p className={`text-xs ${t.textMuted}`}>Instructor: {upcoming.instructor}</p>}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => window.location.href = "/check-in"}
                      className="px-4 py-2 bg-[#E11D2A] text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-[#c41824] transition-colors"
                    >
                      Check In
                    </button>
                    <button className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider border ${isDark ? "border-white/15 text-white/70 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      View Class
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Quick Training Actions ── */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {[
                { label: "Schedule", icon: <Calendar className="h-5 w-5" /> },
                { label: "Curriculum", icon: <BookOpen className="h-5 w-5" /> },
                { label: "Progress", icon: <BarChart2 className="h-5 w-5" /> },
                { label: "Attendance", icon: <CheckCircle2 className="h-5 w-5" /> },
                { label: "Testing", icon: <GraduationCap className="h-5 w-5" /> },
              ].map((action, i) => (
                <button
                  key={i}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border shrink-0 transition-colors ${
                    isDark ? "border-white/8 hover:bg-white/5 text-white/60 hover:text-white" : "border-gray-100 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {action.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{action.label}</span>
                </button>
              ))}
            </div>

            {/* ── My Program ── */}
            <div>
              <h2 className={`text-xl font-black ${t.textPrimary}`}>My Program</h2>
              <div className={`mt-3 rounded-2xl border p-5 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#E11D2A]">
                      {(enrollment as any)?.enrollment?.program || "Foundation"} Program
                    </p>
                    <p className={`text-sm ${t.textSecondary} mt-1`}>
                      {((enrollment as any)?.enrollment?.program || "Foundation") === "Foundation" ? "White Uniform" :
                       ((enrollment as any)?.enrollment?.program || "Foundation") === "Black Belt" ? "Black Uniform" : "Red Uniform"}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">Active</div>
                </div>
                <div className="space-y-2 mt-4">
                  {[
                    "Unlimited classes per week",
                    "Access to all programs (Karate, Kickboxing, Self-Defense)",
                    "Belt testing eligibility",
                    "Curriculum access",
                    "Events and seminars included",
                    "Competition opportunities",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <p className={`text-xs ${t.textSecondary}`}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Belt Testing ── */}
            <div>
              <h2 className={`text-xl font-black ${t.textPrimary}`}>Belt Testing</h2>
              <div className={`mt-3 rounded-2xl border p-5 ${isDark ? "border-white/8 bg-zinc-900" : "border-gray-100 bg-white"} shadow-sm`}>
                <p className="text-xs font-bold uppercase tracking-widest text-[#E11D2A]">Next Belt Test</p>
                <p className={`text-lg font-black mt-1 ${t.textPrimary}`}>Saturday, August 15</p>
                <p className={`text-sm ${t.textMuted} mt-1`}>$49 per student • MyDojo Tomball</p>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className={`text-xs ${t.textSecondary}`}>Attendance requirement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className={`text-xs ${t.textSecondary}`}>Minimum training period</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className={`h-4 w-4 ${isDark ? "text-white/30" : "text-gray-300"}`} />
                    <span className={`text-xs ${t.textSecondary}`}>Instructor evaluation</span>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = "/belt-test-intent"}
                  className="mt-4 w-full px-4 py-3 bg-[#E11D2A] text-white text-sm font-bold rounded-xl uppercase tracking-wider hover:bg-[#c41824] transition-colors"
                >
                  Register for Belt Test
                </button>
              </div>
            </div>

            {/* ── Progress & Attendance ── */}
            <div>
              <h2 className={`text-xl font-black ${t.textPrimary} mb-3`}>Progress & Attendance</h2>
              <ProgressTab isDark={isDark} />
            </div>

            {/* ── Curriculum ── */}
            <div>
              <h2 className={`text-xl font-black ${t.textPrimary} mb-3`}>Curriculum</h2>
              <div className={`rounded-2xl border ${t.borderSubtle} ${isDark ? "" : "bg-white"} p-4`}
                style={isDark ? { background: "rgba(28,18,18,0.85)", backdropFilter: "blur(12px)" } : undefined}>
                <CurriculumViewer isDark={isDark} />
              </div>
            </div>

            {/* ── Achievements ── */}
            <div>
              <h2 className={`text-xl font-black ${t.textPrimary}`}>Achievements</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { title: "First Class", desc: "Completed your first class", earned: true },
                  { title: "5 Class Streak", desc: "Trained 5 days in a row", earned: (progressStats?.currentStreak ?? 0) >= 5 },
                  { title: "10 Classes", desc: "Attended 10 total classes", earned: (progressStats?.totalClasses ?? 0) >= 10 },
                  { title: "Belt Promotion", desc: "Earned your first belt", earned: (progressStats?.beltRank ?? "No Belt") !== "No Belt" },
                ].map((ach, i) => (
                  <div key={i} className={`rounded-xl border p-4 text-center ${
                    ach.earned
                      ? isDark ? "border-[#E11D2A]/30 bg-[#E11D2A]/5" : "border-[#E11D2A]/20 bg-red-50"
                      : isDark ? "border-white/5 bg-white/2 opacity-50" : "border-gray-100 bg-gray-50 opacity-50"
                  }`}>
                    <Trophy className={`h-6 w-6 mx-auto ${ach.earned ? "text-[#E11D2A]" : isDark ? "text-white/20" : "text-gray-300"}`} />
                    <p className={`text-xs font-bold mt-2 ${ach.earned ? t.textPrimary : t.textMuted}`}>{ach.title}</p>
                    <p className={`text-[10px] ${t.textMuted} mt-0.5`}>{ach.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}





        {/* ── LOCATE TAB ── */}
        {activeTab === "locate" && (
          <div className="space-y-6">
            <h2 className={`text-xl font-black uppercase tracking-wider ${t.textPrimary}`}>Find Us</h2>
            <div className={`rounded-2xl border ${t.borderSubtle} overflow-hidden`} style={isDark ? { background: "rgba(28,18,18,0.85)" } : { background: "#fff" }}>
              <iframe
                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=11721+Spring-Cypress+Road,Tomball,TX+77377"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="MyDojo Location"
              />
              <div className="p-6 space-y-3">
                <h3 className={`text-lg font-bold ${t.textPrimary}`}>MyDojo Headquarters — Tomball</h3>
                <p className={`text-sm ${t.textSecondary}`}>11721 Spring-Cypress Road, Tomball, TX 77377</p>
                <div className="flex gap-3 pt-2">
                  <a href="https://maps.google.com/?q=11721+Spring-Cypress+Road+Tomball+TX+77377" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#E11D2A] text-white text-sm font-bold rounded-lg">Get Directions</a>
                  <a href="tel:+18774693656" className={`px-4 py-2 border rounded-lg text-sm font-bold ${isDark ? "border-white/20 text-white" : "border-gray-300 text-gray-700"}`}>Call</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
       {activeTab === "account" && (
          <AccountTab
            isDark={isDark}
            user={user}
            selfPhotoUrl={selfPhotoUrl}
            initials={initials}
            enrollment={enrollment}
            myEnrollment={myEnrollment}
            progressStats={progressStats}
            schedules={schedules}
            setShowFreezeDialog={setShowFreezeDialog}
            setShowCancelDialog={setShowCancelDialog}
            unfreezeMutation={unfreezeMutation}
            setActiveTab={setActiveTab}
          />
       )}

       {/* ── SHOP TAB ── */}
        {activeTab === "shop" && (
          <div className="space-y-4">
            <h2 className={`text-xl font-black uppercase tracking-wider ${t.textPrimary}`}>Pro Shop</h2>
            <p className={`text-sm ${t.textSecondary}`}>Browse uniforms, sparring gear, weapons, and accessories.</p>
            <a href="/shop" className="inline-block px-6 py-3 bg-[#E11D2A] text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors">Visit Pro Shop</a>
          </div>
        )}

        {/* ── CLASS DETAIL MODAL ── */}
        {selectedClass && (() => {
          const programId = PROGRAM_TITLE_MAP[selectedClass.program];
          const programData = programs.find(p => p.id === programId);
          return (
            <div
              className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
              onClick={() => setSelectedClass(null)}
            >
              <div
                className={`w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl ${
                  isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white'
                }`}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div
                  className="relative h-36 sm:h-44 rounded-t-3xl sm:rounded-t-2xl overflow-hidden flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1a0505, #3d0a0a)' }}
                >
                  {programData?.image && (
                    <img src={programData.image} alt={selectedClass.program} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <button
                    onClick={() => setSelectedClass(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/70 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 p-5">
                    <p className="text-[10px] font-bold tracking-widest text-[#E11D2A] uppercase mb-1">
                      {selectedClass.dayOfWeek} · {selectedClass.startTime} – {selectedClass.endTime}
                    </p>
                    <h3 className="text-2xl font-black text-white leading-tight">{selectedClass.program}</h3>
                    <p className={`text-sm text-white/60 mt-0.5`}>{selectedClass.location}</p>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Check-in status or button */}
                  {selectedClass.isCheckedIn ? (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${
                      isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>
                      <CheckCircle2 className="h-5 w-5" />
                      You're checked in for this class
                    </div>
                  ) : (() => {
                    const now = new Date();
                    const nowMins = now.getHours() * 60 + now.getMinutes();
                    const [rawH, rawM] = selectedClass.startTime.replace(/(AM|PM)/i, '').trim().split(':').map(Number);
                    const isPM = /PM/i.test(selectedClass.startTime);
                    const h24 = isPM && rawH !== 12 ? rawH + 12 : (!isPM && rawH === 12 ? 0 : rawH);
                    const classMins = h24 * 60 + (rawM || 0);
                    const isPast = classMins + 60 < nowMins;
                    return isPast ? null : (
                      <button
                        onClick={() => { handleCheckIn(selectedClass.id); setSelectedClass(null); }}
                        disabled={checkingInId === selectedClass.id}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #E11D2A, #b01520)' }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Check In for This Class
                      </button>
                    );
                  })()}

                  {/* Instructor */}
                  {selectedClass.instructor && (
                    <div>
                      <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${t.textLabel}`}>Instructor</p>
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${
                        isDark ? 'bg-white/5' : 'bg-gray-50'
                      }`}>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, #E11D2A, #b01520)' }}
                        >
                          {selectedClass.instructor.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${t.textPrimary}`}>{selectedClass.instructor}</p>
                          <p className={`text-xs ${t.textMuted}`}>MyDojo Certified Instructor</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Class description */}
                  {programData && (
                    <div>
                      <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${t.textLabel}`}>About This Class</p>
                      <p className={`text-sm leading-relaxed ${t.textSecondary}`}>{programData.longDescription || programData.description}</p>
                    </div>
                  )}

                  {/* What you'll work on */}
                  {programData?.features && programData.features.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${t.textLabel}`}>What You'll Work On</p>
                      <div className="space-y-1.5">
                        {programData.features.map((f, i) => (
                          <div key={i} className={`flex items-start gap-2 text-sm ${t.textSecondary}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E11D2A] mt-1.5 shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required equipment */}
                  {programData?.equipment && programData.equipment.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${t.textLabel}`}>What to Bring</p>
                      <div className="space-y-1.5">
                        {programData.equipment.map((item, i) => (
                          <div key={i} className={`flex items-start gap-2 text-sm ${
                            isDark ? 'bg-white/4 border border-white/8' : 'bg-gray-50 border border-gray-100'
                          } rounded-lg px-3 py-2`}>
                            <Package className="h-4 w-4 text-[#E11D2A] shrink-0 mt-0.5" />
                            <span className={t.textSecondary}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {programData && (
                    <div className={`flex items-center gap-4 pt-2 border-t ${
                      isDark ? 'border-white/8' : 'border-gray-100'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Clock className={`h-4 w-4 ${t.textMuted}`} />
                        <span className={`text-xs ${t.textMuted}`}>{programData.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className={`h-4 w-4 ${t.textMuted}`} />
                        <span className={`text-xs ${t.textMuted}`}>{programData.ages}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "home" && (
          <div className="space-y-6 -mx-4 sm:-mx-6">

            {/* ── Welcome Banner (T-Life style) ── */}
            <div
              className="px-6 pt-10 pb-8 rounded-b-3xl"
              style={{ background: "linear-gradient(135deg, #E11D2A 0%, #8b0000 50%, #1a0505 100%)" }}
            >
              <p className="text-white/70 text-sm font-medium">Welcome back,</p>
              <h1 className="text-3xl font-black text-white mt-1">{firstName}</h1>
              <p className="text-white/50 text-xs mt-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* ── Event Cards (T-Life style large cards) ── */}
            <div className="px-4 sm:px-6 space-y-6">

              {/* Belt Test Card */}
              <button
                onClick={() => window.location.href = "/belt-test-intent"}
                className={`w-full rounded-2xl overflow-hidden text-left shadow-lg hover:shadow-xl transition-all ${isDark ? "bg-zinc-900" : "bg-white"} border ${isDark ? "border-white/5" : "border-gray-100"}`}
              >
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src="/manus-storage/event-belt-test_8aa85132.jpg"
                    alt="Belt testing ceremony at MyDojo"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="text-[#E11D2A] text-xs font-bold uppercase tracking-widest">Saturday, August 15 · 10:00 AM</p>
                  <h3 className={`text-xl font-black mt-2 ${t.textPrimary}`}>Belt Promotion Test</h3>
                  <p className={`text-sm mt-2 leading-relaxed ${t.textSecondary}`}>
                    Demonstrate your skills and advance to the next rank. Students will perform kata, self-defense techniques, and board breaking in front of our panel of certified instructors.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-sm font-bold ${t.textPrimary}`}>$49 per student</span>
                    <span className="text-xs font-semibold text-[#E11D2A] uppercase tracking-wider">Register Now</span>
                  </div>
                </div>
              </button>

              {/* Parents Night Out Card */}
              <button
                onClick={() => window.location.href = "/parents-night-out-aug"}
                className={`w-full rounded-2xl overflow-hidden text-left shadow-lg hover:shadow-xl transition-all ${isDark ? "bg-zinc-900" : "bg-white"} border ${isDark ? "border-white/5" : "border-gray-100"}`}
              >
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src="/manus-storage/event-parents-night-out_09a404ba.jpg"
                    alt="Kids enjoying Parents Night Out at MyDojo"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="text-purple-600 text-xs font-bold uppercase tracking-widest">Friday, August 21 · 6:00–9:30 PM</p>
                  <h3 className={`text-xl font-black mt-2 ${t.textPrimary}`}>Parents Night Out</h3>
                  <p className={`text-sm mt-2 leading-relaxed ${t.textSecondary}`}>
                    Enjoy a well-deserved evening off while your kids have a blast at the dojo. Activities include martial arts games, obstacle courses, movie time, and pizza. Supervised by our certified instructors.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-sm font-bold ${t.textPrimary}`}>Free for members</span>
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">RSVP Now</span>
                  </div>
                </div>
              </button>

              {/* Master Yaeger Seminar Card */}
              <button
                onClick={() => window.location.href = "/master-yaeger-seminar"}
                className={`w-full rounded-2xl overflow-hidden text-left shadow-lg hover:shadow-xl transition-all ${isDark ? "bg-zinc-900" : "bg-white"} border ${isDark ? "border-white/5" : "border-gray-100"}`}
              >
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src="/manus-storage/event-yaeger-seminar_f56403cb.jpg"
                    alt="Master Yaeger demonstrating advanced techniques"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-widest">Saturday, August 22 · 11:00 AM–2:00 PM</p>
                  <h3 className={`text-xl font-black mt-2 ${t.textPrimary}`}>Master Yaeger Seminar</h3>
                  <p className={`text-sm mt-2 leading-relaxed ${t.textSecondary}`}>
                    A rare opportunity to train with Master Yaeger, a world-renowned martial arts expert. This intensive seminar covers advanced striking combinations, grappling transitions, and competition strategy for all skill levels.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-sm font-bold ${t.textPrimary}`}>$29 registration</span>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Reserve Your Spot</span>
                  </div>
                </div>
              </button>

              {/* Summer Schedule Update */}
              <div className={`rounded-2xl p-5 border ${isDark ? "border-white/8 bg-white/3" : "border-gray-100 bg-white"} shadow-sm`}>
                <p className="text-green-600 text-xs font-bold uppercase tracking-widest">Schedule Update</p>
                <h4 className={`text-base font-bold mt-1 ${t.textPrimary}`}>New Summer Schedule Active</h4>
                <p className={`text-sm ${t.textMuted} mt-1 leading-relaxed`}>After School and Summer Camp programs are now running daily. Check the schedule tab for updated class times.</p>
              </div>
            </div>

            {/* ── Today's Classes ── */}
            <div className="px-4 sm:px-6">
            {/* Today's Date Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-[#E11D2A] uppercase">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h2 className={`text-2xl font-black mt-0.5 ${t.textPrimary}`}>Today's Classes</h2>
              </div>
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                isDark ? 'border-white/10 text-white/50' : 'border-gray-200 text-gray-500'
              }`}>
                {todayClasses?.length ?? 0} class{(todayClasses?.length ?? 0) !== 1 ? 'es' : ''} scheduled
              </div>
            </div>

            {/* Classes List */}
            {todayClassesLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 rounded-full border-4 border-[#E11D2A] border-t-transparent animate-spin" />
              </div>
            ) : !todayClasses || todayClasses.length === 0 ? (
              <div className={`rounded-2xl border p-12 text-center ${
                isDark ? 'border-white/8 bg-white/3' : 'border-gray-200 bg-white'
              }`}>
                <Calendar className={`h-12 w-12 mx-auto mb-4 ${
                  isDark ? 'text-white/20' : 'text-gray-300'
                }`} />
                <p className={`font-bold text-lg mb-1 ${t.textPrimary}`}>No Classes Today</p>
                <p className={`text-sm ${t.textMuted}`}>There are no classes scheduled for today. See you next time!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls) => {
                  const now = new Date();
                  const nowMins = now.getHours() * 60 + now.getMinutes();
                  const [rawH, rawM] = cls.startTime.replace(/(AM|PM)/i, '').trim().split(':').map(Number);
                  const isPM = /PM/i.test(cls.startTime);
                  const h24 = isPM && rawH !== 12 ? rawH + 12 : (!isPM && rawH === 12 ? 0 : rawH);
                  const classMins = h24 * 60 + (rawM || 0);
                  const isPast = classMins + 60 < nowMins;

                  return (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`w-full rounded-2xl border p-5 flex items-center gap-4 transition-all text-left cursor-pointer ${
                        cls.isCheckedIn
                          ? isDark ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10' : 'border-green-200 bg-green-50 hover:bg-green-100'
                          : isPast
                          ? isDark ? 'border-white/5 bg-white/2 opacity-50' : 'border-gray-100 bg-gray-50 opacity-60'
                          : isDark ? 'border-white/10 bg-white/4 hover:bg-white/8' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {/* Time column */}
                      <div className="shrink-0 text-center min-w-[56px]">
                        <p className={`text-lg font-black leading-none ${
                          cls.isCheckedIn ? 'text-green-500' : isPast ? t.textMuted : 'text-[#E11D2A]'
                        }`}>{cls.startTime.replace(':00', '').replace(' ', '')}</p>
                        <p className={`text-xs mt-0.5 ${t.textMuted}`}>{cls.endTime.replace(':00', '').replace(' ', '')}</p>
                      </div>

                      {/* Divider */}
                      <div className={`w-px self-stretch ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                      {/* Class info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-base leading-tight ${t.textPrimary}`}>{cls.program}</p>
                        <div className={`flex items-center gap-3 mt-1 text-xs ${t.textMuted}`}>
                          {cls.instructor && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />{cls.instructor}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{cls.location}
                          </span>
                        </div>
                      </div>

                      {/* Right side: check-in badge or arrow */}
                      <div className="shrink-0 flex items-center gap-2">
                        {cls.isCheckedIn ? (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                            isDark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-700'
                          }`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Checked In
                          </div>
                        ) : isPast ? (
                          <span className={`text-xs ${t.textMuted}`}>Ended</span>
                        ) : (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            isDark ? 'border-white/10 text-white/50' : 'border-gray-200 text-gray-500'
                          }`}>
                            Tap for details
                          </div>
                        )}
                        <ChevronRight className={`h-4 w-4 shrink-0 ${t.textMuted}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            </div>

            {/* Hidden original dashboard rows — kept for reference only */}
            {/* Row 1: Welcome + Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ display: 'none' }}>
              <Card className="lg:col-span-1 p-6 flex flex-col items-center text-center gap-4" isDark={isDark}>
                <p className="text-xs font-bold tracking-widest text-[#E11D2A] uppercase">Welcome Back</p>
                <h2 className={`text-2xl font-black leading-tight ${t.textPrimary}`}>{firstName.toUpperCase()}!</h2>
                <p className={`${t.textSecondary} text-sm`}>Ready for your next lesson?</p>
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white"
                    style={{ background: "linear-gradient(135deg, #E11D2A, #b01520)", boxShadow: "0 4px 20px rgba(225,29,42,0.3)" }}
                  >
                    {initials}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 ${isDark ? "border-black" : "border-white"} flex items-center justify-center`}>
                    <Star className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="w-full">
                  <div className={`flex justify-between text-xs ${t.textMuted} mb-1`}>
                    <span>Level 4</span><span>720 / 1000 XP</span>
                  </div>
                  <div className={`h-2 rounded-full ${t.trackBg} overflow-hidden`}>
                    <div className="h-full rounded-full" style={{ width: "72%", background: "linear-gradient(90deg, #E11D2A, #ff6b35)" }} />
                  </div>
                </div>
                <div className="w-full space-y-2 mt-2">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #E11D2A, #b01520)" }}
                  >
                    Resume Course <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm border transition-all ${isDark ? "text-white/80 border-white/15 bg-white/5 hover:bg-white/10" : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50"}`}
                    onClick={() => (window.location.href = "/check-in")}
                  >
                    Check In for Class <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm border transition-all ${isDark ? "text-white/80 border-white/15 bg-white/5 hover:bg-white/10" : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50"}`}
                    onClick={() => setActiveTab("training")}
                  >
                    View Schedule <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </Card>

              {/* Hero / Current Lesson */}
              <div className="lg:col-span-3 overflow-hidden relative min-h-[320px] rounded-2xl shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&auto=format&fit=crop&q=80"
                  alt="Karate Training"
                  className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
                <div className="relative z-10 p-8 flex flex-col justify-end h-full min-h-[320px]">
                  <p className="text-xs font-bold tracking-widest text-[#E11D2A] uppercase mb-2">Current Lesson</p>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-1">Karate Basics: Kicks & Strikes</h2>
                  <p className="text-white/60 mb-6">Sensei Tanaka</p>
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white w-fit transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #E11D2A, #b01520)" }}
                  >
                    Continue Lesson <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                {nextClass && (
                  <div className="absolute top-4 right-4 z-10 rounded-xl border border-white/20 bg-black/70 backdrop-blur p-4 max-w-[200px]">
                    <p className="text-[10px] font-bold tracking-widest text-[#E11D2A] uppercase mb-1">Next Class</p>
                    <p className="text-sm font-bold text-white leading-tight">{nextClass.program}</p>
                    <p className="text-xs text-white/50 mt-1">{nextClass.day} · {nextClass.startTime}</p>
                    <button className="mt-2 text-xs font-semibold text-[#E11D2A] hover:underline">Set Reminder</button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Progress + Achievements + Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6" isDark={isDark}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textLabel}`}>Your Progress</h3>
                  <TrendingUp className="h-4 w-4 text-[#E11D2A]" />
                </div>
                {(() => {
                  const pct = progressStats?.beltProgressPct ?? 0;
                  const attended = progressStats?.classesAtCurrentBelt ?? 0;
                  const required = progressStats?.classesRequired ?? 16;
                  const currentBelt = progressStats?.beltRank ?? enrollment?.enrollment?.beltRank ?? 'No Belt';
                  const next = progressStats?.nextBelt ?? 'Next Belt';
                  const qualifies = progressStats?.qualifiesForTest ?? false;
                  const beltCol = BELT_COLORS[currentBelt] ?? '#9ca3af';
                  return (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <ProgressRing pct={pct} size={120} stroke={10} isDark={isDark} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-[#E11D2A]">{pct}%</span>
                          <span className={`text-xs ${t.textMuted}`}>Complete</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <div className={`flex justify-between text-xs ${t.textMuted} mb-1`}>
                          <span style={{ color: beltCol }}>{currentBelt}</span>
                          <span>{next}</span>
                        </div>
                        <div className={`h-2 rounded-full ${t.trackBg} overflow-hidden`}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${beltCol}, #f97316)`, transition: 'width 0.8s ease' }}
                          />
                        </div>
                        <p className={`text-xs ${t.textMuted} mt-1 text-center`}>
                          {attended} / {required} classes to test
                        </p>
                      </div>
                      {qualifies ? (
                        <div className="w-full text-center py-2 rounded-xl bg-green-500/10 border border-green-500/30">
                          <span className="text-xs font-bold text-green-500">✓ Eligible for Belt Test!</span>
                        </div>
                      ) : (
                        <button
                          className="text-xs text-[#E11D2A] hover:underline flex items-center gap-1 font-semibold"
                          onClick={() => setActiveTab('training')}
                        >
                          {required - attended} more class{required - attended !== 1 ? 'es' : ''} to qualify <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </Card>

              <Card className="p-6" isDark={isDark}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textLabel}`}>Achievements</h3>
                  <Trophy className="h-4 w-4 text-[#E11D2A]" />
                </div>
                <div className="space-y-3">
                  {achievements.map((a, i) => (
                    <div key={i} className={`flex items-center gap-3 ${a.unlocked ? "" : "opacity-40"}`}>
                      {a.unlocked ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <Lock className={`h-5 w-5 shrink-0 ${isDark ? "text-white/30" : "text-gray-300"}`} />
                      )}
                      <span className={`text-sm leading-tight ${isDark ? "text-white/80" : "text-gray-700"}`}>{a.label}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={`mt-4 w-full text-xs font-semibold border rounded-lg py-2 transition-colors flex items-center justify-center gap-1 ${isDark ? "text-white/50 border-white/10 hover:bg-white/5" : "text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                  onClick={() => setActiveTab("training")}
                >
                  View Curriculum <ChevronRight className="h-3 w-3" />
                </button>
              </Card>

              <Card className="p-6" isDark={isDark}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textLabel}`}>Quick Actions</h3>
                  <Zap className="h-4 w-4 text-[#E11D2A]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((qa, i) => (
                    <button
                      key={i}
                      onClick={qa.onClick}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group ${t.qaCard}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-[#E11D2A] ${t.qaIcon}`}>
                        {qa.icon}
                      </div>
                      <span className={`text-xs font-semibold text-center leading-tight ${t.qaText}`}>{qa.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Row 3: Goals + Announcements + Messages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6" isDark={isDark}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textLabel}`}>Goals</h3>
                  <Target className="h-4 w-4 text-[#E11D2A]" />
                </div>
                <div className="space-y-4">
                  {goals.map((g, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        {g.done ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className={`h-4 w-4 shrink-0 ${isDark ? "text-white/30" : "text-gray-300"}`} />
                        )}
                        <span className={`text-sm flex-1 ${isDark ? "text-white/80" : "text-gray-700"}`}>{g.label}</span>
                        <span className={`text-xs ${t.textMuted}`}>{g.current}/{g.total}</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${t.trackBg} overflow-hidden ml-6`}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(g.current / g.total) * 100}%`, background: g.done ? "#22c55e" : "linear-gradient(90deg, #E11D2A, #ff6b35)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6" isDark={isDark}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textLabel}`}>Announcements</h3>
                  <div className="w-2 h-2 rounded-full bg-[#E11D2A] animate-pulse" />
                </div>
                <div className="space-y-3">
                  {["Dojo Tournament This Weekend!", "New Training Videos Added"].map((msg, i) => (
                    <button
                      key={i}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left group border ${t.announcementRow}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#E11D2A] shrink-0" />
                      <span className={`text-sm flex-1 ${isDark ? "text-white/80" : "text-gray-700"}`}>{msg}</span>
                      <ChevronRight className={`h-4 w-4 transition-colors ${t.announcementChevron}`} />
                    </button>
                  ))}
                </div>
                <button className="mt-3 text-xs text-[#E11D2A] hover:underline flex items-center gap-1 font-semibold">
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </Card>

              <Card className="p-6" isDark={isDark}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textLabel}`}>Latest Messages</h3>
                  <MessageCircle className="h-4 w-4 text-[#E11D2A]" />
                </div>
                <div className="space-y-3">
                  {[
                    { initials: "ST", name: "Sensei Tanaka", msg: "Great job on your last class!", bg: "bg-red-100", color: "text-[#E11D2A]" },
                    { initials: "ES", name: "Emily S.", msg: "Are you coming to practice tomorrow?", bg: isDark ? "bg-white/10" : "bg-gray-100", color: isDark ? "text-white/70" : "text-gray-600" },
                  ].map((m, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full ${m.bg} flex items-center justify-center text-xs font-bold shrink-0 ${m.color}`}>
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${t.textPrimary}`}>{m.name}</p>
                        <p className={`text-xs ${t.textMuted} truncate`}>{m.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #E11D2A, #b01520)" }}
                  onClick={() => setActiveTab("home")}
                >
                  Go to Inbox <ChevronRight className="h-4 w-4" />
                </button>
              </Card>
            </div>

            {/* Row 4: Membership Management */}
            {myEnrollment && (
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textMuted} mb-4`}>Membership Management</h3>
                <div className={`rounded-2xl border p-6 ${isDark ? 'border-white/8 bg-white/5' : 'border-gray-200 bg-white'}`}>
                  {/* Status Banner */}
                  {myEnrollment.isFrozen ? (
                    <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <Snowflake className="h-5 w-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-blue-800 text-sm">Membership Frozen</p>
                        <p className="text-xs text-blue-600">
                          Freeze period: {myEnrollment.freezeStartDate ? new Date(myEnrollment.freezeStartDate).toLocaleDateString() : ''}
                          {' – '}{myEnrollment.freezeEndDate ? new Date(myEnrollment.freezeEndDate).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  ) : myEnrollment.cancellationRequestedAt ? (
                    <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-800 text-sm">Cancellation Pending</p>
                        <p className="text-xs text-amber-600">
                          Final billing date: {myEnrollment.cancellationEffectiveDate ? new Date(myEnrollment.cancellationEffectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Processing'}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Freeze */}
                    {!myEnrollment.cancellationRequestedAt && (
                      myEnrollment.isFrozen ? (
                        <button
                          onClick={() => myEnrollment.id && unfreezeMutation.mutate({ enrollmentId: myEnrollment.id })}
                          disabled={unfreezeMutation.isPending}
                          className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                        >
                          <Snowflake className="h-5 w-5 text-blue-500 shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-800 text-sm">Unfreeze Membership</p>
                            <p className="text-xs text-blue-600">Resume your membership now</p>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowFreezeDialog(true)}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
                            isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <PauseCircle className="h-5 w-5 text-blue-500 shrink-0" />
                          <div>
                            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Freeze Membership</p>
                            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Pause billing for summer break or travel</p>
                          </div>
                        </button>
                      )
                    )}

                    {/* Add Family Member to Kickboxing */}
                    <button
                      onClick={() => {
                        setKickboxingStep("info");
                        setKickboxingMemberName("");
                        setKickboxingMemberEmail("");
                        setKickboxingMemberPhone("");
                        setKickboxingTokenizerReady(false);
                        kickboxingTokenizerInitRef.current = false;
                        kickboxingTokenizerRef.current = null;
                        setShowAddKickboxingDialog(true);
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
                        isDark ? 'border-orange-900/40 hover:bg-orange-950/20' : 'border-orange-100 hover:bg-orange-50'
                      }`}
                    >
                      <Users className="h-5 w-5 text-orange-500 shrink-0" />
                      <div>
                        <p className={`font-semibold text-sm ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Add Family Member to Kickboxing</p>
                        <p className={`text-xs ${isDark ? 'text-orange-400/60' : 'text-orange-500'}`}>$49/month — discounted family rate</p>
                      </div>
                    </button>

                    {/* Cancel */}
                    {!myEnrollment.cancellationRequestedAt && (
                      <button
                        onClick={() => setShowCancelDialog(true)}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${
                          isDark ? 'border-red-900/40 hover:bg-red-950/30' : 'border-red-100 hover:bg-red-50'
                        }`}
                      >
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>Request Cancellation</p>
                          <p className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-500'}`}>30-day notice required. One final payment will be charged.</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Add Family Member to Kickboxing Dialog ── */}
            {showAddKickboxingDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white'}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Family Member to Kickboxing</h3>
                        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Discounted family rate: $49/month</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAddKickboxingDialog(false)} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-gray-100 text-gray-400'}`}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-6">
                    {/* Step: Info */}
                    {kickboxingStep === "info" && (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-orange-950/30 border border-orange-800/30' : 'bg-orange-50 border border-orange-200'}`}>
                          <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>Family Kickboxing Add-On</p>
                          <p className={`text-xs ${isDark ? 'text-orange-400/80' : 'text-orange-700'}`}>
                            Add a family member to our kickboxing program at the exclusive family rate of $49/month (regular price $99/month). First month billed today, then monthly on the same date.
                          </p>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Member's Full Name *</label>
                          <input
                            type="text"
                            value={kickboxingMemberName}
                            onChange={(e) => setKickboxingMemberName(e.target.value)}
                            placeholder="Jane Doe"
                            className={`w-full rounded-xl border px-4 py-3 text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'border-gray-200 text-gray-900'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Member's Email *</label>
                          <input
                            type="email"
                            value={kickboxingMemberEmail}
                            onChange={(e) => setKickboxingMemberEmail(e.target.value)}
                            placeholder="jane@example.com"
                            className={`w-full rounded-xl border px-4 py-3 text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'border-gray-200 text-gray-900'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Member's Phone (optional)</label>
                          <input
                            type="tel"
                            value={kickboxingMemberPhone}
                            onChange={(e) => setKickboxingMemberPhone(e.target.value)}
                            placeholder="(555) 000-0000"
                            className={`w-full rounded-xl border px-4 py-3 text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'border-gray-200 text-gray-900'}`}
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setShowAddKickboxingDialog(false)}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm border ${isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (!kickboxingMemberName.trim() || !kickboxingMemberEmail.trim()) {
                                alert("Please fill in the required fields.");
                                return;
                              }
                              setKickboxingStep("payment");
                            }}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            Continue to Payment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step: Payment */}
                    {kickboxingStep === "payment" && (
                      <div className="space-y-4">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                          <p className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Adding: <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kickboxingMemberName}</span></p>
                          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{kickboxingMemberEmail}</p>
                        </div>
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-green-950/30 border border-green-800/30' : 'bg-green-50 border border-green-200'}`}>
                          <p className={`text-sm font-bold ${isDark ? 'text-green-300' : 'text-green-800'}`}>$49.00 billed today</p>
                          <p className={`text-xs ${isDark ? 'text-green-400/80' : 'text-green-700'}`}>Then $49/month recurring on the same date each month. Cancel anytime.</p>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Card Details</label>
                          <div id="kickboxing-tokenizer-container" className={`rounded-xl border min-h-[80px] ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`} />
                          {!kickboxingTokenizerReady && (
                            <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Loading secure payment form...</p>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Secured by FluidPay — your card data is encrypted and never stored on our servers.
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setKickboxingStep("info")}
                            className={`flex-1 py-3 rounded-xl font-semibold text-sm border ${isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            Back
                          </button>
                          <button
                            disabled={kickboxingIsSubmitting || !kickboxingTokenizerReady}
                            onClick={() => {
                              if (!kickboxingTokenizerRef.current) return;
                              setKickboxingIsSubmitting(true);
                              kickboxingTokenizerRef.current.submit();
                            }}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {kickboxingIsSubmitting ? "Processing..." : "Pay $49.00"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step: Success */}
                    {kickboxingStep === "success" && (
                      <div className="text-center py-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                          <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                          <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome to Kickboxing!</h4>
                          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                            <strong>{kickboxingMemberName}</strong> has been added to the kickboxing program at $49/month. A confirmation will be sent to {kickboxingMemberEmail}.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddKickboxingDialog(false)}
                          className="w-full py-3 rounded-xl font-semibold text-sm bg-green-500 hover:bg-green-600 text-white"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Cancel Dialog ── */}
            {showCancelDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
                  isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <XCircle className="h-6 w-6 text-red-500" />
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Request Cancellation</h3>
                  </div>
                  <div className={`p-4 rounded-xl mb-4 ${
                    isDark ? 'bg-amber-950/40 border border-amber-800/40' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>30-Day Notice Policy</p>
                    <p className={`text-xs ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
                      Your membership will remain active for 30 days after this request. One final monthly payment will be charged on your next billing date. No further charges after that.
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      Reason for cancellation (optional)
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      placeholder="Moving, schedule change, financial reasons..."
                      className={`w-full rounded-xl border px-4 py-3 text-sm resize-none ${
                        isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelDialog(false)}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm border ${
                        isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Keep Membership
                    </button>
                    <button
                      onClick={() => myEnrollment?.id && requestCancellationMutation.mutate({ enrollmentId: myEnrollment.id, reason: cancelReason || undefined })}
                      disabled={requestCancellationMutation.isPending}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {requestCancellationMutation.isPending ? 'Submitting...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Freeze Dialog ── */}
            {showFreezeDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
                  isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Snowflake className="h-6 w-6 text-blue-500" />
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Freeze Membership</h3>
                  </div>
                  <div className={`p-4 rounded-xl mb-4 ${
                    isDark ? 'bg-blue-950/40 border border-blue-800/40' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      Pause your membership for 1–3 months. No billing during the freeze. Minimum 7 days notice before start date.
                    </p>
                  </div>
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Freeze Start Date</label>
                      <input
                        type="date"
                        value={freezeStartDate}
                        onChange={(e) => setFreezeStartDate(e.target.value)}
                        min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className={`w-full rounded-xl border px-4 py-3 text-sm ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Freeze End Date</label>
                      <input
                        type="date"
                        value={freezeEndDate}
                        onChange={(e) => setFreezeEndDate(e.target.value)}
                        min={freezeStartDate || new Date().toISOString().split('T')[0]}
                        className={`w-full rounded-xl border px-4 py-3 text-sm ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Reason (optional)</label>
                      <input
                        type="text"
                        value={freezeReason}
                        onChange={(e) => setFreezeReason(e.target.value)}
                        placeholder="Summer break, travel, medical..."
                        className={`w-full rounded-xl border px-4 py-3 text-sm ${
                          isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFreezeDialog(false)}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm border ${
                        isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => myEnrollment?.id && freezeStartDate && freezeEndDate && freezeMutation.mutate({
                        enrollmentId: myEnrollment.id,
                        freezeStartDate,
                        freezeEndDate,
                        reason: freezeReason || undefined,
                      })}
                      disabled={freezeMutation.isPending || !freezeStartDate || !freezeEndDate}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {freezeMutation.isPending ? 'Submitting...' : 'Request Freeze'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Row 5: Payment History */}
            <PaymentHistorySection isDark={isDark} />

            {/* Row 6: Training Resources */}
            <div>
              <h3 className={`font-bold text-sm uppercase tracking-wider ${t.textMuted} mb-4`}>Training Resources</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {resources.map((r, i) => (
                  <button
                    key={i}
                    className={`group flex flex-col items-center gap-3 p-5 rounded-2xl border hover:-translate-y-1 transition-all duration-200 ${t.resourceCard}`}
                  >
                    <div className={`w-14 h-14 rounded-xl ${r.bg} flex items-center justify-center ${r.iconColor} shadow-sm group-hover:scale-110 transition-transform`}>
                      {r.icon}
                    </div>
                    <span className={`text-xs font-semibold text-center leading-tight transition-colors ${t.resourceText}`}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Tab Bar (always visible — T-Life style) ── */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t flex items-stretch ${
          isDark
            ? "border-white/10 bg-black/90 backdrop-blur-xl"
            : "border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {([
          { id: "home", label: "Home", Icon: HomeIcon },
          { id: "benefits", label: "Benefits", Icon: Star },
          { id: "training", label: "Training", Icon: Award },
          { id: "locate", label: "Locate", Icon: MapPin },
          { id: "shop", label: "Shop", Icon: ShoppingBag },
          { id: "account", label: "Account", Icon: UserIcon },
        ] as const).map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors relative ${
                isActive
                  ? "text-[#E11D2A]"
                  : isDark
                  ? "text-white/40 hover:text-white/70"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E11D2A] rounded-full" />
              )}
              <div className="relative">
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide leading-none`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
