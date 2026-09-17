'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';

export type DeploymentLog = {
  id: number;
  deployment_id: string;
  line: string;
  created_at: string;
};

export function useDeploymentLogs(token: string, projectId: string, deploymentId: string) {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(Boolean(deploymentId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !projectId || !deploymentId) {
      queueMicrotask(() => {
        setLogs([]);
        setLoading(false);
      });
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const nextLogs = await apiRequest<DeploymentLog[]>(
          `/projects/${projectId}/deployments/${deploymentId}/logs`,
          token,
        );
        if (!cancelled) {
          setLogs(Array.isArray(nextLogs) ? nextLogs : []);
          setError('');
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load deployment logs');
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [deploymentId, projectId, token]);

  return { logs, loading, error };
}
