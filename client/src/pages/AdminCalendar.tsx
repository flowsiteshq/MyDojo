import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Trash2,
  Edit2,
  CalendarOff,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CATEGORY_COLORS: Record<string, string> = {
  class: "bg-blue-500",
  meeting: "bg-purple-500",
  cleaning: "bg-yellow-500",
  event: "bg-green-500",
  training: "bg-orange-500",
  other: "bg-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-yellow-600",
  high: "text-red-600",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="h-3 w-3 text-yellow-500" />,
  in_progress: <Loader2 className="h-3 w-3 text-blue-500" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  cancelled: <XCircle className="h-3 w-3 text-gray-400" />,
};

type Task = {
  id: number;
  title: string;
  description?: string | null;
  taskDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  assignedToUserId?: number | null;
  assignedToName?: string | null;
  category: string;
  priority: string;
  status: string;
  createdByName?: string | null;
  staffNotes?: string | null;
};

type TimeOff = {
  id: number;
  userId: number;
  userName: string;
  startDate: Date;
  endDate: Date;
  type: string;
  status: string;
  reason?: string | null;
  adminNotes?: string | null;
};

export default function AdminCalendar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showTimeOffDialog, setShowTimeOffDialog] = useState(false);
  const [showTimeOffReviewDialog, setShowTimeOffReviewDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reviewingTimeOff, setReviewingTimeOff] = useState<TimeOff | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    assignedToUserId: "",
    assignedToName: "",
    category: "other" as const,
    priority: "medium" as const,
    status: "pending" as "pending" | "in_progress" | "completed" | "cancelled",
    staffNotes: "",
  });

  // Time-off form state
  const [timeOffForm, setTimeOffForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    type: "personal" as const,
  });

  // Admin review state
  const [reviewForm, setReviewForm] = useState({
    status: "approved" as "approved" | "denied",
    adminNotes: "",
  });

  // Fetch calendar data
  const { data: calendarData, refetch: refetchCalendar } = trpc.calendar.getTasksForMonth.useQuery(
    { year, month },
    { enabled: !!user }
  );

  const { data: myTimeOff, refetch: refetchMyTimeOff } = trpc.calendar.getMyTimeOff.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: allTimeOff, refetch: refetchAllTimeOff } = trpc.calendar.getAllTimeOff.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  const { data: staffList } = trpc.calendar.getStaffList.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  // Mutations
  const createTask = trpc.calendar.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully");
      setShowTaskDialog(false);
      resetTaskForm();
      refetchCalendar();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateTask = trpc.calendar.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      setShowTaskDialog(false);
      setEditingTask(null);
      resetTaskForm();
      refetchCalendar();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTask = trpc.calendar.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Task deleted");
      refetchCalendar();
    },
    onError: (e) => toast.error(e.message),
  });

  const requestTimeOff = trpc.calendar.requestTimeOff.useMutation({
    onSuccess: () => {
      toast.success("Time-off request submitted");
      setShowTimeOffDialog(false);
      setTimeOffForm({ startDate: "", endDate: "", reason: "", type: "personal" });
      refetchMyTimeOff();
    },
    onError: (e) => toast.error(e.message),
  });

  const reviewTimeOff = trpc.calendar.reviewTimeOff.useMutation({
    onSuccess: () => {
      toast.success(`Request ${reviewForm.status}`);
      setShowTimeOffReviewDialog(false);
      setReviewingTimeOff(null);
      refetchAllTimeOff();
      refetchCalendar();
    },
    onError: (e) => toast.error(e.message),
  });

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month - 1, d));
    return days;
  }, [year, month]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    if (!calendarData?.tasks) return map;
    for (const task of calendarData.tasks) {
      const key = new Date(task.taskDate).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(task as Task);
    }
    return map;
  }, [calendarData]);

  // Group time-off by date range
  const timeOffByDate = useMemo(() => {
    const map: Record<string, TimeOff[]> = {};
    if (!calendarData?.timeOff) return map;
    for (const to of calendarData.timeOff) {
      const start = new Date(to.startDate);
      const end = new Date(to.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        const key = cur.toDateString();
        if (!map[key]) map[key] = [];
        map[key].push(to as TimeOff);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [calendarData]);

  function resetTaskForm() {
    setTaskForm({
      title: "", description: "", startTime: "", endTime: "",
      assignedToUserId: "", assignedToName: "", category: "other",
      priority: "medium", status: "pending", staffNotes: "",
    });
  }

  function openCreateTask(day: Date) {
    setSelectedDay(day);
    setEditingTask(null);
    resetTaskForm();
    setShowTaskDialog(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description ?? "",
      startTime: task.startTime ?? "",
      endTime: task.endTime ?? "",
      assignedToUserId: task.assignedToUserId?.toString() ?? "",
      assignedToName: task.assignedToName ?? "",
      category: task.category as any,
      priority: task.priority as any,
      status: task.status as any,
      staffNotes: task.staffNotes ?? "",
    });
    setSelectedDay(new Date(task.taskDate));
    setShowTaskDialog(true);
  }

  function handleTaskSubmit() {
    if (!taskForm.title.trim()) return;
    const taskDate = selectedDay ?? new Date();
    const payload = {
      title: taskForm.title,
      description: taskForm.description || undefined,
      taskDate,
      startTime: taskForm.startTime || undefined,
      endTime: taskForm.endTime || undefined,
      assignedToUserId: taskForm.assignedToUserId ? parseInt(taskForm.assignedToUserId) : undefined,
      assignedToName: taskForm.assignedToName || undefined,
      category: taskForm.category,
      priority: taskForm.priority,
    };

    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...payload, status: taskForm.status, staffNotes: taskForm.staffNotes || undefined });
    } else {
      createTask.mutate(payload);
    }
  }

  function handleTimeOffSubmit() {
    if (!timeOffForm.startDate || !timeOffForm.endDate) return;
    requestTimeOff.mutate({
      startDate: new Date(timeOffForm.startDate),
      endDate: new Date(timeOffForm.endDate),
      reason: timeOffForm.reason || undefined,
      type: timeOffForm.type,
    });
  }

  function handleReviewSubmit() {
    if (!reviewingTimeOff) return;
    reviewTimeOff.mutate({
      id: reviewingTimeOff.id,
      status: reviewForm.status,
      adminNotes: reviewForm.adminNotes || undefined,
    });
  }

  const pendingTimeOffCount = allTimeOff?.filter(r => r.status === "pending").length ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Calendar</h1>
            <p className="text-sm text-gray-500 mt-1">Manage tasks, assignments, and time-off requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTimeOffDialog(true)}>
              <CalendarOff className="h-4 w-4 mr-2" />
              Request Time Off
            </Button>
            {isAdmin && (
              <Button onClick={() => openCreateTask(new Date())}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timeoff">
              <CalendarOff className="h-4 w-4 mr-2" />
              Time-Off Requests
              {isAdmin && pendingTimeOffCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">{pendingTimeOffCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Calendar Tab ── */}
          <TabsContent value="calendar" className="mt-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 2, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">{MONTHS[month - 1]} {year}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-l border-t border-gray-200 rounded-lg overflow-hidden">
              {calendarDays.map((day, i) => {
                const isToday = day?.toDateString() === new Date().toDateString();
                const tasks = day ? tasksByDate[day.toDateString()] ?? [] : [];
                const timeOffs = day ? timeOffByDate[day.toDateString()] ?? [] : [];

                return (
                  <div
                    key={i}
                    className={`min-h-[110px] border-r border-b border-gray-200 p-1.5 ${day ? "bg-white hover:bg-gray-50 cursor-pointer" : "bg-gray-50"}`}
                    onClick={() => day && isAdmin && openCreateTask(day)}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-red-600 text-white" : "text-gray-700"}`}>
                          {day.getDate()}
                        </div>

                        {/* Time-off indicators */}
                        {timeOffs.slice(0, 2).map((to, j) => (
                          <div key={j} className="text-xs bg-orange-100 text-orange-700 rounded px-1 py-0.5 mb-0.5 truncate flex items-center gap-1">
                            <CalendarOff className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{to.userName.split(" ")[0]} off</span>
                          </div>
                        ))}

                        {/* Task pills */}
                        {tasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs text-white rounded px-1 py-0.5 mb-0.5 truncate flex items-center gap-1 ${CATEGORY_COLORS[task.category] ?? "bg-gray-500"}`}
                            onClick={(e) => { e.stopPropagation(); openEditTask(task); }}
                          >
                            {STATUS_ICONS[task.status]}
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {tasks.length > 3 && (
                          <div className="text-xs text-gray-500 pl-1">+{tasks.length - 3} more</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span className="capitalize">{cat}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300" />
                <span>Time Off</span>
              </div>
            </div>
          </TabsContent>

          {/* ── Time-Off Tab ── */}
          <TabsContent value="timeoff" className="mt-4 space-y-6">
            {/* My requests */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">My Time-Off Requests</h3>
              {!myTimeOff?.length ? (
                <p className="text-sm text-gray-500">No requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {myTimeOff.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium capitalize">{req.type} leave</div>
                        <div className="text-xs text-gray-500">
                          {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                        </div>
                        {req.reason && <div className="text-xs text-gray-400 mt-0.5">{req.reason}</div>}
                        {req.adminNotes && <div className="text-xs text-blue-600 mt-0.5">Admin note: {req.adminNotes}</div>}
                      </div>
                      <Badge variant={req.status === "approved" ? "default" : req.status === "denied" ? "destructive" : "secondary"}>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin: all requests */}
            {isAdmin && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">All Staff Requests</h3>
                {!allTimeOff?.length ? (
                  <p className="text-sm text-gray-500">No requests.</p>
                ) : (
                  <div className="space-y-2">
                    {allTimeOff.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">{req.userName} — <span className="capitalize">{req.type}</span></div>
                          <div className="text-xs text-gray-500">
                            {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                          </div>
                          {req.reason && <div className="text-xs text-gray-400 mt-0.5">{req.reason}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={req.status === "approved" ? "default" : req.status === "denied" ? "destructive" : "secondary"}>
                            {req.status}
                          </Badge>
                          {req.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => {
                              setReviewingTimeOff(req as TimeOff);
                              setReviewForm({ status: "approved", adminNotes: "" });
                              setShowTimeOffReviewDialog(true);
                            }}>
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Task Create/Edit Dialog ── */}
      <Dialog open={showTaskDialog} onOpenChange={(o) => { setShowTaskDialog(o); if (!o) { setEditingTask(null); resetTaskForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : `Add Task — ${selectedDay?.toLocaleDateString()}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Cover 6PM Dragon Kids class" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional details..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={taskForm.startTime} onChange={e => setTaskForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={taskForm.endTime} onChange={e => setTaskForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={taskForm.category} onValueChange={v => setTaskForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["class", "meeting", "cleaning", "event", "training", "other"].map(c => (
                      <SelectItem key={c} value={c}><span className="capitalize">{c}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isAdmin && (
              <div>
                <Label>Assign To</Label>
                <Select
                  value={taskForm.assignedToUserId}
                  onValueChange={v => {
                    const staff = staffList?.find(s => s.id.toString() === v);
                    setTaskForm(f => ({ ...f, assignedToUserId: v, assignedToName: staff?.name ?? staff?.email ?? "" }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Unassigned (all staff)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {staffList?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name ?? s.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingTask && (
              <>
                <div>
                  <Label>Status</Label>
                  <Select value={taskForm.status} onValueChange={v => setTaskForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Staff Notes</Label>
                  <Textarea value={taskForm.staffNotes} onChange={e => setTaskForm(f => ({ ...f, staffNotes: e.target.value }))} rows={2} placeholder="Add notes about this task..." />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            {editingTask && isAdmin && (
              <Button variant="destructive" size="sm" onClick={() => { deleteTask.mutate({ id: editingTask.id }); setShowTaskDialog(false); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
              <Button onClick={handleTaskSubmit} disabled={createTask.isPending || updateTask.isPending}>
                {(createTask.isPending || updateTask.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTask ? "Save Changes" : "Create Task"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Time-Off Request Dialog ── */}
      <Dialog open={showTimeOffDialog} onOpenChange={setShowTimeOffDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={timeOffForm.startDate} onChange={e => setTimeOffForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" value={timeOffForm.endDate} onChange={e => setTimeOffForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={timeOffForm.type} onValueChange={v => setTimeOffForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea value={timeOffForm.reason} onChange={e => setTimeOffForm(f => ({ ...f, reason: e.target.value }))} rows={2} placeholder="Brief explanation..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeOffDialog(false)}>Cancel</Button>
            <Button onClick={handleTimeOffSubmit} disabled={requestTimeOff.isPending}>
              {requestTimeOff.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Time-Off Review Dialog (admin) ── */}
      <Dialog open={showTimeOffReviewDialog} onOpenChange={setShowTimeOffReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Time-Off Request</DialogTitle>
          </DialogHeader>
          {reviewingTimeOff && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                <div><span className="font-medium">Staff:</span> {reviewingTimeOff.userName}</div>
                <div><span className="font-medium">Dates:</span> {new Date(reviewingTimeOff.startDate).toLocaleDateString()} – {new Date(reviewingTimeOff.endDate).toLocaleDateString()}</div>
                <div><span className="font-medium">Type:</span> <span className="capitalize">{reviewingTimeOff.type}</span></div>
                {reviewingTimeOff.reason && <div><span className="font-medium">Reason:</span> {reviewingTimeOff.reason}</div>}
              </div>
              <div>
                <Label>Decision</Label>
                <Select value={reviewForm.status} onValueChange={v => setReviewForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="denied">Deny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Admin Notes (optional)</Label>
                <Textarea value={reviewForm.adminNotes} onChange={e => setReviewForm(f => ({ ...f, adminNotes: e.target.value }))} rows={2} placeholder="e.g. Coverage arranged with..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeOffReviewDialog(false)}>Cancel</Button>
            <Button onClick={handleReviewSubmit} disabled={reviewTimeOff.isPending}>
              {reviewTimeOff.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
