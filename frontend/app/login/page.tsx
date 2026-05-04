'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, initFromStorage } = useAuthStore();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect already-authenticated users straight to workspace
  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/workspace');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.username.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({
        username: form.username.trim(),
        password: form.password,
      });
      login(data.access_token, { username: form.username.trim() });
      router.replace('/workspace');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <span className="text-2xl">🧠</span>
        <span className="text-xl font-black tracking-tight text-white group-hover:text-blue-400 transition">
          Memolet
        </span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#161b22] shadow-2xl shadow-black/50 p-8">
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-400 mb-7">
          Sign in to access your memory workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="your_username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
            Create one free
          </Link>
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        <Link href="/" className="hover:text-slate-400 transition">← Back to home</Link>
      </p>
    </div>
  );
}
