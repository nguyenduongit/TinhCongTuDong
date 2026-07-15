import { useState } from 'react';
import { Settings as SettingsIcon, ChevronRight, Database, HelpCircle, Info, LogOut, User as UserIcon, CalendarDays, Search, Diamond } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { CongDoanModal } from '@/components/CongDoanModal';
import { EstimationModal } from '@/components/EstimationModal';
import { QuotaLookupModal } from '@/components/QuotaLookupModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useAuth } from '@/components/AuthProvider';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';

export default function CaiDat() {
  const [showCongDoanModal, setShowCongDoanModal] = useState(false);
  const [showEstimationModal, setShowEstimationModal] = useState(false);
  const [showQuotaLookupModal, setShowQuotaLookupModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
                  <p className="text-muted-foreground text-sm truncate mb-2">{user.email}</p>
                  <div className="flex items-center gap-2">
                    {user.plan === 'pro' ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-bold uppercase tracking-wider">
                        <span className="kim-cuong-tim text-[12px] leading-none">&#128142;</span>
                        Pro: {user.proExpiryDate ? `${Math.max(0, Math.ceil((new Date(user.proExpiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} ngày` : ''}
                      </div>
                    ) : (
                      <>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                          Free
                        </div>
                        <button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-purple-600 transition-colors shadow-sm shadow-purple-500/20"
                        >
                          <span className="kim-cuong-tim text-[10px] leading-none">&#128142;</span>
                          Nâng cấp Pro
                        </button>
                      </>
                    )}
                  </div>
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
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Công cụ</h3>
              <div className="bg-card border border-border/50 rounded-2xl squircle-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => user?.plan === 'pro' ? setShowEstimationModal(true) : toast.error("Chức năng chỉ có ở tài khoản Pro", { icon: "💎" })}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Tính toán Dự tính
                      <span className="kim-cuong-tim text-[14px] leading-none drop-shadow-sm">&#128142;</span>
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="h-[1px] w-full bg-border/50" />
                <button 
                  onClick={() => user?.plan === 'pro' ? setShowQuotaLookupModal(true) : toast.error("Chức năng chỉ có ở tài khoản Pro", { icon: "💎" })}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <Search className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Tra cứu định mức
                      <span className="kim-cuong-tim text-[14px] leading-none drop-shadow-sm">&#128142;</span>
                    </span>
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
                <button 
                  onClick={() => {
                    import('@/lib/onesignal').then(({ requestOneSignalPermission }) => {
                      requestOneSignalPermission().then((accepted) => {
                        if (accepted) {
                          toast.success("Đã bật thông báo thành công!");
                        } else {
                          toast.error("Bạn đã từ chối nhận thông báo.");
                        }
                      });
                    });
                  }}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors border-b border-border/50 outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    </div>
                    <span className="text-sm font-semibold text-foreground">Đăng ký nhận thông báo</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                {user && (
                <button 
                  onClick={async () => {
                    try {
                      toast.loading("Đang gửi thử thông báo...", { id: "test-notify" });
                      const { supabase } = await import('@/lib/supabase');
                      const { error } = await supabase.functions.invoke('send-daily-reminder', {
                        body: { testUserId: user.id }
                      });
                      if (error) throw error;
                      toast.success("Đã gửi! Vui lòng kiểm tra màn hình của bạn.", { id: "test-notify" });
                    } catch (err) {
                      toast.error("Lỗi khi gửi thông báo test.", { id: "test-notify" });
                      console.error(err);
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors border-b border-border/50 outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </div>
                    <span className="text-sm font-semibold text-foreground">Test Gửi Thông Báo</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                )}
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

      <EstimationModal open={showEstimationModal} onOpenChange={setShowEstimationModal} />
      <QuotaLookupModal open={showQuotaLookupModal} onOpenChange={setShowQuotaLookupModal} />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
}
