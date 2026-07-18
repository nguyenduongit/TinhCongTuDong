import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useGetSanLuongDashboard } from '@/api';
import { getNowVNDateLocal } from '@/lib/date-utils';

import { BottomNav } from '@/components/BottomNav';
import { HomeProgressCard } from '@/components/ui-parts/HomeProgressCard';
import { HomeToolsGrid } from '@/components/ui-parts/HomeToolsGrid';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user } = useAuth();
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetSanLuongDashboard();

  const currentDateStr = format(getNowVNDateLocal(), 'EEEE, dd MMMM', { locale: vi });

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
    </div>
  );
}
