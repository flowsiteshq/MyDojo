import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  GraduationCap,
  Info,
  Target,
} from "lucide-react";

const BELTS = [
  "No Belt",
  "White Belt",
  "Yellow Belt",
  "Orange Belt",
  "Green Belt",
  "Advanced Green",
  "Blue Belt",
  "Advanced Blue",
  "Purple Belt",
  "Advanced Purple",
  "Brown Belt",
  "Advanced Brown",
  "Probationary Black",
  "Black Belt 1st Dan",
];

const BELT_COLORS: Record<string, string> = {
  "No Belt": "#9ca3af",
  "White Belt": "#e5e7eb",
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
};

const STRIPE_COLORS = [
  { name: "White", color: "#f3f4f6", text: "text-slate-700" },
  { name: "Yellow", color: "#fbbf24", text: "text-amber-950" },
  { name: "Red", color: "#ef4444", text: "text-white" },
  { name: "Black", color: "#1f2937", text: "text-white" },
];

type BeltJourneyPageProps = {
  isDark: boolean;
  onBack: () => void;
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function surface(isDark: boolean) {
  return isDark ? "border-white/10 bg-zinc-900/80" : "border-slate-200 bg-white shadow-sm";
}

export default function BeltJourneyPage({ isDark, onBack }: BeltJourneyPageProps) {
  const { data: stats, isLoading: statsLoading } = trpc.member.getProgressStats.useQuery();
  const { data: curriculum } = trpc.curriculum.getAccessibleContent.useQuery();
  const { data: skillProgress } = trpc.curriculum.getMyProgress.useQuery();

  const textPrimary = isDark ? "text-white" : "text-slate-950";
  const textSecondary = isDark ? "text-white/65" : "text-slate-600";
  const textMuted = isDark ? "text-white/40" : "text-slate-500";
  const currentBelt = stats?.beltRank ?? "No Belt";
  const currentIndex = Math.max(0, BELTS.indexOf(currentBelt));
  const nextBelt = stats?.nextBelt ?? BELTS[currentIndex + 1] ?? null;
  const classesAtBelt = Number(stats?.classesAtCurrentBelt ?? 0);
  const classesRequired = Number(stats?.classesRequired ?? 0);
  const remaining = Math.max(0, classesRequired - classesAtBelt);
  const beltProgress = Math.min(100, Number(stats?.beltProgressPct ?? 0));
  const weekly = (stats?.weeklyAttendance ?? []) as Array<{ count: number }>;
  const recentWeeks = weekly.slice(-8);
  const averageWeekly = recentWeeks.length ? recentWeeks.reduce((sum, item) => sum + Number(item.count || 0), 0) / recentWeeks.length : 0;
  const hasCurriculum = Boolean(curriculum?.content?.length);
  const currentSkills = (curriculum?.content ?? []).filter((item: any) => item.beltRank === currentBelt);
  const completedSkillIds = new Set((skillProgress ?? []).filter((item: any) => item.status === "completed").map((item: any) => item.curriculumContentId));
  const completedSkills = currentSkills.filter((item: any) => completedSkillIds.has(item.id)).length;
  const daysToNext = averageWeekly > 0 && remaining > 0 ? Math.ceil((remaining / averageWeekly) * 7) : null;
  const nextEstimate = daysToNext ? new Date(Date.now() + daysToNext * 86400000) : null;
  const blackBeltIndex = BELTS.indexOf("Black Belt 1st Dan");
  const blackBeltRemaining = Math.max(0, blackBeltIndex - currentIndex);
  const blackBeltEstimateAvailable = false;

  if (statsLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E11D2A] border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className={`mb-4 inline-flex items-center gap-2 text-sm font-bold ${textSecondary} hover:text-[#E11D2A]`}><ArrowLeft className="h-4 w-4" /> Back to training</button>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#E11D2A]">MyDojo Training</p>
          <h1 className={`mt-1 text-4xl font-black tracking-tight ${textPrimary}`}>My Belt Journey</h1>
          <p className={`mt-2 max-w-2xl text-sm ${textSecondary}`}>A clear view of your current rank, earned stripes, training pace, and the milestones ahead.</p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${surface(isDark)}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Current rank</p>
          <div className="mt-2 flex items-center gap-2"><span className="h-4 w-4 rounded-full border border-black/10" style={{ background: BELT_COLORS[currentBelt] }} /><span className={`font-black ${textPrimary}`}>{currentBelt}</span></div>
        </div>
      </div>

      <section className={`rounded-3xl border p-5 sm:p-7 ${surface(isDark)}`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-widest text-[#E11D2A]">Current belt</p><h2 className={`mt-2 text-3xl font-black ${textPrimary}`}>{currentBelt}</h2><p className={`mt-1 text-sm ${textSecondary}`}>{nextBelt ? `Working toward ${nextBelt}` : "Top rank recorded"}</p></div>
          <div className="text-right"><p className={`text-xs ${textMuted}`}>Estimated next promotion</p><p className={`mt-1 text-lg font-black ${textPrimary}`}>{nextEstimate ? formatDate(nextEstimate) : "Estimate unavailable"}</p><p className={`mt-1 text-xs ${textMuted}`}>{nextEstimate ? "Based on recent attendance; instructor approval remains required." : "More verified training or curriculum requirements are needed."}</p></div>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div><div className="mb-2 flex items-center justify-between text-sm"><span className={`font-bold ${textPrimary}`}>Progress to next rank</span><span className="font-black text-[#E11D2A]">{beltProgress}%</span></div><div className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}><div className="h-full rounded-full bg-[#E11D2A] transition-all" style={{ width: `${beltProgress}%` }} /></div><div className={`mt-2 flex justify-between text-xs ${textMuted}`}><span>{classesAtBelt} classes completed</span><span>{remaining ? `${remaining} classes remaining` : "Requirement complete"}</span></div></div>
          <div className={`rounded-2xl border px-5 py-4 text-center ${isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}><p className={`text-2xl font-black ${textPrimary}`}>{completedSkills}/{currentSkills.length || "—"}</p><p className={`text-xs ${textMuted}`}>Required skills verified</p></div>
        </div>
        <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${isDark ? "border-amber-400/20 bg-amber-400/10" : "border-amber-200 bg-amber-50"}`}><Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><p className={`text-sm ${isDark ? "text-amber-100/80" : "text-amber-900"}`}>{hasCurriculum ? "Skill completion is based on the published MyDojo curriculum. Instructor evaluation is still required before promotion." : "Required curriculum milestones are not fully configured for this rank, so promotion-date estimates may be unavailable."}</p></div>
      </section>

      <section className={`rounded-3xl border p-5 sm:p-7 ${surface(isDark)}`}>
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-[#E11D2A]">Road to Black Belt</p><h2 className={`mt-1 text-2xl font-black ${textPrimary}`}>Your journey at a glance</h2></div><div className={`text-right text-xs ${textMuted}`}>{blackBeltEstimateAvailable ? "Estimated black belt date available" : "Estimated black belt date unavailable"}</div></div>
        <div className="mt-7 overflow-x-auto pb-3"><div className="flex min-w-[980px] items-start">{BELTS.slice(0, blackBeltIndex + 1).map((belt, index) => { const complete = index < currentIndex; const current = index === currentIndex; const color = BELT_COLORS[belt]; return <div key={belt} className="relative flex w-[115px] shrink-0 flex-col items-center text-center"><div className="absolute left-1/2 top-5 h-1 w-full -translate-y-1/2" style={{ background: index === 0 ? "transparent" : index <= currentIndex ? "#E11D2A" : isDark ? "rgba(255,255,255,.12)" : "#e2e8f0" }} /><div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 ${current ? "border-[#E11D2A] shadow-[0_0_0_5px_rgba(225,29,42,.12)]" : isDark ? "border-zinc-950" : "border-white"}`} style={{ background: color }}>{complete ? <CheckCircle2 className="h-5 w-5 text-white drop-shadow" /> : current ? <Target className="h-5 w-5 text-white drop-shadow" /> : <Circle className="h-4 w-4 text-black/20" />}</div><p className={`mt-3 text-xs font-black ${current ? "text-[#E11D2A]" : textPrimary}`}>{belt}</p><p className={`mt-1 text-[10px] ${textMuted}`}>{complete ? "Completed" : current ? "Current" : "Upcoming"}</p></div>; })}</div></div>
        <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}><Award className="mt-0.5 h-5 w-5 shrink-0 text-[#E11D2A]" /><div><p className={`font-bold ${textPrimary}`}>Estimated black belt date</p><p className={`mt-1 text-sm ${textSecondary}`}>Estimate unavailable. The current data does not include verified minimum time-in-rank and instructor-evaluation requirements for every future belt.</p><p className={`mt-2 text-xs ${textMuted}`}>{blackBeltRemaining} rank milestone{blackBeltRemaining === 1 ? "" : "s"} remaining before Black Belt 1st Dan.</p></div></div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className={`rounded-3xl border p-5 sm:p-7 ${surface(isDark)}`}><div className="flex items-center gap-3"><div className="rounded-xl bg-[#E11D2A]/10 p-2.5"><Award className="h-5 w-5 text-[#E11D2A]" /></div><div><p className="text-xs font-black uppercase tracking-widest text-[#E11D2A]">Stripe progress</p><h2 className={`mt-1 text-xl font-black ${textPrimary}`}>{stats?.stripesInPhase ?? 0} of {stats?.stripesPerPhase ?? 4} current stripes earned</h2></div></div><div className="mt-6 grid grid-cols-4 gap-3">{STRIPE_COLORS.map((stripe, index) => { const earned = index < Number(stats?.stripesInPhase ?? 0); return <div key={stripe.name} className="text-center"><div className={`mx-auto flex h-14 w-full max-w-[90px] items-center justify-center rounded-xl border-2 ${earned ? "border-transparent" : isDark ? "border-white/15 bg-white/5" : "border-slate-200 bg-slate-50"}`} style={earned ? { background: stripe.color } : undefined}>{earned ? <CheckCircle2 className={`h-6 w-6 ${stripe.text}`} /> : <Circle className={`h-5 w-5 ${textMuted}`} />}</div><p className={`mt-2 text-xs font-bold ${textPrimary}`}>{stripe.name}</p></div>; })}</div><p className={`mt-5 text-sm ${textSecondary}`}>MyDojo&apos;s stripe cycle is four White, four Yellow, four Red, then four Black stripes. Earned stripes are read-only here and can only be recorded by authorized instructors.</p></section>
        <section className={`rounded-3xl border p-5 sm:p-7 ${surface(isDark)}`}><div className="flex items-center gap-3"><GraduationCap className="h-5 w-5 text-[#E11D2A]" /><div><p className="text-xs font-black uppercase tracking-widest text-[#E11D2A]">Intent to Promote</p><h2 className={`mt-1 text-xl font-black ${textPrimary}`}>Prepare for {nextBelt ?? "your next rank"}</h2></div></div><p className={`mt-4 text-sm ${textSecondary}`}>Promotion requires the applicable curriculum, instructor evaluation, and any scheduled testing requirements. Your existing Intent to Promote workflow remains the source of truth.</p><div className="mt-5 space-y-2 text-sm"><div className="flex items-center justify-between"><span className={textSecondary}>Eligibility</span><span className={`font-bold ${stats?.qualifiesForTest ? "text-emerald-500" : textPrimary}`}>{stats?.qualifiesForTest ? "Ready for review" : "In progress"}</span></div><div className="flex items-center justify-between"><span className={textSecondary}>Instructor approval</span><span className={`font-bold ${textPrimary}`}>Required</span></div><div className="flex items-center justify-between"><span className={textSecondary}>Testing fee</span><span className={`font-bold ${textPrimary}`}>{stats?.needsExam ? `$${stats?.beltExamFee ?? 49}` : "No exam fee shown"}</span></div></div><a href="/belt-promotion" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E11D2A] px-4 py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-[#c41824]">Review Intent to Promote <ArrowLeft className="h-4 w-4 rotate-180" /></a></section>
      </div>

      <section className={`rounded-3xl border p-5 sm:p-7 ${surface(isDark)}`}><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#E11D2A]" /><div><p className="text-xs font-black uppercase tracking-widest text-[#E11D2A]">Training forecast</p><h2 className={`mt-1 text-xl font-black ${textPrimary}`}>Compare weekly training pace</h2></div></div><p className={`mt-2 text-sm ${textSecondary}`}>These are estimates based on your current rank requirement and recent attendance. They are not guarantees and do not replace instructor approval.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((classesPerWeek) => { const weeks = remaining ? Math.ceil(remaining / classesPerWeek) : 0; const date = weeks ? new Date(Date.now() + weeks * 7 * 86400000) : null; return <div key={classesPerWeek} className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}><p className={`text-sm font-black ${textPrimary}`}>{classesPerWeek} class{classesPerWeek > 1 ? "es" : ""} / week</p><p className="mt-2 text-lg font-black text-[#E11D2A]">{date ? formatDate(date) : "Estimate unavailable"}</p><p className={`mt-1 text-xs ${textMuted}`}>{date ? `${weeks} estimated week${weeks === 1 ? "" : "s"} to the class requirement` : "No remaining class requirement recorded"}</p></div>; })}</div></section>
    </div>
  );
}
