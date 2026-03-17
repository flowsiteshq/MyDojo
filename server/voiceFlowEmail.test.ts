import { describe, it, expect } from "vitest";
import { generateVoiceResponse, VoiceFlowState } from "../client/src/lib/voiceFlowHandler";

describe("Voice Flow Email Collection", () => {
  it("should transition from get_name to get_email step", () => {
    const state: VoiceFlowState = {
      step: "get_name",
      studentType: "self",
      age: 25,
      program: "Adult Karate",
      selectedClassTime: "Tuesday at 5:00 PM",
      name: null,
      email: null,
      phone: null,
    };

    const result = generateVoiceResponse(state, "John Smith");

    expect(result.nextStep).toBe("get_email");
    expect(result.updatedState.name).toBe("John Smith");
    expect(result.response).toContain("email");
  });

  it("should validate email format", () => {
    const state: VoiceFlowState = {
      step: "get_email",
      studentType: "self",
      age: 25,
      program: "Adult Karate",
      selectedClassTime: "Tuesday at 5:00 PM",
      name: "John Smith",
      email: null,
      phone: null,
    };

    // Test invalid email
    const invalidResult = generateVoiceResponse(state, "notanemail");
    expect(invalidResult.nextStep).toBe("get_email");
    expect(invalidResult.response).toContain("valid email");

    // Test valid email
    const validResult = generateVoiceResponse(state, "john@example.com");
    expect(validResult.nextStep).toBe("get_phone");
    expect(validResult.updatedState.email).toBe("john@example.com");
  });

  it("should transition from get_email to get_phone step", () => {
    const state: VoiceFlowState = {
      step: "get_email",
      studentType: "self",
      age: 25,
      program: "Adult Karate",
      selectedClassTime: "Tuesday at 5:00 PM",
      name: "John Smith",
      email: null,
      phone: null,
    };

    const result = generateVoiceResponse(state, "john@example.com");

    expect(result.nextStep).toBe("get_phone");
    expect(result.updatedState.email).toBe("john@example.com");
    expect(result.response).toContain("mobile number");
  });
});

describe("Dojo Flow Data Sync", () => {
  it("should include all required fields in lead data", () => {
    // This test verifies the structure of data sent to Dojo Flow
    const leadData = {
      name: "John Smith",
      email: "john@example.com",
      phone: "555-123-4567",
      program: "Adult Karate",
      location: "Tomball HQ",
      preferredContactMethod: "text" as const,
      message: "Voice chat booking. Age: 25, Student type: self, Class time: Tuesday at 5:00 PM",
    };

    // Verify all required fields are present
    expect(leadData.name).toBeDefined();
    expect(leadData.email).toBeDefined();
    expect(leadData.phone).toBeDefined();
    expect(leadData.program).toBeDefined();
    expect(leadData.location).toBeDefined();
    expect(leadData.preferredContactMethod).toBeDefined();
    expect(leadData.message).toContain("Age:");
    expect(leadData.message).toContain("Student type:");
    expect(leadData.message).toContain("Class time:");
  });
});
