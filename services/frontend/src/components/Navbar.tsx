'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStoredAuth, clearStoredAuth } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ display_name: string; role: string } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const auth = getStoredAuth();
      setUser(auth ? auth.user : null);
    };
    
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);
  
  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Kid Learn
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/quiz" className="hover:text-indigo-200">Quizzes</Link>
          <Link href="/lessons" className="hover:text-indigo-200">Lessons</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-indigo-200">Dashboard</Link>
              <Link href="/tutor" className="hover:text-indigo-200">Tutor</Link>
              <Link href="/search" className="hover:text-indigo-200">Search</Link>
              <span className="text-indigo-200 text-sm">{user.display_name}</span>
              <button onClick={handleLogout} className="text-sm bg-indigo-500 px-3 py-1 rounded hover:bg-indigo-400">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-white text-indigo-600 px-4 py-1.5 rounded font-medium hover:bg-indigo-50">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
