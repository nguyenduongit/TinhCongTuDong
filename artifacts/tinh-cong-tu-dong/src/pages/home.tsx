import { motion, type Variants } from 'framer-motion';
import { Plus, Bell } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useGetSanLuongToday, useGetSanLuongStats, useDeleteSanLuong } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongTodayQueryKey, getGetSanLuongStatsQueryKey, getListSanLuongQueryKey } from '@workspace/api-client-react';
import type { SanLuong } from '@workspace/api-client-react';

import { BottomNav } from '@/components/BottomNav';
import { StatsBar } from '@/components/StatsBar';
import { SanLuongCard } from '@/components/SanLuongCard';
import { AddEntryDrawer } from '@/components/AddEntryDrawer';
import { EditEntryDrawer } from '@/components/EditEntryDrawer';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const fabVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { 
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25, delay: 0.4 }
  }
};

export default function Home() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<SanLuong | null>(null);

  const queryClient = useQueryClient();
  const { data: todayEntries = [], isLoading: isLoadingEntries } = useGetSanLuongToday();
  const { data: stats, isLoading: isLoadingStats } = useGetSanLuongStats();
  const deleteMutation = useDeleteSanLuong();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongTodayQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
  };

  const currentDateStr = format(new Date(), 'EEEE, dd MMMM', { locale: vi });

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">
        
        <div className="absolute top-0 left-0 right-0 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2" />
        
        <motion.div 
          className="flex-1 px-5 pt-12 flex flex-col gap-8 relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.header variants={itemVariants} className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 capitalize">{currentDateStr}</p>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent">
                Tính Công Tự Động
              </h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
          </motion.header>

          {/* Stats */}
          <motion.div variants={itemVariants}>
            <StatsBar stats={stats} isLoading={isLoadingStats} />
          </motion.div>

          {/* Entries */}
          <motion.div variants={itemVariants} className="flex flex-col flex-1">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight">Sản lượng hôm nay</h3>
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">{todayEntries.length} bản ghi</span>
            </div>
            
            <div className="flex flex-col relative flex-1">
              {isLoadingEntries ? (
                <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : todayEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-border">
                    <Plus className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">Chưa có sản lượng hôm nay.<br/>Nhấn + để thêm.</p>
                </div>
              ) : (
                todayEntries.map(entry => (
                  <SanLuongCard 
                    key={entry.id} 
                    entry={entry} 
                    onEdit={setEditEntry} 
                    onDelete={handleDelete} 
                  />
                ))
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* FAB */}
        <motion.div 
          variants={fabVariants}
          initial="hidden"
          animate="show"
          className="fixed bottom-[104px] left-1/2 -translate-x-1/2 z-20"
        >
          <button 
            onClick={() => setIsAddOpen(true)}
            className="relative group flex items-center justify-center outline-none"
          >
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-primary flex items-center justify-center text-primary-foreground shadow-[0_8px_32px_rgba(212,168,67,0.4)] border-4 border-background relative active:scale-95 transition-transform">
              <Plus className="w-8 h-8" strokeWidth={2.5} />
            </div>
          </button>
        </motion.div>

        <BottomNav />
      </div>

      <AddEntryDrawer open={isAddOpen} onOpenChange={setIsAddOpen} />
      <EditEntryDrawer entry={editEntry} open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)} />
    </div>
  );
}
