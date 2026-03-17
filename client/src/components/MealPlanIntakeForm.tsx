/**
 * MealPlanIntakeForm
 *
 * Multi-step health questionnaire for kickboxing members to personalize
 * their AI-generated daily meal plan.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Flame,
  Heart,
  Zap,
  TrendingDown,
  Activity,
  Moon,
  Droplets,
  Apple,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntakeFormData {
  goals: string[];
  weightLbs: string;
  targetWeightLbs: string;
  heightFt: string;
  heightIn: string;
  age: string;
  sex: string;
  activityLevel: string;
  dietaryRestrictions: string[];
  healthConditions: string[];
  mealsPerDay: number;
  includeSnacks: boolean;
  additionalNotes: string;
}

interface Props {
  isDark: boolean;
  onComplete: () => void;
}

// ─── Option Data ──────────────────────────────────────────────────────────────

const GOALS = [
  { id: "lose_weight", label: "Lose Weight", icon: TrendingDown, color: "text-orange-400" },
  { id: "lower_blood_pressure", label: "Lower Blood Pressure", icon: Heart, color: "text-red-400" },
  { id: "build_muscle", label: "Build Muscle", icon: Zap, color: "text-yellow-400" },
  { id: "increase_energy", label: "Increase Energy", icon: Flame, color: "text-amber-400" },
  { id: "improve_endurance", label: "Improve Endurance", icon: Activity, color: "text-blue-400" },
  { id: "reduce_inflammation", label: "Reduce Inflammation", icon: Droplets, color: "text-cyan-400" },
  { id: "manage_diabetes", label: "Manage Blood Sugar", icon: Apple, color: "text-green-400" },
  { id: "improve_sleep", label: "Improve Sleep", icon: Moon, color: "text-purple-400" },
  { id: "general_health", label: "General Health", icon: Heart, color: "text-pink-400" },
];

const DIETARY_RESTRICTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free",
  "Nut-Free", "Halal", "Kosher", "Low-Sodium", "Low-Carb / Keto",
];

const HEALTH_CONDITIONS = [
  "High Blood Pressure", "Type 2 Diabetes", "High Cholesterol",
  "Heart Disease", "Kidney Disease", "Thyroid Condition",
  "IBS / Digestive Issues", "Food Allergies",
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Mostly Sitting", desc: "Desk job, little movement" },
  { id: "light", label: "Light Activity", desc: "Walking, light chores" },
  { id: "moderate", label: "Moderately Active", desc: "Exercise 2–3x/week" },
  { id: "active", label: "Active", desc: "Exercise 4–5x/week" },
  { id: "very_active", label: "Very Active", desc: "Daily intense exercise" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MealPlanIntakeForm({ isDark, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IntakeFormData>({
    goals: [],
    weightLbs: "",
    targetWeightLbs: "",
    heightFt: "",
    heightIn: "",
    age: "",
    sex: "",
    activityLevel: "",
    dietaryRestrictions: [],
    healthConditions: [],
    mealsPerDay: 3,
    includeSnacks: true,
    additionalNotes: "",
  });

  const saveIntake = trpc.mealPlan.saveIntake.useMutation();
  const generatePlan = trpc.mealPlan.generateTodaysPlan.useMutation();

  const t = {
    bg: isDark ? "bg-black/40 border-white/10" : "bg-white border-gray-200",
    text: isDark ? "text-white" : "text-gray-900",
    textSub: isDark ? "text-white/60" : "text-gray-500",
    input: isDark
      ? "bg-white/10 border-white/20 text-white placeholder-white/30 focus:border-[#E11D2A]/60"
      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#E11D2A]",
    optionBase: isDark
      ? "border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
      : "border-gray-200 bg-gray-50 hover:bg-red-50 cursor-pointer transition-all",
    optionSelected: isDark
      ? "border-[#E11D2A] bg-[#E11D2A]/10"
      : "border-[#E11D2A] bg-red-50",
  };

  function toggleArray(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const STEPS = [
    "Your Goals",
    "Body Info",
    "Activity",
    "Diet & Health",
    "Preferences",
  ];

  async function handleSubmit() {
    if (form.goals.length === 0) {
      toast.error("Please select at least one goal");
      return;
    }
    try {
      const heightInches =
        form.heightFt || form.heightIn
          ? (parseInt(form.heightFt || "0") * 12) + parseInt(form.heightIn || "0")
          : undefined;

      await saveIntake.mutateAsync({
        goals: form.goals,
        weightLbs: form.weightLbs ? parseInt(form.weightLbs) : undefined,
        targetWeightLbs: form.targetWeightLbs ? parseInt(form.targetWeightLbs) : undefined,
        heightInches,
        age: form.age ? parseInt(form.age) : undefined,
        sex: form.sex as any || undefined,
        activityLevel: form.activityLevel as any || undefined,
        dietaryRestrictions: form.dietaryRestrictions,
        healthConditions: form.healthConditions,
        mealsPerDay: form.mealsPerDay,
        includeSnacks: form.includeSnacks,
        additionalNotes: form.additionalNotes || undefined,
      });

      toast("Profile saved! Generating your meal plan...");
      await generatePlan.mutateAsync();
      toast.success("Your personalized meal plan is ready! 🥗");
      onComplete();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
  }

  const isLoading = saveIntake.isPending || generatePlan.isPending;

  return (
    <div className={`rounded-2xl border p-6 md:p-8 ${t.bg}`}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step
                    ? "bg-[#E11D2A] text-white"
                    : i === step
                    ? "bg-[#E11D2A] text-white ring-4 ring-[#E11D2A]/20"
                    : isDark
                    ? "bg-white/10 text-white/40"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 md:w-16 mx-1 transition-all ${
                    i < step ? "bg-[#E11D2A]" : isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className={`text-sm font-medium ${t.textSub}`}>
          Step {step + 1} of {STEPS.length}: <span className={t.text}>{STEPS[step]}</span>
        </p>
      </div>

      {/* Step 0: Goals */}
      {step === 0 && (
        <div>
          <h3 className={`text-xl font-bold mb-2 ${t.text}`}>What are your health goals?</h3>
          <p className={`text-sm mb-6 ${t.textSub}`}>Select all that apply — your meal plan will be tailored to these.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GOALS.map(({ id, label, icon: Icon, color }) => {
              const selected = form.goals.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, goals: toggleArray(f.goals, id) }))}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left ${
                    selected ? t.optionSelected : t.optionBase
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? "text-[#E11D2A]" : color}`} />
                  <span className={`text-sm font-medium ${selected ? (isDark ? "text-white" : "text-gray-900") : t.textSub}`}>
                    {label}
                  </span>
                  {selected && <Check className="w-4 h-4 text-[#E11D2A] ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Body Info */}
      {step === 1 && (
        <div>
          <h3 className={`text-xl font-bold mb-2 ${t.text}`}>Tell us about your body</h3>
          <p className={`text-sm mb-6 ${t.textSub}`}>This helps us calculate the right calorie targets for you.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.textSub}`}>Current Weight (lbs)</label>
              <input
                type="number"
                placeholder="e.g. 185"
                value={form.weightLbs}
                onChange={(e) => setForm((f) => ({ ...f, weightLbs: e.target.value }))}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none ${t.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.textSub}`}>Target Weight (lbs)</label>
              <input
                type="number"
                placeholder="e.g. 165"
                value={form.targetWeightLbs}
                onChange={(e) => setForm((f) => ({ ...f, targetWeightLbs: e.target.value }))}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none ${t.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.textSub}`}>Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="ft"
                  value={form.heightFt}
                  onChange={(e) => setForm((f) => ({ ...f, heightFt: e.target.value }))}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none ${t.input}`}
                />
                <input
                  type="number"
                  placeholder="in"
                  value={form.heightIn}
                  onChange={(e) => setForm((f) => ({ ...f, heightIn: e.target.value }))}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none ${t.input}`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.textSub}`}>Age</label>
              <input
                type="number"
                placeholder="e.g. 35"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none ${t.input}`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${t.textSub}`}>Biological Sex</label>
              <div className="flex gap-3">
                {["male", "female", "other"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sex: s }))}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                      form.sex === s ? t.optionSelected + " text-[#E11D2A]" : t.optionBase + " " + t.textSub
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Activity Level */}
      {step === 2 && (
        <div>
          <h3 className={`text-xl font-bold mb-2 ${t.text}`}>How active are you outside of kickboxing?</h3>
          <p className={`text-sm mb-6 ${t.textSub}`}>This helps us set the right energy intake for your lifestyle.</p>
          <div className="flex flex-col gap-3">
            {ACTIVITY_LEVELS.map(({ id, label, desc }) => {
              const selected = form.activityLevel === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, activityLevel: id }))}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left ${
                    selected ? t.optionSelected : t.optionBase
                  }`}
                >
                  <div>
                    <p className={`font-semibold text-sm ${selected ? (isDark ? "text-white" : "text-gray-900") : t.text}`}>{label}</p>
                    <p className={`text-xs mt-0.5 ${t.textSub}`}>{desc}</p>
                  </div>
                  {selected && <Check className="w-5 h-5 text-[#E11D2A] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Dietary Restrictions & Health Conditions */}
      {step === 3 && (
        <div>
          <h3 className={`text-xl font-bold mb-2 ${t.text}`}>Any dietary restrictions or health conditions?</h3>
          <p className={`text-sm mb-5 ${t.textSub}`}>Select all that apply. Skip if none.</p>

          <p className={`text-sm font-semibold mb-3 ${t.text}`}>Dietary Restrictions</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {DIETARY_RESTRICTIONS.map((r) => {
              const selected = form.dietaryRestrictions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, dietaryRestrictions: toggleArray(f.dietaryRestrictions, r) }))}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    selected
                      ? "border-[#E11D2A] bg-[#E11D2A]/10 text-[#E11D2A]"
                      : isDark
                      ? "border-white/10 text-white/60 hover:border-white/30"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <p className={`text-sm font-semibold mb-3 ${t.text}`}>Health Conditions</p>
          <div className="flex flex-wrap gap-2">
            {HEALTH_CONDITIONS.map((c) => {
              const selected = form.healthConditions.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, healthConditions: toggleArray(f.healthConditions, c) }))}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    selected
                      ? "border-[#E11D2A] bg-[#E11D2A]/10 text-[#E11D2A]"
                      : isDark
                      ? "border-white/10 text-white/60 hover:border-white/30"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Meal Preferences */}
      {step === 4 && (
        <div>
          <h3 className={`text-xl font-bold mb-2 ${t.text}`}>Meal preferences</h3>
          <p className={`text-sm mb-6 ${t.textSub}`}>Almost done! Just a few final preferences.</p>

          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-semibold mb-3 ${t.text}`}>
                How many main meals per day?
              </label>
              <div className="flex gap-3">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mealsPerDay: n }))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                      form.mealsPerDay === n
                        ? "border-[#E11D2A] bg-[#E11D2A]/10 text-[#E11D2A]"
                        : isDark
                        ? "border-white/10 text-white/60 hover:border-white/30"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 ${t.text}`}>Include snacks?</label>
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, includeSnacks: val }))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                      form.includeSnacks === val
                        ? "border-[#E11D2A] bg-[#E11D2A]/10 text-[#E11D2A]"
                        : isDark
                        ? "border-white/10 text-white/60 hover:border-white/30"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {val ? "Yes, include snacks" : "No snacks"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${t.text}`}>
                Anything else we should know? <span className={`font-normal ${t.textSub}`}>(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. I don't like fish, I prefer simple recipes, I eat dinner late..."
                value={form.additionalNotes}
                onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none ${t.input}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className={isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900"}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => {
              if (step === 0 && form.goals.length === 0) {
                toast.error("Please select at least one goal");
                return;
              }
              setStep((s) => s + 1);
            }}
            className="bg-[#E11D2A] hover:bg-[#c41a25] text-white px-6"
          >
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[#E11D2A] hover:bg-[#c41a25] text-white px-8"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {generatePlan.isPending ? "Generating your plan..." : "Saving..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4" /> Generate My Meal Plan
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
