import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useListSanLuong, useDeleteSanLuong } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongTodayQueryKey, getGetSanLuongStatsQueryKey, getListSanLuongQueryKey } from '@workspace/api-client-react';
import type { SanLuong } from '@workspace/api-client-react';

import { BottomNav } from '@/components/BottomNav';
import { SanLuongCard } from '@/components/SanLuongCard';
import { EditEntryDrawer } from '@/components/EditEntryDrawer';

export default function LichSu() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editEntry, setEditEntry] = useState<SanLuong | null>(null);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const displayDate = format(currentDate, 'EEEE, dd/MM/yyyy', { locale: vi });

  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useListSanLuong({ ngay: dateStr });
  const deleteMutation = useDeleteSanLuong();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongTodayQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
  };

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">
        
        <div className="absolute top-0 left-0 right-0 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <div className="px-5 pt-12 flex flex-col gap-6 relative z-10 flex-1">
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Lịch sử</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </header>

          <div className="bg-card border border-border/50 rounded-2xl p-2 flex items-center justify-between shadow-sm">
            <button 
              onClick={handlePrevDay}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                {isToday ? 'Hôm nay' : 'Ngày'}
              </span>
              <span className="text-[15px] font-bold text-white capitalize">{displayDate}</span>
            </div>
            <button 
              onClick={handleNextDay}
              disabled={isToday}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col flex-1 relative">
            <div className="flex justify-between items-end mb-4 px-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Danh sách sản lượng</h3>
              <span className="text-xs font-bold text-primary">{entries.length} bản ghi</span>
            </div>
            
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
              ) : entries.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-border">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">Không có dữ liệu trong ngày này.</p>
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
                  {entries.map(entry => (
                    <SanLuongCard 
                      key={entry.id} 
                      entry={entry} 
                      onEdit={setEditEntry} 
                      onDelete={handleDelete} 
                    />
                  ))}
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
