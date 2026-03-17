import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Circle, MessageSquare } from "lucide-react";
import { useState } from "react";

export function CurriculumViewer() {
  const { data: curriculumData, isLoading } = trpc.curriculum.getAccessibleContent.useQuery();
  const { data: progressData } = trpc.curriculum.getMyProgress.useQuery();
  const markCompletedMutation = trpc.curriculum.markCompleted.useMutation();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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
      <Card className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Current Belt Rank
            </h2>
            <Badge className="bg-primary text-white text-lg px-4 py-2">
              {beltRank}
            </Badge>
          </div>
          {curriculumData.beltAchievedDate && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Achieved</p>
              <p className="text-white font-semibold">
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
          <Card key={belt} className="overflow-hidden border-zinc-800">
            <div className="p-6 bg-zinc-900/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <h3 className="text-xl font-heading font-bold text-white">
                    {belt}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {completedItems}/{totalItems} completed
                  </span>
                  <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
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
                    <div key={category} className="border border-zinc-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          setExpandedCategory(isExpanded ? null : categoryKey)
                        }
                        className="w-full p-4 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-semibold">
                            {category}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {items.length} items
                          </Badge>
                        </div>
                        <span className="text-gray-400">
                          {isExpanded ? "−" : "+"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-3 bg-zinc-950/30">
                          {items.map((item) => {
                            const completed = isCompleted(item.id);
                            return (
                              <div
                                key={item.id}
                                className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  {completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white mb-1">
                                    {item.title}
                                  </h4>
                                  <p className="text-sm text-gray-400">
                                    {item.description}
                                  </p>
                                  
                                  {/* Instructor Feedback Display */}
                                  {getInstructorFeedback(item.id) && (
                                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-xs font-semibold text-blue-300 mb-1">Instructor Feedback</p>
                                          <p className="text-sm text-blue-100">
                                            {getInstructorFeedback(item.id)}
                                          </p>
                                          {getFeedbackDate(item.id) && (
                                            <p className="text-xs text-blue-400 mt-2">
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
                                    className="flex-shrink-0"
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
      <Card className="p-6 bg-zinc-900/30 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-400">
            Future Belt Content
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          Continue training and advance to the next belt rank to unlock more curriculum content.
          Your dedication and progress will be rewarded with new techniques and knowledge!
        </p>
      </Card>
    </div>
  );
}
