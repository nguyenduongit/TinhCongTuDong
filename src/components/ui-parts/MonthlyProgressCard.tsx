import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, PackageOpen, Target, CalendarDays, Zap, Info } from 'lucide-react';
import { useListCongDoan, getListCongDoanQueryKey, useListLichTrinh } from '@/api';
import { getCycleMonthFromDate, getCycleRange, calculateRequiredCongForCycle, getNowVNDateLocal } from '@/lib/date-utils';
import { parseQuyCach } from '@/components/ui-parts/CongDoanFormUI';
import { format, addDays } from 'date-fns';
import { reverseCalcPcs } from '@/lib/business-logic';
export interface MonthlyProgressCardProps {
  monthTotalSl: number; // Tổng công SP + Công hỗ trợ
  monthTotalTime: number; // Tổng thời gian đã làm trong tháng (phút)
  hasLoggedToday: boolean;
  isLoading: boolean;
  onExpandChange?: (isExpanded: boolean) => void;
}

export function MonthlyProgressCard({ monthTotalSl, monthTotalTime, hasLoggedToday, isLoading, onExpandChange }: MonthlyProgressCardProps) {
  const [selectedCongDoan, setSelectedCongDoan] = useState<string>('');

  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });

  useEffect(() => {
    if (congDoanList.length > 0 && !selectedCongDoan) {
      const latestCd = [...congDoanList].sort((a: any, b: any) => (b.order || 0) - (a.order || 0))[0];
      if (latestCd) {
        setSelectedCongDoan(latestCd.ma_cong_doan);
      }
    }
  }, [congDoanList, selectedCongDoan]);

  // Tính toán các mốc ngày trong kỳ
  const today = getNowVNDateLocal();
  const { start: cycleStart, end: cycleEnd } = getCycleRange(getCycleMonthFromDate(today));
  const start = cycleStart;
  const end = cycleEnd;

  // Fetch lịch trình của kỳ công
  const { data: schedules = [] } = useListLichTrinh({
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd')
  });

  // Mục tiêu công = (Thời gian đã làm / 480) + (Công chuẩn của các ngày chưa tới)
  let futureStart = new Date(today);
  if (hasLoggedToday) {
    futureStart = addDays(futureStart, 1);
  }

  const requiredFutureCong = futureStart <= end ? calculateRequiredCongForCycle(futureStart, end, schedules) : 0;
  const requiredCong = (monthTotalTime / 480) + requiredFutureCong;

  // Tính tổng công đã đạt được (bao gồm công SP + công Hỗ Trợ đã được API cộng sẵn)
  const totalAchievedCong = monthTotalSl;
  const missingCong = Math.max(0, requiredCong - totalAchievedCong);

  const selectedCdObj = congDoanList.find(c => c.ma_cong_doan === selectedCongDoan);

  const parsedQc = selectedCdObj ? parseQuyCach(selectedCdObj.quy_cach) : { sl: '1', unit: 'Sản phẩm' };
  const pcsPerUnit = parseFloat(parsedQc.sl) || 1;

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Tính ngược từ missingCong ra số lượng pcs cần làm
  function getReverseCalcPcs(targetCong: number, cd: typeof selectedCdObj): number {
    if (!cd || targetCong <= 0) return 0;
    const dinhMuc = Number(cd.dinh_muc) > 0 ? Number(cd.dinh_muc) : 1;
    // MonthlyProgressCard assumes 100% phan_tram_dinh_muc for quota estimation
    return reverseCalcPcs(targetCong, dinhMuc, cd.ma_cong_doan.startsWith('9'));
  }

  const totalPcs = getReverseCalcPcs(missingCong, selectedCdObj);

  const requiredUnits = Math.floor(totalPcs / pcsPerUnit);
  const remainderPcs = totalPcs % pcsPerUnit;

  return (
    <div className="bg-card border border-border/50 squircle-xl shadow-sm overflow-hidden flex flex-col mb-4">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-sm tracking-tight">Tiến độ tháng này</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded-md">
          <CalendarDays className="w-3.5 h-3.5" />
          {format(start, 'dd/MM')} - {format(end, 'dd/MM')}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-3 border-b border-border/50">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground uppercase font-semibold mb-1">Mục tiêu</span>
          <span className="text-base font-bold text-foreground">
            {requiredCong.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          </span>
        </div>
        <div className="flex flex-col border-l border-border/50 pl-3">
          <span className="text-[11px] text-muted-foreground uppercase font-semibold mb-1">Đã đạt</span>
          <span className="text-base font-bold text-emerald-500">
            {isLoading ? '-' : totalAchievedCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-col border-l border-border/50 pl-3">
          <span className="text-[11px] text-muted-foreground uppercase font-semibold mb-1">Còn lại</span>
          <span className={`text-base font-bold ${missingCong > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isLoading ? '-' : missingCong > 0 ? missingCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : 'Đủ chỉ tiêu'}
          </span>
        </div>
      </div>

      {/* Calculator Toggle */}
      <div
        className="px-4 py-3 bg-secondary/30 border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => {
          const newState = !isCalculatorOpen;
          setIsCalculatorOpen(newState);
          onExpandChange?.(newState);
        }}
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <PackageOpen className="w-4 h-4 text-primary" />
          Dự tính cần làm thêm
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isCalculatorOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Calculator */}
      <AnimatePresence>
        {isCalculatorOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-secondary/10 flex flex-col gap-3">
              {missingCong === 0 && !isLoading ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl squircle-lg p-3 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  🎉 Chúc mừng bạn đã hoàn thành chỉ tiêu tháng này!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <select
                      value={selectedCongDoan}
                      onChange={(e) => setSelectedCongDoan(e.target.value)}
                      className="w-full appearance-none bg-card border border-border/50 rounded-xl squircle-lg px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    >
                      <option value="">Chọn một công đoạn...</option>
                      {congDoanList.map(cd => (
                        <option key={cd.ma_cong_doan} value={cd.ma_cong_doan}>
                          {cd.ma_cong_doan} - {cd.ten_cong_doan} ({cd.dinh_muc} pcs/công)
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedCongDoan && selectedCdObj && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="bg-card border border-primary/30 rounded-xl squircle-lg p-3.5 flex items-center gap-3 shadow-[0_0_15px_rgba(212,168,67,0.1)] overflow-hidden"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-medium mb-0.5">Số lượng cần hoàn thành:</span>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xl font-black text-primary tracking-tight">
                              {requiredUnits.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-sm font-bold text-foreground capitalize mr-1">
                              {parsedQc.unit}
                            </span>
                            {remainderPcs > 0 && (
                              <>
                                <span className="text-sm font-bold text-muted-foreground">+</span>
                                <span className="text-xl font-black text-primary tracking-tight">
                                  {remainderPcs.toLocaleString('vi-VN')}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                  pcs
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Footer Tip */}
      <div className="px-4 py-3 bg-secondary/20 border-t border-border/50 flex items-start gap-2">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vui lòng thiết lập đầy đủ <strong>Lịch trình</strong> cá nhân (tăng ca, nghỉ phép) trong tháng để có dữ liệu mục tiêu và dự tính chính xác nhất.
        </p>
      </div>
    </div>
  );
}
