'use client';
import { memo, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer, Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { MemoletData, useMemoletStore } from '@/store/useMemoletStore';

export type CustomNodeProps = NodeProps<Node<MemoletData, 'memolet'>>;

export const MemoletNodeComponent = memo(({ id, data, selected }: CustomNodeProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-3 w-full h-full flex flex-col transition-all border-2 group overflow-hidden',
        data.highlighted ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent hover:border-gray-300',
        selected ? 'border-gray-500 shadow-lg' : ''
      )}
      style={{ backgroundColor: data.color || '#f3f4f6' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => useMemoletStore.getState().setSelectedNodeId(id)}
    >
      <NodeResizer 
        color="#a8a29e" 
        isVisible={!!selected} 
        minWidth={160} 
        minHeight={160} 
      />

      <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100" />
      <Handle type="target" position={Position.Left} id="left" className="opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0 group-hover:opacity-100" />

      {/* Header */}
      <div className="flex items-center space-x-1.5 text-base font-semibold mb-1 text-gray-800">
        <span>{data.keywords.length > 0 ? '📝' : '📎'}</span>
        <span className="font-mono text-sm font-bold tracking-wide">
          {data.displayId ?? id.substring(0, 6)}
        </span>
      </div>

      {/* Body: Keywords */}
      <div className="text-sm text-gray-600 break-words whitespace-pre-wrap overflow-hidden flex-1">
        {data.keywords.join(', ')}
      </div>

      {/* Hover Tooltip/Summary */}
      {hovered && (
        <div className="absolute top-0 left-full ml-4 w-72 p-3 bg-white shadow-xl rounded-xl border border-gray-200 z-50 text-base text-gray-700 pointer-events-none">
          <div className="font-mono font-bold mb-1.5 text-gray-900 border-b border-gray-100 pb-1.5 text-sm">
            {data.displayId ?? id.substring(0, 8)}
          </div>
          {data.summary ? (
            <p className="text-sm text-blue-700 leading-relaxed line-clamp-5">{data.summary}</p>
          ) : (
            <p className="line-clamp-5 text-sm text-gray-600 leading-relaxed">{data.keywords.join(' · ')}</p>
          )}
        </div>
      )}

      {/* Extract Button */}
      {hovered && (
        <button
          className="absolute -right-3 -top-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110"
          title="Extract"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Extract logic
          }}
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
});
MemoletNodeComponent.displayName = 'MemoletNodeComponent';
