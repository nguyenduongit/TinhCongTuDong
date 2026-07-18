import { useState, useEffect } from 'react';
import { ChevronRight, Database, HelpCircle, Info, LogOut, User as UserIcon, Diamond } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';

import { ProfileModal } from '@/components/ProfileModal';

export default function CaiDat() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, refetchUser, signOut } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
      // Bắt buộc làm mới JWT token để lấy user_metadata (thuộc tính Pro) mới nhất từ server
      supabase.auth.refreshSession().then(({ error }) => {
        if (!error) {
          refetchUser();
          toast.success("Thanh toán thành công! Chào mừng bạn đến với gói Pro 💎");
        }
        // Xoá query param để không hiện lại toast khi reload
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else if (params.get('status') === 'cancel') {
      toast.error("Bạn đã huỷ giao dịch thanh toán.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchUser]);

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
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl overflow-x-hidden">
        
        {/* Nền Blur cực quang */}
        <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-purple-500/10 via-primary/5 to-transparent blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <motion.div 
          className="px-5 pt-5 flex flex-col gap-6 relative z-10 flex-1"
          variants={pageContainerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="flex flex-col gap-6">
            
            {/* User Profile */}
            {user && (
              <motion.button 
                variants={pageItemVariants} 
                onClick={() => setShowProfileModal(true)}
                className="w-full text-left bg-card/60 backdrop-blur-md border border-white/5 rounded-3xl p-4 flex items-center gap-4 shadow-lg relative overflow-hidden hover:bg-card/80 transition-colors"
              >
                <div className="absolute top-0 right-0 p-16 bg-primary/10 rounded-full blur-[40px] -mr-8 -mt-8 pointer-events-none" />
                
                <div className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-full border border-white/10 object-cover shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-col flex flex-1 overflow-hidden relative z-10">
                  <h3 className="font-bold text-foreground text-lg truncate">{user.name}</h3>
                  <p className="text-muted-foreground text-[13px] truncate mb-2">{user.email}</p>
                  <div className="flex items-center gap-2">
                    {user.plan === 'pro' ? (
                      <>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-primary/20 border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase tracking-wider shadow-inner">
                          <span className="text-[10px] leading-none">&#128142;</span>
                          Pro
                        </div>
                        {user.proExpiryDate && (
                          <span className="text-[11px] text-zinc-400 font-medium">
                            HSD: {new Date(user.proExpiryDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                          Free
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUpgradeModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-purple-600 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                        >
                          <span className="text-[10px] leading-none">&#128142;</span>
                          Nâng cấp Pro
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.button>
            )}

            {/* Section 1 */}
            <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-4 mb-1">Dữ liệu</h3>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setLocation('/cong-cu/cong-doan')}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors outline-none group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                      <Database className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Quản lý công đoạn</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                </button>
              </div>
            </motion.div>

            {/* Section 3 (was Section 3, now Section 2) */}
            <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-4 mb-1">Thông tin</h3>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setLocation('/huong-dan')}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors border-b border-white/5 outline-none group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-400 border border-zinc-500/20 group-hover:bg-zinc-500/20 transition-colors">
                      <HelpCircle className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Hướng dẫn sử dụng</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
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
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors border-b border-white/5 outline-none group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    </div>
                    <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Đăng ký nhận thông báo</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                </button>
                {user && (
                <button 
                  onClick={async () => {
                    try {
                      toast.loading("Đang gửi thử thông báo...", { id: "test-notify" });
                      const { supabase } = await import('@/lib/supabase');
                      const { data, error } = await supabase.functions.invoke('send-daily-reminder', {
                        body: { testUserId: user.id }
                      });
                      if (error) throw error;
                      // Check for application-level errors returned in response body
                      if (data?.error) {
                        const onesignalErrors = data?.onesignal?.errors;
                        const detail = Array.isArray(onesignalErrors) ? onesignalErrors.join(', ') : JSON.stringify(data.onesignal);
                        toast.error(`Lỗi từ OneSignal: ${detail}`, { id: "test-notify" });
                        console.error("OneSignal debug:", data.debug);
                      } else {
                        toast.success("Đã gửi! Vui lòng kiểm tra màn hình của bạn.", { id: "test-notify" });
                      }
                    } catch (err: any) {
                      toast.error(`Lỗi: ${err?.message || "Không xác định"}`, { id: "test-notify" });
                      console.error(err);
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors border-b border-white/5 outline-none group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </div>
                    <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Test Gửi Thông Báo</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                </button>
                )}
                <div className="w-full flex items-center justify-between p-4 bg-transparent">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-400 border border-zinc-500/20">
                      <Info className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground/90">Phiên bản</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-bold bg-white/5 px-2 py-1 rounded-md border border-white/5">1.0.0</span>
                </div>
              </div>
            </motion.div>

            {/* Logout */}
            <motion.div variants={pageItemVariants} className="mt-2 mb-4">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors rounded-3xl border border-rose-500/20 font-bold outline-none shadow-sm"
              >
                <LogOut className="w-5 h-5" />
                Đăng xuất
              </button>
            </motion.div>

          </div>
        </motion.div>

        <BottomNav />
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <ProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} />
    </div>
  );
}
