import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UserRound, X, Check, ListChecks, Info, ShieldCheck, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Props = { onBack: () => void };

const PROGRAM_IMAGES: Record<string, string> = {
  "Little Ninjas": "/images/program-little-ninjas.jpg",
  "Dragon Kids": "/images/program-core-kids.jpg",
  "Dragon Kids & Teens": "/images/program-core-kids.jpg",
  "Teen Warriors": "/images/program-teens-adults-branded.png",
  "Teens": "/images/program-teens-adults-branded.png",
  "Adult Karate": "/images/featured-kickboxing.jpg",
  "Adult Karate + Kickboxing": "/images/featured-kickboxing.jpg",
  "Kickboxing": "/images/featured-kickboxing.jpg",
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function localDateValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(date);
}
function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
function dateLabel(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "America/Chicago" }).format(new Date(`${value}T12:00:00`));
}
function dayOfWeek(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "America/Chicago" }).format(new Date(`${value}T12:00:00`));
}
function programImage(program: string) {
  return PROGRAM_IMAGES[program] ?? "/images/logo-full-black.webp";
}

export default function ClassScheduleDashboard({ onBack }: Props) {
  const today = localDateValue(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [planning, setPlanning] = useState(false);
  const [selectedForWeek, setSelectedForWeek] = useState<Record<string, boolean>>({});

  const studentsQuery = trpc.classReservation.getMyStudents.useQuery(undefined);
  const students = studentsQuery.data ?? [];
  const activeStudentId = selectedStudentId ?? students[0]?.id ?? null;
  const activeStudent = students.find((student) => student.id === activeStudentId) ?? students[0];
  const scheduleQuery = trpc.classReservation.getSchedule.useQuery({ date: selectedDate, location: "Tomball HQ", enrollmentId: activeStudentId ?? undefined });
  const reservationsQuery = trpc.classReservation.getMyReservations.useQuery({ fromDate: today });
  const utils = trpc.useUtils();
  const reserve = trpc.classReservation.reserve.useMutation({
    onSuccess: () => {
      toast.success("Your spot has been reserved!");
      utils.classReservation.getSchedule.invalidate();
      utils.classReservation.getMyReservations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Unable to reserve this class."),
  });
  const cancel = trpc.classReservation.cancel.useMutation({
    onSuccess: () => {
      toast.success("Reservation cancelled.");
      utils.classReservation.getSchedule.invalidate();
      utils.classReservation.getMyReservations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Unable to cancel this reservation."),
  });

  const week = useMemo(() => {
    const base = new Date(`${selectedDate}T12:00:00`);
    const weekday = base.getDay();
    const monday = addDays(base, weekday === 0 ? -6 : 1 - weekday);
    return Array.from({ length: 7 }, (_, index) => localDateValue(addDays(monday, index)));
  }, [selectedDate]);

  const reservations = reservationsQuery.data ?? [];
  const classes = (scheduleQuery.data ?? []) as Array<(typeof scheduleQuery.data extends Array<infer T> ? T : never) & {
    eligible?: boolean;
    ageLabel?: string;
    eligibilityReason?: string;
  }>;
  const selectedReservations = reservations.filter((reservation) => reservation.classDate === selectedDate && reservation.enrollmentId === activeStudentId);
  const nextReservedClass = reservations.find((reservation) => reservation.enrollmentId === activeStudentId) ?? reservations[0];
  const isReserved = (classId: number, date: string) => reservations.some((reservation) => reservation.classScheduleId === classId && reservation.classDate === date && reservation.enrollmentId === activeStudentId && reservation.status === "confirmed");
  const reservationFor = (classId: number, date: string) => reservations.find((reservation) => reservation.classScheduleId === classId && reservation.classDate === date && reservation.enrollmentId === activeStudentId && reservation.status === "confirmed");

  const reserveClass = (classId: number, date: string) => {
    if (!activeStudentId) return toast.error("Select a student first.");
    reserve.mutate({ classScheduleId: classId, classDate: date, enrollmentId: activeStudentId });
  };
  const weekClasses = week.flatMap((date) => (scheduleQuery.data ?? []).filter((item) => item.dayOfWeek === dayOfWeek(date)).map((item) => ({ ...item, date })));
  const reserveSelected = () => {
    const selected = weekClasses.filter((item) => selectedForWeek[`${item.id}-${item.date}`]);
    if (!selected.length) return toast.error("Select at least one class.");
    selected.forEach((item) => {
      if (!isReserved(item.id, item.date)) reserveClass(item.id, item.date);
    });
    setSelectedForWeek({});
    setPlanning(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7fa] text-slate-950">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="mb-3 text-sm font-semibold text-slate-500 hover:text-slate-900">← Back to dashboard</button>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">My Class Schedule</h1>
          <p className="mt-1 text-sm text-slate-500">Find your next class and reserve your spot.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="schedule-student">Selected student</label>
          <select id="schedule-student" value={activeStudentId ?? ""} onChange={(event) => setSelectedStudentId(Number(event.target.value))} className="min-w-56 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-200">
            {students.length === 0 && <option value="">No active students found</option>}
            {students.map((student) => <option key={student.id} value={student.id}>{student.studentName} · {student.packageName ?? "MyDojo student"}</option>)}
          </select>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><UserRound className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 text-xl font-black">No active students found</h2><p className="mt-2 text-sm text-slate-500">Only active enrollments connected to this parent account appear here.</p></div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
          <section className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={programImage(nextReservedClass?.program ?? activeStudent?.packageName ?? "")} alt="" className="h-24 w-32 rounded-xl object-cover" onError={(event) => { event.currentTarget.src = "/images/logo-full-black.webp"; }} />
                  <div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#e10600]">Next reserved class</p><h2 className="mt-1 text-2xl font-black">{nextReservedClass?.program ?? "No upcoming reservations"}</h2>{nextReservedClass ? <p className="mt-1 text-sm text-slate-500">{dateLabel(nextReservedClass.classDate, { weekday: "long", month: "long", day: "numeric" })} · {nextReservedClass.startTime} – {nextReservedClass.endTime}</p> : <p className="mt-1 text-sm text-slate-500">No upcoming reservations. Select a class below to reserve your spot.</p>} {nextReservedClass && <p className="mt-1 text-xs text-slate-500">{nextReservedClass.location} · {nextReservedClass.instructor ?? "MyDojo instructor"}</p>}</div>
                </div>
                {nextReservedClass && <button type="button" onClick={() => setSelectedDate(nextReservedClass.classDate)} className="rounded-xl bg-[#e10600] px-5 py-3 text-sm font-black text-white hover:bg-red-700">View details</button>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2"><button type="button" aria-label="Previous week" onClick={() => setSelectedDate(localDateValue(addDays(new Date(`${selectedDate}T12:00:00`), -7)))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button><div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">{week.map((date) => { const selected = date === selectedDate; const hasClasses = classes.some((item) => item.dayOfWeek === dayOfWeek(date)); return <button type="button" key={date} onClick={() => setSelectedDate(date)} className={`min-w-[72px] flex-1 rounded-xl border px-2 py-3 text-center transition ${selected ? "border-[#e10600] bg-[#e10600] text-white" : "border-slate-200 bg-white hover:border-red-200"}`}><span className="block text-[10px] font-black uppercase">{dateLabel(date, { weekday: "short" })}</span><span className="mt-1 block text-lg font-black">{dateLabel(date, { day: "numeric" })}</span>{hasClasses && <span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-[#e10600]"}`} />}</button> })}</div><button type="button" aria-label="Next week" onClick={() => setSelectedDate(localDateValue(addDays(new Date(`${selectedDate}T12:00:00`), 7)))} className="rounded-lg p-2 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button><button type="button" onClick={() => setSelectedDate(today)} className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold sm:block">Today</button></div>
            </div>

            <div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">{dateLabel(selectedDate, { weekday: "long", month: "long", day: "numeric" })}</h2><p className="text-sm text-slate-500">{classes.length} classes available</p></div><button type="button" onClick={() => setPlanning((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm"><ListChecks className="h-4 w-4 text-[#e10600]" /> {planning ? "Close planner" : "Book my week"}</button></div>

            {planning && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><div className="flex items-center justify-between"><div><h3 className="font-black">Plan your week</h3><p className="text-xs text-slate-600">Select eligible classes, then reserve them together.</p></div><button type="button" onClick={() => setPlanning(false)}><X className="h-4 w-4" /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{weekClasses.map((item) => { const key = `${item.id}-${item.date}`; return <label key={key} className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm"><input type="checkbox" checked={!!selectedForWeek[key]} disabled={isReserved(item.id, item.date)} onChange={(event) => setSelectedForWeek((current) => ({ ...current, [key]: event.target.checked }))} /><span>{dateLabel(item.date, { weekday: "short", month: "short", day: "numeric" })} · {item.program} · {item.startTime}</span></label> })}</div><button type="button" onClick={reserveSelected} disabled={reserve.isPending} className="mt-4 rounded-xl bg-[#e10600] px-4 py-3 text-sm font-black text-white">{reserve.isPending ? "Reserving…" : "Reserve selected classes"}</button></div>}

            <div className="space-y-3">{scheduleQuery.isLoading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading the published schedule…</div> : classes.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No classes are published for this date.</div> : classes.map((item) => { const reservation = reservationFor(item.id, selectedDate); const reserved = !!reservation; const image = programImage(item.program); return <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"><img src={image} alt={`${item.program} program`} className="h-20 w-full rounded-xl object-cover sm:w-28" onError={(event) => { event.currentTarget.src = "/images/logo-full-black.webp"; }} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black">{item.program}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{item.ageLabel}</span></div><p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4 text-[#e10600]" />{item.startTime} – {item.endTime}</p><p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500"><span><UserRound className="mr-1 inline h-3.5 w-3.5" />{item.instructor ?? "MyDojo instructor"}</span><span><MapPin className="mr-1 inline h-3.5 w-3.5" />{item.location}</span></p></div><div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-36 sm:items-end">{reserved ? <><span className="text-sm font-bold text-blue-600"><Check className="mr-1 inline h-4 w-4" />Reserved</span><button type="button" onClick={() => cancel.mutate({ reservationId: reservation.id })} disabled={cancel.isPending} className="text-xs font-bold text-slate-500 underline">Cancel reservation</button></> : <><span className={`text-sm font-bold ${item.eligible ? "text-emerald-600" : "text-slate-500"}`}>● {item.eligible ? "Available" : "Not eligible"}</span><button type="button" title={item.eligible ? undefined : item.eligibilityReason} onClick={() => reserveClass(item.id, selectedDate)} disabled={!item.eligible || reserve.isPending} className="rounded-xl bg-[#e10600] px-4 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300">{item.eligible ? "Reserve spot" : "Not eligible"}</button></>}</div></article> })}</div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Plan your week</h2><p className="mt-1 text-sm text-slate-500">Quickly reserve your regular classes.</p><button type="button" onClick={() => setPlanning(true)} className="mt-4 w-full rounded-xl bg-[#e10600] px-4 py-3 text-sm font-black text-white">Book my week <ChevronRight className="ml-1 inline h-4 w-4" /></button></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-black">My upcoming classes</h2><button type="button" onClick={() => setSelectedDate(reservations[0]?.classDate ?? today)} className="text-xs font-bold text-blue-600">See all</button></div><div className="mt-4 space-y-3">{reservations.slice(0, 4).map((reservation) => <button type="button" key={reservation.id} onClick={() => setSelectedDate(reservation.classDate)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-red-100"><div className="w-12 shrink-0 rounded-lg bg-red-50 py-1 text-center"><span className="block text-[10px] font-black uppercase text-[#e10600]">{dateLabel(reservation.classDate, { weekday: "short" })}</span><span className="block text-lg font-black">{dateLabel(reservation.classDate, { day: "numeric" })}</span></div><div className="min-w-0"><p className="truncate text-sm font-black">{reservation.program}</p><p className="text-xs text-slate-500">{reservation.startTime} – {reservation.endTime}</p><span className="text-[10px] font-bold text-blue-600">Reserved</span></div></button>)}{reservations.length === 0 && <p className="text-sm text-slate-500">No reservations yet. Reserve a class to see it here.</p>}</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Class information</h2><div className="mt-3 divide-y divide-slate-100">{([ [CalendarDays, "View full schedule", () => setSelectedDate(today)], [ShieldCheck, "Class rules & etiquette", () => toast.info("Please follow instructor guidance and arrive 10 minutes early.")], [Info, "Required equipment", () => toast.info("Equipment requirements are shown in the Equipment Store.")], [MapPin, "Contact us", () => { window.location.href = "/contact"; }] ] as Array<[LucideIcon, string, () => void]>).map(([Icon, label, action]) => <button type="button" key={label} onClick={action} className="flex w-full items-center gap-3 py-3 text-left text-sm font-bold hover:text-[#e10600]"><Icon className="h-4 w-4 text-[#e10600]" />{label}<ChevronRight className="ml-auto h-4 w-4 text-slate-400" /></button>)}</div></div>
          </aside>
        </div>
      )}
    </div>
  );
}
