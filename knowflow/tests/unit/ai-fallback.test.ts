import { withFallback } from '@/lib/ai/fallback';
import { useUIStore } from '@/stores/uiStore';

describe('withFallback', () => {
  beforeEach(() => {
    useUIStore.setState({
      apiMode: 'active',
      consecutiveApiSuccesses: 0,
    });
  });

  it('returns API result when API succeeds', async () => {
    const apiCall = jest.fn().mockResolvedValue('api-result');
    const localFallback = jest.fn().mockReturnValue('local-result');

    const result = await withFallback(apiCall, localFallback);

    expect(result).toEqual({ result: 'api-result', degraded: false });
    expect(apiCall).toHaveBeenCalled();
    expect(localFallback).not.toHaveBeenCalled();
  });

  it('returns local fallback when API fails', async () => {
    const apiCall = jest.fn().mockRejectedValue(new Error('API error'));
    const localFallback = jest.fn().mockReturnValue('local-result');

    const result = await withFallback(apiCall, localFallback);

    expect(result).toEqual({ result: 'local-result', degraded: true });
    expect(localFallback).toHaveBeenCalled();
  });

  it('sets degraded mode on API failure', async () => {
    const apiCall = jest.fn().mockRejectedValue(new Error('fail'));
    const localFallback = jest.fn().mockReturnValue('fallback');

    await withFallback(apiCall, localFallback);

    expect(useUIStore.getState().apiMode).toBe('degraded');
  });

  it('resets success counter on API failure', async () => {
    useUIStore.setState({ consecutiveApiSuccesses: 2 });
    const apiCall = jest.fn().mockRejectedValue(new Error('fail'));
    const localFallback = jest.fn().mockReturnValue('fallback');

    await withFallback(apiCall, localFallback);

    expect(useUIStore.getState().consecutiveApiSuccesses).toBe(0);
  });

  it('increments success counter on API success', async () => {
    const apiCall = jest.fn().mockResolvedValue('ok');
    const localFallback = jest.fn().mockReturnValue('fallback');

    await withFallback(apiCall, localFallback);

    expect(useUIStore.getState().consecutiveApiSuccesses).toBe(1);
  });

  it('recovers from degraded after 3 consecutive successes', async () => {
    useUIStore.setState({ apiMode: 'degraded', consecutiveApiSuccesses: 2 });
    const apiCall = jest.fn().mockResolvedValue('ok');
    const localFallback = jest.fn().mockReturnValue('fallback');

    await withFallback(apiCall, localFallback);

    expect(useUIStore.getState().apiMode).toBe('active');
    expect(useUIStore.getState().consecutiveApiSuccesses).toBe(3);
  });

  it('does not recover before 3 consecutive successes', async () => {
    useUIStore.setState({ apiMode: 'degraded', consecutiveApiSuccesses: 0 });
    const apiCall = jest.fn().mockResolvedValue('ok');
    const localFallback = jest.fn().mockReturnValue('fallback');

    await withFallback(apiCall, localFallback);

    expect(useUIStore.getState().apiMode).toBe('degraded');
    expect(useUIStore.getState().consecutiveApiSuccesses).toBe(1);
  });

  it('skips API call when offline', async () => {
    useUIStore.setState({ apiMode: 'offline' });
    const apiCall = jest.fn().mockResolvedValue('api');
    const localFallback = jest.fn().mockReturnValue('local');

    const result = await withFallback(apiCall, localFallback);

    expect(result).toEqual({ result: 'local', degraded: true });
    expect(apiCall).not.toHaveBeenCalled();
    expect(localFallback).toHaveBeenCalled();
  });
});
