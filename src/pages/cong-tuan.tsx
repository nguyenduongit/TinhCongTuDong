import { useState, useMemo, useCallback } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getCycleMonthFromDate, getCycleRange, getNowVNDateLocal } from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';

import { useGetCongTuan, useListCongDoan } from '@/api';
import { getListCongDoanQueryKey } from '@/api';
import { BottomNav } from '@/components/BottomNav';
import { CongTuanCard, type WeekGroup } from '@/components/ui-parts/CongTuanCard';

export default function CongTuan() {
  const [currentMonth, setCurrentMonth] = useState(() => getCycleMonthFromDate(getNowVNDateLocal()));
  const isCurrentMonth = currentMonth.getTime() === getCycleMonthFromDate(getNowVNDateLocal()).getTime();

  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });

  const monthStrForApi = format(currentMonth, 'yyyy-MM');
  const { data: baoCaoData, isLoading: isLoadingEntries } = useGetCongTuan({ month: monthStrForApi });

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

  const weekGroupsRaw = baoCaoData?.weekGroups || [];
  
  const weekGroups: WeekGroup[] = useMemo(() => {
    return weekGroupsRaw.map(w => ({
      ...w,
      startDate: parseISO(w.startDate),
      endDate: parseISO(w.endDate),
      congDoanStats: w.congDoanStats as Record<string, { so_luong: number; cong_sp: number }>
    }));
  }, [weekGroupsRaw]);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl overflow-x-hidden">
        
        {/* Nền Blur cực quang */}
        <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <motion.div 
          className="px-5 pt-8 flex flex-col gap-6 relative z-10 flex-1"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.header variants={pageItemVariants} className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Công tuần</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
          </motion.header>

          {/* Month picker dạng Pill */}
          <motion.div variants={pageItemVariants} className="bg-card/60 backdrop-blur-md border border-white/5 rounded-full p-1.5 flex items-center justify-between shadow-sm mx-auto w-full max-w-[280px]">
            <button 
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center justify-center flex-1">
              <span className="text-[13px] font-bold text-foreground capitalize tracking-wide">
                Tháng {format(currentMonth, 'M, yyyy')}
              </span>
              {isCurrentMonth && (
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-0.5 bg-amber-500/10 px-2 py-0.5 rounded-full">
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

          {/* Tóm tắt tháng */}

          {/* Danh sách các tuần */}
          <motion.div variants={pageItemVariants} className="flex flex-col flex-1 mt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">Chi tiết các tuần</h3>
            
            {isLoadingEntries ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : weekGroups.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm font-medium">Không có dữ liệu trong tháng này.</div>
            ) : (
              <div className="flex flex-col gap-6">
                {weekGroups.map(week => (
                  <CongTuanCard 
                    key={week.weekNum} 
                    week={week} 
                    getCongDoanName={getCongDoanName} 
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        <BottomNav />
      </div>
    </div>
  );
}
