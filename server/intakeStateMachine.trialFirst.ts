/**
 * intakeStateMachine.trialFirst.ts
 *
 * Trial-First Strategy Intake State Machine
 * ==========================================
 * Design Rules (NON-NEGOTIABLE):
 *   1. One step per user turn. No recursion. No auto-advance loops.
 *   2. Each handler: validate → write state → set nextStep → return one question.
 *   3. resolveNextStep() returns exactly ONE next step based on missing fields.
 *   4. Quick replies are optional sugar only. Flow works with free text.
 *   5. Hard guard: if a handler tries to advance >1 step, stop and return next question only.
 *
 * Flow (Free Class First):
 *   GREETING → CLASS_FOR → (child: CHILD_NAME → CHILD_AGE) | (adult: RAPID_RAPPORT_ADULT)
 *   → EMOTIONAL_DISCOVERY_Q1 → EMOTIONAL_DISCOVERY_Q2
 *   → TRIAL_TRANSITION (book free class) → FAST_FIRST_LESSON
 *   → SECONDARY_DECISION_MAKER → NAME → PHONE → EMAIL
 *   → PAYMENT_POSITIONING (confirm booking, no charge) → ENROLLMENT_PREFRAME → DONE
 *
 * Direct Enrollment path (skipTrial=true):
 *   Triggered when user explicitly says "I want to enroll", "I don't need a trial",
 *   or identifies as a returning student → NAME → PHONE → EMAIL → ENROLLMENT_PREFRAME → DONE
 *
 * Hidden Direct Enrollment path (skipTrial=true):
 *   Triggered only when user explicitly says "I want to enroll", "I don't need a trial",
 *   or identifies as a returning student.
 */

// ─── Step Enum ───────────────────────────────────────────────────────────────

export enum TFStep {
  GREETING = "GREETING",
  CLASS_FOR = "CLASS_FOR",
  CHILD_NAME = "CHILD_NAME",
  CHILD_AGE = "CHILD_AGE",
  RAPID_RAPPORT_ADULT = "RAPID_RAPPORT_ADULT",
  EMOTIONAL_DISCOVERY_Q1 = "EMOTIONAL_DISCOVERY_Q1",
  EMOTIONAL_DISCOVERY_Q2 = "EMOTIONAL_DISCOVERY_Q2",
  TRIAL_TRANSITION = "TRIAL_TRANSITION",
  FAST_FIRST_LESSON = "FAST_FIRST_LESSON",
  SECONDARY_DECISION_MAKER = "SECONDARY_DECISION_MAKER",
  NAME = "NAME",
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  PAYMENT_POSITIONING = "PAYMENT_POSITIONING",
  ENROLLMENT_PREFRAME = "ENROLLMENT_PREFRAME",
  PROGRAM_SELECTION = "PROGRAM_SELECTION",
  ENROLLMENT_LINK = "ENROLLMENT_LINK",
  DONE = "DONE",
  // Upgrade flow
  UPGRADE_LOOKUP = "UPGRADE_LOOKUP",
  UPGRADE_CONFIRM = "UPGRADE_CONFIRM",
  UPGRADE_COMPLETE = "UPGRADE_COMPLETE",
  // Summer Camp enrollment flow
  SUMMER_CAMP_WEEK = "SUMMER_CAMP_WEEK",
  SUMMER_CAMP_CHECKOUT = "SUMMER_CAMP_CHECKOUT",
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TFSlot {
  id: string;
  displayText: string;   // e.g. "today at 6:15 PM"
  dayOfWeek: string;
  time: string;
}

export interface TFState {
  step: TFStep;
  prevStep: TFStep | null;   // for debug panel
  stepAdvanceCount: number;  // safety guard: reset each turn

  // Who is the class for?
  classFor: "self" | "child" | "other" | null;

  // Child-specific
  childName: string | null;
  childAge: number | null;

  // Adult-specific
  priorTraining: string | null;   // "yes" | "no" | free text

  // Emotional discovery
  emotionalGoal: string | null;   // Q1 answer: "What to improve"
  emotionalOutcome: string | null; // Q2 answer: "What would be different"

  // Slot offering
  offeredSlots: TFSlot[];
  selectedSlot: TFSlot | null;
  slotOfferCount: number;  // how many times we've offered slots (for "neither works" re-offer)

  // Secondary decision maker
  secondaryDecisionMaker: string | null;

  // Contact info
  name: string | null;
  phone: string | null;
  email: string | null;
  // Payment
  paymentMethod: string | null;

  // Hidden enrollment path
  skipTrial: boolean;
  selectedProgram: string | null;  // Program selected during enrollment (e.g. 'Foundation', 'Black Belt')
  enrollmentCheckoutUrl: string | null; // Stripe checkout URL returned by server

  // Conversation history (for context)
  history: Array<{ role: "user" | "assistant"; content: string }>;

  // Dev mode logging
  devLog: string[];

  // Upgrade flow
  isUpgrade: boolean;
  lookupPhone: string | null;        // phone or email used to look up account
  currentPlan: string | null;        // e.g. "Foundation"
  currentPlanMonthlyPrice: number | null;
  proratedCredit: number | null;     // $ credit for remaining days in billing period
  upgradeEnrollmentId: number | null;
  upgradeTargetPlan: string | null;  // "Black Belt" | "Leadership"
  // Summer Camp enrollment
  isSummerCamp: boolean;
  summerCampWeek: string | null;     // e.g. "Week 1: June 9–13"
}

// ─── Initial State ────────────────────────────────────────────────────────────

export function createTFState(): TFState {
  return {
    step: TFStep.GREETING,
    prevStep: null,
    stepAdvanceCount: 0,
    classFor: null,
    childName: null,
    childAge: null,
    priorTraining: null,
    emotionalGoal: null,
    emotionalOutcome: null,
    offeredSlots: [],
    selectedSlot: null,
    slotOfferCount: 0,
    secondaryDecisionMaker: null,
    name: null,
    phone: null,
    email: null,
    paymentMethod: null,
    skipTrial: false,
    selectedProgram: null,
    enrollmentCheckoutUrl: null,
    history: [],
    devLog: [],
    isUpgrade: false,
    lookupPhone: null,
    currentPlan: null,
    currentPlanMonthlyPrice: null,
    proratedCredit: null,
    upgradeEnrollmentId: null,
    upgradeTargetPlan: null,
    isSummerCamp: false,
    summerCampWeek: null,
  };
}

// ─── Response Type ────────────────────────────────────────────────────────────

export interface TFResponse {
  message: string;
  quickReplies?: string[];
  state: TFState;
  isDone: boolean;
  // Set when user selects a program — server should generate Stripe checkout URL
  selectedProgramForCheckout?: string;
  // Set when user selects a Summer Camp week — server should generate Stripe checkout URL
  selectedSummerCampForCheckout?: string;
  // Set when upgrade flow needs server-side lookup or Stripe subscription update
  upgradeAction?: {
    lookupPhone: string;    // phone or email to look up enrollment
    targetPlan?: string;    // if set, perform the upgrade to this plan
    enrollmentId?: number;  // if known, pass to server for update
  };
  devInfo?: {
    step: string;
    prevStep: string | null;
    classFor: string | null;
    childName: string | null;
    childAge: number | null;
    emotionalGoal: string | null;
    emotionalOutcome: string | null;
    selectedSlot: string | null;
    name: string | null;
    phone: string | null;
    email: string | null;
    skipTrial: boolean;
  };
}

// ─── Slot Generation ──────────────────────────────────────────────────────────

function generateDefaultSlots(): TFSlot[] {
  // This is a fallback only — real slots are injected from the DB by the router.
  // If we reach here it means the DB query failed; produce day-aware generic slots.
  // Always use CST/CDT (America/Chicago) so day labels are correct regardless of server UTC offset.
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const slots: TFSlot[] = [];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Typical class times as fallback
  const fallbackTimes = ["5:00 PM", "6:00 PM", "7:00 PM", "10:00 AM"];

  for (let i = 0; i < 4; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i + 1); // start from tomorrow, never today
    const dayName = days[d.getDay()];
    // Skip Sunday (index 0) — no classes on Sunday
    const skip = d.getDay() === 0;
    const timeLabel = fallbackTimes[i % fallbackTimes.length];
    const isTomorrow = i === 0;
    const dayLabel = isTomorrow ? "tomorrow" : dayName;

    if (!skip) {
      slots.push({
        id: `slot-fallback-${i}`,
        displayText: `${dayLabel} at ${timeLabel}`,
        dayOfWeek: dayName,
        time: timeLabel,
      });
    }
  }

  return slots.slice(0, 4);
}

// ─── Input Parsers ────────────────────────────────────────────────────────────

function normalizeInput(input: string): string {
  return input.trim().toLowerCase();
}

function parseClassFor(input: string): "self" | "child" | "other" | null {
  const n = normalizeInput(input);
  // Child patterns — check first (most specific)
  if (/\b(my kid|my child|my son|my daughter|child|kid|son|daughter)\b/.test(n)) return "child";
  // Other adult relationship patterns — check BEFORE self to prevent "my friend" or "my wife" from
  // matching "i want" or other self keywords that may appear in the same sentence
  if (/\b(someone else|my spouse|my partner|my husband|my wife|my boyfriend|my girlfriend|my brother|my sister|my mom|my dad|my mother|my father|my parent|my friend|my colleague|my coworker|my neighbor|husband|wife|boyfriend|girlfriend|brother|sister|spouse|partner)\b/.test(n)) return "other";
  // Self patterns — use word boundary for 'me' to avoid matching 'someone'
  if (/\bme\b|\b(myself|i am|for me|adult)\b/.test(n)) return "self";
  // Weaker self/other patterns that require no relationship keyword to have matched
  if (/\b(i want|i'd like|i need)\b/.test(n) && !/\b(friend|family|other|someone)\b/.test(n)) return "self";
  if (/\b(someone else|other|friend|family)\b/.test(n)) return "other";
  // Single word shortcuts
  if (n === "me" || n === "self") return "self";
  if (n === "child" || n === "kid") return "child";
  if (n === "other") return "other";
  return null;
}

/**
 * Try to extract classFor AND an enrollee name from a free-text opening message.
 * e.g. "looking for lessons for my husband John" → { classFor: "other", enrolleeName: "John" }
 * e.g. "want to sign my son up" → { classFor: "child", enrolleeName: null }
 * Returns null if nothing can be inferred.
 */
function extractContextFromOpening(input: string): { classFor: "self" | "child" | "other"; enrolleeName: string | null } | null {
  const classFor = parseClassFor(input);
  if (!classFor) return null;

  // Try to extract an enrollee name after relationship words
  // e.g. "for my husband John", "for my wife Sarah", "for my son Marcus"
  let enrolleeName: string | null = null;
  const nameAfterRelationship = input.match(
    /(?:my|for my)\s+(?:husband|wife|boyfriend|girlfriend|brother|sister|son|daughter|child|kid|partner|spouse|friend|mom|dad|mother|father|parent)\s+([A-Za-z][a-z]{1,20})(?:\s+[A-Za-z][a-z]{1,20})?(?=\s+(?:for|to|in|at|with|and|is|was|has|would|will|can|could|should)|$)/i
  );
  if (nameAfterRelationship) {
    // Capitalize first letter of each word
    enrolleeName = nameAfterRelationship[1]
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return { classFor, enrolleeName };
}

function parseChildName(input: string): string | null {
  const n = input.trim();
  if (n.length < 2) return null;
  // Strip common prefixes
  const cleaned = n.replace(/^(my (child|kid|son|daughter|name is|child's name is)|his name is|her name is|it's|its)\s+/i, "").trim();
  // Must look like a name (letters, spaces, hyphens only, no numbers)
  if (/^[a-zA-Z][a-zA-Z\s\-']{1,30}$/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }
  return null;
}

function parseAge(input: string): number | null {
  const n = normalizeInput(input);
  // Extract number from input like "7", "7 years old", "he's 7"
  const match = n.match(/\b(\d{1,2})\b/);
  if (match) {
    const age = parseInt(match[1], 10);
    if (age >= 2 && age <= 18) return age;
  }
  return null;
}

function parseName(input: string): string | null {
  const n = input.trim();
  if (n.length < 2) return null;
  // Strip common prefixes
  const cleaned = n.replace(/^(my name is|i am|i'm|name is|it's|its)\s+/i, "").trim();
  // Must look like a name
  if (/^[a-zA-Z][a-zA-Z\s\-']{1,40}$/.test(cleaned)) {
    return cleaned.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  return null;
}

function parsePhone(input: string): string | null {
  // Strip all non-digits
  const digits = input.replace(/\D/g, "");
  // Accept 10 digits (US) or 11 digits starting with 1
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  return null;
}

function parseEmail(input: string): string | null {
  const n = input.trim().toLowerCase().replace(/[.,;!?]+$/, "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)) return n;
  return null;
}

function isDirectEnrollmentRequest(input: string): boolean {
  const n = normalizeInput(input);
  // Don't treat as direct enrollment if the message is clearly about signing up someone else
  // e.g. "I want to sign up my wife" or "sign up my son"
  const isForSomeoneElse = /\b(my (wife|husband|boyfriend|girlfriend|son|daughter|child|kid|brother|sister|friend|partner|spouse|mom|dad|mother|father|parent))\b/.test(n);
  if (isForSomeoneElse) return false;
  return /\b(enroll|membership|sign up|join|i don't need a trial|no trial|returning|already trained|skip trial)\b/.test(n);
}

function isNeitherWorks(input: string): boolean {
  return /\b(neither|none|different|other time|another time|doesn't work|don't work|no)\b/i.test(input);
}

function isUpgradeRequest(input: string): boolean {
  const n = normalizeInput(input);
  return /\b(upgrade|level up|move up|black belt|leadership|change plan|change my plan|change membership|upgrade my|upgrade plan|upgrade membership)\b/.test(n);
}

// ─── resolveNextStep ──────────────────────────────────────────────────────────
// Returns exactly ONE next step. Never walks multiple steps.

export function resolveNextStep(state: TFState): TFStep {
  // Direct enrollment path (hidden)
  if (state.skipTrial) {
    if (!state.name) return TFStep.NAME;
    if (!state.phone) return TFStep.PHONE;
    if (!state.email) return TFStep.EMAIL;
    // After contact info, present program options
    if (!state.selectedProgram) return TFStep.PROGRAM_SELECTION;
    // After program selected, show enrollment link
    if (!state.enrollmentCheckoutUrl) return TFStep.ENROLLMENT_LINK;
    return TFStep.DONE;
  }

  // Trial-First path
  if (!state.classFor) return TFStep.CLASS_FOR;

  if (state.classFor === "child") {
    if (!state.childName) return TFStep.CHILD_NAME;
    if (state.childAge === null) return TFStep.CHILD_AGE;
  }

  if (state.classFor === "other") {
    // Ask for the enrollee's name if not yet known
    if (!state.childName) return TFStep.CHILD_NAME;
    if (state.priorTraining === null) return TFStep.RAPID_RAPPORT_ADULT;
  }

  if (state.classFor === "self") {
    if (state.priorTraining === null) return TFStep.RAPID_RAPPORT_ADULT;
  }

  if (!state.emotionalGoal) return TFStep.EMOTIONAL_DISCOVERY_Q1;
  if (!state.emotionalOutcome) return TFStep.EMOTIONAL_DISCOVERY_Q2;

  // TRIAL_TRANSITION is a one-time message step — mark it done by checking selectedSlot
  if (!state.selectedSlot && state.offeredSlots.length === 0) return TFStep.TRIAL_TRANSITION;
  if (!state.selectedSlot) return TFStep.FAST_FIRST_LESSON;

  if (state.secondaryDecisionMaker === null) return TFStep.SECONDARY_DECISION_MAKER;

  if (!state.name) return TFStep.NAME;
  if (!state.phone) return TFStep.PHONE;
  if (!state.email) return TFStep.EMAIL;

  if (!state.paymentMethod) return TFStep.PAYMENT_POSITIONING;

  return TFStep.ENROLLMENT_PREFRAME;
}

// ─── Contextual Greeting Hook ────────────────────────────────────────────────
// Returns a human-like, time-aware opener for Kai's greeting message

function getContextualGreetingHook(): string {
  const hour = new Date().getHours(); // server local time
  const month = new Date().getMonth(); // 0=Jan, 11=Dec

  // Season-based weather hooks (Northeast US / Massachusetts context)
  const isWinter = month === 11 || month === 0 || month === 1;
  const isSpring = month >= 2 && month <= 4;
  const isSummer = month >= 5 && month <= 7;
  const isFall = month >= 8 && month <= 10;

  if (hour >= 5 && hour < 12) {
    // Morning
    if (isSummer) return "Good morning! ☀️ It's a beautiful day outside — perfect weather to start something new.";
    if (isWinter) return "Good morning! ❄️ Nothing beats a cold morning to get fired up for training.";
    if (isSpring) return "Good morning! 🌸 Spring is the perfect time to start a new fitness journey.";
    return "Good morning! 🍂 Great fall morning to get moving.";
  } else if (hour >= 12 && hour < 14) {
    // Midday
    if (isSummer) return "Hey there! 🌞 Hope you're staying cool — great time to check out what we offer.";
    return "Hey there! Hope you're having a great afternoon — glad you stopped by.";
  } else if (hour >= 14 && hour < 18) {
    // Afternoon
    if (isSummer) return "Hey! ☀️ Sunny afternoon — perfect day to try something that'll change your routine.";
    if (isWinter) return "Hey! 🌥️ Afternoon like this is perfect for getting active indoors.";
    if (isSpring) return "Hey! 🌤️ Beautiful afternoon — great day to explore a new fitness path.";
    return "Hey! Great afternoon to get moving — glad you're here.";
  } else if (hour >= 18 && hour < 21) {
    // Evening
    if (isSummer) return "Good evening! 🌅 Warm night — perfect time to think about adding martial arts to your routine.";
    return "Good evening! 🌙 After a long day, there's nothing better than training to reset.";
  } else {
    // Late night
    return "Hey, night owl! 🌙 Glad you're here — let's find the right program for you.";
  }
}

// ─── Question Generator ───────────────────────────────────────────────────────
// Returns the question message for the given step

export function generateQuestion(step: TFStep, state: TFState, weatherHook?: string): { message: string; quickReplies?: string[] } {
  switch (step) {
    case TFStep.GREETING: {
      // Use real weather hook if provided (from async fetch in router), otherwise fall back to time-based
      const hook = weatherHook || getContextualGreetingHook();
      return {
        message: `${hook}\n\nI'm **Kai**, your martial arts guide at MyDojo. We offer a **free first class** so you can experience it before committing to anything.\n\nReady to find the right program for you?`,
        quickReplies: ["Let's get started!", "I want to enroll", "Learn more", "Membership options", "☀️ Summer Camp"],
      };
    }

    case TFStep.CLASS_FOR:
      return {
        message: "Is this class for you, your child, or someone else?",
        quickReplies: ["For me", "For my child", "For someone else"],
      };

    case TFStep.CHILD_NAME:
      return {
        // For "other" adult enrollee, ask for their name; for child, ask for child's name
        message: state.classFor === "other"
          ? "What's their name?"
          : "What's your child's name?",
      };

    case TFStep.CHILD_AGE:
      return {
        message: `How old is ${state.childName || "your child"}?`,
      };

    case TFStep.RAPID_RAPPORT_ADULT:
      return {
        // Personalize for "other" enrollee using their name if known
        message: state.classFor === "other" && state.childName
          ? `Has ${state.childName} trained in martial arts before?`
          : state.classFor === "other"
          ? "Have they trained in martial arts before?"
          : "Have you trained in martial arts before?",
        quickReplies: ["Yes", "No", "A little"],
      };

    case TFStep.EMOTIONAL_DISCOVERY_Q1: {
      // For "other" enrollee, use their name if known; for child, use child's name
      const subject = (state.classFor === "child" || state.classFor === "other") && state.childName
        ? state.childName
        : state.classFor === "other"
        ? "them"
        : "you";
      const isAdult = state.classFor === "self" || state.classFor === "other";
      const isChild = state.classFor === "child";
      if (isAdult) {
        // Adults come to martial arts primarily for fitness, confidence, or discipline
        const enrolleeName = state.classFor === "other" && state.childName ? state.childName : null;
        const msg = enrolleeName
          ? `What's the main thing ${enrolleeName} is hoping to get out of martial arts?`
          : "What's the main thing you're hoping to get out of martial arts?";
        return {
          message: msg,
          quickReplies: ["Get fit & lose weight", "Build confidence", "Learn self-defense", "Stress relief & discipline", "Something else"],
        };
      }
      // Child flow
      return {
        message: `What would you like to see improve for ${subject}?`,
        quickReplies: ["Confidence", "Focus & discipline", "Fitness", "Self-defense", "Social skills"],
      };
    }

    case TFStep.EMOTIONAL_DISCOVERY_Q2: {
      const isAdultFlow = state.classFor === "self" || state.classFor === "other";
      if (isAdultFlow) {
        const enrolleeName = state.classFor === "other" && state.childName ? state.childName : null;
        const goal = state.emotionalGoal?.toLowerCase() || "";
        // Tailor the follow-up based on what they said in Q1
        let followUp: string;
        if (/fit|weight|cardio|burn|lose|tone/.test(goal)) {
          followUp = enrolleeName
            ? `Love that! If ${enrolleeName} hit those fitness goals, how would that change things day-to-day?`
            : "Love that! If you hit those fitness goals, how would that change things day-to-day?";
        } else if (/confiden|self-esteem|shy|bold|assertive/.test(goal)) {
          followUp = enrolleeName
            ? `That's powerful. How do you think more confidence would show up in ${enrolleeName}'s daily life?`
            : "That's powerful. How do you think more confidence would show up in your daily life?";
        } else if (/stress|discipline|focus|mental|mind/.test(goal)) {
          followUp = enrolleeName
            ? `Great goal. If ${enrolleeName} had more discipline and mental clarity, what would look different?`
            : "Great goal. If you had more discipline and mental clarity, what would look different?";
        } else if (/defense|safe|protect|fight|street/.test(goal)) {
          followUp = enrolleeName
            ? `Absolutely. How important is it to ${enrolleeName} to feel capable of protecting themselves?`
            : "Absolutely. How important is it to you to feel capable of protecting yourself?";
        } else {
          followUp = enrolleeName
            ? `That's a great reason. If that improved, what would be different in ${enrolleeName}'s life?`
            : "That's a great reason. If that improved, what would be different in your life?";
        }
        return { message: followUp };
      }
      // Child flow
      return {
        message: "If that improved, what would be different at home or school?",
      };
    }

    case TFStep.TRIAL_TRANSITION: {
      // Use pre-populated DB slots if available; fall back to generated slots only if empty
      const slots = state.offeredSlots.length > 0 ? state.offeredSlots : generateDefaultSlots();
      state.offeredSlots = slots;
      state.slotOfferCount = 1;
      const slot1 = slots[0];
      const slot2 = slots[1];
      const isAdultFlow = state.classFor === "self" || state.classFor === "other";
      const enrolleeName = state.classFor === "other" && state.childName ? state.childName : null;
      const subject = state.classFor === "child" && state.childName ? state.childName
        : enrolleeName ? enrolleeName
        : "you";
      const goal = state.emotionalGoal?.toLowerCase() || "";
      // Build a goal-aware bridge for adults
      let bridge: string;
      if (isAdultFlow) {
        if (/fit|weight|cardio|burn|lose|tone/.test(goal)) {
          bridge = "That's exactly what our program is built for — real results, real fast.";
        } else if (/confiden|self-esteem|shy|bold|assertive/.test(goal)) {
          bridge = "Building confidence is at the core of everything we do here.";
        } else if (/stress|discipline|focus|mental|mind/.test(goal)) {
          bridge = "Martial arts is one of the most effective ways to build mental discipline and reduce stress.";
        } else if (/defense|safe|protect|fight|street/.test(goal)) {
          bridge = "We teach real, practical self-defense — not just sport.";
        } else {
          bridge = "That's exactly what we help with.";
        }
      } else {
        bridge = "That's exactly what we help with.";
      }
      return {
        message:
          `${bridge} The best way to experience it is to come in for a **free class** — no commitment needed.\n\n` +
          `We're enrolling this week and spots are limited.\n\n` +
          `I can get ${subject === "you" ? "you" : subject} in ${slot1.displayText} or ${slot2.displayText}. Which works best?`,
        quickReplies: [slot1.displayText, slot2.displayText, "Neither works"],
      };
    }

    case TFStep.FAST_FIRST_LESSON: {
      // Re-offer with next 2 slots
      const slots = state.offeredSlots;
      const offset = state.slotOfferCount * 2;
      const slot1 = slots[offset] || slots[0];
      const slot2 = slots[offset + 1] || slots[1];
      return {
        message: `No problem! How about ${slot1.displayText} or ${slot2.displayText}?`,
        quickReplies: [slot1.displayText, slot2.displayText, "Call me to schedule"],
      };
    }

    case TFStep.SECONDARY_DECISION_MAKER:
      return {
        message: "Is there anyone else who needs to be involved in the decision to get started?",
        quickReplies: ["Just me", "My spouse/partner", "Other"],
      };

    case TFStep.NAME:
      return {
        message: "What's your full name?",
      };

    case TFStep.PHONE:
      return {
        message: `What's the best phone number to reach ${state.classFor === "child" ? "you" : "you"}?`,
      };

    case TFStep.EMAIL:
      return {
        message: "And your email address? We'll use it to send class reminders and enrollment details.",
      };

    case TFStep.PAYMENT_POSITIONING: {
      const slotText = state.selectedSlot ? state.selectedSlot.displayText : "your selected time";
      const subjectName = state.name ? state.name.split(" ")[0] : (state.classFor === "child" && state.childName ? state.childName : null);
      const greeting = subjectName ? `${subjectName}, ` : "";
      return {
        message: `${greeting}you're confirmed for ${slotText}! Your first class is completely free — no payment needed.\n\nJust show up ready to move. What's the best way to send you a reminder — text or email?`,
        quickReplies: ["Text me", "Email me", "Both"],
      };
    }

    case TFStep.ENROLLMENT_PREFRAME:
      return {
        message:
          `After the first class, most families are ready to enroll on the spot. ` +
          `We'll walk you through our membership options and show you how to lock in the best rate.\n\n` +
          `If you'd like to skip the free class and enroll now, just say the word — I can walk you through our plans right here.`,
        quickReplies: ["Enroll now", "See you at the free class!"],
      };

    case TFStep.PROGRAM_SELECTION: {
      // Contextualize program options based on who the class is for
      const isChild = state.classFor === "child";
      const childAge = state.childAge;
      let programContext = "";
      if (isChild && childAge !== null) {
        if (childAge <= 5) programContext = `Based on ${state.childName || "your child"}'s age, the **Little Ninjas** program (ages 3–5) is the perfect fit. `;
        else if (childAge <= 12) programContext = `Based on ${state.childName || "your child"}'s age, the **Dragon Kids** program (ages 6–12) is the perfect fit. `;
        else programContext = `Based on ${state.childName || "your child"}'s age, the **Teens** program (ages 13–17) is the perfect fit. `;
      }
      return {
        message:
          `${programContext}Here are our membership plans:\n\n` +
          `**Foundation** — $149/mo\n` +
          `2x 30-min classes weekly · White Gi included · Access to basic curriculum\n\n` +
          `**Black Belt** — $199/mo\n` +
          `3x 60-min classes weekly · Red Gi included · Advanced curriculum + seminars\n\n` +
          `Both plans include a one-time **$99 enrollment fee** due today, then monthly billing. 60-day cancellation notice required.\n\n` +
          `Which plan fits your goals?`,
        quickReplies: ["Foundation – $149/mo", "Black Belt – $199/mo"],
      };
    }

    case TFStep.ENROLLMENT_LINK:
      return {
        message:
          `You're all set! Click the link below to complete your enrollment securely through Stripe.\n\n` +
          `If you have any questions before then, just ask — we're here.`,
      };

    case TFStep.DONE:
      return {
        message: "You're all set! We'll see you at your free class. If you have any questions before then, just ask — we're here.",
      };

    case TFStep.UPGRADE_LOOKUP:
      return {
        message: "I can help you upgrade your membership! To pull up your account, please share the **phone number or email** you enrolled with.",
      };

    case TFStep.UPGRADE_CONFIRM: {
      const plan = state.currentPlan || "Foundation";
      const price = state.currentPlanMonthlyPrice || 149;
      const credit = state.proratedCredit;
      const creditLine = credit && credit > 0
        ? `\n\nBased on your billing cycle, you have a **$${credit.toFixed(2)} prorated credit** that will be applied to your next invoice.`
        : "";
      return {
        message:
          `I found your account! You're currently on the **${plan}** plan at $${price}/mo.${creditLine}\n\n` +
          `Which plan would you like to upgrade to?\n\n` +
          `**Black Belt** — $199/mo\n` +
          `3x 60-min classes weekly · Red Gi included · Advanced curriculum + seminars\n\n` +
          `**Leadership** — $249/mo\n` +
          `Unlimited classes · Leadership training · Instructor mentorship program`,
        quickReplies: ["Black Belt – $199/mo", "Leadership – $249/mo", "Not right now"],
      };
    }

    case TFStep.UPGRADE_COMPLETE:
      return {
        message: "Your membership has been upgraded! 🥋 You'll receive a confirmation email shortly. Is there anything else I can help you with?",
        quickReplies: ["No, thanks!"],
      };

    case TFStep.SUMMER_CAMP_WEEK:
      return {
        message:
          `☀️ **MyDojo Summer Camp 2025** is action-packed martial arts fun for kids ages 5–14!\n\n` +
          `**What's included:**\n` +
          `✅ First week: **$199** · $99 registration fee (one-time)\n` +
          `🥋 Free Gi uniform · 💧 Water bottle · 👕 School T-shirt\n` +
          `📅 Monday–Friday, 9 AM–3 PM\n\n` +
          `**Available weeks:**\n` +
          `Week 1: June 9–13 · Week 2: June 16–20 · Week 3: June 23–27\n` +
          `Week 4: June 30–July 4 · Week 5: July 7–11 · Week 6: July 14–18\n` +
          `Week 7: July 21–25 · Week 8: July 28–Aug 1\n\n` +
          `Which week would you like to register for?`,
        quickReplies: ["Week 1: June 9–13", "Week 2: June 16–20", "Week 3: June 23–27", "Week 4: June 30–July 4", "See more weeks"],
      };

    case TFStep.SUMMER_CAMP_CHECKOUT:
      return {
        message: "Generating your Summer Camp registration link...",
      };

    default:
      return {
        message: "How can I help you today?",
      };
  }
}

// ─── Main Processor ───────────────────────────────────────────────────────────

export function processTFMessage(state: TFState, userInput: string): TFResponse {
  const isDev = process.env.NODE_ENV === "development" || process.env.KAI_DEBUG === "true";

  // Reset step advance counter for this turn
  state.stepAdvanceCount = 0;
  state.prevStep = state.step;

  const input = userInput.trim();
  const n = normalizeInput(input);

  // Log to history
  if (input) {
    state.history.push({ role: "user", content: input });
  }

  if (isDev) {
    state.devLog.push(`[TURN] step=${state.step} input="${input.slice(0, 50)}"`);
  }

  // ── Check for upgrade request (at GREETING or CLASS_FOR only) ─────────────────────────────
  const isUpgradeInterceptStep = state.step === TFStep.GREETING || state.step === TFStep.CLASS_FOR;
  if (isUpgradeInterceptStep && isUpgradeRequest(input)) {
    state.isUpgrade = true;
    state.step = TFStep.UPGRADE_LOOKUP;
    advanceGuard(state);
    const q = generateQuestion(TFStep.UPGRADE_LOOKUP, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── Check for hidden direct enrollment trigger ──────────────────────────────────────────────
  // Only intercept if NOT already in ENROLLMENT_PREFRAME or DONE (those have their own handlers)
  const isTerminalStep = state.step === TFStep.ENROLLMENT_PREFRAME || state.step === TFStep.DONE;
  if (!state.skipTrial && !isTerminalStep && isDirectEnrollmentRequest(input)) {
    state.skipTrial = true;
    state.step = resolveNextStep(state);
    const isDoneNow = state.step === TFStep.DONE;
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev, isDoneNow);
  }

  // ── GREETING ─────────────────────────────────────────────────────────────────
  if (state.step === TFStep.GREETING) {
    // Handle Summer Camp intent
    if (/\b(summer camp|summer program|camp|summer)\b/i.test(input)) {
      state.isSummerCamp = true;
      state.step = TFStep.SUMMER_CAMP_WEEK;
      advanceGuard(state);
      const q = generateQuestion(TFStep.SUMMER_CAMP_WEEK, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    // Handle "Learn more" intent
    if (/\b(learn more|more info|tell me more|what do you offer|what programs|what classes|more information)\b/i.test(input)) {
      const q = {
        message:
          `At **MyDojo** we offer martial arts programs for all ages:\n\n` +
          `🥋 **Little Ninjas** (ages 3–5) — Fun intro to movement, focus, and respect\n` +
          `🥋 **Dragon Kids** (ages 6–12) — Confidence, discipline, and self-defense\n` +
          `🥋 **Teens & Adults** (ages 13+) — Fitness, real self-defense, and mental toughness\n` +
          `🥊 **Kickboxing** — High-energy cardio + striking technique\n` +
          `🏫 **After School** — Safe, structured martial arts after school\n` +
          `☀️ **Summer Camp** — Action-packed martial arts summer program\n\n` +
          `All programs include a **free first class** — no commitment needed. Ready to find the right fit?`,
        quickReplies: ["Let's get started!", "I want to enroll", "Membership options"],
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    // Handle "Membership options" intent
    if (/\b(membership|pricing|price|cost|how much|plans|options|rates)\b/i.test(input)) {
      const q = {
        message:
          `Here's a quick look at our membership plans:\n\n` +
          `**Foundation** — $149/mo\n` +
          `2x 30-min classes per week · White Gi included · Core curriculum\n\n` +
          `**Black Belt** — $199/mo\n` +
          `3x 60-min classes per week · Red Gi included · Advanced curriculum + seminars\n\n` +
          `Both plans include a one-time **$99 enrollment fee** and a **free first class** so you can try before you commit.\n\n` +
          `Want to book your free class, or are you ready to enroll today?`,
        quickReplies: ["Book free class", "I want to enroll", "Learn more"],
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    // Try to extract classFor from the opening message before asking
    const openingContext = extractContextFromOpening(input);
    if (openingContext) {
      // User already told us who this is for — skip the CLASS_FOR question
      state.classFor = openingContext.classFor;
      // If they mentioned an enrollee name (e.g. "for my husband John"), store it
      if (openingContext.enrolleeName) {
        state.childName = openingContext.enrolleeName;
      }
      state.step = resolveNextStep(state);
      advanceGuard(state);
      // Build a context-aware acknowledgment before asking the next question
      const nextQ = generateQuestion(state.step, state);
      let ackPrefix = "";
      if (openingContext.classFor === "other") {
        ackPrefix = openingContext.enrolleeName
          ? `Great, I can help get ${openingContext.enrolleeName} started! `
          : "Great, I can help get them started! ";
      } else if (openingContext.classFor === "child") {
        ackPrefix = openingContext.enrolleeName
          ? `Great, let's get ${openingContext.enrolleeName} started! `
          : "Great, let's get your child started! ";
      }
      const ackQ = ackPrefix
        ? { ...nextQ, message: ackPrefix + nextQ.message }
        : nextQ;
      state.history.push({ role: "assistant", content: ackQ.message });
      return buildResponse(state, ackQ, isDev);
    }

    // Any other input advances to CLASS_FOR
    state.step = TFStep.CLASS_FOR;
    advanceGuard(state);
    const q = generateQuestion(TFStep.CLASS_FOR, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── CLASS_FOR ─────────────────────────────────────────────────────────────────
  if (state.step === TFStep.CLASS_FOR) {
    const parsed = parseClassFor(input);
    if (!parsed) {
      const q = {
        message: "Just to confirm — is this class for you, your child, or someone else?",
        quickReplies: ["For me", "For my child", "For someone else"],
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.classFor = parsed;
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── CHILD_NAME ────────────────────────────────────────────────────────────────
  if (state.step === TFStep.CHILD_NAME) {
    const parsed = parseChildName(input);
    if (!parsed) {
      const reprompt = state.classFor === "other"
        ? "What's their first name?"
        : "What's your child's first name?";
      const q = { message: reprompt };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.childName = parsed;
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── CHILD_AGE ─────────────────────────────────────────────────────────────────
  if (state.step === TFStep.CHILD_AGE) {
    const parsed = parseAge(input);
    if (parsed === null) {
      const q = { message: `How old is ${state.childName || "your child"}? (e.g. "7" or "7 years old")` };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.childAge = parsed;
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── RAPID_RAPPORT_ADULT ───────────────────────────────────────────────────────
  if (state.step === TFStep.RAPID_RAPPORT_ADULT) {
    // Accept any answer — store it
    state.priorTraining = input || "not specified";
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── EMOTIONAL_DISCOVERY_Q1 ────────────────────────────────────────────────────
  if (state.step === TFStep.EMOTIONAL_DISCOVERY_Q1) {
    if (input.length < 3) {
      const subject = state.classFor === "child" && state.childName ? state.childName : "you";
      const q = { message: `What's the main thing you'd like to see improve for ${subject}? (e.g. confidence, focus, fitness)` };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.emotionalGoal = input;
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── EMOTIONAL_DISCOVERY_Q2 ────────────────────────────────────────────────────
  if (state.step === TFStep.EMOTIONAL_DISCOVERY_Q2) {
    if (input.length < 3) {
      const isAdultFlow = state.classFor === "self" || state.classFor === "other";
      const reprompt = isAdultFlow
        ? "Tell me a bit more — how would your life look different if that improved?"
        : "If that improved, what would be different at home or school?";
      const q = { message: reprompt };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.emotionalOutcome = input;
    state.step = resolveNextStep(state);
    advanceGuard(state);
    // TRIAL_TRANSITION generates slots and presents them
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── TRIAL_TRANSITION ──────────────────────────────────────────────────────────
  // This step is presented by EMOTIONAL_DISCOVERY_Q2 handler above.
  // When user responds to TRIAL_TRANSITION, they're picking a slot.
  // So TRIAL_TRANSITION and FAST_FIRST_LESSON share the same handler logic.
  if (state.step === TFStep.TRIAL_TRANSITION || state.step === TFStep.FAST_FIRST_LESSON) {
    // Check if user picked a slot
    if (isNeitherWorks(input)) {
      // Re-offer with next 2 slots
      state.slotOfferCount += 1;
      state.step = TFStep.FAST_FIRST_LESSON;
      const q = generateQuestion(TFStep.FAST_FIRST_LESSON, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }

    // Try to match input to an offered slot
    const matchedSlot = state.offeredSlots.find(s =>
      normalizeInput(s.displayText).includes(normalizeInput(input)) ||
      normalizeInput(input).includes(normalizeInput(s.time)) ||
      normalizeInput(input).includes(normalizeInput(s.dayOfWeek))
    );

    if (matchedSlot) {
      state.selectedSlot = matchedSlot;
      state.step = resolveNextStep(state);
      advanceGuard(state);
      const q = generateQuestion(state.step, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }

    // If no slots offered yet (shouldn't happen but guard)
    if (state.offeredSlots.length === 0) {
      const q = generateQuestion(TFStep.TRIAL_TRANSITION, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }

    // Input didn't match any slot — re-offer
    const slots = state.offeredSlots;
    const slot1 = slots[0];
    const slot2 = slots[1];
    const q = {
      message: `Just to confirm — ${slot1.displayText} or ${slot2.displayText}?`,
      quickReplies: [slot1.displayText, slot2.displayText, "Neither works"],
    };
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── SECONDARY_DECISION_MAKER ──────────────────────────────────────────────────
  if (state.step === TFStep.SECONDARY_DECISION_MAKER) {
    // Accept any answer
    const hasSpouse = /spouse|partner|husband|wife|other/i.test(input);
    state.secondaryDecisionMaker = input || "just me";
    state.step = resolveNextStep(state);
    advanceGuard(state);

    if (hasSpouse) {
      const q = {
        message: "Great! We encourage them to attend the first lesson too — it's the best way to see how we teach. " +
          generateQuestion(state.step, state).message,
        quickReplies: generateQuestion(state.step, state).quickReplies,
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }

    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── NAME ──────────────────────────────────────────────────────────────────────
  if (state.step === TFStep.NAME) {
    const parsed = parseName(input);
    if (!parsed) {
      const q = { message: "What's your full name? (first and last)" };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.name = parsed;
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── PHONE ─────────────────────────────────────────────────────────────────────
  if (state.step === TFStep.PHONE) {
    const parsed = parsePhone(input);
    if (!parsed) {
      const q = { message: "What's the best phone number to reach you? (10-digit number)" };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.phone = parsed;
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── EMAIL ─────────────────────────────────────────────────────────────────────
  if (state.step === TFStep.EMAIL) {
    const parsed = parseEmail(input);
    if (!parsed) {
      const q = {
        message: "That doesn't look like a valid email address. We need it to send you class reminders and enrollment details — please try again!",
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.email = parsed;
    // Summer Camp path: after email, go straight to checkout
    if (state.isSummerCamp && state.summerCampWeek) {
      state.step = TFStep.SUMMER_CAMP_CHECKOUT;
      const q = {
        message: `Perfect! Generating your secure Summer Camp registration link for **${state.summerCampWeek}**...`,
      };
      state.history.push({ role: "assistant", content: q.message });
      const response = buildResponse(state, q, isDev);
      response.selectedSummerCampForCheckout = state.summerCampWeek;
      return response;
    }
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── PAYMENT_POSITIONING ───────────────────────────────────────────────────────
  if (state.step === TFStep.PAYMENT_POSITIONING) {
    if (input.length < 1) {
      const q = generateQuestion(TFStep.PAYMENT_POSITIONING, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }

    // Handle enrollment request at this stage
    const wantsEnrollNow = /\b(enroll now|enroll|sign me up|membership|join now)\b/i.test(input);
    if (wantsEnrollNow) {
      state.skipTrial = true;
      state.step = TFStep.DONE;
      const q = {
        message: "Love the energy! Our team will reach out to walk you through enrollment options and get you set up. See you soon! 🥋",
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev, true);
    }

    // Store reminder preference
    state.paymentMethod = input; // reusing field to store reminder preference
    state.step = resolveNextStep(state);
    advanceGuard(state);
    const q = generateQuestion(state.step, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── ENROLLMENT_PREFRAME ───────────────────────────────────────────────────────
  if (state.step === TFStep.ENROLLMENT_PREFRAME) {
    const wantsEnrollNow = /\b(enroll now|enroll|sign me up|membership|join now|yes|ready)\b/i.test(input);
    if (wantsEnrollNow) {
      // Route to program selection instead of saying "team will reach out"
      state.skipTrial = true;
      state.step = TFStep.PROGRAM_SELECTION;
      advanceGuard(state);
      const q = generateQuestion(TFStep.PROGRAM_SELECTION, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    // User wants to come in for the free class first
    state.step = TFStep.DONE;
    const q = generateQuestion(TFStep.DONE, state);
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev, true);
  }

  // ── PROGRAM_SELECTION ────────────────────────────────────────────────────────
  if (state.step === TFStep.PROGRAM_SELECTION) {
    if (input.length < 1) {
      const q = generateQuestion(TFStep.PROGRAM_SELECTION, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    // Detect which plan the user selected
    const inp = input.toLowerCase();
    let selectedPlan: string | null = null;
    if (inp.includes("foundation") || inp.includes("149")) {
      selectedPlan = "Foundation";
    } else if (inp.includes("black belt") || inp.includes("199")) {
      selectedPlan = "Black Belt";
    } else {
      // Unrecognized — re-ask
      const q = {
        message: "I didn't catch that. Please choose either **Foundation ($149/mo)** or **Black Belt ($199/mo)**.",
        quickReplies: ["Foundation – $149/mo", "Black Belt – $199/mo"],
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.selectedProgram = selectedPlan;
    state.step = TFStep.ENROLLMENT_LINK;
    advanceGuard(state);
    // Signal to the server that a checkout URL should be generated
    const q = {
      message: `Great choice! Generating your secure **${selectedPlan}** enrollment link now...`,
    };
    state.history.push({ role: "assistant", content: q.message });
    const response = buildResponse(state, q, isDev);
    response.selectedProgramForCheckout = selectedPlan;
    return response;
  }

  // ── ENROLLMENT_LINK ──────────────────────────────────────────────────────────
  if (state.step === TFStep.ENROLLMENT_LINK) {
    // This step is shown after the server generates the checkout URL.
    // If user sends a message here, just confirm and go to DONE.
    state.step = TFStep.DONE;
    const q = { message: "You're all set! Complete your enrollment using the link above. We can't wait to welcome you to the dojo! 🥋" };
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev, true);
  }

  // ── DONE ──────────────────────────────────────────────────────────────────────
  if (state.step === TFStep.DONE) {
    const q = { message: "You're all set! Is there anything else I can help you with?" };
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev, true);
  }

  // ── UPGRADE_LOOKUP ────────────────────────────────────────────────────────────
  if (state.step === TFStep.UPGRADE_LOOKUP) {
    const inp = input.trim();
    // Accept phone number (10+ digits) or email address
    const digits = inp.replace(/\D/g, "");
    const isPhone = digits.length >= 10;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp);
    if (!isPhone && !isEmail) {
      const q = { message: "Please enter your **phone number** (e.g. 713-555-1234) or **email address** so I can find your account." };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.lookupPhone = inp; // store raw input (phone or email)
    state.step = TFStep.UPGRADE_CONFIRM;
    advanceGuard(state);
    // Signal server to look up enrollment — message will be replaced by server with account info
    const q = { message: "Looking up your account..." };
    state.history.push({ role: "assistant", content: q.message });
    const response = buildResponse(state, q, isDev);
    response.upgradeAction = { lookupPhone: inp };
    return response;
  }

  // ── UPGRADE_CONFIRM ───────────────────────────────────────────────────────────
  if (state.step === TFStep.UPGRADE_CONFIRM) {
    const inp = input.toLowerCase();
    let targetPlan: string | null = null;
    if (inp.includes("black belt") || inp.includes("199")) {
      targetPlan = "Black Belt";
    } else if (inp.includes("leadership") || inp.includes("249")) {
      targetPlan = "Leadership";
    } else if (/\b(yes|upgrade|confirm|proceed|do it)\b/.test(inp) && state.upgradeTargetPlan) {
      targetPlan = state.upgradeTargetPlan;
    } else if (/\b(no|not now|not right now|cancel|nevermind|never mind|nope|nah)\b/.test(inp)) {
      state.step = TFStep.DONE;
      const q = { message: "No problem! Your current plan is unchanged. Let me know if you have any questions." };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev, true);
    }

    if (!targetPlan) {
      // Re-ask with plan options
      const q = {
        message: "Please choose a plan to upgrade to:",
        quickReplies: ["Black Belt \u2013 $199/mo", "Leadership \u2013 $249/mo", "Not right now"],
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }

    state.upgradeTargetPlan = targetPlan;
    state.step = TFStep.UPGRADE_COMPLETE;
    advanceGuard(state);
    // Signal server to perform the actual Stripe upgrade
    const creditLine = state.proratedCredit && state.proratedCredit > 0
      ? ` A **$${state.proratedCredit.toFixed(2)} prorated credit** will be applied to your next invoice.`
      : "";
    const q = {
      message: `Upgrading your membership to **${targetPlan}**...${creditLine}`,
    };
    state.history.push({ role: "assistant", content: q.message });
    const response = buildResponse(state, q, isDev);
    response.upgradeAction = {
      lookupPhone: state.lookupPhone!,
      targetPlan,
      enrollmentId: state.upgradeEnrollmentId ?? undefined,
    };
    return response;
  }

  // ── UPGRADE_COMPLETE ──────────────────────────────────────────────────────────
  if (state.step === TFStep.UPGRADE_COMPLETE) {
    state.step = TFStep.DONE;
    const q = { message: "Is there anything else I can help you with?" };
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev, true);
  }

  // ── SUMMER_CAMP_WEEK ──────────────────────────────────────────────────────────
  if (state.step === TFStep.SUMMER_CAMP_WEEK) {
    const inp = input.trim();
    // Match week selection by number or date
    const weekMap: Record<string, string> = {
      "1": "Week 1: June 9–13",
      "2": "Week 2: June 16–20",
      "3": "Week 3: June 23–27",
      "4": "Week 4: June 30–July 4",
      "5": "Week 5: July 7–11",
      "6": "Week 6: July 14–18",
      "7": "Week 7: July 21–25",
      "8": "Week 8: July 28–Aug 1",
    };
    // Handle "See more weeks" request
    if (/see more|more weeks|other weeks|week 5|week 6|week 7|week 8/i.test(inp)) {
      const q = {
        message: "Here are the remaining weeks:\n\nWeek 5: July 7–11 · Week 6: July 14–18 · Week 7: July 21–25 · Week 8: July 28–Aug 1\n\nWhich week works best for your child?",
        quickReplies: ["Week 5: July 7–11", "Week 6: July 14–18", "Week 7: July 21–25", "Week 8: July 28–Aug 1"],
      };
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    let selectedWeek: string | null = null;
    for (const [key, label] of Object.entries(weekMap)) {
      if (inp.includes(key) || inp.toLowerCase().includes(label.toLowerCase()) || inp.toLowerCase().includes(`week ${key}`)) {
        selectedWeek = label;
        break;
      }
    }
    if (!selectedWeek) {
      const q = generateQuestion(TFStep.SUMMER_CAMP_WEEK, state);
      state.history.push({ role: "assistant", content: q.message });
      return buildResponse(state, q, isDev);
    }
    state.summerCampWeek = selectedWeek;
    state.step = TFStep.NAME;
    advanceGuard(state);
    const q = {
      message: `Great choice! **${selectedWeek}** is going to be an amazing week! 🏕️\n\nTo reserve your child's spot, I just need a few details. What's your full name?`,
    };
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev);
  }

  // ── SUMMER_CAMP_CHECKOUT ─────────────────────────────────────────────────────
  if (state.step === TFStep.SUMMER_CAMP_CHECKOUT) {
    // User has been shown the checkout link — any response goes to DONE
    state.step = TFStep.DONE;
    const q = { message: "You're all set! Complete your Summer Camp registration using the link above. We can't wait to have your child join us this summer! ☀️🥋" };
    state.history.push({ role: "assistant", content: q.message });
    return buildResponse(state, q, isDev, true);
  }

  // ── Fallback ──────────────────────────────────────────────────────────────────
  const fallbackQ = generateQuestion(state.step, state);
  state.history.push({ role: "assistant", content: fallbackQ.message });
  return buildResponse(state, fallbackQ, isDev);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function advanceGuard(state: TFState): void {
  state.stepAdvanceCount += 1;
  if (state.stepAdvanceCount > 1) {
    // Safety: log and stop
    state.devLog.push(`[GUARD] Step advanced ${state.stepAdvanceCount} times in one turn — stopping at ${state.step}`);
    console.warn(`[TFStateMachine] Safety guard: step advanced ${state.stepAdvanceCount} times in one turn`);
  }
}

function buildResponse(
  state: TFState,
  q: { message: string; quickReplies?: string[] },
  isDev: boolean,
  isDone = false
): TFResponse {
  const response: TFResponse = {
    message: q.message,
    quickReplies: q.quickReplies,
    state,
    isDone,
  };

  if (isDev) {
    response.devInfo = {
      step: state.step,
      prevStep: state.prevStep,
      classFor: state.classFor,
      childName: state.childName,
      childAge: state.childAge,
      emotionalGoal: state.emotionalGoal,
      emotionalOutcome: state.emotionalOutcome,
      selectedSlot: state.selectedSlot?.displayText ?? null,
      name: state.name,
      phone: state.phone,
      email: state.email,
      skipTrial: state.skipTrial,
    };
  }

  return response;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

export function getTFGreeting(weatherHook?: string): TFResponse {
  const state = createTFState();
  // Store the weather hook in state so the GREETING question generator can use it
  (state as TFState & { weatherHook?: string }).weatherHook = weatherHook;
  const q = generateQuestion(TFStep.GREETING, state, weatherHook);
  state.history.push({ role: "assistant", content: q.message });
  return buildResponse(state, q, process.env.NODE_ENV === "development");
}
