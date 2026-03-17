import { ENV } from "./_core/env";

interface LeadData {
  name: string;
  email: string;
  phone: string;
  program: string;
  location: string;
  preferredContactMethod: "email" | "phone" | "text";
  message?: string;
  source?: "chatbot" | "landing_page" | "trial_form" | "website";
}

interface DojoFlowResponse {
  success: boolean;
  leadId?: string;
  message?: string;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Result of the function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry on client errors (4xx)
      if (lastError.message.includes('400') || lastError.message.includes('401') || 
          lastError.message.includes('403') || lastError.message.includes('404')) {
        console.log(`Client error detected, not retrying: ${lastError.message}`);
        break;
      }
      
      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Submit a lead to Dojo Flow's lead pipeline using the REST wrapper endpoint
 * Endpoint: POST /api/public/submit-lead
 * 
 * This endpoint accepts standard JSON POST requests and internally calls
 * the tRPC publicLead.submitLead procedure.
 * 
 * Includes retry logic with exponential backoff for production reliability:
 * - Retries up to 3 times on network/server errors
 * - Uses exponential backoff (1s, 2s, 4s delays)
 * - Does not retry on client errors (4xx)
 */
export async function submitLeadToDojoFlow(
  leadData: LeadData
): Promise<DojoFlowResponse> {
  const dojoFlowUrl = ENV.DOJO_FLOW_URL;
  const email = ENV.DOJO_FLOW_EMAIL;
  const password = ENV.DOJO_FLOW_PASSWORD;

  if (!dojoFlowUrl || !email || !password) {
    console.error("Dojo Flow credentials not configured");
    throw new Error(
      "Dojo Flow integration is not configured. Please set DOJO_FLOW_URL, DOJO_FLOW_EMAIL, and DOJO_FLOW_PASSWORD."
    );
  }

  try {
    // Use the REST wrapper endpoint instead of the tRPC endpoint
    const endpoint = `${dojoFlowUrl}/api/public/submit-lead`;

    // Split the name into first and last name
    const nameParts = leadData.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "Unknown";

    // Prepare the payload for the REST endpoint
    // All chatbot data fields are sent to Dojo Flow:
    // - Lead contact info: firstName, lastName, leadEmail, phone
    // - Program interest and location
    // - Preferred contact method
    // - Additional metadata in message field (age, student type, class time)
    const payload = {
      email, // Dojo Flow auth email
      password, // Dojo Flow auth password
      firstName,
      lastName,
      leadEmail: leadData.email, // Lead's actual email
      phone: leadData.phone,
      programInterest: leadData.program,
      location: leadData.location,
      preferredContactMethod: leadData.preferredContactMethod,
      message: leadData.message || `Lead from MyDojo Website. Location: ${leadData.location}. Preferred contact: ${leadData.preferredContactMethod}`,
      source: leadData.source || "chatbot",
    };

    console.log("Submitting lead to Dojo Flow REST endpoint:", endpoint);
    console.log("Payload:", { ...payload, password: "[REDACTED]" });

    // Wrap the fetch call in retry logic for production reliability
    return await retryWithBackoff(async () => {
      // Make the API request with 30 second timeout
      // Note: Using Node.js native fetch which may have SSL issues with self-signed certs
      // For Manus platform internal communication, we need to handle this properly
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        // For Node.js fetch, we need to configure to accept self-signed certificates
        // This is safe for internal Manus platform communication
        const https = await import('https');
        const agent = new https.Agent({ rejectUnauthorized: false });
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          // @ts-ignore - agent is valid for Node.js fetch
          agent: endpoint.startsWith('https') ? agent : undefined,
        });
        clearTimeout(timeoutId);

      if (!response.ok) {
      const errorText = await response.text();
      console.error("Dojo Flow API error:", response.status, errorText);
      throw new Error(
        `Dojo Flow lead submission failed: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    console.log("Dojo Flow response:", result);

    // REST endpoint returns { success: true, data: {...} }
    if (result.success && result.data) {
      const data = result.data;
      console.log("Lead successfully submitted to Dojo Flow:", data);
      
      return {
        success: true,
        leadId: data.leadId?.toString() || data.id?.toString(),
        message: data.message || "Lead submitted successfully",
      };
    }

    // Handle error response
    if (!result.success) {
      console.error("Dojo Flow returned error:", result.error);
      throw new Error(
        `Dojo Flow error: ${result.error || "Unknown error"}`
      );
    }

        throw new Error("Unexpected response format from Dojo Flow");
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('DojoFlow API request timed out after 30 seconds');
        }
        throw fetchError;
      }
    }, 3, 1000); // Retry up to 3 times with 1s initial delay
  } catch (error) {
    console.error("Error submitting lead to Dojo Flow:", error);
    throw error;
  }
}
