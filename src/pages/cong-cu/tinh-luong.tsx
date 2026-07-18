import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';
import { useGetThongTinLuong, useListSanLuong, useCompanyConfig, useGetSalaryTiers, useUpdateProfile } from '@/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { parseISO, format, addMonths, subMonths } from 'date-fns';
import { useLocation } from 'wouter';
import { getCycleStringFromYearMonth } from '@/lib/date-utils';
import {
  computeCycleWorkdayInfo,
  computeCycleAttendance,
  computeQuarterlyBonus,
  computeInsuranceDeductions,
  computeSalaryBreakdown,
  computeMealAllowance,
  formatVND,
} from '@/lib/salary-logic';

type DynamicItem = { id: string; name: string; amount: string };

export default function SalaryCalculatorPage() {
  const [, setLocation] = useLocation();
  const { data: initialData, isLoading: isLoadingProfile } = useGetThongTinLuong();
  const { data: salaryTiers = [], isLoading: isLoadingTiers } = useGetSalaryTiers();
  const updateMutation = useUpdateProfile();

  const isLoading = isLoadingProfile || isLoadingTiers;

  // Lấy mức lương dựa trên bậc lương (hoặc trả về 0 nếu chưa chọn bậc)
  const userTier = initialData?.bac_luong;
  const numBasicSalary = useMemo(() => {
    if (!userTier) return 0;
    const matched = salaryTiers.find(t => t.tier_code === userTier);
    return matched ? matched.base_salary : 0;
  }, [userTier, salaryTiers]);
  const joinDate = initialData?.ngay_vao_cong_ty || '';
  const contractDate = initialData?.ngay_ky_hop_dong || '';

  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const [salaryMonth, setSalaryMonth] = useState<string>(currentMonthStr);
  const isCurrentMonth = salaryMonth === currentMonthStr;

  // Lấy config công ty (tự fallback về defaults nếu DB chưa có)
  const { config } = useCompanyConfig();

  const handlePrevMonth = () => {
    const d = parseISO(salaryMonth + '-01');
    setSalaryMonth(format(subMonths(d, 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    if (!isCurrentMonth) {
      const d = parseISO(salaryMonth + '-01');
      setSalaryMonth(format(addMonths(d, 1), 'yyyy-MM'));
    }
  };

  // Tiền lương states
  const [customStandardWorkdays, setCustomStandardWorkdays] = useState<string>('');
  const [customPaidLeaveDays, setCustomPaidLeaveDays] = useState<string>('');
  const [customAnnualLeaveDays, setCustomAnnualLeaveDays] = useState<string>('');
  const [customActualWorkdays, setCustomActualWorkdays] = useState<string>('');

  // Phụ cấp states
  const [customMealDays, setCustomMealDays] = useState<string>('');
  const [mealOverride, setMealOverride] = useState<string>('');
  const [complianceOverride, setComplianceOverride] = useState<string>('');
  const [kindergartenSupport, setKindergartenSupport] = useState<string>('');
  const [shift2Allowance, setShift2Allowance] = useState<string>('');
  const [menstrualStartDate, setMenstrualStartDate] = useState<string>('');
  const [otherAllowances, setOtherAllowances] = useState<DynamicItem[]>([]);

  // Thưởng states
  const [otherBonuses, setOtherBonuses] = useState<DynamicItem[]>([]);

  // Khấu trừ states
  const [personalIncomeTax, setPersonalIncomeTax] = useState<string>('');
  const [advance, setAdvance] = useState<string>('');
  const [otherDeductions, setOtherDeductions] = useState<DynamicItem[]>([]);

  // ─── Chu kỳ ký công ────────────────────────────────────────────────────
  const { cycleStartStr, cycleEndStr } = useMemo(() => {
    const [yearStr, monthStr] = salaryMonth.split('-');
    return getCycleStringFromYearMonth(parseInt(yearStr, 10), parseInt(monthStr, 10));
  }, [salaryMonth]);

  // ─── Ngày công chuẩn & ngày ăn cơm ─────────────────────────────────────
  const { baseStandardWorkdays, baseMealDays } = useMemo(() => {
    const [yearStr, monthStr] = salaryMonth.split('-');
    return computeCycleWorkdayInfo(parseInt(yearStr, 10), parseInt(monthStr, 10));
  }, [salaryMonth]);

  useEffect(() => {
    setCustomStandardWorkdays('');
    setCustomMealDays('');
    setCustomPaidLeaveDays('');
    setCustomAnnualLeaveDays('');
    setCustomActualWorkdays('');

    setKindergartenSupport('');
    setShift2Allowance('');
    setOtherAllowances([]);

    setOtherBonuses([]);

    setPersonalIncomeTax('');
    setAdvance('');
    setOtherDeductions([]);
  }, [salaryMonth]);

  useEffect(() => {
    if (initialData?.menstrual_dates) {
      setMenstrualStartDate(initialData.menstrual_dates[salaryMonth] || '');
    } else {
      setMenstrualStartDate('');
    }
  }, [salaryMonth, initialData?.menstrual_dates]);

  const { data: cycleRecords } = useListSanLuong({ startDate: cycleStartStr, endDate: cycleEndStr });

  const {
    dbActualWorkdays,
    autoOtNormalMins,
    autoOtWeeklyRestMins,
    dbPaidLeaveWorkdays,
    dbAnnualLeaveWorkdays,
    dbPaidLeavePhysical,
    dbAnnualLeavePhysical
  } = useMemo(() => {
    const result = computeCycleAttendance((cycleRecords || []) as any[]);
    return {
      dbActualWorkdays:      result.actualWorkdays,
      autoOtNormalMins:      result.otNormalMins,
      autoOtWeeklyRestMins:  result.otRestMins,
      dbPaidLeaveWorkdays:   result.paidLeaveWorkdays,
      dbAnnualLeaveWorkdays: result.annualLeaveWorkdays,
      dbPaidLeavePhysical:   result.paidLeavePhysical,
      dbAnnualLeavePhysical: result.annualLeavePhysical,
    };
  }, [cycleRecords]);

  const numPaidLeaveDays   = customPaidLeaveDays   !== '' ? (Number(customPaidLeaveDays)   || 0) : dbPaidLeaveWorkdays;
  const numAnnualLeaveDays = customAnnualLeaveDays !== '' ? (Number(customAnnualLeaveDays) || 0) : dbAnnualLeaveWorkdays;

  const activeStandardWorkdays  = customStandardWorkdays !== '' ? (Number(customStandardWorkdays) || 0) : baseStandardWorkdays;
  const numStandardWorkdays      = activeStandardWorkdays || 26;
  const calculatedActualWorkdays = Math.max(0, activeStandardWorkdays - numPaidLeaveDays - numAnnualLeaveDays);
  const numActualWorkdays        = customActualWorkdays !== '' ? (Number(customActualWorkdays) || 0) : calculatedActualWorkdays;

  // ─── Tính lương (dùng salary-logic + config từ DB) ────────────────────
  const salaryBreakdown = useMemo(() => computeSalaryBreakdown({
    basicSalary:          numBasicSalary,
    standardWorkdays:     numStandardWorkdays,
    actualWorkdays:       numActualWorkdays,
    paidLeaveWorkdays:    numPaidLeaveDays,
    annualLeaveWorkdays:  numAnnualLeaveDays,
    otNormalMins:         autoOtNormalMins,
    otRestMins:           autoOtWeeklyRestMins,
  }, config), [numBasicSalary, numStandardWorkdays, numActualWorkdays,
               numPaidLeaveDays, numAnnualLeaveDays,
               autoOtNormalMins, autoOtWeeklyRestMins, config]);

  const { hourlyRate, dailySalary, regularWorkdayPay, paidLeaveAmount,
          annualLeaveAmount, otNormalPay, otRestPay: otWeeklyRestPay,
          totalSalaryIncome } = salaryBreakdown;

  // ─── Tính tiền cơm & phụ cấp ─────────────────────────────────────────
  const physicalPaidLeave  = customPaidLeaveDays   !== '' ? numPaidLeaveDays   : dbPaidLeavePhysical;
  const physicalAnnualLeave = customAnnualLeaveDays !== '' ? numAnnualLeaveDays : dbAnnualLeavePhysical;

  const calculatedMealDays = Math.max(0, baseMealDays - physicalPaidLeave - physicalAnnualLeave);
  const numMealDays        = customMealDays !== '' ? (Number(customMealDays) || 0) : calculatedMealDays;

  const defaultMealAllowance = computeMealAllowance(numMealDays, config);
  const mealAllowance        = mealOverride !== '' ? (Number(mealOverride.replace(/\D/g, '')) || 0) : defaultMealAllowance;
  const numComplianceAllowance = complianceOverride !== '' ? (Number(complianceOverride.replace(/\D/g, '')) || 0) : config.compliance_allowance;
  const numKindergartenSupport = Number(kindergartenSupport.replace(/\D/g, '')) || 0;
  const numShift2Allowance = Number(shift2Allowance.replace(/\D/g, '')) || 0;

  // Tính trợ cấp hành kinh
  const isFemale = initialData?.gioi_tinh === 'nu';
  const validMenstrualDays = useMemo(() => {
    if (!isFemale || !menstrualStartDate || !cycleRecords) return 0;
    
    // Tìm 3 ngày làm việc liên tiếp bắt đầu từ menstrualStartDate
    const dates: string[] = [];
    let curDate = new Date(menstrualStartDate);
    while (dates.length < 3) {
      if (curDate.getDay() !== 0) { // Bỏ qua Chủ Nhật
        dates.push(format(curDate, 'yyyy-MM-dd'));
      }
      curDate.setDate(curDate.getDate() + 1);
    }

    // Đếm số ngày thực tế có đi làm (thoi_gian_thuc_hien > 0 và không phải ngày nghỉ phép)
    let validCount = 0;
    dates.forEach(d => {
      const record = (cycleRecords as any[]).find(r => r.ngay === d);
      if (record && record.thoi_gian_thuc_hien > 0 && !record.thong_ke_ngay?.is_ngay_nghi) {
        validCount++;
      }
    });
    return validCount;
  }, [isFemale, menstrualStartDate, cycleRecords]);

  const baseDailySalary = numBasicSalary / numStandardWorkdays;
  // 30 phút = 1/16 của ngày 8 tiếng (480 phút)
  const menstrualAllowance = validMenstrualDays * (baseDailySalary / 16);

  const sumOtherAllowances = otherAllowances.reduce((acc, item) => acc + (Number(item.amount.replace(/\D/g, '')) || 0), 0);
  const totalAllowance     = mealAllowance + numComplianceAllowance + numKindergartenSupport + numShift2Allowance + menstrualAllowance + sumOtherAllowances;

  // ─── Thưởng thâm niên & tay nghề ─────────────────────────────────────
  const { loyaltyBonus, skillBonus, accumulatedLoyaltyBonus, accumulatedSkillBonus,
          nextPayoutMonth, isPayoutMonth } = useMemo(
    () => computeQuarterlyBonus(salaryMonth, joinDate, contractDate, config),
    [salaryMonth, joinDate, contractDate, config]
  );

  const sumOtherBonuses = otherBonuses.reduce((acc, item) => acc + (Number(item.amount.replace(/\D/g, '')) || 0), 0);
  const totalBonus      = loyaltyBonus + skillBonus + sumOtherBonuses;

  // ─── Khấu trừ ─────────────────────────────────────────────────────────
  const insurance      = useMemo(() => computeInsuranceDeductions(numBasicSalary, config), [numBasicSalary, config]);
  const { bhxh, bhyt, bhtn } = insurance;
  const tax                  = Number(personalIncomeTax.replace(/\D/g, '')) || 0;
  const adv                  = Number(advance.replace(/\D/g, '')) || 0;
  const sumOtherDeductions   = otherDeductions.reduce((acc, item) => acc + (Number(item.amount.replace(/\D/g, '')) || 0), 0);
  const totalDeductions      = insurance.total + tax + adv + sumOtherDeductions;

  const grossIncome = totalSalaryIncome + totalAllowance + totalBonus;
  const netIncome   = grossIncome - totalDeductions;


  const renderDynamicList = (title: string, list: DynamicItem[], setList: React.Dispatch<React.SetStateAction<DynamicItem[]>>) => {
    return (
      <div className="space-y-3 mt-4 border-t border-white/5 pt-5">
        <div className="flex justify-between items-center">
          <Label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">{title}</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setList([...list, { id: Math.random().toString(), name: '', amount: '' }])}
            className="h-8 text-xs px-3 bg-white/5 border-white/10 hover:bg-white/10 text-foreground rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
          </Button>
        </div>
        {list.map((item, idx) => (
          <div key={item.id} className="flex gap-2 items-center">
            <Input
              placeholder="Tên khoản..."
              value={item.name}
              onChange={(e) => {
                const newList = [...list];
                newList[idx].name = e.target.value;
                setList(newList);
              }}
              className="h-11 rounded-2xl flex-1 text-sm bg-black/20 border-white/10 focus-visible:ring-primary/50 shadow-inner"
            />
            <Input
              placeholder="Số tiền..."
              value={item.amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                const newList = [...list];
                newList[idx].amount = raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '';
                setList(newList);
              }}
              inputMode="numeric"
              className="h-11 rounded-2xl w-[110px] text-right font-bold bg-black/20 border-white/10 focus-visible:ring-primary/50 shadow-inner"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setList(list.filter((_, i) => i !== idx))}
              className="h-11 w-11 shrink-0 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-colors"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden">
      <div className="w-full max-w-[430px] mx-auto bg-background flex flex-col h-[100dvh] relative">
        <div className="w-full relative pb-[20px] h-full overflow-y-auto flex flex-col hide-scrollbar">
          {/* Nền Blur tổng thể */}
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/10 via-emerald-500/5 to-amber-500/10 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2 z-0" />
        
        <motion.div
          className="flex-1 px-5 pt-8 flex flex-col gap-6 relative z-10"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.header variants={pageItemVariants} className="flex justify-between items-center mb-1 sticky top-0 z-20 bg-background/50 backdrop-blur-md -mx-5 px-5 py-4 -mt-8 pt-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <button 
                onClick={() => setLocation('/')}
                className="w-10 h-10 -ml-2 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors shadow-sm outline-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              Tính Lương
            </h1>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]">
              <Calculator className="w-5 h-5" />
            </div>
          </motion.header>

          {/* Month picker dạng Pill */}
          <motion.div variants={pageItemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-full p-1.5 flex items-center justify-between shadow-sm mx-auto w-full max-w-[280px]">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center justify-center flex-1">
              <span className="text-[13px] font-bold text-foreground capitalize tracking-wide">
                Tháng {format(parseISO(salaryMonth + '-01'), 'M, yyyy')}
              </span>
              {isCurrentMonth && (
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5 bg-primary/10 px-2 py-0.5 rounded-full">
                  Hiện tại
                </span>
              )}
            </div>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Khối Lương Thực Lãnh (Net) đập ngay vào mắt */}
          <motion.div variants={pageItemVariants} className="relative w-full">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 via-emerald-500/20 to-amber-500/30 rounded-[2.5rem] blur-xl opacity-60 pointer-events-none" />
            <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-7 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] -ml-10 -mb-10 pointer-events-none" />
              
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Thực lãnh (Net)</h2>
              <span className="font-black text-[42px] leading-none bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent drop-shadow-sm tracking-tight mb-2">
                {formatVND(netIncome)}
              </span>
              <p className="text-[11px] font-medium text-zinc-500">Tiền chuyển vào tài khoản ngân hàng</p>
            </div>
          </motion.div>

          {/* Mini Dashboard Tóm tắt 4 phần */}
          <motion.div variants={pageItemVariants} className="grid grid-cols-2 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-1">Lương</span>
              <span className="font-bold text-amber-400 text-lg">{formatVND(totalSalaryIncome)}</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/80 mb-1">Phụ cấp</span>
              <span className="font-bold text-blue-400 text-lg">{formatVND(totalAllowance)}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-1">Thưởng</span>
              <span className="font-bold text-emerald-400 text-lg">{formatVND(totalBonus)}</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80 mb-1">Khấu trừ</span>
              <span className="font-bold text-rose-400 text-lg">-{formatVND(totalDeductions)}</span>
            </div>
          </motion.div>

          {/* 1. Tổng tiền lương */}
          <motion.div variants={pageItemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-lg flex flex-col gap-4 relative overflow-hidden mt-2">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-500 to-amber-500/20" />
            <h2 className="text-lg font-bold text-amber-500 pl-2">1. Chi tiết Lương</h2>
            <div className="space-y-5 mt-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="standardWorkdays" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Ngày chuẩn</Label>
                  <Input
                    id="standardWorkdays"
                    value={customStandardWorkdays !== '' ? customStandardWorkdays : baseStandardWorkdays.toString()}
                    onChange={(e) => setCustomStandardWorkdays(e.target.value.replace(/[^0-9.]/g, ''))}
                    inputMode="decimal"
                    className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-amber-500/50 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualWorkdays" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Ngày thực tế</Label>
                  <Input
                    id="actualWorkdays"
                    value={customActualWorkdays !== '' ? customActualWorkdays : calculatedActualWorkdays.toString()}
                    onChange={(e) => setCustomActualWorkdays(e.target.value.replace(/[^0-9.]/g, ''))}
                    inputMode="decimal"
                    className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paidLeaveDays" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Nghỉ hưởng lương</Label>
                  <Input
                    id="paidLeaveDays"
                    value={customPaidLeaveDays !== '' ? customPaidLeaveDays : dbPaidLeaveWorkdays.toString()}
                    onChange={(e) => setCustomPaidLeaveDays(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0"
                    inputMode="decimal"
                    className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-amber-500/50 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualLeaveDays" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Nghỉ phép năm</Label>
                  <Input
                    id="annualLeaveDays"
                    value={customAnnualLeaveDays !== '' ? customAnnualLeaveDays : dbAnnualLeaveWorkdays.toString()}
                    onChange={(e) => setCustomAnnualLeaveDays(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0"
                    inputMode="decimal"
                    className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-amber-500/50 shadow-inner"
                  />
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 space-y-3 mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-medium">Lương ngày thường</span>
                  <span className="font-bold text-foreground">{formatVND(regularWorkdayPay)}</span>
                </div>
                {numPaidLeaveDays > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Nghỉ hưởng lương</span>
                    <span className="font-bold text-foreground">{formatVND(paidLeaveAmount)}</span>
                  </div>
                )}
                {numAnnualLeaveDays > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">Nghỉ phép năm</span>
                    <span className="font-bold text-foreground">{formatVND(annualLeaveAmount)}</span>
                  </div>
                )}
                {autoOtNormalMins > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">OT thường ({(autoOtNormalMins / 60).toFixed(1)}h × 1.5)</span>
                    <span className="font-bold text-foreground">{formatVND(otNormalPay)}</span>
                  </div>
                )}
                {autoOtWeeklyRestMins > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-medium">OT nghỉ ({(autoOtWeeklyRestMins / 60).toFixed(1)}h × 2.0)</span>
                    <span className="font-bold text-foreground">{formatVND(otWeeklyRestPay)}</span>
                  </div>
                )}

                <div className="h-px w-full bg-white/5 my-2" />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-500 uppercase tracking-widest text-[11px]">Tổng lương</span>
                  <span className="font-black text-amber-500 text-xl">{formatVND(totalSalaryIncome)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. Tổng phụ cấp */}
          <motion.div variants={pageItemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-blue-500/20" />
            <h2 className="text-lg font-bold text-blue-400 pl-2">2. Chi tiết Phụ cấp</h2>

            <div className="space-y-5 mt-1">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="mealDays" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Số ngày tính cơm</Label>
                  <span className="text-[10px] font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{new Intl.NumberFormat('vi-VN').format(config.meal_allowance_per_day)}đ / ngày</span>
                </div>
                <Input
                  id="mealDays"
                  value={customMealDays !== '' ? customMealDays : calculatedMealDays.toString()}
                  onChange={(e) => setCustomMealDays(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-blue-500/50 shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mealOverride" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Tiền ăn giữa ca (tùy chỉnh)</Label>
                <Input
                  id="mealOverride"
                  value={mealOverride}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setMealOverride(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder={`Mặc định: ${formatVND(defaultMealAllowance)}`}
                  inputMode="numeric"
                  className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-blue-500/50 shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceOverride" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Trợ cấp tuân thủ (tùy chỉnh)</Label>
                <Input
                  id="complianceOverride"
                  value={complianceOverride}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setComplianceOverride(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder={`Mặc định: ${formatVND(config.compliance_allowance)}`}
                  inputMode="numeric"
                  className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-blue-500/50 shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kindergartenSupport" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Hỗ trợ con nhỏ</Label>
                <Input
                  id="kindergartenSupport"
                  value={kindergartenSupport}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setKindergartenSupport(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder="0"
                  inputMode="numeric"
                  className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-blue-500/50 shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift2Allowance" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Phụ cấp làm ca 2</Label>
                <Input
                  id="shift2Allowance"
                  value={shift2Allowance}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setShift2Allowance(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder="0"
                  inputMode="numeric"
                  className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-blue-500/50 shadow-inner"
                />
              </div>

              {isFemale && (
                <div className="space-y-2">
                  <Label htmlFor="menstrualStartDate" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
                    Trợ cấp hành kinh (Chọn ngày bắt đầu)
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      id="menstrualStartDate" 
                      type="date"
                      value={menstrualStartDate}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setMenstrualStartDate(val);
                        if (initialData) {
                          const newDates = { ...(initialData.menstrual_dates || {}) };
                          if (val) newDates[salaryMonth] = val;
                          else delete newDates[salaryMonth];
                          
                          try {
                            await updateMutation.mutateAsync({
                              ...initialData,
                              menstrual_dates: newDates
                            });
                          } catch (err) {
                            console.error('Failed to save menstrual_dates', err);
                          }
                        }
                      }}
                      className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-blue-500/50 shadow-inner"
                    />
                    {menstrualStartDate && (
                      <div className="flex flex-col items-end">
                        <div className="text-[11px] font-bold text-zinc-400 px-2 whitespace-nowrap">
                          Hợp lệ: <span className="text-blue-400 text-sm">{validMenstrualDays}</span>/3
                        </div>
                        {menstrualAllowance > 0 && (
                          <div className="text-[12px] font-bold text-emerald-400 px-2">
                            +{formatVND(Math.round(menstrualAllowance))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {renderDynamicList("PHỤ CẤP KHÁC", otherAllowances, setOtherAllowances)}

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-400 uppercase tracking-widest text-[11px]">Tổng phụ cấp</span>
                  <span className="font-black text-blue-400 text-xl">{formatVND(totalAllowance)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. Tổng thưởng */}
          <motion.div variants={pageItemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-emerald-500/20" />
            <h2 className="text-lg font-bold text-emerald-400 pl-2">3. Chi tiết Thưởng</h2>
            <p className="text-[12px] text-zinc-500 -mt-3 pl-2 font-medium">Thưởng thâm niên tính tới ngày 21 tháng trước.</p>

            <div className="space-y-5 mt-1">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">Thưởng gắn bó</span>
                    <span className="text-[11px] text-zinc-500 font-medium mt-0.5">{formatVND(accumulatedLoyaltyBonus)}/tháng (trả vào tháng {nextPayoutMonth})</span>
                    {!isPayoutMonth && accumulatedLoyaltyBonus > 0 && (
                      <span className="text-[10px] text-amber-500 font-bold mt-1.5 bg-amber-500/10 self-start px-2 py-0.5 rounded-md border border-amber-500/20">Tích luỹ tạm tính: {formatVND(accumulatedLoyaltyBonus)}</span>
                    )}
                  </div>
                  <span className="font-bold text-emerald-400">{formatVND(loyaltyBonus)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">Thưởng tay nghề</span>
                    <span className="text-[11px] text-zinc-500 font-medium mt-0.5">{formatVND(accumulatedSkillBonus)}/tháng (trả vào tháng {nextPayoutMonth})</span>
                    {!isPayoutMonth && accumulatedSkillBonus > 0 && (
                      <span className="text-[10px] text-amber-500 font-bold mt-1.5 bg-amber-500/10 self-start px-2 py-0.5 rounded-md border border-amber-500/20">Tích luỹ tạm tính: {formatVND(accumulatedSkillBonus)}</span>
                    )}
                  </div>
                  <span className="font-bold text-emerald-400">{formatVND(skillBonus)}</span>
                </div>

                <div className="h-px w-full bg-white/5 my-1" />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 uppercase tracking-widest text-[11px]">Thưởng Tự Động</span>
                  <span className="font-black text-emerald-400 text-lg">{formatVND(loyaltyBonus + skillBonus)}</span>
                </div>
              </div>

              {renderDynamicList("THƯỞNG KHÁC", otherBonuses, setOtherBonuses)}

              <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <span className="font-bold text-emerald-400 uppercase tracking-widest text-[11px]">Tổng tất cả thưởng</span>
                <span className="font-black text-emerald-400 text-xl">{formatVND(totalBonus)}</span>
              </div>
            </div>
          </motion.div>

          {/* 4. Tổng khấu trừ */}
          <motion.div variants={pageItemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-rose-500/20" />
            <h2 className="text-lg font-bold text-rose-400 pl-2">4. Chi tiết Khấu trừ</h2>

            <div className="space-y-5 mt-1">
              <div className="space-y-2">
                <Label htmlFor="personalIncomeTax" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Thuế TNCN (Nhập tay)</Label>
                <Input
                  id="personalIncomeTax"
                  value={personalIncomeTax}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setPersonalIncomeTax(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder="0"
                  inputMode="numeric"
                  className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-rose-500/50 shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advance" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Tạm ứng</Label>
                <Input
                  id="advance"
                  value={advance}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setAdvance(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder="0"
                  inputMode="numeric"
                  className="h-12 rounded-2xl bg-black/20 border-white/10 font-bold text-foreground focus-visible:ring-rose-500/50 shadow-inner"
                />
              </div>

              <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-medium">BHXH (8%)</span>
                  <span className="font-bold text-foreground">{formatVND(bhxh)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-medium">BHYT (1.5%)</span>
                  <span className="font-bold text-foreground">{formatVND(bhyt)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-medium">BHTN (1%)</span>
                  <span className="font-bold text-foreground">{formatVND(bhtn)}</span>
                </div>

                <div className="h-px w-full bg-white/5 my-1" />

                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-400 uppercase tracking-widest text-[11px]">Khấu trừ cố định</span>
                  <span className="font-black text-rose-400 text-lg">{formatVND(bhxh + bhyt + bhtn)}</span>
                </div>
              </div>
              
              {renderDynamicList("KHẤU TRỪ KHÁC", otherDeductions, setOtherDeductions)}
              
              <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
                <span className="font-bold text-rose-400 uppercase tracking-widest text-[11px]">Tổng khấu trừ</span>
                <span className="font-black text-rose-400 text-xl">{formatVND(totalDeductions)}</span>
              </div>
            </div>
          </motion.div>

        </motion.div>
        </div>
      </div>
    </div>
  );
}
