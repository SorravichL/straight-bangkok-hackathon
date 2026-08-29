/** An API route answered with a non-2xx status. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * fetch + JSON with useful errors. Reads the body as text first so an HTML or
 * empty error page becomes a readable message instead of a JSON parse crash.
 */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();

  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Left as null — handled below.
  }

  if (!response.ok) {
    const message =
      (body as { error?: string } | null)?.error ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return body as T;
}
