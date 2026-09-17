'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listProjects,
  listRepos,
  createProject as apiCreateProject,
  deployProject as apiDeployProject,
} from '@/lib/api-client';
import type { Project, Repository } from '@/lib/types';

export function useWorkspace(token: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [error, setError] = useState('');

  // ── Load all projects ─────────────────────────────────────────────────────
  const loadWorkspace = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await listProjects(token);
      setProjects(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load projects');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Load GitHub repositories (always fetch fresh) ─────────────────────────
  const loadRepositories = useCallback(async () => {
    if (!token) return;
    setLoadingRepositories(true);
    setError('');
    try {
      const data = await listRepos(token);
      setRepositories(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load repositories');
    } finally {
      setLoadingRepositories(false);
    }
  }, [token]);

  // ── Create project ────────────────────────────────────────────────────────
  const createProject = useCallback(
    async (repository: Repository, name?: string): Promise<string> => {
      const projectId = await apiCreateProject(token, repository.full_name, name);
      // Reload project list so the new project appears immediately.
      await loadWorkspace();
      return projectId;
    },
    [loadWorkspace, token],
  );

  // ── Deploy project ────────────────────────────────────────────────────────
  const deployProject = useCallback(
    async (projectId: string): Promise<{ deployment_id: string; message: string }> => {
      return apiDeployProject(token, projectId);
    },
    [token],
  );

  // ── Auto-load on mount / token change ────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setProjects([]);
      setLoading(false);
      return;
    }
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    projects,
    repositories,
    loading,
    loadingRepositories,
    error,
    setError,
    loadRepositories,
    createProject,
    deployProject,
    reload: loadWorkspace,
  };
}
