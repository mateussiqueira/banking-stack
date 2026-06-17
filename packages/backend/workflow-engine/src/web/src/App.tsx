import { useState, useCallback, useRef } from 'react';
import WorkflowCanvas from './components/WorkflowCanvas';
import Sidebar from './components/Sidebar';
import NodeConfigPanel from './components/NodeConfigPanel';
import { WorkflowDefinition as WD } from './types';

export default function App() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<{ getWorkflow: () => WD; loadWorkflow: (w: WD) => void }>(null);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    const wf = canvasRef.current.getWorkflow();
    const body = { ...wf, name: workflowName };
    try {
      const res = await fetch('/api/workflows', {
        method: wf.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      canvasRef.current?.loadWorkflow(saved);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }, [workflowName]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <input
              className="text-lg font-semibold bg-transparent border-none outline-none"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
            />
            <span className="text-xs text-gray-400">Banking Workflow Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => canvasRef.current?.loadWorkflow({} as WD)}
              className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              New
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>
        <div className="flex flex-1">
          <div className="flex-1">
            <WorkflowCanvas ref={canvasRef} onNodeSelect={setSelectedNodeId} />
          </div>
          <NodeConfigPanel nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />
        </div>
      </div>
    </div>
  );
}
