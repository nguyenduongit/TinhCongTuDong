import { useState, useMemo, useCallback } from 'react';
import { format, addMonths, subMonths, parseISO, differenceInCalendarWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getCycleMonthFromDate, getCycleRangeStrings, getCycleRange } from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';

import { useGetSanLuongStats, useListSanLuong, useListCongDoan } from '@workspace/api-client-react';
import { getListCongDoanQueryKey } from '@workspace/api-client-react';
import { BottomNav } from '@/components/BottomNav';
import { WeekSummaryCard, type WeekGroup } from '@/components/ui-parts/WeekSummaryCard';

export default function BaoCao() {
  const [currentMonth, setCurrentMonth] = useState(() => getCycleMonthFromDate(new Date()));
  const isCurrentMonth = currentMonth.getTime() === getCycleMonthFromDate(new Date()).getTime();

  const { data: stats, isLoading: isLoadingStats } = useGetSanLuongStats();
  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });

  const { startStr, endStr } = getCycleRangeStrings(currentMonth);
  const { data: entries = [], isLoading: isLoadingEntries } = useListSanLuong({ startDate: startStr, endDate: endStr });


  const totalTimeMonth = isCurrentMonth 
    ? (stats?.month_total_time || 0) 
    : entries.reduce((sum, e) => sum + e.thoi_gian_thuc_hien + (e.thoi_gian_ho_tro ?? 0), 0);

  const congDoanMap = useMemo(() => {
    const map = new Map<string, string>();
    congDoanList.forEach(c => map.set(c.ma_cong_doan, c.ten_cong_doan));
    return map;
  }, [congDoanList]);

  const getCongDoanName = useCallback((ma: string) => {
    return congDoanMap.get(ma) || ma;
  }, [congDoanMap]);


  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const formatTime = (mins: number) => {
    if (!mins) return '0h';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const weekGroups = useMemo(() => {
    const { start: cycleStart, end: cycleEnd } = getCycleRange(currentMonth);
    const today = new Date();
    
    const weekMap = new Map<number, WeekGroup>();

    entries.forEach(entry => {
      const date = parseISO(entry.ngay);
      const weekNum = differenceInCalendarWeeks(date, cycleStart, { weekStartsOn: 1 }) + 1;
      
      if (!weekMap.has(weekNum)) {
        let wStart = startOfWeek(date, { weekStartsOn: 1 });
        let wEnd = endOfWeek(date, { weekStartsOn: 1 });
        
        if (wStart < cycleStart) wStart = cycleStart;
        if (wEnd > cycleEnd) wEnd = cycleEnd;

        const isCurrentWeek = differenceInCalendarWeeks(date, today, { weekStartsOn: 1 }) === 0;
        const isLastWeek = differenceInCalendarWeeks(today, date, { weekStartsOn: 1 }) === 1;

        weekMap.set(weekNum, {
          weekNum,
          startDate: wStart,
          endDate: wEnd,
          isCurrentWeek,
          isLastWeek,
          totalCongSp: 0,
          totalHoTroPhut: 0,
          totalTime: 0,
          congDoanStats: {}
        });
      }

      const weekGroup = weekMap.get(weekNum)!;
      weekGroup.totalCongSp += (entry.thong_ke_ngay as any)?.tong_cong_sp || 0;
      weekGroup.totalHoTroPhut += entry.thoi_gian_ho_tro || 0;
      weekGroup.totalTime += (entry.thoi_gian_thuc_hien || 0) + (entry.thoi_gian_ho_tro || 0);
      
      entry.chi_tiet.forEach(ct => {
        if (!weekGroup.congDoanStats[ct.cong_doan]) {
          weekGroup.congDoanStats[ct.cong_doan] = { so_luong: 0, cong_sp: 0 };
        }
        weekGroup.congDoanStats[ct.cong_doan].so_luong += ct.so_luong;
      });
      
      const chiTietCong = (entry.thong_ke_ngay as any)?.chi_tiet_cong || {};
      Object.entries(chiTietCong).forEach(([cong_doan, cong_sp]: [string, any]) => {
        if (!weekGroup.congDoanStats[cong_doan]) {
          weekGroup.congDoanStats[cong_doan] = { so_luong: 0, cong_sp: 0 };
        }
        weekGroup.congDoanStats[cong_doan].cong_sp += (cong_sp as number);
      });
    });

    return Array.from(weekMap.values()).sort((a, b) => b.weekNum - a.weekNum);
  }, [entries, currentMonth]);

  const totalCongMonth = weekGroups.reduce((sum, week) => sum + week.totalCongSp + (week.totalHoTroPhut / 480), 0);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">
        
        <div className="absolute top-0 left-0 right-0 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <div className="px-5 pt-12 flex flex-col gap-6 relative z-10 flex-1">
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Báo cáo</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground">
              <BarChart3 className="w-5 h-5" />
            </div>
          </header>

          <div className="bg-card border border-border/50 rounded-2xl squircle-xl p-2 flex items-center justify-between shadow-sm">
            <button 
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl squircle-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                Tháng
              </span>
              <span className="text-[15px] font-bold text-foreground capitalize">{format(currentMonth, 'MM / yyyy')}</span>
            </div>
            <button 
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl squircle-lg hover:bg-secondary text-muted-foreground transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Tóm tắt tháng */}

          {/* Danh sách các tuần */}
          <div className="flex flex-col flex-1 mt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">Chi tiết các tuần</h3>
            
            {isLoadingEntries ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : weekGroups.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm font-medium">Không có dữ liệu trong tháng này.</div>
            ) : (
              <div className="flex flex-col gap-6">
                {weekGroups.map(week => (
                  <WeekSummaryCard 
                    key={week.weekNum} 
                    week={week} 
                    getCongDoanName={getCongDoanName} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
