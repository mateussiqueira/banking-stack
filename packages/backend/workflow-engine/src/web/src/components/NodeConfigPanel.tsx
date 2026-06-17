import { useNodes, useEdges, useReactFlow } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { NODE_LABELS } from '../types';

interface Props {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeConfigPanel({ nodeId, onClose }: Props) {
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const node = nodes.find(n => n.id === nodeId);
  const [localData, setLocalData] = useState<any>({});

  useEffect(() => {
    if (node) setLocalData({ ...node.data });
  }, [node]);

  if (!node) {
    return (
      <aside className="w-72 border-l bg-white p-4">
        <p className="text-sm text-gray-400">Select a node to configure</p>
      </aside>
    );
  }

  const updateData = (key: string, value: unknown) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    setNodes(nds =>
      nds.map(n => (n.id === nodeId ? { ...n, data: newData } : n)),
    );
  };

  const updateCondition = (index: number, key: string, value: string) => {
    const conditions = [...(localData.conditions || [])];
    conditions[index] = { ...conditions[index], [key]: value };
    updateData('conditions', conditions);
  };

  const addCondition = () => {
    const conditions = [...(localData.conditions || []), { field: '', operator: 'eq' as const, value: '' }];
    updateData('conditions', conditions);
  };

  const removeCondition = (index: number) => {
    const conditions = (localData.conditions || []).filter((_: any, i: number) => i !== index);
    updateData('conditions', conditions);
  };

  const updateHeader = (key: string, oldKey: string, value: string) => {
    const headers = { ...(localData.headers || {}) };
    if (oldKey !== key) delete headers[oldKey];
    headers[key] = value;
    updateData('headers', headers);
  };

  const addHeader = () => {
    updateData('headers', { ...(localData.headers || {}), '': '' });
  };

  const removeHeader = (key: string) => {
    const headers = { ...(localData.headers || {}) };
    delete headers[key];
    updateData('headers', headers);
  };

  const renderConfig = () => {
    switch (node.type) {
      case 'api':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-600">Method</label>
            <select
              className="w-full rounded border px-2 py-1.5 text-sm"
              value={localData.method || 'GET'}
              onChange={e => updateData('method', e.target.value)}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
            <label className="block text-xs font-medium text-gray-600">URL</label>
            <input
              className="w-full rounded border px-2 py-1.5 text-sm"
              value={localData.url || ''}
              onChange={e => updateData('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
            <label className="block text-xs font-medium text-gray-600">Headers</label>
            {Object.entries(localData.headers || {}).map(([key, val]) => (
              <div key={key} className="flex gap-1">
                <input
                  className="flex-1 rounded border px-2 py-1 text-xs"
                  value={key}
                  onChange={e => updateHeader(e.target.value, key, val as string)}
                  placeholder="Key"
                />
                <input
                  className="flex-1 rounded border px-2 py-1 text-xs"
                  value={val as string}
                  onChange={e => updateHeader(key, key, e.target.value)}
                  placeholder="Value"
                />
                <button onClick={() => removeHeader(key)} className="text-red-500 text-xs">X</button>
              </div>
            ))}
            <button onClick={addHeader} className="text-xs text-indigo-600 hover:underline">+ Add header</button>
            <label className="block text-xs font-medium text-gray-600">Body</label>
            <textarea
              className="w-full rounded border px-2 py-1.5 text-sm font-mono"
              rows={4}
              value={localData.body || ''}
              onChange={e => updateData('body', e.target.value)}
              placeholder='{"key": "{{value}}"}'
            />
          </div>
        );
      case 'webhook':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Receives incoming HTTP requests. Connect this node to trigger the workflow.</p>
            <p className="text-xs text-gray-400">Webhook URL: <code className="bg-gray-100 px-1 rounded">POST /webhook/{"{workflowId}"}</code></p>
          </div>
        );
      case 'condition':
        return (
          <div className="space-y-3">
            {(localData.conditions || []).map((cond: any, i: number) => (
              <div key={i} className="rounded border p-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs font-medium">Condition {i + 1}</span>
                  <button onClick={() => removeCondition(i)} className="text-red-500 text-xs">Remove</button>
                </div>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={cond.field}
                  onChange={e => updateCondition(i, 'field', e.target.value)}
                  placeholder="Field name"
                />
                <select
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={cond.operator}
                  onChange={e => updateCondition(i, 'operator', e.target.value)}
                >
                  <option value="eq">Equals</option>
                  <option value="ne">Not equals</option>
                  <option value="gt">Greater than</option>
                  <option value="gte">Greater or equal</option>
                  <option value="lt">Less than</option>
                  <option value="lte">Less or equal</option>
                  <option value="contains">Contains</option>
                  <option value="matches">Matches regex</option>
                </select>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={cond.value}
                  onChange={e => updateCondition(i, 'value', e.target.value)}
                  placeholder="Value"
                />
              </div>
            ))}
            <button onClick={addCondition} className="text-xs text-indigo-600 hover:underline">+ Add condition</button>
            <p className="text-xs text-gray-400 mt-2">Connect the <strong>true</strong> handle for match, <strong>false</strong> for no match.</p>
          </div>
        );
      case 'delay':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-600">Delay (milliseconds)</label>
            <input
              type="number"
              className="w-full rounded border px-2 py-1.5 text-sm"
              value={localData.delayMs || 1000}
              onChange={e => updateData('delayMs', parseInt(e.target.value, 10) || 0)}
              min={0}
              step={100}
            />
            <p className="text-xs text-gray-400">Waits for the specified time before passing data to the next node.</p>
          </div>
        );
      case 'output':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-600">Output template</label>
            <textarea
              className="w-full rounded border px-2 py-1.5 text-sm font-mono"
              rows={4}
              value={localData.outputTemplate || ''}
              onChange={e => updateData('outputTemplate', e.target.value)}
              placeholder='{"result": "{{value}}"}'
            />
            <p className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">{'{{key}}'}</code> to interpolate values from previous nodes.</p>
          </div>
        );
      default:
        return <p className="text-sm text-gray-400">No configuration available</p>;
    }
  };

  return (
    <aside className="w-72 border-l bg-white p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          {NODE_LABELS[node.type as keyof typeof NODE_LABELS] || 'Node'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      {renderConfig()}
    </aside>
  );
}
