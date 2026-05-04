'use client';

import { useState } from 'react';
import { useMemoletStore } from '@/store/useMemoletStore';
import { parseMemoletText } from '@/lib/api';
import { cn } from '@/lib/utils';
import { X, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Splits a memolet's serialized text into multiple pairs if separated by ---PAIR---
 * For single-pair memolets (current format) returns one element.
 */
function splitIntoPairs(text: string) {
  const SEPARATOR = /\n?---PAIR---\n?/;
  const blocks = text.split(SEPARATOR).filter(Boolean);
  return blocks.map((block, i) => ({
    label: blocks.length > 1 ? `Pair ${i + 1}` : 'Doc',
    ...parseMemoletText(block),
    raw: block,
  }));
}

export default function DocViewer() {
  const { nodes, selectedNodeId, setSelectedNodeId } = useMemoletStore();
  const [activeTab, setActiveTab] = useState(0);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const pairs = selectedNode ? splitIntoPairs(selectedNode.data.text) : [];
  const tab = pairs[activeTab] ?? pairs[0];

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className="w-[30%] min-w-[320px] max-w-[460px] flex flex-col h-full bg-white border-l border-gray-200 shadow-sm flex-shrink-0 overflow-hidden transition-all duration-300">
        {/* Empty state header */}
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
            <FileText size={14} className="text-gray-400" />
            Document View
          </div>
        </div>
        <div className="flex-1 bg-white flex items-center justify-center text-gray-400 text-sm">
          Select a memolet to view details
        </div>
      </div>
    );
  }

  return (
    <div className="w-[30%] min-w-[320px] max-w-[460px] flex flex-col h-full bg-white border-l border-gray-200 shadow-sm flex-shrink-0 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <FileText size={14} className="text-blue-500" />
          Document View
        </div>
        <button
          onClick={() => {
            setSelectedNodeId(null);
            setActiveTab(0);
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
          title="Close Doc Viewer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs — one per pair */}
      <div className="flex bg-[#f3f4f6] border-b border-gray-200 text-xs font-medium px-2 overflow-x-auto flex-shrink-0">
        {pairs.map((p, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={cn(
              'py-2.5 px-4 whitespace-nowrap transition',
              activeTab === i
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {p.label}
            {pairs.length > 1 && (
              <span className="ml-1 text-[9px] text-gray-400">
                {i + 1}/{pairs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#fdfdfd]">
        {!selectedNode ? (
          <p className="text-sm text-gray-400">Node not found.</p>
        ) : tab?.isStructured ? (
          <div className="space-y-5">
            {/* Summary Block */}
            {tab.summary && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg shadow-sm">
                <h4 className="text-[10px] font-bold text-blue-800 mb-1 uppercase tracking-wider">
                  Summary
                </h4>
                <p className="text-sm text-blue-900 leading-relaxed">{tab.summary}</p>
              </div>
            )}

            {/* User Message */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                User
              </h4>
              <div className="bg-gray-100/80 p-4 rounded-xl text-sm text-gray-800 whitespace-pre-wrap">
                {tab.user}
              </div>
            </div>

            {/* AI Response */}
            <div>
              <h4 className="text-[10px] font-bold text-blue-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                AI Response
              </h4>
              <div className="border border-gray-100 bg-white p-5 rounded-xl shadow-sm text-sm text-gray-800 whitespace-normal leading-relaxed prose prose-sm prose-blue max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {tab.ai}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {tab?.raw ?? selectedNode.data.text}
          </div>
        )}
      </div>
    </div>
  );
}
