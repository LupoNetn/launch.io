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
import type { DashboardView } from '@/lib/types';

export default function DashboardShell() {
  const { token } = useAuthSession();
  const { user, projects, repositories, loading, loadingRepositories, error, setError, loadRepositories, createProject, deployProject } = useWorkspace(token);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [view, setView] = useState<DashboardView>('overview');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState('');

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const visibleProjects = useMemo(() => projects.filter((project) => `${project.name} ${project.githubFullName}`.toLowerCase().includes(search.toLowerCase())), [projects, search]);

  function openCreate() {
    setShowCreate(true);
    setError('');
    void loadRepositories();
  }

  async function handleCreate(repository: Parameters<typeof createProject>[0]) {
    setCreating(true);
    setError('');
    try {
      const projectId = await createProject(repository);
      setSelectedProjectId(projectId);
      setView('overview');
      setShowCreate(false);
      setMessage('Project connected');
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
    setMessage('');
    try {
      const result = await deployProject(selectedProject.id);
      setMessage(result?.message || 'Deployment completed successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  }

  if (!token) {
    return <main className="grid min-h-screen place-items-center bg-[#0a0b0f] px-6 text-white"><div className="w-full max-w-md text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-black">↗</div><h1 className="mt-8 text-3xl font-semibold tracking-tight">Your deployment workspace.</h1><p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/45">Connect GitHub repositories, ship builds, and keep every project within reach.</p><a href={githubLoginUrl()} className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-black transition hover:bg-violet-100"><GithubIcon className="h-4 w-4" /> Continue with GitHub</a></div></main>;
  }

  return <main className="min-h-screen bg-[#0a0b0f] text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_-10%,rgba(114,94,255,0.17),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(28,188,151,0.08),transparent_26%)]" /><div className="relative flex min-h-screen"><DashboardSidebar project={selectedProject} projects={projects} view={view} onView={setView} onSelectProject={(id) => { setSelectedProjectId(id); setView('overview'); }} onCreate={openCreate} /><section className="min-w-0 flex-1"><DashboardTopbar projectName={selectedProject?.name ?? ''} user={user} /><MobileNav view={view} onView={setView} /><div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">{loading ? <div className="grid min-h-[420px] place-items-center text-sm text-white/40">Loading workspace...</div> : error && !projects.length ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">{error}</div> : selectedProject ? <ProjectView project={selectedProject} view={view} deploying={deploying} message={message} error={error} onDeploy={handleDeploy} onBack={() => setSelectedProjectId('')} /> : <ProjectsHome projects={visibleProjects} search={search} loading={loading} onSearch={setSearch} onCreate={openCreate} onSelect={(id) => { setSelectedProjectId(id); setView('overview'); }} />}</div></section></div>{showCreate && <CreateProjectModal repositories={repositories} loading={loadingRepositories} creating={creating} onClose={() => setShowCreate(false)} onSelect={handleCreate} />}</main>;
}
