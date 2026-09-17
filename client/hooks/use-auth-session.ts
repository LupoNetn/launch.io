"use client";

import { useEffect, useState } from 'react';

export function useAuthSession() {
  const [token] = useState(() => {
    if (typeof window === 'undefined') return '';
    const fragmentToken = new URLSearchParams(window.location.hash.slice(1)).get('access_token');
    return fragmentToken || window.localStorage.getItem('launchio_access_token') || '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken) return;

    window.localStorage.setItem('launchio_access_token', accessToken);
    if (refreshToken) window.localStorage.setItem('launchio_refresh_token', refreshToken);
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  }, []);

  return { token };
}
