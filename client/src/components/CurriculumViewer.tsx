import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Circle, MessageSquare } from "lucide-react";
import { useState } from "react";

type CurriculumViewerProps = {
  isDark?: boolean;
};

export function CurriculumViewer({ isDark = false }: CurriculumViewerProps) {
  const { data: curriculumData, isLoading } = trpc.curriculum.getAccessibleContent.useQuery();
  const { data: progressData } = trpc.curriculum.getMyProgress.useQuery();
  const markCompletedMutation = trpc.curriculum.markCompleted.useMutation();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const textPrimary = isDark ? "text-white" : "text-slate-950";
  const textSecondary = isDark ? "text-zinc-300" : "text-slate-600";
  const textMuted = isDark ? "text-zinc-400" : "text-slate-500";
  const cardSurface = isDark
    ? "border-zinc-800 bg-zinc-950"
    : "border-slate-200 bg-white shadow-sm";
  const subtleSurface = isDark ? "bg-zinc-900/60" : "bg-slate-50";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!curriculumData) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No curriculum data available.</p>
      </Card>
    );
  }

  const { beltRank, content } = curriculumData;

  // Group content by belt rank and category
  type ContentItem = (typeof content)[number];
  const groupedContent: Record<string, Record<string, ContentItem[]>> = {};
  content.forEach((item) => {
    if (!groupedContent[item.beltRank]) {
      groupedContent[item.beltRank] = {};
    }
    if (!groupedContent[item.beltRank][item.category]) {
      groupedContent[item.beltRank][item.category] = [];
    }
    groupedContent[item.beltRank][item.category].push(item);
  });

  // Check if item is completed
  const isCompleted = (contentId: number) => {
    return progressData?.some(
      (p) => p.curriculumContentId === contentId && p.status === "completed"
    );
  };

  // Get instructor feedback for an item
  const getInstructorFeedback = (contentId: number) => {
    return progressData?.find(
      (p) => p.curriculumContentId === contentId
    )?.instructorFeedback;
  };

  // Get feedback date for an item
  const getFeedbackDate = (contentId: number) => {
    return progressData?.find(
      (p) => p.curriculumContentId === contentId
    )?.feedbackDate;
  };

  const handleMarkCompleted = async (contentId: number) => {
    try {
      await markCompletedMutation.mutateAsync({ curriculumContentId: contentId });
    } catch (error) {
      console.error("Error marking completed:", error);
    }
  };

  const beltOrder = [
    "No Belt",
    "White Belt",
    "Yellow Belt",
    "Orange Belt",
    "Green Belt",
    "Advanced Green",
    "Blue Belt",
    "Advanced Blue",
    "Purple Belt",
    "Advanced Purple",
    "Brown Belt",
    "Advanced Brown",
    "Probationary Black",
    "Black Belt 1st Dan",
  ];

  return (
    <div className="space-y-6">
      {/* Current Belt Status */}
      <Card className={`p-6 border ${isDark ? "border-primary/30 bg-gradient-to-r from-zinc-950 to-zinc-800" : "border-red-100 bg-gradient-to-r from-red-50 via-white to-white shadow-sm"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-heading font-bold ${textPrimary} mb-2`}>
              Current Belt Rank
            </h2>
            <Badge className="bg-primary text-white text-lg px-4 py-2">
              {beltRank}
            </Badge>
          </div>
          {curriculumData.beltAchievedDate && (
            <div className="text-right">
              <p className={`text-sm ${textMuted}`}>Achieved</p>
              <p className={`${textPrimary} font-semibold`}>
                {new Date(curriculumData.beltAchievedDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Curriculum Content by Belt */}
      {beltOrder.map((belt) => {
        if (!groupedContent[belt]) return null;

        const categories = Object.keys(groupedContent[belt]);
        const totalItems = Object.values(groupedContent[belt]).flat().length;
        const completedItems = Object.values(groupedContent[belt])
          .flat()
          .filter((item) => isCompleted(item.id)).length;
        const progressPercent = Math.round((completedItems / totalItems) * 100);

        return (
          <Card key={belt} className={`overflow-hidden border ${cardSurface}`}>
            <div className={`p-6 ${subtleSurface}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <h3 className={`text-xl font-heading font-bold ${textPrimary}`}>
                    {belt}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${textSecondary}`}>
                    {completedItems}/{totalItems} completed
                  </span>
                  <div className={`w-32 h-2 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-slate-200"}`}>
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                {categories.map((category) => {
                  const items = groupedContent[belt][category];
                  const categoryKey = `${belt}-${category}`;
                  const isExpanded = expandedCategory === categoryKey;

                  return (
                    <div key={category} className={`border rounded-xl overflow-hidden ${isDark ? "border-zinc-800" : "border-slate-200 bg-white"}`}>
                      <button
                        onClick={() =>
                          setExpandedCategory(isExpanded ? null : categoryKey)
                        }
                        className={`w-full p-4 transition-colors text-left flex items-center justify-between ${isDark ? "bg-zinc-900/40 hover:bg-zinc-800" : "bg-white hover:bg-red-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-bold">
                            {category}
                          </span>
                          <Badge variant="outline" className={`text-xs ${isDark ? "border-zinc-700 text-zinc-300" : "border-slate-300 bg-slate-50 text-slate-700"}`}>
                            {items.length} items
                          </Badge>
                        </div>
                        <span className={`text-xl leading-none ${textSecondary}`}>
                          {isExpanded ? "−" : "+"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className={`p-4 space-y-3 ${isDark ? "bg-zinc-950/50" : "bg-slate-50"}`}>
                          {items.map((item) => {
                            const completed = isCompleted(item.id);
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-4 p-4 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-900/70" : "border-slate-200 bg-white shadow-sm"}`}
                              >
                                <div className="flex-shrink-0 mt-1">
                                  {completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className={`w-5 h-5 ${isDark ? "text-zinc-600" : "text-slate-300"}`} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className={`font-bold ${textPrimary} mb-1`}>
                                    {item.title}
                                  </h4>
                                  <p className={`text-sm leading-relaxed ${textSecondary}`}>
                                    {item.description}
                                  </p>
                                  
                                  {/* Instructor Feedback Display */}
                                  {getInstructorFeedback(item.id) && (
                                    <div className={`mt-3 p-3 rounded-lg border ${isDark ? "border-blue-800/40 bg-blue-900/20" : "border-blue-200 bg-blue-50"}`}>
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-blue-400" : "text-blue-700"}`} />
                                        <div className="flex-1">
                                          <p className={`text-xs font-bold mb-1 ${isDark ? "text-blue-300" : "text-blue-900"}`}>Instructor Feedback</p>
                                          <p className={`text-sm ${isDark ? "text-blue-100" : "text-blue-900"}`}>
                                            {getInstructorFeedback(item.id)}
                                          </p>
                                          {getFeedbackDate(item.id) && (
                                            <p className={`text-xs mt-2 ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                                              {new Date(getFeedbackDate(item.id)!).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {!completed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkCompleted(item.id)}
                                    disabled={markCompletedMutation.isPending}
                                    className={`flex-shrink-0 ${isDark ? "border-zinc-600 text-zinc-100 hover:bg-zinc-800" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"}`}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Locked Content Preview */}
      <Card className={`p-6 border ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-slate-200 bg-slate-50 shadow-sm"}`}>
        <div className="flex items-center gap-3 mb-4">
          <Lock className={`w-5 h-5 ${isDark ? "text-zinc-500" : "text-slate-500"}`} />
          <h3 className={`text-lg font-bold ${textPrimary}`}>
            Future Belt Content
          </h3>
        </div>
        <p className={`text-sm leading-relaxed ${textSecondary}`}>
          Continue training and advance to the next belt rank to unlock more curriculum content.
          Your dedication and progress will be rewarded with new techniques and knowledge!
        </p>
      </Card>
    </div>
  );
}
