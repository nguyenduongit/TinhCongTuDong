/**
 * =============================================================================
 * LOGIC TÍNH LƯƠNG (Salary Logic)
 * =============================================================================
 * Tập hợp các hàm tính toán lương thuần túy (pure functions).
 *
 * NGUYÊN TẮC:
 *   - Không import bất kỳ thứ gì từ React (useState, useEffect, v.v.)
 *   - Tất cả giá trị cấu hình được NHẬN qua tham số `config: CompanyConfig`
 *   - Đầu vào và đầu ra đều là plain objects / primitives
 *   - Mỗi hàm có thể test độc lập không cần DOM
 *
 * Khi admin panel cập nhật config trên DB → useCompanyConfig() hook trả về
 * config mới → truyền vào các hàm này → kết quả tự động cập nhật đúng.
 * =============================================================================
 */

import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { getWorkMinutesForDay } from './work-rules.js';
import { getCycleStringFromYearMonth } from './date-utils.js';
import type { CompanyConfig } from './company-config.js';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface DailyRecord {
  ngay: string;
  thoi_gian_thuc_hien: number;
  thoi_gian_ho_tro?: number;
  thong_ke_ngay?: {
    is_ngay_nghi?: boolean;
    loai_nghi?: 'nghi_huong_luong' | 'nghi_phep' | string;
  };
}

export interface CycleAttendanceSummary {
  /** Số ngày công thực tế đi làm (Thứ 7 = 0.5) */
  actualWorkdays: number;
  /** Số phút tăng ca ngày thường (Thứ 2–6) */
  otNormalMins: number;
  /** Số phút tăng ca ngày nghỉ/cuối tuần */
  otRestMins: number;
  /** Số ngày công nghỉ hưởng lương (Thứ 7 = 0.5) */
  paidLeaveWorkdays: number;
  /** Số ngày công nghỉ phép (Thứ 7 = 0.5) */
  annualLeaveWorkdays: number;
  /** Số ngày vật lý nghỉ hưởng lương (để tính tiền cơm) */
  paidLeavePhysical: number;
  /** Số ngày vật lý nghỉ phép (để tính tiền cơm) */
  annualLeavePhysical: number;
}

export interface CycleWorkdayInfo {
  /** Số ngày công chuẩn theo lịch (Thứ 7 = 0.5) */
  baseStandardWorkdays: number;
  /** Số ngày làm việc vật lý (không tính CN) để tính tiền cơm */
  baseMealDays: number;
}

export interface QuarterlyBonusResult {
  /** Thưởng thâm niên phát trong tháng này (0 nếu chưa đến quý phát) */
  loyaltyBonus: number;
  /** Thưởng tay nghề phát trong tháng này (0 nếu chưa đến quý phát) */
  skillBonus: number;
  /** Tổng thâm niên tích lũy từ đầu quý đến tháng này */
  accumulatedLoyaltyBonus: number;
  /** Tổng tay nghề tích lũy từ đầu quý đến tháng này */
  accumulatedSkillBonus: number;
  /** Tháng cuối quý (tháng phát thưởng): 3, 6, 9, hoặc 12 */
  nextPayoutMonth: number;
  /** true nếu tháng hiện tại là tháng phát thưởng */
  isPayoutMonth: boolean;
}

export interface InsuranceDeductions {
  bhxh: number;
  bhyt: number;
  bhtn: number;
  total: number;
}

export interface SalaryBreakdownInput {
  basicSalary: number;
  standardWorkdays: number;
  actualWorkdays: number;
  paidLeaveWorkdays: number;
  annualLeaveWorkdays: number;
  otNormalMins: number;
  otRestMins: number;
}

export interface SalaryBreakdown {
  hourlyRate: number;
  dailySalary: number;
  regularWorkdayPay: number;
  paidLeaveAmount: number;
  annualLeaveAmount: number;
  otNormalPay: number;
  otRestPay: number;
  totalSalaryIncome: number;
}

// ---------------------------------------------------------------------------
// HÀM TÍNH TOÁN
// ---------------------------------------------------------------------------

/**
 * Phân tích các bản ghi chấm công trong chu kỳ để tổng hợp:
 * ngày đi làm, phút tăng ca, ngày nghỉ hưởng lương, ngày nghỉ phép.
 *
 * Hàm này tách bạch logic phân tích data khỏi component UI.
 */
export function computeCycleAttendance(records: DailyRecord[]): CycleAttendanceSummary {
  let actualWk = 0, otNorm = 0, otRest = 0;
  let pw = 0, aw = 0, pp = 0, ap = 0;

  for (const r of records) {
    const date = new Date(r.ngay);
    const day = date.getDay();

    if (r.thong_ke_ngay?.is_ngay_nghi) {
      const val = day === 6 ? 0.5 : 1;
      if (r.thong_ke_ngay.loai_nghi === 'nghi_huong_luong') {
        pw += val; pp += 1;
      } else if (r.thong_ke_ngay.loai_nghi === 'nghi_phep') {
        aw += val; ap += 1;
      }
    }

    if (r.thoi_gian_thuc_hien > 0) {
      if (day >= 1 && day <= 5) {
        actualWk += 1;
        const stdMins = getWorkMinutesForDay(day);
        if (r.thoi_gian_thuc_hien > stdMins) {
          otNorm += r.thoi_gian_thuc_hien - stdMins;
        }
      } else if (day === 6) {
        actualWk += 0.5;
        const stdMins = getWorkMinutesForDay(day);
        if (r.thoi_gian_thuc_hien > stdMins) {
          otRest += r.thoi_gian_thuc_hien - stdMins;
        }
      } else if (day === 0) {
        otRest += r.thoi_gian_thuc_hien;
      }
    }
  }

  return {
    actualWorkdays: actualWk,
    otNormalMins: otNorm,
    otRestMins: otRest,
    paidLeaveWorkdays: pw,
    annualLeaveWorkdays: aw,
    paidLeavePhysical: pp,
    annualLeavePhysical: ap,
  };
}

/**
 * Tính số ngày công chuẩn và số ngày ăn cơm trong một chu kỳ tháng.
 * Thay thế vòng lặp thủ công trong tinh-luong.tsx.
 *
 * @param year  Năm của tháng công
 * @param month Tháng công (1-indexed)
 */
export function computeCycleWorkdayInfo(year: number, month: number): CycleWorkdayInfo {
  const { cycleStartStr, cycleEndStr } = getCycleStringFromYearMonth(year, month);
  const startDate = new Date(cycleStartStr + 'T00:00:00');
  const endDate   = new Date(cycleEndStr   + 'T00:00:00');

  let mCount = 0; // ngày ăn cơm (vật lý, không tính CN)
  let sCount = 0; // ngày công chuẩn (Thứ 7 = 0.5)

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const day = cur.getDay();
    if (day !== 0) {          // Bỏ Chủ Nhật
      mCount++;
      sCount += day === 6 ? 0.5 : 1;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return { baseStandardWorkdays: sCount, baseMealDays: mCount };
}

/**
 * Tính thưởng thâm niên và tay nghề theo quý.
 * Thưởng được tích lũy trong quý và phát vào tháng cuối quý (3, 6, 9, 12).
 *
 * @param salaryMonth  Tháng lương dạng 'yyyy-MM'
 * @param joinDate     Ngày vào công ty dạng 'yyyy-MM-dd' (hoặc null)
 * @param contractDate Ngày ký HĐ dạng 'yyyy-MM-dd' (hoặc null)
 * @param config       Company config chứa mức thưởng
 */
export function computeQuarterlyBonus(
  salaryMonth: string,
  joinDate: string | null | undefined,
  contractDate: string | null | undefined,
  config: CompanyConfig
): QuarterlyBonusResult {
  const [yearStr, monthStr] = salaryMonth.split('-');
  const year  = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  /** Tính mức thưởng cho một tháng bất kỳ */
  const calcForMonth = (y: number, m: number): { lBonus: number; sBonus: number } => {
    let lBonus = 0;
    let sBonus = 0;
    const { cycleStartStr } = getCycleStringFromYearMonth(y, m);
    const cycleStart = new Date(cycleStartStr + 'T00:00:00');

    if (joinDate) {
      try {
        const years = differenceInYears(cycleStart, parseISO(joinDate));
        if (years > 0) lBonus = years * config.loyalty_bonus_per_year;
      } catch { /* ngày không hợp lệ */ }
    }

    if (contractDate) {
      try {
        const months = differenceInMonths(cycleStart, parseISO(contractDate));
        if (months >= config.skill_bonus_threshold_months) {
          sBonus = config.skill_bonus_amount;
        }
      } catch { /* ngày không hợp lệ */ }
    }

    return { lBonus, sBonus };
  };

  const currentQuarter     = Math.ceil(month / 3);
  const startMonthOfQuarter = (currentQuarter - 1) * 3 + 1;
  const payoutMonth        = currentQuarter * 3;
  const isPayout           = month === payoutMonth;

  let accL = 0;
  let accS = 0;

  for (let m = startMonthOfQuarter; m <= month; m++) {
    const { lBonus, sBonus } = calcForMonth(year, m);
    accL += lBonus;
    accS += sBonus;
  }

  return {
    loyaltyBonus:            isPayout ? accL : 0,
    skillBonus:              isPayout ? accS : 0,
    accumulatedLoyaltyBonus: accL,
    accumulatedSkillBonus:   accS,
    nextPayoutMonth:         payoutMonth,
    isPayoutMonth:           isPayout,
  };
}

/**
 * Tính các khoản khấu trừ bảo hiểm bắt buộc.
 *
 * @param basicSalary Lương cơ bản (mức đóng BH)
 * @param config      Company config chứa tỷ lệ
 */
export function computeInsuranceDeductions(
  basicSalary: number,
  config: CompanyConfig
): InsuranceDeductions {
  const bhxh = basicSalary * config.insurance_bhxh_rate;
  const bhyt = basicSalary * config.insurance_bhyt_rate;
  const bhtn = basicSalary * config.insurance_bhtn_rate;
  return { bhxh, bhyt, bhtn, total: bhxh + bhyt + bhtn };
}

/**
 * Tính chi tiết lương cơ bản, nghỉ phép và tăng ca.
 *
 * @param input  Các số liệu ngày công và giờ tăng ca
 * @param config Company config chứa hệ số tăng ca
 */
export function computeSalaryBreakdown(
  input: SalaryBreakdownInput,
  config: CompanyConfig
): SalaryBreakdown {
  const { basicSalary, standardWorkdays, actualWorkdays,
          paidLeaveWorkdays, annualLeaveWorkdays,
          otNormalMins, otRestMins } = input;

  const safeStdDays = standardWorkdays || 1;
  const hourlyRate  = basicSalary / (safeStdDays * 8);
  const dailySalary = hourlyRate * 8;

  const regularWorkdayPay = actualWorkdays    * dailySalary;
  const paidLeaveAmount   = paidLeaveWorkdays * dailySalary;
  const annualLeaveAmount = annualLeaveWorkdays * dailySalary;

  const otNormalPay = hourlyRate * (otNormalMins / 60) * config.ot_normal_multiplier;
  const otRestPay   = hourlyRate * (otRestMins   / 60) * config.ot_rest_multiplier;

  const totalSalaryIncome =
    regularWorkdayPay + paidLeaveAmount + annualLeaveAmount + otNormalPay + otRestPay;

  return {
    hourlyRate,
    dailySalary,
    regularWorkdayPay,
    paidLeaveAmount,
    annualLeaveAmount,
    otNormalPay,
    otRestPay,
    totalSalaryIncome,
  };
}

/**
 * Tính tiền ăn cơm.
 *
 * @param mealDays Số ngày ăn cơm thực tế
 * @param config   Company config chứa mức tiền cơm/ngày
 */
export function computeMealAllowance(mealDays: number, config: CompanyConfig): number {
  return mealDays * config.meal_allowance_per_day;
}

/**
 * Tiện ích format tiền VND — dùng chung trong UI không phụ thuộc logic.
 */
export function formatVND(num: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}
