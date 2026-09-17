'use client';

import { CircleHelp, LogOut, Plus, User as UserIcon } from 'lucide-react';
import type { User } from '@/lib/types';

interface DashboardTopbarProps {
  projectName: string;
  user: User | null;
  onLogout: () => void;
  onGoProjects: () => void;
  onCreateProject?: () => void;
}

export function DashboardTopbar({
  projectName,
  user,
  onLogout,
  onGoProjects,
  onCreateProject,
}: DashboardTopbarProps) {
  const initials = user?.name ? user.name.slice(0, 1).toUpperCase() : 'U';

  return (
    <header className="flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#090a0e]/80 px-6 backdrop-blur-md">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2.5 text-xs text-white/50">
        <button
          onClick={onGoProjects}
          className="font-semibold text-white/70 hover:text-white transition flex items-center gap-1.5"
        >
          Projects
        </button>
        {projectName && (
          <>
            <span className="text-white/20">/</span>
            <span className="font-semibold text-violet-300 truncate max-w-[200px]">
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        {onCreateProject && !projectName && (
          <button
            onClick={onCreateProject}
            className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-black hover:bg-violet-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New...
          </button>
        )}

        {/* User Badge */}
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <span className="text-xs font-medium text-white/80 max-w-[120px] truncate">
            {user?.name || user?.email || 'Account'}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          title="Sign out"
          className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-red-400/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
