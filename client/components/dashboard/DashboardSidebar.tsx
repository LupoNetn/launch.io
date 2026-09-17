'use client';

import {
  ChevronDown,
  FolderGit2,
  KeyRound,
  LayoutDashboard,
  Plus,
  Settings,
  TerminalSquare,
  Zap,
} from 'lucide-react';
import type { DashboardView, Project } from '@/lib/types';

const NAV_ITEMS: { id: DashboardView; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'logs', label: 'Logs', Icon: TerminalSquare },
  { id: 'environment', label: 'Environment Variables', Icon: KeyRound },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

interface DashboardSidebarProps {
  project: Project | null;
  projects: Project[];
  view: DashboardView;
  onView: (view: DashboardView) => void;
  onSelectProject: (id: string) => void;
  onCreate: () => void;
}

export function DashboardSidebar({
  project,
  projects,
  view,
  onView,
  onSelectProject,
  onCreate,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.07] bg-[#090a0e] p-5 lg:flex lg:flex-col">
      {/* Brand / Logo */}
      <button
        onClick={() => onSelectProject('')}
        className="flex items-center gap-3 px-1 text-left transition hover:opacity-90"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          <Zap className="h-4 w-4 fill-black text-black" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">launch.io</span>
          <span className="block text-[10px] text-violet-400 font-medium tracking-widest uppercase">
            Platform
          </span>
        </div>
      </button>

      {/* Workspace & Navigation */}
      <div className="mt-8 space-y-4">
        <div>
          <div className="px-1 text-[10px] font-bold tracking-widest text-white/30 uppercase">
            Navigation
          </div>
          <button
            onClick={() => onSelectProject('')}
            className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
              !project
                ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30'
                : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <FolderGit2 className="h-4 w-4" />
            All Projects
          </button>
        </div>

        {/* Project Picker */}
        <div>
          <div className="px-1 text-[10px] font-bold tracking-widest text-white/30 uppercase">
            Project Scope
          </div>
          <div className="relative mt-2">
            <select
              value={project?.id ?? ''}
              onChange={(e) => onSelectProject(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-3 pr-9 text-xs font-semibold text-white outline-none transition focus:border-violet-500/50 focus:bg-white/[0.07]"
            >
              <option value="" className="bg-[#10111a] font-normal text-white/60">
                Switch project...
              </option>
              {projects.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#10111a]">
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          </div>
        </div>
      </div>

      {/* Nav items — shown when a project is active */}
      {project && (
        <nav className="mt-8 space-y-1">
          <div className="mb-2 px-1 text-[10px] font-bold tracking-widest text-white/30 uppercase">
            Project Workspace
          </div>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => onView(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  active
                    ? 'bg-violet-500/20 text-violet-200 font-semibold border border-violet-500/30'
                    : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-violet-300' : ''}`} />
                {label}
              </button>
            );
          })}
        </nav>
      )}

      {/* New Project CTA at bottom */}
      <div className="mt-auto pt-6">
        <button
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold text-white transition hover:border-violet-400/40 hover:bg-violet-500/10"
        >
          <Plus className="h-3.5 w-3.5 text-violet-400" />
          Import New Project
        </button>
      </div>
    </aside>
  );
}
