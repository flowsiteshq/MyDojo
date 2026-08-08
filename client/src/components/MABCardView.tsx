import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Clock, MapPin, Star, CheckCircle2, Loader2, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";

type MABAppointment = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  program: string;
  scheduledTime?: Date | null;
  location?: string | null;
  pipelineStage: string;
  confirmedAt?: Date | null;
  createdAt: Date;
};

function getMabStatus(apt: MABAppointment): "booked" | "confirmed" | "showed_up" | "enrolled" {
  if (apt.pipelineStage === "showed_up") return "showed_up";
  if (apt.pipelineStage === "enrolled") return "enrolled";
  if (apt.confirmedAt) return "confirmed";
  return "booked";
}

const STATUS_CONFIG = {
  booked: {
    bg: "bg-white",
    border: "border-gray-200",
    nameBg: "bg-gray-100",
    nameText: "text-gray-900",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    label: "Booked",
    dot: "bg-gray-400",
  },
  confirmed: {
    bg: "bg-green-50",
    border: "border-green-300",
    nameBg: "bg-green-100",
    nameText: "text-green-900",
    badge: "bg-green-100 text-green-700 border-green-200",
    label: "Confirmed",
    dot: "bg-green-500",
  },
  showed_up: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    nameBg: "bg-yellow-100",
    nameText: "text-yellow-900",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    label: "Showed Up",
    dot: "bg-yellow-500",
  },
  enrolled: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    nameBg: "bg-blue-100",
    nameText: "text-blue-900",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Enrolled",
    dot: "bg-blue-500",
  },
};

const PROGRAM_COLORS: Record<string, string> = {
  "Little Ninjas": "bg-pink-100 text-pink-700",
  "Dragon Kids": "bg-orange-100 text-orange-700",
  "Teens": "bg-blue-100 text-blue-700",
  "Adult Karate": "bg-purple-100 text-purple-700",
  "Kickboxing": "bg-red-100 text-red-700",
  "After School": "bg-green-100 text-green-700",
  "Not Sure": "bg-gray-100 text-gray-600",
};

function AppointmentCard({ apt, onConfirm, onMarkShowedUp, onMarkEnrolled, confirming, markingShowedUp, markingEnrolled }: {
  apt: MABAppointment;
  onConfirm: (id: number) => void;
  onMarkShowedUp: (id: number) => void;
  onMarkEnrolled: (id: number) => void;
  confirming: boolean;
  markingShowedUp: boolean;
  markingEnrolled: boolean;
}) {
  const status = getMabStatus(apt);
  const cfg = STATUS_CONFIG[status];
  const isEnrolled = apt.pipelineStage === "enrolled";
  const programColor = PROGRAM_COLORS[apt.program] || "bg-gray-100 text-gray-600";

  const scheduledDate = apt.scheduledTime ? new Date(apt.scheduledTime) : null;
  const timeStr = scheduledDate
    ? scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago" })
    : null;
  const dateStr = scheduledDate
    ? scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" })
    : null;

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md`}>
      {/* Status bar at top */}
      <div className={`h-1.5 w-full ${cfg.dot}`} />

      <div className="p-4">
        {/* Name row with status badge and star */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`flex-1 rounded-lg px-3 py-2 ${cfg.nameBg}`}>
            <div className="flex items-center gap-1.5">
              {isEnrolled && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-400 shrink-0" />
              )}
              <span className={`font-bold text-sm leading-tight ${cfg.nameText}`}>
                {apt.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400 font-mono">#{apt.id}</span>
          </div>
        </div>

        {/* Program */}
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${programColor}`}>
            {apt.program}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-xs text-gray-600 mb-4">
          {scheduledDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="font-medium">{dateStr}</span>
            </div>
          )}
          {timeStr && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>{timeStr}</span>
            </div>
          )}
          {apt.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <a href={`tel:${apt.phone}`} className="hover:text-primary transition-colors">{apt.phone}</a>
            </div>
          )}
          {apt.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{apt.email}</span>
            </div>
          )}
          {apt.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>{apt.location}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {status === "booked" && (
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              onClick={() => onConfirm(apt.id)}
              disabled={confirming}
            >
              {confirming ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Phone className="h-3 w-3 mr-1" />}
              Called & Confirmed
            </Button>
          )}
          {(status === "booked" || status === "confirmed") && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50 text-xs h-8"
              onClick={() => onMarkShowedUp(apt.id)}
              disabled={markingShowedUp}
            >
              {markingShowedUp ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              Mark Showed Up
            </Button>
          )}
          {status === "showed_up" && (
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              onClick={() => onMarkEnrolled(apt.id)}
              disabled={markingEnrolled}
            >
              {markingEnrolled ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Star className="h-3 w-3 mr-1" />}
              Mark Enrolled ⭐
            </Button>
          )}
          {isEnrolled && (
            <div className="flex items-center justify-center gap-1.5 py-1.5 bg-blue-100 rounded-md text-xs font-semibold text-blue-700">
              <Star className="h-3.5 w-3.5 fill-blue-400" />
              Signed Up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MABCardView() {
  const utils = trpc.useUtils();
  const { data: appointments, isLoading } = trpc.admin.getMABAppointments.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [showedUpId, setShowedUpId] = useState<number | null>(null);
  const [enrolledId, setEnrolledId] = useState<number | null>(null);

  const confirmMutation = trpc.admin.confirmAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment confirmed — card turned green!");
      utils.admin.getMABAppointments.invalidate();
      setConfirmingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to confirm appointment");
      setConfirmingId(null);
    },
  });

  const stageMutation = trpc.admin.updateLeadPipelineStage.useMutation({
    onSuccess: (_, vars) => {
      if (vars.pipelineStage === "showed_up") {
        toast.success("Marked as showed up — card turned yellow!");
        setShowedUpId(null);
      } else if (vars.pipelineStage === "enrolled") {
        toast.success("Marked as enrolled — ⭐ star added!");
        setEnrolledId(null);
      }
      utils.admin.getMABAppointments.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
      setShowedUpId(null);
      setEnrolledId(null);
    },
  });

  const handleConfirm = (id: number) => {
    setConfirmingId(id);
    confirmMutation.mutate({ id });
  };

  const handleMarkShowedUp = (id: number) => {
    setShowedUpId(id);
    stageMutation.mutate({ id, pipelineStage: "showed_up" });
  };

  const handleMarkEnrolled = (id: number) => {
    setEnrolledId(id);
    stageMutation.mutate({ id, pipelineStage: "enrolled" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading appointments...
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
        <Calendar className="h-10 w-10 text-gray-200" />
        <p className="text-sm font-medium">No upcoming appointments in the next 14 days</p>
        <p className="text-xs">Appointments with a scheduled time will appear here</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, MABAppointment[]> = {};
  appointments.forEach((apt: any) => {
    const d = apt.scheduledTime
      ? new Date(apt.scheduledTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" })
      : "No Date";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(apt as MABAppointment);
  });

  // Legend
  const legend = [
    { color: "bg-gray-400", label: "Booked (white)" },
    { color: "bg-green-500", label: "Called & Confirmed (green)" },
    { color: "bg-yellow-500", label: "Showed Up (yellow)" },
    { color: "bg-blue-500", label: "Enrolled ⭐ (blue)" },
  ];

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-3 h-3 rounded-full ${l.color}`} />
            {l.label}
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-auto">Auto-refreshes every 30s</span>
      </div>

      {/* Cards grouped by date */}
      {Object.entries(grouped).map(([date, apts]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{date}</h3>
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
              {apts.length} appointment{apts.length !== 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {apts.map((apt) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                onConfirm={handleConfirm}
                onMarkShowedUp={handleMarkShowedUp}
                onMarkEnrolled={handleMarkEnrolled}
                confirming={confirmingId === apt.id}
                markingShowedUp={showedUpId === apt.id}
                markingEnrolled={enrolledId === apt.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
