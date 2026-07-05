import { getSupabase } from '@/lib/db/supabase';

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface AIGenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerateResult<T> {
  success: boolean;
  data?: {
    result: T;
    cost: CostEstimate;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function aiGenerate<T>(
  task: string,
  input: string,
  options?: AIGenerateOptions
): Promise<AIGenerateResult<T>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('ai-generate', {
      body: { task, input, options },
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'FUNCTION_ERROR',
          message: error.message,
        },
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: String(error),
      },
    };
  }
}

export async function processCardWithAPI(
  task: string,
  input: string
): Promise<AIGenerateResult<unknown>> {
  return aiGenerate(task, input);
}
