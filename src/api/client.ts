export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) {
    let code: string | null = null;
    try {
      const body = (await res.json()) as { error?: unknown };
      code = typeof body?.error === "string" ? body.error : null;
    } catch {
      code = null;
    }
    throw new ApiError(res.status, code, `HTTP ${res.status}${code ? ` (${code})` : ""}`);
  }
  return (await res.json()) as T;
}
