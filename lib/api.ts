const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type ErrorPayload = {
  message?: string;
  code?: string;
};

export class ApiError extends Error {
  status: number;
  payload?: ErrorPayload;

  constructor(status: number, message: string, payload?: ErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }

  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function parseApiError(response: Response): Promise<ApiError> {
  let payload: ErrorPayload | undefined;
  let fallbackMessage = `Request failed (${response.status})`;

  try {
    const text = await response.text();
    if (!text) {
      return new ApiError(response.status, fallbackMessage);
    }

    try {
      payload = JSON.parse(text) as ErrorPayload;
      fallbackMessage = payload.message ?? payload.code ?? fallbackMessage;
    } catch {
      fallbackMessage = text;
    }
  } catch {
    // keep fallback message
  }

  return new ApiError(response.status, fallbackMessage, payload);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...init.headers
    }
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
