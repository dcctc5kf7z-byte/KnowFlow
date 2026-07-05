'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';

export default function SettingsPage() {
  const { apiMode, setApiMode, language, setLanguage } = useUIStore();
  const { t } = useI18n();
  const [apiKey, setApiKey] = useState('');
  const [budget, setBudget] = useState('10');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    alert(t('settings.saved'));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Language */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{t('settings.language')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg ${
              language === 'en'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('zh')}
            className={`px-4 py-2 rounded-lg ${
              language === 'zh'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            中文
          </button>
        </div>
      </section>

      {/* Quick Operations */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{t('settings.quickOps')}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => alert(t('common.exportSoon'))}>
            {t('settings.export')}
          </Button>
          <Button variant="secondary" onClick={() => alert(t('common.importSoon'))}>
            {t('settings.import')}
          </Button>
        </div>
      </section>

      {/* AI Configuration */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{t('settings.aiConfig')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.aiMode')}
            </label>
            <div className="flex gap-2">
              {(['local', 'api', 'auto'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setApiMode(mode === 'auto' ? 'active' : mode === 'local' ? 'offline' : 'active')}
                  className={`px-4 py-2 rounded-lg ${
                    (mode === 'auto' && apiMode === 'active') ||
                    (mode === 'local' && apiMode === 'offline') ||
                    (mode === 'api' && apiMode === 'active')
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {mode === 'local' ? t('settings.localOnly') : mode === 'api' ? t('settings.apiOnly') : t('settings.autoRecommended')}
                </button>
              ))}
            </div>
          </div>
          <Input
            label={t('settings.apiKey')}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('settings.apiKeyPlaceholder')}
          />
          <Input
            label={t('settings.budget')}
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            step="1"
          />
        </div>
      </section>

      {/* Data Management */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{t('settings.dataMgmt')}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('settings.pendingSync')}</span>
            <span className="text-sm font-medium">0</span>
          </div>
          <Button variant="ghost" className="text-red-600">
            {t('settings.clearData')}
          </Button>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
