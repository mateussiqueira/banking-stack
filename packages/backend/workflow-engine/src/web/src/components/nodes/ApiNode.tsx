import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';

function ApiNode({ data }: NodeProps) {
  return (
    <div className="min-w-[180px]">
      <div className="flex items-center gap-2 border-b bg-blue-50 px-3 py-2 rounded-t-lg">
        <Globe size={14} className="text-blue-600" />
        <span className="text-xs font-semibold text-blue-700">API Request</span>
        <span className="ml-auto text-[10px] font-mono bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
          {data.method || 'GET'}
        </span>
      </div>
      <div className="px-3 py-2 text-xs text-gray-600">
        {data.url ? (
          <span className="truncate block max-w-[200px]">{data.url}</span>
        ) : (
          <span className="italic">Configure URL...</span>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
    </div>
  );
}

export default memo(ApiNode);
