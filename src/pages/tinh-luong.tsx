import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Save, Loader2, Calendar } from 'lucide-react';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';
import { useGetThongTinLuong, useUpsertThongTinLuong, useListSanLuong } from '@/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { differenceInYears, differenceInMonths, parseISO, format } from 'date-fns';
import { BottomNav } from '@/components/BottomNav';

export default function TinhLuong() {
  const { data: initialData, isLoading } = useGetThongTinLuong();
  const upsertMutation = useUpsertThongTinLuong();

  const [basicSalary, setBasicSalary] = useState<string>('');
  const [joinDate, setJoinDate] = useState<string>('');
  const [contractDate, setContractDate] = useState<string>('');
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [salaryMonth, setSalaryMonth] = useState<string>(currentMonth);

  // Tiền lương states
  const [customStandardWorkdays, setCustomStandardWorkdays] = useState<string>('');
  const [customPaidLeaveDays, setCustomPaidLeaveDays] = useState<string>('');
  const [customAnnualLeaveDays, setCustomAnnualLeaveDays] = useState<string>('');

  // Phụ cấp states
  const [customMealDays, setCustomMealDays] = useState<string>('');
  const [mealOverride, setMealOverride] = useState<string>('');
  const [complianceOverride, setComplianceOverride] = useState<string>('');

  // Thưởng states
  const [kpiBonusInput, setKpiBonusInput] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      if (initialData.luong_co_ban) {
        setBasicSalary(new Intl.NumberFormat('vi-VN').format(initialData.luong_co_ban));
      }
      if (initialData.ngay_vao_cong_ty) {
        setJoinDate(initialData.ngay_vao_cong_ty);
      }
      if (initialData.ngay_ky_hop_dong) {
        setContractDate(initialData.ngay_ky_hop_dong);
      }
    }
  }, [initialData]);

  const numBasicSalary = Number(basicSalary.replace(/\D/g, '')) || 0;

  const getCycleStartDate = (year: number, month: number) => {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear--;
    }
    return new Date(`${prevYear}-${prevMonth.toString().padStart(2, '0')}-21T00:00:00`);
  };

  const cycleStartDate = useMemo(() => {
    const [yearStr, monthStr] = salaryMonth.split('-');
    return getCycleStartDate(parseInt(yearStr, 10), parseInt(monthStr, 10));
  }, [salaryMonth]);

  const { baseStandardWorkdays, baseMealDays } = useMemo(() => {
    const [yearStr, monthStr] = salaryMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    
    const startDate = getCycleStartDate(year, month);
    const endDate = new Date(`${year}-${month.toString().padStart(2, '0')}-20T00:00:00`);
    
    let mCount = 0;
    let sCount = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const day = currentDate.getDay();
      if (day !== 0) {
        mCount++;
        if (day === 6) {
          sCount += 0.5;
        } else {
          sCount += 1;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return { baseStandardWorkdays: sCount, baseMealDays: mCount };
  }, [salaryMonth]);

  useEffect(() => {
    setCustomStandardWorkdays('');
    setCustomMealDays('');
    setCustomPaidLeaveDays('');
    setCustomAnnualLeaveDays('');
  }, [salaryMonth]);

  const startDateStr = format(cycleStartDate, 'yyyy-MM-dd');
  const endDateStr = format(new Date(`${salaryMonth.split('-')[0]}-${salaryMonth.split('-')[1].padStart(2, '0')}-20T00:00:00`), 'yyyy-MM-dd');
  const { data: cycleRecords } = useListSanLuong({ startDate: startDateStr, endDate: endDateStr });

  const { dbPaidLeaveWorkdays, dbAnnualLeaveWorkdays, dbPaidLeavePhysical, dbAnnualLeavePhysical } = useMemo(() => {
    let pw = 0, aw = 0, pp = 0, ap = 0;
    if (cycleRecords) {
      cycleRecords.forEach((r: any) => {
        if (r.thong_ke_ngay?.is_ngay_nghi) {
          const date = new Date(r.ngay);
          const isSat = date.getDay() === 6;
          const val = isSat ? 0.5 : 1;
          
          if (r.thong_ke_ngay.loai_nghi === 'nghi_huong_luong') {
             pw += val; pp += 1;
          } else if (r.thong_ke_ngay.loai_nghi === 'nghi_phep') {
             aw += val; ap += 1;
          }
        }
      });
    }
    return { dbPaidLeaveWorkdays: pw, dbAnnualLeaveWorkdays: aw, dbPaidLeavePhysical: pp, dbAnnualLeavePhysical: ap };
  }, [cycleRecords]);

  const numPaidLeaveDays = customPaidLeaveDays !== '' ? (Number(customPaidLeaveDays) || 0) : dbPaidLeaveWorkdays;
  const numAnnualLeaveDays = customAnnualLeaveDays !== '' ? (Number(customAnnualLeaveDays) || 0) : dbAnnualLeaveWorkdays;
  
  const activeStandardWorkdays = customStandardWorkdays !== '' ? (Number(customStandardWorkdays) || 0) : baseStandardWorkdays;
  const numStandardWorkdays = activeStandardWorkdays || 26;

  const dailySalary = numBasicSalary / numStandardWorkdays;
  const paidLeaveAmount = numPaidLeaveDays * dailySalary;
  const annualLeaveAmount = numAnnualLeaveDays * dailySalary;
  const regularWorkdayPay = numBasicSalary - paidLeaveAmount - annualLeaveAmount;
  
  const totalSalaryIncome = regularWorkdayPay + paidLeaveAmount + annualLeaveAmount;

  const physicalPaidLeave = customPaidLeaveDays !== '' ? numPaidLeaveDays : dbPaidLeavePhysical;
  const physicalAnnualLeave = customAnnualLeaveDays !== '' ? numAnnualLeaveDays : dbAnnualLeavePhysical;

  const calculatedMealDays = Math.max(0, baseMealDays - physicalPaidLeave - physicalAnnualLeave);
  const activeMealDays = customMealDays !== '' ? (Number(customMealDays) || 0) : calculatedMealDays;
  const numMealDays = activeMealDays;
  
  const defaultMealAllowance = numMealDays * 35000;
  const mealAllowance = mealOverride !== '' ? (Number(mealOverride.replace(/\D/g, '')) || 0) : defaultMealAllowance;
  
  const defaultCompliance = 400000;
  const complianceAllowance = complianceOverride !== '' ? (Number(complianceOverride.replace(/\D/g, '')) || 0) : defaultCompliance;

  const totalAllowance = mealAllowance + complianceAllowance;

  const { loyaltyBonus, skillBonus } = useMemo(() => {
    const [yearStr, monthStr] = salaryMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const calcMonthlyBonus = (y: number, m: number) => {
      let lBonus = 0;
      let sBonus = 0;
      const cDate = getCycleStartDate(y, m);
      
      if (joinDate) {
        try {
          const jd = parseISO(joinDate);
          const years = differenceInYears(cDate, jd);
          if (years > 0) lBonus = years * 100000;
        } catch {}
      }

      if (contractDate) {
        try {
          const cd = parseISO(contractDate);
          const months = differenceInMonths(cDate, cd);
          if (months >= 36) sBonus = 200000;
        } catch {}
      }
      return { lBonus, sBonus };
    };

    if ([3, 6, 9, 12].includes(month)) {
      let totalL = 0;
      let totalS = 0;
      for (let i = 0; i < 3; i++) {
        let m = month - i;
        let y = year;
        if (m < 1) {
          m += 12;
          y--;
        }
        const { lBonus, sBonus } = calcMonthlyBonus(y, m);
        totalL += lBonus;
        totalS += sBonus;
      }
      return { loyaltyBonus: totalL, skillBonus: totalS };
    } else {
      return { loyaltyBonus: 0, skillBonus: 0 };
    }
  }, [salaryMonth, joinDate, contractDate]);

  const kpiBonus = Number(kpiBonusInput.replace(/\D/g, '')) || 0;
  const totalBonus = loyaltyBonus + skillBonus + kpiBonus;

  const bhxh = numBasicSalary * 0.08;
  const bhyt = numBasicSalary * 0.015;
  const bhtn = numBasicSalary * 0.01;
  const totalDeductions = bhxh + bhyt + bhtn;

  const grossIncome = totalSalaryIncome + totalAllowance + totalBonus;
  const netIncome = grossIncome - totalDeductions;

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setBasicSalary('');
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(rawValue));
    setBasicSalary(formatted);
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        luong_co_ban: numBasicSalary,
        ngay_vao_cong_ty: joinDate || null,
        ngay_ky_hop_dong: contractDate || null,
      });
      toast.success('Lưu thông tin thành công!');
    } catch (error) {
      toast.error('Lỗi khi lưu thông tin');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl overflow-x-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2" />
        <motion.div
          className="flex-1 px-5 pt-8 flex flex-col gap-6 relative z-10"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.header variants={pageItemVariants} className="flex items-center gap-3 bg-card/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">
                Tính Lương
              </h1>
              <p className="text-muted-foreground text-xs font-semibold">Công cụ ước tính thu nhập</p>
            </div>
            <div className="flex flex-col items-end">
              <Label htmlFor="salaryMonth" className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Kỳ lương</Label>
              <div className="relative">
                <input
                  type="month"
                  id="salaryMonth"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="bg-primary/10 text-primary font-bold text-sm rounded-lg px-2 py-1 outline-none border border-primary/20 cursor-pointer w-[120px]"
                />
              </div>
            </div>
          </motion.header>

          <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/80" />
            <h2 className="text-lg font-bold">Thông tin cơ sở</h2>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Lương cơ bản (VNĐ)</Label>
                <Input 
                  id="basicSalary" 
                  value={basicSalary}
                  onChange={handleSalaryChange}
                  placeholder="Nhập lương cơ bản..."
                  inputMode="numeric"
                  className="h-12 rounded-xl text-lg font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Ngày vào công ty</Label>
                  <Input 
                    id="joinDate" 
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractDate">Ngày ký HĐ</Label>
                  <Input 
                    id="contractDate" 
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={upsertMutation.isPending}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
              >
                {upsertMutation.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Lưu thông tin cơ bản
              </Button>
            </div>
          </motion.div>

          <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/80" />
            <h2 className="text-lg font-bold text-amber-500">1. Tổng tiền lương</h2>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="standardWorkdays">Số ngày công chuẩn</Label>
                  <span className="text-xs text-muted-foreground font-semibold text-amber-600 dark:text-amber-400">
                    Lương 1 ngày: {formatVND(dailySalary)}
                  </span>
                </div>
                <Input 
                  id="standardWorkdays" 
                  value={customStandardWorkdays !== '' ? customStandardWorkdays : baseStandardWorkdays.toString()}
                  onChange={(e) => setCustomStandardWorkdays(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paidLeaveDays">Nghỉ hưởng lương</Label>
                  <Input 
                    id="paidLeaveDays" 
                    value={customPaidLeaveDays !== '' ? customPaidLeaveDays : dbPaidLeaveWorkdays.toString()}
                    onChange={(e) => setCustomPaidLeaveDays(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0"
                    inputMode="decimal"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualLeaveDays">Nghỉ phép năm</Label>
                  <Input 
                    id="annualLeaveDays" 
                    value={customAnnualLeaveDays !== '' ? customAnnualLeaveDays : dbAnnualLeaveWorkdays.toString()}
                    onChange={(e) => setCustomAnnualLeaveDays(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0"
                    inputMode="decimal"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 rounded-2xl p-4 mt-2 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">1.1 Ngày thường</span>
                  <span className="font-medium">{formatVND(regularWorkdayPay)}</span>
                </div>
                {numPaidLeaveDays > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Nghỉ hưởng lương</span>
                    <span className="font-medium">{formatVND(paidLeaveAmount)}</span>
                  </div>
                )}
                {numAnnualLeaveDays > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Nghỉ phép năm</span>
                    <span className="font-medium">{formatVND(annualLeaveAmount)}</span>
                  </div>
                )}
                
                <div className="h-px w-full bg-border/50" />
                
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Tổng tiền lương</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">{formatVND(totalSalaryIncome)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tổng phụ cấp */}
          <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/80" />
            <h2 className="text-lg font-bold text-blue-500">2. Tổng phụ cấp</h2>
            
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="mealDays">Số ngày tính tiền cơm</Label>
                  <span className="text-xs text-muted-foreground">35.000đ / ngày</span>
                </div>
                <Input 
                  id="mealDays" 
                  value={customMealDays !== '' ? customMealDays : calculatedMealDays.toString()}
                  onChange={(e) => setCustomMealDays(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mealOverride">Tiền ăn giữa ca (tùy chỉnh)</Label>
                <Input 
                  id="mealOverride" 
                  value={mealOverride}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setMealOverride(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder={`Mặc định: ${formatVND(defaultMealAllowance)}`}
                  inputMode="numeric"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complianceOverride">Trợ cấp tuân thủ (tùy chỉnh)</Label>
                <Input 
                  id="complianceOverride" 
                  value={complianceOverride}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setComplianceOverride(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder={`Mặc định: ${formatVND(defaultCompliance)}`}
                  inputMode="numeric"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="bg-blue-500/10 rounded-2xl p-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600 dark:text-blue-400">Tổng phụ cấp</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{formatVND(totalAllowance)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tổng thưởng */}
          <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/80" />
            <h2 className="text-lg font-bold text-emerald-500">3. Tổng thưởng</h2>
            <p className="text-sm text-muted-foreground -mt-2">Tự động tính theo thâm niên tính tới đầu kỳ lương (ngày 21 tháng trước).</p>
            
            <div className="bg-muted/50 rounded-2xl p-4 flex flex-col gap-3 mt-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Thưởng gắn bó</span>
                  <span className="text-[10px] text-muted-foreground/70">100k/năm (lũy kế 3 tháng, trả T3,6,9,12)</span>
                </div>
                <span className="font-medium text-emerald-600">{formatVND(loyaltyBonus)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Thưởng tay nghề</span>
                  <span className="text-[10px] text-muted-foreground/70">200k sau 36 tháng (lũy kế 3 tháng, trả T3,6,9,12)</span>
                </div>
                <span className="font-medium text-emerald-600">{formatVND(skillBonus)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm mt-2">
                <div className="flex flex-col flex-1 mr-4">
                  <Label htmlFor="kpiBonusInput" className="text-muted-foreground font-normal">Thưởng tháng 13 / KPI</Label>
                  <span className="text-[10px] text-muted-foreground/70">Nhập số tiền thực tế (nếu có)</span>
                </div>
                <Input 
                  id="kpiBonusInput" 
                  value={kpiBonusInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setKpiBonusInput(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : '');
                  }}
                  placeholder="0"
                  inputMode="numeric"
                  className="h-10 rounded-xl w-[140px] text-right font-medium text-emerald-600"
                />
              </div>
              
              <div className="h-px w-full bg-border/50 my-1" />
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Tổng thưởng</span>
                <span className="font-bold text-emerald-500">{formatVND(totalBonus)}</span>
              </div>
            </div>
          </motion.div>

          {/* Tổng thu nhập (Gross) */}
          <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/80" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-violet-500">4. Tổng thu nhập (Gross)</h2>
              <span className="font-bold text-violet-600 dark:text-violet-400 text-xl">{formatVND(grossIncome)}</span>
            </div>
            <p className="text-xs text-muted-foreground -mt-3">Bao gồm: Lương + Phụ cấp + Thưởng (chưa trừ bảo hiểm)</p>
          </motion.div>

          {/* Tổng khấu trừ */}
          <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/80" />
            <h2 className="text-lg font-bold text-rose-500">5. Tổng khấu trừ</h2>
            <p className="text-sm text-muted-foreground -mt-2">Các khoản này được tự động tính từ lương cơ bản, không lưu vào cơ sở dữ liệu.</p>
            
            <div className="bg-muted/50 rounded-2xl p-4 flex flex-col gap-3 mt-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">5.1 BHXH (8%)</span>
                <span className="font-medium">{formatVND(bhxh)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">5.2 BHYT (1.5%)</span>
                <span className="font-medium">{formatVND(bhyt)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">5.3 BHTN (1%)</span>
                <span className="font-medium">{formatVND(bhtn)}</span>
              </div>
              
              <div className="h-px w-full bg-border/50 my-1" />
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Tổng khấu trừ</span>
                <span className="font-bold text-rose-500">{formatVND(totalDeductions)}</span>
              </div>
            </div>
          </motion.div>

          {/* Lương thực lãnh (Net) */}
          <motion.div variants={pageItemVariants} className="relative mt-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-emerald-500 to-amber-500 rounded-3xl blur opacity-20" />
            <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center gap-2 text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-emerald-500 to-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Lương thực lãnh (Net)</h2>
              <span className="font-black text-4xl bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                {formatVND(netIncome)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Số tiền thực tế bạn sẽ nhận được qua tài khoản ngân hàng</p>
            </div>
          </motion.div>

        </motion.div>

        <BottomNav />
      </div>
    </div>
  );
}
