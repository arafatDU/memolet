'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group z-10">
        <span className="text-3xl">🧠</span>
        <span className="text-2xl font-black tracking-tight text-white group-hover:text-blue-400 transition">
          Memolet
        </span>
      </Link>

      {/* Clerk SignUp Box */}
      <div className="relative z-10">
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          fallbackRedirectUrl="/workspace"
          appearance={{
            elements: {
              rootBox: 'mx-auto shadow-2xl rounded-2xl',
              card: 'bg-[#161b22] border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-8',
              headerTitle: 'text-white font-bold text-xl',
              headerSubtitle: 'text-slate-400 text-sm',
              socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition rounded-xl',
              socialButtonsBlockButtonText: 'text-white font-medium text-sm',
              dividerLine: 'bg-white/10',
              dividerText: 'text-slate-500 text-xs uppercase',
              formFieldLabel: 'text-slate-300 text-xs font-semibold uppercase tracking-wider',
              formFieldInput: 'bg-white/5 border border-white/10 text-white rounded-xl placeholder:text-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm',
              formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition shadow-lg text-sm py-2.5',
              footerActionLink: 'text-purple-400 hover:text-purple-300 font-medium',
              footer: 'bg-transparent border-t border-white/5',
              identityPreviewText: 'text-white',
              identityPreviewEditButtonIcon: 'text-purple-400',
            },
          }}
        />
      </div>

      <p className="mt-8 text-xs text-slate-500 z-10">
        <Link href="/" className="hover:text-slate-300 transition">← Back to home</Link>
      </p>
    </div>
  );
}
