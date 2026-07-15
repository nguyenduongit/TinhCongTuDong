import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useGetSanLuongDashboard, useDeleteSanLuong } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongDashboardQueryKey, getListSanLuongQueryKey } from '@/api';
import type { SanLuong } from '@/api';
import { getNowVNDateLocal, getCycleRange, getCycleMonthFromDate } from '@/lib/date-utils';

import { BottomNav } from '@/components/BottomNav';
import { SanLuongDrawer } from '@/components/SanLuongDrawer';
import { MissingDaysModal } from '@/components/MissingDaysModal';
import { HomeProgressCard } from '@/components/ui-parts/HomeProgressCard';
import { EstimationModal } from '@/components/EstimationModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { pageContainerVariants, pageItemVariants, fabVariants } from '@/lib/animations';



export default function Home() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showEstimationModal, setShowEstimationModal] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
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

  const [isFabExpanded, setIsFabExpanded] = useState(false);
  useEffect(() => {
    if (missingDays.length > 0 && !isLoadingDashboard) {
      const timer = setTimeout(() => {
        setIsFabExpanded(true);
        setTimeout(() => setIsFabExpanded(false), 4000); // 1s giãn + 3s giữ
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [missingDays.length, isLoadingDashboard]);

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
        </motion.div>

        {/* FAB */}
        <AnimatePresence>
          <motion.div
            variants={fabVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
            className="fixed bottom-[104px] w-full max-w-[430px] z-20 flex justify-center pointer-events-none"
          >
            <div className="flex items-center justify-center relative pointer-events-auto">
              {/* Glow effect */}
              <motion.div 
                animate={{ 
                  scale: isFabExpanded ? [1, 1.05, 1] : 1,
                  opacity: isFabExpanded ? [0.4, 0.6, 0.4] : 0.4 
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/40 rounded-full blur-md" 
              />
              
              <motion.button
                onClick={() => {
                  if (isFabExpanded && missingDays.length > 0) {
                    setIsMissingModalOpen(true);
                  } else {
                    setIsAddOpen(true);
                  }
                }}
                animate={{ 
                  width: isFabExpanded ? 280 : 64,
                  height: 64,
                  borderRadius: 32
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20 
                }}
                className="relative overflow-hidden bg-gradient-to-tr from-amber-500 to-primary text-primary-foreground shadow-[0_8px_32px_rgba(212,168,67,0.4)] border-4 border-background flex items-center active:scale-95 transition-transform outline-none"
              >
                <div className="flex items-center w-full px-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <Plus className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                  
                  <AnimatePresence>
                    {isFabExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="ml-3 text-[13px] font-black whitespace-nowrap overflow-hidden"
                      >
                        Bạn có {missingDays.length} ngày chưa nhập sản lượng!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </div>
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
      <MissingDaysModal
        open={isMissingModalOpen}
        onOpenChange={setIsMissingModalOpen}
        missingDays={missingDays}
        onInputForDay={(dateStr) => {
          setMissingModalInitialDate(dateStr);
          setIsMissingModalOpen(false);
          // Wait for modal to close before opening drawer
          setTimeout(() => setIsAddOpen(true), 300);
        }}
      />
    </div>
  );
}
