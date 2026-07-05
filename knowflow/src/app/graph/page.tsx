'use client';

import { useEffect } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { useEntryStore } from '@/stores/entryStore';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';

export default function GraphPage() {
  const { loadNodes } = useNodeStore();
  const { loadEntries } = useEntryStore();

  useEffect(() => {
    loadNodes();
    loadEntries();
  }, [loadNodes, loadEntries]);

  return <KnowledgeGraph />;
}
