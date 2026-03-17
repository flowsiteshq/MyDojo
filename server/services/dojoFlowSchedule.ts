import { ENV } from "../_core/env";

export interface ClassSchedule {
  id: string;
  name: string;
  dayOfWeek: string;
  time: string;
  availableSpots: number;
  instructor?: string;
  location?: string;
  program?: string;
}

interface DojoFlowScheduleResponse {
  result: {
    data: ClassSchedule[];
  };
}

/**
 * Fetch available class times from Dojo Flow
 * Uses the classes.getAvailableTimes endpoint
 */
export async function getAvailableClassTimes(options?: {
  program?: string;
  locationId?: string;
}): Promise<ClassSchedule[]> {
  const dojoFlowUrl = ENV.DOJO_FLOW_URL;

  if (!dojoFlowUrl) {
    console.error("Dojo Flow URL not configured");
    throw new Error("Dojo Flow integration is not configured");
  }

  try {
    const endpoint = `${dojoFlowUrl}/api/trpc/classes.getAvailableTimes`;

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "classes.getAvailableTimes",
      params: {
        input: {
          ...(options?.program && { program: options.program }),
          ...(options?.locationId && { locationId: options.locationId }),
        },
      },
    };

    console.log("Fetching available class times from Dojo Flow:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dojo Flow schedule API error:", response.status, errorText);
      throw new Error(
        `Failed to fetch class schedules: ${response.status} ${errorText}`
      );
    }

    const result: DojoFlowScheduleResponse = await response.json();

    if (result.result && result.result.data) {
      console.log(
        `Retrieved ${result.result.data.length} available class times from Dojo Flow`
      );
      return result.result.data;
    }

    console.warn("No class schedules found in Dojo Flow response");
    return [];
  } catch (error) {
    console.error("Error fetching class schedules from Dojo Flow:", error);
    // Return empty array instead of throwing to gracefully handle API failures
    return [];
  }
}
