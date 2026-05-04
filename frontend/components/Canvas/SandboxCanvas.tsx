'use client';

import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemoletStore } from '@/store/useMemoletStore';
import { MemoletNodeComponent } from './MemoletNodeComponent';

// Defined outside component so the reference is stable across renders
// (prevents ReactFlow from re-registering node types on every render)
const NODE_TYPES: NodeTypes = {
  memolet: MemoletNodeComponent,
};

export default function SandboxCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    removeMemolet,
  } = useMemoletStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      const container = reactFlowWrapper.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // node.position is in flow-space; we get mouse position from the event
      // Use the event coordinates relative to the container
      const x = (_event as unknown as MouseEvent).clientX - rect.left;
      const y = (_event as unknown as MouseEvent).clientY - rect.top;

      // Drop-to-delete zone: bottom-left corner (128×128 px quarter-circle)
      if (x < 128 && y > rect.height - 128) {
        removeMemolet(node.id);
      }
    },
    [removeMemolet]
  );

  return (
    <div className="flex-grow h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={NODE_TYPES}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode="Delete"
        snapToGrid={true}
        snapGrid={[160, 160]}
      >
        <Background gap={160} size={1} color="#cbd5e1" variant={BackgroundVariant.Lines} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          style={{ background: '#f8fafc' }}
        />
      </ReactFlow>

      {/* Drop & Delete zone overlay */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 rounded-tr-full flex items-end justify-start p-3 z-10"
        style={{
          background:
            'radial-gradient(circle at bottom left, rgba(254,202,202,0.7) 0%, transparent 70%)',
          border: '1px solid rgba(252,165,165,0.5)',
          borderLeft: 'none',
          borderBottom: 'none',
        }}
      >
        <span className="text-red-400 font-bold text-xs tracking-wide leading-tight text-center w-full mb-1">
          Drop &<br />Delete
        </span>
      </div>
    </div>
  );
}