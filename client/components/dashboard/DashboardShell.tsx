'use client';

import { useMemo, useState } from 'react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { MobileNav } from '@/components/dashboard/MobileNav';
import { ProjectView } from '@/components/dashboard/ProjectView';
import { ProjectsHome } from '@/components/dashboard/ProjectsHome';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useWorkspace } from '@/hooks/use-workspace';
import { githubLoginUrl } from '@/lib/api-client';
import type { DashboardView, Repository } from '@/lib/types';

export default function DashboardShell() {
  const { token, user, logout } = useAuthSession();
  const {
    projects,
    repositories,
    loading,
    loadingRepositories,
    error,
    setError,
    loadRepositories,
    createProject,
    deployProject,
  } = useWorkspace(token);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [view, setView] = useState<DashboardView>('overview');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployMessage, setDeployMessage] = useState('');
  const [deploymentId, setDeploymentId] = useState('');

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const visibleProjects = useMemo(
    () =>
      projects.filter((p) =>
        `${p.name} ${p.githubFullName}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() {
    setShowCreate(true);
    setError('');
    void loadRepositories();
  }

  async function handleCreate(repository: Repository, name?: string) {
    setCreating(true);
    setError('');
    try {
      const projectId = await createProject(repository, name);
      setSelectedProjectId(projectId);
      setView('overview');
      setShowCreate(false);

      // Instantly trigger initial deployment upon project creation (Vercel flow)
      try {
        setDeploying(true);
        const result = await deployProject(projectId);
        setDeployMessage(result.message || 'Deployment triggered successfully.');
        setDeploymentId(result.deployment_id);
      } catch (deployErr) {
        console.error('Initial deploy error:', deployErr);
      } finally {
        setDeploying(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create project');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeploy() {
    if (!selectedProject) return;
    setDeploying(true);
    setError('');
    setDeployMessage('');
    setDeploymentId('');
    try {
      const result = await deployProject(selectedProject.id);
      setDeployMessage(result.message || 'Deployment completed successfully.');
      setDeploymentId(result.deployment_id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  }

  function selectProject(id: string) {
    setSelectedProjectId(id);
    setView('overview');
    setDeployMessage('');
    setDeploymentId('');
    setError('');
  }

  // ── Not authenticated ────────────────────────────────────────────────────────

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#06060e] px-6 text-white">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            <span className="text-xl font-black text-black">↗</span>
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">
            Your deployment workspace.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/45">
            Connect GitHub repositories, ship builds, and keep every project within reach.
          </p>
          <a
            href={githubLoginUrl()}
            className="mt-8 inline-flex h-11 items-center gap-2.5 rounded-xl bg-white px-6 text-sm font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.12)] transition hover:bg-violet-100"
          >
            <GithubIcon className="h-4 w-4" />
            Continue with GitHub
          </a>
        </div>
      </main>
    );
  }

  // ── Authenticated ────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 right-0 h-[500px] w-[600px] rounded-full bg-violet-600/10 blur-[140px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[500px] rounded-full bg-emerald-500/6 blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Sidebar */}
        <DashboardSidebar
          project={selectedProject}
          projects={projects}
          view={view}
          onView={setView}
          onSelectProject={selectProject}
          onCreate={openCreate}
        />

        {/* Main area */}
        <section className="min-w-0 flex-1">
          <DashboardTopbar
            projectName={selectedProject?.name ?? ''}
            user={user}
            onLogout={logout}
            onGoProjects={() => setSelectedProjectId('')}
            onCreateProject={openCreate}
          />

          {/* Mobile nav */}
          {selectedProject && (
            <MobileNav view={view} onView={setView} hasProject={!!selectedProject} />
          )}

          <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
            {loading ? (
              <LoadingSkeleton />
            ) : error && !projects.length ? (
              <ErrorBanner message={error} />
            ) : selectedProject ? (
              <ProjectView
                project={selectedProject}
                view={view}
                deploying={deploying}
                deployMessage={deployMessage}
                deploymentId={deploymentId}
                error={error}
                onDeploy={handleDeploy}
                onBack={() => setSelectedProjectId('')}
              />
            ) : (
              <ProjectsHome
                projects={visibleProjects}
                search={search}
                loading={loading}
                onSearch={setSearch}
                onCreate={openCreate}
                onSelect={selectProject}
              />
            )}
          </div>
        </section>
      </div>

      {/* Create project modal */}
      {showCreate && (
        <CreateProjectModal
          repositories={repositories}
          loading={loadingRepositories}
          creating={creating}
          error={error}
          onClose={() => {
            setShowCreate(false);
            setError('');
          }}
          onSelect={handleCreate}
        />
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
      <div className="h-4 w-72 rounded-lg bg-white/[0.04]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
      <span className="font-semibold">Error: </span>
      {message}
    </div>
  );
}
