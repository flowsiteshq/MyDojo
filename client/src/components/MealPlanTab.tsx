/**
 * MealPlanTab
 *
 * Shown in the Kickboxing member dashboard.
 * - If no intake: shows the questionnaire onboarding
 * - If intake complete but no plan today: shows a "Generate Plan" button
 * - If plan exists: shows the full daily meal plan
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MealPlanIntakeForm } from "./MealPlanIntakeForm";
import { toast } from "sonner";
import {
  Flame,
  RefreshCw,
  CheckCircle2,
  Droplets,
  ChevronDown,
  ChevronUp,
  Utensils,
  Zap,
  Wheat,
  Beef,
} from "lucide-react";

interface Props {
  isDark: boolean;
}

interface MealItem {
  name: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes?: string;
}

interface MealBlock {
  mealName: string;
  time: string;
  items: MealItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  tip?: string;
}

interface DailyMealPlan {
  meals: MealBlock[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  waterOzRecommended: number;
  dailyTip: string;
}

function MacroPill({
  icon: Icon,
  label,
  value,
  color,
  isDark,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${
        isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"
      }`}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <p className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>{label}</p>
        <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
      </div>
    </div>
  );
}

function MealCard({ meal, isDark }: { meal: MealBlock; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
      }`}
    >
      {/* Meal Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={`w-full flex items-center justify-between p-4 text-left ${
          isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-[#E11D2A]/20" : "bg-red-50"}`}>
            <Utensils className="w-5 h-5 text-[#E11D2A]" />
          </div>
          <div>
            <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{meal.mealName}</p>
            <p className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>{meal.time} · {meal.totalCalories} cal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className={`${isDark ? "text-white/50" : "text-gray-500"}`}>
              <span className="font-semibold text-blue-400">{meal.totalProteinG}g</span> protein
            </span>
            <span className={`${isDark ? "text-white/50" : "text-gray-500"}`}>
              <span className="font-semibold text-amber-400">{meal.totalCarbsG}g</span> carbs
            </span>
          </div>
          {expanded ? (
            <ChevronUp className={`w-4 h-4 ${isDark ? "text-white/40" : "text-gray-400"}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${isDark ? "text-white/40" : "text-gray-400"}`} />
          )}
        </div>
      </button>

      {/* Expanded Food Items */}
      {expanded && (
        <div className={`border-t px-4 pb-4 pt-3 ${isDark ? "border-white/10" : "border-gray-100"}`}>
          <div className="space-y-3">
            {meal.items.map((item, i) => (
              <div key={i} className={`flex items-start justify-between gap-4 py-2 ${i > 0 ? (isDark ? "border-t border-white/5" : "border-t border-gray-50") : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{item.name}</p>
                  <p className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>{item.portion}</p>
                  {item.notes && (
                    <p className={`text-xs mt-1 italic ${isDark ? "text-white/30" : "text-gray-400"}`}>{item.notes}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-gray-700"}`}>{item.calories} cal</p>
                  <p className={`text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}>
                    P: {item.proteinG}g · C: {item.carbsG}g · F: {item.fatG}g
                  </p>
                </div>
              </div>
            ))}
          </div>
          {meal.tip && (
            <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${isDark ? "bg-[#E11D2A]/10 text-[#E11D2A]/80" : "bg-red-50 text-red-600"}`}>
              💡 {meal.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MealPlanTab({ isDark }: Props) {
  const utils = trpc.useUtils();
  const { data: intake, isLoading: intakeLoading } = trpc.mealPlan.getIntake.useQuery();
  const { data: todaysPlan, isLoading: planLoading } = trpc.mealPlan.getTodaysPlan.useQuery();
  const generatePlan = trpc.mealPlan.generateTodaysPlan.useMutation({
    onSuccess: () => {
      utils.mealPlan.getTodaysPlan.invalidate();
      toast.success("New meal plan generated!");
    },
    onError: (e) => toast.error(e.message),
  });
  const markCompleted = trpc.mealPlan.markCompleted.useMutation({
    onSuccess: () => {
      utils.mealPlan.getTodaysPlan.invalidate();
      toast.success("Great job! Plan marked as completed 🎉");
    },
  });

  const t = {
    text: isDark ? "text-white" : "text-gray-900",
    textSub: isDark ? "text-white/60" : "text-gray-500",
  };

  if (intakeLoading || planLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#E11D2A]/30 border-t-[#E11D2A] rounded-full animate-spin" />
      </div>
    );
  }

  // No intake yet — show questionnaire
  if (!intake) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#E11D2A]/10 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-[#E11D2A]" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${t.text}`}>Your Personalized Meal Plan</h2>
          <p className={`text-sm max-w-md mx-auto ${t.textSub}`}>
            Answer a few quick questions and our AI nutritionist will create a daily meal plan tailored to your kickboxing goals.
          </p>
        </div>
        <MealPlanIntakeForm
          isDark={isDark}
          onComplete={() => {
            utils.mealPlan.getIntake.invalidate();
            utils.mealPlan.getTodaysPlan.invalidate();
          }}
        />
      </div>
    );
  }

  // Intake done but no plan for today
  if (!todaysPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E11D2A]/10 flex items-center justify-center mb-4">
          <Utensils className="w-8 h-8 text-[#E11D2A]" />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${t.text}`}>No plan for today yet</h3>
        <p className={`text-sm mb-6 ${t.textSub}`}>Generate your personalized meal plan for today.</p>
        <Button
          onClick={() => generatePlan.mutate()}
          disabled={generatePlan.isPending}
          className="bg-[#E11D2A] hover:bg-[#c41a25] text-white px-8 py-3"
        >
          {generatePlan.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4" /> Generate Today's Plan
            </span>
          )}
        </Button>
      </div>
    );
  }

  const plan = todaysPlan.plan as DailyMealPlan;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${t.text}`}>Today's Meal Plan</h2>
          <p className={`text-sm ${t.textSub}`}>{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {todaysPlan.completed ? (
            <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markCompleted.mutate()}
              disabled={markCompleted.isPending}
              className={isDark ? "border-white/20 text-white/70 hover:bg-white/10" : ""}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Done
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => generatePlan.mutate()}
            disabled={generatePlan.isPending}
            className={isDark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-gray-500"}
            title="Regenerate plan"
          >
            <RefreshCw className={`w-4 h-4 ${generatePlan.isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Daily Tip */}
      {plan.dailyTip && (
        <div className={`px-4 py-3 rounded-xl text-sm ${isDark ? "bg-[#E11D2A]/10 border border-[#E11D2A]/20 text-white/80" : "bg-red-50 border border-red-100 text-red-700"}`}>
          💡 {plan.dailyTip}
        </div>
      )}

      {/* Macro Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MacroPill icon={Flame} label="Calories" value={`${plan.totalCalories}`} color="text-orange-400" isDark={isDark} />
        <MacroPill icon={Beef} label="Protein" value={`${plan.totalProteinG}g`} color="text-blue-400" isDark={isDark} />
        <MacroPill icon={Wheat} label="Carbs" value={`${plan.totalCarbsG}g`} color="text-amber-400" isDark={isDark} />
        <MacroPill icon={Zap} label="Fat" value={`${plan.totalFatG}g`} color="text-yellow-400" isDark={isDark} />
      </div>

      {/* Water */}
      {plan.waterOzRecommended && (
        <div className={`flex items-center gap-2 text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>
          <Droplets className="w-4 h-4 text-cyan-400" />
          Drink at least <strong className={isDark ? "text-white/80" : "text-gray-700"}>{plan.waterOzRecommended} oz</strong> of water today
        </div>
      )}

      {/* Meal Cards */}
      <div className="space-y-3">
        {plan.meals?.map((meal, i) => (
          <MealCard key={i} meal={meal} isDark={isDark} />
        ))}
      </div>

      {/* Update Profile Link */}
      <div className={`text-center text-xs pt-2 ${t.textSub}`}>
        Want a different plan?{" "}
        <button
          type="button"
          onClick={() => generatePlan.mutate()}
          className="text-[#E11D2A] hover:underline"
        >
          Regenerate
        </button>
        {" · "}
        <button
          type="button"
          onClick={() => {
            utils.mealPlan.getIntake.invalidate();
          }}
          className="text-[#E11D2A] hover:underline"
        >
          Update health profile
        </button>
      </div>
    </div>
  );
}
