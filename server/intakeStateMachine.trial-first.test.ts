/**
 * End-to-End Tests for Trial-First Strategy (MASS Training)
 * 
 * Tests complete conversation flows:
 * 1. Parent lead (child flow)
 * 2. Adult lead (self flow)
 * 
 * Expected flow:
 * CLASS_FOR → CHILD_NAME → CHILD_AGE → EMOTIONAL_DISCOVERY → TRIAL_TRANSITION → 
 * FAST_FIRST_LESSON → SECONDARY_DECISION_MAKER → Contact Info → 
 * PAYMENT_POSITIONING → ENROLLMENT_PREFRAME → COMPLETE
 */

import { describe, it, expect } from 'vitest';
import { 
  initializeIntakeState, 
  processIntakeMessage, 
  IntakeStep,
  getInitialGreeting 
} from './intakeStateMachine';

describe('Trial-First Strategy - Parent Lead (Child Flow)', () => {
  it('should guide parent through complete trial booking flow', () => {
    const sessionId = 'test-parent-flow';
    let state = initializeIntakeState(sessionId);
    
    // Initial greeting should ask "For you or your child?"
    const greeting = getInitialGreeting();
    expect(greeting).toContain('Are these lessons for you or for your child?');
    expect(state.currentStep).toBe(IntakeStep.CLASS_FOR);
    
    // Step 1: CLASS_FOR - "For my child"
    let response = processIntakeMessage(state, 'For my child');
    state = response.state;
    expect(state.classFor).toBe('child');
    expect(state.currentStep).toBe(IntakeStep.CHILD_NAME);
    expect(response.assistantMessage).toContain("What's their name?");
    
    // Step 2: CHILD_NAME - "Emma"
    response = processIntakeMessage(state, 'Emma');
    state = response.state;
    expect(state.childName).toBe('Emma');  // Stored as-is from parseChildName
    expect(state.currentStep).toBe(IntakeStep.CHILD_AGE);
    expect(response.assistantMessage).toContain('How old');
    
    // Step 3: CHILD_AGE - "7"
    response = processIntakeMessage(state, '7');
    state = response.state;
    expect(state.childAge).toBe(7);
    expect(state.segment).toBe('KIDS_6_12');
    expect(state.program).toBe('Dragon Kids');
    expect(state.currentStep).toBe(IntakeStep.EMOTIONAL_DISCOVERY);
    
    // Step 4: EMOTIONAL_DISCOVERY Part 1 - "What would you like to see improve?"
    expect(response.assistantMessage).toContain('What would you most like to see');
    expect(response.assistantMessage).toContain('improve');
    
    response = processIntakeMessage(state, 'confidence and discipline');
    state = response.state;
    expect(state.emotionalGoal).toBe('confidence and discipline');
    expect(state.currentStep).toBe(IntakeStep.EMOTIONAL_DISCOVERY);  // Still in discovery
    expect(response.assistantMessage).toContain("That's exactly what we help families achieve");
    expect(response.assistantMessage).toContain('what would be different');
    
    // Step 5: EMOTIONAL_DISCOVERY Part 2 - "What would be different?"
    response = processIntakeMessage(state, 'She would be more confident at school and make friends easier');
    state = response.state;
    expect(state.emotionalImpact).toBe('She would be more confident at school and make friends easier');
    expect(state.completedSteps).toContain(IntakeStep.EMOTIONAL_DISCOVERY);
    
    // Step 6: TRIAL_TRANSITION - Automatic messaging step
    expect(state.currentStep).toBe(IntakeStep.FAST_FIRST_LESSON);  // Should auto-advance
    expect(response.assistantMessage).toContain('2-Week Trial');
    expect(response.assistantMessage).toContain('enrolling new students this week');
    expect(response.assistantMessage).toContain('classes fill quickly');
    
    // Step 7: FAST_FIRST_LESSON - Offer 2 specific slots
    expect(response.assistantMessage).toContain('I can get you in');
    expect(response.assistantMessage).toMatch(/Today|Tomorrow/);
    expect(response.quickReplies).toBeDefined();
    expect(response.quickReplies?.length).toBeGreaterThanOrEqual(2);
    
    // User selects first slot
    response = processIntakeMessage(state, 'Today at 6:15 PM');
    state = response.state;
    expect(state.selectedSlot).toBeDefined();
    expect(state.selectedSlot?.displayText).toContain('Today');
    expect(state.completedSteps).toContain(IntakeStep.FAST_FIRST_LESSON);
    
    // Step 8: SECONDARY_DECISION_MAKER - Auto-advance should ask this
    expect(state.currentStep).toBe(IntakeStep.SECONDARY_DECISION_MAKER);
    expect(response.assistantMessage).toContain('anyone else who needs to be involved');
    
    response = processIntakeMessage(state, 'Just me');
    state = response.state;
    expect(state.secondaryDecisionMaker).toBe('Just me');
    expect(state.completedSteps).toContain(IntakeStep.SECONDARY_DECISION_MAKER);
    
    // Step 9: Contact Info - NAME (if not already collected)
    expect(state.currentStep).toBe(IntakeStep.NAME);
    
    response = processIntakeMessage(state, 'Sarah Johnson');
    state = response.state;
    expect(state.name).toBe('sarah johnson');
    expect(state.currentStep).toBe(IntakeStep.PHONE);
    
    // Step 10: PHONE
    response = processIntakeMessage(state, '281-818-9288');
    state = response.state;
    expect(state.phone).toBe('(281) 818-9288');
    expect(state.currentStep).toBe(IntakeStep.EMAIL);
    
    // Step 11: EMAIL
    response = processIntakeMessage(state, 'sarah@example.com');
    state = response.state;
    expect(state.email).toBe('sarah@example.com');
    expect(state.currentStep).toBe(IntakeStep.PAYMENT_POSITIONING);
    
    // Step 12: PAYMENT_POSITIONING - Auto-messaging
    expect(response.assistantMessage).toContain('reserve your spot');
    expect(response.assistantMessage).toContain('trial tuition');
    expect(response.assistantMessage).toContain('debit or credit');
    
    // Step 13: ENROLLMENT_PREFRAME - Auto-advance
    expect(state.currentStep).toBe(IntakeStep.ENROLLMENT_PREFRAME);
    
    // Process to get preframe message
    response = processIntakeMessage(state, '');
    state = response.state;
    expect(response.assistantMessage).toContain('After the first lesson');
    expect(response.assistantMessage).toContain('membership options');
    expect(response.assistantMessage).toContain('parents participate too');
    expect(response.assistantMessage).toContain('50 minutes');
    
    // Step 14: COMPLETE
    expect(state.currentStep).toBe(IntakeStep.COMPLETE);
    expect(state.completedSteps).toContain(IntakeStep.ENROLLMENT_PREFRAME);
  });
  
  it('should handle "Neither works" slot selection', () => {
    const sessionId = 'test-neither-works';
    let state = initializeIntakeState(sessionId);
    
    // Fast-forward to FAST_FIRST_LESSON
    state.classFor = 'child';
    state.childName = 'tommy';
    state.childAge = 8;
    state.segment = 'KIDS_6_12' as any;
    state.program = 'Dragon Kids';
    state.emotionalGoal = 'focus';
    state.emotionalImpact = 'better grades';
    state.completedSteps = [
      IntakeStep.CLASS_FOR,
      IntakeStep.CHILD_NAME,
      IntakeStep.CHILD_AGE,
      IntakeStep.EMOTIONAL_DISCOVERY,
      IntakeStep.TRIAL_TRANSITION
    ];
    state.currentStep = IntakeStep.FAST_FIRST_LESSON;
    
    // First offer
    let response = processIntakeMessage(state, '');
    state = response.state;
    expect(response.assistantMessage).toContain('I can get you in');
    const firstSlots = state.offeredSlots;
    expect(firstSlots.length).toBe(2);
    
    // User says "Neither works"
    response = processIntakeMessage(state, 'Neither works');
    state = response.state;
    expect(response.assistantMessage).toContain('No problem');
    expect(state.offeredSlots.length).toBe(2);
    expect(state.offeredSlots[0].id).not.toBe(firstSlots[0].id);  // New slots offered
    
    // User selects second slot
    response = processIntakeMessage(state, state.offeredSlots[1].displayText);
    state = response.state;
    expect(state.selectedSlot).toBeDefined();
    expect(state.completedSteps).toContain(IntakeStep.FAST_FIRST_LESSON);
  });
});

describe('Trial-First Strategy - Adult Lead (Self Flow)', () => {
  it('should guide adult through complete trial booking flow', () => {
    const sessionId = 'test-adult-flow';
    let state = initializeIntakeState(sessionId);
    
    // Step 1: CLASS_FOR - "For me"
    let response = processIntakeMessage(state, 'For me');
    state = response.state;
    expect(state.classFor).toBe('self');
    expect(state.currentStep).toBe(IntakeStep.RAPID_RAPPORT_ADULT);
    expect(response.assistantMessage).toContain('Have you trained before?');
    
    // Step 2: RAPID_RAPPORT_ADULT - "No"
    response = processIntakeMessage(state, 'No');
    state = response.state;
    expect(state.priorTraining).toBe(false);
    expect(state.currentStep).toBe(IntakeStep.EMOTIONAL_DISCOVERY);
    
    // Step 3: EMOTIONAL_DISCOVERY Part 1
    expect(response.assistantMessage).toContain('What would you most like to see');
    expect(response.assistantMessage).toContain('yourself');  // Should say "yourself" not "your child"
    
    response = processIntakeMessage(state, 'fitness and stress relief');
    state = response.state;
    expect(state.emotionalGoal).toBe('fitness and stress relief');
    expect(response.assistantMessage).toContain('what would be different');
    
    // Step 4: EMOTIONAL_DISCOVERY Part 2
    response = processIntakeMessage(state, 'I would feel healthier and more energized');
    state = response.state;
    expect(state.emotionalImpact).toBe('I would feel healthier and more energized');
    expect(state.completedSteps).toContain(IntakeStep.EMOTIONAL_DISCOVERY);
    
    // Step 5: TRIAL_TRANSITION - Auto-advance
    expect(response.assistantMessage).toContain('2-Week Trial');
    expect(state.currentStep).toBe(IntakeStep.FAST_FIRST_LESSON);
    
    // Step 6: FAST_FIRST_LESSON
    expect(response.assistantMessage).toContain('I can get you in');
    
    response = processIntakeMessage(state, 'Tomorrow at 5:30 PM');
    state = response.state;
    expect(state.selectedSlot).toBeDefined();
    
    // Step 7: SECONDARY_DECISION_MAKER
    expect(state.currentStep).toBe(IntakeStep.SECONDARY_DECISION_MAKER);
    
    response = processIntakeMessage(state, 'My spouse');
    state = response.state;
    expect(state.secondaryDecisionMaker).toBe('My spouse');
    expect(response.assistantMessage).toContain('encourage them to attend');
    
    // Step 8-10: Contact Info
    expect(state.currentStep).toBe(IntakeStep.NAME);
    
    response = processIntakeMessage(state, 'Mike Chen');
    state = response.state;
    expect(state.name).toBe('mike chen');
    
    response = processIntakeMessage(state, '713-555-1234');
    state = response.state;
    expect(state.phone).toBe('(713) 555-1234');
    
    response = processIntakeMessage(state, 'mike@example.com');
    state = response.state;
    expect(state.email).toBe('mike@example.com');
    
    // Step 11: PAYMENT_POSITIONING
    expect(state.currentStep).toBe(IntakeStep.PAYMENT_POSITIONING);
    expect(response.assistantMessage).toContain('reserve your spot');
    
    // Step 12: ENROLLMENT_PREFRAME
    expect(state.currentStep).toBe(IntakeStep.ENROLLMENT_PREFRAME);
    
    response = processIntakeMessage(state, '');
    state = response.state;
    expect(response.assistantMessage).toContain('After the first lesson');
    expect(state.currentStep).toBe(IntakeStep.COMPLETE);
  });
});

describe('Trial-First Strategy - Flow Verification', () => {
  it('should never show INTENT step in trial-first flow', () => {
    const sessionId = 'test-no-intent';
    let state = initializeIntakeState(sessionId);
    
    // Complete entire flow
    const messages = [
      'For my child',
      'Alex',
      '9',
      'confidence',
      'better at school',
      'Today at 6:15 PM',
      'Just me',
      'John Doe',
      '555-1234',
      'john@example.com'
    ];
    
    for (const msg of messages) {
      const response = processIntakeMessage(state, msg);
      state = response.state;
      
      // INTENT step should NEVER appear in trial-first flow
      expect(state.currentStep).not.toBe(IntakeStep.INTENT);
      expect(response.assistantMessage).not.toContain('trial class or enroll');
      expect(response.assistantMessage).not.toContain('Book Trial Class');
      expect(response.assistantMessage).not.toContain('Enroll for Membership');
    }
    
    // Verify INTENT was never completed
    expect(state.completedSteps).not.toContain(IntakeStep.INTENT);
    expect(state.intent).toBeNull();
  });
  
  it('should maintain correct step progression', () => {
    const sessionId = 'test-progression';
    let state = initializeIntakeState(sessionId);
    
    const expectedSteps = [
      IntakeStep.CLASS_FOR,
      IntakeStep.CHILD_NAME,
      IntakeStep.CHILD_AGE,
      IntakeStep.EMOTIONAL_DISCOVERY,
      IntakeStep.TRIAL_TRANSITION,
      IntakeStep.FAST_FIRST_LESSON,
      IntakeStep.SECONDARY_DECISION_MAKER,
      IntakeStep.NAME,
      IntakeStep.PHONE,
      IntakeStep.EMAIL,
      IntakeStep.PAYMENT_POSITIONING,
      IntakeStep.ENROLLMENT_PREFRAME,
      IntakeStep.COMPLETE
    ];
    
    const messages = [
      'For my child',
      'Sophia',
      '5',
      'discipline',
      'listen better',
      'Today at 6:15 PM',
      'Just me',
      'Lisa Wang',
      '832-555-9999',
      'lisa@example.com'
    ];
    
    let stepIndex = 0;
    expect(state.currentStep).toBe(expectedSteps[stepIndex]);
    
    for (const msg of messages) {
      const response = processIntakeMessage(state, msg);
      state = response.state;
      stepIndex++;
      
      // Allow for auto-advancement through messaging steps
      while (stepIndex < expectedSteps.length && 
             (expectedSteps[stepIndex] === IntakeStep.TRIAL_TRANSITION ||
              expectedSteps[stepIndex] === IntakeStep.PAYMENT_POSITIONING ||
              expectedSteps[stepIndex] === IntakeStep.ENROLLMENT_PREFRAME)) {
        stepIndex++;
      }
      
      if (stepIndex < expectedSteps.length) {
        expect(state.currentStep).toBe(expectedSteps[stepIndex]);
      }
    }
    
    expect(state.currentStep).toBe(IntakeStep.COMPLETE);
  });
});
