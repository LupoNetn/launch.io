'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMe } from '@/lib/api-client';
import type { User } from '@/lib/types';

const ACCESS_KEY = 'launchio_access_token';
const REFRESH_KEY = 'launchio_refresh_token';

function readStorage(key: string): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) ?? '';
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
}

function extractTokenFromLocation(): { accessToken: string; refreshToken: string } {
  if (typeof window === 'undefined') return { accessToken: '', refreshToken: '' };

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const searchParams = new URLSearchParams(window.location.search);

  const accessToken =
    hashParams.get('access_token') ||
    hashParams.get('token') ||
    searchParams.get('access_token') ||
    searchParams.get('token') ||
    '';

  const refreshToken =
    hashParams.get('refresh_token') ||
    hashParams.get('refresh') ||
    searchParams.get('refresh_token') ||
    searchParams.get('refresh') ||
    '';

  return { accessToken, refreshToken };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthSession() {
  const [token, setToken] = useState<string>(() => {
    const { accessToken } = extractTokenFromLocation();
    return accessToken || readStorage(ACCESS_KEY);
  });

  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const didInit = useRef(false);

  // ── Consume OAuth fragment/query tokens on first mount ───────────────────
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const { accessToken, refreshToken } = extractTokenFromLocation();

    if (accessToken) {
      writeStorage(ACCESS_KEY, accessToken);
      if (refreshToken) writeStorage(REFRESH_KEY, refreshToken);
      queueMicrotask(() => setToken(accessToken));

      // Clean URL fragment & search params while preserving pathname
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // ── Load user profile whenever we have a token ────────────────────────────
  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setUser(null));
      return;
    }
    queueMicrotask(() => setUserLoading(true));
    getMe(token)
      .then((data) => {
        if (data && typeof data === 'object') {
          setUser(data);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, [token]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    writeStorage(ACCESS_KEY, '');
    writeStorage(REFRESH_KEY, '');
    setToken('');
    setUser(null);
    window.location.href = '/';
  }, []);

  return { token, user, userLoading, logout };
}
