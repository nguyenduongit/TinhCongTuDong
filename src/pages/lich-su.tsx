import { useState, useMemo, useCallback } from 'react';
import { addMonths, subMonths, format, parseISO, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getCycleMonthFromDate, getCycleRange, calculateRequiredCongForCycle, getTodayVNString, getNowVNDateLocal, getCycleRangeStrings } from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Pencil, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useListSanLuong, useDeleteSanLuong, useListCongDoan } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongDashboardQueryKey, getListSanLuongQueryKey, getListCongDoanQueryKey } from '@/api';
import type { SanLuong } from '@/api';

import { BottomNav } from '@/components/BottomNav';
import { SanLuongDrawer } from '@/components/SanLuongDrawer';
import { HistoryDayCard } from '@/components/ui-parts/HistoryDayCard';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';

// Nhóm mảng entries theo ngày
function groupByDate(entries: SanLuong[]): { date: string; items: SanLuong[] }[] {
  const map = new Map<string, SanLuong[]>();
  for (const entry of entries) {
    const key = entry.ngay;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  // Sắp xếp ngày giảm dần (ngày mới nhất lên trên)
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}

function formatDateHeader(dateStr: string): string {
  const today = getTodayVNString();
  
  const d = new Date(dateStr + 'T00:00:00');
  const yest = getNowVNDateLocal();
  yest.setDate(yest.getDate() - 1);
  const yesterdayStr = format(yest, 'yyyy-MM-dd');

  if (dateStr === today) return 'Hôm nay';
  if (dateStr === yesterdayStr) return 'Hôm qua';
  return format(d, 'EEEE, dd/MM', { locale: vi });
}

export default function LichSu() {
  const [currentMonth, setCurrentMonth] = useState(() => getCycleMonthFromDate(getNowVNDateLocal()));
  const [editEntry, setEditEntry] = useState<SanLuong | null>(null);

  const isCurrentMonth = currentMonth.getTime() === getCycleMonthFromDate(getNowVNDateLocal()).getTime();
  const monthStr = format(currentMonth, 'yyyy-MM');

  const queryClient = useQueryClient();
  const { startStr, endStr } = getCycleRangeStrings(currentMonth);

  // Lấy dữ liệu theo tháng
  const { data: entries = [], isLoading } = useListSanLuong({ startDate: startStr, endDate: endStr });
  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });
  const deleteMutation = useDeleteSanLuong();

  const congDoanMap = useMemo(() => {
    const map = new Map<string, string>();
    congDoanList.forEach(c => map.set(c.ma_cong_doan, c.ten_cong_doan));
    return map;
  }, [congDoanList]);

  const getCongDoanName = useCallback((ma: string) => {
    return congDoanMap.get(ma) || ma;
  }, [congDoanMap]);

  const monthEntries = entries; // Data is already filtered by backend
  const grouped = groupByDate(monthEntries);

  // Tính tổng tháng
  const totalCongMonth = monthEntries.reduce((sum, e) => sum + ((e.thong_ke_ngay as any)?.tong_cong_sp || 0), 0);
  const totalTime = monthEntries.reduce((sum, e) => sum + (e.thoi_gian_thuc_hien ?? 0) + (e.thoi_gian_ho_tro ?? 0), 0);
  const totalHours = Math.floor(totalTime / 60);
  const totalMins = totalTime % 60;

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => {
    if (!isCurrentMonth) setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">

        <div className="absolute top-0 left-0 right-0 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <motion.div 
          className="px-5 pt-12 flex flex-col gap-5 relative z-10 flex-1"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >

          {/* Header */}
          <motion.header variants={pageItemVariants} className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch sử</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </motion.header>

          {/* Month picker */}
          <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-2xl squircle-xl p-2 flex items-center justify-between shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl squircle-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                {isCurrentMonth ? 'Tháng này' : 'Tháng'}
              </span>
              <span className="text-[15px] font-bold text-foreground capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: vi })}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl squircle-lg hover:bg-secondary text-muted-foreground transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>


          {/* Danh sách theo ngày */}
          <motion.div variants={pageItemVariants} className="flex flex-col flex-1">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </motion.div>
              ) : grouped.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-border">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">Không có dữ liệu trong tháng này.</p>
                </motion.div>
              ) : (
                <motion.div key={monthStr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  {grouped.map(({ date, items }) => (
                      <div key={date}>
                        <HistoryDayCard 
                          dateStr={date}
                          dateHeader={formatDateHeader(date)}
                          items={items}
                          getCongDoanName={getCongDoanName}
                          getCongDoanDinhMuc={(ma) => {
                            const cd = congDoanList.find(c => c.ma_cong_doan === ma);
                            return cd ? Number(cd.dinh_muc) : 1;
                          }}
                          onEdit={(entry) => setEditEntry(entry)}
                          onDelete={(id) => handleDelete(id)}
                        />
                      </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <BottomNav />
      </div>

      <SanLuongDrawer entry={editEntry} open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)} />
    </div>
  );
}
