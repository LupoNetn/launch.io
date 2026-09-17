'use client';

import { Activity, Code2, ExternalLink, Globe2, LockKeyhole, RefreshCw, Server } from 'lucide-react';
import type { Project } from '@/lib/types';
import { generateSubdomain } from '@/lib/types';

interface ProjectOverviewProps {
  project: Project;
  deploymentId?: string;
  deployMessage?: string;
}

export function ProjectOverview({ project, deploymentId, deployMessage }: ProjectOverviewProps) {
  const slug = generateSubdomain(project.githubFullName);
  const projectUrl = `http://${slug || 'project'}.launch.io:8000`;

  // Derive display status from the project state:
  // - If a deploymentId was just returned from a deploy call, it's running.
  // - If the project has an activeDeploymentId, it was previously deployed.
  // - Otherwise it's "Ready to deploy".
  const hasDeployment = Boolean(deploymentId || project.activeDeploymentId);
  const statusLabel = hasDeployment ? 'Running' : 'Not deployed';
  const statusColor = hasDeployment ? 'bg-emerald-400' : 'bg-amber-400';
  const statusTextColor = hasDeployment ? 'text-emerald-300' : 'text-amber-300';
  const currentDeploymentId = deploymentId || project.activeDeploymentId || null;

  return (
    <div>
      {/* Top grid: endpoint card + runtime card */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Endpoint card */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold tracking-[0.15em] text-white/35 uppercase">
                Project endpoint
              </div>
              <h2 className="mt-2 text-xl font-semibold">
                {hasDeployment ? 'Your project is live' : 'Ready to deploy'}
              </h2>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400/10">
              <Globe2 className="h-5 w-5 text-emerald-300" />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
            <div className={`h-2 w-2 flex-shrink-0 rounded-full ${statusColor}`} />
            {hasDeployment ? (
              <a
                href={projectUrl}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate font-mono text-xs text-white/70 hover:text-white"
              >
                {slug || 'project'}.launch.io:8000
              </a>
            ) : (
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/35">
                {slug || 'project'}.launch.io:8000
              </span>
            )}
            {hasDeployment && (
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-white/35" />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/35">
            <span className="flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5" />
              Branch
              <span className="font-mono text-white/60">{project.defaultBranch}</span>
            </span>
            {currentDeploymentId && (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Deployment
                <span className="font-mono text-white/60">
                  {currentDeploymentId.slice(0, 8)}…
                </span>
              </span>
            )}
          </div>

          {deployMessage && (
            <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              {deployMessage}
            </div>
          )}
        </div>

        {/* Runtime card */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <div className="text-xs font-semibold tracking-[0.15em] text-white/35 uppercase">
            Runtime
          </div>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-3xl font-semibold">{statusLabel}</span>
            <span className={`mb-1.5 h-2 w-2 rounded-full ${statusColor}`} />
          </div>
          <div className="mt-3 text-xs text-white/35">
            Docker container · Railpack build
          </div>
          <div className={`mt-4 text-xs font-medium ${statusTextColor}`}>
            {hasDeployment ? 'Container is running' : 'Click Deploy to start'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Activity} label="Status" value={statusLabel} />
        <StatCard icon={Server} label="Runtime" value="Container" />
        <StatCard icon={LockKeyhole} label="Access" value="Private" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06]">
        <Icon className="h-4 w-4 text-white/55" />
      </div>
      <div>
        <div className="text-[10px] tracking-[0.14em] text-white/30 uppercase">{label}</div>
        <div className="mt-1 text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
