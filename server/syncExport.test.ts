import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { handleSyncExport } from "./syncExport";

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
        leftJoin: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));

const VALID_KEY = "test-secret-key-12345";

function mockReqRes(options: {
  authHeader?: string;
  queryKey?: string;
}) {
  const req = {
    headers: { authorization: options.authHeader ?? "" },
    query: options.queryKey ? { api_key: options.queryKey } : {},
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

describe("/api/sync-export", () => {
  beforeEach(() => {
    process.env.SYNC_EXPORT_API_KEY = VALID_KEY;
  });

  it("returns 401 when no API key is provided", async () => {
    const { req, res } = mockReqRes({});
    await handleSyncExport(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Unauthorized") })
    );
  });

  it("returns 401 when wrong API key is provided", async () => {
    const { req, res } = mockReqRes({ authHeader: "Bearer wrong-key" });
    await handleSyncExport(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when wrong query key is provided", async () => {
    const { req, res } = mockReqRes({ queryKey: "bad-key" });
    await handleSyncExport(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 200 with valid Bearer token", async () => {
    const { req, res } = mockReqRes({ authHeader: `Bearer ${VALID_KEY}` });
    await handleSyncExport(req, res);
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        exportedAt: expect.any(String),
        counts: expect.objectContaining({
          introAppointments: expect.any(Number),
          students: expect.any(Number),
        }),
        introAppointments: expect.any(Array),
        students: expect.any(Array),
      })
    );
  });

  it("returns 200 with valid query param api_key", async () => {
    const { req, res } = mockReqRes({ queryKey: VALID_KEY });
    await handleSyncExport(req, res);
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ exportedAt: expect.any(String) })
    );
  });

  it("returns 503 when SYNC_EXPORT_API_KEY env var is not set", async () => {
    delete process.env.SYNC_EXPORT_API_KEY;
    const { req, res } = mockReqRes({ authHeader: `Bearer ${VALID_KEY}` });
    await handleSyncExport(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
