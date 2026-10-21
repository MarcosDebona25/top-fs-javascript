import { describe, expect, it } from 'vitest';
import { elapsedMs, formatPenalty, formatSecondsShort, formatTime, pluralize } from './time.js';

describe('formatTime', () => {
  it('shows m:ss.mmm', () => {
    expect(formatTime(0)).toBe('0:00.000');
    expect(formatTime(42318)).toBe('0:42.318');
    expect(formatTime(72348)).toBe('1:12.348');
    expect(formatTime(60000)).toBe('1:00.000');
  });

  it('does not cap minutes at 59', () => {
    expect(formatTime(75 * 60000 + 3120)).toBe('75:03.120');
  });

  it('pads seconds and milliseconds', () => {
    expect(formatTime(5007)).toBe('0:05.007');
  });

  it('rounds to the millisecond and never goes negative', () => {
    expect(formatTime(1000.6)).toBe('0:01.001');
    expect(formatTime(-50)).toBe('0:00.000');
  });

  it('shows a dash when there is no time', () => {
    expect(formatTime(null)).toBe('—');
    expect(formatTime(undefined)).toBe('—');
    expect(formatTime(Number.NaN)).toBe('—');
  });
});

describe('penalties and plurals', () => {
  it('formats the penalty with its sign', () => {
    expect(formatPenalty(2000)).toBe('+2.000');
    expect(formatPenalty(1500)).toBe('+1.500');
  });

  it('formats the short miss label', () => {
    expect(formatSecondsShort(1000)).toBe('+1.0 s');
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'player')).toBe('1 player');
    expect(pluralize(0, 'player')).toBe('0 players');
    expect(pluralize(2, 'miss', 'misses')).toBe('2 misses');
  });
});

describe('elapsedMs', () => {
  const startedAt = '2026-01-01T00:00:00.000Z';
  const start = Date.parse(startedAt);

  it('adds the penalties to the real time', () => {
    expect(elapsedMs({ startedAt, penaltyMs: 2000, nowMs: start + 10000 })).toBe(12000);
  });

  it('corrects for a skewed device clock', () => {
    // The device clock runs 5 s behind the server's.
    expect(elapsedMs({ startedAt, nowMs: start - 5000 + 10000, clockOffsetMs: 5000 })).toBe(10000);
  });

  it('never returns a negative time', () => {
    expect(elapsedMs({ startedAt, nowMs: start - 1000 })).toBe(0);
  });
});
