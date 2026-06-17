import { type DragEvent } from 'react';
import { Globe, Webhook, GitBranch, Clock, FileOutput } from 'lucide-react';
import type { NodeType } from '../types';

const nodeTypes: Array<{ type: NodeType; label: string; icon: React.ReactNode; color: string }> = [
  { type: 'api', label: 'API Request', icon: <Globe size={18} />, color: 'border-l-blue-500' },
  { type: 'webhook', label: 'Webhook', icon: <Webhook size={18} />, color: 'border-l-purple-500' },
  { type: 'condition', label: 'Condition', icon: <GitBranch size={18} />, color: 'border-l-amber-500' },
  { type: 'delay', label: 'Delay', icon: <Clock size={18} />, color: 'border-l-emerald-500' },
  { type: 'output', label: 'Output', icon: <FileOutput size={18} />, color: 'border-l-red-500' },
];

export default function Sidebar() {
  const onDragStart = (event: DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-56 border-r bg-white p-3 flex flex-col gap-1">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Nodes</h2>
      {nodeTypes.map(nt => (
        <div
          key={nt.type}
          draggable
          onDragStart={e => onDragStart(e, nt.type)}
          className={`flex items-center gap-2.5 rounded-md border border-l-4 bg-white px-3 py-2.5 text-sm text-gray-700 cursor-grab hover:shadow-md hover:border-gray-300 transition-shadow ${nt.color}`}
        >
          <span className="text-gray-500">{nt.icon}</span>
          <span>{nt.label}</span>
        </div>
      ))}
    </aside>
  );
}
