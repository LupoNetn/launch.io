'use client';

import { ArrowRight, Code2, Globe, Loader2, Rocket, Search, X } from 'lucide-react';
import { GithubIcon } from '@/components/icons/GithubIcon';
import type { Repository } from '@/lib/types';
import { useMemo, useState } from 'react';

interface CreateProjectModalProps {
  repositories: Repository[];
  loading: boolean;
  creating: boolean;
  error: string;
  onClose: () => void;
  onSelect: (repository: Repository, name?: string) => void;
}

export function CreateProjectModal({
  repositories,
  loading,
  creating,
  error,
  onClose,
  onSelect,
}: CreateProjectModalProps) {
  const [query, setQuery] = useState('');
  const [step, setStep] = useState<'pick' | 'configure'>('pick');
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [projectName, setProjectName] = useState('');

  const filtered = useMemo(
    () =>
      repositories.filter((repo) =>
        repo.full_name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, repositories],
  );

  function handleImportClick(repo: Repository) {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    setStep('configure');
  }

  function handleDeploySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo) return;
    onSelect(selectedRepo, projectName || selectedRepo.name);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f17] shadow-[0_30px_90px_rgba(0,0,0,0.9)] text-white">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <GithubIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">
              {step === 'pick' ? 'Import Git Repository' : 'Configure Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {step === 'pick' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search GitHub repositories..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pr-4 pl-10 text-sm outline-none placeholder:text-white/30 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 transition"
                />
              </div>

              {/* Repositories List */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/20 divide-y divide-white/[0.05]">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 py-16 text-sm text-white/40">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    Fetching GitHub repositories...
                  </div>
                ) : filtered.length > 0 ? (
                  filtered.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-white">
                            {repo.full_name}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
                            {repo.private ? 'Private' : 'Public'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-white/35">
                          <span>Branch: {repo.default_branch || 'main'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImportClick(repo)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-black transition hover:bg-violet-100"
                      >
                        Import
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-14 text-center text-xs text-white/40">
                    No repositories found matching &quot;{query}&quot;.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Step 2: Configure & Deploy */
            <form onSubmit={handleDeploySubmit} className="space-y-5">
              {/* Selected Repo Card */}
              <div className="flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/20 text-violet-200">
                    <GithubIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-violet-300">Selected Repository</div>
                    <div className="text-sm font-bold text-white">{selectedRepo?.full_name}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('pick')}
                  className="text-xs font-medium text-white/40 hover:text-white underline"
                >
                  Change
                </button>
              </div>

              {/* Project Name Field */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/70">
                  Project Name
                </label>
                <input
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="my-app"
                />
              </div>

              {/* Build Settings Info */}
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-violet-400" />
                    Build Engine
                  </span>
                  <span className="font-mono text-white/90">Railpack / Nixpacks Docker</span>
                </div>
                <div className="flex items-center justify-between text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    Subdomain
                  </span>
                  <span className="font-mono text-white/90">
                    {projectName ? `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.launch.io` : '—'}
                  </span>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('pick')}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-violet-100 transition disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Deploy Project
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
