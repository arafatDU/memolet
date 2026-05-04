'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { useMemoletStore } from '@/store/useMemoletStore';
import { useAuthStore } from '@/store/useAuthStore';
import LeftSidebar from '@/components/Sidebar/LeftSidebar';
import ChatOverlay from '@/components/Workspace/ChatOverlay';
import GetMemoryOverlay from '@/components/Workspace/GetMemoryOverlay';
import SandboxCanvas from '@/components/Canvas/SandboxCanvas';
import DocViewer from '@/components/Sidebar/DocViewer';
import AuthGuard from '@/components/auth/AuthGuard';
import { useEffect, useRef, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memoriesApi, parseMemoletText } from '@/lib/api';

function WorkspaceInner() {
  const router = useRouter();
  const { setNodes, nodes, setMemoriesNeedsSync } = useMemoletStore();
  const selectedNodeId = useMemoletStore((s) => s.selectedNodeId);
  const initialized = useRef(false);
  const { user, logout } = useAuthStore();
  const [loadingCanvas, setLoadingCanvas] = useState(false);

  const handleLogout = () => {
    logout();
    setMemoriesNeedsSync(true);
    router.replace('/');
  };

  /** Convert a MemoletDTO (with displayId) from the API into a ReactFlow node */
  const memoletToNode = (m: { id: string; text: string; keywords: string[]; color?: string; weight?: number; displayId?: string }) => {
    const parsed = parseMemoletText(m.text);
    return {
      id: m.id,
      type: 'memolet' as const,
      position: { 
        x: Math.floor((Math.random() * 600 + 80) / 160) * 160, 
        y: Math.floor((Math.random() * 400 + 80) / 160) * 160 
      },
      data: {
        text: m.text,
        keywords: m.keywords ?? [],
        color: m.color ?? '#e0f2fe',
        weight: m.weight ?? 1,
        summary: parsed.summary,
        displayId: m.displayId,        // e.g. "1_0", "1_1", "2_0"
      },
      style: { width: 160, height: 160 },
    };
  };

  const loadCanvasFromDB = async () => {
    setLoadingCanvas(true);
    try {
      // 1. Seed demo data if DB is empty (idempotent)
      await memoriesApi.seedDemo().catch(() => {
        // Ignore seed errors — DB may already have data
      });

      // We intentionally do NOT load all memories onto the canvas here.
      // The Sandbox Canvas acts as a curated "instant memory" space,
      // and users will manually pull in nodes from the "Get Memory" tab.
    } catch (err) {
      console.error('Failed to init DB:', err);
    } finally {
      setLoadingCanvas(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadCanvasFromDB();
  }, []);

  return (
    <main className="flex h-screen w-full bg-[#f1f5f9] overflow-hidden text-gray-900 antialiased relative">
      <LeftSidebar />

      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Toolbar */}
        <div className="h-12 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm z-10 flex-shrink-0 w-full">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 tracking-tight select-none">🧠 Memolet</span>
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex w-full overflow-hidden relative">
          {/* Canvas */}
          <div className="flex-1 h-full w-full relative">
            {loadingCanvas && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={28} className="animate-spin text-blue-400" />
                  <p className="text-sm text-gray-500 font-medium">Loading memories…</p>
                </div>
              </div>
            )}
            <ReactFlowProvider>
              <SandboxCanvas />
            </ReactFlowProvider>
          </div>

          {/* Document Viewer (always rendered, slides out/in based on state or displays empty state) */}
          <DocViewer />
        </div>
      </div>

      <GetMemoryOverlay />
      <ChatOverlay />
    </main>
  );
}

export default function WorkspacePage() {
  return (
    <AuthGuard>
      <WorkspaceInner />
    </AuthGuard>
  );
}
