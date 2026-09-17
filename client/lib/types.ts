// ─── Domain types ────────────────────────────────────────────────────────────

export type DeploymentStatus =
  | 'queued'
  | 'building'
  | 'running'
  | 'failed'
  | 'stopped';

export type Deployment = {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  imageTag?: string;
  createdAt?: string;
  updatedAt?: string;
};

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
  clone_url?: string;
  ssh_url?: string;
};

export type User = {
  id: string;
  github_id?: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type DashboardView = 'overview' | 'logs' | 'environment' | 'settings';

// ─── API envelope ─────────────────────────────────────────────────────────────

export type ApiEnvelope<T> = {
  status?: string;
  data?: T;
  error?: string;
};

// ─── Normalisation helpers ────────────────────────────────────────────────────

/**
 * The DB layer stores nullable strings as { String: string; Valid: bool }.
 * This unwraps both the raw-string and the pgtype.Text forms.
 */
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
  const githubFullName = unwrapText(value.github_full_name || value.GithubFullName);
  const rawName = unwrapText(value.name || value.Name);

  // Fallback to GitHub full name so 'Untitled' is never displayed
  const displayName =
    githubFullName ||
    (rawName && rawName !== 'Untitled project' && rawName !== 'Untitled' ? rawName : 'Project');

  return {
    id: unwrapText(value.id || value.ID, String(value.id ?? '')),
    name: displayName,
    githubFullName: githubFullName || displayName,
    githubCloneUrl: unwrapText(value.github_clone_url || value.GithubCloneUrl),
    defaultBranch: unwrapText(value.default_branch || value.DefaultBranch, 'main'),
    updatedAt: unwrapText(value.updated_at || value.UpdatedAt),
    activeDeploymentId: unwrapText(value.active_deployment_id || value.ActiveDeploymentID),
  };
}

export function normalizeDeploymentStatus(raw: unknown): DeploymentStatus {
  const s = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (s === 'queued') return 'queued';
  if (s === 'building') return 'building';
  if (s === 'running') return 'running';
  if (s === 'failed') return 'failed';
  if (s === 'stopped') return 'stopped';
  return 'queued';
}

/** Generate the same subdomain slug the server's utils.GenerateSubdomain produces. */
export function generateSubdomain(githubFullName: string): string {
  return githubFullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
