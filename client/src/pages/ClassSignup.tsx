import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, CheckCircle, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const DAY_SHORT = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

function getWeekDates(offset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
  return DAYS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day,
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isToday: d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
      isPast: d < new Date(today.toISOString().slice(0, 10)),
    };
  });
}

export default function ClassSignup() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const today = new Date();
    const dayIdx = today.getDay();
    return DAYS[dayIdx === 0 ? 6 : dayIdx - 1];
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [showStudentPicker, setShowStudentPicker] = useState<number | null>(null); // classScheduleId

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const { data: schedule, isLoading: scheduleLoading } = trpc.classReservation.getSchedule.useQuery({
    date: selectedDate,
  });

  const { data: myStudents } = trpc.classReservation.getMyStudents.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myReservations, refetch: refetchReservations } = trpc.classReservation.getMyReservations.useQuery(
    { fromDate: selectedDate },
    { enabled: isAuthenticated }
  );

  const reserveMutation = trpc.classReservation.reserve.useMutation({
    onSuccess: () => {
      toast.success("You're signed up! See you in class 🥋");
      refetchReservations();
      setShowStudentPicker(null);
      setReservingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Could not reserve spot");
      setReservingId(null);
    },
  });

  const cancelMutation = trpc.classReservation.cancel.useMutation({
    onSuccess: () => {
      toast.success("Reservation cancelled");
      refetchReservations();
    },
    onError: (err) => toast.error(err.message || "Could not cancel"),
  });

  const handleDaySelect = (day: (typeof DAYS)[number], date: string) => {
    setSelectedDay(day);
    setSelectedDate(date);
  };

  const classesForDay = useMemo(() => {
    if (!schedule) return [];
    return schedule.filter((c) => c.dayOfWeek === selectedDay);
  }, [schedule, selectedDay]);

  const reservedClassIds = useMemo(() => {
    if (!myReservations) return new Set<string>();
    return new Set(myReservations.map((r) => `${r.classScheduleId}-${r.classDate}-${r.enrollmentId}`));
  }, [myReservations]);

  const isReservedForDate = (classScheduleId: number) => {
    if (!myReservations) return null;
    return myReservations.find((r) => r.classScheduleId === classScheduleId && r.classDate === selectedDate) ?? null;
  };

  const handleReserve = (classScheduleId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!myStudents || myStudents.length === 0) {
      toast.error("No active students found on your account. Please contact the dojo.");
      return;
    }
    if (myStudents.length === 1) {
      doReserve(classScheduleId, myStudents[0].id);
    } else {
      setShowStudentPicker(classScheduleId);
    }
  };

  const doReserve = (classScheduleId: number, enrollmentId: number) => {
    setReservingId(classScheduleId);
    reserveMutation.mutate({ classScheduleId, classDate: selectedDate, enrollmentId });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold uppercase tracking-wider">
              Class Sign-Up
            </h1>
            <p className="text-zinc-400 mt-1">Reserve your spot — we'll see you on the mat.</p>
          </div>
          {isAuthenticated && myReservations && myReservations.length > 0 && (
            <Badge className="bg-primary text-white text-sm px-3 py-1">
              {myReservations.length} upcoming
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Week navigator */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setWeekOffset((w) => w - 1)}
            disabled={weekOffset <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {weekDates.map(({ day, date, label, isToday, isPast }) => (
              <button
                key={day}
                onClick={() => handleDaySelect(day, date)}
                disabled={isPast && weekOffset === 0}
                className={`flex flex-col items-center py-3 px-1 rounded-lg transition-all text-sm font-medium
                  ${selectedDay === day && date === selectedDate
                    ? "bg-primary text-white"
                    : isToday
                    ? "bg-zinc-800 border border-primary/50 text-white"
                    : isPast && weekOffset === 0
                    ? "opacity-30 cursor-not-allowed text-zinc-500"
                    : "hover:bg-zinc-800 text-zinc-300"
                  }`}
              >
                <span className="text-xs uppercase tracking-wider">{DAY_SHORT[day]}</span>
                <span className="text-base font-bold mt-0.5">{label.split(" ")[1]}</span>
                <span className="text-xs text-zinc-400">{label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 3}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Classes */}
        {scheduleLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : classesForDay.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No classes scheduled for {selectedDay}.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classesForDay.map((cls) => {
              const existing = isReservedForDate(cls.id);
              const isThisReserving = reservingId === cls.id;

              return (
                <div
                  key={cls.id}
                  className={`rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all
                    ${existing ? "border-primary/50 bg-primary/5" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}
                >
                  {/* Time block */}
                  <div className="flex-shrink-0 w-24 text-center">
                    <div className="text-2xl font-bold text-primary">{cls.startTime}</div>
                    {cls.endTime && <div className="text-xs text-zinc-500">to {cls.endTime}</div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold uppercase tracking-wide">{cls.program}</h3>
                      {existing && (
                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Reserved
                        </Badge>
                      )}
                      {(cls.reservationCount ?? 0) > 0 && !existing && (
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                          {cls.reservationCount} signed up
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400 flex-wrap">
                      {cls.instructor && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> {cls.instructor}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {cls.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {cls.startTime}{cls.endTime ? ` – ${cls.endTime}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {existing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-800 text-red-400 hover:bg-red-900/20"
                        onClick={() => cancelMutation.mutate({ reservationId: existing.id })}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider"
                        onClick={() => handleReserve(cls.id)}
                        disabled={isThisReserving}
                      >
                        {isThisReserving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isAuthenticated ? (
                          "Sign Up"
                        ) : (
                          "Log In to Sign Up"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Student picker modal */}
        {showStudentPicker !== null && myStudents && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-1">Which student?</h3>
              <p className="text-zinc-400 text-sm mb-4">Select the student attending this class.</p>
              <div className="grid gap-2">
                {myStudents.map((s) => (
                  <button
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 hover:border-primary hover:bg-primary/10 transition-all text-left"
                    onClick={() => doReserve(showStudentPicker, s.id)}
                  >
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.studentName ?? ""} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold text-primary">
                        {(s.studentName ?? "?")[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{s.studentName}</div>
                      <div className="text-xs text-zinc-400">{s.packageName ?? "Active Student"}</div>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-3 text-zinc-400 hover:text-white"
                onClick={() => setShowStudentPicker(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Upcoming reservations */}
        {isAuthenticated && myReservations && myReservations.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4 text-zinc-300">Your Upcoming Classes</h2>
            <div className="grid gap-3">
              {myReservations.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex-shrink-0 text-center w-16">
                    <div className="text-xs text-zinc-500 uppercase">{new Date(r.classDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className="text-lg font-bold text-primary">{new Date(r.classDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{r.program}</div>
                    <div className="text-sm text-zinc-400">{r.startTime}{r.endTime ? ` – ${r.endTime}` : ""} · {r.location}</div>
                    <div className="text-sm text-zinc-500">{r.studentName}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500 hover:text-red-400"
                    onClick={() => cancelMutation.mutate({ reservationId: r.id })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-10 text-center p-8 rounded-2xl border border-zinc-800 bg-zinc-900">
            <p className="text-zinc-400 mb-4">Log in to sign up for classes and manage your reservations.</p>
            <a href={getLoginUrl()}>
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider px-8">
                Log In / Create Account
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
