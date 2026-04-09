import { AUTH_STORAGE_KEY } from "../config/env";
import type { AuthUser, SessionData } from "../types/api";

export type StoredSession = SessionData;

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function getTokenKey(): string {
  return `${AUTH_STORAGE_KEY}:token`;
}

function getUserKey(): string {
  return `${AUTH_STORAGE_KEY}:user`;
}

export function setStoredSession(session: StoredSession): void {
  if (!isBrowser()) return;

  window.localStorage.setItem(getTokenKey(), session.token);
  window.localStorage.setItem(getUserKey(), JSON.stringify(session.user));
}

export function saveSession(session: StoredSession): void {
  setStoredSession(session);
}

export function getStoredToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(getTokenKey());
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(getUserKey());
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function getStoredSession(): StoredSession | null {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) return null;

  return { token, user };
}

export function clearStoredSession(): void {
  if (!isBrowser()) return;

  window.localStorage.removeItem(getTokenKey());
  window.localStorage.removeItem(getUserKey());
}

export function clearSession(): void {
  clearStoredSession();
}

export function hasStoredSession(): boolean {
  return Boolean(getStoredToken() && getStoredUser());
}
