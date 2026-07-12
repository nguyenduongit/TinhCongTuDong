import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useGetSanLuongDashboard, useDeleteSanLuong } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongDashboardQueryKey, getListSanLuongQueryKey } from '@workspace/api-client-react';
import type { SanLuong } from '@workspace/api-client-react';

import { BottomNav } from '@/components/BottomNav';
import { SanLuongDrawer } from '@/components/SanLuongDrawer';
import { MonthlyProgressCard } from '@/components/ui-parts/MonthlyProgressCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { pageContainerVariants, pageItemVariants, fabVariants } from '@/lib/animations';



export default function Home() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCalculatorExpanded, setIsCalculatorExpanded] = useState(false);

  const queryClient = useQueryClient();
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetSanLuongDashboard();
  const todayEntries = dashboard?.todayEntries || [];
  const stats = dashboard?.stats;
  const isLoadingStats = isLoadingDashboard;
  
  const deleteMutation = useDeleteSanLuong();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
  };

  const currentDateStr = format(new Date(), 'EEEE, dd MMMM', { locale: vi });

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">

        <div className="absolute top-0 left-0 right-0 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <motion.div
          className="flex-1 px-5 pt-12 flex flex-col gap-8 relative z-10"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.header variants={pageItemVariants} className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 capitalize">{currentDateStr}</p>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent">
                Tính Công Tự Động
              </h1>
            </div>
          </motion.header>

          {/* Tóm tắt tháng */}
          <motion.div variants={pageItemVariants} className="grid grid-cols-3 gap-2">
            <div className="bg-card border border-border/50 rounded-xl squircle-lg p-3 flex flex-col items-center shadow-sm">
              <span className="text-xs text-muted-foreground mb-1">{(stats?.month_total_sl || 0) - ((stats?.month_total_time || 0) / 480) > 0 ? 'Dư' : 'Thiếu'}</span>
              <span className={`text-lg font-bold ${(stats?.month_total_sl || 0) - ((stats?.month_total_time || 0) / 480) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-400'}`}>
                {isLoadingStats ? '-' : Math.abs((stats?.month_total_sl || 0) - ((stats?.month_total_time || 0) / 480)).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-card border border-border/50 rounded-xl squircle-lg p-3 flex flex-col items-center shadow-sm">
              <span className="text-xs text-muted-foreground mb-1">Công SP</span>
              <span className="text-lg font-bold text-primary">{isLoadingStats ? '-' : (stats?.month_total_sl || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-card border border-border/50 rounded-xl squircle-lg p-3 flex flex-col items-center shadow-sm">
              <span className="text-xs text-muted-foreground mb-1">Công nhật</span>
              <span className="text-lg font-bold text-foreground">
                {isLoadingStats ? '-' : ((stats?.month_total_time || 0) / 480).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>

          {/* Progress Card */}
          <motion.div variants={pageItemVariants}>
            <MonthlyProgressCard
              monthTotalSl={stats?.month_total_sl || 0}
              monthTotalTime={stats?.month_total_time || 0}
              hasLoggedToday={todayEntries.length > 0}
              isLoading={isLoadingStats}
              onExpandChange={setIsCalculatorExpanded}
            />
          </motion.div>
        </motion.div>

        {/* FAB */}
        <AnimatePresence>
          {!isCalculatorExpanded && (
            <motion.div
              variants={fabVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
              className="fixed bottom-[104px] left-1/2 -translate-x-1/2 z-20"
            >
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setIsAddOpen(true)}
                        disabled={todayEntries.length > 0}
                        className={`relative group flex items-center justify-center outline-none ${todayEntries.length > 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute inset-0 bg-primary/40 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-primary flex items-center justify-center text-primary-foreground shadow-[0_8px_32px_rgba(212,168,67,0.4)] border-4 border-background relative active:scale-95 transition-transform">
                          <Plus className="w-8 h-8" strokeWidth={2.5} />
                        </div>
                      </button>
                    </div>
                  </TooltipTrigger>
                  {todayEntries.length > 0 && (
                    <TooltipContent side="top" sideOffset={10}>
                      <p>Hôm nay bạn đã nhập sản lượng rồi!</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>

      <SanLuongDrawer open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
