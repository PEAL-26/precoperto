import { describe, expect, it } from '@jest/globals';
import { formatDistance } from '@precoperto/utils';

describe('mobile shared formatting', () => {
  it('formats nearby distances in Portuguese', () => {
    expect(formatDistance(850)).toBe('850 m');
    expect(formatDistance(2400)).toBe('2,4 km');
  });
});
