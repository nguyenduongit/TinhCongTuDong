import { motion, AnimatePresence } from 'framer-motion';
import { CalendarX } from 'lucide-react';
import { useState } from 'react';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useGetSanLuongDashboard, useConfirmNgayNghi } from '@/api';
import { getNowVNDateLocal, getCycleRange, getCycleMonthFromDate } from '@/lib/date-utils';

import { BottomNav } from '@/components/BottomNav';
import { HomeProgressCard } from '@/components/ui-parts/HomeProgressCard';
import { HomeToolsGrid } from '@/components/ui-parts/HomeToolsGrid';
import { MissingDaysModal } from '@/components/MissingDaysModal';
import { SanLuongDrawer } from '@/components/SanLuongDrawer';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [missingModalInitialDate, setMissingModalInitialDate] = useState<string | undefined>();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { user } = useAuth();
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetSanLuongDashboard();
  const monthEntries = dashboard?.monthEntries || [];

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

  const currentDateStr = format(getNowVNDateLocal(), 'EEEE, dd MMMM', { locale: vi });

  const confirmMutation = useConfirmNgayNghi();
  const [loadingDays, setLoadingDays] = useState<Record<string, boolean>>({});

  const handleConfirmNgayNghi = async (dateStr: string, loaiNghi: string) => {
    setLoadingDays(prev => ({ ...prev, [dateStr]: true }));
    try {
      await confirmMutation.mutateAsync({ ngay: dateStr, loai_nghi: loaiNghi });
    } finally {
      setLoadingDays(prev => ({ ...prev, [dateStr]: false }));
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl overflow-x-hidden">

        {/* Cảnh nền Blur */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2" />

        {/* Nội dung trang */}
        <motion.div
          className="flex-1 px-5 pt-8 flex flex-col gap-6 relative z-10"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header Glassmorphism */}
          <motion.header variants={pageItemVariants} className="flex justify-between items-center bg-card/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-sm">
            <div>
              <p className="text-muted-foreground text-xs font-semibold mb-0.5 capitalize">{currentDateStr}</p>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">
                {getGreeting()}!
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-primary p-[2px] shadow-lg flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                  <span className="text-primary font-black text-sm">
                    {user?.name
                      ? user.name.trim().split(/\s+/).slice(-2).map(w => w[0].toUpperCase()).join('')
                      : '?'}
                  </span>
                </div>
              )}
            </div>
          </motion.header>

          {/* Banner Thông Báo Thiếu Ngày */}
          <AnimatePresence>
            {missingDays.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="overflow-hidden"
              >
                <button
                  onClick={() => setIsMissingModalOpen(true)}
                  className="w-full bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm backdrop-blur-md flex items-center justify-between transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <CalendarX className="w-5 h-5" />
                    <span>Có {missingDays.length} ngày trống sản lượng!</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            {/* Progress Card Bento */}
            <motion.div variants={pageItemVariants}>
              <HomeProgressCard
                dashboardData={dashboard}
                isLoading={isLoadingDashboard}
              />
            </motion.div>

            {/* Quick Tools */}
            <HomeToolsGrid isPro={user?.plan === 'pro'} />
          </div>
        </motion.div>

        <BottomNav />
      </div>

      {/* Modal báo ngày thiếu — vẫn cần SanLuongDrawer để bổ sung từ modal */}
      <SanLuongDrawer
        entry={null}
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setTimeout(() => setMissingModalInitialDate(undefined), 300);
        }}
        initialDate={missingModalInitialDate}
      />

      <MissingDaysModal
        open={isMissingModalOpen}
        onOpenChange={setIsMissingModalOpen}
        missingDays={missingDays}
        loadingDays={loadingDays}
        onConfirmNghi={handleConfirmNgayNghi}
        onOpenAddSanLuong={(dateStr) => {
          setMissingModalInitialDate(dateStr);
          setIsAddOpen(true);
        }}
      />
    </div>
  );
}
