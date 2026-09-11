import { describe, expect, it } from "vitest";
import { isAccountSupportRequest } from "./aiSms";
import { isBookingIntent } from "./smsTrialBooking";

describe("AI SMS account-support routing", () => {
  const shiMessage = "Hello this is Shi, Hannah Zhang's mom. We sign up and log in, but Hannah's program is not showing in my account. Could you help me check it?";

  it("identifies existing-member account support even when the message also contains sign-up language", () => {
    expect(isBookingIntent(shiMessage)).toBe(true);
    expect(isAccountSupportRequest(shiMessage)).toBe(true);
  });

  it("does not classify an ordinary prospective booking request as account support", () => {
    expect(isAccountSupportRequest("We would like to sign up for a free trial class")).toBe(false);
  });
});
