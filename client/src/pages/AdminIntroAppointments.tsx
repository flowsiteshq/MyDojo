import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { LeadsKanbanBoard } from "@/components/LeadsKanbanBoard";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { PinConfirmDialog } from "@/components/PinConfirmDialog";
import { Plus, Edit, Trash2, Search, ExternalLink, LayoutGrid, List, Download, RefreshCw, UserX } from "lucide-react";
import { toast } from "sonner";

type ViewMode = "table" | "board";

type PipelineStage =
  | "new_lead"
  | "contacted"
  | "intro_scheduled"
  | "showed_up"
  | "offer_presented"
  | "enrolled"
  | "nurture";

export default function AdminIntroAppointments() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // PIN dialog state
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null); // null = bulk

  // Needs follow-up filter (not contacted in last 48h, not enrolled)
  const [needsFollowUp, setNeedsFollowUp] = useState(false);

  // Program tag filter
  const [programFilter, setProgramFilter] = useState<string>("all");

  // Source tag filter
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    program: "",
    scheduledTime: "",
    location: "Tomball HQ",
    introCountRequired: 2,
  });

  // Queries
  const { data: appointments, refetch } = trpc.admin.getAllIntroAppointments.useQuery();
  const utils = trpc.useUtils();

  // ── Facebook lead arrival toast ──────────────────────────────────────────────
  // Poll every 30 s; show a toast when a new Facebook lead arrives
  const lastFbLeadIdRef = useRef<number | null>(null);
  const { data: latestFbLead } = trpc.admin.getLatestFacebookLead.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  useEffect(() => {
    if (!latestFbLead) return;
    if (lastFbLeadIdRef.current === null) {
      lastFbLeadIdRef.current = latestFbLead.id;
      return;
    }
    if (latestFbLead.id !== lastFbLeadIdRef.current) {
      lastFbLeadIdRef.current = latestFbLead.id;
      toast.success(
        `📘 New Facebook Lead: ${latestFbLead.name} — ${latestFbLead.program}`,
        {
          description: `Phone: ${latestFbLead.phone || "N/A"} · Just arrived from Facebook Ads`,
          duration: 8000,
          action: { label: "View", onClick: () => refetch() },
        }
      );
      refetch();
    }
  }, [latestFbLead, refetch]);

  // Mutations
  const createMutation = trpc.admin.createIntroAppointment.useMutation({
    onSuccess: () => {
      toast.success("Lead created successfully");
      refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create lead");
    },
  });

  const updateMutation = trpc.admin.updateIntroAppointment.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      refetch();
      setEditingAppointment(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lead");
    },
  });

  const deleteMutation = trpc.admin.deleteIntroAppointment.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      setPinDialogOpen(false);
      setPendingDeleteId(null);
      setPinError(null);
      refetch();
    },
    onError: (error) => {
      setPinError(error.message || "Failed to delete lead");
    },
  });

  const bulkDeleteMutation = trpc.admin.bulkDeleteLeads.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} lead${data.deletedCount === 1 ? "" : "s"} deleted`);
      setSelectedIds(new Set());
      setIsBulkDeleteDialogOpen(false);
      setPinDialogOpen(false);
      setPinError(null);
      utils.admin.getAllIntroAppointments.invalidate();
    },
    onError: (error) => {
      setPinError(error.message || "Failed to delete leads");
    },
  });

  const updateStageMutation = trpc.admin.updateLeadPipelineStage.useMutation({
    onSuccess: () => {
      utils.admin.getAllIntroAppointments.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update stage");
      refetch();
    },
  });

  const ghlSyncMutation = trpc.admin.triggerGHLSync.useMutation({
    onSuccess: () => {
      toast.success("GHL sync complete — new leads imported!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "GHL sync failed");
    },
  });

  const noShowMutation = trpc.admin.triggerNoShowFollowUp.useMutation({
    onSuccess: () => {
      toast.success("No-show follow-up SMS sent to eligible leads!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "No-show follow-up failed");
    },
  });

  const { data: noShowStats } = trpc.admin.getNoShowStats.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      program: "",
      scheduledTime: "",
      location: "Tomball HQ",
      introCountRequired: 2,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAppointment) {
      updateMutation.mutate({
        id: editingAppointment.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment);
    setFormData({
      name: appointment.name,
      phone: appointment.phone || "",
      email: appointment.email || "",
      program: appointment.program,
      scheduledTime: appointment.scheduledTime
        ? new Date(appointment.scheduledTime).toISOString().slice(0, 16)
        : "",
      location: appointment.location || "Tomball HQ",
      introCountRequired: appointment.introCountRequired || 2,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setPendingDeleteId(id);
    setPinError(null);
    setPinDialogOpen(true);
  };

  const handleStageChange = (id: number, stage: PipelineStage) => {
    updateStageMutation.mutate({ id, pipelineStage: stage });
  };

  // ── Multi-select helpers ──────────────────────────────────────────────────
  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filteredAppointments) return;
    if (selectedIds.size === filteredAppointments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAppointments.map((a: any) => a.id)));
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteDialogOpen(false);
    setPendingDeleteId(null); // null signals bulk
    setPinError(null);
    setPinDialogOpen(true);
  };

  const handlePinConfirm = (pin: string) => {
    setPinError(null);
    if (pendingDeleteId !== null) {
      // Single delete
      deleteMutation.mutate({ id: pendingDeleteId, pin });
    } else {
      // Bulk delete
      bulkDeleteMutation.mutate({ ids: Array.from(selectedIds), pin });
    }
  };

  // Filter appointments
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  const needsFollowUpCount = appointments?.filter((apt: any) => {
    if (apt.pipelineStage === "enrolled") return false;
    const now = Date.now();
    if (!apt.lastContactedAt) return true; // never contacted
    return now - new Date(apt.lastContactedAt).getTime() > FORTY_EIGHT_HOURS_MS;
  }).length ?? 0;

  const filteredAppointments = appointments?.filter((apt: any) => {
    const matchesSearch =
      apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone?.includes(searchQuery) ||
      apt.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesProgram = programFilter === "all" || (apt.program ?? "").toLowerCase() === programFilter.toLowerCase();
    const aptSource = (apt.source ?? "").toLowerCase();
    const matchesSource = sourceFilter === "all" || (
      sourceFilter === "facebook" ? aptSource.startsWith("facebook") :
      sourceFilter === "ghl" ? (aptSource.startsWith("ghl") || aptSource === "gohighlevel") :
      sourceFilter === "website" ? ["chatbot", "landing_page", "trial_form", "website"].includes(aptSource) :
      sourceFilter === "kiosk" ? aptSource === "kiosk" :
      sourceFilter === "sms_ai" ? aptSource === "sms_ai" :
      aptSource === sourceFilter
    );
    const matchesFollowUp = !needsFollowUp || (() => {
      if (apt.pipelineStage === "enrolled") return false;
      const now = Date.now();
      if (!apt.lastContactedAt) return true;
      return now - new Date(apt.lastContactedAt).getTime() > FORTY_EIGHT_HOURS_MS;
    })();
    return matchesSearch && matchesStatus && matchesProgram && matchesSource && matchesFollowUp;
  // Sort newest first (most recently added lead at the top of each column)
  }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allSelected =
    !!filteredAppointments &&
    filteredAppointments.length > 0 &&
    selectedIds.size === filteredAppointments.length;
  const someSelected = selectedIds.size > 0;

  // ── CSV export ───────────────────────────────────────────────────────────
  const stageLabel: Record<string, string> = {
    new_lead: "New Lead",
    contacted: "Contacted",
    intro_scheduled: "Intro Scheduled",
    showed_up: "Showed Up",
    offer_presented: "Offer Presented",
    enrolled: "Enrolled",
    nurture: "Nurture",
  };

  const escapeCsv = (val: unknown): string => {
    const str = val == null ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const handleExportCsv = () => {
    if (!filteredAppointments) return;
    const rows = someSelected
      ? filteredAppointments.filter((a: any) => selectedIds.has(a.id))
      : filteredAppointments;

    const headers = [
      "Name", "Phone", "Email", "Program", "Pipeline Stage",
      "Status", "Source", "Scheduled Time", "Date Added",
      "Last Contacted", "Last Contact Method",
      "Intro Progress", "Location", "Notes",
    ];

    const csvRows = rows.map((apt: any) => [
      escapeCsv(apt.name),
      escapeCsv(apt.phone),
      escapeCsv(apt.email),
      escapeCsv(apt.program),
      escapeCsv(stageLabel[apt.pipelineStage ?? "new_lead"] ?? apt.pipelineStage),
      escapeCsv(apt.status),
      escapeCsv(apt.source),
      escapeCsv(apt.scheduledTime ? new Date(apt.scheduledTime).toLocaleString("en-US", { timeZone: "America/Chicago" }) : ""),
      escapeCsv(apt.createdAt ? new Date(apt.createdAt).toLocaleString("en-US", { timeZone: "America/Chicago" }) : ""),
      escapeCsv(apt.lastContactedAt ? new Date(apt.lastContactedAt).toLocaleString("en-US", { timeZone: "America/Chicago" }) : ""),
      escapeCsv(apt.lastContactMethod ?? ""),
      escapeCsv(`${apt.introCountCompleted ?? 0}/${apt.introCountRequired ?? 0}`),
      escapeCsv(apt.location),
      escapeCsv(apt.notes),
    ].join(","));

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} lead${rows.length === 1 ? "" : "s"} to CSV`);
  };

  return (
    <AdminLayout>
      <div>
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
            <p className="text-gray-600">Manage trial lessons and new student leads</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "board"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Board
              </button>
            </div>

            {/* GHL Sync button */}
            <Button
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={() => ghlSyncMutation.mutate()}
              disabled={ghlSyncMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${ghlSyncMutation.isPending ? "animate-spin" : ""}`} />
              {ghlSyncMutation.isPending ? "Syncing GHL..." : "Sync GHL"}
            </Button>

            {/* No-Show Follow-Up button */}
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 relative"
              onClick={() => noShowMutation.mutate()}
              disabled={noShowMutation.isPending}
              title={noShowStats?.pending ? `${noShowStats.pending} lead(s) need follow-up` : "No pending no-shows"}
            >
              <UserX className={`w-4 h-4 mr-2 ${noShowMutation.isPending ? "animate-pulse" : ""}`} />
              {noShowMutation.isPending ? "Sending..." : "No-Show Follow-Up"}
              {(noShowStats?.pending ?? 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {noShowStats!.pending}
                </span>
              )}
            </Button>

            {/* Add Lead dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#E10600] hover:bg-[#C10500] text-white"
                  onClick={() => {
                    setEditingAppointment(null);
                    resetForm();
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingAppointment ? "Edit Lead" : "Add New Lead"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Student Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="program">Program *</Label>
                      <Select
                        value={formData.program}
                        onValueChange={(value) =>
                          setFormData({ ...formData, program: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Little Ninjas">Little Ninjas</SelectItem>
                          <SelectItem value="Dragon Kids">Dragon Kids</SelectItem>
                          <SelectItem value="Teens">Teens</SelectItem>
                          <SelectItem value="Adult Karate">Adult Karate</SelectItem>
                          <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                          <SelectItem value="After School">After School</SelectItem>
                          <SelectItem value="Not Sure">Not Sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduledTime">Scheduled Time</Label>
                      <Input
                        id="scheduledTime"
                        type="datetime-local"
                        value={formData.scheduledTime}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledTime: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="introCountRequired">Intro Classes Required</Label>
                      <Input
                        id="introCountRequired"
                        type="number"
                        min={1}
                        max={5}
                        value={formData.introCountRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            introCountRequired: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingAppointment(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#E10600] hover:bg-[#C10500] text-white"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingAppointment ? "Save Changes" : "Add Lead"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, phone, or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setNeedsFollowUp((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors whitespace-nowrap ${
              needsFollowUp
                ? "bg-amber-50 border-amber-400 text-amber-800 hover:bg-amber-100"
                : "bg-white border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700"
            }`}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
              needsFollowUp ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {needsFollowUpCount}
            </span>
            Needs Follow-up
          </button>
        </div>

        {/* Program tag filter pills */}
        {(() => {
          const programs = ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Not Sure"];
          const programColors: Record<string, string> = {
            "Little Ninjas":  "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
            "Dragon Kids":    "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
            "Teens":          "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
            "Adult Karate":   "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
            "Kickboxing":     "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
            "After School":   "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
            "Not Sure":       "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
          };
          const programActiveColors: Record<string, string> = {
            "Little Ninjas":  "bg-pink-500 text-white border-pink-500",
            "Dragon Kids":    "bg-orange-500 text-white border-orange-500",
            "Teens":          "bg-blue-500 text-white border-blue-500",
            "Adult Karate":   "bg-purple-500 text-white border-purple-500",
            "Kickboxing":     "bg-red-600 text-white border-red-600",
            "After School":   "bg-green-500 text-white border-green-500",
            "Not Sure":       "bg-gray-500 text-white border-gray-500",
          };
          // Count leads per program (from unfiltered appointments)
          const counts: Record<string, number> = {};
          appointments?.forEach((apt: any) => {
            const p = apt.program ?? "Not Sure";
            counts[p] = (counts[p] ?? 0) + 1;
          });
          return (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setProgramFilter("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                  programFilter === "all"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                All Programs
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  programFilter === "all" ? "bg-white text-gray-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {appointments?.length ?? 0}
                </span>
              </button>
              {programs.map(prog => {
                const count = counts[prog] ?? 0;
                if (count === 0) return null;
                const isActive = programFilter.toLowerCase() === prog.toLowerCase();
                return (
                  <button
                    key={prog}
                    onClick={() => setProgramFilter(isActive ? "all" : prog)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                      isActive ? programActiveColors[prog] : programColors[prog]
                    }`}
                  >
                    {prog}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/30 text-white" : "bg-white/60 text-current"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Source tag filter pills */}
        {(() => {
          // Normalize raw source values into display buckets
          const normalizeSource = (raw: string) => {
            const s = (raw ?? "").toLowerCase();
            if (s.startsWith("facebook")) return "Facebook";
            if (s.startsWith("ghl") || s === "gohighlevel") return "GoHighLevel";
            if (["chatbot", "landing_page", "trial_form", "website"].includes(s)) return "Website";
            if (s === "kiosk") return "Kiosk";
            if (s === "sms_ai") return "SMS AI";
            if (s === "") return "Manual";
            return raw; // keep unknown sources as-is
          };

          const sourceColors: Record<string, string> = {
            "Facebook":    "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
            "GoHighLevel": "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
            "Website":     "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
            "Kiosk":       "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200",
            "SMS AI":      "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200",
            "Manual":      "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
          };
          const sourceActiveColors: Record<string, string> = {
            "Facebook":    "bg-blue-600 text-white border-blue-600",
            "GoHighLevel": "bg-orange-500 text-white border-orange-500",
            "Website":     "bg-emerald-600 text-white border-emerald-600",
            "Kiosk":       "bg-violet-600 text-white border-violet-600",
            "SMS AI":      "bg-teal-600 text-white border-teal-600",
            "Manual":      "bg-gray-500 text-white border-gray-500",
          };
          const filterKeys: Record<string, string> = {
            "Facebook":    "facebook",
            "GoHighLevel": "ghl",
            "Website":     "website",
            "Kiosk":       "kiosk",
            "SMS AI":      "sms_ai",
            "Manual":      "",
          };

          // Count leads per normalized source bucket
          const counts: Record<string, number> = {};
          appointments?.forEach((apt: any) => {
            const bucket = normalizeSource(apt.source ?? "");
            counts[bucket] = (counts[bucket] ?? 0) + 1;
          });

          const buckets = Object.keys(counts).sort();
          if (buckets.length <= 1) return null; // only show if there are multiple sources

          return (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSourceFilter("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                  sourceFilter === "all"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                All Sources
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  sourceFilter === "all" ? "bg-white text-gray-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {appointments?.length ?? 0}
                </span>
              </button>
              {buckets.map(bucket => {
                const count = counts[bucket] ?? 0;
                const key = filterKeys[bucket] ?? bucket.toLowerCase();
                const isActive = sourceFilter === key || (key === "" && sourceFilter === "");
                const color = sourceColors[bucket] ?? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
                const activeColor = sourceActiveColors[bucket] ?? "bg-gray-500 text-white border-gray-500";
                return (
                  <button
                    key={bucket}
                    onClick={() => setSourceFilter(isActive ? "all" : key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                      isActive ? activeColor : color
                    }`}
                  >
                    {bucket}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/30 text-white" : "bg-white/60 text-current"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* ── BOARD VIEW ── */}
        {viewMode === "board" && (
          <div className="overflow-x-auto -mx-2 px-2">
            {filteredAppointments && filteredAppointments.length > 0 ? (
              <LeadsKanbanBoard
                leads={filteredAppointments as any}
                onStageChange={handleStageChange}
                onRefresh={() => utils.admin.getAllIntroAppointments.invalidate()}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                No leads found. Add your first lead above.
              </div>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {viewMode === "table" && (
          <Card>
            {/* Bulk action bar — shown when at least one row is selected */}
            {someSelected && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-100 rounded-t-lg">
                <span className="text-sm font-medium text-blue-800">
                  {selectedIds.size} lead{selectedIds.size === 1 ? "" : "s"} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Deselect all
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white"
                    onClick={handleExportCsv}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Export CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete {selectedIds.size} lead{selectedIds.size === 1 ? "" : "s"}
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {/* Select-all checkbox */}
                    <th className="pl-4 pr-2 py-3 w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all leads"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contacted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pipeline Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments && filteredAppointments.length > 0 ? (
                    filteredAppointments.map((apt: any) => {
                      const aptTime = apt.scheduledTime
                        ? new Date(apt.scheduledTime)
                        : null;
                      const timeStr = aptTime
                        ? aptTime.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "TBD";

                      const createdAt = apt.createdAt ? new Date(apt.createdAt) : null;
                      const createdStr = createdAt
                        ? createdAt.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "—";

                      const stageLabel: Record<string, string> = {
                        new_lead: "New Lead",
                        contacted: "Contacted",
                        intro_scheduled: "Intro Scheduled",
                        showed_up: "Showed Up",
                        offer_presented: "Offer Presented",
                        enrolled: "Enrolled",
                        nurture: "Nurture",
                      };

                      const stageBadgeClass: Record<string, string> = {
                        new_lead: "bg-slate-100 text-slate-700",
                        contacted: "bg-blue-100 text-blue-700",
                        intro_scheduled: "bg-indigo-100 text-indigo-700",
                        showed_up: "bg-yellow-100 text-yellow-700",
                        offer_presented: "bg-orange-100 text-orange-700",
                        enrolled: "bg-green-100 text-green-700",
                        nurture: "bg-purple-100 text-purple-700",
                      };

                      const stage = apt.pipelineStage || "new_lead";
                      const isChecked = selectedIds.has(apt.id);

                      return (
                        <tr
                          key={apt.id}
                          className={`hover:bg-gray-50 cursor-pointer transition-colors ${isChecked ? "bg-blue-50 hover:bg-blue-50" : ""}`}
                          onClick={() => setSelectedLeadId(apt.id)}
                        >
                          {/* Row checkbox */}
                          <td
                            className="pl-4 pr-2 py-4 w-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleSelectOne(apt.id)}
                              aria-label={`Select ${apt.name}`}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{apt.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{apt.phone}</div>
                            <div className="text-sm text-gray-500">{apt.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {apt.program}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {timeStr}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {createdStr}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {apt.lastContactedAt ? (
                              <div>
                                <div className="text-gray-900">
                                  {new Date(apt.lastContactedAt).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                                {apt.lastContactMethod && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                    apt.lastContactMethod === 'call' ? 'bg-red-100 text-red-700' :
                                    apt.lastContactMethod === 'text' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {apt.lastContactMethod}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Never</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageBadgeClass[stage] || "bg-gray-100 text-gray-700"}`}>
                              {stageLabel[stage] || stage}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {apt.introCountCompleted || 0}/{apt.introCountRequired || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {apt.source?.startsWith("ghl") ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                <ExternalLink className="w-3 h-3" />
                                GHL{apt.source !== "ghl" ? ` · ${apt.source.replace("ghl:", "")}` : ""}
                              </span>
                            ) : apt.source === "chatbot" || !apt.source ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Chatbot
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                {apt.source}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                apt.status === "scheduled"
                                  ? "bg-blue-100 text-blue-800"
                                  : apt.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : apt.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleEdit(apt); }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDelete(apt.id); }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                        No leads found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Bulk delete confirmation dialog — now just triggers PIN dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} lead{selectedIds.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedIds.size === 1 ? "this lead" : `these ${selectedIds.size} leads`}. You will be asked to enter your security PIN.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN confirmation dialog */}
      <PinConfirmDialog
        open={pinDialogOpen}
        onClose={() => { setPinDialogOpen(false); setPinError(null); setPendingDeleteId(null); }}
        onConfirm={handlePinConfirm}
        isPending={deleteMutation.isPending || bulkDeleteMutation.isPending}
        error={pinError}
        actionLabel="Delete"
        description={
          pendingDeleteId !== null
            ? "Enter your 6-digit security PIN to permanently delete this lead."
            : `Enter your 6-digit security PIN to permanently delete ${selectedIds.size} lead${selectedIds.size === 1 ? "" : "s"}.`
        }
      />

      {/* Lead detail slide-out panel */}
      <LeadDetailPanel
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onStageChange={(id, stage) => handleStageChange(id, stage)}
        onRefresh={() => utils.admin.getAllIntroAppointments.invalidate()}
      />
    </AdminLayout>
  );
}
