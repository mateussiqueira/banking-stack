import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileOutput } from 'lucide-react';

function OutputNode({ data }: NodeProps) {
  return (
    <div className="min-w-[160px]">
      <div className="flex items-center gap-2 border-b bg-red-50 px-3 py-2 rounded-t-lg">
        <FileOutput size={14} className="text-red-600" />
        <span className="text-xs font-semibold text-red-700">Output</span>
      </div>
      <div className="px-3 py-2 text-xs text-gray-600">
        {data.outputTemplate ? (
          <span className="font-mono text-gray-700 truncate block max-w-[200px]">{data.outputTemplate}</span>
        ) : (
          <span className="italic">No template set</span>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-red-500" />
    </div>
  );
}

export default memo(OutputNode);
