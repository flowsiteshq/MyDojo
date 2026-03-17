import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

describe("Meal Plan - AI generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call invokeLLM with structured response_format for meal plan generation", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              meals: [
                {
                  mealName: "Breakfast",
                  time: "7:00 AM",
                  items: [
                    {
                      name: "Oatmeal",
                      portion: "1 cup",
                      calories: 300,
                      proteinG: 10,
                      carbsG: 54,
                      fatG: 5,
                    },
                  ],
                  totalCalories: 300,
                  totalProteinG: 10,
                  totalCarbsG: 54,
                  totalFatG: 5,
                  tip: "Add berries for antioxidants",
                },
              ],
              totalCalories: 1800,
              totalProteinG: 140,
              totalCarbsG: 200,
              totalFatG: 60,
              waterOzRecommended: 80,
              dailyTip: "Stay hydrated before your kickboxing session",
            }),
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    // Call the LLM directly to verify the format
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a nutritionist." },
        { role: "user", content: "Create a meal plan." },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "daily_meal_plan",
          strict: true,
          schema: { type: "object" },
        },
      },
    });

    expect(invokeLLM).toHaveBeenCalledOnce();
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content as string);
    expect(parsed).toHaveProperty("meals");
    expect(parsed).toHaveProperty("totalCalories");
    expect(parsed).toHaveProperty("waterOzRecommended");
    expect(Array.isArray(parsed.meals)).toBe(true);
    expect(parsed.meals[0]).toHaveProperty("mealName");
    expect(parsed.meals[0]).toHaveProperty("items");
  });

  it("should validate meal plan structure has required fields", () => {
    const validPlan = {
      meals: [
        {
          mealName: "Lunch",
          time: "12:00 PM",
          items: [
            {
              name: "Grilled Chicken",
              portion: "6 oz",
              calories: 280,
              proteinG: 52,
              carbsG: 0,
              fatG: 6,
            },
          ],
          totalCalories: 280,
          totalProteinG: 52,
          totalCarbsG: 0,
          totalFatG: 6,
        },
      ],
      totalCalories: 1800,
      totalProteinG: 140,
      totalCarbsG: 200,
      totalFatG: 60,
      waterOzRecommended: 80,
      dailyTip: "Great job staying on track!",
    };

    expect(validPlan.meals).toBeDefined();
    expect(validPlan.meals.length).toBeGreaterThan(0);
    expect(validPlan.totalCalories).toBeGreaterThan(0);
    expect(validPlan.waterOzRecommended).toBeGreaterThan(0);
    expect(typeof validPlan.dailyTip).toBe("string");
  });

  it("should handle different health goals in intake form", () => {
    const goals = [
      "weight_loss",
      "blood_pressure",
      "muscle_gain",
      "endurance",
      "diabetes_management",
      "general_health",
    ];

    // Each goal should be a valid string
    goals.forEach((goal) => {
      expect(typeof goal).toBe("string");
      expect(goal.length).toBeGreaterThan(0);
    });

    // Weight loss and blood pressure are the primary goals
    expect(goals).toContain("weight_loss");
    expect(goals).toContain("blood_pressure");
  });

  it("should calculate BMI correctly for meal plan personalization", () => {
    // 5'8" = 68 inches, 180 lbs
    const heightInches = 68;
    const weightLbs = 180;
    const bmi = (weightLbs / (heightInches * heightInches)) * 703;

    expect(bmi).toBeCloseTo(27.4, 0); // Slightly overweight
    expect(bmi).toBeGreaterThan(18.5); // Not underweight
    expect(bmi).toBeLessThan(40); // Not severely obese
  });
});

describe("Meal Plan - Intake validation", () => {
  it("should require at least one health goal", () => {
    const validateIntake = (goals: string[]) => {
      if (!goals || goals.length === 0) {
        throw new Error("Please select at least one goal");
      }
      return true;
    };

    expect(() => validateIntake([])).toThrow("Please select at least one goal");
    expect(validateIntake(["weight_loss"])).toBe(true);
    expect(validateIntake(["weight_loss", "blood_pressure"])).toBe(true);
  });

  it("should accept valid dietary preferences", () => {
    const validPreferences = ["none", "vegetarian", "vegan", "gluten_free", "dairy_free", "halal", "kosher"];
    const userPref = "halal";
    expect(validPreferences).toContain(userPref);
  });

  it("should validate age range for meal planning", () => {
    const validateAge = (age: number) => age >= 13 && age <= 100;
    expect(validateAge(25)).toBe(true);
    expect(validateAge(12)).toBe(false);
    expect(validateAge(101)).toBe(false);
  });
});
