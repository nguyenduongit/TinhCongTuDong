import { useState, useMemo, useCallback } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getCycleMonthFromDate } from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

import { useGetSanLuongBaoCao, useListCongDoan } from '@workspace/api-client-react';
import { getListCongDoanQueryKey } from '@workspace/api-client-react';
import { BottomNav } from '@/components/BottomNav';
import { WeekSummaryCard, type WeekGroup } from '@/components/ui-parts/WeekSummaryCard';

export default function BaoCao() {
  const [currentMonth, setCurrentMonth] = useState(() => getCycleMonthFromDate(new Date()));
  const isCurrentMonth = currentMonth.getTime() === getCycleMonthFromDate(new Date()).getTime();

  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });

  const monthStrForApi = format(currentMonth, 'yyyy-MM');
  const { data: baoCaoData, isLoading: isLoadingEntries } = useGetSanLuongBaoCao({ month: monthStrForApi });

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
