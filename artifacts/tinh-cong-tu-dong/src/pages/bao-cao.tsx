import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';

import { useGetSanLuongStats, useListSanLuong } from '@workspace/api-client-react';
import { BottomNav } from '@/components/BottomNav';

export default function BaoCao() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const { data: stats, isLoading: isLoadingStats } = useGetSanLuongStats();
  
  // Note: the stats endpoint returns global month stats for the current month on the backend.
  // To get history for specific selected month we use list with first day of month.
  const queryNgay = format(currentMonth, 'yyyy-MM-dd');
  const { data: entries = [], isLoading: isLoadingEntries } = useListSanLuong({ ngay: queryNgay });

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const formatTime = (mins: number) => {
    if (!mins) return '0h';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    if (!acc[entry.ngay]) acc[entry.ngay] = [];
    acc[entry.ngay].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">
        
        <div className="absolute top-0 left-0 right-0 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <div className="px-5 pt-12 flex flex-col gap-6 relative z-10 flex-1">
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Báo cáo</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground">
              <BarChart3 className="w-5 h-5" />
            </div>
          </header>

          <div className="bg-card border border-border/50 rounded-2xl p-2 flex items-center justify-between shadow-sm">
            <button 
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                Tháng
              </span>
              <span className="text-[15px] font-bold text-white capitalize">{format(currentMonth, 'MM / yyyy')}</span>
            </div>
            <button 
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Stats overview - for now showing global stats if current month, otherwise derived */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20"><TrendingUp className="w-10 h-10 text-primary" /></div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tổng sản lượng</span>
              <span className="text-2xl font-bold text-white relative z-10">
                {isCurrentMonth ? (isLoadingStats ? '-' : stats?.month_total_sl?.toLocaleString() || 0) : entries.reduce((sum, e) => sum + e.so_luong, 0).toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-rows-2 gap-3">
              <div className="bg-card border border-border/50 rounded-xl px-3 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Tổng giờ</span>
                  <span className="text-sm font-bold text-white">
                    {isCurrentMonth ? (isLoadingStats ? '-' : formatTime(stats?.month_total_time || 0)) : formatTime(entries.reduce((sum, e) => sum + e.thoi_gian, 0))}
                  </span>
                </div>
              </div>
              <div className="bg-card border border-border/50 rounded-xl px-3 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">Công đoạn</span>
                  <span className="text-sm font-bold text-white">
                    {isCurrentMonth ? (isLoadingStats ? '-' : stats?.month_count || 0) : entries.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grouped entries list */}
          <div className="flex flex-col flex-1 mt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">Chi tiết theo ngày</h3>
            
            {isLoadingEntries ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm font-medium">Không có dữ liệu trong tháng này.</div>
            ) : (
              <div className="flex flex-col gap-6">
                {sortedDates.map(date => {
                  const dayEntries = grouped[date];
                  const daySl = dayEntries.reduce((sum, e) => sum + e.so_luong, 0);
                  const dayTime = formatTime(dayEntries.reduce((sum, e) => sum + e.thoi_gian, 0));
                  
                  return (
                    <div key={date} className="flex flex-col">
                      <div className="flex justify-between items-end mb-3 border-b border-border/50 pb-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          {format(parseISO(date), 'dd/MM/yyyy')}
                        </h4>
                        <div className="flex text-xs font-medium text-muted-foreground gap-3">
                          <span>SL: {daySl.toLocaleString()}</span>
                          <span>{dayTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 pl-4">
                        {dayEntries.map(e => (
                          <div key={e.id} className="flex justify-between items-center bg-secondary/30 rounded-lg p-2.5 border border-border/30">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                {e.cong_doan?.ma_cong_doan}
                              </span>
                              <span className="text-sm font-medium text-white truncate max-w-[140px]">{e.cong_doan?.ten_cong_doan}</span>
                            </div>
                            <div className="flex gap-3 text-xs font-medium">
                              <span className="text-amber-200/90">{e.so_luong.toLocaleString()}</span>
                              <span className="text-muted-foreground">{e.thoi_gian}p</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
