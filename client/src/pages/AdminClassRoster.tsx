import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Users, Phone, CheckCircle, Loader2, Download } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function AdminClassRoster() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: roster, isLoading, refetch } = trpc.classReservation.adminRoster.useQuery({ date });

  const markAttended = trpc.classReservation.markAttended.useMutation({
    onSuccess: () => { toast.success("Marked as attended"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const totalStudents = useMemo(() => roster?.reduce((sum, cls) => sum + cls.students.length, 0) ?? 0, [roster]);

  const exportCSV = () => {
    if (!roster) return;
    const rows = [["Class", "Time", "Instructor", "Student", "Parent", "Phone", "Status"]];
    for (const cls of roster) {
      for (const s of cls.students) {
        rows.push([cls.program, cls.startTime, cls.instructor ?? "", s.studentName, s.parentName ?? "", s.parentPhone ?? "", s.status]);
      }
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Class Roster</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{formatDate(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate(d => addDays(d, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          />
          <Button variant="outline" size="icon" onClick={() => setDate(d => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!roster || roster.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl font-bold text-primary">{totalStudents}</div>
          <div className="text-sm text-muted-foreground">Total sign-ups</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl font-bold">{roster?.length ?? 0}</div>
          <div className="text-sm text-muted-foreground">Classes with sign-ups</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-2xl font-bold text-green-500">
            {roster?.reduce((sum, cls) => sum + cls.students.filter(s => s.status === "attended").length, 0) ?? 0}
          </div>
          <div className="text-sm text-muted-foreground">Marked attended</div>
        </div>
      </div>

      {/* Roster */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !roster || roster.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No sign-ups for this date yet.</p>
          <p className="text-sm mt-1">Students can sign up at <strong>/classes</strong></p>
        </div>
      ) : (
        <div className="grid gap-6">
          {roster.map((cls) => (
            <div key={`${cls.classScheduleId}-${cls.startTime}`} className="rounded-xl border bg-card overflow-hidden">
              {/* Class header */}
              <div className="bg-muted/50 px-5 py-3 flex items-center justify-between border-b">
                <div>
                  <span className="font-bold text-lg">{cls.program}</span>
                  <span className="text-muted-foreground ml-3 text-sm">
                    {cls.startTime}{cls.endTime ? ` – ${cls.endTime}` : ""}
                    {cls.instructor ? ` · ${cls.instructor}` : ""}
                    {` · ${cls.location}`}
                  </span>
                </div>
                <Badge variant="secondary" className="text-sm">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  {cls.students.length} student{cls.students.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Student list */}
              <div className="divide-y">
                {cls.students.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {s.studentName[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{s.studentName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                        {s.parentName && <span>{s.parentName}</span>}
                        {s.parentPhone && (
                          <a href={`tel:${s.parentPhone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="h-3 w-3" /> {s.parentPhone}
                          </a>
                        )}
                        {s.note && <span className="italic">"{s.note}"</span>}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {s.status === "attended" ? (
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" /> Attended
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => markAttended.mutate({ reservationId: s.id })}
                          disabled={markAttended.isPending}
                        >
                          Mark Attended
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
