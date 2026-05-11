/**
 * useVisitorSms
 *
 * Reads ?phone=, ?name=, and ?utm_source= (or ?source=) from the URL on first
 * render and fires a one-time welcome SMS via the popup.triggerVisitorSms
 * tRPC procedure.
 *
 * Usage:
 *   useVisitorSms({ page: 'home' });          // in Home.tsx
 *   useVisitorSms({ page: 'summer-camp' });   // in SummerCamp.tsx
 *
 * The server deduplicates by phone so the visitor will only ever receive one
 * text no matter how many times they visit or refresh.
 *
 * URL format expected from ad platforms:
 *   https://mydojoma.com/?phone=2815551234&name=John&utm_source=facebook
 *   https://mydojoma.com/summer-camp?phone=2815551234&name=Sarah&utm_source=google
 */

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

interface UseVisitorSmsOptions {
  /** Page identifier passed to the server for message personalization */
  page: "home" | "summer-camp";
}

export function useVisitorSms({ page }: UseVisitorSmsOptions) {
  const fired = useRef(false);
  const mutation = trpc.popup.triggerVisitorSms.useMutation();

  useEffect(() => {
    if (fired.current) return;

    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone") ?? params.get("p");
    if (!phone) return;

    const name = params.get("name") ?? params.get("n") ?? undefined;
    const source =
      params.get("utm_source") ??
      params.get("source") ??
      params.get("utm_campaign") ??
      "direct";

    fired.current = true;

    mutation.mutate(
      { phone, name, source, page },
      {
        onSuccess: (data) => {
          if (data.alreadySent) {
            console.log("[VisitorSMS] Already sent to this number — skipped.");
          } else if (data.success) {
            console.log("[VisitorSMS] Welcome text sent successfully.");
          } else {
            console.warn("[VisitorSMS] SMS send failed:", data.error);
          }
        },
        onError: (err) => {
          console.warn("[VisitorSMS] Mutation error:", err.message);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
