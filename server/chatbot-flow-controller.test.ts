import { describe, it, expect } from "vitest";
import {
  getNextStep,
  getNextMissingField,
  getStepMessage,
  getStepQuickReplies,
  isFieldAnswered,
  type FlowControllerState,
  type ConversationStep,
} from "./chatbot-flow-controller";

describe("Chatbot Flow Controller", () => {
  describe("getNextMissingField", () => {
    it("should return 'name' when no fields are collected", () => {
      const state: FlowControllerState = {
        currentStep: "greeting",
        conversationStage: "greeting",
      };
      expect(getNextMissingField(state)).toBe("name");
    });

    it("should return 'phone' when only name is collected", () => {
      const state: FlowControllerState = {
        currentStep: "collect_name",
        conversationStage: "collecting_info",
        name: "John Doe",
      };
      expect(getNextMissingField(state)).toBe("phone");
    });

    it("should return 'email' when name and phone are collected", () => {
      const state: FlowControllerState = {
        currentStep: "collect_phone",
        conversationStage: "collecting_info",
        name: "John Doe",
        phone: "555-1234",
      };
      expect(getNextMissingField(state)).toBe("email");
    });

    it("should return 'classFor' when email has been asked", () => {
      const state: FlowControllerState = {
        currentStep: "collect_email",
        conversationStage: "collecting_info",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
      };
      expect(getNextMissingField(state)).toBe("classFor");
    });

    it("should return 'program' when classFor is collected", () => {
      const state: FlowControllerState = {
        currentStep: "collect_class_for",
        conversationStage: "collecting_info",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
      };
      expect(getNextMissingField(state)).toBe("program");
    });

    it("should return 'preferredDays' when program is collected", () => {
      const state: FlowControllerState = {
        currentStep: "collect_program",
        conversationStage: "scheduling",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
        program: "Little Ninjas",
      };
      expect(getNextMissingField(state)).toBe("preferredDays");
    });

    it("should return 'slot' when preferredDays is collected", () => {
      const state: FlowControllerState = {
        currentStep: "collect_preferred_days",
        conversationStage: "scheduling",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
        program: "Little Ninjas",
        preferredDays: "weekdays",
      };
      expect(getNextMissingField(state)).toBe("slot");
    });

    it("should return 'confirmation' when slot is selected", () => {
      const state: FlowControllerState = {
        currentStep: "show_slots",
        conversationStage: "scheduling",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
        program: "Little Ninjas",
        preferredDays: "weekdays",
        scheduledTime: "2026-02-20T17:30:00Z",
      };
      expect(getNextMissingField(state)).toBe("confirmation");
    });

    it("should return null when all fields are collected", () => {
      const state: FlowControllerState = {
        currentStep: "confirmation",
        conversationStage: "complete",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
        program: "Little Ninjas",
        preferredDays: "weekdays",
        scheduledTime: "2026-02-20T17:30:00Z",
        confirmed: true,
      };
      expect(getNextMissingField(state)).toBe(null);
    });
  });

  describe("getNextStep", () => {
    it("should return 'collect_name' when no fields are collected", () => {
      const state: FlowControllerState = {
        currentStep: "greeting",
        conversationStage: "greeting",
      };
      expect(getNextStep(state)).toBe("collect_name");
    });

    it("should return 'complete' when all fields are collected", () => {
      const state: FlowControllerState = {
        currentStep: "confirmation",
        conversationStage: "complete",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
        program: "Little Ninjas",
        preferredDays: "weekdays",
        scheduledTime: "2026-02-20T17:30:00Z",
        confirmed: true,
      };
      expect(getNextStep(state)).toBe("complete");
    });

    it("should progress through all steps in order", () => {
      let state: FlowControllerState = {
        currentStep: "greeting",
        conversationStage: "greeting",
      };

      // Step 1: collect_name
      expect(getNextStep(state)).toBe("collect_name");
      state = { ...state, name: "John Doe", currentStep: "collect_name" };

      // Step 2: collect_phone
      expect(getNextStep(state)).toBe("collect_phone");
      state = { ...state, phone: "555-1234", currentStep: "collect_phone" };

      // Step 3: collect_email
      expect(getNextStep(state)).toBe("collect_email");
      state = { ...state, emailAsked: true, currentStep: "collect_email" };

      // Step 4: collect_class_for
      expect(getNextStep(state)).toBe("collect_class_for");
      state = { ...state, classFor: "child", currentStep: "collect_class_for" };

      // Step 5: collect_program
      expect(getNextStep(state)).toBe("collect_program");
      state = { ...state, program: "Little Ninjas", currentStep: "collect_program" };

      // Step 6: collect_preferred_days
      expect(getNextStep(state)).toBe("collect_preferred_days");
      state = { ...state, preferredDays: "weekdays", currentStep: "collect_preferred_days" };

      // Step 7: show_slots
      expect(getNextStep(state)).toBe("show_slots");
      state = { ...state, scheduledTime: "2026-02-20T17:30:00Z", currentStep: "show_slots" };

      // Step 8: confirmation
      expect(getNextStep(state)).toBe("confirmation");
      state = { ...state, confirmed: true, currentStep: "confirmation" };

      // Step 9: complete
      expect(getNextStep(state)).toBe("complete");
    });
  });

  describe("getStepMessage", () => {
    it("should return appropriate message for each step", () => {
      const state: FlowControllerState = {
        currentStep: "collect_name",
        conversationStage: "collecting_info",
        name: "John Doe",
      };

      expect(getStepMessage("collect_name", state)).toContain("name");
      expect(getStepMessage("collect_phone", state)).toContain("phone");
      expect(getStepMessage("collect_email", state)).toContain("email");
      expect(getStepMessage("collect_class_for", state)).toContain("who");
      expect(getStepMessage("collect_program", state)).toContain("program");
      expect(getStepMessage("collect_preferred_days", state)).toContain("prefer");
      expect(getStepMessage("confirmation", state)).toContain("booked");
    });

    it("should include user's name in phone question", () => {
      const state: FlowControllerState = {
        currentStep: "collect_phone",
        conversationStage: "collecting_info",
        name: "John Doe",
      };

      const message = getStepMessage("collect_phone", state);
      expect(message).toContain("John Doe");
    });
  });

  describe("getStepQuickReplies", () => {
    it("should return quick replies for collect_class_for step", () => {
      const replies = getStepQuickReplies("collect_class_for");
      expect(replies).toEqual(["For Me", "For My Child", "For My Family"]);
    });

    it("should return quick replies for collect_preferred_days step", () => {
      const replies = getStepQuickReplies("collect_preferred_days");
      expect(replies).toEqual(["Weekdays", "Weekends", "Either"]);
    });

    it("should return skip option for collect_email step", () => {
      const replies = getStepQuickReplies("collect_email");
      expect(replies).toEqual(["Skip"]);
    });

    it("should return undefined for steps without quick replies", () => {
      expect(getStepQuickReplies("collect_name")).toBeUndefined();
      expect(getStepQuickReplies("collect_phone")).toBeUndefined();
      expect(getStepQuickReplies("collect_program")).toBeUndefined();
    });
  });

  describe("isFieldAnswered", () => {
    it("should correctly identify answered fields", () => {
      const state: FlowControllerState = {
        currentStep: "collect_program",
        conversationStage: "collecting_info",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
      };

      expect(isFieldAnswered("name", state)).toBe(true);
      expect(isFieldAnswered("phone", state)).toBe(true);
      expect(isFieldAnswered("email", state)).toBe(true); // emailAsked is true
      expect(isFieldAnswered("classFor", state)).toBe(true);
      expect(isFieldAnswered("program", state)).toBe(false);
      expect(isFieldAnswered("preferredDays", state)).toBe(false);
      expect(isFieldAnswered("slot", state)).toBe(false);
      expect(isFieldAnswered("confirmation", state)).toBe(false);
    });
  });

  describe("NextStepEnforcer Logic", () => {
    it("should prevent dead-ends by always having a next step until complete", () => {
      const testCases: FlowControllerState[] = [
        { currentStep: "greeting", conversationStage: "greeting" },
        { currentStep: "collect_name", conversationStage: "collecting_info", name: "John" },
        { currentStep: "collect_phone", conversationStage: "collecting_info", name: "John", phone: "555-1234" },
        { currentStep: "collect_email", conversationStage: "collecting_info", name: "John", phone: "555-1234", emailAsked: true },
        { currentStep: "collect_class_for", conversationStage: "collecting_info", name: "John", phone: "555-1234", emailAsked: true, classFor: "child" },
        { currentStep: "collect_program", conversationStage: "scheduling", name: "John", phone: "555-1234", emailAsked: true, classFor: "child", program: "Little Ninjas" },
        { currentStep: "collect_preferred_days", conversationStage: "scheduling", name: "John", phone: "555-1234", emailAsked: true, classFor: "child", program: "Little Ninjas", preferredDays: "weekdays" },
        { currentStep: "show_slots", conversationStage: "scheduling", name: "John", phone: "555-1234", emailAsked: true, classFor: "child", program: "Little Ninjas", preferredDays: "weekdays", scheduledTime: "2026-02-20T17:30:00Z" },
      ];

      testCases.forEach((state) => {
        const nextStep = getNextStep(state);
        expect(nextStep).not.toBe("complete"); // Should not be complete until all fields are collected
        expect(nextStep).toBeDefined();
        
        const nextMessage = getStepMessage(nextStep, state);
        expect(nextMessage).toBeDefined();
        expect(nextMessage.length).toBeGreaterThan(0);
      });
    });

    it("should only return 'complete' when all required fields are collected and confirmed", () => {
      const completeState: FlowControllerState = {
        currentStep: "confirmation",
        conversationStage: "complete",
        name: "John Doe",
        phone: "555-1234",
        emailAsked: true,
        classFor: "child",
        program: "Little Ninjas",
        preferredDays: "weekdays",
        scheduledTime: "2026-02-20T17:30:00Z",
        confirmed: true,
      };

      expect(getNextStep(completeState)).toBe("complete");
    });
  });
});
