'use client';

import {
  Activity,
  ArrowUpRight,
  Box,
  Clock,
  ExternalLink,
  GitBranch,
  Globe,
  Plus,
  Search,
  Zap,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import type { Project } from '@/lib/types';
import { generateSubdomain } from '@/lib/types';
import type { ComponentType } from 'react';

interface ProjectsHomeProps {
  projects: Project[];
  search: string;
  loading: boolean;
  onSearch: (value: string) => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
}

export function ProjectsHome({
  projects,
  search,
  loading,
  onSearch,
  onCreate,
  onSelect,
}: ProjectsHomeProps) {
  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 tracking-wider uppercase">
            <Zap className="h-3.5 w-3.5" />
            Dashboard Overview
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Projects
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-3 pl-9 text-xs text-white outline-none placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.07] transition"
            />
          </div>

          {/* Add New Project CTA */}
          <button
            onClick={onCreate}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-violet-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New...
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Box}
          label="Total Projects"
          value={loading ? '—' : String(projects.length)}
          subtext="Active workloads"
        />
        <MetricCard
          icon={Activity}
          label="System Status"
          value="Healthy"
          subtext="All systems operational"
        />
        <MetricCard
          icon={GithubIcon}
          label="Source Provider"
          value="GitHub"
          subtext="OAuth connected"
        />
      </div>

      {/* Projects Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            All Workspaces ({projects.length})
          </h2>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : projects.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          <VercelEmptyState onCreateClick={onCreate} />
        )}
      </div>
    </div>
  );
}

// ─── Project Card Component (Vercel / Neon Style) ─────────────────────────────

function ProjectCard({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: (id: string) => void;
}) {
  const subdomain = generateSubdomain(project.githubFullName);
  const liveUrl = `https://${subdomain}.launch.io`;
  const timeAgo = project.updatedAt ? formatTimeAgo(project.updatedAt) : null;
  const displayName = project.githubFullName || project.name;

  return (
    <div
      onClick={() => onSelect(project.id)}
      className="group cursor-pointer flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0d14] p-5 shadow-lg transition duration-200 hover:border-violet-500/40 hover:bg-[#11121d] hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]"
    >
      <div>
        {/* Header: Name + Domain */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/10 text-sm font-bold text-violet-200 ring-1 ring-white/10">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200 transition">
                {displayName}
              </h3>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-white/40 hover:text-violet-300 transition truncate max-w-[180px]"
              >
                <Globe className="h-3 w-3 shrink-0 text-emerald-400" />
                <span className="truncate">{subdomain}.launch.io</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            </div>
          </div>

          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
        </div>

        {/* GitHub Repository Info */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-xs text-white/60">
          <GithubIcon className="h-3.5 w-3.5 shrink-0 text-white/40" />
          <span className="truncate font-mono">{project.githubFullName}</span>
        </div>
      </div>

      {/* Card Footer: Status & Metadata */}
      <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-semibold text-emerald-400">Ready</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-white/50">
            <GitBranch className="h-3 w-3" />
            {project.defaultBranch || 'main'}
          </div>
          {timeAgo && (
            <div className="flex items-center gap-1 text-white/30">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14] p-5">
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-white/30" />
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-[11px] text-white/35">{subtext}</div>
    </div>
  );
}

// ─── Skeleton Grid Loader ──────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-44 rounded-2xl border border-white/[0.06] bg-[#0c0d14] p-5 animate-pulse space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-28 rounded bg-white/10" />
              <div className="h-3 w-40 rounded bg-white/5" />
            </div>
          </div>
          <div className="h-8 rounded-lg bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Vercel Empty State ────────────────────────────────────────────────────────

function VercelEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-[#0c0d14] p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <GithubIcon className="h-7 w-7 text-white/80" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white">No projects deployed yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs text-white/40 leading-relaxed">
        Connect a GitHub repository to deploy your first web app with automated builds and preview URLs.
      </p>
      <button
        onClick={onCreateClick}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-violet-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
      >
        <Plus className="h-4 w-4" />
        Import GitHub Repository
      </button>
    </div>
  );
}

// ─── Helper: Relative time ─────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}
