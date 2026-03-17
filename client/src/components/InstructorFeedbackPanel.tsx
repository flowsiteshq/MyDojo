import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { CheckCircle2, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

interface InstructorFeedbackPanelProps {
  enrollmentId: number;
  studentName: string;
}

export function InstructorFeedbackPanel({ enrollmentId, studentName }: InstructorFeedbackPanelProps) {

  const [selectedProgressId, setSelectedProgressId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const { data: progressData, isLoading, refetch } = trpc.curriculum.getStudentProgress.useQuery(
    { enrollmentId },
    { enabled: !!enrollmentId }
  );

  const addFeedbackMutation = trpc.curriculum.addInstructorFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback added", {
        description: "Your feedback has been saved successfully.",
      });
      setSelectedProgressId(null);
      setFeedbackText("");
      refetch();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleSubmitFeedback = () => {
    if (!selectedProgressId || !feedbackText.trim()) return;

    addFeedbackMutation.mutate({
      studentProgressId: selectedProgressId,
      feedback: feedbackText.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!progressData || progressData.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No progress data available for this student.</p>
      </Card>
    );
  }

  // Group by belt rank
  const groupedByBelt: Record<string, typeof progressData> = {};
  progressData.forEach((item) => {
    if (!item.beltRank) return;
    if (!groupedByBelt[item.beltRank]) {
      groupedByBelt[item.beltRank] = [];
    }
    groupedByBelt[item.beltRank].push(item);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Student Progress</h2>
          <p className="text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {Object.entries(groupedByBelt).map(([beltRank, items]) => (
        <Card key={beltRank} className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            {beltRank}
          </h3>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.status === "completed" && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      <h4 className="font-semibold">{item.curriculumTitle}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.curriculumCategory}
                      </Badge>
                    </div>

                    {item.completedAt && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Completed: {new Date(item.completedAt).toLocaleDateString()}
                      </p>
                    )}

                    {item.instructorFeedback && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              {item.instructorFeedback}
                            </p>
                            {item.feedbackDate && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {new Date(item.feedbackDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProgressId === item.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Enter your feedback for the student..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSubmitFeedback}
                            disabled={!feedbackText.trim() || addFeedbackMutation.isPending}
                          >
                            {addFeedbackMutation.isPending ? "Saving..." : "Save Feedback"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProgressId(null);
                              setFeedbackText("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedProgressId !== item.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProgressId(item.id);
                        setFeedbackText(item.instructorFeedback || "");
                      }}
                    >
                      {item.instructorFeedback ? "Edit Feedback" : "Add Feedback"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
