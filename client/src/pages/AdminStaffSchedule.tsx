import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  UserX,
  UserCheck,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PROGRAM_COLORS: Record<string, string> = {
  "Little Ninjas": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Little Ninjas & Me": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Dragon Kids": "bg-blue-100 text-blue-800 border-blue-200",
  "Dragon Kids & Teens": "bg-blue-100 text-blue-800 border-blue-200",
  "Teens": "bg-purple-100 text-purple-800 border-purple-200",
  "Teen Warriors": "bg-purple-100 text-purple-800 border-purple-200",
  "Adult Karate": "bg-red-100 text-red-800 border-red-200",
  "Adult Karate + Kickboxing": "bg-red-100 text-red-800 border-red-200",
  "Kickboxing": "bg-orange-100 text-orange-800 border-orange-200",
  "After School": "bg-green-100 text-green-800 border-green-200",
  "Summer Camp": "bg-teal-100 text-teal-800 border-teal-200",
  "Intro Class": "bg-gray-100 text-gray-800 border-gray-200",
  "Leadership": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Sparring": "bg-rose-100 text-rose-800 border-rose-200",
  "Weapons Class": "bg-amber-100 text-amber-800 border-amber-200",
  "Women's Self-Defense": "bg-pink-100 text-pink-800 border-pink-200",
  "Advanced/Black Belt + Kickboxing": "bg-red-200 text-red-900 border-red-300",
  "Family Class": "bg-lime-100 text-lime-800 border-lime-200",
  "Instructor Training": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Demo/Competition Team": "bg-violet-100 text-violet-800 border-violet-200",
};

function getWeekDates(weekOffset: number) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminStaffSchedule() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  // Modals
  const [assignModal, setAssignModal] = useState<{ classId: number; program: string; day: string; time: string } | null>(null);
  const [unavailModal, setUnavailModal] = useState<{ date: string; classId?: number; program?: string } | null>(null);
  const [coverModal, setCoverModal] = useState<{ availId: number; staffName: string; date: string } | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"primary" | "backup">("primary");
  const [unavailReason, setUnavailReason] = useState("");
  const [coverStaffId, setCoverStaffId] = useState<string>("");
  const [coverNotes, setCoverNotes] = useState("");

  // Data queries
  const { data: scheduleData, refetch: refetchSchedule } = trpc.staffSchedule.getWeeklySchedule.useQuery();
  const { data: staffList } = trpc.staffSchedule.getStaffList.useQuery();
  const { data: availability, refetch: refetchAvailability } = trpc.staffSchedule.getAvailability.useQuery(
    { startDate, endDate },
    { enabled: true }
  );

  // Mutations
  const assignStaff = trpc.staffSchedule.assignStaff.useMutation({
    onSuccess: () => { toast.success("Staff assigned!"); setAssignModal(null); refetchSchedule(); },
    onError: (e) => toast.error(e.message),
  });
  const removeAssignment = trpc.staffSchedule.removeAssignment.useMutation({
    onSuccess: () => { toast.success("Assignment removed"); refetchSchedule(); },
    onError: (e) => toast.error(e.message),
  });
  const markUnavailable = trpc.staffSchedule.markUnavailable.useMutation({
    onSuccess: () => { toast.success("Marked as needing cover"); setUnavailModal(null); setUnavailReason(""); refetchAvailability(); },
    onError: (e) => toast.error(e.message),
  });
  const removeUnavailable = trpc.staffSchedule.removeUnavailable.useMutation({
    onSuccess: () => { toast.success("Availability restored"); refetchAvailability(); },
    onError: (e) => toast.error(e.message),
  });
  const assignCover = trpc.staffSchedule.assignCover.useMutation({
    onSuccess: () => { toast.success("Cover assigned!"); setCoverModal(null); setCoverStaffId(""); setCoverNotes(""); refetchAvailability(); },
    onError: (e) => toast.error(e.message),
  });

  // Group classes by day
  const classesByDay = useMemo(() => {
    const grouped: Record<string, typeof scheduleData.classes> = {};
    DAYS.forEach(d => { grouped[d] = []; });
    scheduleData?.classes.forEach(c => {
      if (grouped[c.dayOfWeek]) grouped[c.dayOfWeek].push(c);
    });
    return grouped;
  }, [scheduleData]);

  // Index assignments by classScheduleId
  const assignmentsByClass = useMemo(() => {
    const map: Record<number, typeof scheduleData.assignments> = {};
    scheduleData?.assignments.forEach(a => {
      if (!map[a.classScheduleId]) map[a.classScheduleId] = [];
      map[a.classScheduleId].push(a);
    });
    return map;
  }, [scheduleData]);

  // Index availability by date+classId
  const availByDateClass = useMemo(() => {
    const map: Record<string, typeof availability> = {};
    availability?.forEach(a => {
      const key = `${a.date}-${a.classScheduleId ?? "all"}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [availability]);

  // Count unresolved coverage needs for alert banner
  const needsCoverCount = useMemo(() => {
    return availability?.filter(a => a.status === "needs_cover").length ?? 0;
  }, [availability]);

  const getAvailForClass = (date: string, classId: number) => {
    return availByDateClass[`${date}-${classId}`] ?? availByDateClass[`${date}-all`] ?? [];
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Staff Schedule
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage class assignments and coverage for the week</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} className="text-xs px-3">
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Coverage Alert Banner */}
        {needsCoverCount > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-amber-800 font-medium text-sm">
              {needsCoverCount} class{needsCoverCount > 1 ? "es" : ""} need{needsCoverCount === 1 ? "s" : ""} coverage this week
            </span>
          </div>
        )}

        {/* Week label */}
        <div className="text-sm text-gray-500 mb-4 font-medium">
          Week of {weekDates[0].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAYS.map((day, dayIdx) => {
            const date = weekDates[dayIdx];
            const dateStr = formatDate(date);
            const isToday = formatDate(new Date()) === dateStr;
            const classes = classesByDay[day] ?? [];

            return (
              <div
                key={day}
                className={`rounded-xl border ${isToday ? "border-primary bg-primary/5" : "border-gray-200 bg-white"} overflow-hidden`}
              >
                {/* Day header */}
                <div className={`px-3 py-2 ${isToday ? "bg-primary text-white" : "bg-gray-50 text-gray-700"} flex items-center justify-between`}>
                  <div>
                    <div className="font-bold text-sm">{day.slice(0, 3)}</div>
                    <div className={`text-xs ${isToday ? "text-white/80" : "text-gray-400"}`}>{formatDisplayDate(date)}</div>
                  </div>
                  {classes.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {classes.length}
                    </Badge>
                  )}
                </div>

                {/* Classes */}
                <div className="p-2 space-y-2 min-h-[120px]">
                  {classes.length === 0 && (
                    <p className="text-xs text-gray-400 text-center pt-4">No classes</p>
                  )}
                  {classes.map(cls => {
                    const assignments = assignmentsByClass[cls.id] ?? [];
                    const availRecords = getAvailForClass(dateStr, cls.id);
                    const needsCover = availRecords.some(a => a.status === "needs_cover");
                    const isCovered = availRecords.some(a => a.status === "covered");
                    const colorClass = PROGRAM_COLORS[cls.program] ?? "bg-gray-100 text-gray-800 border-gray-200";

                    return (
                      <div
                        key={cls.id}
                        className={`rounded-lg border p-2 text-xs ${colorClass} ${needsCover ? "ring-2 ring-amber-400" : ""} ${isCovered ? "ring-2 ring-green-400" : ""}`}
                      >
                        {/* Time + Program */}
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="font-semibold">{cls.startTime}</span>
                        </div>
                        <div className="font-bold leading-tight mb-1 truncate" title={cls.program}>
                          {cls.program}
                        </div>
                        {cls.location && (
                          <div className="text-[10px] opacity-70 truncate mb-1">{cls.location}</div>
                        )}

                        {/* Coverage status */}
                        {needsCover && (
                          <div className="flex items-center gap-1 text-amber-700 font-medium mb-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Needs Cover</span>
                          </div>
                        )}
                        {isCovered && (
                          <div className="flex items-center gap-1 text-green-700 font-medium mb-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Covered</span>
                          </div>
                        )}

                        {/* Staff assignments */}
                        {assignments.length > 0 && (
                          <div className="space-y-0.5 mb-1">
                            {assignments.map(a => (
                              <div key={a.id} className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  {a.role === "primary" ? (
                                    <Shield className="h-2.5 w-2.5 shrink-0" />
                                  ) : (
                                    <Users className="h-2.5 w-2.5 shrink-0" />
                                  )}
                                  <span className="truncate">{a.staffName}</span>
                                </div>
                                {isAdmin && (
                                  <button
                                    onClick={() => removeAssignment.mutate({ assignmentId: a.id })}
                                    className="text-red-500 hover:text-red-700 shrink-0"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Cover assignments shown */}
                        {availRecords.filter(a => a.status === "covered" && a.coverStaffName).map(a => (
                          <div key={a.id} className="flex items-center gap-1 text-green-700 text-[10px]">
                            <UserCheck className="h-2.5 w-2.5" />
                            <span>Cover: {a.coverStaffName}</span>
                          </div>
                        ))}

                        {/* Action buttons */}
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {isAdmin && (
                            <button
                              onClick={() => setAssignModal({ classId: cls.id, program: cls.program, day, time: cls.startTime })}
                              className="flex items-center gap-0.5 text-[10px] bg-white/70 hover:bg-white rounded px-1 py-0.5 border border-current/20"
                              title="Assign staff"
                            >
                              <Plus className="h-2.5 w-2.5" />
                              Assign
                            </button>
                          )}
                          {!needsCover && !isCovered && (
                            <button
                              onClick={() => setUnavailModal({ date: dateStr, classId: cls.id, program: cls.program })}
                              className="flex items-center gap-0.5 text-[10px] bg-white/70 hover:bg-white rounded px-1 py-0.5 border border-current/20"
                              title="Mark unavailable"
                            >
                              <UserX className="h-2.5 w-2.5" />
                              Out
                            </button>
                          )}
                          {needsCover && isAdmin && (
                            <button
                              onClick={() => {
                                const rec = availRecords.find(a => a.status === "needs_cover");
                                if (rec) setCoverModal({ availId: rec.id, staffName: rec.staffName, date: dateStr });
                              }}
                              className="flex items-center gap-0.5 text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 rounded px-1 py-0.5"
                              title="Assign cover"
                            >
                              <UserCheck className="h-2.5 w-2.5" />
                              Cover
                            </button>
                          )}
                          {(needsCover || isCovered) && (
                            <button
                              onClick={() => {
                                const rec = availRecords[0];
                                if (rec) removeUnavailable.mutate({ availabilityId: rec.id });
                              }}
                              className="flex items-center gap-0.5 text-[10px] bg-white/70 hover:bg-white rounded px-1 py-0.5 border border-current/20"
                              title="Cancel"
                            >
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full ring-2 ring-amber-400 bg-amber-100" />
            <span>Needs coverage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full ring-2 ring-green-400 bg-green-100" />
            <span>Covered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            <span>Primary instructor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            <span>Backup instructor</span>
          </div>
        </div>
      </div>

      {/* Assign Staff Modal */}
      <Dialog open={!!assignModal} onOpenChange={() => setAssignModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Class</DialogTitle>
          </DialogHeader>
          {assignModal && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-semibold">{assignModal.program}</div>
                <div className="text-gray-500">{assignModal.day} at {assignModal.time}</div>
              </div>
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name ?? s.email} {s.role === "admin" ? "(Admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "primary" | "backup")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary Instructor</SelectItem>
                    <SelectItem value="backup">Backup / Cover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button
              disabled={!selectedStaffId || assignStaff.isPending}
              onClick={() => {
                if (!assignModal || !selectedStaffId) return;
                const staff = staffList?.find(s => s.id === Number(selectedStaffId));
                if (!staff) return;
                assignStaff.mutate({
                  classScheduleId: assignModal.classId,
                  staffUserId: staff.id,
                  staffName: staff.name ?? staff.email ?? "Unknown",
                  role: selectedRole,
                });
              }}
            >
              {assignStaff.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Unavailable Modal */}
      <Dialog open={!!unavailModal} onOpenChange={() => setUnavailModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Unavailable</DialogTitle>
          </DialogHeader>
          {unavailModal && (
            <div className="space-y-4 py-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="font-semibold text-amber-800">
                  {unavailModal.program ? `${unavailModal.program} — ` : ""}
                  {unavailModal.date}
                </div>
                <div className="text-amber-600 text-xs mt-1">This will flag the class as needing a cover instructor.</div>
              </div>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="e.g., Sick day, vacation, personal..."
                  value={unavailReason}
                  onChange={e => setUnavailReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnavailModal(null)}>Cancel</Button>
            <Button
              disabled={markUnavailable.isPending}
              onClick={() => {
                if (!unavailModal) return;
                markUnavailable.mutate({
                  date: unavailModal.date,
                  classScheduleId: unavailModal.classId,
                  reason: unavailReason || undefined,
                });
              }}
            >
              {markUnavailable.isPending ? "Saving..." : "Mark Unavailable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Cover Modal */}
      <Dialog open={!!coverModal} onOpenChange={() => setCoverModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Cover Instructor</DialogTitle>
          </DialogHeader>
          {coverModal && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="text-gray-500">Covering for: <span className="font-semibold text-gray-800">{coverModal.staffName}</span></div>
                <div className="text-gray-500">Date: <span className="font-semibold text-gray-800">{coverModal.date}</span></div>
              </div>
              <div className="space-y-2">
                <Label>Cover Instructor</Label>
                <Select value={coverStaffId} onValueChange={setCoverStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cover instructor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name ?? s.email} {s.role === "admin" ? "(Admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Any special instructions..."
                  value={coverNotes}
                  onChange={e => setCoverNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCoverModal(null)}>Cancel</Button>
            <Button
              disabled={!coverStaffId || assignCover.isPending}
              onClick={() => {
                if (!coverModal || !coverStaffId) return;
                const staff = staffList?.find(s => s.id === Number(coverStaffId));
                if (!staff) return;
                assignCover.mutate({
                  availabilityId: coverModal.availId,
                  coverStaffUserId: staff.id,
                  coverStaffName: staff.name ?? staff.email ?? "Unknown",
                  notes: coverNotes || undefined,
                });
              }}
            >
              {assignCover.isPending ? "Assigning..." : "Assign Cover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
