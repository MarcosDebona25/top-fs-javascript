import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStopwatch } from './useStopwatch.js';

describe('useStopwatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:30.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  const props = { startedAt: '2026-01-01T00:00:20.000Z', serverTime: '2026-01-01T00:00:30.000Z', penaltyMs: 2000, running: true };

  it('counts from the server start time and adds the penalties', () => {
    const { result } = renderHook(() => useStopwatch(props));
    expect(result.current).toBe(12000);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBeGreaterThanOrEqual(12900);
    expect(result.current).toBeLessThanOrEqual(13100);
  });

  it('is not thrown off by a device clock that disagrees with the server', () => {
    // The server says it is 00:00:30, the device says 00:00:00: still 10 s have passed since the start.
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const { result } = renderHook(() => useStopwatch({ ...props, penaltyMs: 0 }));
    expect(result.current).toBe(10000);
  });

  it('stands still when it is not running', () => {
    const { result } = renderHook(() => useStopwatch({ ...props, running: false }));
    const before = result.current;
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(before);
  });

  it('is zero before there is a game', () => {
    const { result } = renderHook(() => useStopwatch({ startedAt: undefined, penaltyMs: 0, running: false }));
    expect(result.current).toBe(0);
  });
});
