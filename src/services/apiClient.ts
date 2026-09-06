/**
 * Thin transport layer for the future FastAPI backend.
 *
 * Nothing here holds a credential. The base URL comes from an environment
 * variable, and auth tokens (when they exist) will be issued per-session by the
 * backend and injected via `setAuthToken` — never compiled into the bundle.
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  /** While true, services resolve from `src/data` instead of the network. */
  useMock: (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false",
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
} as const

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code = "api_error") {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

let authToken: string | null = null

/** Called after login once the backend exists. Kept in memory only. */
export function setAuthToken(token: string | null): void {
  authToken = token
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  signal?: AbortSignal
  /** Overrides the default JSON content type, e.g. for multipart uploads. */
  headers?: Record<string, string>
}

function buildHeaders(options: RequestOptions, isFormData: boolean) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  }
  if (!isFormData && options.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  return headers
}

/**
 * Issues a request against the backend.
 *
 * Services should not call this while `API_CONFIG.useMock` is true — they
 * branch to mock data first. It exists so that flipping the env var is the only
 * change needed once the FastAPI endpoints are live.
 */
export async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs)
  const isFormData = options.body instanceof FormData

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: buildHeaders(options, isFormData),
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      signal: options.signal ?? controller.signal,
    })

    if (!response.ok) {
      // Deliberately does not echo the response body: it may carry patient data.
      throw new ApiError(
        `Request to ${path} failed`,
        response.status,
        `http_${response.status}`,
      )
    }

    if (response.status === 204) return undefined as TResponse
    return (await response.json()) as TResponse
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(`Request to ${path} timed out`, 408, "timeout")
    }
    throw new ApiError(`Network error calling ${path}`, 0, "network")
  } finally {
    clearTimeout(timeout)
  }
}

/** Simulates network latency so mocked screens exercise their loading states. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
