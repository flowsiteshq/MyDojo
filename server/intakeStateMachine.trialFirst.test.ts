/**
 * intakeStateMachine.trialFirst.test.ts
 *
 * Unit tests for the Trial-First Strategy state machine.
 * Tests two complete flows:
 *   1. Child path: parent enrolling a child
 *   2. Adult path: adult enrolling for themselves
 *
 * Design: one step = one user turn, no recursion, no auto-advance.
 */

import { describe, it, expect } from "vitest";
import {
  processTFMessage,
  getTFGreeting,
  createTFState,
  resolveNextStep,
  TFStep,
  type TFState,
} from "./intakeStateMachine.trialFirst";

// ─── Helper ───────────────────────────────────────────────────────────────────

function turn(state: TFState, input: string) {
  return processTFMessage(state, input);
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

describe("getTFGreeting", () => {
  it("returns a greeting message and initial state", () => {
    const greeting = getTFGreeting();
    expect(greeting.message).toBeTruthy();
    expect(greeting.message.toLowerCase()).toContain("kai");
    expect(greeting.state.step).toBe(TFStep.GREETING);
    expect(greeting.isDone).toBe(false);
  });
});

// ─── Child Path ───────────────────────────────────────────────────────────────

describe("Child Path (parent enrolling child)", () => {
  it("completes the full Trial-First funnel for a child", () => {
    let state = createTFState();

    // Step 1: GREETING → CLASS_FOR
    let res = turn(state, "Let's go!");
    state = res.state;
    expect(state.step).toBe(TFStep.CLASS_FOR);
    expect(res.message.toLowerCase()).toContain("child");

    // Step 2: CLASS_FOR → CHILD_NAME
    res = turn(state, "For my child");
    state = res.state;
    expect(state.classFor).toBe("child");
    expect(state.step).toBe(TFStep.CHILD_NAME);
    expect(res.message.toLowerCase()).toContain("name");

    // Step 3: CHILD_NAME → CHILD_AGE
    res = turn(state, "Jaden");
    state = res.state;
    expect(state.childName).toBe("Jaden");
    expect(state.step).toBe(TFStep.CHILD_AGE);
    expect(res.message.toLowerCase()).toContain("old");

    // Step 4: CHILD_AGE → EMOTIONAL_DISCOVERY_Q1
    res = turn(state, "7");
    state = res.state;
    expect(state.childAge).toBe(7);
    expect(state.step).toBe(TFStep.EMOTIONAL_DISCOVERY_Q1);
    expect(res.message.toLowerCase()).toContain("improve");

    // Step 5: EMOTIONAL_DISCOVERY_Q1 → EMOTIONAL_DISCOVERY_Q2
    res = turn(state, "I want Jaden to build confidence and focus");
    state = res.state;
    expect(state.emotionalGoal).toBe("I want Jaden to build confidence and focus");
    expect(state.step).toBe(TFStep.EMOTIONAL_DISCOVERY_Q2);
    expect(res.message.toLowerCase()).toContain("different");

    // Step 6: EMOTIONAL_DISCOVERY_Q2 → TRIAL_TRANSITION (with slots)
    res = turn(state, "He'd be more focused at school and less anxious");
    state = res.state;
    expect(state.emotionalOutcome).toBe("He'd be more focused at school and less anxious");
    expect(state.step).toBe(TFStep.TRIAL_TRANSITION);
    expect(state.offeredSlots.length).toBeGreaterThan(0);
    expect(res.message.toLowerCase()).toContain("free");
    expect(res.message.toLowerCase()).toContain("spots");
    expect(res.quickReplies).toBeDefined();
    expect(res.quickReplies!.length).toBeGreaterThan(0);

    // Step 7: TRIAL_TRANSITION — pick first slot → SECONDARY_DECISION_MAKER
    const slot1 = state.offeredSlots[0];
    res = turn(state, slot1.displayText);
    state = res.state;
    expect(state.selectedSlot).not.toBeNull();
    expect(state.selectedSlot!.id).toBe(slot1.id);
    expect(state.step).toBe(TFStep.SECONDARY_DECISION_MAKER);
    expect(res.message.toLowerCase()).toContain("decision");

    // Step 8: SECONDARY_DECISION_MAKER (just me) → NAME
    res = turn(state, "Just me");
    state = res.state;
    expect(state.secondaryDecisionMaker).toBe("Just me");
    expect(state.step).toBe(TFStep.NAME);
    expect(res.message.toLowerCase()).toContain("name");

    // Step 9: NAME → PHONE
    res = turn(state, "Maria Garcia");
    state = res.state;
    expect(state.name).toBe("Maria Garcia");
    expect(state.step).toBe(TFStep.PHONE);
    expect(res.message.toLowerCase()).toContain("phone");

    // Step 10: PHONE → EMAIL
    res = turn(state, "2818189288");
    state = res.state;
    expect(state.phone).toBe("(281) 818-9288");
    expect(state.step).toBe(TFStep.EMAIL);
    expect(res.message.toLowerCase()).toContain("email");

    // Step 11: EMAIL → PAYMENT_POSITIONING
    res = turn(state, "maria@example.com");
    state = res.state;
    expect(state.email).toBe("maria@example.com");
    expect(state.step).toBe(TFStep.PAYMENT_POSITIONING);
    expect(res.message.toLowerCase()).toContain("confirmed");

    // Step 12: PAYMENT_POSITIONING → ENROLLMENT_PREFRAME
    res = turn(state, "Text me");
    state = res.state;
    expect(state.paymentMethod).toBe("Text me");
    expect(state.step).toBe(TFStep.ENROLLMENT_PREFRAME);
    expect(res.message.toLowerCase()).toContain("enroll");

    // Step 13: ENROLLMENT_PREFRAME → DONE
    res = turn(state, "Great, thank you!");
    state = res.state;
    expect(state.step).toBe(TFStep.DONE);
    expect(res.isDone).toBe(true);
  });

  it("handles 'Neither works' for slots and re-offers", () => {
    let state = createTFState();
    state.classFor = "child";
    state.childName = "Jaden";
    state.childAge = 7;
    state.emotionalGoal = "confidence";
    state.emotionalOutcome = "better at school";
    state.step = TFStep.TRIAL_TRANSITION;

    // Pre-populate slots (simulating what TRIAL_TRANSITION generateQuestion does)
    state.offeredSlots = [
      { id: "slot-0", displayText: "today at 6:15 PM", dayOfWeek: "Monday", time: "6:15 PM" },
      { id: "slot-1", displayText: "tomorrow at 5:30 PM", dayOfWeek: "Tuesday", time: "5:30 PM" },
      { id: "slot-2", displayText: "Wednesday at 10:00 AM", dayOfWeek: "Wednesday", time: "10:00 AM" },
      { id: "slot-3", displayText: "Wednesday at 7:00 PM", dayOfWeek: "Wednesday", time: "7:00 PM" },
    ];
    state.slotOfferCount = 1;

    // User says neither works
    let res = turn(state, "Neither works");
    state = res.state;
    expect(state.step).toBe(TFStep.FAST_FIRST_LESSON);
    expect(state.slotOfferCount).toBeGreaterThan(1);
    expect(res.message.toLowerCase()).toContain("how about");
  });

  it("handles spouse/partner check with encouragement message", () => {
    let state = createTFState();
    state.classFor = "child";
    state.childName = "Jaden";
    state.childAge = 7;
    state.emotionalGoal = "confidence";
    state.emotionalOutcome = "better at school";
    state.selectedSlot = { id: "slot-0", displayText: "today at 6:15 PM", dayOfWeek: "Monday", time: "6:15 PM" };
    state.step = TFStep.SECONDARY_DECISION_MAKER;

    const res = turn(state, "My spouse");
    state = res.state;
    expect(state.secondaryDecisionMaker).toBe("My spouse");
    expect(state.step).toBe(TFStep.NAME);
    // Should include encouragement message
    expect(res.message.toLowerCase()).toContain("encourage");
  });
});

// ─── Adult Path ───────────────────────────────────────────────────────────────

describe("Adult Path (adult enrolling for themselves)", () => {
  it("completes the full Trial-First funnel for an adult", () => {
    let state = createTFState();

    // Step 1: GREETING → CLASS_FOR
    let res = turn(state, "Let's go!");
    state = res.state;
    expect(state.step).toBe(TFStep.CLASS_FOR);

    // Step 2: CLASS_FOR → RAPID_RAPPORT_ADULT
    res = turn(state, "For me");
    state = res.state;
    expect(state.classFor).toBe("self");
    expect(state.step).toBe(TFStep.RAPID_RAPPORT_ADULT);
    expect(res.message.toLowerCase()).toContain("martial arts");

    // Step 3: RAPID_RAPPORT_ADULT → EMOTIONAL_DISCOVERY_Q1
    res = turn(state, "Yes, I trained karate for 2 years");
    state = res.state;
    expect(state.priorTraining).toBe("Yes, I trained karate for 2 years");
    expect(state.step).toBe(TFStep.EMOTIONAL_DISCOVERY_Q1);
    // Adult Q1 now asks about goals ("hoping to get out of") instead of "improve"
    expect(res.message.toLowerCase()).toMatch(/hoping|goal|martial arts|get out of/);

    // Step 4: EMOTIONAL_DISCOVERY_Q1 → EMOTIONAL_DISCOVERY_Q2
    res = turn(state, "I want to get fit and learn real self-defense");
    state = res.state;
    expect(state.emotionalGoal).toBe("I want to get fit and learn real self-defense");
    expect(state.step).toBe(TFStep.EMOTIONAL_DISCOVERY_Q2);
    // Adult Q2 is now goal-aware ("change things day-to-day" / "look different" / etc.)
    expect(res.message.toLowerCase()).toMatch(/different|change|look|life/);

    // Step 5: EMOTIONAL_DISCOVERY_Q2 → TRIAL_TRANSITION
    res = turn(state, "I'd feel more confident and less stressed");
    state = res.state;
    expect(state.emotionalOutcome).toBe("I'd feel more confident and less stressed");
    expect(state.step).toBe(TFStep.TRIAL_TRANSITION);
    expect(state.offeredSlots.length).toBeGreaterThan(0);
    expect(res.message.toLowerCase()).toContain("free");

    // Step 6: Pick a slot → SECONDARY_DECISION_MAKER
    const slot = state.offeredSlots[0];
    res = turn(state, slot.displayText);
    state = res.state;
    expect(state.selectedSlot).not.toBeNull();
    expect(state.step).toBe(TFStep.SECONDARY_DECISION_MAKER);

    // Step 7: SECONDARY_DECISION_MAKER → NAME
    res = turn(state, "Just me");
    state = res.state;
    expect(state.step).toBe(TFStep.NAME);

    // Step 8: NAME → PHONE
    res = turn(state, "John Smith");
    state = res.state;
    expect(state.name).toBe("John Smith");
    expect(state.step).toBe(TFStep.PHONE);

    // Step 9: PHONE → EMAIL
    res = turn(state, "7135551234");
    state = res.state;
    expect(state.phone).toBe("(713) 555-1234");
    expect(state.step).toBe(TFStep.EMAIL);

    // Step 10: EMAIL → PAYMENT_POSITIONING (email is now required)
    res = turn(state, "john@example.com");
    state = res.state;
    expect(state.email).toBe("john@example.com");
    expect(state.step).toBe(TFStep.PAYMENT_POSITIONING);
    expect(res.message.toLowerCase()).toContain("confirmed");

    // Step 11: PAYMENT_POSITIONING → ENROLLMENT_PREFRAME
    res = turn(state, "Text me");
    state = res.state;
    expect(state.paymentMethod).toBe("Text me");
    expect(state.step).toBe(TFStep.ENROLLMENT_PREFRAME);
    expect(res.message.toLowerCase()).toContain("enroll");

    // Step 12: ENROLLMENT_PREFRAME → DONE
    res = turn(state, "Sounds great!");
    state = res.state;
    expect(state.step).toBe(TFStep.DONE);
    expect(res.isDone).toBe(true);
  });

  it("handles 'enroll now' at ENROLLMENT_PREFRAME", () => {
    let state = createTFState();
    state.classFor = "self";
    state.priorTraining = "no";
    state.emotionalGoal = "fitness";
    state.emotionalOutcome = "more energy";
    state.selectedSlot = { id: "slot-0", displayText: "today at 6:15 PM", dayOfWeek: "Monday", time: "6:15 PM" };
    state.secondaryDecisionMaker = "just me";
    state.name = "John Smith";
    state.phone = "(713) 555-1234";
    state.email = "john@example.com";
    state.paymentMethod = "Text me";
    state.step = TFStep.ENROLLMENT_PREFRAME;

    const res = turn(state, "Enroll now");
    state = res.state;
    // Should go to PROGRAM_SELECTION to show program options
    expect(state.step).toBe(TFStep.PROGRAM_SELECTION);
    expect(res.isDone).toBe(false);
    // Should show program options
    expect(res.message.toLowerCase()).toMatch(/foundation|black belt|program/);
  });
});

// ─── Hidden Direct Enrollment Path ───────────────────────────────────────────

describe("Hidden Direct Enrollment Path", () => {
  it("triggers skipTrial when user explicitly requests enrollment", () => {
    let state = createTFState();
    state.step = TFStep.CLASS_FOR;

    const res = turn(state, "I want to enroll directly, I don't need a trial");
    state = res.state;
    expect(state.skipTrial).toBe(true);
    // Should jump to NAME (contact info collection)
    expect(state.step).toBe(TFStep.NAME);
  });

  it("triggers skipTrial for returning student", () => {
    let state = createTFState();
    state.step = TFStep.CLASS_FOR;

    const res = turn(state, "I'm a returning student");
    state = res.state;
    expect(state.skipTrial).toBe(true);
    expect(state.step).toBe(TFStep.NAME);
  });
});

// ─── resolveNextStep ──────────────────────────────────────────────────────────

describe("resolveNextStep", () => {
  it("returns CLASS_FOR when classFor is null", () => {
    const state = createTFState();
    expect(resolveNextStep(state)).toBe(TFStep.CLASS_FOR);
  });

  it("returns CHILD_NAME for child with no name", () => {
    const state = createTFState();
    state.classFor = "child";
    expect(resolveNextStep(state)).toBe(TFStep.CHILD_NAME);
  });

  it("returns CHILD_AGE for child with name but no age", () => {
    const state = createTFState();
    state.classFor = "child";
    state.childName = "Jaden";
    expect(resolveNextStep(state)).toBe(TFStep.CHILD_AGE);
  });

  it("returns RAPID_RAPPORT_ADULT for adult with no prior training answer", () => {
    const state = createTFState();
    state.classFor = "self";
    expect(resolveNextStep(state)).toBe(TFStep.RAPID_RAPPORT_ADULT);
  });

  it("returns EMOTIONAL_DISCOVERY_Q1 after child info collected", () => {
    const state = createTFState();
    state.classFor = "child";
    state.childName = "Jaden";
    state.childAge = 7;
    expect(resolveNextStep(state)).toBe(TFStep.EMOTIONAL_DISCOVERY_Q1);
  });

  it("returns EMOTIONAL_DISCOVERY_Q2 after Q1 answered", () => {
    const state = createTFState();
    state.classFor = "child";
    state.childName = "Jaden";
    state.childAge = 7;
    state.emotionalGoal = "confidence";
    expect(resolveNextStep(state)).toBe(TFStep.EMOTIONAL_DISCOVERY_Q2);
  });

  it("returns TRIAL_TRANSITION after both discovery questions answered (no slots yet)", () => {
    const state = createTFState();
    state.classFor = "self";
    state.priorTraining = "no";
    state.emotionalGoal = "fitness";
    state.emotionalOutcome = "more energy";
    expect(resolveNextStep(state)).toBe(TFStep.TRIAL_TRANSITION);
  });

  it("returns FAST_FIRST_LESSON when slots offered but none selected", () => {
    const state = createTFState();
    state.classFor = "self";
    state.priorTraining = "no";
    state.emotionalGoal = "fitness";
    state.emotionalOutcome = "more energy";
    state.offeredSlots = [{ id: "s1", displayText: "today at 6:15 PM", dayOfWeek: "Monday", time: "6:15 PM" }];
    expect(resolveNextStep(state)).toBe(TFStep.FAST_FIRST_LESSON);
  });

  it("returns SECONDARY_DECISION_MAKER after slot selected", () => {
    const state = createTFState();
    state.classFor = "self";
    state.priorTraining = "no";
    state.emotionalGoal = "fitness";
    state.emotionalOutcome = "more energy";
    state.selectedSlot = { id: "s1", displayText: "today at 6:15 PM", dayOfWeek: "Monday", time: "6:15 PM" };
    expect(resolveNextStep(state)).toBe(TFStep.SECONDARY_DECISION_MAKER);
  });

  it("returns PAYMENT_POSITIONING after all contact info collected", () => {
    const state = createTFState();
    state.classFor = "self";
    state.priorTraining = "no";
    state.emotionalGoal = "fitness";
    state.emotionalOutcome = "more energy";
    state.selectedSlot = { id: "s1", displayText: "today at 6:15 PM", dayOfWeek: "Monday", time: "6:15 PM" };
    state.secondaryDecisionMaker = "just me";
    state.name = "John Smith";
    state.phone = "(713) 555-1234";
    state.email = "john@example.com";
    expect(resolveNextStep(state)).toBe(TFStep.PAYMENT_POSITIONING);
  });

  it("returns ENROLLMENT_PREFRAME after payment method collected", () => {
    const state = createTFState();
    state.classFor = "self";
    state.priorTraining = "no";
    state.emotionalGoal = "fitness";
    state.emotionalOutcome = "more energy";
    state.selectedSlot = { id: "s1", displayText: "today at 6:15 PM", dayOfWeek: "Monday", time: "6:15 PM" };
    state.secondaryDecisionMaker = "just me";
    state.name = "John Smith";
    state.phone = "(713) 555-1234";
    state.email = "john@example.com";
    state.paymentMethod = "credit";
    expect(resolveNextStep(state)).toBe(TFStep.ENROLLMENT_PREFRAME);
  });

  it("skips to NAME when skipTrial is true", () => {
    const state = createTFState();
    state.skipTrial = true;
    expect(resolveNextStep(state)).toBe(TFStep.NAME);
  });
});

// ─── One-Step-Per-Turn Safety Guard ──────────────────────────────────────────

describe("One-Step-Per-Turn Safety Guard", () => {
  it("never advances more than 1 step per turn", () => {
    let state = createTFState();
    // Run through several turns and verify stepAdvanceCount never exceeds 1
    const inputs = ["Let's go!", "For my child", "Jaden", "7", "confidence", "better at school"];
    for (const input of inputs) {
      const res = processTFMessage(state, input);
      expect(res.state.stepAdvanceCount).toBeLessThanOrEqual(1);
      state = res.state;
    }
  });
});
