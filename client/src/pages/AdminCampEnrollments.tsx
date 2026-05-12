/**
 * AdminCampEnrollments.tsx
 * Admin view for Summer Camp 2025 paid enrollments.
 * Route: /admin/camp-enrollments
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  DollarSign,
  Star,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Tent,
} from "lucide-react";

const WEEK_ORDER = [
  "Ninja Warrior Week",
  "Water War Week",
  "Board Breaking Week",
  "Nerf Battle Week",
  "Glow Night Week",
  "Leadership Week",
  "Tournament Prep Week",
  "Water Gun Fun Week",
  "Black Belt Bootcamp",
  "Summer Finale",
];

export default function AdminCampEnrollments() {
  const [search, setSearch] = useState("");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data: enrollments, isLoading } = trpc.campEnrollments.getAll.useQuery();
  const { data: stats } = trpc.campEnrollments.getStats.useQuery();

  const filtered = (enrollments ?? []).filter((e) => {
    const matchesSearch =
      !search ||
      e.parentName.toLowerCase().includes(search.toLowerCase()) ||
      e.parentEmail.toLowerCase().includes(search.toLowerCase()) ||
      e.parentPhone.includes(search) ||
      e.students.some((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    const matchesWeek =
      weekFilter === "all" || e.weeks.includes(weekFilter);
    return matchesSearch && matchesWeek;
  });

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Tent className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Summer Camp Enrollments</h1>
            <p className="text-sm text-gray-500">Summer 2025 · Paid signups via FluidPay</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrollments</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats?.totalEnrollments ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">families enrolled</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Students</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats?.totalStudents ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">total campers</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</span>
            </div>
            <p className="text-3xl font-black text-gray-900">
              {stats ? `$${(stats.totalRevenueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">total collected</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Summer</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats?.fullSummerCount ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">all 10 weeks</p>
          </div>
        </div>

        {/* Week Headcount Bar */}
        {stats && Object.keys(stats.weekCounts).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" /> Students Per Week
            </h2>
            <div className="space-y-2">
              {WEEK_ORDER.map((week) => {
                const count = stats.weekCounts[week] ?? 0;
                const maxCount = Math.max(...Object.values(stats.weekCounts), 1);
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={week} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-44 shrink-0 truncate">{week}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by parent name, email, phone, or student name…"
              className="pl-9 border-gray-200 rounded-xl"
            />
          </div>
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400"
          >
            <option value="all">All Weeks</option>
            {WEEK_ORDER.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3" />
              Loading enrollments…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Tent className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-semibold">No enrollments found</p>
              <p className="text-sm mt-1">{search || weekFilter !== "all" ? "Try adjusting your filters." : "Paid enrollments will appear here."}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Parent</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Students</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Weeks</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <>
                    <tr
                      key={e.id}
                      className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(expandedRow === e.id ? null : e.id)}
                    >
                      {/* Parent */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{e.parentName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {e.parentEmail}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {e.parentPhone}
                        </p>
                      </td>
                      {/* Students */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {e.students.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-100">
                              {s.name} (age {s.age})
                            </Badge>
                          ))}
                        </div>
                      </td>
                      {/* Weeks */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-800">{e.weekCount}</span>
                          <span className="text-gray-400 text-xs">week{e.weekCount !== 1 ? "s" : ""}</span>
                          {e.isFullSummer === 1 && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200 ml-1">
                              ⭐ Full Summer
                            </Badge>
                          )}
                        </div>
                      </td>
                      {/* Amount */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-green-700">${(e.amountCents / 100).toFixed(2)}</span>
                      </td>
                      {/* Date */}
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      {/* Expand */}
                      <td className="px-5 py-4 text-gray-400">
                        {expandedRow === e.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {/* Expanded Detail Row */}
                    {expandedRow === e.id && (
                      <tr key={`${e.id}-detail`} className="bg-orange-50/60">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Students detail */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Student Details</p>
                              <div className="space-y-1.5">
                                {e.students.map((s, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                    <span className="font-medium text-gray-800">{s.name}</span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-600">Age {s.age}</span>
                                    {s.dob && <><span className="text-gray-400">·</span><span className="text-gray-500 text-xs">DOB {s.dob}</span></>}
                                    {i > 0 && <Badge className="text-xs bg-green-50 text-green-700 border-green-200 ml-auto">50% off</Badge>}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Weeks detail */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Weeks Enrolled</p>
                              <div className="flex flex-wrap gap-1.5">
                                {e.weeks.map((w, i) => (
                                  <Badge key={i} variant="outline" className="text-xs border-orange-200 text-orange-700 bg-white">
                                    {w}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                FluidPay Txn: <span className="font-mono">{e.fpTransactionId}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-right">
          Showing {filtered.length} of {enrollments?.length ?? 0} enrollment{enrollments?.length !== 1 ? "s" : ""}
        </p>
      </div>
    </AdminLayout>
  );
}
