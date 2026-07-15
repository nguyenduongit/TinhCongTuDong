import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell, CalendarX, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useGetSanLuongDashboard, useDeleteSanLuong, useConfirmNgayNghi } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongDashboardQueryKey, getListSanLuongQueryKey } from '@/api';
import type { SanLuong } from '@/api';
import { getNowVNDateLocal, getCycleRange, getCycleMonthFromDate } from '@/lib/date-utils';

import { BottomNav } from '@/components/BottomNav';
import { SanLuongDrawer } from '@/components/SanLuongDrawer';
import { HomeProgressCard } from '@/components/ui-parts/HomeProgressCard';
import { EstimationModal } from '@/components/EstimationModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { pageContainerVariants, pageItemVariants, fabVariants } from '@/lib/animations';



export default function Home() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showEstimationModal, setShowEstimationModal] = useState(false);
  const [missingModalInitialDate, setMissingModalInitialDate] = useState<string | undefined>();

  const queryClient = useQueryClient();
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetSanLuongDashboard();
  const todayEntries = dashboard?.todayEntries || [];
  const monthEntries = dashboard?.monthEntries || [];
  const stats = dashboard?.stats;
  const isLoadingStats = isLoadingDashboard;

  const today = getNowVNDateLocal();
  const { start: cycleStart, end: cycleEnd } = getCycleRange(getCycleMonthFromDate(today));
  
  let missingDays: Date[] = [];
  if (!isLoadingDashboard) {
    const endCalcDate = today > cycleEnd ? cycleEnd : (today < cycleStart ? cycleStart : today);
    if (today >= cycleStart) {
      const days = eachDayOfInterval({ start: cycleStart, end: endCalcDate });
      for (const d of days) {
        const dayOfWeek = getDay(d);
        if (dayOfWeek === 0) continue; // Bỏ qua Chủ Nhật
        
        const dStr = format(d, 'yyyy-MM-dd');
        const hasLog = monthEntries.some((e: any) => e.ngay === dStr);
        if (!hasLog) {
          missingDays.push(d);
        }
      }
    }
  }
  missingDays = missingDays.sort((a, b) => b.getTime() - a.getTime());
  
  const deleteMutation = useDeleteSanLuong();

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
  };

  const currentDateStr = format(getNowVNDateLocal(), 'EEEE, dd MMMM', { locale: vi });

  const confirmMutation = useConfirmNgayNghi();
  const [loadingDays, setLoadingDays] = useState<Record<string, boolean>>({});

  const handleConfirmNgayNghi = async (dateStr: string) => {
    setLoadingDays(prev => ({ ...prev, [dateStr]: true }));
    try {
      await confirmMutation.mutateAsync(dateStr);
    } finally {
      setLoadingDays(prev => ({ ...prev, [dateStr]: false }));
    }
  };

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
              <p className="text-muted-foreground/90 text-sm font-semibold mb-1 capitalize">{currentDateStr}</p>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                Tính Công Tự Động
              </h1>
            </div>
          </motion.header>

          {/* Progress Card */}
          <motion.div variants={pageItemVariants}>
            <HomeProgressCard
              dashboardData={dashboard}
              isLoading={isLoadingStats}
              onOpenCalculator={() => setShowEstimationModal(true)}
            />
          </motion.div>

          {/* Missing Days List */}
          {missingDays.length > 0 && (
            <motion.div variants={pageItemVariants} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CalendarX className="w-3 h-3 text-amber-500" />
                </div>
                <h3 className="font-bold text-sm tracking-tight">Cần nhập sản lượng</h3>
              </div>
              <div className="flex flex-col gap-3">
                {missingDays.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayName = format(date, 'EEEE', { locale: vi });
                  const isSaturday = getDay(date) === 6;
                  const isLoading = loadingDays[dateStr];

                  return (
                    <div key={dateStr} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {format(date, 'dd/MM')}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {dayName} {isSaturday ? '(0.5 công)' : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmNgayNghi(dateStr)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Nghỉ
                        </button>
                        
                        <button
                          onClick={() => {
                            setMissingModalInitialDate(dateStr);
                            setIsAddOpen(true);
                          }}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3" strokeWidth={3} />
                          Nhập
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* FAB */}
        <AnimatePresence>
          <motion.div
            variants={fabVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
            className="fixed bottom-[104px] w-full max-w-[430px] z-20 flex flex-col items-center gap-3 pointer-events-none"
          >
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center pointer-events-auto">
                    <button
                      onClick={() => setIsAddOpen(true)}
                      className="relative group flex items-center justify-center outline-none"
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
                    <p>Sửa sản lượng hôm nay</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        </AnimatePresence>

        <BottomNav />
      </div>

      <SanLuongDrawer 
        entry={(!missingModalInitialDate && todayEntries.length > 0) ? todayEntries[0] : null}
        open={isAddOpen} 
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setTimeout(() => setMissingModalInitialDate(undefined), 300);
        }} 
        initialDate={missingModalInitialDate}
      />
      <EstimationModal open={showEstimationModal} onOpenChange={setShowEstimationModal} />
    </div>
  );
}
