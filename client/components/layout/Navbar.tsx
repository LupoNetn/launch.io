import { Zap } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import { API_BASE_URL } from '@/lib/api';

export default function Navbar() {
  return (
    <div className="fixed top-0 z-50 w-full">
      {/* Navigation Header */}
      <nav className="border-b border-white/[0.06] bg-[#05050A]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <Zap className="h-4 w-4 fill-black text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              launch.io
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-white">
              Workflow
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              Pricing
            </a>
            <a href="#docs" className="transition-colors hover:text-white">
              Documentation
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`${API_BASE_URL}/auth/github/login`}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold whitespace-nowrap text-black shadow-md shadow-white/10 transition-all hover:bg-neutral-200 active:scale-95 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <GithubIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>
                <span className="hidden sm:inline">Continue with </span>GitHub
              </span>
            </a>
          </div>
        </div>
      </nav>

      {/* Banner beneath Navbar */}
      <div className="flex w-full items-center justify-center gap-2 border-b border-white/[0.08] bg-[#05050A]/90 bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-emerald-500/10 px-4 py-2 text-center text-xs font-medium text-white/90 shadow-sm backdrop-blur-xl sm:text-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
        <span>launch.io coming soon</span>
      </div>
    </div>
  );
}
