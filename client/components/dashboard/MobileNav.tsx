'use client';

import { KeyRound, LayoutDashboard, Settings, TerminalSquare } from 'lucide-react';
import type { DashboardView } from '@/lib/types';

const TABS: { id: DashboardView; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'logs', label: 'Logs', Icon: TerminalSquare },
  { id: 'environment', label: 'Env', Icon: KeyRound },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

interface MobileNavProps {
  view: DashboardView;
  onView: (view: DashboardView) => void;
  hasProject: boolean;
}

export function MobileNav({ view, onView, hasProject }: MobileNavProps) {
  if (!hasProject) return null;

  return (
    <nav className="flex border-b border-white/[0.07] bg-[#0b0c10]/90 lg:hidden">
      {TABS.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => onView(id)}
            className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] font-medium transition ${
              active
                ? 'border-b-2 border-violet-400 text-violet-300'
                : 'border-b-2 border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
