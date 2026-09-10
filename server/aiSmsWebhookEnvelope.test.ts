import { describe, expect, it } from "vitest";
import { extractInboundSmsPayload } from "./aiSms";

describe("800.com inbound SMS webhook envelope parsing", () => {
  it("unwraps the documented sms_received data payload", () => {
    expect(extractInboundSmsPayload({
      type: "sms_received",
      data: {
        id: 24071540,
        sender: "+17135550123",
        recipient: "+18774693656",
        inbound: true,
        message: "What classes do you have?",
        media: [],
      },
    })).toEqual({
      id: 24071540,
      sender: "+17135550123",
      recipient: "+18774693656",
      inbound: true,
      message: "What classes do you have?",
      media: [],
    });
  });

  it("continues to accept the direct payload shape used by local callers", () => {
    expect(extractInboundSmsPayload({
      id: 123,
      sender: "+17135550123",
      recipient: "+18774693656",
      inbound: true,
      message: "Hi",
    })).toMatchObject({ id: 123, inbound: true, message: "Hi" });
  });

  it("preserves outbound direction so the handler can ignore provider delivery events", () => {
    expect(extractInboundSmsPayload({
      type: "sms_received",
      data: {
        id: 124,
        sender: "+18774693656",
        recipient: "+17135550123",
        inbound: false,
        message: "An outbound campaign message",
      },
    })).toMatchObject({ id: 124, inbound: false });
  });

  it("rejects malformed payloads before any conversation or reply work", () => {
    expect(extractInboundSmsPayload({ type: "sms_received", data: { id: 1 } })).toBeNull();
    expect(extractInboundSmsPayload(null)).toBeNull();
  });
});
