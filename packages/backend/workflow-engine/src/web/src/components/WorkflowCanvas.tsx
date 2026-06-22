import { useCallback, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuid } from '../uuid';
import ApiNode from './nodes/ApiNode';
import WebhookNode from './nodes/WebhookNode';
import ConditionNode from './nodes/ConditionNode';
import DelayNode from './nodes/DelayNode';
import OutputNode from './nodes/OutputNode';
import { NodeType, WorkflowDefinition as WD } from '../types';

const nodeTypes: NodeTypes = {
  api: ApiNode,
  webhook: WebhookNode,
  condition: ConditionNode,
  delay: DelayNode,
  output: OutputNode,
};

interface Props {
  onNodeSelect: (id: string | null) => void;
}

export interface CanvasHandle {
  getWorkflow: () => WD;
  loadWorkflow: (wf: WD) => void;
}

function WorkflowCanvasInner(props: Props, ref: React.Ref<CanvasHandle>) {
  const { onNodeSelect } = props;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useImperativeHandle(ref, () => ({
    getWorkflow: () => ({
      id: '',
      name: '',
      description: '',
      status: 'DRAFT',
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type as NodeType,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || '',
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    }),
    loadWorkflow: (wf: WD) => {
      if (!wf.nodes) {
        setNodes([]);
        setEdges([]);
        return;
      }
      setNodes(
        wf.nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
      );
      setEdges(
        wf.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
      );
    },
  }));

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge({ ...connection, id: uuid() }, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: uuid(),
        type,
        position,
        data: getDefaultData(type),
      };

      setNodes(nds => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full" style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Backspace"
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

function getDefaultData(type: NodeType) {
  switch (type) {
    case 'api':
      return { method: 'GET', url: '', headers: {}, body: '' };
    case 'webhook':
      return {};
    case 'condition':
      return { conditions: [{ field: '', operator: 'eq' as const, value: '' }] };
    case 'delay':
      return { delayMs: 1000 };
    case 'output':
      return { outputTemplate: '' };
    default:
      return {};
  }
}

const WorkflowCanvasInnerForwarded = forwardRef(WorkflowCanvasInner);

export default function WorkflowCanvas(props: Props & { ref?: React.Ref<CanvasHandle> }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInnerForwarded ref={props.ref} onNodeSelect={props.onNodeSelect} />
    </ReactFlowProvider>
  );
}

// TODO: add undo/redo support for canvas operations
