'use client';

import { Entry } from '@/types/entry';

interface Card4Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card4Extract({ entry, onUpdate }: Card4Props) {
  const goldenQuotes = entry.goldenQuotes || [];
  const extractedNodes = entry.extractedNodes || [];

  const removeQuote = (quoteId: string) => {
    onUpdate({ goldenQuotes: goldenQuotes.filter(q => q.id !== quoteId) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Golden Quotes
        </label>
        <div className="space-y-2">
          {goldenQuotes.map(quote => (
            <div key={quote.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm italic text-gray-800">&ldquo;{quote.text}&rdquo;</div>
              {quote.context && (
                <div className="text-xs text-gray-500 mt-1">{quote.context}</div>
              )}
              <button
                onClick={() => removeQuote(quote.id)}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {goldenQuotes.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No quotes extracted yet. Process this card to extract golden quotes.
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Connected Nodes
        </label>
        <div className="text-sm text-gray-600">
          {extractedNodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {extractedNodes.map(nodeId => (
                <span
                  key={nodeId}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                >
                  Node: {nodeId.slice(0, 8)}...
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">
              No connections created yet. Process this card to connect to existing knowledge.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
