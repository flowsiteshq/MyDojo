import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminBeltTestIntents() {
  const { data: intents, isLoading } = trpc.beltTestIntent.list.useQuery();

  const paid = intents?.filter((i) => i.paymentStatus === "paid") ?? [];
  const pending = intents?.filter((i) => i.paymentStatus === "pending") ?? [];

  const exportCSV = () => {
    if (!intents?.length) return;
    const rows = [
      ["Student", "Parent", "Phone", "Email", "Current Belt", "Instructor", "Payment", "Date"],
      ...intents.map((i) => [
        i.studentName, i.parentName, i.phone, i.email,
        i.currentBelt, i.instructor || "", i.paymentStatus,
        new Date(i.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "belt-test-intents.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#E10600] p-2 rounded-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase">Belt Test Intents</h1>
              <p className="text-gray-400 text-sm">August 15th, 2026 — Intent to Promote Submissions</p>
            </div>
          </div>
          <Button onClick={exportCSV} variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-white">{intents?.length ?? 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Submitted</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-400">{paid.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Paid</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-yellow-400">{pending.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Pending Payment</div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : !intents?.length ? (
          <div className="text-center text-gray-400 py-12 bg-zinc-900 rounded-2xl border border-zinc-700">
            No submissions yet. Share the link: <strong className="text-white">/belt-test-intent</strong>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Student</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Parent</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Phone</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Belt</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Instructor</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Payment</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-bold uppercase text-xs">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {intents.map((intent, idx) => (
                    <tr key={intent.id} className={`border-b border-zinc-800 ${idx % 2 === 0 ? "" : "bg-zinc-900/50"} hover:bg-zinc-800/50`}>
                      <td className="px-4 py-3 font-bold text-white">{intent.studentName}</td>
                      <td className="px-4 py-3 text-gray-300">{intent.parentName}</td>
                      <td className="px-4 py-3 text-gray-300">
                        <a href={`tel:${intent.phone}`} className="hover:text-[#E10600]">{intent.phone}</a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-zinc-700 text-gray-200 text-xs px-2 py-1 rounded-full">{intent.currentBelt}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{intent.instructor || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={intent.paymentStatus === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                          {intent.paymentStatus === "paid" ? "✓ Paid" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(intent.createdAt).toLocaleDateString()}</td>
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
