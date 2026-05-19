import { api, setToken, clearToken } from "../api-client";
import { AuthUser } from "../types";

export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; accessToken: string }> {
  const res = await api.post<{
    user: AuthUser;
    accessToken: string;
  }>("/admin/auth/login", { email, password }, { auth: false });

  if (!res.data) throw new Error("No data returned from login");

  const { user, accessToken } = res.data;

  if (user.role !== "admin") {
    throw new Error("Access denied — admin account required");
  }

  setToken(accessToken);
  return { user, accessToken };
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await api.get<AuthUser>("/auth/me");
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearToken();
  }
}
