const STORAGE_KEY = "authHeader";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";
// Must match APP_USERNAME on the backend (default "spiller").
const USERNAME = import.meta.env.VITE_APP_USERNAME ?? "spiller";

export type LoginResult = "ok" | "invalid" | "unreachable";

export function getAuthHeader(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearAuthHeader(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Basic auth per RFC 7617 with UTF-8 (btoa alone is Latin-1 only and mangles or rejects æøå and beyond). */
function basicAuthHeader(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  return `Basic ${btoa(String.fromCharCode(...bytes))}`;
}

export async function login(password: string): Promise<LoginResult> {
  const header = basicAuthHeader(USERNAME, password);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/check`, {
      headers: { Authorization: header },
    });
  } catch {
    return "unreachable";
  }
  if (response.status === 401) return "invalid";
  if (!response.ok) return "unreachable";
  sessionStorage.setItem(STORAGE_KEY, header);
  return "ok";
}
