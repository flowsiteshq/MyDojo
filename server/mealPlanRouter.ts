/**
 * Meal Plan Router
 *
 * Handles the kickboxing-specific personalized meal plan feature.
 * Flow:
 *  1. Member completes health intake questionnaire (saveMealPlanIntake)
 *  2. AI generates a daily meal plan based on their goals (generateTodaysMealPlan)
 *  3. Member views today's plan (getTodaysMealPlan)
 *  4. Member can regenerate or mark meals as completed
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { mealPlanIntake, mealPlans } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  mealName: string; // "Breakfast", "Morning Snack", "Lunch", etc.
  time: string;     // "7:00 AM"
  items: MealItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  tip?: string;     // Optional motivational or health tip for this meal
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

// ─── Helper: get today's date string ─────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Helper: build AI prompt from intake ─────────────────────────────────────

function buildMealPlanPrompt(intake: typeof mealPlanIntake.$inferSelect): string {
  const goals: string[] = JSON.parse(intake.goals || "[]");
  const restrictions: string[] = JSON.parse(intake.dietaryRestrictions || "[]");
  const conditions: string[] = JSON.parse(intake.healthConditions || "[]");

  const goalLabels: Record<string, string> = {
    lose_weight: "lose weight",
    lower_blood_pressure: "lower blood pressure",
    build_muscle: "build muscle",
    increase_energy: "increase energy levels",
    improve_endurance: "improve endurance for kickboxing",
    reduce_inflammation: "reduce inflammation",
    manage_diabetes: "manage blood sugar / diabetes",
    improve_sleep: "improve sleep quality",
    general_health: "improve overall health",
  };

  const goalText = goals.map((g) => goalLabels[g] || g).join(", ");
  const restrictionText = restrictions.length > 0 ? restrictions.join(", ") : "none";
  const conditionText = conditions.length > 0 ? conditions.join(", ") : "none";

  const mealsPerDay = intake.mealsPerDay ?? 3;
  const includeSnacks = (intake.includeSnacks ?? 1) === 1;

  const weightInfo = intake.weightLbs
    ? `Current weight: ${intake.weightLbs} lbs${intake.targetWeightLbs ? `, target: ${intake.targetWeightLbs} lbs` : ""}.`
    : "";
  const heightInfo = intake.heightInches
    ? `Height: ${Math.floor(intake.heightInches / 12)}ft ${intake.heightInches % 12}in.`
    : "";
  const ageInfo = intake.age ? `Age: ${intake.age}.` : "";
  const sexInfo = intake.sex ? `Sex: ${intake.sex}.` : "";
  const activityInfo = intake.activityLevel
    ? `Activity level (outside kickboxing): ${intake.activityLevel}.`
    : "";

  const mealCount = includeSnacks ? mealsPerDay + 2 : mealsPerDay;

  return `You are a certified sports nutritionist creating a personalized daily meal plan for a kickboxing student.

MEMBER PROFILE:
- Goals: ${goalText}
- ${weightInfo} ${heightInfo} ${ageInfo} ${sexInfo}
- ${activityInfo}
- Dietary restrictions: ${restrictionText}
- Health conditions: ${conditionText}
- Preferred meals per day: ${mealsPerDay} main meals${includeSnacks ? " + 2 snacks" : ""}
${intake.additionalNotes ? `- Additional notes: ${intake.additionalNotes}` : ""}

Create a complete, realistic, and delicious daily meal plan with exactly ${mealCount} meal blocks (${mealsPerDay} main meals${includeSnacks ? " + morning snack + afternoon snack" : ""}).

For each meal provide:
- Specific food items with realistic portion sizes
- Accurate calorie and macro estimates (protein, carbs, fat in grams)
- A brief tip or note for that meal when relevant

Prioritize:
- High protein to support kickboxing training and muscle recovery
- Anti-inflammatory foods if blood pressure or inflammation is a concern
- Balanced blood sugar if diabetes/weight loss is a goal
- Practical, affordable, everyday foods (not exotic ingredients)
- Variety and flavor — this should be food people actually want to eat

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "meals": [
    {
      "mealName": "Breakfast",
      "time": "7:00 AM",
      "items": [
        {
          "name": "Scrambled Eggs",
          "portion": "3 large eggs",
          "calories": 210,
          "proteinG": 18,
          "carbsG": 2,
          "fatG": 14,
          "notes": "Use olive oil spray instead of butter"
        }
      ],
      "totalCalories": 450,
      "totalProteinG": 35,
      "totalCarbsG": 40,
      "totalFatG": 15,
      "tip": "Eat within 30 minutes of waking to kickstart metabolism"
    }
  ],
  "totalCalories": 1800,
  "totalProteinG": 140,
  "totalCarbsG": 180,
  "totalFatG": 55,
  "waterOzRecommended": 96,
  "dailyTip": "Stay hydrated — drink a glass of water before each meal to help with portion control."
}`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const mealPlanRouter = router({
  // Get the member's saved intake (to check if they've completed it)
  getIntake: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [intake] = await db
      .select()
      .from(mealPlanIntake)
      .where(eq(mealPlanIntake.userId, ctx.user.id))
      .limit(1);

    return intake ?? null;
  }),

  // Save / update the intake questionnaire
  saveIntake: protectedProcedure
    .input(
      z.object({
        goals: z.array(z.string()).min(1, "Select at least one goal"),
        weightLbs: z.number().optional(),
        targetWeightLbs: z.number().optional(),
        heightInches: z.number().optional(),
        age: z.number().optional(),
        sex: z.enum(["male", "female", "other"]).optional(),
        activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
        dietaryRestrictions: z.array(z.string()).default([]),
        healthConditions: z.array(z.string()).default([]),
        mealsPerDay: z.number().min(2).max(6).default(3),
        includeSnacks: z.boolean().default(true),
        additionalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const values = {
        userId: ctx.user.id,
        goals: JSON.stringify(input.goals),
        weightLbs: input.weightLbs ?? null,
        targetWeightLbs: input.targetWeightLbs ?? null,
        heightInches: input.heightInches ?? null,
        age: input.age ?? null,
        sex: input.sex ?? null,
        activityLevel: input.activityLevel ?? null,
        dietaryRestrictions: JSON.stringify(input.dietaryRestrictions),
        healthConditions: JSON.stringify(input.healthConditions),
        mealsPerDay: input.mealsPerDay,
        includeSnacks: input.includeSnacks ? 1 : 0,
        additionalNotes: input.additionalNotes ?? null,
      };

      // Upsert
      const [existing] = await db
        .select({ id: mealPlanIntake.id })
        .from(mealPlanIntake)
        .where(eq(mealPlanIntake.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db.update(mealPlanIntake).set(values).where(eq(mealPlanIntake.userId, ctx.user.id));
      } else {
        await db.insert(mealPlanIntake).values(values);
      }

      return { success: true };
    }),

  // Get today's meal plan (or null if not generated yet)
  getTodaysPlan: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const today = todayStr();
    const [plan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, ctx.user.id), eq(mealPlans.planDate, today)))
      .limit(1);

    if (!plan) return null;

    return {
      ...plan,
      plan: JSON.parse(plan.planJson) as DailyMealPlan,
    };
  }),

  // Generate today's meal plan using AI
  generateTodaysPlan: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get intake
    const [intake] = await db
      .select()
      .from(mealPlanIntake)
      .where(eq(mealPlanIntake.userId, ctx.user.id))
      .limit(1);

    if (!intake) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Please complete your health profile first",
      });
    }

    const today = todayStr();

    // Delete any existing plan for today (regenerate)
    await db
      .delete(mealPlans)
      .where(and(eq(mealPlans.userId, ctx.user.id), eq(mealPlans.planDate, today)));

    // Call AI
    const prompt = buildMealPlanPrompt(intake);
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a certified sports nutritionist. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
    });

    const rawContent = String(response.choices?.[0]?.message?.content ?? "");

    let plan: DailyMealPlan;
    try {
      // Strip any markdown code fences if present
      const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      plan = JSON.parse(cleaned);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse AI meal plan response",
      });
    }

    // Insert into DB
    await db.insert(mealPlans).values({
      userId: ctx.user.id,
      planDate: today,
      planJson: JSON.stringify(plan),
      totalCalories: plan.totalCalories,
      totalProteinG: plan.totalProteinG,
      totalCarbsG: plan.totalCarbsG,
      totalFatG: plan.totalFatG,
    });

    return {
      success: true,
      plan,
    };
  }),

  // Mark today's plan as completed
  markCompleted: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const today = todayStr();
    await db
      .update(mealPlans)
      .set({ completed: 1 })
      .where(and(eq(mealPlans.userId, ctx.user.id), eq(mealPlans.planDate, today)));

    return { success: true };
  }),
});
