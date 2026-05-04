'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, initFromStorage } = useAuthStore();

  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/workspace');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.username.trim() || !form.password || !form.confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        username: form.username.trim(),
        password: form.password,
      });
      login(data.access_token, {
        username: data.user?.username ?? form.username.trim(),
        id: data.user?.id,
      });
      router.replace('/workspace');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Registration failed. Username may already be taken.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-3xl" />
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
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Create your account</h1>
        <p className="text-sm text-slate-400 mb-7">
          Start building your memory-augmented workspace — free.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              autoComplete="username"
              autoFocus
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="choose_a_username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="min. 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="repeat your password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Strength indicator */}
          {form.password.length > 0 && (
            <div className="flex gap-1.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      form.password.length >= (i + 1) * 3
                        ? i < 2 ? '#f59e0b' : '#22c55e'
                        : '#ffffff15',
                  }}
                />
              ))}
              <span className="text-xs text-slate-500 ml-1">
                {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Fair' : 'Strong'}
              </span>
            </div>
          )}

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
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        <Link href="/" className="hover:text-slate-400 transition">← Back to home</Link>
      </p>
    </div>
  );
}
