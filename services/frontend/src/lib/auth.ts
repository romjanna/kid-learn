'use client';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

export function getStoredAuth(): { user: User; token: string } | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('kidlearn_auth');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredAuth(user: User, token: string): void {
  localStorage.setItem('kidlearn_auth', JSON.stringify({ user, token }));
}

export function clearStoredAuth(): void {
  localStorage.removeItem('kidlearn_auth');
}
