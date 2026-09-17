import { API_BASE_URL } from '@/lib/api';
import type { ApiEnvelope, User, Project, Repository, Deployment } from '@/lib/types';
import { normalizeProject } from '@/lib/types';

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

function getBody(value: unknown): ApiEnvelope<unknown> {
  return value && typeof value === 'object' ? (value as ApiEnvelope<unknown>) : {};
}

export async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const errorMsg =
      (typeof rawJson.error === 'string' && rawJson.error) ||
      `Request failed with ${response.status}`;
    throw new ApiError(response.status, errorMsg);
  }

  if (rawJson && typeof rawJson === 'object' && 'data' in rawJson && rawJson.data !== undefined) {
    return rawJson.data as T;
  }

  return rawJson as unknown as T;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** POST /auth/refresh — exchange a refresh token for a fresh access token. */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  // The refresh endpoint returns the token pair directly (not nested in data).
  const raw = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      (raw.error as string) || 'Token refresh failed',
    );
  }
  return raw as { access_token: string; refresh_token: string };
}

/** GET /auth/me — fetch the authenticated user profile. */
export async function getMe(token: string): Promise<User> {
  return apiRequest<User>('/auth/me', token);
}

// ─── Project helpers ──────────────────────────────────────────────────────────

/** GET /projects/ — list all projects for the authenticated user. */
export async function listProjects(token: string): Promise<Project[]> {
  const data = await apiRequest<unknown>('/projects/', token);
  const arr = Array.isArray(data) ? data : [];
  return arr
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(normalizeProject);
}

/** GET /projects/list-repo — list GitHub repositories accessible by the user. */
export async function listRepos(token: string): Promise<Repository[]> {
  const data = await apiRequest<Repository[]>('/projects/list-repo', token);
  return Array.isArray(data) ? data : [];
}

/** POST /projects/ — create a project from a repository. */
export async function createProject(
  token: string,
  githubFullName: string,
  name?: string,
): Promise<string> {
  const body: Record<string, string> = { github_full_name: githubFullName };
  if (name && name.trim()) body.name = name.trim();
  const data = await apiRequest<{ project_id: string }>('/projects/', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.project_id;
}

/** POST /projects/:id/deploy — trigger a deployment for the given project. */
export async function deployProject(
  token: string,
  projectId: string,
): Promise<{ deployment_id: string; message: string }> {
  return apiRequest<{ deployment_id: string; message: string }>(
    `/projects/${projectId}/deploy`,
    token,
    { method: 'POST' },
  );
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function githubLoginUrl(): string {
  return `${API_BASE_URL}/auth/github/login`;
}
