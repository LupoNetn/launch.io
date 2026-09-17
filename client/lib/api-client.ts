import { API_BASE_URL } from '@/lib/api';
import type { ApiEnvelope } from '@/lib/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

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
  const parsed = getBody(await response.json().catch(() => ({})));
  if (!response.ok) {
    throw new ApiError(response.status, parsed.error || `Request failed with ${response.status}`);
  }
  return parsed.data as T;
}

export function githubLoginUrl() {
  return `${API_BASE_URL}/auth/github/login`;
}
