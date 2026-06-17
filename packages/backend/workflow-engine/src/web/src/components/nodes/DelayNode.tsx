import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';

function DelayNode({ data }: NodeProps) {
  const ms = data.delayMs || 1000;
  const label = ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <div className="min-w-[140px]">
      <div className="flex items-center gap-2 border-b bg-emerald-50 px-3 py-2 rounded-t-lg">
        <Clock size={14} className="text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">Delay</span>
        <span className="ml-auto text-[10px] font-mono bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
          {label}
        </span>
      </div>
      <div className="px-3 py-2 text-xs text-gray-500 italic">
        Waits for {label}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-emerald-500" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
    </div>
  );
}

export default memo(DelayNode);
