import {
  Award,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Dumbbell,
  FileText,
  Home,
  MessageCircle,
  Package,
  ReceiptText,
  ShoppingBag,
  Trophy,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Props = {
  firstName: string;
  user: any;
  selfPhotoUrl: string | null;
  initials: string;
  enrollment: any;
  myEnrollment: any;
  progressStats: any;
  nextClass: any;
  unreadCount: number;
  childProfiles?: any[];
  setActiveTab: (tab: any) => void;
  setTrainingDialog: (dialog: any) => void;
};

const stripeColors = ["#f8fafc", "#facc15", "#ef4444", "#111827"];
const sparringPackageImage = "/manus-storage/mydojo-sparring-gear-red-black_e9baacd1.png";

function money(amount: number | null | undefined) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "Balance temporarily unavailable";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
}

function dateParts(value: string | Date) {
  const date = new Date(value);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    label: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
  };
}

export function ParentPortalHome({
  firstName,
  user,
  selfPhotoUrl,
  initials,
  enrollment,
  myEnrollment,
  progressStats,
  nextClass,
  unreadCount,
  childProfiles = [],
  setActiveTab,
  setTrainingDialog,
}: Props) {
  const program = String(myEnrollment?.packageName ?? enrollment?.enrollment?.program ?? "Basic Membership");
  const monthlyPrice = myEnrollment?.packageMonthlyPrice ?? enrollment?.package?.monthlyPrice;
  const { data: payments = [] } = trpc.member.getPaymentHistory.useQuery(undefined, { enabled: true });
  const upcomingPayment = (payments as any[]).find((payment: any) => payment.status === "upcoming");
  const overdueBalance = (payments as any[])
    .filter((payment: any) => ["open", "overdue", "past_due"].includes(String(payment.status).toLowerCase()))
    .reduce((total: number, payment: any) => total + Number(payment.amount || 0), 0);
  const nextPaymentAmount = upcomingPayment?.amount ?? (monthlyPrice ? Number(monthlyPrice) : null);
  const nextPaymentDate = upcomingPayment?.created ? new Date(upcomingPayment.created).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Not scheduled";
  const currentBelt = progressStats?.beltRank ?? enrollment?.enrollment?.beltRank ?? "No Belt";
  const nextBelt = progressStats?.nextBelt ?? "Staff review";
  const positions = Array.isArray(progressStats?.stripePositions) ? progressStats.stripePositions : [];
  const filledStripes = positions.length ? positions.filter((position: any) => position.filled).length : Math.max(0, Math.min(16, Number(progressStats?.stripesInPhase ?? 0)));
  const stripePercent = Math.round((filledStripes / 16) * 100);
  const nextClassParts = nextClass ? dateParts(new Date()) : null;
  const ceremonyParts = dateParts("2026-10-31T11:00:00-05:00");
  const accountCurrent = overdueBalance <= 0;
  const balanceLabel = accountCurrent ? "Account current" : "Payment due";

  const navigateTo = (tab: string) => {
    if (tab === "billing") setActiveTab("account");
    else if (tab === "progress") { setActiveTab("training"); setTrainingDialog("progress"); }
    else if (tab === "classes") { setActiveTab("training"); setTrainingDialog("schedule"); }
    else setActiveTab(tab);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f6f7f9] text-slate-950">
      <div className="grid min-h-[calc(100vh-4rem)] w-full lg:grid-cols-[238px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] bg-[#090a0c] px-4 py-6 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-3 pb-8"><div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#e10600] text-xl font-black">M</div><span className="text-xl font-black tracking-[0.16em]">MYDOJO</span></div>
          <nav className="space-y-1" aria-label="Parent portal navigation">
            {[{ label: "Home", icon: Home, tab: "home" }, { label: "My Students", icon: Users, tab: "children" }, { label: "Classes", icon: CalendarDays, tab: "classes" }, { label: "Belt Progress", icon: Award, tab: "progress" }, { label: "Billing & Payments", icon: CreditCard, tab: "billing" }, { label: "Equipment Store", icon: ShoppingBag, tab: "shop" }, { label: "Events", icon: Trophy, tab: "benefits" }, { label: "Messages", icon: MessageCircle, tab: "messages" }].map(({ label, icon: Icon, tab }, index) => <button key={label} onClick={() => navigateTo(tab)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${index === 0 ? "bg-[#e10600] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" />{label}{label === "Messages" && unreadCount > 0 && <span className="ml-auto rounded-full bg-[#e10600] px-2 py-0.5 text-[10px] font-black">{unreadCount}</span>}</button>)}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">MyDojo promise</p><p className="mt-3 text-sm font-bold leading-6 text-white/85">Discipline.<br />Confidence.<br />A brighter future.</p><div className="mt-4 h-1 w-12 bg-[#e10600]" /></div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-slate-500">Your family&apos;s martial arts journey continues.</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[#10152f] sm:text-4xl">Welcome back, <span className="text-[#e10600]">{firstName}!</span></h1></div><div className="flex items-center gap-3"><button onClick={() => navigateTo("home")} className="relative rounded-full p-2 text-slate-500 hover:bg-white"><Bell className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-1 top-0 h-4 min-w-4 rounded-full bg-[#e10600] px-1 text-center text-[10px] font-black text-white">{unreadCount}</span>}</button><div className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm"><div className="h-9 w-9 overflow-hidden rounded-full bg-[#e10600] text-center text-sm font-black leading-9 text-white">{selfPhotoUrl ? <img src={selfPhotoUrl} alt="Parent profile" className="h-full w-full object-cover" /> : initials}</div><div className="hidden sm:block"><p className="text-xs font-black text-[#10152f]">{user?.name || firstName}</p><p className="text-[10px] text-slate-500">Parent Account</p></div></div></div></div>

          <section role="button" tabIndex={0} onClick={() => navigateTo("billing")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigateTo("billing"); } }} className={`mb-5 cursor-pointer rounded-2xl border p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#e10600]/30 sm:p-6 ${accountCurrent ? "border-[#f2b7b7] bg-[#fff7f7]" : "border-[#e7b1b1] bg-[#fff2f2]"}`}><div className="grid gap-5 lg:grid-cols-[150px_1fr_1fr_auto] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#e10600]">Account balance</p><p className="mt-2 text-4xl font-black text-[#d30909]">{money(overdueBalance)}</p><p className={`mt-1 text-sm font-bold ${accountCurrent ? "text-emerald-600" : "text-[#d30909]"}`}>{accountCurrent ? "✓ Account current" : balanceLabel}</p></div><div className="border-l-0 border-slate-200 lg:border-l lg:pl-6"><p className="text-sm text-slate-500">Next tuition payment</p><p className="mt-1 text-xl font-black text-[#10152f]">{nextPaymentDate}</p><p className="mt-1 text-sm font-semibold text-slate-500">{nextPaymentAmount === null ? "Billing date pending" : money(nextPaymentAmount)}</p></div><div className="hidden border-l border-slate-200 pl-6 lg:block"><p className="text-sm text-slate-500">Membership</p><p className="mt-1 font-black text-[#10152f]">{program}</p><p className="mt-1 text-sm text-slate-500">{monthlyPrice ? `${money(Number(monthlyPrice))}/month` : "Plan details unavailable"}</p></div><div className="flex flex-col gap-2"><button onClick={(event) => { event.stopPropagation(); navigateTo("billing"); }} className="rounded-xl bg-[#e10600] px-7 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#bd0500]">{accountCurrent ? "View Billing" : "Pay Now"}<ChevronRight className="ml-2 inline h-4 w-4" /></button><button onClick={(event) => { event.stopPropagation(); navigateTo("billing"); }} className="text-xs font-bold text-[#1769aa] hover:underline">View payment history</button></div></div></section>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_250px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-4"><div className="h-40 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100">{selfPhotoUrl ? <img src={selfPhotoUrl} alt={String(progressStats?.studentName || "Student")} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl font-black text-[#e10600]">{initials}</div>}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="text-xl font-black text-[#10152f]">{progressStats?.studentName || enrollment?.enrollment?.studentName || user?.name || "Student"}</h2><p className="mt-1 text-sm text-slate-500">{program}</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">{myEnrollment?.status || "Active"}</span></div><div className="mt-7 grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-500">Current belt</p><p className="mt-1 font-black text-[#e10600]">{currentBelt}</p></div><div><p className="text-xs text-slate-500">Next belt</p><p className="mt-1 font-black text-emerald-600">{nextBelt}</p></div></div></div></div><button onClick={() => navigateTo("children")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e6c78d] py-2 text-sm font-bold text-[#a8791f] hover:bg-amber-50">View full profile <ChevronRight className="h-4 w-4" /></button></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Belt progress</p><h2 className="mt-2 text-2xl font-black text-[#10152f]">{filledStripes} / 16 <span className="text-sm font-semibold text-slate-500">stripes</span></h2></div><span className="text-sm font-bold text-slate-500">{stripePercent}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#e10600] transition-all" style={{ width: `${stripePercent}%` }} /></div><div className="mt-5 grid grid-cols-4 gap-1.5">{Array.from({ length: 16 }, (_, index) => <span key={index} className="flex items-center justify-center gap-0.5">{Array.from({ length: 4 }, (_, dot) => <span key={dot} className="h-3 w-3 rounded-full border border-slate-300" style={index < filledStripes ? { backgroundColor: stripeColors[Math.min(3, Math.floor(index / 4))] } : undefined} />)}</span>)}</div><p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{filledStripes >= 16 ? "Ready for instructor evaluation." : `${16 - filledStripes} more stripes until belt evaluation eligibility.`}</p><button onClick={() => navigateTo("progress")} className="mt-4 text-sm font-bold text-[#1769aa] hover:underline">View belt progress <ChevronRight className="ml-1 inline h-4 w-4" /></button></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Next class</p><button onClick={() => navigateTo("classes")} className="text-xs font-bold text-[#1769aa]">View schedule</button></div>{nextClass ? <><div className="mt-4 flex gap-3"><div className="w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 text-center"><div className="bg-[#e10600] py-1 text-[10px] font-black text-white">{nextClassParts?.month}</div><div className="py-2 text-2xl font-black text-[#10152f]">{nextClassParts?.day}</div></div><div><h3 className="font-black text-[#10152f]">{nextClass.program}</h3><p className="mt-1 text-xs text-slate-500">{nextClass.startTime} – {nextClass.endTime}</p><p className="mt-1 text-xs text-slate-500">{nextClass.location || "MyDojo Tomball"}</p></div></div><button onClick={() => window.location.href = "/check-in"} className="mt-5 w-full rounded-lg bg-[#e10600] py-2 text-sm font-black text-white">Check in</button></> : <p className="mt-5 text-sm text-slate-500">Your next class will appear here.</p>}</section>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-black text-[#10152f]">Required equipment</h2><button onClick={() => navigateTo("shop")} className="text-xs font-bold text-[#1769aa]">View store</button></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{["Karate uniform", "Headgear", "Hand pads", "Foot pads", "Mouthpiece"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"><Package className="h-4 w-4 text-[#e10600]" /><span className="flex-1 capitalize text-slate-700">{item}</span><span className={`text-xs font-bold ${index === 0 ? "text-emerald-600" : "text-[#e10600]"}`}>{index === 0 ? "Owned" : "Required"}</span></div>)}</div><button onClick={() => navigateTo("shop")} className="mt-4 grid w-full grid-cols-[88px_1fr_auto] items-center gap-3 rounded-xl bg-amber-50 p-2 text-left"><div className="h-20 overflow-hidden rounded-lg bg-white"><img src={sparringPackageImage} alt="MyDojo sparring gear package" className="h-full w-full object-cover" loading="lazy" /></div><span><span className="block text-xs text-slate-500 line-through">$249</span><span className="font-black text-[#10152f]">Sparring package <span className="text-[#e10600]">$179</span></span><span className="mt-1 block text-xs text-slate-500">Complete protective gear set</span></span><ChevronRight className="h-5 w-5 text-[#a8791f]" /></button></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-black text-[#10152f]">Upcoming events</h2><button onClick={() => navigateTo("benefits")} className="text-xs font-bold text-[#1769aa]">View all</button></div><div className="mt-4 space-y-3"><div className="flex items-center gap-3"><div className="w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 text-center"><div className="bg-[#e10600] py-1 text-[10px] font-black text-white">{ceremonyParts.month}</div><div className="py-2 text-2xl font-black text-[#10152f]">{ceremonyParts.day}</div></div><div className="min-w-0 flex-1"><p className="font-black text-[#10152f]">October Belt Promotion</p><p className="mt-1 text-xs text-slate-500">Saturday, October 31 · 11:00 AM</p><p className="mt-1 text-xs text-slate-500">MyDojo Tomball</p></div><ChevronRight className="h-4 w-4 text-slate-400" /></div><div className="flex items-center gap-3 border-t border-slate-100 pt-3"><div className="w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 text-center"><div className="bg-[#e10600] py-1 text-[10px] font-black text-white">NOV</div><div className="py-2 text-2xl font-black text-[#10152f]">07</div></div><div><p className="font-black text-[#10152f]">Skills Workshop</p><p className="mt-1 text-xs text-slate-500">Saturday, November 7 · 11:00 AM</p></div></div></div></section></div>

          <section className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#111216] via-[#262329] to-[#a30a0a] p-5 text-white shadow-sm sm:p-6"><div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Optional program upgrade</p><h2 className="mt-1 text-2xl font-black uppercase">The road to Black Belt starts here.</h2><p className="mt-1 text-sm text-white/70">Advanced training, leadership development, and goal setting.</p></div><button onClick={() => navigateTo("benefits")} className="rounded-lg bg-amber-300 px-5 py-3 text-sm font-black text-slate-900">Explore Black Belt Program <ChevronRight className="ml-1 inline h-4 w-4" /></button></div></section>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">{[{ label: "Home", icon: Home, tab: "home" }, { label: "Students", icon: Users, tab: "children" }, { label: "Classes", icon: CalendarDays, tab: "classes" }, { label: "Billing", icon: CreditCard, tab: "billing" }, { label: "Store", icon: ShoppingBag, tab: "shop" }].map(({ label, icon: Icon, tab }) => <button key={label} onClick={() => navigateTo(tab)} className="flex min-w-[78px] flex-col items-center gap-1 rounded-xl bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-sm"><Icon className="h-4 w-4 text-[#e10600]" />{label}</button>)}</div>
        </section>
      </div>
    </div>
  );
}
