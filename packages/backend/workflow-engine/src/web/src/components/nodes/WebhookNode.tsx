import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Webhook } from 'lucide-react';

function WebhookNode(_props: NodeProps) {
  return (
    <div className="min-w-[160px]">
      <div className="flex items-center gap-2 border-b bg-purple-50 px-3 py-2 rounded-t-lg">
        <Webhook size={14} className="text-purple-600" />
        <span className="text-xs font-semibold text-purple-700">Webhook</span>
      </div>
      <div className="px-3 py-2 text-xs text-gray-500 italic">
        Receives HTTP requests
      </div>
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
    </div>
  );
}

export default memo(WebhookNode);
