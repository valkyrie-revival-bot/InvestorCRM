'use client';

/**
 * Relationship Graph Component
 * Visualizes network connections between user, LinkedIn contacts, and target investors
 * Uses React Flow for interactive graph visualization
 */

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { IntroPath } from '@/types/linkedin';

// Custom node component for contacts
function ContactNode({ data }: { data: any }) {
  const strengthColors = {
    strong: 'border-green-500 bg-green-50 dark:bg-green-950',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    weak: 'border-gray-500 bg-gray-50 dark:bg-gray-950',
  };

  const strengthColor = strengthColors[data.strength as keyof typeof strengthColors] || strengthColors.weak;

  return (
    <div className={`px-4 py-3 border-2 rounded-lg shadow-md min-w-[200px] ${strengthColor}`}>
      <div className="font-semibold text-sm">{data.label}</div>
      {data.company && (
        <div className="text-xs text-muted-foreground mt-1">{data.company}</div>
      )}
      {data.position && (
        <div className="text-xs text-muted-foreground">{data.position}</div>
      )}
      {data.teamMember && (
        <div className="text-xs mt-2 font-medium text-blue-600 dark:text-blue-400">
          via {data.teamMember}
        </div>
      )}
    </div>
  );
}

// Custom node component for user (center)
function UserNode({ data }: { data: any }) {
  return (
    <div className="px-6 py-4 border-3 border-blue-600 bg-blue-50 dark:bg-blue-950 rounded-full shadow-lg">
      <div className="font-bold text-base text-center">{data.label}</div>
      <div className="text-xs text-center text-muted-foreground mt-1">You</div>
    </div>
  );
}

// Custom node component for investor (target)
function InvestorNode({ data }: { data: any }) {
  return (
    <div className="px-6 py-4 border-3 border-purple-600 bg-purple-50 dark:bg-purple-950 rounded-lg shadow-lg">
      <div className="font-bold text-base text-center">{data.label}</div>
      <div className="text-xs text-center text-muted-foreground mt-1">Target Investor</div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  contact: ContactNode,
  user: UserNode,
  investor: InvestorNode,
};

export interface NetworkGraphData {
  investorName: string;
  connections: IntroPath[];
}

interface RelationshipGraphProps {
  data: NetworkGraphData;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

/**
 * Calculate path strength score for visual weighting
 */
function getPathScore(path: IntroPath): number {
  // Base score from path strength
  let score = path.path_strength * 100;

  // Boost for relationship type
  if (path.relationship_type === 'works_at') score += 20;
  else if (path.relationship_type === 'knows_decision_maker') score += 15;
  else if (path.relationship_type === 'former_colleague') score += 10;

  return Math.min(score, 100);
}

/**
 * Build graph nodes and edges from intro paths
 */
function buildGraph(data: NetworkGraphData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Center node: User
  nodes.push({
    id: 'user',
    type: 'user',
    position: { x: 400, y: 50 },
    data: { label: 'Your Network' },
  });

  // Right node: Target investor
  nodes.push({
    id: 'investor',
    type: 'investor',
    position: { x: 400, y: 500 },
    data: { label: data.investorName },
  });

  // Sort connections by path score (strongest first)
  const sortedConnections = [...data.connections].sort(
    (a, b) => getPathScore(b) - getPathScore(a)
  );

  // Contact nodes: Arrange in middle layer
  const contactCount = sortedConnections.length;
  const horizontalSpacing = Math.min(300, 800 / Math.max(contactCount, 1));
  const startX = 400 - (horizontalSpacing * (contactCount - 1)) / 2;

  sortedConnections.forEach((connection, index) => {
    const nodeId = `contact-${connection.linkedin_contact_id}`;

    // Position contacts in a horizontal line between user and investor
    nodes.push({
      id: nodeId,
      type: 'contact',
      position: {
        x: startX + index * horizontalSpacing,
        y: 275,
      },
      data: {
        label: connection.contact_name,
        company: connection.contact_company,
        position: connection.contact_position,
        teamMember: connection.team_member_name,
        strength: connection.strength_label,
      },
    });

    // Edge: User → Contact
    edges.push({
      id: `user-${nodeId}`,
      source: 'user',
      target: nodeId,
      type: ConnectionLineType.SmoothStep,
      animated: connection.strength_label === 'strong',
      style: {
        stroke: connection.strength_label === 'strong' ? '#10b981' :
                connection.strength_label === 'medium' ? '#eab308' : '#6b7280',
        strokeWidth: connection.strength_label === 'strong' ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: connection.strength_label === 'strong' ? '#10b981' :
               connection.strength_label === 'medium' ? '#eab308' : '#6b7280',
      },
      label: `${connection.team_member_name}'s contact`,
      labelStyle: { fontSize: 10, fill: '#666' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    });

    // Edge: Contact → Investor
    edges.push({
      id: `${nodeId}-investor`,
      source: nodeId,
      target: 'investor',
      type: ConnectionLineType.SmoothStep,
      animated: connection.strength_label === 'strong',
      style: {
        stroke: connection.strength_label === 'strong' ? '#10b981' :
                connection.strength_label === 'medium' ? '#eab308' : '#6b7280',
        strokeWidth: connection.strength_label === 'strong' ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: connection.strength_label === 'strong' ? '#10b981' :
               connection.strength_label === 'medium' ? '#eab308' : '#6b7280',
      },
      label: connection.relationship_type.replace(/_/g, ' '),
      labelStyle: { fontSize: 10, fill: '#666' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    });
  });

  return { nodes, edges };
}

export function RelationshipGraph({ data, onNodeClick }: RelationshipGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(data),
    [data]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        const nodeType = node.type || 'unknown';
        onNodeClick(node.id, nodeType);
      }
    },
    [onNodeClick]
  );

  // Empty state
  if (data.connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground">No connections to visualize</p>
          <p className="text-sm text-muted-foreground mt-2">
            Import LinkedIn contacts to discover warm introduction paths
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: ConnectionLineType.SmoothStep,
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'user') return '#2563eb';
            if (node.type === 'investor') return '#9333ea';
            const strength = node.data.strength as string;
            if (strength === 'strong') return '#10b981';
            if (strength === 'medium') return '#eab308';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
