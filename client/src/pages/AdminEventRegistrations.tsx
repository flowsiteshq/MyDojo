import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download } from "lucide-react";

const EVENTS = [
  { id: "pno-aug-2026", label: "Parents Night Out — Aug 21" },
  { id: "seminar-yaeger-aug-2026", label: "Master Yaeger Seminar — Aug 22" },
];

export default function AdminEventRegistrations() {
  const [selectedEvent, setSelectedEvent] = useState("pno-aug-2026");

  const { data: registrations, isLoading } = trpc.eventReg.list.useQuery({ eventId: selectedEvent });

  const paid = registrations?.filter((r) => r.paymentStatus === "paid" || r.paymentStatus === "free") ?? [];
  const pending = registrations?.filter((r) => r.paymentStatus === "pending") ?? [];

  const exportCSV = () => {
    if (!registrations?.length) return;
    const rows = [
      ["Name", "Student", "Phone", "Email", "Bringing Friend", "Friend Name", "Payment", "Date"],
      ...registrations.map((r) => [
        r.name, r.studentName || "", r.phone, r.email || "",
        r.bringingFriend ? "Yes" : "No", r.friendName || "",
        r.paymentStatus, new Date(r.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selectedEvent}-registrations.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase">Event Registrations</h1>
              <p className="text-gray-400 text-sm">August 2026 Events</p>
            </div>
          </div>
          <Button onClick={exportCSV} variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Event Selector */}
        <div className="mb-6">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {EVENTS.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-white hover:bg-zinc-800">{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-white">{registrations?.length ?? 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total RSVPs</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-400">{paid.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Confirmed</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-yellow-400">{pending.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Pending</div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : !registrations?.length ? (
          <div className="text-center text-gray-400 py-12 bg-zinc-900 rounded-2xl border border-zinc-700">
            No registrations yet for this event.
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Parent</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Student</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Phone</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Friend</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Payment</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, idx) => (
                    <tr key={reg.id} className={`border-b border-zinc-800 ${idx % 2 === 0 ? "" : "bg-zinc-900/50"} hover:bg-zinc-800/50`}>
                      <td className="px-4 py-3 font-bold text-white">{reg.name}</td>
                      <td className="px-4 py-3 text-gray-300">{reg.studentName || "—"}</td>
                      <td className="px-4 py-3 text-gray-300">
                        <a href={`tel:${reg.phone}`} className="hover:text-blue-400">{reg.phone}</a>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {reg.bringingFriend ? <span className="text-green-400">✓ {reg.friendName || "Yes"}</span> : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={
                          reg.paymentStatus === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          reg.paymentStatus === "free" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }>
                          {reg.paymentStatus === "paid" ? "✓ Paid" : reg.paymentStatus === "free" ? "Free" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(reg.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
