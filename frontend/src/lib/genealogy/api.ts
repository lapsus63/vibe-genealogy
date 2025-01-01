// Thin API client for the Spring Boot backend, with mock fallback so the preview stays interactive even when the Java server is offline.

import type { ExpandParams, PersonDetail, TreeGraph } from "./types";
import { mockExpand, mockPerson, mockGraph } from "./mock-data";

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl !== undefined && envUrl !== "") {
    return envUrl.replace(/\/$/, "");
  }
  if (import.meta.env.PROD) {
    return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  }
  return "";
};

const BASE_URL = getApiBaseUrl();

const AUTH_KEY = "genealogy.jwt";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(AUTH_KEY, token);
  else window.localStorage.removeItem(AUTH_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new Error("NO_BACKEND");
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface AuthUser {
  username: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
}

export async function login(username: string, password: string): Promise<AuthUser> {
  if (!BASE_URL) {
    // Demo mode: any non-empty creds succeed.
    if (!username || !password) throw new Error("Identifiants requis");
    setToken("demo-token");
    return { username, role: "ADMIN" };
  }
  const res = await request<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(res.token);
  return res.user;
}

export async function logout(): Promise<void> {
  if (BASE_URL) {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
  }
  setToken(null);
}

export async function me(): Promise<AuthUser | null> {
  if (!BASE_URL) {
    return getToken() ? { username: "demo", role: "ADMIN" } : null;
  }
  if (!getToken()) return null;
  try {
    return await request<AuthUser>("/auth/me");
  } catch {
    setToken(null);
    return null;
  }
}

export async function fetchExpand(params: ExpandParams): Promise<TreeGraph> {
  if (!BASE_URL) return mockExpand(params.rootId, params.ascendants, params.descendants, params.mode);
  const q = new URLSearchParams({
    rootId: params.rootId,
    ascendants: String(params.ascendants),
    descendants: String(params.descendants),
    mode: params.mode,
  });
  return request<TreeGraph>(`/api/tree/expand?${q.toString()}`);
}

export async function fetchTreeRoot(): Promise<TreeGraph> {
  if (!BASE_URL) return mockGraph;
  return request<TreeGraph>("/api/tree");
}

export async function fetchPerson(id: string): Promise<PersonDetail> {
  if (!BASE_URL) {
    const p = mockPerson(id);
    if (!p) throw new Error("Personne introuvable");
    return p;
  }
  const person = await request<PersonDetail>(`/api/persons/${encodeURIComponent(id)}`);
  if (person && person.media) {
    person.media = person.media.map((m) => ({
      ...m,
      url: m.url.startsWith("/api/") ? `${BASE_URL}${m.url}` : m.url,
    }));
  }
  return person;
}

export interface AdvancedSearchQuery {
  q?: string;
  place?: string;
  yearFrom?: number;
  yearTo?: number;
}

function personMatches(p: PersonDetail, f: AdvancedSearchQuery): boolean {
  const q = (f.q ?? "").trim().toLowerCase();
  if (q) {
    const hay = [
      p.firstName,
      p.lastName,
      p.biography,
      p.occupation,
      p.birthPlace,
      p.deathPlace,
      ...(p.events?.map((e) => `${e.place ?? ""} ${e.description ?? ""}`) ?? []),
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  const place = (f.place ?? "").trim().toLowerCase();
  if (place) {
    const places = [p.birthPlace, p.deathPlace, ...(p.events?.map((e) => e.place) ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!places.includes(place)) return false;
  }
  const parseYear = (s?: string) => {
    if (!s) return null;
    const m = s.match(/\d{4}/);
    return m ? parseInt(m[0], 10) : null;
  };
  const by = parseYear(p.birth);
  const dy = parseYear(p.death);
  if (f.yearFrom != null) {
    if ((by ?? Infinity) < f.yearFrom && (dy ?? -Infinity) < f.yearFrom) return false;
  }
  if (f.yearTo != null) {
    if ((by ?? Infinity) > f.yearTo) return false;
  }
  return true;
}

export async function searchPersonsAdvanced(f: AdvancedSearchQuery): Promise<PersonDetail[]> {
  if (!BASE_URL) {
    return mockGraph.nodes.map((p) => mockPerson(p.id)!).filter((p) => p && personMatches(p, f));
  }
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.place) params.set("place", f.place);
  if (f.yearFrom != null) params.set("yearFrom", String(f.yearFrom));
  if (f.yearTo != null) params.set("yearTo", String(f.yearTo));
  return request<PersonDetail[]>(`/api/search?${params.toString()}`);
}

export async function searchPersons(query: string): Promise<PersonDetail[]> {
  return searchPersonsAdvanced({ q: query });
}

export async function fetchAllPersons(): Promise<PersonDetail[]> {
  if (!BASE_URL) return mockGraph.nodes.map((p) => mockPerson(p.id)!).filter(Boolean);
  return request<PersonDetail[]>(`/api/persons`);
}

export async function importFile(file: File): Promise<{ imported: number }> {
  if (!BASE_URL) throw new Error("Backend requis pour l'import — définissez VITE_API_BASE_URL");
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE_URL}/api/import`, {
    method: "POST",
    body: fd,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Import échoué: HTTP ${res.status}`);
  return (await res.json()) as { imported: number };
}

export async function exportFile(format: "gedcom" | "gefx" | "json"): Promise<void> {
  if (!BASE_URL) throw new Error("Backend requis pour l'export — définissez VITE_API_BASE_URL");
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/export?format=${format}`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Export échoué: HTTP ${res.status}`);
  const blob = await res.blob();
  const ext = format === "gedcom" ? "ged" : format;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `family-tree.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const isDemoMode = () => !BASE_URL;
