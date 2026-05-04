'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected pages. Reads the auth store (initialised from localStorage)
 * and redirects unauthenticated visitors back to the landing page.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const initFromStorage = useAuthStore((s) => s.initFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    initFromStorage();
    setChecked(true);
  }, [initFromStorage]);

  useEffect(() => {
    if (checked && !isAuthenticated) {
      router.replace('/');
    }
  }, [checked, isAuthenticated, router]);

  if (!checked) {
    // Avoid flash of workspace content while checking localStorage
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 tracking-wide">Loading Memolet…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null; // router.replace in progress

  return <>{children}</>;
}
