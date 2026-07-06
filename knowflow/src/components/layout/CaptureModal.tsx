'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import WikiLinkAutocomplete from '@/components/ui/WikiLinkAutocomplete';
import { useUIStore } from '@/stores/uiStore';
import { useEntryStore } from '@/stores/entryStore';
import { useI18n } from '@/lib/i18n';
import { ProcessingScenario } from '@/types/entry';
import { processEntry } from '@/lib/ai/process';

export default function CaptureModal() {
  const { isCaptureOpen, toggleCapture } = useUIStore();
  const { createEntry, updateEntry, loadEntries } = useEntryStore();
  const { t } = useI18n();

  // Load entries when modal opens (for wiki-link autocomplete)
  useEffect(() => {
    if (isCaptureOpen) {
      loadEntries();
    }
  }, [isCaptureOpen, loadEntries]);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState<'paste' | 'url' | 'file' | 'manual'>('paste');
  const [scenario, setScenario] = useState<ProcessingScenario>('quick_capture');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      const entry = await createEntry({
        userId: '',
        title: rawText.slice(0, 50) + (rawText.length > 50 ? '...' : ''),
        rawText,
        language: 'en',
        sourceType,
        category: '',
        tags: [],
        summary: '',
        keywords: [],
        angles: [],
        goldenQuotes: [],
        extractedNodes: [],
        linkedEntryIds: [],
        markdownContent: '',
        cardStatus: {
          card1: 'pending',
          card2: 'pending',
          card3: 'pending',
          card4: 'pending',
        },
        scenario,
        processingMode: 'local',
      });

      // Run processing pipeline
      const updates = await processEntry(entry, scenario);
      await updateEntry(entry.id, updates);

      toggleCapture();
      setStep(1);
      setRawText('');
      router.push(`/library/?id=${entry.id}`);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isCaptureOpen}
      onClose={toggleCapture}
      title={step === 1 ? t('capture.title') : t('capture.scenario')}
    >
      {step === 1 ? (
        <div className="space-y-4">
          <WikiLinkAutocomplete
            value={rawText}
            onChange={setRawText}
            placeholder={t('capture.placeholder')}
            className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
          />
          <div className="flex gap-2">
            {(['paste', 'url', 'file', 'manual'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSourceType(type)}
                className={`px-3 py-1 text-sm rounded ${
                  sourceType === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {t(`source.${type}` as 'source.paste')}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={!rawText.trim()}>
              {t('capture.next')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {([
              { value: 'quick_capture', labelKey: 'scenario.quick' as const, descKey: 'scenario.quick.desc' as const },
              { value: 'deep_digest', labelKey: 'scenario.deep' as const, descKey: 'scenario.deep.desc' as const },
              { value: 'writing_material', labelKey: 'scenario.writing' as const, descKey: 'scenario.writing.desc' as const },
              { value: 'knowledge_link', labelKey: 'scenario.link' as const, descKey: 'scenario.link.desc' as const },
            ]).map(option => (
              <label
                key={option.value}
                className={`block p-3 border rounded-lg cursor-pointer ${
                  scenario === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={option.value}
                  checked={scenario === option.value}
                  onChange={() => setScenario(option.value as ProcessingScenario)}
                  className="sr-only"
                />
                <div className="font-medium">{t(option.labelKey)}</div>
                <div className="text-sm text-gray-500">{t(option.descKey)}</div>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleBack}>
              {t('capture.back')}
            </Button>
            <Button onClick={handleStart} disabled={isProcessing}>
              {isProcessing ? t('capture.processing') || '处理中...' : t('capture.start')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
