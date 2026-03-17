import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, User, ToggleLeft, ToggleRight } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const PROGRAMS = ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Summer Camp"] as const;

const DAY_ORDER: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6,
};

const PROGRAM_COLORS: Record<string, string> = {
  "Little Ninjas": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Dragon Kids": "bg-orange-100 text-orange-800 border-orange-200",
  "Teens": "bg-blue-100 text-blue-800 border-blue-200",
  "Adult Karate": "bg-red-100 text-red-800 border-red-200",
  "Kickboxing": "bg-purple-100 text-purple-800 border-purple-200",
  "After School": "bg-green-100 text-green-800 border-green-200",
  "Summer Camp": "bg-cyan-100 text-cyan-800 border-cyan-200",
};

type ClassForm = {
  program: typeof PROGRAMS[number];
  location: string;
  dayOfWeek: typeof DAYS[number];
  startTime: string;
  endTime: string;
  instructor: string;
};

const defaultForm: ClassForm = {
  program: "Adult Karate",
  location: "Tomball",
  dayOfWeek: "Monday",
  startTime: "6:00 PM",
  endTime: "7:00 PM",
  instructor: "",
};

export default function AdminClasses() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClassForm>(defaultForm);
  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");

  const { data: classes = [], refetch } = trpc.admin.getAllClasses.useQuery();

  const createClass = trpc.admin.createClass.useMutation({
    onSuccess: () => { toast.success("Class created"); refetch(); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateClass = trpc.admin.updateClass.useMutation({
    onSuccess: () => { toast.success("Class updated"); refetch(); setShowModal(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteClass = trpc.admin.deleteClass.useMutation({
    onSuccess: () => { toast.success("Class deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.admin.updateClass.useMutation({
    onSuccess: () => refetch(),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (cls: typeof classes[0]) => {
    setEditingId(cls.id);
    setForm({
      program: cls.program,
      location: cls.location,
      dayOfWeek: cls.dayOfWeek,
      startTime: cls.startTime,
      endTime: cls.endTime,
      instructor: cls.instructor || "",
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId !== null) {
      updateClass.mutate({ id: editingId, ...form, instructor: form.instructor || undefined });
    } else {
      createClass.mutate({ ...form, instructor: form.instructor || undefined });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this class? This cannot be undone.")) {
      deleteClass.mutate({ id });
    }
  };

  // Filter and group by day
  const filtered = classes.filter(c => {
    if (filterDay !== "all" && c.dayOfWeek !== filterDay) return false;
    if (filterProgram !== "all" && c.program !== filterProgram) return false;
    return true;
  });

  const grouped = DAYS.reduce((acc, day) => {
    const dayClasses = filtered.filter(c => c.dayOfWeek === day);
    if (dayClasses.length > 0) acc[day] = dayClasses;
    return acc;
  }, {} as Record<string, typeof classes>);

  const activeCount = classes.filter(c => c.isActive === 1).length;
  const totalCount = classes.length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeCount} active classes · {totalCount} total
            </p>
          </div>
          <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PROGRAMS.map(prog => {
            const count = classes.filter(c => c.program === prog && c.isActive === 1).length;
            return (
              <div key={prog} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mb-2 ${PROGRAM_COLORS[prog]}`}>
                  {prog}
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500">active classes/week</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterDay !== "all" || filterProgram !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterDay("all"); setFilterProgram("all"); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Schedule by Day */}
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No classes found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {totalCount === 0 ? "Add your first class to get started." : "Try adjusting your filters."}
            </p>
            {totalCount === 0 && (
              <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white">
                Add First Class
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS.filter(d => grouped[d]).map(day => (
              <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-800">{day}</h2>
                  <span className="text-xs text-gray-500 ml-1">({grouped[day].length} class{grouped[day].length !== 1 ? "es" : ""})</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {grouped[day].map(cls => (
                    <div key={cls.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${cls.isActive !== 1 ? "opacity-50" : ""}`}>
                      {/* Time */}
                      <div className="flex items-center gap-1.5 min-w-[140px]">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">{cls.startTime} – {cls.endTime}</span>
                      </div>
                      {/* Program badge */}
                      <Badge className={`text-xs border ${PROGRAM_COLORS[cls.program]} font-medium min-w-[100px] justify-center`}>
                        {cls.program}
                      </Badge>
                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-[100px]">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {cls.location}
                      </div>
                      {/* Instructor */}
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 flex-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {cls.instructor || <span className="text-gray-400 italic">No instructor assigned</span>}
                      </div>
                      {/* Active toggle */}
                      <button
                        onClick={() => toggleActive.mutate({ id: cls.id, isActive: cls.isActive === 1 ? 0 : 1 })}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title={cls.isActive === 1 ? "Deactivate class" : "Activate class"}
                      >
                        {cls.isActive === 1
                          ? <ToggleRight className="h-5 w-5 text-green-500" />
                          : <ToggleLeft className="h-5 w-5 text-gray-400" />
                        }
                      </button>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cls)} className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cls.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Program</Label>
                <Select value={form.program} onValueChange={v => setForm(f => ({ ...f, program: v as typeof PROGRAMS[number] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Day of Week</Label>
                <Select value={form.dayOfWeek} onValueChange={v => setForm(f => ({ ...f, dayOfWeek: v as typeof DAYS[number] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  placeholder="e.g. 6:00 PM"
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  placeholder="e.g. 7:00 PM"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Tomball"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instructor <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                value={form.instructor}
                onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))}
                placeholder="e.g. Sensei Johnson"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createClass.isPending || updateClass.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {editingId !== null ? "Save Changes" : "Add Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
