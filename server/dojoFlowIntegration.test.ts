import { describe, it, expect } from "vitest";
import { submitLeadToDojoFlow } from "./dojoFlowClient";

describe("Dojo Flow Integration", () => {
  it("should authenticate and submit a lead to Dojo Flow", async () => {
    const testLead = {
      name: "Test Lead from MyDojo",
      email: "testlead@mydojo.com",
      phone: "555-123-4567",
      program: "Little Ninjas",
      location: "Tomball HQ",
      preferredContactMethod: "email" as const,
      message: "This is a test lead from the MyDojo website chatbot integration.",
    };

    try {
      const result = await submitLeadToDojoFlow(testLead);
      
      // If we get here without throwing, the API call succeeded
      expect(result).toBeTruthy();
      expect(result.success).toBe(true);
      
      console.log("✓ Successfully submitted test lead to Dojo Flow");
      console.log("Lead ID:", result.leadId);
      console.log("Message:", result.message);
    } catch (error) {
      // If authentication or submission fails, we'll get an error
      console.error("Dojo Flow integration test failed:", error);
      
      // Check if it's an authentication error
      if (error instanceof Error) {
        // If the server is not available (502, 503, 504), skip the test
        if (error.message.includes("502") || error.message.includes("503") || error.message.includes("504")) {
          console.warn("⚠ Dojo Flow server is not available (may be hibernating or not yet published). Skipping test.");
          // Don't fail the test if the server is just not available
          return;
        }
        
        if (error.message.includes("authentication") || error.message.includes("Invalid email or password")) {
          throw new Error(
            "Dojo Flow authentication failed. Please verify DOJO_FLOW_EMAIL and DOJO_FLOW_PASSWORD are correct."
          );
        }
        if (error.message.includes("lead submission failed")) {
          throw new Error(
            "Dojo Flow lead submission failed. The API endpoint may have changed or the lead data format is incorrect."
          );
        }
      }
      
      throw error;
    }
  }, 30000); // 30 second timeout for API calls
});
