import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyToken } from "../auth";
import { findUserById } from "../authDb";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key.trim(), decodeURIComponent(val.join("="))];
    })
  );
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    const cookies = parseCookies(opts.req.headers.cookie);
    const token = cookies["auth_token"];
    if (token) {
      const decoded = verifyToken(token);
      if (decoded?.userId) {
        user = await findUserById(decoded.userId);
      }
    }
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
