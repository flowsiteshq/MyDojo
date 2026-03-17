/**
 * intakeStateMachine.trialFirst.other.test.ts
 *
 * Tests for the "other" adult enrollee flow in the V2 (Trial-First) state machine.
 * Verifies that Kai detects classFor from the opening message and skips the
 * redundant CLASS_FOR question when the user already says "for my husband/wife/etc."
 */

import { describe, it, expect } from "vitest";
import { processTFMessage, createTFState, TFStep, generateQuestion } from "./intakeStateMachine.trialFirst";

describe("Trial-First V2 - Other Adult Enrollee Context Detection", () => {
  describe("Opening message context detection", () => {
    it("should detect 'for my husband' and skip CLASS_FOR question", () => {
      const state = createTFState();
      const response = processTFMessage(state, "I'm looking for lessons for my husband");

      // Should NOT ask "Is this class for you, your child, or someone else?"
      expect(response.message).not.toContain("Is this class for you");
      expect(response.message).not.toContain("your child, or someone else");

      // classFor should be set to "other"
      expect(response.state.classFor).toBe("other");

      // Should have advanced past CLASS_FOR
      expect(response.state.step).not.toBe(TFStep.CLASS_FOR);
    });

    it("should detect 'for my wife' and acknowledge the enrollee", () => {
      const state = createTFState();
      const response = processTFMessage(state, "I want to sign up my wife");

      expect(response.state.classFor).toBe("other");
      expect(response.state.step).not.toBe(TFStep.CLASS_FOR);
    });

    it("should detect 'for my boyfriend' and skip CLASS_FOR", () => {
      const state = createTFState();
      const response = processTFMessage(state, "Looking for classes for my boyfriend");

      expect(response.state.classFor).toBe("other");
      expect(response.state.step).not.toBe(TFStep.CLASS_FOR);
    });

    it("should detect 'for my girlfriend' and skip CLASS_FOR", () => {
      const state = createTFState();
      const response = processTFMessage(state, "I'd like to get my girlfriend started with martial arts");

      expect(response.state.classFor).toBe("other");
      expect(response.state.step).not.toBe(TFStep.CLASS_FOR);
    });

    it("should detect 'for my brother' and skip CLASS_FOR", () => {
      const state = createTFState();
      const response = processTFMessage(state, "Trying to find a class for my brother");

      expect(response.state.classFor).toBe("other");
      expect(response.state.step).not.toBe(TFStep.CLASS_FOR);
    });

    it("should detect 'for my friend' and skip CLASS_FOR", () => {
      const state = createTFState();
      const response = processTFMessage(state, "I want to get my friend into martial arts");

      expect(response.state.classFor).toBe("other");
      expect(response.state.step).not.toBe(TFStep.CLASS_FOR);
    });

    it("should extract enrollee name from 'for my husband John'", () => {
      const state = createTFState();
      const response = processTFMessage(state, "I'm looking for lessons for my husband John");

      expect(response.state.classFor).toBe("other");
      expect(response.state.childName).toBe("John");
      // Should skip directly to RAPID_RAPPORT_ADULT since name is known
      expect(response.state.step).toBe(TFStep.RAPID_RAPPORT_ADULT);
    });

    it("should extract enrollee name from 'for my wife Sarah'", () => {
      const state = createTFState();
      const response = processTFMessage(state, "Signing up my wife Sarah for classes");

      expect(response.state.classFor).toBe("other");
      expect(response.state.childName).toBe("Sarah");
      expect(response.state.step).toBe(TFStep.RAPID_RAPPORT_ADULT);
    });

    it("should include acknowledgment in response when classFor is detected", () => {
      const state = createTFState();
      const response = processTFMessage(state, "Looking for classes for my husband");

      // Should acknowledge the context
      expect(response.message).toMatch(/great|help|started/i);
    });

    it("should include enrollee name in acknowledgment when name is detected", () => {
      const state = createTFState();
      const response = processTFMessage(state, "I want to sign up my wife Maria");

      expect(response.message).toContain("Maria");
    });
  });

  describe("'Other' enrollee flow progression", () => {
    it("should ask for enrollee name when not provided in opening message", () => {
      const state = createTFState();
      // First message: opening context without name
      const r1 = processTFMessage(state, "I'm looking for classes for my husband");

      expect(r1.state.classFor).toBe("other");
      expect(r1.state.step).toBe(TFStep.CHILD_NAME);
      // Should ask for their name (not "your child's name")
      expect(r1.message).toMatch(/their|name/i);
      expect(r1.message).not.toContain("child's name");
    });

    it("should ask 'Have they trained' for other enrollee without name", () => {
      const state = createTFState();
      state.classFor = "other";
      state.childName = null;
      // Simulate CLASS_FOR already done, now at CHILD_NAME
      state.step = TFStep.CHILD_NAME;

      const r = processTFMessage(state, "Mike");
      expect(r.state.childName).toBe("Mike");
      expect(r.state.step).toBe(TFStep.RAPID_RAPPORT_ADULT);
      // Should ask "Has Mike trained" not "Have you trained"
      expect(r.message).toContain("Mike");
      expect(r.message).toMatch(/trained/i);
    });

    it("should use enrollee name in RAPID_RAPPORT_ADULT question", () => {
      const state = createTFState();
      state.classFor = "other";
      state.childName = "Carlos";
      state.step = TFStep.RAPID_RAPPORT_ADULT;

      const r = processTFMessage(state, "No");
      // Prior step question should have been "Has Carlos trained..."
      // After answering, should advance to EMOTIONAL_DISCOVERY_Q1
      expect(r.state.step).toBe(TFStep.EMOTIONAL_DISCOVERY_Q1);
    });

    it("should use enrollee name in EMOTIONAL_DISCOVERY_Q1", () => {
      const state = createTFState();
      state.classFor = "other";
      state.childName = "Carlos";
      state.priorTraining = "no";
      state.step = TFStep.EMOTIONAL_DISCOVERY_Q1;

      // The question should reference Carlos, not "you"
      const q = generateQuestion(TFStep.EMOTIONAL_DISCOVERY_Q1, state);
      expect(q.message).toContain("Carlos");
      expect(q.message).not.toContain(" you?");
    });
  });

  describe("Self flow still works correctly", () => {
    it("should still handle self enrollment via direct enrollment path", () => {
      const state = createTFState();
      // "sign up for classes" triggers direct enrollment path (skipTrial=true)
      // which goes straight to NAME without asking CLASS_FOR
      const response = processTFMessage(state, "I want to sign up for classes");

      // Direct enrollment path is triggered — step should be NAME
      expect(response.state.step).toBe(TFStep.NAME);
      expect(response.state.skipTrial).toBe(true);
      // CLASS_FOR question should not be asked
      expect(response.message).not.toContain("Is this class for you");
    });

    it("should still detect child flow from opening message", () => {
      const state = createTFState();
      const response = processTFMessage(state, "I want to sign up my son");

      expect(response.state.classFor).toBe("child");
      expect(response.state.step).not.toBe(TFStep.CLASS_FOR);
    });

    it("'someone else' should not match self flow", () => {
      const state = createTFState();
      const response = processTFMessage(state, "Looking for classes for someone else");

      expect(response.state.classFor).toBe("other");
    });
  });
});
