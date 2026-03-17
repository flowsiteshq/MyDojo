/**
 * Unit tests for adult "other" enrollee flow
 * 
 * Verifies that when classFor === "other" (enrolling a spouse/partner/friend),
 * the system:
 * 1. Skips the age question entirely
 * 2. Defaults segment to ADULTS and program to "Adult Karate"
 * 3. Uses adult-appropriate language throughout
 * 
 * Regression test for: program/segment not being set for "other" adult enrollees,
 * causing atomicBooking to fail with "Missing required information (name, phone, or program)"
 */
import { describe, it, expect } from 'vitest';
import {
  initializeIntakeState,
  processIntakeMessage,
  IntakeStep,
  Segment,
} from './intakeStateMachine';

describe('Kai Chatbot - Adult "Other" Enrollee Flow', () => {
  it('should set segment=ADULTS and program=Adult Karate after RAPID_RAPPORT_ADULT (no prior training)', () => {
    const sessionId = 'test-other-no-training';
    let state = initializeIntakeState(sessionId);

    // Step 1: CLASS_FOR - "For someone else"
    let response = processIntakeMessage(state, 'For someone else');
    state = response.state;
    expect(state.classFor).toBe('other');
    expect(state.currentStep).toBe(IntakeStep.CHILD_NAME);

    // Step 2: CHILD_NAME - enrollee's name (not "child's name")
    response = processIntakeMessage(state, 'Marcus');
    state = response.state;
    expect(state.childName).toBe('Marcus');
    expect(state.currentStep).toBe(IntakeStep.RAPID_RAPPORT_ADULT);
    // Should NOT ask for age
    expect(state.completedSteps).not.toContain(IntakeStep.CHILD_AGE);
    expect(state.childAge).toBeNull();

    // Step 3: RAPID_RAPPORT_ADULT - "No" (no prior training)
    response = processIntakeMessage(state, 'No');
    state = response.state;
    expect(state.priorTraining).toBe(false);
    // KEY ASSERTION: segment and program must be set to adult defaults
    expect(state.segment).toBe(Segment.ADULTS);
    expect(state.program).toBe('Adult Karate');
    expect(state.currentStep).toBe(IntakeStep.EMOTIONAL_DISCOVERY);
  });

  it('should set segment=ADULTS and program=Adult Karate after RAPID_RAPPORT_ADULT (with prior training)', () => {
    const sessionId = 'test-other-with-training';
    let state = initializeIntakeState(sessionId);

    // Step 1: CLASS_FOR
    let response = processIntakeMessage(state, 'For my husband');
    state = response.state;
    expect(state.classFor).toBe('other');

    // Step 2: CHILD_NAME
    response = processIntakeMessage(state, 'David');
    state = response.state;
    expect(state.childName).toBe('David');

    // Step 3: RAPID_RAPPORT_ADULT - "Yes" (has prior training)
    response = processIntakeMessage(state, 'Yes');
    state = response.state;
    expect(state.priorTraining).toBe(true);
    // KEY ASSERTION: segment and program must be set to adult defaults
    expect(state.segment).toBe(Segment.ADULTS);
    expect(state.program).toBe('Adult Karate');
  });

  it('should use adult-appropriate language in EMOTIONAL_DISCOVERY for "other" flow', () => {
    const sessionId = 'test-other-language';
    let state = initializeIntakeState(sessionId);

    // Set up state to reach EMOTIONAL_DISCOVERY
    let response = processIntakeMessage(state, 'For someone else');
    state = response.state;
    response = processIntakeMessage(state, 'Sarah');
    state = response.state;
    response = processIntakeMessage(state, 'No');
    state = response.state;

    // Now in EMOTIONAL_DISCOVERY - should use "them" not "your child"
    expect(state.currentStep).toBe(IntakeStep.EMOTIONAL_DISCOVERY);
    expect(response.assistantMessage).toContain('Sarah'); // Uses enrollee's name
    expect(response.assistantMessage).not.toContain('your child');
    expect(response.assistantMessage).not.toContain('at school'); // Adult context
  });

  it('should never ask for age in the "other" adult enrollee flow', () => {
    const sessionId = 'test-other-no-age';
    let state = initializeIntakeState(sessionId);

    const messages = [
      'For my wife',
      'Jennifer',
      'No',
      'fitness and confidence',
      'She would feel stronger',
    ];

    for (const msg of messages) {
      const response = processIntakeMessage(state, msg);
      state = response.state;
      // CHILD_AGE step should never appear
      expect(state.currentStep).not.toBe(IntakeStep.CHILD_AGE);
      expect(response.assistantMessage).not.toContain('How old is your child');
      expect(response.assistantMessage).not.toContain('How old is');
    }

    // Verify age was never collected
    expect(state.childAge).toBeNull();
    // Verify program is set to adult
    expect(state.program).toBe('Adult Karate');
    expect(state.segment).toBe(Segment.ADULTS);
  });

  it('should complete full "other" adult flow with correct program for booking', () => {
    const sessionId = 'test-other-full-flow';
    let state = initializeIntakeState(sessionId);

    // Complete the full flow
    let response = processIntakeMessage(state, 'For my partner');
    state = response.state;
    expect(state.classFor).toBe('other');

    response = processIntakeMessage(state, 'Alex');
    state = response.state;

    response = processIntakeMessage(state, 'No');
    state = response.state;
    // Program should be set here
    expect(state.program).toBe('Adult Karate');
    expect(state.segment).toBe(Segment.ADULTS);

    // Continue through emotional discovery
    response = processIntakeMessage(state, 'stress relief');
    state = response.state;

    response = processIntakeMessage(state, 'feel more balanced');
    state = response.state;

    // Should be at FAST_FIRST_LESSON (auto-advanced through TRIAL_TRANSITION)
    expect(state.currentStep).toBe(IntakeStep.FAST_FIRST_LESSON);

    // Select a slot
    response = processIntakeMessage(state, 'Today at 6:15 PM');
    state = response.state;
    expect(state.selectedSlot).toBeDefined();

    // Continue through secondary decision maker
    response = processIntakeMessage(state, 'Just me');
    state = response.state;

    // Collect contact info
    response = processIntakeMessage(state, 'Jamie Rodriguez');
    state = response.state;

    response = processIntakeMessage(state, '713-555-9876');
    state = response.state;

    response = processIntakeMessage(state, 'jamie@example.com');
    state = response.state;

    // At this point, program must be set for booking to succeed
    expect(state.program).toBe('Adult Karate');
    expect(state.segment).toBe(Segment.ADULTS);
    expect(state.name).toBeTruthy();
    expect(state.phone).toBeTruthy();
  });
});
