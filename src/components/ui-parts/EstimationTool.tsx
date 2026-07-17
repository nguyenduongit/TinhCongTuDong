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
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Background effects */}
      <div className="absolute top-0 left-0 right-0 h-56 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent blur-[60px] pointer-events-none rounded-full transform -translate-y-1/2" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          {onClose && (
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center -ml-2 rounded-full bg-white/5 text-muted-foreground border border-white/5 hover:text-foreground hover:bg-white/10 transition-colors outline-none">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-bold text-foreground">
            Công cụ Dự tính
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 relative z-10">
        
        {/* Info Block */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-4.5 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <Target className="w-4 h-4" />
            <span>Kỳ công: {format(cycleStart, 'dd/MM')} - {format(cycleEnd, 'dd/MM')}</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            Công cụ này giúp bạn tính toán số lượng sản phẩm cần làm từ nay đến cuối kỳ. Hãy nhập số giờ bạn dự định sẽ tăng ca hoặc nghỉ phép trong tương lai.
          </p>
        </div>

        {isLoadingDashboard || isLoadingCd ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasLoggedToday ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 flex flex-col items-center text-center gap-3.5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] border border-rose-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-foreground text-base">Chưa cập nhật hôm nay</h3>
            <p className="text-[13px] text-zinc-400 font-medium px-2">
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
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5 pl-1 tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Tăng ca dự kiến
                </label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={overtimeHours || ''}
                    onChange={(e) => setOvertimeHours(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-xl font-black text-foreground outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 group-focus-within:text-emerald-500/70 transition-colors">Giờ</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5 pl-1 tracking-wider">
                  <Coffee className="w-3.5 h-3.5" />
                  Nghỉ phép dự kiến
                </label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={leaveHours || ''}
                    onChange={(e) => setLeaveHours(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-xl font-black text-foreground outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 group-focus-within:text-emerald-500/70 transition-colors">Giờ</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-lg relative">
              <div className="bg-black/20 px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                <PackageOpen className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-sm font-bold text-foreground">Dự tính cần hoàn thành</span>
              </div>
              
              <div className="p-5 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Chọn công đoạn dự tính:</span>
                  <div className="relative">
                    <select
                      value={selectedCongDoan}
                      onChange={(e) => setSelectedCongDoan(e.target.value)}
                      className="w-full appearance-none bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner cursor-pointer"
                    >
                      {congDoanList.map(cd => (
                        <option key={cd.ma_cong_doan} value={cd.ma_cong_doan} className="bg-background">
                          {cd.ma_cong_doan} - {cd.ten_cong_doan}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <ChevronLeft className="w-4.5 h-4.5 -rotate-90" />
                    </div>
                  </div>
                </div>

                {missingCong === 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center text-emerald-400 text-sm font-bold mt-1 shadow-sm">
                    🎉 Với dự tính này, bạn đã đủ hoặc vượt chỉ tiêu!
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedCongDoan + overtimeHours + leaveHours}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4.5 mt-1 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 rounded-full blur-[30px] -mr-8 -mt-8 pointer-events-none" />
                      
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex flex-shrink-0 items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] border border-emerald-500/20 relative z-10">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col relative z-10">
                        <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest mb-0.5">Cần hoàn thành thêm:</span>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-3xl font-black text-emerald-400 tracking-tight drop-shadow-sm">
                            {requiredUnits.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-sm font-bold text-foreground capitalize mr-1">
                            {parsedQc.unit}
                          </span>
                          {remainderPcs > 0 && (
                            <>
                              <span className="text-sm font-bold text-zinc-500">+</span>
                              <span className="text-xl font-black text-emerald-400/90 tracking-tight">
                                {remainderPcs.toLocaleString('vi-VN')}
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                pcs
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 mt-1 font-medium bg-black/20 self-start px-2 py-0.5 rounded-md border border-white/5">
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
