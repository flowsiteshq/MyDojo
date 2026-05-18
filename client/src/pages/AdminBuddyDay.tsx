import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Download, Trash2, Calendar, Clock } from "lucide-react";

export default function AdminBuddyDay() {
  const { data: rsvps = [], isLoading, refetch } = trpc.buddyDay.list.useQuery();
  const [search, setSearch] = useState("");

  const deleteRsvp = trpc.buddyDay.delete.useMutation({
    onSuccess: () => { toast.success("RSVP removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = rsvps.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search) ||
    (r.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAttendees = rsvps.reduce((sum, r) => sum + r.attendeeCount, 0);
  const members = rsvps.filter(r => r.memberType === "member").length;
  const guests = rsvps.filter(r => r.memberType === "guest").length;

  const exportCsv = () => {
    const rows = [
      ["Name", "Phone", "Email", "Attendees", "Type", "Attendee Details", "Notes", "RSVP Date"],
      ...rsvps.map(r => [
        r.name, r.phone, r.email || "", r.attendeeCount,
        r.memberType, r.attendeeDetails || "", r.notes || "",
        new Date(r.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "buddy-day-rsvps.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rsvps.length} RSVPs`);
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buddy Day — Board Breaking Night</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Wednesday, May 20th, 2026</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 6:00 PM – 7:30 PM</span>
            </p>
          </div>
          <Button onClick={exportCsv} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{rsvps.length}</p>
            <p className="text-xs text-gray-500 mt-1">RSVPs</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-primary">{totalAttendees}</p>
            <p className="text-xs text-gray-500 mt-1">Total Attendees</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{members}</p>
            <p className="text-xs text-gray-500 mt-1">Members</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{guests}</p>
            <p className="text-xs text-gray-500 mt-1">Guests / New</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading RSVPs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? "No RSVPs match your search" : "No RSVPs yet"}</p>
            <p className="text-sm mt-1">Share the link: <strong>mydojoma.com/buddy-day</strong></p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Attendees</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Details</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">RSVP Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <a href={`tel:${r.phone}`} className="hover:text-primary">{r.phone}</a>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.email || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {r.attendeeCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.memberType === "member"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {r.memberType === "member" ? "Member" : "Guest"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">
                      {r.attendeeDetails || r.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm(`Remove RSVP for ${r.name}?`)) deleteRsvp.mutate({ id: r.id });
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
