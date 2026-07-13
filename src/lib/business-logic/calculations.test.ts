import { describe, it, expect } from 'vitest';
import { truncate3, computeCongSp, reverseCalcPcs, computeWeeklyCongSp } from './calculations.js';

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
    // soLuong = 100, dinhMuc = 200
    // cong_sp = 100 / 200 = 0.5
    expect(computeCongSp(100, 200, false)).toBe(0.5);
  });

  it('handles basket logic correctly', () => {
    // soLuong = 35, dinhMuc = 300, basket size = 32
    // 1 full basket (32 pcs) = truncate3(32/300) = 0.106
    // remainder (3 pcs) = 3 * (0.106 / 32) = 0.0099375
    // total = round3(0.106 + 0.0099375) = 0.116
    expect(computeCongSp(35, 300, true)).toBe(0.116);
  });
});

describe('reverseCalcPcs', () => {
  it('calculates pcs needed for target cong non-basket', () => {
    // target = 0.5, dinhMuc = 200
    // 0.5 * 200 = 100 pcs
    expect(reverseCalcPcs(0.5, 200, false)).toBe(100);
  });

  it('calculates pcs for basket logic accurately', () => {
    // basket size = 32, rate = 300
    // congPerBasket = 0.106
    // target = 0.116
    // full baskets = 1 -> 32 pcs
    // remainder -> 3 pcs
    expect(reverseCalcPcs(0.116, 300, true)).toBe(35);
  });
});

describe('computeWeeklyCongSp', () => {
  it('aggregates normal tasks separately', () => {
    const items = [
      { ma_cong_doan: '1.1', so_luong: 100, dinh_muc: 200 },
      { ma_cong_doan: '1.2', so_luong: 150, dinh_muc: 300 }
    ];
    // 100/200 = 0.5. 150/300 = 0.5. Total = 1.0
    expect(computeWeeklyCongSp(items as any)).toBe(1);
  });

  it('aggregates basket logic tasks together', () => {
    const items = [
      { ma_cong_doan: '9.1', so_luong: 15, dinh_muc: 300 },
      { ma_cong_doan: '9.1', so_luong: 17, dinh_muc: 300 } // Total 32 -> 1 full basket
    ];
    // 1 full basket = 0.106
    expect(computeWeeklyCongSp(items as any)).toBe(0.106);
  });

  it('aggregates partial basket correctly', () => {
    const items = [
      { ma_cong_doan: '9.2', so_luong: 32, dinh_muc: 200 }, // 1 full
      { ma_cong_doan: '9.2', so_luong: 5, dinh_muc: 200 } // 5 remainder
    ];
    // 1 full = 0.160. remainder = 5 * (0.160/32) = 0.025. Total = 0.185
    expect(computeWeeklyCongSp(items as any)).toBe(0.185);
  });

  it('handles mixed basket and non-basket', () => {
    const items = [
      { ma_cong_doan: '1.1', so_luong: 100, dinh_muc: 200 }, // 0.5
      { ma_cong_doan: '9.1', so_luong: 30, dinh_muc: 300 }, // Remainder = 30
      { ma_cong_doan: '9.1', so_luong: 12, dinh_muc: 300 }  // Total 42 -> 1 full (0.106) + 10 remainder (0.033125) -> 0.139
    ];
    // 0.5 + 0.139 = 0.639
    expect(computeWeeklyCongSp(items as any)).toBe(0.639);
  });
});
