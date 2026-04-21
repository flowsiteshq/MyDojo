import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  UserCheck,
  Plus,
  Search,
  Flame,
  Trophy,
  Radio,
  RefreshCw,
  Clock,
  Zap,
  Monitor,
  Users,
} from "lucide-react";
import { toast } from "sonner";

/** Belt rank color mapping */
const beltColors: Record<string, string> = {
  "White Belt": "bg-gray-100 text-gray-700 border-gray-300",
  "Yellow Belt": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Orange Belt": "bg-orange-100 text-orange-700 border-orange-300",
  "Green Belt": "bg-green-100 text-green-700 border-green-300",
  "Blue Belt": "bg-blue-100 text-blue-700 border-blue-300",
  "Purple Belt": "bg-purple-100 text-purple-700 border-purple-300",
  "Brown Belt": "bg-amber-100 text-amber-700 border-amber-300",
  "Red Belt": "bg-red-100 text-red-700 border-red-300",
  "Black Belt": "bg-gray-900 text-white border-gray-700",
};

/** Coloured initials avatar */
function InitialsAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? "")
    .join("");
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-green-500", "bg-teal-500", "bg-blue-500", "bg-indigo-500",
    "bg-purple-500", "bg-pink-500",
  ];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "md" ? "w-10 h-10 text-sm" : "w-12 h-12 text-base";
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials || "?"}
    </div>
  );
}

/** Circular avatar — photo if available, otherwise initials */
function StudentAvatar({ name, photoUrl, size = "sm" }: { name: string; photoUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-8 h-8" : size === "md" ? "w-10 h-10" : "w-12 h-12";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border border-gray-200`} loading="lazy" />
    );
  }
  return <InitialsAvatar name={name} size={size} />;
}

/** Pulsing live indicator dot */
function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
    </span>
  );
}

/** Source badge */
function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    kiosk: { label: "Kiosk", cls: "bg-green-100 text-green-700", icon: <Monitor className="h-3 w-3" /> },
    staff: { label: "Staff", cls: "bg-purple-100 text-purple-700", icon: <UserCheck className="h-3 w-3" /> },
    admin: { label: "Admin", cls: "bg-blue-100 text-blue-700", icon: <Users className="h-3 w-3" /> },
    mobile: { label: "Mobile", cls: "bg-orange-100 text-orange-700", icon: <Zap className="h-3 w-3" /> },
  };
  const info = map[source] ?? { label: source, cls: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>
      {info.icon}
      {info.label}
    </span>
  );
}

export default function AdminAttendance() {
  // Use local date (not UTC) so it matches checkInDate stored by the kiosk in local time
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const [filterDate, setFilterDate] = useState(today);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [checkInDate, setCheckInDate] = useState(today);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");

  // Live today's attendance — auto-refreshes every 30s
  const { data: liveData, isLoading: liveLoading, refetch: refetchLive } = trpc.admin.getTodayAttendance.useQuery(
    { date: today, source: sourceFilter as any },
    { refetchInterval: 30_000 }
  );

  // Historical attendance for the history tab
  const { data: historyAttendance = [], isLoading: historyLoading, refetch: refetchHistory } = trpc.admin.getAllAttendance.useQuery({
    date: filterDate || undefined,
    limit: 200,
  });

  const { data: students = [] } = trpc.admin.getAllStudents.useQuery({ status: "active" });

  const manualCheckIn = trpc.admin.manualCheckIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in recorded successfully");
      setShowCheckInModal(false);
      setSelectedStudentId(null);
      setCheckInNotes("");
      refetchLive();
      refetchHistory();
      setLastRefreshed(new Date());
    },
    onError: (err) => toast.error(err.message),
  });

  // Update lastRefreshed when live data changes
  useEffect(() => {
    if (liveData) setLastRefreshed(new Date());
  }, [liveData]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId) ?? null;

  const liveRecords = liveData?.records ?? [];
  const liveTotal = liveData?.total ?? 0;

  // Stats from live data
  const kioskCount = liveRecords.filter(r => r.source === "kiosk").length;
  const staffCount = liveRecords.filter(r => r.source === "staff" || r.source === "admin").length;
  const totalXP = liveRecords.reduce((sum, r) => sum + (r.xpAwarded ?? 0), 0);

  const weekCount = (() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return historyAttendance.filter(a => new Date(a.checkInTimestamp).getTime() >= weekAgo.getTime()).length;
  })();

  const handleManualRefresh = () => {
    refetchLive();
    refetchHistory();
    setLastRefreshed(new Date());
    toast.success("Attendance refreshed");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">Track student check-ins and class attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className="gap-2 text-gray-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCheckInModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Manual Check-In
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg"><UserCheck className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Today's Check-ins</p>
              <p className="text-xl font-bold">{liveTotal}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg"><Monitor className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Via Kiosk</p>
              <p className="text-xl font-bold">{kioskCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><CalendarDays className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">This Week</p>
              <p className="text-xl font-bold">{weekCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-yellow-50 p-2 rounded-lg"><Zap className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">XP Awarded Today</p>
              <p className="text-xl font-bold">+{totalXP}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "live"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Radio className="h-4 w-4 text-green-500" />
            Live Feed
            {liveTotal > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {liveTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            History
          </button>
        </div>

        {/* LIVE FEED TAB */}
        {activeTab === "live" && (
          <div className="space-y-4">
            {/* Live header bar */}
            <div className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LiveDot />
                <span className="text-sm font-semibold text-gray-800">
                  Today's Attendance — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
                <span className="text-xs text-gray-400">
                  Auto-refreshes every 30s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last updated: {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                {/* Source filter */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="kiosk">Kiosk</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live check-in cards */}
            {liveLoading ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin opacity-30" />
                <p>Loading today's check-ins...</p>
              </div>
            ) : liveRecords.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No check-ins yet today</p>
                <p className="text-sm mt-1">Check-ins will appear here in real time as students arrive.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {liveRecords.map((record, idx) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-xl border p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all"
                  >
                    {/* Position number */}
                    <div className="text-xs font-bold text-gray-300 w-5 text-center flex-shrink-0">
                      {idx + 1}
                    </div>

                    {/* Avatar */}
                    <StudentAvatar
                      name={record.studentName}
                      photoUrl={record.photoUrl}
                      size="md"
                    />

                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{record.studentName}</span>
                        {record.beltRank && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${beltColors[record.beltRank] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {record.beltRank}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {record.programType && (
                          <span className="text-xs text-gray-500">{record.programType}</span>
                        )}
                        {record.currentStreak > 0 && (
                          <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                            <Flame className="h-3 w-3" />
                            {record.currentStreak} day streak
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: time, source, XP */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(record.checkInTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="flex items-center gap-2">
                        <SourceBadge source={record.source} />
                        <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-1.5 py-0.5 rounded">
                          +{record.xpAwarded} XP
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row gap-3 items-center">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter by date:</label>
              <Input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full sm:w-48"
              />
              <Button variant="outline" onClick={() => setFilterDate("")} className="text-sm">
                Show All
              </Button>
              <Button variant="outline" onClick={() => setFilterDate(today)} className="text-sm">
                Today
              </Button>
            </div>

            {/* History table */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">Loading attendance...</TableCell>
                    </TableRow>
                  ) : historyAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                        <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        {filterDate ? `No check-ins on ${filterDate}` : "No attendance records found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    historyAttendance.map(record => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <StudentAvatar
                              name={(record.studentName || record.parentName) ?? "?"}
                              photoUrl={record.studentPhoto}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {record.studentName || record.parentName || "Unknown"}
                              </span>
                              {record.studentName && record.parentName && (
                                <span className="text-xs text-gray-400">Parent: {record.parentName}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.program && (
                            <Badge variant="outline" className="text-xs">{record.program}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">{record.checkInDate}</TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {new Date(record.checkInTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          <SourceBadge source={record.source ?? "admin"} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">+{record.xpAwarded ?? 0}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-xs truncate">{record.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Check-In Modal */}
      <Dialog open={showCheckInModal} onOpenChange={open => { setShowCheckInModal(open); if (!open) { setSelectedStudentId(null); setStudentSearch(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Check-In</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Selected student identity card */}
            {selectedStudent && (
              <div className="p-3 bg-gray-50 rounded-xl border space-y-3">
                <div className="flex items-center gap-4">
                  <StudentAvatar
                    name={selectedStudent.name}
                    photoUrl={(selectedStudent as any).photoUrl}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-500">{selectedStudent.program}</p>
                    {selectedStudent.beltRank && (
                      <p className="text-xs text-gray-400">{selectedStudent.beltRank}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-medium flex-shrink-0">
                    <UserCheck className="h-3.5 w-3.5" />
                    Active
                  </span>
                </div>
              </div>
            )}

            {/* Student search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {studentSearch && (
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {filteredStudents.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400 text-center">No students found</p>
                  ) : (
                    filteredStudents.slice(0, 8).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedStudentId(s.id); setStudentSearch(""); }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors ${selectedStudentId === s.id ? "bg-red-50" : ""}`}
                      >
                        <StudentAvatar name={s.name} photoUrl={(s as any).photoUrl} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.program} · {s.beltRank}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Check-In Date</label>
              <Input
                type="date"
                value={checkInDate}
                onChange={e => setCheckInDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
              <Input
                placeholder="e.g. Late arrival, makeup class..."
                value={checkInNotes}
                onChange={e => setCheckInNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedStudentId) return toast.error("Please select a student");
                manualCheckIn.mutate({
                  studentId: selectedStudentId,
                  date: checkInDate,
                  notes: checkInNotes || undefined,
                });
              }}
              disabled={!selectedStudentId || manualCheckIn.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {manualCheckIn.isPending ? "Recording..." : "Record Check-In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
