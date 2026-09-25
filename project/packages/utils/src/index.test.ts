import { describe, expect, it } from 'vitest';
import {
  decodeSearchCursor,
  encodeSearchCursor,
  formatDistance,
  isValidCoordinate,
  isValidCuid,
  normalizeSearchText,
} from './index';

describe('formatDistance', () => {
  it('formats metres below one kilometre', () => {
    expect(formatDistance(850)).toBe('850 m');
  });

  it('formats kilometres with a Portuguese decimal comma', () => {
    expect(formatDistance(1200)).toBe('1,2 km');
  });

  it('returns null without a valid distance', () => {
    expect(formatDistance(null)).toBeNull();
    expect(formatDistance(Number.NaN)).toBeNull();
  });
});

describe('search cursor helpers', () => {
  it('round-trips a cursor', () => {
    const cursor = { relevanceRank: 2, distanceMeters: 1234.5, cuid: 'c12345678901234567890123' };
    expect(decodeSearchCursor(encodeSearchCursor(cursor))).toEqual(cursor);
  });

  it('rejects malformed cursors', () => {
    expect(decodeSearchCursor('not-a-cursor')).toBeNull();
    expect(decodeSearchCursor('1:not-a-number:c12345678901234567890123')).toBeNull();
  });
});

describe('text and validation helpers', () => {
  it('normalizes Portuguese diacritics for search', () => {
    expect(normalizeSearchText('  Á opto  ')).toBe('a opto');
  });

  it('validates coordinates and CUID-shaped identifiers', () => {
    expect(isValidCoordinate(-8.8, 13.2)).toBe(true);
    expect(isValidCoordinate(91, 13.2)).toBe(false);
    expect(isValidCuid('c12345678901234567890123')).toBe(true);
    expect(isValidCuid('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
  });
});
