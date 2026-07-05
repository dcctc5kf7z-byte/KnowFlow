'use client';

import { useEffect, useRef, useState } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import { forceSimulation, forceLink, forceManyBody, forceCenter, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string;
  target: string;
}

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { nodes } = useNodeStore();
  const { entries } = useEntryStore();
  const { t } = useI18n();
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const gNodes: GraphNode[] = nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
    }));

    const gLinks: GraphLink[] = [];
    const linkSet = new Set<string>();
    nodes.forEach(node => {
      node.entryIds.forEach(entryId => {
        const targetNode = nodes.find(n => n.id !== node.id && n.entryIds.includes(entryId));
        if (targetNode) {
          const linkKey = [node.id, targetNode.id].sort().join('-');
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            gLinks.push({ source: node.id, target: targetNode.id });
          }
        }
      });
    });

    const simulation = forceSimulation(gNodes)
      .force('link', forceLink(gLinks).id((d) => (d as GraphNode).id).distance(100))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(400, 300))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    setGraphNodes([...gNodes]);
    setGraphLinks([...gLinks as unknown as GraphLink[]]);
  }, [nodes, entries]);

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
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="w-full h-[60vh] border rounded-lg bg-gray-50"
      >
        {graphLinks.map((link, i) => {
          const source = graphNodes.find(n => n.id === (link.source as unknown as string));
          const target = graphNodes.find(n => n.id === (link.target as unknown as string));
          if (!source || !target) return null;
          return (
            <line
              key={`link-${i}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#d1d5db"
              strokeWidth={1}
            />
          );
        })}
        {graphNodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={20}
              fill="#3b82f6"
              className="cursor-pointer hover:fill-blue-700"
            />
            <text
              x={node.x}
              y={(node.y || 0) + 30}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
