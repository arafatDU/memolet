'use client';

import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { Brain, Sparkles, Layers, ShieldCheck, Cpu, ArrowRight, Network } from 'lucide-react';

const features = [
  {
    icon: <Brain className="w-6 h-6 text-blue-400" />,
    title: 'Dual-Layer Memory Engine (GraphRAG)',
    desc: 'Combines dense pgvector semantic similarity with Neo4j concept graphs to retrieve interconnected ideas across conversation threads.',
  },
  {
    icon: <Layers className="w-6 h-6 text-purple-400" />,
    title: 'Interactive 2D Sensemaking Sandbox',
    desc: 'Manipulate, cluster, and spatially weigh memory nodes on an infinite React Flow canvas to guide your next AI prompt with zero context bloat.',
  },
  {
    icon: <Cpu className="w-6 h-6 text-cyan-400" />,
    title: 'Vercel AI Gateway & Multi-Model Routing',
    desc: 'Switch seamlessly between OpenAI GPT-4o, DeepSeek V3, Claude 3, Meta LLaMA, and Google Gemini with sub-second real-time streaming.',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
    title: 'Trust & Verification Layer',
    desc: 'Confidence heatmaps and clickable trace citations verify facts, detecting contradictory context before AI generation occurs.',
  },
];

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col selection:bg-blue-500 selection:text-white">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-4 border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0d1117]/80">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30 group-hover:scale-105 transition-transform">
            <span className="text-xl">🧠</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white group-hover:text-blue-400 transition">
            Memolet
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isLoaded && isSignedIn ? (
            <>
              <Link
                href="/workspace"
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-md shadow-blue-900/30 flex items-center gap-1.5"
              >
                Open Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="ml-2">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-9 h-9 border border-white/20',
                    },
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition rounded-xl hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition shadow-lg shadow-blue-900/30"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 relative overflow-hidden flex-1">
        {/* Ambient Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-blue-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            GraphRAG-Powered AI Memory Workspace
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8">
            Reifying Conversational Memories into{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Interactive Cognitive Workspaces
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto font-normal">
            Move beyond ephemeral chat logs. Memolet transforms fragmented conversations into modular, 
            spatial memory objects you can search, organize, verify, and reuse across model providers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoaded && isSignedIn ? (
              <Link
                href="/workspace"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-2xl transition shadow-xl shadow-blue-900/40 text-base flex items-center justify-center gap-2"
              >
                Launch Sensemaking Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:opacity-90 text-white font-bold rounded-2xl transition shadow-xl shadow-blue-900/40 text-base flex items-center justify-center gap-2 group"
                >
                  Start Free with Google or GitHub
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium rounded-2xl transition text-base bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                >
                  Sign In to Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Visual Workspace Mockup ────────────────────────────────────── */}
        <div className="relative z-10 mt-16 w-full max-w-5xl mx-auto rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/80 bg-[#161b22]/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d1117]/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-blue-400" />
                memolet_canvas — neo4j graphrag sandbox
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ● Live 92% Token Reduction
              </span>
            </div>
          </div>

          <div className="relative h-72 sm:h-80 p-6 overflow-hidden bg-radial from-slate-900/40 to-[#161b22]">
            {/* Mockup Nodes */}
            {[
              { x: '6%',  y: '12%', color: '#bfdbfe', label: 'FastAPI · SSE Streaming · Vercel Gateway', tag: 'Node 1_0', w: '26%' },
              { x: '8%',  y: '56%', color: '#fef3c7', label: 'PostgreSQL · pgvector 384d · Embeddings',  tag: 'Node 1_1', w: '24%' },
              { x: '38%', y: '30%', color: '#bbf7d0', label: 'GraphRAG · Neo4j Concept Subgraph',     tag: 'Node 1_2', w: '26%' },
              { x: '68%', y: '10%', color: '#e9d5ff', label: 'Conflict Detection · Trust Citations',    tag: 'Node 1_3', w: '24%' },
              { x: '70%', y: '58%', color: '#fde68a', label: 'Spatial Weighting · React Flow 2D',       tag: 'Node 1_4', w: '24%' },
            ].map((node, i) => (
              <div
                key={i}
                className="absolute rounded-xl border border-white/20 shadow-xl px-3.5 py-2.5 text-xs text-gray-900 font-semibold backdrop-blur-md transition-transform hover:scale-105 cursor-pointer"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  backgroundColor: node.color + 'dd',
                }}
              >
                <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>📝 {node.tag}</span>
                  <span className="text-[9px] bg-black/10 px-1 rounded">Weight: 1.0</span>
                </div>
                <div className="text-xs font-medium leading-snug line-clamp-2">{node.label}</div>
              </div>
            ))}

            {/* Edge Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <line x1="26%" y1="26%" x2="38%" y2="42%" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5 4" />
              <line x1="26%" y1="68%" x2="38%" y2="48%" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5 4" />
              <line x1="64%" y1="42%" x2="68%" y2="24%" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 4" />
              <line x1="64%" y1="46%" x2="70%" y2="68%" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 4" />
            </svg>

            <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#161b22] to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Key Features ───────────────────────────────────────────────── */}
      <section className="px-6 sm:px-12 py-24 bg-[#0d1117] border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
              A Tiered Intelligence System for AI Continuity
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base">
              Built upon foundational research in conversational memory reification, GraphRAG indexing, and spatial prompt assembly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-blue-500/30 transition-all">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gradient-to-b from-[#161b22] to-[#0d1117] border-t border-white/10 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
            Ready to Supercharge Your AI Context?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Experience instantaneous memory recall, GraphRAG reasoning, and multi-model routing in one unified canvas.
          </p>
          {isLoaded && isSignedIn ? (
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition shadow-2xl shadow-blue-900/50 text-base"
            >
              Go Directly to Workspace →
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-2xl transition shadow-2xl shadow-blue-900/50 text-base"
            >
              Get Started with Clerk Auth →
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="px-8 py-6 border-t border-white/5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CognitiveCanvas (Memolet). Academic Research Project. Powered by Next.js, FastAPI, PostgreSQL, and Neo4j.
      </footer>
    </div>
  );
}
