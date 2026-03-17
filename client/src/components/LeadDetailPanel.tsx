import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Tag,
  User,
  MessageSquare,
  CheckCircle,
  Clock,
  ExternalLink,
  Edit3,
  Save,
  ChevronDown,
  UserCheck,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type PipelineStage =
  | "new_lead"
  | "contacted"
  | "intro_scheduled"
  | "showed_up"
  | "offer_presented"
  | "enrolled"
  | "nurture";

type LeadStatus = "new" | "contacted" | "scheduled" | "completed" | "cancelled";

interface LeadDetailPanelProps {
  leadId: number | null;
  onClose: () => void;
  onStageChange?: (id: number, stage: PipelineStage) => void;
  onRefresh?: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  new_lead:        { label: "New Lead",        color: "text-slate-700",  bg: "bg-slate-100" },
  contacted:       { label: "Contacted",       color: "text-blue-700",   bg: "bg-blue-100" },
  intro_scheduled: { label: "Intro Scheduled", color: "text-indigo-700", bg: "bg-indigo-100" },
  showed_up:       { label: "Showed Up",       color: "text-yellow-700", bg: "bg-yellow-100" },
  offer_presented: { label: "Offer Presented", color: "text-orange-700", bg: "bg-orange-100" },
  enrolled:        { label: "Enrolled",        color: "text-green-700",  bg: "bg-green-100" },
  nurture:         { label: "Nurture",         color: "text-purple-700", bg: "bg-purple-100" },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new:       { label: "New",       color: "bg-gray-100 text-gray-700" },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Scheduled", color: "bg-indigo-100 text-indigo-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadDetailPanel({ leadId, onClose, onStageChange, onRefresh }: LeadDetailPanelProps) {
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [localStage, setLocalStage] = useState<PipelineStage | null>(null);
  const [localStatus, setLocalStatus] = useState<LeadStatus | null>(null);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const { data: lead, isLoading } = trpc.admin.getLeadById.useQuery(
    { id: leadId! },
    { enabled: leadId != null }
  );

  const updateNotesMutation = trpc.admin.updateLeadNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes saved");
      setIsEditingNotes(false);
      utils.admin.getLeadById.invalidate({ id: leadId! });
      onRefresh?.();
    },
    onError: () => toast.error("Failed to save notes"),
  });

  const updateStageMutation = trpc.admin.updateLeadPipelineStage.useMutation({
    onSuccess: () => {
      toast.success("Stage updated");
      utils.admin.getLeadById.invalidate({ id: leadId! });
      utils.admin.getAllIntroAppointments.invalidate();
      onRefresh?.();
    },
    onError: () => {
      toast.error("Failed to update stage");
      setLocalStage(lead?.pipelineStage as PipelineStage ?? null);
    },
  });

  const updateStatusMutation = trpc.admin.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.admin.getLeadById.invalidate({ id: leadId! });
      utils.admin.getAllIntroAppointments.invalidate();
      onRefresh?.();
    },
    onError: () => {
      toast.error("Failed to update status");
      setLocalStatus(lead?.status as LeadStatus ?? null);
    },
  });

  // Sync local state when lead data arrives
  useEffect(() => {
    if (lead) {
      setNotes(lead.notes ?? "");
      setLocalStage(lead.pipelineStage as PipelineStage);
      setLocalStatus(lead.status as LeadStatus);
    }
  }, [lead]);

  // Focus textarea when editing
  useEffect(() => {
    if (isEditingNotes) notesRef.current?.focus();
  }, [isEditingNotes]);

  const handleStageChange = (stage: PipelineStage) => {
    setLocalStage(stage);
    updateStageMutation.mutate({ id: leadId!, pipelineStage: stage });
    onStageChange?.(leadId!, stage);
    // Auto-trigger commission when moved to enrolled
    if (stage === 'enrolled' && leadId) {
      triggerCommissionMutation.mutate({ leadId });
    }
  };

  const handleStatusChange = (status: LeadStatus) => {
    setLocalStatus(status);
    updateStatusMutation.mutate({ id: leadId!, status });
  };

  // Staff assignment
  const { data: staffList } = trpc.commissions.getStaffList.useQuery(undefined, {
    staleTime: 60_000,
  });

  const assignLeadMutation = trpc.commissions.assignLead.useMutation({
    onSuccess: (data) => {
      toast.success(data.assignedTo ? `Assigned to ${data.assignedTo}` : 'Assignment removed');
      utils.admin.getLeadById.invalidate({ id: leadId! });
      onRefresh?.();
    },
    onError: () => toast.error('Failed to update assignment'),
  });

  const triggerCommissionMutation = trpc.commissions.triggerEnrollmentCommission.useMutation({
    onSuccess: (data) => {
      if (data.commissionCreated) {
        const amount = (data.bonusAmountCents ?? 5000) / 100;
        toast.success(`Commission of $${amount.toFixed(2)} created for ${lead?.assignedStaffName}!`);
      }
    },
    onError: () => {},
  });

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({ id: leadId!, notes });
  };

  // Intro lesson booking
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [introDateTime, setIntroDateTime] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [bookingMode, setBookingMode] = useState<"slot" | "manual">("slot");

  // Fetch class slots for the lead's program
  const { data: classSlots = [] } = trpc.admin.getClassSchedulesByProgram.useQuery(
    { program: lead?.program ?? "" },
    { enabled: showBookingForm && !!lead?.program }
  );

  const scheduleIntroMutation = trpc.admin.scheduleIntroLesson.useMutation({
    onSuccess: () => {
      toast.success("Intro lesson scheduled! Lead moved to Intro Scheduled.");
      setShowBookingForm(false);
      setIntroDateTime("");
      setSelectedSlotId(null);
      utils.admin.getLeadById.invalidate({ id: leadId! });
      utils.admin.getAllIntroAppointments.invalidate();
      onRefresh?.();
    },
    onError: (err) => toast.error(err.message ?? "Failed to schedule intro lesson"),
  });

  // Day ordering helper
  const DAY_ORDER: Record<string, number> = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
    Friday: 4, Saturday: 5, Sunday: 6,
  };

  // Build the next occurrence date for a given day + time
  function nextOccurrence(dayOfWeek: string, startTime: string): Date {
    const now = new Date();
    const targetDay = DAY_ORDER[dayOfWeek] ?? 0;
    const todayDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    let daysAhead = (targetDay - todayDay + 7) % 7;
    if (daysAhead === 0) daysAhead = 7; // always pick next week if same day
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    // Parse time e.g. "5:30 PM"
    const match = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      d.setHours(h, m, 0, 0);
    }
    return d;
  }

  const handleScheduleIntro = () => {
    if (!leadId) return;
    if (bookingMode === "slot" && selectedSlotId !== null) {
      const slot = classSlots.find((s) => s.id === selectedSlotId);
      if (!slot) return;
      const dt = nextOccurrence(slot.dayOfWeek, slot.startTime);
      scheduleIntroMutation.mutate({ id: leadId, scheduledTime: dt });
    } else if (bookingMode === "manual" && introDateTime) {
      scheduleIntroMutation.mutate({ id: leadId, scheduledTime: new Date(introDateTime) });
    }
  };

  const { user: currentUser } = useAuth();

  const recordContactMutation = trpc.admin.recordContact.useMutation({
    onSuccess: (data) => {
      if (data.autoAssigned && currentUser?.name) {
        toast.success(`Lead assigned to you (${currentUser.name})`);
      }
      utils.admin.getLeadById.invalidate({ id: leadId! });
      utils.admin.getAllIntroAppointments.invalidate();
      onRefresh?.();
    },
  });

  const handleCallClick = (e: React.MouseEvent) => {
    // Let the <a href="tel:..."> navigate, but also stamp lastContactedAt
    if (leadId) {
      recordContactMutation.mutate({ leadId, method: 'call' });
    }
  };

  const handleEmailClick = () => {
    if (leadId) {
      recordContactMutation.mutate({ leadId, method: 'email' });
    }
  };

  const sendSmsMutation = trpc.admin.sendLeadSms.useMutation({
    onSuccess: () => {
      toast.success("Text message sent via 800.com");
      setShowSmsDialog(false);
      setSmsMessage("");
    },
    onError: (err) => toast.error(err.message ?? "Failed to send text message"),
  });

  const handleSendSms = () => {
    if (!lead?.phone || !smsMessage.trim()) return;
    sendSmsMutation.mutate({
      leadId: leadId!,
      phone: lead.phone,
      message: smsMessage.trim(),
    });
  };

  if (!leadId) return null;

  const stage = localStage ?? "new_lead";
  const status = localStatus ?? "new";
  const stageConf = STAGE_CONFIG[stage];
  const statusConf = STATUS_CONFIG[status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E10600] flex items-center justify-center text-white font-bold text-lg shrink-0">
              {isLoading ? "…" : (lead?.name?.[0]?.toUpperCase() ?? "?")}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base leading-tight">
                {isLoading ? "Loading…" : lead?.name}
              </h2>
              <p className="text-xs text-gray-500">{lead?.program}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-[#E10600] rounded-full" />
          </div>
        ) : lead ? (
          <div className="flex-1 overflow-y-auto">
            {/* Stage + Status selectors */}
            <div className="px-5 py-4 border-b border-gray-100 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Pipeline Stage
                </label>
                <Select value={stage} onValueChange={(v) => handleStageChange(v as PipelineStage)}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stageConf.bg.replace("bg-", "bg-").replace("-100", "-400")}`} />
                      <span className={`font-medium ${stageConf.color}`}>{stageConf.label}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STAGE_CONFIG) as [PipelineStage, typeof STAGE_CONFIG[PipelineStage]][]).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>
                        <span className={conf.color}>{conf.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Status
                </label>
                <Select value={status} onValueChange={(v) => handleStatusChange(v as LeadStatus)}>
                  <SelectTrigger className="w-full">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.color}`}>
                      {statusConf.label}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${conf.color}`}>{conf.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Staff Assignment */}
            <div className="px-5 py-4 border-b border-gray-100">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Assigned Staff
              </label>
              <Select
                value={lead.assignedStaffId?.toString() ?? 'unassigned'}
                onValueChange={(v) => {
                  assignLeadMutation.mutate({
                    leadId: leadId!,
                    staffUserId: v === 'unassigned' ? null : parseInt(v),
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span className={lead.assignedStaffName ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                      {lead.assignedStaffName ?? 'Unassigned'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffList?.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      <span className="flex items-center gap-2">
                        {s.name}
                        <span className="text-xs text-gray-400 capitalize">{s.role}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lead.assignedStaffName && lead.pipelineStage !== 'enrolled' && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  $50 commission triggers automatically on Enrolled
                </p>
              )}
              {lead.assignedStaffName && lead.pipelineStage === 'enrolled' && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1 font-medium">
                  <DollarSign className="w-3 h-3" />
                  Commission earned by {lead.assignedStaffName}
                </p>
              )}
            </div>

            {/* Quick actions */}
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="grid grid-cols-3 gap-2">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={handleCallClick}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-[#E10600] hover:bg-red-50 transition-colors group"
                  >
                    <Phone className="w-5 h-5 text-gray-500 group-hover:text-[#E10600]" />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-[#E10600]">Call</span>
                  </a>
                )}
                {lead.phone && (
                  <button
                    onClick={() => setShowSmsDialog(true)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                  >
                    <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">Text</span>
                  </button>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={handleEmailClick}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors group"
                  >
                    <Mail className="w-5 h-5 text-gray-500 group-hover:text-green-600" />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-green-600">Email</span>
                  </a>
                )}
                {!lead.phone && !lead.email && (
                  <p className="col-span-3 text-xs text-gray-400 text-center py-2">No contact info available</p>
                )}
              </div>
            </div>

            {/* Lead details */}
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Lead Details</p>
              <div className="space-y-3">
                {lead.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{lead.phone}</p>
                    </div>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900">{lead.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Program</p>
                    <p className="text-sm font-medium text-gray-900">{lead.program}</p>
                  </div>
                </div>
                {lead.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm font-medium text-gray-900">{lead.location}</p>
                    </div>
                  </div>
                )}
                {/* Intro Lesson Booking */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-400 font-medium">Intro Lesson</p>
                    </div>
                    {!showBookingForm && (
                      <button
                        onClick={() => setShowBookingForm(true)}
                        className="text-xs text-[#E10600] hover:underline font-medium"
                      >
                        {lead.scheduledTime ? "Reschedule" : "+ Book Date & Time"}
                      </button>
                    )}
                  </div>
                  {lead.scheduledTime && !showBookingForm && (
                    <div className="ml-6 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
                      <p className="text-sm font-semibold text-indigo-700">
                        {new Date(lead.scheduledTime).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  )}
                  {!lead.scheduledTime && !showBookingForm && (
                    <p className="ml-6 text-xs text-amber-600 font-medium">No intro lesson booked yet</p>
                  )}
                  {showBookingForm && (
                    <div className="ml-6 flex flex-col gap-2">
                      {/* Mode toggle */}
                      <div className="flex gap-2 mb-1">
                        <button
                          onClick={() => setBookingMode("slot")}
                          className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                            bookingMode === "slot"
                              ? "bg-[#E10600] text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          Pick a Class Slot
                        </button>
                        <button
                          onClick={() => setBookingMode("manual")}
                          className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                            bookingMode === "manual"
                              ? "bg-[#E10600] text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          Custom Date & Time
                        </button>
                      </div>

                      {bookingMode === "slot" && (
                        <div className="flex flex-col gap-1.5">
                          {classSlots.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No class slots found for this program.</p>
                          ) : (
                            classSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlotId(slot.id === selectedSlotId ? null : slot.id)}
                                className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                                  selectedSlotId === slot.id
                                    ? "border-[#E10600] bg-red-50 text-[#E10600] font-semibold"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                }`}
                              >
                                <span className="font-medium">{slot.dayOfWeek}</span>
                                {" · "}{slot.startTime} – {slot.endTime}
                                {slot.instructor && (
                                  <span className="text-gray-400"> · {slot.instructor}</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      {bookingMode === "manual" && (
                        <input
                          type="datetime-local"
                          value={introDateTime}
                          onChange={(e) => setIntroDateTime(e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E10600]/30"
                        />
                      )}

                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          onClick={handleScheduleIntro}
                          disabled={
                            scheduleIntroMutation.isPending ||
                            (bookingMode === "slot" && selectedSlotId === null) ||
                            (bookingMode === "manual" && !introDateTime)
                          }
                          className="bg-[#E10600] hover:bg-[#c10500] text-white text-xs h-8"
                        >
                          {scheduleIntroMutation.isPending ? "Saving…" : "Confirm Booking"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowBookingForm(false);
                            setIntroDateTime("");
                            setSelectedSlotId(null);
                          }}
                          className="text-xs h-8"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Date Added</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Last Contacted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.lastContactedAt ? (
                        <span className="flex items-center gap-1.5">
                          {new Date(lead.lastContactedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                          {lead.lastContactMethod && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              lead.lastContactMethod === 'call' ? 'bg-red-100 text-red-700' :
                              lead.lastContactMethod === 'text' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {lead.lastContactMethod}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Never</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Intro Classes</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.introCountCompleted}/{lead.introCountRequired} completed
                    </p>
                  </div>
                </div>
                {lead.source && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Source</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{lead.source}</p>
                    </div>
                  </div>
                )}
                {lead.goal && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Goal</p>
                      <p className="text-sm font-medium text-gray-900">{lead.goal}</p>
                    </div>
                  </div>
                )}
                {lead.message && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Message</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{lead.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Notes</p>
                {!isEditingNotes ? (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSaveNotes}
                    disabled={updateNotesMutation.isPending}
                    className="flex items-center gap-1 text-xs text-[#E10600] hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updateNotesMutation.isPending ? "Saving…" : "Save"}
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <Textarea
                  ref={notesRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead…"
                  className="min-h-[120px] text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsEditingNotes(false);
                      setNotes(lead.notes ?? "");
                    }
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSaveNotes();
                    }
                  }}
                />
              ) : (
                <div
                  onClick={() => setIsEditingNotes(true)}
                  className="min-h-[80px] p-3 rounded-lg border border-dashed border-gray-200 cursor-text hover:border-gray-300 transition-colors"
                >
                  {notes ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{notes}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Click to add notes…</p>
                  )}
                </div>
              )}
              {isEditingNotes && (
                <p className="text-xs text-gray-400 mt-1.5">⌘+Enter to save · Esc to cancel</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Lead not found
          </div>
        )}
      </div>

      {/* SMS Compose Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="z-[200] max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Send Text via 800.com
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">To</p>
              <Input value={lead?.phone ?? ""} disabled className="bg-gray-50 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Message <span className="text-gray-400">({smsMessage.length}/600)</span></p>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Type your message…"
                maxLength={600}
                rows={4}
                className="resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendSms();
                }}
              />
              <p className="text-xs text-gray-400 mt-1">Sent from your 800.com business number · ⌘+Enter to send</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowSmsDialog(false); setSmsMessage(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSendSms}
              disabled={!smsMessage.trim() || sendSmsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sendSmsMutation.isPending ? "Sending…" : "Send Text"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
