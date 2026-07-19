import { describe, it, expect } from 'vitest';
import {
  computeInsuranceDeductions,
  computeMealAllowance,
  computeSalaryBreakdown,
  computeCycleWorkdayInfo,
  computeQuarterlyBonus,
} from '../lib/salary-logic';
import type { CompanyConfig } from '../lib/company-config';

const mockConfig: CompanyConfig = {
  id: 1,
  meal_allowance_per_day: 20000,
  compliance_allowance: 500000,
  insurance_bhxh_rate: 0.08,
  insurance_bhyt_rate: 0.015,
  insurance_bhtn_rate: 0.01,
  loyalty_bonus_per_year: 50000,
  max_loyalty_years: 3,
  skill_bonus_per_tier: 100000,
  payout_months: [1, 4, 7, 10],
  ot_normal_multiplier: 1.5,
  ot_rest_multiplier: 2.0,
  created_at: '',
  updated_at: ''
};

describe('salary-logic', () => {

  describe('computeInsuranceDeductions', () => {
    it('tính đúng bảo hiểm 10.5% (8% + 1.5% + 1%)', () => {
      const basicSalary = 10000000;
      const result = computeInsuranceDeductions(basicSalary, mockConfig);
      expect(result.bhxh).toBe(800000);
      expect(result.bhyt).toBe(150000);
      expect(result.bhtn).toBe(100000);
      expect(result.total).toBe(1050000);
    });

    it('không bị lỗi số thực với số lẻ', () => {
      const basicSalary = 12345678;
      const result = computeInsuranceDeductions(basicSalary, mockConfig);
      expect(result.bhxh).toBe(12345678 * 0.08);
      expect(result.total).toBe(12345678 * 0.105);
    });
  });

  describe('computeMealAllowance', () => {
    it('tính đúng tiền cơm theo số ngày', () => {
      expect(computeMealAllowance(20, mockConfig)).toBe(400000);
      expect(computeMealAllowance(0, mockConfig)).toBe(0);
      expect(computeMealAllowance(26, mockConfig)).toBe(520000);
    });
  });

  describe('computeSalaryBreakdown', () => {
    it('tính lương cơ bản không OT', () => {
      const input = {
        basicSalary: 10000000,
        standardWorkdays: 26,
        actualWorkdays: 26,
        paidLeaveWorkdays: 0,
        annualLeaveWorkdays: 0,
        otNormalMins: 0,
        otRestMins: 0,
      };
      const result = computeSalaryBreakdown(input, mockConfig);
      
      const hourlyRate = 10000000 / (26 * 8); // 48076.92...
      expect(result.hourlyRate).toBeCloseTo(hourlyRate);
      expect(result.dailySalary).toBeCloseTo(hourlyRate * 8);
      expect(result.regularWorkdayPay).toBeCloseTo(10000000);
      expect(result.otNormalPay).toBe(0);
      expect(result.otRestPay).toBe(0);
      expect(result.totalSalaryIncome).toBeCloseTo(10000000);
    });

    it('tính lương có OT thường (1.5x) và OT ngày nghỉ (2.0x)', () => {
      const input = {
        basicSalary: 10400000, // 26 ngày x 8h = 208 giờ -> 50,000 / giờ
        standardWorkdays: 26,
        actualWorkdays: 26,
        paidLeaveWorkdays: 0,
        annualLeaveWorkdays: 0,
        otNormalMins: 120, // 2 giờ
        otRestMins: 240,   // 4 giờ
      };
      const result = computeSalaryBreakdown(input, mockConfig);
      
      expect(result.hourlyRate).toBe(50000);
      expect(result.otNormalPay).toBe(50000 * 2 * 1.5); // 150,000
      expect(result.otRestPay).toBe(50000 * 4 * 2.0);   // 400,000
      expect(result.totalSalaryIncome).toBe(10400000 + 150000 + 400000);
    });

    it('tính lương với ngày nghỉ có phép và không phép', () => {
      const input = {
        basicSalary: 10400000, // 50,000 / giờ
        standardWorkdays: 26,
        actualWorkdays: 24, // Nghỉ 2 ngày (1 ngày có phép, 1 ngày không phép)
        paidLeaveWorkdays: 1, // 1 ngày nghỉ có lương
        annualLeaveWorkdays: 0,
        otNormalMins: 0,
        otRestMins: 0,
      };
      const result = computeSalaryBreakdown(input, mockConfig);
      
      // Tổng số ngày được nhận lương: 24 + 1 = 25 ngày
      // 25 ngày * 400,000/ngày = 10,000,000
      expect(result.regularWorkdayPay).toBe(24 * 400000);
      expect(result.paidLeaveAmount).toBe(1 * 400000);
      expect(result.totalSalaryIncome).toBe(10000000);
    });

    it('không bị lỗi khi standardWorkdays = 0 (tránh chia cho 0)', () => {
      const input = {
        basicSalary: 10000000,
        standardWorkdays: 0,
        actualWorkdays: 10,
        paidLeaveWorkdays: 0,
        annualLeaveWorkdays: 0,
        otNormalMins: 0,
        otRestMins: 0,
      };
      const result = computeSalaryBreakdown(input, mockConfig);
      // Fallback về 1 -> basicSalary / 8 là rate
      const hourlyRate = 10000000 / 8;
      expect(result.hourlyRate).toBe(hourlyRate);
    });
  });

  describe('computeCycleWorkdayInfo', () => {
    it('đếm đúng số ngày làm việc chuẩn trong chu kỳ tháng 5/2024 (21/4 - 20/5)', () => {
      // 21/4/2024 - 20/5/2024: 30 ngày
      // 5 Chủ nhật -> 25 ngày thường
      // 4 Thứ 7 (mỗi T7 tính 0.5) -> 25 - (4 * 0.5) = 23
      const result = computeCycleWorkdayInfo(2024, 5);
      expect(result.baseStandardWorkdays).toBe(23);
      expect(result.baseMealDays).toBe(25);
    });
    
    it('đếm đúng chu kỳ tháng 2/2024 năm nhuận (21/1 - 20/2)', () => {
      // 21/1/2024 - 20/2/2024: 31 ngày
      // 5 Chủ nhật -> 26 ngày thường
      // 4 Thứ 7 -> 26 - (4 * 0.5) = 24
      const result = computeCycleWorkdayInfo(2024, 2);
      expect(result.baseStandardWorkdays).toBe(24);
      expect(result.baseMealDays).toBe(26);
    });
  });
  
  describe('computeQuarterlyBonus', () => {
    it('tính đúng cho tháng không phải trả thưởng (tháng 5)', () => {
      // Hàm chia quý theo tháng 3, 6, 9, 12. Quý 2 bắt đầu từ tháng 4, tháng 5.
      // Ngày vào làm là 2020-01-01, tới ngày chốt (21/04/2024 và 21/05/2024) là 4 năm.
      // Thưởng thâm niên 4 năm * 50k = 200k/tháng.
      // Do tháng 5 là tháng thứ 2 của quý, nên tích lũy là tháng 4 + tháng 5 = 400k.
      const result = computeQuarterlyBonus('2024-05', '2020-01-01', '2020-01-01', mockConfig);
      expect(result.isPayoutMonth).toBe(false);
      expect(result.accumulatedLoyaltyBonus).toBe(400000);
      expect(result.loyaltyBonus).toBe(0); // Vì không phải tháng phát
    });

    it('tính đúng cho tháng phát thưởng (tháng 6)', () => {
      // Tháng 6 là cuối quý 2. Tích lũy 3 tháng (4, 5, 6) = 200k * 3 = 600k.
      const result = computeQuarterlyBonus('2024-06', '2020-01-01', '2020-01-01', mockConfig);
      expect(result.isPayoutMonth).toBe(true);
      expect(result.accumulatedLoyaltyBonus).toBe(600000); 
      expect(result.loyaltyBonus).toBe(600000); 
    });
  });
});
