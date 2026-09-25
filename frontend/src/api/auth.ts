const STORAGE_KEY = "authHeader";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";

export function getAuthHeader(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearAuthHeader(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export async function login(username: string, password: string): Promise<boolean> {
  const header = `Basic ${btoa(`${username}:${password}`)}`;
  const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
    headers: { Authorization: header },
  });
  if (!response.ok) return false;
  sessionStorage.setItem(STORAGE_KEY, header);
  return true;
}
