import { useUIStore } from '@/stores/uiStore';

export async function withFallback<TApi, TLocal>(
  apiCall: () => Promise<TApi>,
  localFallback: () => TLocal
): Promise<{ result: TApi | TLocal; degraded: boolean }> {
  const { apiMode, incrementApiSuccess, resetApiSuccess, setApiMode } = useUIStore.getState();

  if (apiMode === 'offline') {
    return { result: localFallback(), degraded: true };
  }

  try {
    const result = await apiCall();
    incrementApiSuccess();

    // Auto-recovery after 3 consecutive successes
    const { consecutiveApiSuccesses } = useUIStore.getState();
    if (consecutiveApiSuccesses >= 3 && apiMode === 'degraded') {
      setApiMode('active');
    }

    return { result, degraded: false };
  } catch (error) {
    resetApiSuccess();
    setApiMode('degraded');
    console.warn('API call failed, falling back to local mode:', error);
    return { result: localFallback(), degraded: true };
  }
}
