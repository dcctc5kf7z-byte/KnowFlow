export interface UserSettings {
  userId: string;
  aiMode: 'local' | 'api' | 'auto';
  apiKey?: string;
  apiProvider: 'openai' | 'anthropic';
  monthlyBudgetUsd: number;
  currentMonthSpendUsd: number;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}
