import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Mail, MailX, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const MILESTONE_CONFIG: Record<number, { label: string; emoji: string; color: string; bg: string }> = {
  5:   { label: "5-Class",   emoji: "🔥", color: "text-orange-700",  bg: "bg-orange-50 border-orange-200" },
  10:  { label: "10-Class",  emoji: "⚡", color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200" },
  25:  { label: "25-Class",  emoji: "🥋", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  50:  { label: "50-Class",  emoji: "🏆", color: "text-purple-700",  bg: "bg-purple-50 border-purple-200" },
  100: { label: "100-Class", emoji: "🌟", color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
};

export default function AdminMilestones() {
  const utils = trpc.useUtils();
  const [resendingId, setResendingId] = useState<number | null>(null);

  const { data: milestones, isLoading } = trpc.admin.getStreakMilestones.useQuery();

  const resendMutation = trpc.admin.resendMilestoneEmail.useMutation({
    onMutate: ({ milestoneId }) => {
      setResendingId(milestoneId);
    },
    onSuccess: (result) => {
      setResendingId(null);
      if (result.success) {
        toast.success("Email resent successfully.");
      } else {
        toast.error("Delivery failed. Check your Resend configuration.");
      }
      utils.admin.getStreakMilestones.invalidate();
    },
    onError: () => {
      setResendingId(null);
      toast.error("Could not resend the email. Please try again.");
    },
  });

  const totalMilestones = milestones?.length ?? 0;
  const emailsSent = milestones?.filter((m) => m.emailSent === 1).length ?? 0;
  const emailsFailed = milestones?.filter((m) => m.emailSent !== 1).length ?? 0;
  const uniqueStudents = new Set(milestones?.map((m) => m.emailSentTo)).size;

  return (
    <AdminLayout>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Streak Milestones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every time a student hits a streak milestone (5, 10, 25, 50, 100 classes), a congratulatory email is sent automatically.
          Use the <strong>Resend</strong> button to retry any failed deliveries.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="bg-orange-100 p-2.5 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalMilestones}</p>
              <p className="text-xs text-gray-500">Total Milestones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="bg-green-100 p-2.5 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{emailsSent}</p>
              <p className="text-xs text-gray-500">Emails Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${emailsFailed > 0 ? "bg-red-100" : "bg-gray-100"}`}>
              <MailX className={`h-5 w-5 ${emailsFailed > 0 ? "text-red-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${emailsFailed > 0 ? "text-red-600" : "text-gray-900"}`}>{emailsFailed}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{uniqueStudents}</p>
              <p className="text-xs text-gray-500">Students Celebrated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestone log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Milestone History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !milestones || milestones.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Flame className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No milestones yet</p>
              <p className="text-sm mt-1">
                Milestones are recorded automatically when students reach 5, 10, 25, 50, or 100 consecutive classes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {milestones.map((m) => {
                const cfg = MILESTONE_CONFIG[m.milestone] ?? {
                  label: `${m.milestone}-Class`,
                  emoji: "🔥",
                  color: "text-gray-700",
                  bg: "bg-gray-50 border-gray-200",
                };
                const isFailed = m.emailSent !== 1;
                const isResending = resendingId === m.id;

                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${cfg.bg}`}
                  >
                    <span className="text-2xl w-8 text-center flex-shrink-0">{cfg.emoji}</span>

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${cfg.color}`}>
                        {cfg.label} Streak
                        <span className="ml-1 text-gray-500 font-normal">
                          — {m.studentName ?? "Unknown Student"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {m.emailSentTo ?? "No email on file"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isFailed ? (
                        <>
                          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 gap-1 text-xs">
                            <MailX className="h-3 w-3" /> Failed
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
                            disabled={isResending}
                            onClick={() => resendMutation.mutate({ milestoneId: m.id })}
                          >
                            {isResending ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            {isResending ? "Sending…" : "Resend"}
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 gap-1 text-xs">
                          <Mail className="h-3 w-3" /> Sent
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
}
