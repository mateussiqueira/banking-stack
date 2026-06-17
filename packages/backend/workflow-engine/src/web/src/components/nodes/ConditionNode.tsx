import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

function ConditionNode({ data }: NodeProps) {
  const conditions = data.conditions || [];
  return (
    <div className="min-w-[180px]">
      <div className="flex items-center gap-2 border-b bg-amber-50 px-3 py-2 rounded-t-lg">
        <GitBranch size={14} className="text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">Condition</span>
      </div>
      <div className="px-3 py-2 text-xs text-gray-600">
        {conditions.length > 0 ? (
          conditions.map((c: any, i: number) => (
            <div key={i} className="truncate">
              <span className="font-mono text-amber-700">{c.field || '?'}</span>
              <span className="mx-1 text-gray-400">{c.operator}</span>
              <span className="font-mono">{c.value || '?'}</span>
            </div>
          ))
        ) : (
          <span className="italic">Configure conditions...</span>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} id="true" className="!bg-emerald-500" style={{ top: '40%' }} />
      <Handle type="source" position={Position.Right} id="false" className="!bg-red-500" style={{ top: '60%' }} />
      <span className="absolute right-1 top-[36%] text-[9px] text-emerald-600 font-semibold">T</span>
      <span className="absolute right-1 top-[56%] text-[9px] text-red-600 font-semibold">F</span>
    </div>
  );
}

export default memo(ConditionNode);
