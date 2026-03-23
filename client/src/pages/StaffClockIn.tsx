import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, Plus, Trash2, Users, BookOpen, Timer, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const PROGRAMS = [
  "Little Ninjas",
  "Little Ninjas & Me",
  "Dragon Kids",
  "Dragon Kids & Teens",
  "Teens",
  "Teen Warriors",
  "Adult Karate",
  "Adult Karate + Kickboxing",
  "Kickboxing",
  "After School",
  "Summer Camp",
  "Intro Class",
  "Leadership",
  "Sparring",
  "Weapons Class",
  "Women's Self-Defense",
  "Advanced/Black Belt + Kickboxing",
  "Family Class",
  "Instructor Training",
  "Demo/Competition Team",
];

function formatDuration(startMs: number): string {
  const diff = Date.now() - startMs;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTotalMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StaffClockIn() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: activeShift, isLoading: shiftLoading } = trpc.staffTime.getActiveShift.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );

  const clockInMutation = trpc.staffTime.clockIn.useMutation({
    onSuccess: () => {
      toast.success("Clocked in! Have a great shift 💪");
      utils.staffTime.getActiveShift.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const clockOutMutation = trpc.staffTime.clockOut.useMutation({
    onSuccess: (data) => {
      toast.success(`Clocked out! Total: ${formatTotalMinutes(data.totalMinutes)}`);
      utils.staffTime.getActiveShift.invalidate();
      setClockOutNotes("");
      setShowClockOutDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const logClassMutation = trpc.staffTime.logClass.useMutation({
    onSuccess: () => {
      toast.success("Class logged!");
      utils.staffTime.getActiveShift.invalidate();
      setShowLogClassDialog(false);
      setClassForm({ program: "", studentCount: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteClassMutation = trpc.staffTime.deleteClass.useMutation({
    onSuccess: () => {
      toast.success("Class removed");
      utils.staffTime.getActiveShift.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState("");
  const [showLogClassDialog, setShowLogClassDialog] = useState(false);
  const [classForm, setClassForm] = useState({ program: "", studentCount: "", notes: "" });

  if (loading || shiftLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-sm">
          <Clock className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Staff Time Clock</h2>
          <p className="text-gray-500 mb-4">Please log in to access the time clock.</p>
          <Link href="/admin/login">
            <Button className="bg-red-600 hover:bg-red-700 text-white w-full">Log In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isClockedIn = !!activeShift;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-red-500" />
          <span className="font-heading font-bold text-lg tracking-wide">STAFF TIME CLOCK</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">{user?.name ?? user?.email}</span>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800">
              Admin Portal
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Status Card */}
        <Card className={`p-6 border-2 ${isClockedIn ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isClockedIn ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              <span className="font-bold text-lg">{isClockedIn ? "ON SHIFT" : "OFF SHIFT"}</span>
            </div>
            {isClockedIn && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <Timer className="h-3 w-3 mr-1" />
                {formatDuration(activeShift.shift.clockInAt)}
              </Badge>
            )}
          </div>

          {isClockedIn ? (
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Clocked in:</span> {formatTime(activeShift.shift.clockInAt)}</p>
              <p><span className="font-medium">Location:</span> {activeShift.shift.location ?? "HQ"}</p>
              <p><span className="font-medium">Classes taught:</span> {activeShift.classes.length}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">You are not currently clocked in. Press the button below to start your shift.</p>
          )}
        </Card>

        {/* Action Buttons */}
        {!isClockedIn ? (
          <Button
            className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white font-heading uppercase tracking-wider"
            onClick={() => clockInMutation.mutate({ location: "HQ" })}
            disabled={clockInMutation.isPending}
          >
            <LogIn className="h-5 w-5 mr-2" />
            {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-14 border-2 border-blue-500 text-blue-700 hover:bg-blue-50 font-semibold"
              onClick={() => setShowLogClassDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Class
            </Button>
            <Button
              className="h-14 bg-red-600 hover:bg-red-700 text-white font-heading uppercase tracking-wider"
              onClick={() => setShowClockOutDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Clock Out
            </Button>
          </div>
        )}

        {/* Classes Taught This Shift */}
        {isClockedIn && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-gray-900">Classes Taught This Shift</h3>
            </div>
            {activeShift.classes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No classes logged yet. Tap "Log Class" to add one.</p>
            ) : (
              <div className="space-y-3">
                {activeShift.classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{cls.program}</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(cls.classStartAt)}
                        {cls.studentCount != null && ` · ${cls.studentCount} students`}
                        {cls.notes && ` · ${cls.notes}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteClassMutation.mutate({ classId: cls.id })}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Clock Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Clock Out
            </DialogTitle>
          </DialogHeader>
          {activeShift && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p><span className="font-medium">Shift started:</span> {formatTime(activeShift.shift.clockInAt)}</p>
                <p><span className="font-medium">Duration so far:</span> {formatDuration(activeShift.shift.clockInAt)}</p>
                <p><span className="font-medium">Classes logged:</span> {activeShift.classes.length}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
                <Textarea
                  placeholder="Any notes about your shift..."
                  value={clockOutNotes}
                  onChange={(e) => setClockOutNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClockOutDialog(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => clockOutMutation.mutate({ notes: clockOutNotes || undefined })}
              disabled={clockOutMutation.isPending}
            >
              {clockOutMutation.isPending ? "Clocking Out..." : "Confirm Clock Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Class Dialog */}
      <Dialog open={showLogClassDialog} onOpenChange={setShowLogClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Log a Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Program *</label>
              <Select value={classForm.program} onValueChange={(v) => setClassForm(f => ({ ...f, program: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program..." />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                <Users className="h-3 w-3 inline mr-1" />
                Student Count (optional)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 12"
                value={classForm.studentCount}
                onChange={(e) => setClassForm(f => ({ ...f, studentCount: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
              <Input
                placeholder="e.g. Board breaking day, great energy!"
                value={classForm.notes}
                onChange={(e) => setClassForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogClassDialog(false)}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!classForm.program || logClassMutation.isPending}
              onClick={() => logClassMutation.mutate({
                program: classForm.program,
                classStartAt: Date.now(),
                studentCount: classForm.studentCount ? parseInt(classForm.studentCount) : undefined,
                notes: classForm.notes || undefined,
              })}
            >
              {logClassMutation.isPending ? "Saving..." : "Log Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
