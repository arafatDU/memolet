import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Memolet — Memory-Augmented AI Workspace',
  description:
    'Transform your conversations into a living knowledge graph. Memolet organises AI memory as semantic nodes you can see, connect, and cite.',
};

const features = [
  {
    icon: '🧠',
    title: 'Semantic Memory Nodes',
    desc: 'Every conversation chunk becomes a searchable memolet — keyword-rich, colour-coded, and visually positioned on an infinite canvas.',
  },
  {
    icon: '🔗',
    title: 'Knowledge Graph',
    desc: 'Edges between memolets reveal topic clusters, letting you trace how ideas connect across time and context.',
  },
  {
    icon: '💬',
    title: 'Context-Aware Chat',
    desc: 'Cite specific memories with @ in your prompts. The AI answers using only what you choose — no hallucinated context.',
  },
  {
    icon: '⚡',
    title: 'Hybrid Retrieval',
    desc: 'BM25 + vector search surfaces the most relevant memories instantly. Results ranked by semantic similarity and recency.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-sm sticky top-0 z-50 bg-[#0d1117]/80">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-lg font-bold tracking-tight text-white">Memolet</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-lg shadow-blue-900/30"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-28 pb-24 relative overflow-hidden flex-1">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Memory-Augmented AI
          </div>

          <h1 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight mb-6">
            Your AI's memory,{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              visualised.
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto">
            Memolet transforms chat logs into a living knowledge graph of semantic
            memory nodes — so your AI always knows exactly what it once knew.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-xl shadow-blue-900/40 text-base"
            >
              Create Free Account →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium rounded-xl transition text-base bg-white/5 hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Canvas preview mockup */}
        <div className="relative z-10 mt-20 w-full max-w-4xl mx-auto rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50 bg-[#161b22]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0d1117]">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-slate-500">memolet — workspace</span>
          </div>
          <div className="relative h-64 p-6 overflow-hidden">
            {/* Fake node grid */}
            {[
              { x: '5%',  y: '10%', color: '#bbf7d0', label: 'snorkeling · diving · scuba', w: '22%' },
              { x: '5%',  y: '52%', color: '#fef3c7', label: 'hawaii · trip · beaches',     w: '20%' },
              { x: '32%', y: '28%', color: '#bfdbfe', label: 'activities · tours · indoor', w: '22%' },
              { x: '58%', y: '8%',  color: '#e9d5ff', label: 'room · bed · booking',        w: '20%' },
              { x: '60%', y: '55%', color: '#fde68a', label: 'luau · dancing · hawaiian',   w: '22%' },
            ].map((node, i) => (
              <div
                key={i}
                className="absolute rounded-xl border border-white/20 shadow-lg px-3 py-2 text-xs text-gray-800 font-medium backdrop-blur-sm"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  backgroundColor: node.color + 'cc',
                }}
              >
                <div className="text-[10px] font-bold text-gray-600 mb-0.5">📝 node_{i}</div>
                {node.label}
              </div>
            ))}
            {/* Fake edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <line x1="22%" y1="25%" x2="32%" y2="40%" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="22%" y1="62%" x2="32%" y2="45%" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="54%" y1="40%" x2="58%" y2="20%" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="54%" y1="40%" x2="60%" y2="60%" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#161b22] to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#0d1117] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 tracking-tight">
            Everything your AI needs to remember
          </h2>
          <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
            Built for researchers, writers, and developers who refuse to repeat context.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-blue-500/30 hover:bg-blue-500/5 transition group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-blue-400 transition">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4 tracking-tight">
            Start building your knowledge graph
          </h2>
          <p className="text-slate-400 mb-8">
            Free to use. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-2xl shadow-blue-900/40 text-base"
          >
            Create your account →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="px-8 py-6 border-t border-white/5 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Memolet. Built with Next.js + FastAPI.
      </footer>
    </div>
  );
}
