import { describe, expect, it } from 'vitest';
import { DAYS_OF_WEEK, PRODUCT_STATUSES, PRODUCT_TYPES, USER_ROLES } from './index';

describe('domain constants', () => {
  it('keeps V1 enum values aligned with the database contract', () => {
    expect(USER_ROLES).toEqual(['admin', 'user']);
    expect(PRODUCT_TYPES).toEqual(['product', 'service']);
    expect(PRODUCT_STATUSES).toEqual(['active', 'inactive', 'archived']);
    expect(DAYS_OF_WEEK).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
