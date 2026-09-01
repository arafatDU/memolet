'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { setClerkTokenGetter } from '@/lib/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protects workspace pages using Clerk Authentication.
 * Integrates Clerk's getToken with the centralized apiFetch client.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (isLoaded && getToken) {
      setClerkTokenGetter(getToken);
    }
  }, [isLoaded, getToken]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 tracking-wide">Authenticating with Clerk…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <>{children}</>;
}
