import { useState, useMemo, useCallback } from 'react';
import { addMonths, subMonths, format, parseISO, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getCycleMonthFromDate, getCycleRange, calculateRequiredCongForCycle, getTodayVNString, getNowVNDateLocal, getCycleRangeStrings } from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Pencil, MoreHorizontal, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useListSanLuong, useDeleteSanLuong, useListCongDoan } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongDashboardQueryKey, getListSanLuongQueryKey, getListCongDoanQueryKey } from '@/api';
import type { SanLuong } from '@/api';

import { BottomNav } from '@/components/BottomNav';
import { SanLuongDrawer } from '@/components/SanLuongDrawer';
import { SanLuongDayCard } from '@/components/ui-parts/SanLuongDayCard';
import { pageContainerVariants, pageItemVariants, fabVariants } from '@/lib/animations';

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

export default function SanLuong() {
  const [currentMonth, setCurrentMonth] = useState(() => getCycleMonthFromDate(getNowVNDateLocal()));
  const [editEntry, setEditEntry] = useState<SanLuong | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl overflow-x-hidden">

        {/* Nền Blur cực quang */}
        <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-primary/10 via-amber-500/5 to-transparent blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <motion.div 
          className="px-5 pt-5 flex flex-col gap-5 relative z-10 flex-1"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
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


          {/* Danh sách theo ngày (Timeline) */}
          <motion.div variants={pageItemVariants} className="flex flex-col flex-1 mt-2">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg" />
                </motion.div>
              ) : grouped.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center mb-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                    <CalendarIcon className="w-10 h-10 text-muted-foreground/40 relative z-10" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Chưa có dữ liệu</h3>
                  <p className="text-muted-foreground text-sm font-medium">Bắt đầu chấm công để theo dõi tiến độ nhé.</p>
                </motion.div>
              ) : (
                <motion.div key={monthStr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
                  {grouped.map(({ date, items }) => (
                      <div key={date}>
                        <SanLuongDayCard 
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

        {/* FAB Chấm Công */}
        <motion.div
          variants={fabVariants}
          initial="hidden"
          animate="show"
          className="fixed bottom-[90px] w-full max-w-[430px] z-20 flex justify-center pointer-events-none"
        >
          <button
            onClick={() => setIsAddOpen(true)}
            className="pointer-events-auto relative group flex items-center justify-center outline-none transition-transform hover:scale-105 active:scale-95"
          >
            {/* Vòng sáng nhấp nháy */}
            <div className="absolute inset-0 bg-primary/50 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse" />
            {/* Nút vật lý */}
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_10px_40px_rgba(245,158,11,0.5)] border-4 border-background relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 hover:bg-transparent transition-colors" />
              <Plus className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </button>
        </motion.div>
      </div>

      <SanLuongDrawer entry={editEntry} open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)} />
      <SanLuongDrawer entry={null} open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
