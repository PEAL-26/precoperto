import { describe, expect, it } from 'vitest';
import { productSchema, registerSchema, storeHoursSchema } from './index';

describe('registerSchema', () => {
  it('normalizes the email and accepts a valid registration', () => {
    const result = registerSchema.parse({
      name: 'Ana Silva',
      email: ' ANA@EXAMPLE.COM ',
      password: 'secret123',
      latitude: '-8.83',
      longitude: '13.23',
    });

    expect(result.email).toBe('ana@example.com');
    expect(result.latitude).toBe(-8.83);
  });

  it('rejects an invalid location', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret123',
      latitude: 100,
      longitude: 13,
    });

    expect(result.success).toBe(false);
  });
});

describe('productSchema', () => {
  it('accepts AOA products and services', () => {
    const result = productSchema.safeParse({
      name: 'Arroz 5kg',
      type: 'product',
      category_cuid: 'c12345678901234567890123',
      price: '6500',
      currency: 'AOA',
      description: '',
      status: 'active',
    });

    expect(result.success).toBe(true);
  });
});

describe('storeHoursSchema', () => {
  it('requires opening and closing times for an open day', () => {
    const result = storeHoursSchema.safeParse({
      day_of_week: 1,
      is_closed: false,
    });

    expect(result.success).toBe(false);
  });

  it('allows a closed day without times', () => {
    const result = storeHoursSchema.safeParse({ day_of_week: 0, is_closed: true });
    expect(result.success).toBe(true);
  });
});
