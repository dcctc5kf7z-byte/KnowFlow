export const en: Record<string, string> = {
  // Navigation
  'nav.library': '📚 Library',
  'nav.graph': '🕸️ Graph',
  'nav.settings': '⚙️ Settings',

  // Home
  'home.loading': 'Loading...',
  'home.empty.title': 'Start capturing knowledge',
  'home.empty.desc': 'Click the + button to capture your first piece of knowledge. KnowFlow will help you organize, categorize, and connect your ideas.',

  // Capture Modal
  'capture.title': 'Capture Knowledge',
  'capture.scenario': 'Choose Scenario',
  'capture.placeholder': 'Paste text or type here...',
  'capture.next': 'Next →',
  'capture.back': '← Back',
  'capture.start': 'Start Processing',

  // Scenarios
  'scenario.quick': 'Quick Capture',
  'scenario.quick.desc': 'Local rules only',
  'scenario.deep': 'Deep Digest',
  'scenario.deep.desc': 'Full AI analysis',
  'scenario.writing': 'Writing Material',
  'scenario.writing.desc': 'Focus on quotes/angles',
  'scenario.link': 'Knowledge Link',
  'scenario.link.desc': 'Focus on connections',

  // Source types
  'source.paste': 'paste',
  'source.url': 'url',
  'source.file': 'file',
  'source.manual': 'manual',

  // Search
  'search.placeholder': 'Search entries, tags, concepts...',
  'search.noResults': 'No results found',
  'search.searching': 'Searching...',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.quickOps': 'Quick Operations',
  'settings.export': 'Export Data',
  'settings.import': 'Import Data',
  'settings.aiConfig': 'AI Configuration',
  'settings.aiMode': 'AI Mode',
  'settings.localOnly': 'Local Only',
  'settings.apiOnly': 'API Only',
  'settings.autoRecommended': 'Auto (Recommended)',
  'settings.apiKey': 'API Key',
  'settings.apiKeyPlaceholder': 'Enter your API key',
  'settings.budget': 'Monthly Budget (USD)',
  'settings.dataMgmt': 'Data Management',
  'settings.pendingSync': 'Pending sync items',
  'settings.clearData': 'Clear All Data',
  'settings.save': 'Save Settings',
  'settings.saving': 'Saving...',
  'settings.saved': 'Settings saved!',

  // Entry Detail
  'detail.input': '📥 Input & Record',
  'detail.categorize': '🧩 Categorize & Classify',
  'detail.angles': '❓ Recommended Angles',
  'detail.extract': '🔬 Extract & Connect',
  'detail.notProcessed': 'Not processed yet',
  'detail.noAngles': 'No angles generated yet. Process this card to get recommendations.',
  'detail.selectAngles': 'Select angles that interest you (optional):',
  'detail.noQuotes': 'No quotes extracted yet. Process this card to extract golden quotes.',
  'detail.goldenQuotes': 'Golden Quotes',
  'detail.remove': 'Remove',
  'detail.connectedNodes': 'Connected Nodes',
  'detail.noConnections': 'No connections created yet. Process this card to connect to existing knowledge.',
  'detail.rawText': 'Raw Text',
  'detail.sourceUrl': 'Source URL (optional)',
  'detail.language': 'Language',
  'detail.category': 'Category',
  'detail.subCategory': 'Sub-category',
  'detail.tags': 'Tags',
  'detail.addTag': 'Add tag and press Enter',
  'detail.summary': 'Summary',
  'detail.keywords': 'Keywords',

  // Graph
  'graph.empty.title': 'Your knowledge garden is just starting',
  'graph.empty.desc': 'Add more entries to see your knowledge graph grow. Your ideas will connect and form a beautiful network.',

  // Login
  'login.signIn': 'Sign in to sync your knowledge',
  'login.continueAnon': 'Continue without account',

  // Common
  'common.loading': 'Loading...',
  'common.notFound': 'Entry not found',
  'common.exportSoon': 'Export feature coming soon',
  'common.importSoon': 'Import feature coming soon',
};

export type TranslationKey = keyof typeof en;
