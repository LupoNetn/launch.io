'use client';

import {
  Code2,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  RefreshCw,
  Rocket,
  Settings,
  SlidersHorizontal,
  TerminalSquare,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import type { DashboardView, Project } from '@/lib/types';
import { generateSubdomain } from '@/lib/types';
import { ProjectOverview } from '@/components/dashboard/ProjectOverview';
import type { DeploymentLog } from '@/hooks/use-deployment-logs';

interface ProjectViewProps {
  project: Project;
  view: DashboardView;
  deploying: boolean;
  deployMessage: string;
  deploymentId: string;
  deploymentLogs: { logs: DeploymentLog[]; loading: boolean; error: string };
  error: string;
  onDeploy: () => void;
  onBack: () => void;
}

export function ProjectView({
  project,
  view,
  deploying,
  deployMessage,
  deploymentId,
  deploymentLogs,
  error,
  onDeploy,
  onBack,
}: ProjectViewProps) {
  const subdomain = generateSubdomain(project.githubFullName);
  const liveUrl = `https://${subdomain}.launch.io`;
  const displayName = project.githubFullName || project.name;

  return (
    <div className="space-y-6">
      {/* Project header (Vercel style) */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start border-b border-white/[0.08] pb-6">
        <div>
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
          >
            ← All projects
          </button>

          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-600/20 text-lg font-bold text-violet-200 ring-1 ring-white/10">
              {displayName.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {displayName}
                </h1>
                <span
                  className={`flex h-2.5 w-2.5 rounded-full ${
                    deploymentId || project.activeDeploymentId
                      ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                      : 'bg-amber-400'
                  }`}
                  title={deploymentId || project.activeDeploymentId ? 'Deployment Active' : 'Building'}
                />
              </div>

              <div className="mt-1.5 flex items-center gap-3 text-xs text-white/45 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-white/60">
                  <GithubIcon className="h-3.5 w-3.5" />
                  {project.githubFullName}
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1 text-white/50">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                  {subdomain}.launch.io
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls: Visit + Redeploy (Vercel Style) */}
        <div className="flex items-center gap-2.5 self-start pt-2">
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black hover:bg-violet-100 transition shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Visit
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={onDeploy}
            disabled={deploying}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-white hover:border-violet-500/40 hover:bg-white/[0.08] transition disabled:opacity-50"
          >
            {deploying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                Redeploying...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-violet-300" />
                Redeploy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-200">
          <span className="font-semibold">Error: </span>
          {error}
        </div>
      )}

      {/* Deploying in-progress banner */}
      {deploying && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
          Building and deploying new release from branch <span className="font-mono text-white">{project.defaultBranch}</span>...
        </div>
      )}

      {/* View content */}
      <div className="pt-2">
        {view === 'overview' && (
          <ProjectOverview
            project={project}
            deploymentId={deploymentId}
            deployMessage={deployMessage}
          />
        )}
        {view === 'logs' && (
          <LogsPanel deploymentId={deploymentId} logs={deploymentLogs.logs} loading={deploymentLogs.loading} />
        )}
        {view === 'environment' && (
          <PlaceholderPanel
            icon={KeyRound}
            title="Environment Variables"
            description="Encrypted secret environment variables injected during automated build and runtime."
          />
        )}
        {view === 'settings' && <SettingsPanel project={project} />}
      </div>
    </div>
  );
}

function LogsPanel({ deploymentId, logs, loading }: { deploymentId: string; logs: DeploymentLog[]; loading: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080910]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-white">Deployment Logs</h2>
          <p className="mt-1 text-xs text-white/40">
            {deploymentId ? `Deployment ${deploymentId.slice(0, 8)} · polling every second` : 'Deploy a project to watch build output.'}
          </p>
        </div>
        <span className={`flex items-center gap-2 text-xs ${loading ? 'text-amber-300' : 'text-emerald-300'}`}>
          <span className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-amber-300' : 'bg-emerald-300'}`} />
          {loading ? 'Building' : 'Ready'}
        </span>
      </div>
      <pre className="max-h-[520px] min-h-[300px] overflow-auto p-5 font-mono text-xs leading-6 text-white/70">
        {logs.length ? logs.map((log) => <div key={log.id}><span className="mr-3 select-none text-white/25">{String(log.id).padStart(4, '0')}</span>{log.line}</div>) : <span className="text-white/30">{loading ? 'Waiting for build output...' : 'No logs yet.'}</span>}
      </pre>
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({ project }: { project: Project }) {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">Project Settings</h2>
        <p className="mt-0.5 text-xs text-white/40">Configuration defaults and deployment parameters.</p>
      </div>
      <div className="space-y-3 pt-2">
        <SettingsRow
          label="Repository"
          value={project.githubFullName}
          icon={<GithubIcon className="h-4 w-4" />}
        />
        <SettingsRow
          label="Production Branch"
          value={project.defaultBranch}
          icon={<Code2 className="h-4 w-4" />}
        />
        <SettingsRow
          label="Build Engine"
          value="Automated Containerization"
          icon={<SlidersHorizontal className="h-4 w-4" />}
        />
        {project.activeDeploymentId && (
          <SettingsRow
            label="Active Deployment ID"
            value={project.activeDeploymentId}
            icon={<Rocket className="h-4 w-4" />}
            mono
          />
        )}
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0c0d14] p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-white/50">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] tracking-wider text-white/35 uppercase">{label}</div>
        <div className={`mt-0.5 truncate text-xs text-white/80 ${mono ? 'font-mono' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder panel ────────────────────────────────────────────────────────

function PlaceholderPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof TerminalSquare;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-[300px] rounded-2xl border border-dashed border-white/10 bg-[#0c0d14] px-6 py-16 text-center">
      <Icon className="mx-auto h-6 w-6 text-white/30" />
      <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs text-white/40 leading-relaxed">{description}</p>
    </div>
  );
}
