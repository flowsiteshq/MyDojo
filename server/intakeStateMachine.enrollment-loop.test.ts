/**
 * Test: Enrollment Flow - No Loop After Contact Info Collection
 * 
 * This test verifies that Kai doesn't loop back to asking "trial vs enrollment"
 * after collecting contact information in the enrollment flow.
 * 
 * Bug scenario:
 * 1. User selects "Enroll for Membership"
 * 2. Selects membership plan
 * 3. Provides name, phone, email
 * 4. Answers "For my child"
 * 5. BUG: Kai asks "trial vs enrollment" again (should ask for child's name)
 */

import { describe, it, expect } from "vitest";
import { processIntakeMessage, IntakeStep, type IntakeState } from "./intakeStateMachine";

describe("Enrollment Flow - No Loop After Contact Info", () => {
  it("should not loop back to INTENT step after collecting classFor in enrollment flow", () => {
    // Initial state
    let state: IntakeState = {
      sessionId: "test-session",
      currentStep: IntakeStep.NAME,
      completedSteps: [],
      askedKeys: [],
      name: null,
      phone: null,
      email: null,
      emailSkipped: false,
      classFor: null,
      childName: null,
      intent: "enroll", // User already selected enrollment
      selectedLocation: null,
      selectedPlanId: 1, // User already selected Foundation plan
      childAge: null,
      segment: null,
      program: null,
      selectedSlot: null,
      multipleChildren: false,
      childCount: 0,
      children: [],
      currentChildIndex: 0,
      messageHistory: [],
      intakeComplete: false,
    };

    // Mark INTENT as completed (user already selected "Enroll for Membership")
    state.completedSteps.push(IntakeStep.INTENT);
    state.askedKeys.push("INTENT");

    // Step 1: Provide name
    const response1 = processIntakeMessage(state, "Vincent");
    expect(response1.state.name).toBe("vincent"); // parseName normalizes to lowercase
    expect(response1.state.currentStep).toBe(IntakeStep.PHONE);
    expect(response1.assistantMessage).toContain("phone");
    state = response1.state;

    // Step 2: Provide phone
    const response2 = processIntakeMessage(state, "2818189288");
    expect(response2.state.phone).toBe("(281) 818-9288"); // parsePhone formats the number
    expect(response2.state.currentStep).toBe(IntakeStep.EMAIL);
    expect(response2.assistantMessage).toContain("email");
    state = response2.state;

    // Step 3: Provide email
    const response3 = processIntakeMessage(state, "sensei30002003@gmail.com");
    expect(response3.state.email).toBe("sensei30002003@gmail.com");
    expect(response3.state.currentStep).toBe(IntakeStep.CLASS_FOR);
    expect(response3.assistantMessage).toContain("for you");
    state = response3.state;

    // Step 4: Answer "For my child"
    const response4 = processIntakeMessage(state, "For my child");
    expect(response4.state.classFor).toBe("child");
    
    // CRITICAL ASSERTION: Should NOT loop back to INTENT step
    expect(response4.state.currentStep).not.toBe(IntakeStep.INTENT);
    
    // Should go to CHILD_NAME step instead
    expect(response4.state.currentStep).toBe(IntakeStep.CHILD_NAME);
    expect(response4.assistantMessage).toContain("child's name");
    
    // Should NOT ask about trial vs enrollment again
    expect(response4.assistantMessage).not.toContain("trial class");
    expect(response4.assistantMessage).not.toContain("enroll");
    expect(response4.assistantMessage).not.toContain("membership");
    
    // Quick replies should NOT include "Book Trial Class" or "Enroll for Membership"
    if (response4.quickReplies) {
      expect(response4.quickReplies).not.toContain("Book Trial Class");
      expect(response4.quickReplies).not.toContain("Enroll for Membership");
    }
  });

  it("should maintain intent throughout the enrollment flow", () => {
    let state: IntakeState = {
      sessionId: "test-session-2",
      currentStep: IntakeStep.NAME,
      completedSteps: [IntakeStep.INTENT],
      askedKeys: ["INTENT"],
      name: null,
      phone: null,
      email: null,
      emailSkipped: false,
      classFor: null,
      childName: null,
      intent: "enroll",
      selectedLocation: null,
      selectedPlanId: 2, // Black Belt plan
      childAge: null,
      segment: null,
      program: null,
      selectedSlot: null,
      multipleChildren: false,
      childCount: 0,
      children: [],
      currentChildIndex: 0,
      messageHistory: [],
      intakeComplete: false,
    };

    // Collect all contact info
    const r1 = processIntakeMessage(state, "John Smith");
    const r2 = processIntakeMessage(r1.state, "2815551234");
    const r3 = processIntakeMessage(r2.state, "john@example.com");
    const r4 = processIntakeMessage(r3.state, "For my child");

    // Verify intent is still "enroll" throughout
    expect(r1.state.intent).toBe("enroll");
    expect(r2.state.intent).toBe("enroll");
    expect(r3.state.intent).toBe("enroll");
    expect(r4.state.intent).toBe("enroll");

    // Verify INTENT step is marked complete throughout
    expect(r1.state.completedSteps).toContain(IntakeStep.INTENT);
    expect(r2.state.completedSteps).toContain(IntakeStep.INTENT);
    expect(r3.state.completedSteps).toContain(IntakeStep.INTENT);
    expect(r4.state.completedSteps).toContain(IntakeStep.INTENT);
  });
});
