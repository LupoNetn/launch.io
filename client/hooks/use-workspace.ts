"use client";

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { normalizeProject, type Project, type Repository, type User } from '@/lib/types';

export function useWorkspace(token: string) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [loadingRepositories, setLoadingRepositories] = useState(false);
  const [error, setError] = useState('');

  const loadWorkspace = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [me, projectData] = await Promise.all([
        apiRequest<User>('/auth/me', token),
        apiRequest<unknown>('/projects/', token),
      ]);
      const rawProjects = Array.isArray(projectData) ? projectData : [];
      setUser(me);
      setProjects(rawProjects.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).map(normalizeProject));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load workspace');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadRepositories = useCallback(async () => {
    if (!token || repositories.length) return;
    setLoadingRepositories(true);
    setError('');
    try {
      const data = await apiRequest<Repository[]>('/projects/list-repo', token);
      setRepositories(Array.isArray(data) ? data : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load repositories');
    } finally {
      setLoadingRepositories(false);
    }
  }, [repositories.length, token]);

  const createProject = useCallback(async (repository: Repository) => {
    const data = await apiRequest<{ project_id: string }>('/projects/', token, {
      method: 'POST',
      body: JSON.stringify({ github_full_name: repository.full_name, name: repository.name }),
    });
    await loadWorkspace();
    return data.project_id;
  }, [loadWorkspace, token]);

  const deployProject = useCallback(async (projectId: string) => {
    return apiRequest<{ deployment_id: string; message: string }>(`/projects/${projectId}/deploy`, token, { method: 'POST' });
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => void loadWorkspace());
  }, [loadWorkspace]);

  return { user, projects, repositories, loading, loadingRepositories, error, setError, loadRepositories, createProject, deployProject, reload: loadWorkspace };
}
