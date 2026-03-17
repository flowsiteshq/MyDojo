import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  Users,
  UserPlus,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Cake,
} from "lucide-react";
import { Link } from "wouter";

const STAGE_LABEL: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  intro_scheduled: "Intro Scheduled",
  showed_up: "Showed Up",
  offer_presented: "Offer Presented",
  enrolled: "Enrolled",
  nurture: "Nurture",
};

const STAGE_COLOR: Record<string, string> = {
  new_lead: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  intro_scheduled: "bg-indigo-100 text-indigo-700",
  showed_up: "bg-yellow-100 text-yellow-700",
  offer_presented: "bg-orange-100 text-orange-700",
  enrolled: "bg-green-100 text-green-700",
  nurture: "bg-purple-100 text-purple-700",
};

const STAGE_ORDER = [
  "new_lead",
  "contacted",
  "intro_scheduled",
  "showed_up",
  "offer_presented",
  "enrolled",
  "nurture",
];

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminDashboard() {
  const { data: todayClasses } = trpc.kiosk.getTodayClassSchedule.useQuery();
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();
  const { data: todaysBirthdays, isLoading: birthdaysLoading } = trpc.admin.getTodaysBirthdays.useQuery();

  const statCards = [
    {
      label: "Active Members",
      value: isLoading ? "…" : stats?.activeMembers ?? 0,
      icon: Users,
      color: "bg-green-500",
      sub: "Stripe-paying students",
    },
    {
      label: "Check-ins Today",
      value: isLoading ? "…" : stats?.checkInsToday ?? 0,
      icon: Activity,
      color: "bg-orange-500",
      sub: "Kiosk + staff check-ins",
    },
    {
      label: "Total Leads",
      value: isLoading ? "…" : stats?.totalLeads ?? 0,
      icon: UserPlus,
      color: "bg-purple-500",
      sub: `${isLoading ? "…" : stats?.newLeadsThisWeek ?? 0} new this week`,
    },
    {
      label: "Today's Classes",
      value: todayClasses?.length ?? 0,
      icon: Calendar,
      color: "bg-blue-500",
      sub: "Scheduled for today",
    },
    {
      label: "Enrolled This Month",
      value: isLoading ? "…" : stats?.enrolledThisMonth ?? 0,
      icon: TrendingUp,
      color: "bg-red-500",
      sub: "Leads → Enrolled",
    },
  ];

  // Build pipeline funnel from leadsByStage
  const pipelineFunnel = STAGE_ORDER.map((stage) => {
    const found = stats?.leadsByStage?.find((s) => s.stage === stage);
    return { stage, count: found?.count ?? 0 };
  });
  const maxCount = Math.max(...pipelineFunnel.map((s) => s.count), 1);

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to your admin portal</p>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.color} p-2.5 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </Card>
            );
          })}
        </div>

        {/* ── Today's Birthdays Banner (if any) ── */}
        {!birthdaysLoading && todaysBirthdays && todaysBirthdays.length > 0 && (
          <Card className="p-5 mb-6 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-400 p-2 rounded-lg">
                <Cake className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                🎂 Today's Birthdays ({todaysBirthdays.length})
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {todaysBirthdays.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-yellow-200"
                >
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name ?? ''}
                      className="w-8 h-8 rounded-full object-cover border-2 border-yellow-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                      {(student.name ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{student.name}</p>
                    <p className="text-xs text-gray-500">
                      {student.age !== null ? `Turning ${student.age}` : 'Birthday today'}
                      {student.beltRank && student.beltRank !== 'No Belt' ? ` · ${student.beltRank}` : ''}
                    </p>
                  </div>
                  <span className="text-lg ml-1">🎉</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Pipeline Funnel */}
          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Lead Pipeline</h2>
              <Link href="/admin/leads">
                <span className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                  View all <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="space-y-2">
              {pipelineFunnel.map(({ stage, count }) => (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 shrink-0">
                    {STAGE_LABEL[stage]}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[#E10600] transition-all duration-500"
                      style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Leads */}
          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Leads</h2>
              <Link href="/admin/leads">
                <span className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                  View all <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : stats?.recentLeads && stats.recentLeads.length > 0 ? (
              <div className="space-y-3">
                {stats.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {lead.program}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                          STAGE_COLOR[lead.pipelineStage ?? "new_lead"] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STAGE_LABEL[lead.pipelineStage ?? "new_lead"]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {timeAgo(lead.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No leads yet</p>
            )}
          </Card>

          {/* Today's Classes + Recent Check-ins */}
          <div className="space-y-6 lg:col-span-1">
            {/* Today's Classes */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Today's Classes
              </h2>
              {todayClasses && todayClasses.length > 0 ? (
                <div className="space-y-2">
                  {todayClasses.slice(0, 4).map((cls: any) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {cls.program}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cls.startTime} – {cls.endTime}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{cls.location}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No classes today</p>
              )}
            </Card>

            {/* Recent Check-ins */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Recent Check-ins
                </h2>
                <Link href="/admin/attendance">
                  <span className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                    View all <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-gray-100 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : stats?.recentCheckIns && stats.recentCheckIns.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentCheckIns.map((ci) => (
                    <div
                      key={ci.id}
                      className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {ci.studentName ?? ci.customerName ?? "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {ci.program ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-gray-400">
                          {timeAgo(ci.checkInTimestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  No check-ins yet today
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
