import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, Info, PackageOpen, Target, Zap, Clock, Coffee, AlertTriangle } from 'lucide-react';
import { useGetSanLuongDashboard, useListCongDoan, getListCongDoanQueryKey } from '@/api';
import { getCycleMonthFromDate, getCycleRange, calculateRequiredCongForCycle, getNowVNDateLocal } from '@/lib/date-utils';
import { parseQuyCach } from '@/components/ui-parts/CongDoanFormUI';
import { reverseCalcPcs } from '@/lib/business-logic';
import { motion, AnimatePresence } from 'framer-motion';

interface EstimationToolProps {
  onClose?: () => void;
}

export function EstimationTool({ onClose }: EstimationToolProps) {
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [leaveHours, setLeaveHours] = useState<number>(0);
  const [selectedCongDoan, setSelectedCongDoan] = useState<string>('');

  const { data: dashboard, isLoading: isLoadingDashboard } = useGetSanLuongDashboard();
  const { data: congDoanList = [], isLoading: isLoadingCd } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });

  const stats = dashboard?.stats;
  const todayEntries = dashboard?.todayEntries || [];
  const hasLoggedToday = todayEntries.length > 0;

  useEffect(() => {
    if (congDoanList.length > 0 && !selectedCongDoan) {
      const latestCd = [...congDoanList].sort((a: any, b: any) => (b.order || 0) - (a.order || 0))[0];
      if (latestCd) {
        setSelectedCongDoan(latestCd.ma_cong_doan);
      }
    }
  }, [congDoanList, selectedCongDoan]);

  const today = getNowVNDateLocal();
  const { start: cycleStart, end: cycleEnd } = getCycleRange(getCycleMonthFromDate(today));

  // Tính số công chuẩn trong tương lai
  let futureStart = new Date(today);
  if (hasLoggedToday) {
    futureStart = addDays(futureStart, 1);
  }

  const futureStandardCong = futureStart <= cycleEnd ? calculateRequiredCongForCycle(futureStart, cycleEnd) : 0;
  
  // Tính tổng số công mục tiêu
  const workedCong = (stats?.month_total_time || 0) / 480;
  const overtimeCong = (overtimeHours * 60) / 480;
  const leaveCong = (leaveHours * 60) / 480;

  const totalRequiredCong = workedCong + futureStandardCong + overtimeCong - leaveCong;
  const totalAchievedCong = stats?.month_total_sl || 0;
  const missingCong = Math.max(0, totalRequiredCong - totalAchievedCong);

  const selectedCdObj = congDoanList.find(c => c.ma_cong_doan === selectedCongDoan);
  const parsedQc = selectedCdObj ? parseQuyCach(selectedCdObj.quy_cach) : { sl: '1', unit: 'Sản phẩm' };
  const pcsPerUnit = parseFloat(parsedQc.sl) || 1;

  function getReverseCalcPcs(targetCong: number, cd: typeof selectedCdObj): number {
    if (!cd || targetCong <= 0) return 0;
    const dinhMuc = Number(cd.dinh_muc) > 0 ? Number(cd.dinh_muc) : 1;
    return reverseCalcPcs(targetCong, dinhMuc, cd.ma_cong_doan.startsWith('9'));
  }

  const totalPcs = getReverseCalcPcs(missingCong, selectedCdObj);
  const requiredUnits = Math.floor(totalPcs / pcsPerUnit);
  const remainderPcs = totalPcs % pcsPerUnit;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground outline-none">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-lg font-bold text-foreground">
            Công cụ Dự tính
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        
        {/* Info Block */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl squircle-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Target className="w-4 h-4" />
            <span>Kỳ công: {format(cycleStart, 'dd/MM')} - {format(cycleEnd, 'dd/MM')}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Công cụ này giúp bạn tính toán số lượng sản phẩm cần làm từ nay đến cuối kỳ. Hãy nhập số giờ bạn dự định sẽ tăng ca hoặc nghỉ phép trong tương lai.
          </p>
        </div>

        {isLoadingDashboard || isLoadingCd ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasLoggedToday ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl squircle-xl p-5 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground">Chưa cập nhật hôm nay</h3>
            <p className="text-sm text-muted-foreground">
              Vui lòng nhập đầy đủ sản lượng của ngày hôm nay trước khi sử dụng công cụ dự tính để đảm bảo số liệu tính toán bắt đầu từ "ngày mai" là chính xác tuyệt đối.
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Form Inputs */}
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Tăng ca dự kiến
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={overtimeHours || ''}
                    onChange={(e) => setOvertimeHours(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl squircle-lg px-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary/50 focus:bg-secondary/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Giờ</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  Nghỉ phép dự kiến
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={leaveHours || ''}
                    onChange={(e) => setLeaveHours(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl squircle-lg px-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary/50 focus:bg-secondary/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Giờ</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-card border border-border/50 rounded-2xl squircle-xl overflow-hidden shadow-sm">
              <div className="bg-secondary/30 px-4 py-3 border-b border-border/50 flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Dự tính cần hoàn thành</span>
              </div>
              
              <div className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Chọn công đoạn dự tính:</span>
                  <div className="relative">
                    <select
                      value={selectedCongDoan}
                      onChange={(e) => setSelectedCongDoan(e.target.value)}
                      className="w-full appearance-none bg-background border border-border/50 rounded-xl squircle-lg px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    >
                      {congDoanList.map(cd => (
                        <option key={cd.ma_cong_doan} value={cd.ma_cong_doan}>
                          {cd.ma_cong_doan} - {cd.ten_cong_doan}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </div>
                  </div>
                </div>

                {missingCong === 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl squircle-lg p-3 text-center text-emerald-600 dark:text-emerald-400 text-sm font-bold mt-2">
                    🎉 Với dự tính này, bạn đã đủ hoặc vượt chỉ tiêu!
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedCongDoan + overtimeHours + leaveHours}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl squircle-lg p-4 flex items-center gap-4 mt-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary shadow-[0_0_15px_rgba(212,168,67,0.2)]">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium mb-1">Cần hoàn thành thêm:</span>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-2xl font-black text-primary tracking-tight">
                            {requiredUnits.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-sm font-bold text-foreground capitalize mr-1">
                            {parsedQc.unit}
                          </span>
                          {remainderPcs > 0 && (
                            <>
                              <span className="text-sm font-bold text-muted-foreground">+</span>
                              <span className="text-lg font-black text-primary tracking-tight">
                                {remainderPcs.toLocaleString('vi-VN')}
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                pcs
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 opacity-70 font-medium">
                          ~ {missingCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} công
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
