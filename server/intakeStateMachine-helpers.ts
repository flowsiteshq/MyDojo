/**
 * Helper functions for intakeStateMachine - Trial-First Strategy
 * Generates question messages for each step
 */

import { IntakeStep, IntakeState, Slot } from './intakeStateMachine';

/**
 * Generate the question message for the next step
 * This ensures one step = one user turn (no recursive auto-advance)
 */
export function generateNextStepMessage(state: IntakeState): string {
  const step = state.currentStep;
  
  switch (step) {
    case IntakeStep.CLASS_FOR:
      return "Perfect! Is this class for you, your child, or someone else?";
    
    case IntakeStep.CHILD_NAME:
      return "What's your child's name?";
    
    case IntakeStep.CHILD_AGE:
      return "How old is your child?";
    
    case IntakeStep.RAPID_RAPPORT_ADULT:
      return "Have you trained in martial arts before?";
    
    case IntakeStep.EMOTIONAL_DISCOVERY:
      if (!state.emotionalGoal) {
        // Part 1: What do you want to improve?
        const subject = state.classFor === "child" && state.childName 
          ? state.childName 
          : "you";
        return `What would you like to see improve for ${subject}?`;
      } else {
        // Part 2: What would be different?
        return "If that improved, what would be different at home or school?";
      }
    
    case IntakeStep.TRIAL_TRANSITION:
      // This step combines transition message with slot offering
      // Already handled in TRIAL_TRANSITION case
      return "";
    
    case IntakeStep.FAST_FIRST_LESSON:
      // Offer 2 specific slots
      if (state.offeredSlots && state.offeredSlots.length >= 2) {
        const slot1 = state.offeredSlots[0];
        const slot2 = state.offeredSlots[1];
        return `I can get you in ${slot1.displayText} or ${slot2.displayText}. Which works best?`;
      }
      return "Let me check available times for your first lesson.";
    
    case IntakeStep.SECONDARY_DECISION_MAKER:
      return "Is there anyone else who needs to be involved in the decision to get started?";
    
    case IntakeStep.NAME:
      return "What's your full name?";
    
    case IntakeStep.PHONE:
      return "What's the best phone number to reach you?";
    
    case IntakeStep.EMAIL:
      return "And your email address? (or type 'skip' if you prefer not to share)";
    
    case IntakeStep.PAYMENT_POSITIONING:
      const slotText = state.selectedSlot ? state.selectedSlot.displayText : "your selected time";
      return `Perfect! To reserve your spot for ${slotText}, we just take care of the trial tuition now. You can use debit or credit — which is best?`;
    
    case IntakeStep.ENROLLMENT_PREFRAME:
      return "After the first lesson, most families know right away this is the perfect fit. " +
        "If you love it as much as I think you will, I'll show you the membership options and how to save by enrolling that day. " +
        "For the first lesson, parents participate too. It's the best way to experience how we teach. The lesson lasts about 50 minutes.";
    
    case IntakeStep.COMPLETE:
      return "All set! You're ready to start your martial arts journey. See you soon!";
    
    default:
      return "How can I help you today?";
  }
}

/**
 * Generate quick reply options for the current step
 */
export function generateQuickReplies(state: IntakeState): string[] | undefined {
  const step = state.currentStep;
  
  switch (step) {
    case IntakeStep.CLASS_FOR:
      return ["For me", "For my child", "For someone else"];
    
    case IntakeStep.RAPID_RAPPORT_ADULT:
      return ["Yes", "No", "A little"];
    
    case IntakeStep.FAST_FIRST_LESSON:
      if (state.offeredSlots && state.offeredSlots.length >= 2) {
        return [
          state.offeredSlots[0].displayText,
          state.offeredSlots[1].displayText,
          "Neither works"
        ];
      }
      return undefined;
    
    case IntakeStep.SECONDARY_DECISION_MAKER:
      return ["Just me", "My spouse/partner", "Other"];
    
    case IntakeStep.EMAIL:
      return ["Skip"];
    
    case IntakeStep.PAYMENT_POSITIONING:
      return ["Debit", "Credit"];
    
    default:
      return undefined;
  }
}
