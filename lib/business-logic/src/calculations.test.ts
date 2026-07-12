import { describe, it, expect } from 'vitest';
import { truncate3, computeCongSp, reverseCalcPcs } from './calculations.js';

describe('truncate3', () => {
  it('truncates instead of rounding up', () => {
    expect(truncate3(1.1239)).toBe(1.123);
    expect(truncate3(5.9999)).toBe(5.999);
  });

  it('keeps exact decimals if less than 3', () => {
    expect(truncate3(1.1)).toBe(1.1);
    expect(truncate3(2)).toBe(2);
  });

  it('handles invalid inputs gracefully', () => {
    expect(truncate3(NaN)).toBe(0);
    expect(truncate3('string' as any)).toBe(0);
  });
});

describe('computeCongSp', () => {
  it('calculates normally for non-basket logic', () => {
    // soLuong = 100, dinhMuc = 200, phanTram = 100
    // cong_sp = 100 / (200 * 1) = 0.5
    expect(computeCongSp(100, 200, 100, false)).toBe(0.5);
  });

  it('handles custom percentage', () => {
    // soLuong = 100, dinhMuc = 200, phanTram = 50
    // rate = 200 * 0.5 = 100
    // cong_sp = 100 / 100 = 1
    expect(computeCongSp(100, 200, 50, false)).toBe(1);
  });

  it('handles basket logic correctly', () => {
    // soLuong = 35, dinhMuc = 300, phanTram = 100, basket size = 32
    // 1 full basket (32 pcs) = truncate3(32 / 300) = 0.106
    // remainder (3 pcs) = truncate3(3 / 300) = 0.010
    // total = 0.106 + 0.010 = 0.116
    expect(computeCongSp(35, 300, 100, true)).toBe(0.116);
  });
});

describe('reverseCalcPcs', () => {
  it('calculates pcs needed for target cong non-basket', () => {
    // target = 0.5, dinhMuc = 200
    // 0.5 * 200 = 100 pcs
    expect(reverseCalcPcs(0.5, 200, 100, false)).toBe(100);
  });

  it('calculates pcs for basket logic accurately', () => {
    // basket size = 32, rate = 300
    // congPerBasket = 0.106
    // target = 0.116
    // full baskets = 1 -> 32 pcs
    // remainder = 0.010 -> 3 pcs
    expect(reverseCalcPcs(0.116, 300, 100, true)).toBe(35);
  });
});
