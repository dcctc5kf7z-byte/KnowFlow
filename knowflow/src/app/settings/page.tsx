'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { exportAllData, importData } from '@/lib/utils/export';
import { db } from '@/lib/db/dexie';

export default function SettingsPage() {
  const { apiMode, setApiMode, language, setLanguage } = useUIStore();
  const { t } = useI18n();
  const [apiKey, setApiKey] = useState('');
  const [budget, setBudget] = useState('10');
  const [isSaving, setIsSaving] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Load saved settings and counts
  useEffect(() => {
    const savedKey = localStorage.getItem('knowflow-api-key') || '';
    const savedBudget = localStorage.getItem('knowflow-budget') || '10';
    setApiKey(savedKey);
    setBudget(savedBudget);

    db.entries.count().then(setEntryCount);
    db.nodes.count().then(setNodeCount);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem('knowflow-api-key', apiKey);
    localStorage.setItem('knowflow-budget', budget);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsSaving(false);
    showFeedback(t('settings.saved') || '已保存');
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowflow-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showFeedback('导出成功');
    } catch (err) {
      showFeedback('导出失败');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importData(text);
        const count = await db.entries.count();
        setEntryCount(count);
        showFeedback(`导入成功，当前 ${count} 条记录`);
      } catch (err) {
        showFeedback('导入失败：文件格式错误');
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可撤销。')) return;
    await db.entries.clear();
    await db.nodes.clear();
    setEntryCount(0);
    setNodeCount(0);
    showFeedback('数据已清除');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg">
          {feedback}
        </div>
      )}

      {/* Language */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{t('settings.language')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              language === 'en'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('zh')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              language === 'zh'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            中文
          </button>
        </div>
      </section>

      {/* Quick Operations */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{t('settings.quickOps')}</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={handleExport}>
            📤 {t('settings.export') || '导出数据'}
          </Button>
          <Button variant="secondary" onClick={handleImport}>
            📥 {t('settings.import') || '导入数据'}
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    (mode === 'auto' && apiMode === 'active') ||
                    (mode === 'local' && apiMode === 'offline') ||
                    (mode === 'api' && apiMode === 'active')
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'local' ? '🏠 本地模式' : mode === 'api' ? '☁️ API 模式' : '🔄 自动（推荐）'}
                </button>
              ))}
            </div>
          </div>
          <Input
            label={t('settings.apiKey')}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />
          <Input
            label={t('settings.budget') || '月度预算（次）'}
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">条目数量</span>
            <span className="text-sm font-medium">{entryCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">知识节点</span>
            <span className="text-sm font-medium">{nodeCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">存储使用</span>
            <span className="text-sm font-medium">
              {typeof navigator !== 'undefined' && 'storage' in navigator ? '已启用' : '不支持'}
            </span>
          </div>
          <hr />
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
            onClick={handleClearData}
          >
            🗑 {t('settings.clearData') || '清除所有数据'}
          </Button>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('settings.saving') || '保存中...' : t('settings.save') || '保存设置'}
        </Button>
      </div>

      {/* About */}
      <section className="p-4 bg-white border rounded-lg text-sm text-gray-500">
        <p>KnowFlow v0.1.0 — AI 知识助手</p>
        <p className="mt-1">数据存储在本地浏览器中，无需账号即可使用。</p>
      </section>
    </div>
  );
}
