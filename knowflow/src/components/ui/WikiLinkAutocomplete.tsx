'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEntryStore } from '@/stores/entryStore';

interface WikiLinkAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export default function WikiLinkAutocomplete({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 6,
}: WikiLinkAutocompleteProps) {
  const { entries } = useEntryStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerPos, setTriggerPos] = useState<number | null>(null);

  // Filter entries by the text typed after [[
  const filteredEntries = entries.filter(e =>
    e.title.toLowerCase().includes(filterText.toLowerCase())
  ).slice(0, 8); // Max 8 suggestions

  // Detect [[ trigger in text
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);

    // Check if we just typed [[
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastOpen = textBeforeCursor.lastIndexOf('[[');

    if (lastOpen >= 0) {
      // Check there's no closing ]] between [[ and cursor
      const textAfterOpen = textBeforeCursor.slice(lastOpen + 2);
      if (!textAfterOpen.includes(']]')) {
        setTriggerPos(lastOpen);
        setFilterText(textAfterOpen);
        setShowDropdown(true);
        setSelectedIndex(0);
        return;
      }
    }

    setShowDropdown(false);
    setTriggerPos(null);
  }, [onChange]);

  // Handle keyboard navigation in dropdown
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || filteredEntries.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filteredEntries.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filteredEntries.length) % filteredEntries.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      // Only intercept if dropdown is showing and has entries
      if (showDropdown && filteredEntries.length > 0) {
        e.preventDefault();
        insertLink(filteredEntries[selectedIndex].title);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setTriggerPos(null);
    }
  }, [showDropdown, filteredEntries, selectedIndex]);

  // Insert selected wiki-link
  const insertLink = useCallback((title: string) => {
    if (triggerPos === null || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const before = value.slice(0, triggerPos);
    const after = value.slice(cursorPos);
    const newText = `${before}[[${title}]]${after}`;

    onChange(newText);
    setShowDropdown(false);
    setTriggerPos(null);

    // Set cursor after the inserted link
    const newCursorPos = triggerPos + title.length + 4; // [[ + title + ]]
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [triggerPos, value, onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Calculate dropdown position
  const getDropdownStyle = (): React.CSSProperties => {
    if (!textareaRef.current || triggerPos === null) return { display: 'none' };

    const textarea = textareaRef.current;
    const textBeforeTrigger = value.slice(0, triggerPos);
    const lines = textBeforeTrigger.split('\n');
    const currentLine = lines.length;
    const lineHeight = 24; // Approximate line height

    return {
      position: 'absolute',
      bottom: `${(rows - currentLine + 1) * lineHeight + 8}px`,
      left: '12px',
      zIndex: 50,
    };
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />
      {showDropdown && filteredEntries.length > 0 && (
        <div
          ref={dropdownRef}
          style={getDropdownStyle()}
          className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-[200px]"
        >
          {filteredEntries.map((entry, i) => (
            <button
              key={entry.id}
              onClick={() => insertLink(entry.title)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                i === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{entry.title}</span>
              {entry.category && (
                <span className="ml-2 text-xs text-gray-400">{entry.category}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
