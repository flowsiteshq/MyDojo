/**
 * heroContentRouter.ts
 * AI-driven holiday-aware hero content + social proof enrollment ticker
 * + $29 intro offer Stripe checkout
 */
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { enrollments, trialSignups } from "../drizzle/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import Stripe from "stripe";

// ── Program definitions ────────────────────────────────────────────────────
export const INTRO_PROGRAMS = [
  {
    id: "little-ninjas",
    name: "Little Ninjas",
    ageGroup: "3-5 Years Old",
    tagline: "BIG CONFIDENCE STARTS HERE.",
    color: "#7C3AED", // purple
    offer: "2 Classes for $29 – Uniform Included!",
    benefits: ["Builds Confidence", "Improves Focus", "Listening Skills", "Fun & Engaging Classes"],
    stripeDescription: "Little Ninjas – 2 Intro Classes + Uniform",
  },
  {
    id: "kids-martial-arts",
    name: "Kids Martial Arts",
    ageGroup: "6-12 Years Old",
    tagline: "STRONG TODAY. LEADER TOMORROW.",
    color: "#1D4ED8", // blue
    offer: "2 Classes for $29 – Uniform Included!",
    benefits: ["Builds Discipline", "Anti-Bullying Skills", "Improves Fitness", "Leadership & Respect"],
    stripeDescription: "Kids Martial Arts – 2 Intro Classes + Uniform",
  },
  {
    id: "teens-adults",
    name: "Teens & Adults Martial Arts",
    ageGroup: "13+ Years Old",
    tagline: "CONFIDENCE. FOCUS. STRENGTH.",
    color: "#B91C1C", // red
    offer: "2 Classes for $29 – Uniform Included!",
    benefits: ["Self-Defense Skills", "Stress Relief", "Improved Fitness", "Build Confidence"],
    stripeDescription: "Teens & Adults Martial Arts – 2 Intro Classes + Uniform",
  },
  {
    id: "adult-karate",
    name: "Adult Karate",
    ageGroup: "Adults",
    tagline: "DISCIPLINE. POWER. MASTERY.",
    color: "#1F2937", // dark
    offer: "2 Classes for $29 – Uniform Included!",
    benefits: ["Traditional Karate", "Self-Defense", "Mental Discipline", "Physical Fitness"],
    stripeDescription: "Adult Karate – 2 Intro Classes + Uniform",
  },
  {
    id: "kickboxing",
    name: "Kickboxing Fitness",
    ageGroup: "Teens & Adults",
    tagline: "SWEAT TODAY. FEEL AMAZING.",
    color: "#15803D", // green
    offer: "First Class FREE!",
    benefits: ["Burn Fat & Calories", "Relieve Stress", "Boost Endurance", "Fun, High-Energy Workouts"],
    stripeDescription: "Kickboxing Fitness – First Class Free",
    firstClassFree: true,
  },
] as const;

// ── Holiday / seasonal detection ──────────────────────────────────────────
function getHolidayContext(date: Date): {
  holiday: string | null;
  season: string;
  targetAudience: string;
  urgency: string | null;
} {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Check specific holidays
  // Mother's Day: 2nd Sunday of May
  const isMothersDay = (() => {
    if (month !== 5) return false;
    // Find 2nd Sunday of May
    const firstDay = new Date(date.getFullYear(), 4, 1).getDay(); // 0=Sun
    const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
    const secondSunday = firstSunday + 7;
    return day === secondSunday;
  })();

  // Father's Day: 3rd Sunday of June
  const isFathersDay = (() => {
    if (month !== 6) return false;
    const firstDay = new Date(date.getFullYear(), 5, 1).getDay();
    const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
    const thirdSunday = firstSunday + 14;
    return day === thirdSunday;
  })();

  // Back to School: Aug 1 - Sep 15
  const isBackToSchool = (month === 8) || (month === 9 && day <= 15);

  // Summer Camp season: May 11 - Aug 31
  const isSummerCamp = (month === 5 && day >= 11) || (month >= 6 && month <= 7) || (month === 8 && day <= 31);

  // Halloween: Oct
  const isHalloween = month === 10;

  // New Year: Jan 1-15
  const isNewYear = month === 1 && day <= 15;

  // Christmas/Holiday: Dec 15 - Jan 1
  const isHoliday = (month === 12 && day >= 15) || (month === 1 && day <= 1);

  // Valentine's: Feb 14 ±3
  const isValentines = month === 2 && day >= 11 && day <= 17;

  // Spring: Mar-Apr
  const isSpring = month >= 3 && month <= 4;

  if (isMothersDay) {
    return {
      holiday: "Mother's Day",
      season: "spring",
      targetAudience: "moms",
      urgency: "Give the gift of confidence this Mother's Day!",
    };
  }
  if (isFathersDay) {
    return {
      holiday: "Father's Day",
      season: "summer",
      targetAudience: "dads",
      urgency: "The best Father's Day gift — strength & discipline!",
    };
  }
  if (isBackToSchool) {
    return {
      holiday: "Back to School",
      season: "fall",
      targetAudience: "parents of school-age children",
      urgency: "Build focus & discipline before school starts!",
    };
  }
  if (isSummerCamp) {
    return {
      holiday: "Summer Camp",
      season: "summer",
      targetAudience: "parents looking for summer activities",
      urgency: "Summer Camp spots filling fast — enroll now!",
    };
  }
  if (isHalloween) {
    return {
      holiday: "Halloween",
      season: "fall",
      targetAudience: "families",
      urgency: "Train like a ninja this Halloween season!",
    };
  }
  if (isNewYear) {
    return {
      holiday: "New Year",
      season: "winter",
      targetAudience: "adults looking for fitness goals",
      urgency: "Start the New Year strong — your transformation begins now!",
    };
  }
  if (isHoliday) {
    return {
      holiday: "Holiday Season",
      season: "winter",
      targetAudience: "families",
      urgency: "Give the gift of martial arts this holiday season!",
    };
  }
  if (isValentines) {
    return {
      holiday: "Valentine's Day",
      season: "winter",
      targetAudience: "couples and families",
      urgency: "Fall in love with fitness this Valentine's Day!",
    };
  }
  if (isSpring) {
    return {
      holiday: null,
      season: "spring",
      targetAudience: "families",
      urgency: "Spring into action — limited spots available!",
    };
  }
  // Default summer
  return {
    holiday: null,
    season: "summer",
    targetAudience: "families and adults",
    urgency: null,
  };
}

// ── Router ─────────────────────────────────────────────────────────────────
export const heroContentRouter = router({
  /**
   * Get AI-generated holiday-aware hero content
   */
  getHeroContent: publicProcedure.query(async () => {
    const now = new Date();
    const ctx = getHolidayContext(now);

    // Use LLM to generate compelling hero copy
    let heroData: {
      headline: string;
      subheadline: string;
      ctaText: string;
      badgeText: string | null;
      targetMessage: string;
    };

    try {
      const prompt = ctx.holiday
        ? `You are a martial arts school marketing expert. Today is ${ctx.holiday}. 
           Generate a compelling hero banner for MyDojo Martial Arts targeting ${ctx.targetAudience}.
           The school offers: Little Ninjas (3-5), Kids Martial Arts (6-12), Teens & Adults Martial Arts (13+), Adult Karate, and Kickboxing Fitness.
           Current offer: 2 Classes for $29 + Uniform Included (karate programs) or First Class Free (kickboxing).
           ${ctx.urgency ? `Urgency message: ${ctx.urgency}` : ""}
           
           Return JSON with:
           - headline: powerful 3-6 word headline (ALL CAPS, no period)
           - subheadline: 1 sentence targeting ${ctx.targetAudience} (max 12 words)
           - ctaText: CTA button text (max 5 words, action-oriented)
           - badgeText: short badge/ribbon text for the holiday (max 4 words, or null)
           - targetMessage: 1 short sentence specifically for ${ctx.targetAudience} (max 15 words)`
        : `You are a martial arts school marketing expert. Today is a regular ${ctx.season} day.
           Generate a compelling hero banner for MyDojo Martial Arts.
           The school offers: Little Ninjas (3-5), Kids Martial Arts (6-12), Teens & Adults Martial Arts (13+), Adult Karate, and Kickboxing Fitness.
           Current offer: 2 Classes for $29 + Uniform Included (karate programs) or First Class Free (kickboxing).
           
           Return JSON with:
           - headline: powerful 3-6 word headline (ALL CAPS, no period)
           - subheadline: 1 sentence about martial arts benefits (max 12 words)
           - ctaText: CTA button text (max 5 words, action-oriented)
           - badgeText: null
           - targetMessage: 1 short motivational sentence (max 15 words)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a martial arts school marketing expert. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hero_content",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                subheadline: { type: "string" },
                ctaText: { type: "string" },
                badgeText: { type: ["string", "null"] },
                targetMessage: { type: "string" },
              },
              required: ["headline", "subheadline", "ctaText", "badgeText", "targetMessage"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      heroData = typeof content === "string" ? JSON.parse(content) : content;
    } catch (e) {
      // Fallback content
      heroData = {
        headline: ctx.holiday ? `CELEBRATE ${ctx.holiday.toUpperCase()}` : "BUILD CONFIDENCE. GET FIT.",
        subheadline: ctx.urgency || "Programs for every age. Results for life.",
        ctaText: "Claim Your Spot",
        badgeText: ctx.holiday || null,
        targetMessage: ctx.urgency || "Join hundreds of families training at MyDojo.",
      };
    }

    return {
      ...heroData,
      holiday: ctx.holiday,
      season: ctx.season,
      targetAudience: ctx.targetAudience,
      urgency: ctx.urgency,
      isSummerCamp: ctx.holiday === "Summer Camp",
      isMothersDay: ctx.holiday === "Mother's Day",
    };
  }),

  /**
   * Get recent enrollments for social proof ticker
   * Uses trialSignups (which has program) + recent enrollments
   */
  getRecentEnrollments: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      // Pull recent trial signups that have completed (enrolled) — they have program field
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recent = await db
        .select({
          id: trialSignups.id,
          name: trialSignups.name,
          program: trialSignups.program,
          createdAt: trialSignups.createdAt,
        })
        .from(trialSignups)
        .where(gte(trialSignups.createdAt, thirtyDaysAgo))
        .orderBy(desc(trialSignups.createdAt))
        .limit(20);

      const programLabels: Record<string, string> = {
        "Little Ninjas": "Little Ninjas",
        "Dragon Kids": "Kids Martial Arts",
        "Teens": "Teens & Adults Martial Arts",
        "Adult Karate": "Adult Karate",
        "Kickboxing": "Kickboxing Fitness",
        "After School": "After School Program",
        "Summer Camp": "Summer Camp",
        "Not Sure": "a martial arts program",
      };

      return recent.map((e) => {
        const name = e.name || "Someone";
        const parts = name.trim().split(" ");
        const displayName =
          parts.length >= 2
            ? `${parts[0]} ${parts[parts.length - 1][0]}.`
            : parts[0];

        const programDisplay = programLabels[e.program || ""] || e.program || "a program";

        const diffMs = Date.now() - new Date(e.createdAt).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        let timeAgo: string;
        if (diffHours < 1) timeAgo = "just now";
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
        else if (diffDays === 1) timeAgo = "yesterday";
        else timeAgo = `${diffDays} days ago`;

        return {
          id: e.id,
          displayName,
          program: programDisplay,
          timeAgo,
          message: `${displayName} just signed up for ${programDisplay}!`,
        };
      });
    } catch {
      return [];
    }
  }),

  /**
   * Create Stripe checkout session for $29 intro offer
   */
  createIntroOfferCheckout: publicProcedure
    .input(
      z.object({
        programId: z.enum([
          "little-ninjas",
          "kids-martial-arts",
          "teens-adults",
          "adult-karate",
          "kickboxing",
        ]),
        customerName: z.string().min(2),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(10),
        origin: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const program = INTRO_PROGRAMS.find((p) => p.id === input.programId);
      if (!program) throw new Error("Invalid program");

      const stripe = new Stripe(
        process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "",
        { apiVersion: "2026-01-28.clover" as any }
      );

      const origin = input.origin || "https://mydojoma.com";
      const isKickboxing = input.programId === "kickboxing";

      // For kickboxing (first class free), charge $0 — create a free session
      const unitAmount = isKickboxing ? 0 : 2900; // $29.00

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: input.customerEmail,
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: unitAmount,
              product_data: {
                name: program.stripeDescription,
                description: isKickboxing
                  ? "Your first kickboxing class is on us! Come experience the energy."
                  : "2 intro classes + uniform included. No long-term commitment required.",
                images: [],
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          program_id: input.programId,
          program_name: program.name,
          customer_name: input.customerName,
          customer_phone: input.customerPhone,
          offer_type: isKickboxing ? "first_class_free" : "intro_29",
        },
        client_reference_id: `intro_${input.programId}_${Date.now()}`,
        success_url: `${origin}/enrollment-success?session_id={CHECKOUT_SESSION_ID}&program=${encodeURIComponent(program.name)}&type=intro`,
        cancel_url: `${origin}/?offer=cancelled`,
        custom_text: {
          submit: {
            message: isKickboxing
              ? "We'll confirm your first free class via email!"
              : "You'll receive a confirmation with class schedule details.",
          },
        },
      });

      return { checkoutUrl: session.url, sessionId: session.id };
    }),
});
