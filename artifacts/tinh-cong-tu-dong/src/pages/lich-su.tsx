import { useState } from 'react';
import { addMonths, subMonths, format, parseISO, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getCycleMonthFromDate, getCycleRangeStrings } from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Pencil, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useListSanLuong, useDeleteSanLuong, useListCongDoan } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongTodayQueryKey, getGetSanLuongStatsQueryKey, getListSanLuongQueryKey, getListCongDoanQueryKey } from '@workspace/api-client-react';
import type { SanLuong } from '@workspace/api-client-react';

import { BottomNav } from '@/components/BottomNav';
import { EditEntryDrawer } from '@/components/EditEntryDrawer';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subMonths(new Date(), 0), 'yyyy-MM-dd');
  // Tính yesterday thực sự
  const d = new Date(dateStr + 'T00:00:00');
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yesterdayStr = format(yest, 'yyyy-MM-dd');

  if (dateStr === today) return 'Hôm nay';
  if (dateStr === yesterdayStr) return 'Hôm qua';
  return format(d, 'EEEE, dd/MM', { locale: vi });
}

export default function LichSu() {
  const [currentMonth, setCurrentMonth] = useState(() => getCycleMonthFromDate(new Date()));
  const [editEntry, setEditEntry] = useState<SanLuong | null>(null);

  const isCurrentMonth = currentMonth.getTime() === getCycleMonthFromDate(new Date()).getTime();
  const monthStr = format(currentMonth, 'yyyy-MM');

  const queryClient = useQueryClient();
  // Lấy dữ liệu cả tháng (không truyền ngay)
  const { data: entries = [], isLoading } = useListSanLuong();
  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });
  const deleteMutation = useDeleteSanLuong();

  const getCongDoanName = (ma: string) => {
    const cd = congDoanList.find(c => c.ma_cong_doan === ma);
    return cd ? cd.ten_cong_doan : ma;
  };

  // Lọc theo khoảng thời gian của Kỳ tính công
  const { startStr, endStr } = getCycleRangeStrings(currentMonth);
  const monthEntries = entries.filter(e => e.ngay >= startStr && e.ngay <= endStr);
  const grouped = groupByDate(monthEntries);

  // Tính tổng tháng
  const totalCongMonth = monthEntries.reduce((sum, e) => sum + ((e.thong_ke_ngay as any)?.tong_cong_sp || 0), 0);
  const totalTime = monthEntries.reduce((sum, e) => sum + (e.thoi_gian_thuc_hien ?? 0) + (e.thoi_gian_ho_tro ?? 0), 0);
  const totalHours = Math.floor(totalTime / 60);
  const totalMins = totalTime % 60;

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongTodayQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongStatsQueryKey() });
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

        <div className="px-5 pt-12 flex flex-col gap-5 relative z-10 flex-1">

          {/* Header */}
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Lịch sử</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </header>

          {/* Month picker */}
          <div className="bg-card border border-border/50 rounded-2xl p-2 flex items-center justify-between shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                {isCurrentMonth ? 'Tháng này' : 'Tháng'}
              </span>
              <span className="text-[15px] font-bold text-white capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: vi })}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>


          {/* Danh sách theo ngày */}
          <div className="flex flex-col flex-1">
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
                  {grouped.map(({ date, items }) => {
                    const dayCongSp = items.reduce((s, e) => s + ((e.thong_ke_ngay as any)?.tong_cong_sp || 0), 0);
                    const dayCongHoTro = items.reduce((s, e) => s + ((e as any).thoi_gian_ho_tro || 0) / 480, 0);
                    const dayTotalCong = dayCongSp + dayCongHoTro;
                    
                    const dayTime = items.reduce((s, e) => s + (e.thoi_gian_thuc_hien ?? 0) + (e.thoi_gian_ho_tro ?? 0), 0);
                    const dayH = Math.floor(dayTime / 60);
                    const dayM = dayTime % 60;

                    return (
                      <div key={date}>
                        {/* Ngày header */}
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-sm font-bold text-white capitalize">
                            {formatDateHeader(date)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 mr-2">
                              {dayTime > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {dayTime}p
                                </span>
                              )}
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {dayTotalCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} công
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 border-l border-border/50 pl-2">
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-white transition-colors outline-none">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content align="end" className="bg-card border border-border/50 rounded-xl p-1 shadow-2xl z-50 w-36 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                                    <DropdownMenu.Item 
                                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-secondary rounded-lg cursor-pointer"
                                      onSelect={() => setEditEntry(items[0])}
                                    >
                                      <Pencil className="w-4 h-4 text-primary" />
                                      Sửa
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator className="h-px bg-border/50 my-1" />
                                    <DropdownMenu.Item 
                                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive outline-none hover:bg-destructive/10 rounded-lg cursor-pointer"
                                      onSelect={() => handleDelete(items[0].id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Xóa
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </div>
                          </div>
                        </div>

                        {/* Các card trong ngày */}
                        <div className="flex flex-col gap-2">
                          {items.map((entry, idx) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="bg-card border border-border/50 rounded-xl flex flex-col"
                            >

                              <div className="flex flex-col">
                                {entry.chi_tiet.map((item, i) => (
                                  <div key={i} className={`flex items-center justify-between p-3.5 ${i !== entry.chi_tiet.length - 1 ? 'border-b border-border/30' : ''}`}>
                                    <div className="flex flex-col">
                                      <span className="text-primary font-bold text-[11px] uppercase tracking-wider bg-secondary px-2 py-0.5 rounded border border-border/50 self-start mb-1">
                                        {item.cong_doan}
                                      </span>
                                      <span className="text-sm font-medium text-white line-clamp-1">{getCongDoanName(item.cong_doan)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-amber-200/90 text-[13px] font-semibold">
                                        SL: {item.so_luong.toLocaleString('vi-VN')}
                                      </span>
                                      {item.phan_tram_dinh_muc !== 100 && (
                                        <span className="text-[10px] text-rose-200/90 px-1 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 font-medium">
                                          {item.phan_tram_dinh_muc}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {(entry as any).thoi_gian_ho_tro > 0 && (
                                  <div className={`flex items-center justify-between p-3.5 ${entry.chi_tiet.length > 0 ? 'border-t border-border/30' : ''}`}>
                                    <div className="flex flex-col">
                                      <span className="text-purple-400 font-bold text-[11px] uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 self-start mb-1">
                                        HỔ TRỢ
                                      </span>
                                      <span className="text-sm font-medium text-white line-clamp-1">Thời gian hỗ trợ</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-purple-200/90 text-[13px] font-semibold">
                                        {(entry as any).thoi_gian_ho_tro} phút
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <BottomNav />
      </div>

      <EditEntryDrawer entry={editEntry} open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)} />
    </div>
  );
}
