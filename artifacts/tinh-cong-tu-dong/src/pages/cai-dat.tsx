import { useState } from 'react';
import { Settings as SettingsIcon, ChevronRight, Database, HelpCircle, Info, LogOut, User as UserIcon, CalendarDays } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { CongDoanModal } from '@/components/CongDoanModal';
import { ScheduleModal } from '@/components/ScheduleModal';
import { useAuth } from '@/components/AuthProvider';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';

export default function CaiDat() {
  const [showCongDoanModal, setShowCongDoanModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { user, refetchUser, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation('/login');
    } catch (err) {
      toast.error('Đăng xuất thất bại');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">
        
        <div className="absolute top-0 left-0 right-0 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <motion.div 
          className="px-5 pt-12 flex flex-col gap-6 relative z-10 flex-1"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.header variants={pageItemVariants} className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground">
              <SettingsIcon className="w-5 h-5" />
            </div>
          </motion.header>

          <div className="flex flex-col gap-6">
            
            {/* User Profile */}
            {user && (
              <motion.div variants={pageItemVariants} className="bg-card border border-border/50 rounded-2xl squircle-xl p-4 flex items-center gap-4 shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-col flex flex-1 overflow-hidden">
                  <h3 className="font-bold text-foreground text-lg truncate">{user.name}</h3>
                  <p className="text-muted-foreground text-sm truncate">{user.email}</p>
                </div>
              </motion.div>
            )}

            {/* Section 1 */}
            <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Dữ liệu</h3>
              <div className="bg-card border border-border/50 rounded-2xl squircle-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setShowCongDoanModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Database className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Quản lý công đoạn</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>



            {/* Section 2 */}
            <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Lịch làm việc</h3>
              <div className="bg-card border border-border/50 rounded-2xl squircle-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Lịch trình cá nhân</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>

            {/* Section 3 */}
            <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Thông tin</h3>
              <div className="bg-card border border-border/50 rounded-2xl squircle-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setLocation('/huong-dan')}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors border-b border-border/50 outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Hướng dẫn sử dụng</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="w-full flex items-center justify-between p-4 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Info className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Phiên bản</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">1.0.0</span>
                </div>
              </div>
            </motion.div>

            {/* Logout */}
            <motion.div variants={pageItemVariants} className="mt-4">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors rounded-2xl squircle-xl font-bold outline-none"
              >
                <LogOut className="w-5 h-5" />
                Đăng xuất
              </button>
            </motion.div>

          </div>
        </motion.div>

        <BottomNav />
      </div>

      <CongDoanModal 
        open={showCongDoanModal} 
        onOpenChange={setShowCongDoanModal} 
        manageMode={true} 
      />

      <ScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
      />
    </div>
  );
}
