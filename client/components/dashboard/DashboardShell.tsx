"use client";

import {
  Activity,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  ExternalLink,
  Globe2,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Server,
  Settings,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  X,
} from "lucide-react";
import { GithubIcon as Github } from "@/components/icons/GithubIcon";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Project = {
  id: string;
  name: string | { String?: string };
  github_full_name: string;
  github_clone_url: string;
  default_branch: string;
  updated_at?: string;
};

type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
};

type User = {
  name: string;
  email: string;
};

type View = "overview" | "logs" | "environment" | "settings";

const API_URL = API_BASE_URL;

const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "logs", label: "Logs", icon: TerminalSquare },
  { id: "environment", label: "Environment variables", icon: KeyRound },
  { id: "settings", label: "Settings", icon: Settings },
];

function valueOf(value: Project["name"] | undefined, fallback: string) {
  if (typeof value === "string") return value || fallback;
  return value?.String || fallback;
}

function repoLabel(project: Project) {
  return project.github_full_name || valueOf(project.name, "Untitled project");
}

function browserToken() {
  if (typeof window === "undefined") return "";
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return hash.get("access_token") || window.localStorage.getItem("launchio_access_token") || "";
}

export default function DashboardShell() {
  const [token] = useState(browserToken);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(() => typeof window !== "undefined" && Boolean(window.localStorage.getItem("launchio_access_token")));
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const visibleProjects = useMemo(
    () => projects.filter((project) => repoLabel(project).toLowerCase().includes(search.toLowerCase())),
    [projects, search],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken) return;

    window.localStorage.setItem("launchio_access_token", accessToken);
    if (refreshToken) window.localStorage.setItem("launchio_refresh_token", refreshToken);
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  }, []);

  async function api(path: string, init: RequestInit = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed with ${response.status}`);
    return body;
  }

  async function loadWorkspace(currentToken: string) {
    setLoading(true);
    setError("");
    try {
      const [me, projectResponse] = await Promise.all([
        apiWithToken("/auth/me", currentToken),
        apiWithToken("/projects/", currentToken),
      ]);
      setUser(me);
      const nextProjects = projectResponse.data ?? [];
      setProjects(nextProjects);
      setSelectedProjectId((current) => current || nextProjects[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load workspace");
    } finally {
      setLoading(false);
    }
  }

  async function apiWithToken(path: string, currentToken: string) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed with ${response.status}`);
    return body;
  }

  useEffect(() => {
    if (token) queueMicrotask(() => void loadWorkspace(token));
    // The workspace is loaded only after the browser provides the saved token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function openCreate() {
    setShowCreate(true);
    setError("");
    if (repos.length || !token) return;
    setLoadingRepos(true);
    try {
      const response = await api("/projects/list-repo");
      setRepos(response.data ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load repositories");
    } finally {
      setLoadingRepos(false);
    }
  }

  async function createProject(repo: Repo) {
    setCreating(true);
    setError("");
    try {
      const response = await api("/projects/", {
        method: "POST",
        body: JSON.stringify({ github_full_name: repo.full_name, name: repo.name }),
      });
      const created: Project = {
        id: response.data.project_id,
        name: repo.name,
        github_full_name: repo.full_name,
        github_clone_url: `https://github.com/${repo.full_name}.git`,
        default_branch: repo.default_branch,
      };
      setProjects((current) => [created, ...current]);
      setSelectedProjectId(created.id);
      setShowCreate(false);
      setView("overview");
      setMessage("Project connected");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create project");
    } finally {
      setCreating(false);
    }
  }

  async function deploy() {
    if (!selectedProject) return;
    setDeploying(true);
    setError("");
    setMessage("");
    try {
      await api(`/projects/${selectedProject.id}/deploy`, { method: "POST" });
      setMessage("Deployment completed and the runtime is being updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Deployment failed");
    } finally {
      setDeploying(false);
    }
  }

  if (!token) {
    return <AuthGate />;
  }

  return (
    <main className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_-10%,rgba(114,94,255,0.17),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(28,188,151,0.08),transparent_26%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.07] bg-[#0b0c10]/90 p-4 lg:flex lg:flex-col">
          <Brand />
          <div className="mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Workspace</div>
          <button className="mt-3 flex w-full items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-3 text-left hover:bg-white/[0.08]" onClick={() => setShowProjectMenu((current) => !current)}>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 text-xs font-bold">{selectedProject ? valueOf(selectedProject.name, "P").slice(0, 1).toUpperCase() : "·"}</div>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{selectedProject ? valueOf(selectedProject.name, "Project") : "Select a project"}</span>
            <ChevronDown className="h-4 w-4 text-white/40" />
          </button>
          {showProjectMenu && (
            <div className="mt-2 rounded-xl border border-white/10 bg-[#171820] p-2 shadow-2xl">
              {projects.map((project) => (
                <button key={project.id} onClick={() => { setSelectedProjectId(project.id); setShowProjectMenu(false); setView("overview"); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="truncate">{valueOf(project.name, "Project")}</span>
                </button>
              ))}
              <button onClick={openCreate} className="mt-1 flex w-full items-center gap-2 border-t border-white/10 px-2 pt-3 text-left text-xs font-semibold text-violet-300"><Plus className="h-3.5 w-3.5" /> New project</button>
            </div>
          )}
          {selectedProject && (
            <nav className="mt-8 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} onClick={() => setView(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${view === item.id ? "bg-white/[0.1] font-semibold text-white" : "text-white/45 hover:bg-white/[0.05] hover:text-white"}`}><Icon className="h-4 w-4" />{item.label}</button>;
              })}
            </nav>
          )}
          <div className="mt-auto rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5 text-amber-300" /> Launch workspace</div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/35">Build, ship, and observe every project from one quiet place.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden"><Brand compact /></div>
            <div className="hidden items-center gap-2 text-sm text-white/35 sm:flex"><span>Workspace</span><span>/</span><span className="text-white/80">{selectedProject ? valueOf(selectedProject.name, "Project") : "Projects"}</span></div>
            <div className="ml-auto flex items-center gap-3"><button title="Help" className="grid h-9 w-9 place-items-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white"><CircleHelp className="h-4 w-4" /></button><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-rose-500 text-xs font-bold text-[#1a0e0b]">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</div></div>
          </header>

          <div className="border-b border-white/[0.07] px-5 py-3 lg:hidden"><div className="flex gap-2 overflow-x-auto">{navigation.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setView(item.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${view === item.id ? "bg-white/10 text-white" : "text-white/45"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>; })}</div></div>

          <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
            {!selectedProject ? <ProjectsHome projects={visibleProjects} search={search} setSearch={setSearch} onCreate={openCreate} onSelect={(id) => { setSelectedProjectId(id); setView("overview"); }} loading={loading} /> : <ProjectView project={selectedProject} view={view} deploying={deploying} message={message} error={error} onDeploy={deploy} onBack={() => setSelectedProjectId("")} />}
          </div>
        </section>
      </div>
      {showCreate && <CreateProjectModal repos={repos} loading={loadingRepos} creating={creating} onClose={() => setShowCreate(false)} onSelect={createProject} />}
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-[9px] bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.15)]"><Rocket className="h-4 w-4 fill-black" /></div>{!compact && <span className="text-[15px] font-bold tracking-[-0.03em]">launch.io</span>}</div>;
}

function AuthGate() {
  return <main className="grid min-h-screen place-items-center bg-[#0a0b0f] px-6 text-white"><div className="w-full max-w-md text-center"><Brand /><h1 className="mt-12 text-3xl font-semibold tracking-tight">Your deployment workspace.</h1><p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/45">Connect GitHub repositories, ship builds, and keep every project within reach.</p><a href={`${API_URL}/auth/github/login`} className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-black transition hover:bg-violet-100"><Github className="h-4 w-4" /> Continue with GitHub</a></div></main>;
}

function ProjectsHome({ projects, search, setSearch, onCreate, onSelect, loading }: { projects: Project[]; search: string; setSearch: (value: string) => void; onCreate: () => void; onSelect: (id: string) => void; loading: boolean }) {
  return <div><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300"><Activity className="h-3.5 w-3.5" /> Control plane</div><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Good to see you.</h1><p className="mt-2 text-sm text-white/40">Select a project to enter its workspace, or start something new.</p></div><button onClick={onCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-black transition hover:bg-violet-100"><Plus className="h-4 w-4" /> New project</button></div><div className="mt-10 grid gap-4 sm:grid-cols-3"><Stat label="Projects" value={String(projects.length)} icon={Box} /><Stat label="Deployments" value="—" icon={Rocket} /><Stat label="Runtime" value="Local" icon={Server} /></div><div className="mt-12 flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Projects</h2><p className="mt-1 text-xs text-white/35">Your connected repositories and environments.</p></div><div className="relative w-full max-w-[220px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter projects" className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-violet-300/50" /></div></div><div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025]">{loading ? <LoadingState label="Loading your workspace" /> : projects.length ? projects.map((project) => <ProjectRow key={project.id} project={project} onClick={() => onSelect(project.id)} />) : <EmptyProjects onCreate={onCreate} />}</div></div>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Box }) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-center justify-between text-xs text-white/35"><span>{label}</span><Icon className="h-4 w-4 text-white/30" /></div><div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div></div>; }

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) { return <button onClick={onClick} className="group flex w-full items-center gap-4 border-b border-white/[0.06] px-4 py-4 text-left transition last:border-0 hover:bg-white/[0.05]"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500/30 to-indigo-500/10 text-sm font-bold text-violet-200">{valueOf(project.name, "P").slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{valueOf(project.name, "Untitled project")}</span><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Connected</span></div><div className="mt-1 flex items-center gap-2 text-xs text-white/35"><Github className="h-3 w-3" />{repoLabel(project)}<span>·</span><span>{project.default_branch || "main"}</span></div></div><ArrowUpRight className="h-4 w-4 text-white/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" /></button>; }

function EmptyProjects({ onCreate }: { onCreate: () => void }) { return <div className="px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"><Box className="h-5 w-5 text-white/40" /></div><h3 className="mt-4 text-sm font-semibold">No projects yet</h3><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-white/35">Connect your first GitHub repository and it will appear here.</p><button onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Create project</button></div>; }

function ProjectView({ project, view, deploying, message, error, onDeploy, onBack }: { project: Project; view: View; deploying: boolean; message: string; error: string; onDeploy: () => void; onBack: () => void }) { const name = valueOf(project.name, "Project"); return <div><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><button onClick={onBack} className="mb-5 text-xs text-white/35 hover:text-white">← All projects</button><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-lg font-bold">{name.slice(0, 1).toUpperCase()}</div><div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-[-0.04em]">{name}</h1><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /></div><p className="mt-1 flex items-center gap-2 text-xs text-white/40"><Github className="h-3 w-3" />{repoLabel(project)}</p></div></div></div>{view === "overview" && <button onClick={onDeploy} disabled={deploying} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-black transition hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60">{deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{deploying ? "Deploying..." : "Deploy"}</button>}</div>{message && <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"><Check className="h-4 w-4" />{message}</div>}{error && <div className="mt-6 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</div>}<div className="mt-10">{view === "overview" && <Overview project={project} />}{view === "logs" && <UnavailablePanel icon={TerminalSquare} title="Deployment logs" copy="Log history will appear here once the deployment logs API is connected." />}{view === "environment" && <UnavailablePanel icon={KeyRound} title="Environment variables" copy="Project secrets and runtime variables are ready for this surface. The API contract is the next backend slice." action="Add variable" />}{view === "settings" && <SettingsPanel project={project} />}</div></div>; }

function Overview({ project }: { project: Project }) { const slug = project.github_full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); return <div><div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35">Live deployment</div><h2 className="mt-2 text-xl font-semibold">Your project is connected</h2></div><div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400/10"><Globe2 className="h-5 w-5 text-emerald-300" /></div></div><div className="mt-8 flex items-center gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3"><div className="h-2 w-2 rounded-full bg-emerald-400" /><span className="min-w-0 flex-1 truncate font-mono text-xs text-white/70">{slug || "project"}.launch.io</span><button title="Open deployment URL" className="text-white/35 hover:text-white"><ExternalLink className="h-4 w-4" /></button></div><div className="mt-5 flex items-center gap-2 text-xs text-white/35"><Code2 className="h-3.5 w-3.5" /> Branch <span className="font-mono text-white/60">{project.default_branch || "main"}</span></div></div><div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6"><div className="flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35">Runtime</div><MoreHorizontal className="h-4 w-4 text-white/25" /></div><div className="mt-6 flex items-end gap-2"><span className="text-3xl font-semibold">Ready</span><span className="mb-1 h-2 w-2 rounded-full bg-emerald-400" /></div><div className="mt-3 text-xs text-white/35">Docker container · Railpack build</div><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-400 to-indigo-400" /></div><div className="mt-2 flex justify-between text-[10px] text-white/30"><span>Resource usage</span><span>72%</span></div></div></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><MiniMetric icon={Activity} label="Status" value="Operational" /><MiniMetric icon={Server} label="Runtime" value="Container" /><MiniMetric icon={LockKeyhole} label="Access" value="Private" /></div></div>; }

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06]"><Icon className="h-4 w-4 text-white/55" /></div><div><div className="text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div></div>; }

function UnavailablePanel({ icon: Icon, title, copy, action }: { icon: typeof TerminalSquare; title: string; copy: string; action?: string }) { return <div className="min-h-[360px] rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-20 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"><Icon className="h-5 w-5 text-white/45" /></div><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">{copy}</p>{action && <button disabled className="mt-6 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/40">{action}</button>}</div>; }

function SettingsPanel({ project }: { project: Project }) { return <div className="max-w-2xl"><div className="mb-6"><h2 className="text-lg font-semibold">Project settings</h2><p className="mt-1 text-sm text-white/35">Manage the source and deployment defaults for this project.</p></div><div className="space-y-4"><SettingRow label="Project name" value={valueOf(project.name, "Untitled project")} /><SettingRow label="Repository" value={project.github_full_name} icon={<Github className="h-4 w-4" />} /><SettingRow label="Production branch" value={project.default_branch || "main"} icon={<Code2 className="h-4 w-4" />} /><SettingRow label="Build engine" value="Railpack + BuildKit" icon={<SlidersHorizontal className="h-4 w-4" />} /></div></div>; }

function SettingRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) { return <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] text-white/45">{icon ?? <Settings className="h-4 w-4" />}</div><div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</div><div className="mt-1 truncate text-sm text-white/75">{value}</div></div></div>; }

function CreateProjectModal({ repos, loading, creating, onClose, onSelect }: { repos: Repo[]; loading: boolean; creating: boolean; onClose: () => void; onSelect: (repo: Repo) => void }) { const [query, setQuery] = useState(""); const filtered = repos.filter((repo) => repo.full_name.toLowerCase().includes(query.toLowerCase())); return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#15161d] shadow-2xl"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-semibold">Connect a repository</h2><p className="mt-1 text-xs text-white/35">Choose a GitHub repository to create a project.</p></div><button onClick={onClose} title="Close" className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button></div><div className="p-5"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories" className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-3 text-sm outline-none placeholder:text-white/25 focus:border-violet-300/50" /></div><div className="mt-4 max-h-72 overflow-y-auto">{loading ? <LoadingState label="Loading GitHub repositories" /> : filtered.length ? filtered.map((repo) => <button disabled={creating} key={repo.id} onClick={() => onSelect(repo)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/[0.06] disabled:opacity-50"><div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.07]"><Github className="h-4 w-4 text-white/65" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{repo.full_name}</div><div className="mt-1 text-[11px] text-white/30">{repo.private ? "Private" : "Public"} · {repo.default_branch || "main"}</div></div>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4 text-white/20" />}</button>) : <div className="py-10 text-center text-xs text-white/35">No repositories found.</div>}</div></div></div></div>; }

function LoadingState({ label }: { label: string }) { return <div className="flex items-center justify-center gap-2 px-6 py-12 text-xs text-white/35"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>; }
