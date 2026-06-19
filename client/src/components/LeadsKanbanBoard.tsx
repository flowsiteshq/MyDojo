import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, Mail, Calendar, ExternalLink, GripVertical, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";

// ─── Pipeline config ─────────────────────────────────────────────────────────

type PipelineStage =
  | "new_lead"
  | "contacted"
  | "intro_scheduled"
  | "showed_up"
  | "offer_presented"
  | "enrolled"
  | "nurture";

const COLUMNS: { id: PipelineStage; label: string; color: string; headerBg: string }[] = [
  { id: "new_lead",        label: "New Lead",        color: "border-t-slate-400",   headerBg: "bg-slate-50" },
  { id: "contacted",       label: "Contacted",       color: "border-t-blue-400",    headerBg: "bg-blue-50" },
  { id: "intro_scheduled", label: "Intro Scheduled", color: "border-t-indigo-400",  headerBg: "bg-indigo-50" },
  { id: "showed_up",       label: "Showed Up",       color: "border-t-yellow-400",  headerBg: "bg-yellow-50" },
  { id: "offer_presented", label: "Offer Presented", color: "border-t-orange-400",  headerBg: "bg-orange-50" },
  { id: "enrolled",        label: "Enrolled",        color: "border-t-green-400",   headerBg: "bg-green-50" },
  { id: "nurture",         label: "Nurture",         color: "border-t-purple-400",  headerBg: "bg-purple-50" },
];

const SOURCE_COLORS: Record<string, string> = {
  chatbot:      "bg-blue-100 text-blue-800",
  landing_page: "bg-green-100 text-green-800",
  ghl:          "bg-orange-100 text-orange-800",
  facebook:     "bg-indigo-100 text-indigo-800",
  trial_form:   "bg-purple-100 text-purple-800",
  sms_ai:       "bg-teal-100 text-teal-800",
};

// ─── Lead card ────────────────────────────────────────────────────────────────

interface Lead {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  program: string;
  source?: string | null;
  pipelineStage: PipelineStage;
  scheduledTime?: Date | null;
  createdAt: Date;
  status: string;
  assignedStaffName?: string | null;
}

function LeadCard({
  lead,
  isDragging,
  onCardClick,
}: {
  lead: Lead;
  isDragging?: boolean;
  onCardClick?: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const sourceKey = lead.source?.startsWith("ghl") ? "ghl" : (lead.source || "chatbot");
  const sourceLabel = lead.source?.startsWith("ghl")
    ? `GHL${lead.source !== "ghl" ? ` · ${lead.source.replace("ghl:", "")}` : ""}`
    : lead.source === "facebook" ? "Facebook"
    : lead.source === "trial_form" ? "Trial Form"
    : lead.source === "landing_page" ? "Landing Page"
    : lead.source === "sms_ai" ? "SMS AI"
    : lead.source || "Chatbot";
  const sourceClass = SOURCE_COLORS[sourceKey] || "bg-gray-100 text-gray-700";

  const createdStr = new Date(lead.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const scheduledStr = lead.scheduledTime
    ? new Date(lead.scheduledTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3 select-none ${
        isDragging ? "shadow-xl rotate-1 scale-105" : "hover:shadow-md hover:border-gray-300"
      } transition-all duration-150 cursor-pointer`}
      onClick={() => onCardClick?.(lead.id)}
    >
      {/* Drag handle + name row */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          aria-label="Drag lead"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{lead.name}</p>
          <p className="text-xs text-gray-500 truncate">{lead.program}</p>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1 mb-2 ml-6">
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {scheduledStr && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">{scheduledStr}</span>
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between ml-6">
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sourceClass} inline-flex items-center gap-1`}>
          {(lead.source?.startsWith("ghl") || lead.source === "facebook") && <ExternalLink className="w-2.5 h-2.5" />}
          {sourceLabel}
        </span>
        <span className="text-xs text-gray-400">{createdStr}</span>
      </div>
      {lead.assignedStaffName && (
        <div className="flex items-center gap-1 ml-6 mt-1.5">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 truncate">{lead.assignedStaffName}</span>
        </div>
      )}
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  leads,
  onCardClick,
}: {
  column: (typeof COLUMNS)[number];
  leads: Lead[];
  onCardClick: (id: number) => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border-t-4 ${column.color} bg-gray-50 min-w-[220px] w-[220px] shrink-0`}
    >
      {/* Column header */}
      <div className={`${column.headerBg} px-3 py-2.5 rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            {column.label}
          </span>
          <span className="text-xs font-bold bg-white border border-gray-200 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Cards drop zone */}
      <SortableContext
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2 space-y-2 min-h-[120px]">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-gray-300 border-2 border-dashed border-gray-200 rounded-lg">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Drop here</span>
            </div>
          ) : (
            leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onCardClick={onCardClick} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main board ───────────────────────────────────────────────────────────────

interface LeadsKanbanBoardProps {
  leads: Lead[];
  onStageChange: (id: number, stage: PipelineStage) => void;
  onRefresh?: () => void;
}

export function LeadsKanbanBoard({ leads, onStageChange, onRefresh }: LeadsKanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  // Local optimistic state: id → stage
  const [localStages, setLocalStages] = useState<Record<number, PipelineStage>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getStage = (lead: Lead): PipelineStage =>
    localStages[lead.id] ?? lead.pipelineStage ?? "new_lead";

  const activeLead = activeId != null ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as number);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const overId = over.id;
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      setLocalStages((prev) => ({ ...prev, [active.id as number]: overColumn.id }));
      return;
    }
    const overLead = leads.find((l) => l.id === overId);
    if (overLead) {
      const overStage = localStages[overLead.id] ?? overLead.pipelineStage ?? "new_lead";
      setLocalStages((prev) => ({ ...prev, [active.id as number]: overStage }));
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) {
      setLocalStages((prev) => {
        const next = { ...prev };
        delete next[active.id as number];
        return next;
      });
      return;
    }

    const leadId = active.id as number;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const newStage = localStages[leadId] ?? lead.pipelineStage ?? "new_lead";
    const oldStage = lead.pipelineStage ?? "new_lead";

    if (newStage !== oldStage) {
      onStageChange(leadId, newStage);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => getStage(l) === col.id);
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                leads={colLeads}
                onCardClick={(id) => setSelectedLeadId(id)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? (
            <LeadCard lead={activeLead} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Slide-out detail panel */}
      <LeadDetailPanel
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onStageChange={(id, stage) => {
          onStageChange(id, stage);
          setLocalStages((prev) => ({ ...prev, [id]: stage }));
        }}
        onRefresh={onRefresh}
      />
    </>
  );
}
