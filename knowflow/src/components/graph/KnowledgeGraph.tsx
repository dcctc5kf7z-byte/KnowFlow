'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNodeStore } from '@/stores/nodeStore';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  entryIds: string[];
  /** Number of connections */
  degree: number;
  /** Category for clustering */
  cluster: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
}

const CLUSTER_COLORS: Record<string, string> = {
  keyword: '#3b82f6',
  concept: '#8b5cf6',
  person: '#10b981',
  tool: '#f59e0b',
  other: '#6b7280',
  default: '#3b82f6',
};

const CLUSTER_LABELS: Record<string, string> = {
  keyword: '关键词',
  concept: '概念',
  person: '人物',
  tool: '工具',
  other: '其他',
};

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { nodes } = useNodeStore();
  const { entries } = useEntryStore();
  const { t } = useI18n();
  const router = useRouter();

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);

  // Build graph data
  useEffect(() => {
    if (nodes.length === 0) {
      setGraphNodes([]);
      setGraphLinks([]);
      return;
    }

    // Calculate node degrees
    const degreeMap = new Map<string, number>();
    const linkSet = new Set<string>();

    nodes.forEach(node => {
      node.entryIds.forEach(entryId => {
        nodes.forEach(other => {
          if (other.id === node.id) return;
          if (other.entryIds.includes(entryId)) {
            const key = [node.id, other.id].sort().join('-');
            if (!linkSet.has(key)) {
              linkSet.add(key);
              degreeMap.set(node.id, (degreeMap.get(node.id) || 0) + 1);
              degreeMap.set(other.id, (degreeMap.get(other.id) || 0) + 1);
            }
          }
        });
      });
    });

    const gNodes: GraphNode[] = nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      entryIds: n.entryIds,
      degree: degreeMap.get(n.id) || 0,
      cluster: n.type,
    }));

    const gLinks: GraphLink[] = [];
    const linkSeen = new Set<string>();
    nodes.forEach(node => {
      node.entryIds.forEach(entryId => {
        const targetNode = nodes.find(n => n.id !== node.id && n.entryIds.includes(entryId));
        if (targetNode) {
          const linkKey = [node.id, targetNode.id].sort().join('-');
          if (!linkSeen.has(linkKey)) {
            linkSeen.add(linkKey);
            gLinks.push({
              source: node.id,
              target: targetNode.id,
              weight: 1,
            });
          }
        }
      });
    });

    // Run simulation
    const simulation = forceSimulation(gNodes)
      .force('link', forceLink<GraphNode, GraphLink>(gLinks)
        .id(d => d.id)
        .distance(120))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(400, 300))
      .force('collide', forceCollide().radius(d => getNodeRadius(d as GraphNode) + 10))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    setGraphNodes([...gNodes]);
    setGraphLinks([...gLinks as unknown as GraphLink[]]);
  }, [nodes, entries]);

  const getNodeRadius = useCallback((node: GraphNode) => {
    const base = 12;
    const bonus = Math.min(node.degree * 3, 15);
    return base + bonus;
  }, []);

  const getNodeColor = useCallback((node: GraphNode) => {
    return CLUSTER_COLORS[node.cluster] || CLUSTER_COLORS.default;
  }, []);

  const isNodeHighlighted = useCallback((nodeId: string) => {
    if (!hoveredNode && !selectedNode) return true;
    const active = hoveredNode || selectedNode;
    if (nodeId === active) return true;

    // Check if connected to active node
    return graphLinks.some(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return (sourceId === active && targetId === nodeId) ||
             (targetId === active && sourceId === nodeId);
    });
  }, [hoveredNode, selectedNode, graphLinks]);

  const isLinkHighlighted = useCallback((link: GraphLink) => {
    if (!hoveredNode && !selectedNode) return true;
    const active = hoveredNode || selectedNode;
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return sourceId === active || targetId === active;
  }, [hoveredNode, selectedNode]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.entryIds.length > 0) {
      router.push(`/library/${node.entryIds[0]}`);
    }
  }, [router]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setViewBox(prev => ({
      x: prev.x + prev.width * 0.1,
      y: prev.y + prev.height * 0.1,
      width: prev.width * 0.8,
      height: prev.height * 0.8,
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewBox(prev => ({
      x: prev.x - prev.width * 0.125,
      y: prev.y - prev.height * 0.125,
      width: prev.width * 1.25,
      height: prev.height * 1.25,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setViewBox({ x: 0, y: 0, width: 800, height: 600 });
  }, []);

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('graph.empty.title')}
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          {t('graph.empty.desc')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{nodes.length} 个节点</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">{graphLinks.length} 条连接</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
            title="放大"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
            title="缩小"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-xs"
            title="重置视图"
          >
            重置
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {Object.entries(CLUSTER_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CLUSTER_COLORS[type] }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div ref={containerRef} className="relative">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="w-full h-[60vh] border rounded-lg bg-white cursor-grab active:cursor-grabbing"
          style={{ background: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)' }}
        >
          {/* Grid dots for depth */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.5" fill="#e5e7eb" />
            </pattern>
          </defs>
          <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#grid)" />

          {/* Links */}
          {graphLinks.map((link, i) => {
            const source = typeof link.source === 'string'
              ? graphNodes.find(n => n.id === link.source)
              : link.source as GraphNode;
            const target = typeof link.target === 'string'
              ? graphNodes.find(n => n.id === link.target)
              : link.target as GraphNode;

            if (!source || !target) return null;

            const highlighted = isLinkHighlighted(link);

            return (
              <line
                key={`link-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={highlighted ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={highlighted ? 1.5 : 0.5}
                strokeOpacity={highlighted ? 0.8 : 0.3}
              />
            );
          })}

          {/* Nodes */}
          {graphNodes.map(node => {
            const radius = getNodeRadius(node);
            const color = getNodeColor(node);
            const highlighted = isNodeHighlighted(node.id);
            const isActive = node.id === (hoveredNode || selectedNode);

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node)}
                style={{ opacity: highlighted ? 1 : 0.2 }}
              >
                {/* Glow effect for active node */}
                {isActive && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={0.3}
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={color}
                  className="transition-all duration-200"
                  style={{
                    filter: isActive ? `drop-shadow(0 0 6px ${color})` : 'none',
                  }}
                />

                {/* Label */}
                <text
                  x={node.x}
                  y={(node.y || 0) + radius + 12}
                  textAnchor="middle"
                  className="text-xs pointer-events-none select-none"
                  style={{
                    fill: highlighted ? '#374151' : '#9ca3af',
                    fontSize: '11px',
                    fontWeight: isActive ? '600' : '400',
                  }}
                >
                  {node.label.length > 12 ? node.label.slice(0, 10) + '...' : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-white border rounded-lg shadow-lg p-3 text-sm max-w-xs pointer-events-none">
            {(() => {
              const node = graphNodes.find(n => n.id === hoveredNode);
              if (!node) return null;
              return (
                <>
                  <div className="font-medium">{node.label}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    {CLUSTER_LABELS[node.type] || node.type} · {node.degree} 条连接 · {node.entryIds.length} 个条目
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
