export type Project = {
  id: string;
  name: string;
  githubFullName: string;
  githubCloneUrl: string;
  defaultBranch: string;
  updatedAt?: string;
  activeDeploymentId?: string;
};

export type Repository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url?: string;
};

export type User = {
  id?: string;
  name: string;
  email: string;
};

export type DashboardView = 'overview' | 'logs' | 'environment' | 'settings';

export type ApiEnvelope<T> = {
  status?: string;
  data?: T;
  error?: string;
};

export function unwrapText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value || fallback;
  if (value && typeof value === 'object') {
    const candidate = value as { String?: unknown; Valid?: unknown };
    return typeof candidate.String === 'string' && candidate.Valid !== false
      ? candidate.String
      : fallback;
  }
  return fallback;
}

export function normalizeProject(value: Record<string, unknown>): Project {
  return {
    id: unwrapText(value.id, String(value.id ?? '')),
    name: unwrapText(value.name, 'Untitled project'),
    githubFullName: unwrapText(value.github_full_name),
    githubCloneUrl: unwrapText(value.github_clone_url),
    defaultBranch: unwrapText(value.default_branch, 'main'),
    updatedAt: unwrapText(value.updated_at),
    activeDeploymentId: unwrapText(value.active_deployment_id),
  };
}
