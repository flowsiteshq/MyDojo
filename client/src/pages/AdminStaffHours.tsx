import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, BookOpen, ChevronDown, ChevronUp, Download, Timer, Calendar } from "lucide-react";
import { Link } from "wouter";

function formatTotalMinutes(mins: number | null): string {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDateRange(range: string): { from: number; to: number } {
  const now = Date.now();
  const day = 86400000;
  switch (range) {
    case "today": return { from: new Date().setHours(0, 0, 0, 0), to: now };
    case "week": return { from: now - 7 * day, to: now };
    case "month": return { from: now - 30 * day, to: now };
    case "quarter": return { from: now - 90 * day, to: now };
    default: return { from: now - 30 * day, to: now };
  }
}

export default function AdminStaffHours() {
  const [dateRange, setDateRange] = useState("month");
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [expandedShift, setExpandedShift] = useState<number | null>(null);

  const { from, to } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const { data: staffList } = trpc.staffTime.adminGetStaffList.useQuery();
  const { data: summary, isLoading: summaryLoading } = trpc.staffTime.adminGetHoursSummary.useQuery({ from, to });
  const { data: shifts, isLoading: shiftsLoading } = trpc.staffTime.adminGetShifts.useQuery({
    from,
    to,
    staffUserId: selectedStaff !== "all" ? parseInt(selectedStaff) : undefined,
    limit: 100,
  });

  const totalHours = useMemo(() => {
    if (!summary) return 0;
    return Math.round(summary.reduce((acc, s) => acc + (s.totalMinutes ?? 0), 0) / 60 * 10) / 10;
  }, [summary]);

  const totalClasses = useMemo(() => {
    if (!shifts) return 0;
    return shifts.reduce((acc, s) => acc + s.classes.length, 0);
  }, [shifts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-red-500" />
          <span className="font-bold text-lg tracking-wide">STAFF HOURS</span>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800">
            ← Admin Portal
          </Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-48">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staffList?.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name ?? s.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 text-center">
            <Timer className="h-7 w-7 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalHours}h</p>
            <p className="text-sm text-gray-500">Total Hours</p>
          </Card>
          <Card className="p-5 text-center">
            <Users className="h-7 w-7 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary?.length ?? 0}</p>
            <p className="text-sm text-gray-500">Staff Members</p>
          </Card>
          <Card className="p-5 text-center">
            <BookOpen className="h-7 w-7 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalClasses}</p>
            <p className="text-sm text-gray-500">Classes Taught</p>
          </Card>
        </div>

        {/* Hours Per Staff */}
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-red-600" />
            Hours by Staff Member
          </h3>
          {summaryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : !summary?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">No shifts recorded in this period.</p>
          ) : (
            <div className="space-y-3">
              {summary.map((row) => {
                const pct = totalHours > 0 ? Math.round(((row.totalMinutes ?? 0) / 60 / totalHours) * 100) : 0;
                return (
                  <div key={row.staffUserId} className="flex items-center gap-4">
                    <div className="w-36 shrink-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{row.staffName}</p>
                      <p className="text-xs text-gray-500">{row.shiftCount} shift{row.shiftCount !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-16 text-right">
                      {formatTotalMinutes(row.totalMinutes)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Shift History */}
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-600" />
            Shift History
          </h3>
          {shiftsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : !shifts?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">No shifts in this period.</p>
          ) : (
            <div className="space-y-2">
              {shifts.map((shift) => (
                <div key={shift.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                    onClick={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{shift.staffName}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(shift.clockInAt)}
                          {shift.clockOutAt ? ` → ${formatTime(shift.clockOutAt)}` : " · Still on shift"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {shift.clockOutAt ? (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                          {formatTotalMinutes(shift.totalMinutes)}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                      )}
                      {shift.classes.length > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {shift.classes.length} class{shift.classes.length !== 1 ? "es" : ""}
                        </Badge>
                      )}
                      {expandedShift === shift.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedShift === shift.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Clock In:</span>{" "}
                          <span className="font-medium">{formatDateTime(shift.clockInAt)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Clock Out:</span>{" "}
                          <span className="font-medium">
                            {shift.clockOutAt ? formatDateTime(shift.clockOutAt) : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>{" "}
                          <span className="font-medium">{formatTotalMinutes(shift.totalMinutes)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>{" "}
                          <span className="font-medium">{shift.location ?? "HQ"}</span>
                        </div>
                        {shift.notes && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Notes:</span>{" "}
                            <span className="font-medium">{shift.notes}</span>
                          </div>
                        )}
                      </div>

                      {shift.classes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Classes Taught</p>
                          <div className="space-y-1">
                            {shift.classes.map((cls) => (
                              <div key={cls.id} className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm border border-gray-200">
                                <span className="font-medium">{cls.program}</span>
                                <div className="flex items-center gap-3 text-gray-500 text-xs">
                                  {formatTime(cls.classStartAt)}
                                  {cls.studentCount != null && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {cls.studentCount}
                                    </span>
                                  )}
                                  {cls.notes && <span className="italic">{cls.notes}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
