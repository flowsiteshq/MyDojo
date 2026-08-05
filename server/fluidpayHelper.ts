/**
 * FluidPay API helper with built-in timeout.
 * All FluidPay API calls should use fpFetch() instead of raw fetch()
 * to prevent infinite hangs when FluidPay is slow or unresponsive.
 */

export const FLUIDPAY_API_URL = 'https://app.fluidpay.com';
export const FLUIDPAY_TIMEOUT_MS = 20_000; // 20 seconds

/**
 * Fetch wrapper for FluidPay API calls with a 20-second timeout.
 * Throws a descriptive error if the request times out or fails.
 */
export async function fpFetch(
  url: string,
  options: RequestInit & { _label?: string } = {}
): Promise<Response> {
  const controller = new AbortController();
  const label = options._label || url;
  const timer = setTimeout(() => {
    controller.abort();
  }, FLUIDPAY_TIMEOUT_MS);

  const { _label, ...fetchOptions } = options;

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new Error(
        `FluidPay API timeout after ${FLUIDPAY_TIMEOUT_MS / 1000}s [${label}]. Please try again.`
      );
    }
    throw new Error(`FluidPay API error [${label}]: ${err?.message || 'Unknown error'}`);
  }
}

/**
 * Convenience: POST JSON to FluidPay API with auth header and timeout.
 */
export async function fpPost(
  path: string,
  body: unknown,
  secretKey: string,
  label?: string
): Promise<any> {
  const res = await fpFetch(`${FLUIDPAY_API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: secretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    _label: label || path,
  });
  return res.json();
}

/**
 * Convenience: GET from FluidPay API with auth header and timeout.
 */
export async function fpGet(
  path: string,
  secretKey: string,
  label?: string
): Promise<any> {
  const res = await fpFetch(`${FLUIDPAY_API_URL}${path}`, {
    method: 'GET',
    headers: { Authorization: secretKey },
    _label: label || path,
  });
  return res.json();
}
