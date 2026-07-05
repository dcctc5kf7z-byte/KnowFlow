'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useEntryStore } from '@/stores/entryStore';
import EntryDetail from '@/components/entry/EntryDetail';

export default function EntryPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentEntry, isLoading, loadEntry } = useEntryStore();

  useEffect(() => {
    if (id) {
      loadEntry(id);
    }
  }, [id, loadEntry]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!currentEntry) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Entry not found</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <EntryDetail entry={currentEntry} />
    </div>
  );
}
