import { API_BASE_URL } from "../config/env";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "../auth/session";
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../types/api";

function buildHeaders(options: RequestInit = {}): HeadersInit {
  const session = getStoredSession();

  return {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(options.headers ?? {}),
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Error HTTP: ${response.status}`;

    try {
      const errorData = await response.json();
      if (typeof errorData?.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Si no hay JSON, se conserva el mensaje por defecto
    }

    if (response.status === 401) {
      clearStoredSession();
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(options),
  });

  return parseJsonResponse<T>(response);
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse<AuthResponse>(response);
  setStoredSession({
    token: data.access_token,
    user: data.user,
  });
  return data;
}

export async function register(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse<AuthResponse>(response);
  setStoredSession({
    token: data.access_token,
    user: data.user,
  });
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    method: "GET",
  });
}

export function logout(): void {
  clearStoredSession();
}

export function getCurrentSession() {
  const session = getStoredSession();

  return {
    token: session?.token ?? null,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.token && session?.user),
  };
}
