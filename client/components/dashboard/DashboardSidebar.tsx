"use client";

import { ChevronDown, KeyRound, LayoutDashboard, Plus, Settings, TerminalSquare } from 'lucide-react';
import type { DashboardView, Project } from '@/lib/types';

const items: { id: DashboardView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'logs', label: 'Logs', icon: TerminalSquare },
  { id: 'environment', label: 'Environment variables', icon: KeyRound },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar({ project, projects, view, onView, onSelectProject, onCreate }: { project: Project | null; projects: Project[]; view: DashboardView; onView: (view: DashboardView) => void; onSelectProject: (id: string) => void; onCreate: () => void }) {
  return <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.07] bg-[#0b0c10]/90 p-4 lg:flex lg:flex-col">
    <div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-[9px] bg-white font-bold text-black">↗</div><span className="text-[15px] font-bold tracking-[-0.03em]">launch.io</span></div>
    <div className="mt-8 text-[10px] font-bold tracking-[0.18em] text-white/35 uppercase">Workspace</div>
    <div className="relative mt-3"><select value={project?.id ?? ''} onChange={(event) => onSelectProject(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 pr-9 text-left text-sm font-semibold text-white outline-none"><option value="" className="bg-[#171820]">All projects</option>{projects.map((item) => <option key={item.id} value={item.id} className="bg-[#171820]">{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-white/40" /></div>
    {project && <nav className="mt-8 space-y-1">{items.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => onView(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${view === item.id ? 'bg-white/[0.1] font-semibold text-white' : 'text-white/45 hover:bg-white/[0.05] hover:text-white'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</nav>}
    <button onClick={onCreate} className="mt-auto flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs font-semibold text-violet-200 hover:bg-white/[0.06]"><Plus className="h-3.5 w-3.5" /> New project</button>
  </aside>;
}
