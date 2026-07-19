import { useState, useEffect } from 'react';
import { ChevronRight, Database, HelpCircle, Info, LogOut, User as UserIcon, Diamond, Gift, Copy, Check, Link2, Users } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';

import { useGetThongTinLuong, useUpdateProfile, useGetSalaryTiers, useGetMyReferralCode, useGetMyReferrals } from '@/api';

// ─── Referral Card Component ──────────────────────────────────────────────────
function ReferralCard() {
  const { data: referralCode, isLoading: codeLoading } = useGetMyReferralCode();
  const { data: myReferrals = [] } = useGetMyReferrals();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const completedCount = myReferrals.filter(r => r.status === 'completed').length;
  const trackingCount = myReferrals.filter(r => r.status === 'tracking').length;

  const handleCopyLink = async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Đã copy link mời!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Không thể copy');
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success('Đã copy mã giới thiệu!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Không thể copy');
    }
  };

  return (
    <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-4 mb-1">Mời bạn bè</h3>
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/15 via-cyan-500/10 to-primary/10 backdrop-blur-md border border-purple-500/20 rounded-3xl p-5 shadow-lg">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-cyan-500/15 rounded-full blur-[40px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center border border-purple-500/30 shadow-inner">
              <Gift className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Mời bạn bè nhận Pro</h4>
              <p className="text-[11px] text-muted-foreground">Bạn được tặng 3 tháng Pro khi mời bạn bè sử dụng </p>
            </div>
          </div>

          {/* Referral Code Display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-black/20 rounded-xl px-4 py-2.5 border border-white/10">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Mã giới thiệu</div>
              {codeLoading ? (
                <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
              ) : (
                <div className="text-lg font-mono font-black text-foreground tracking-[0.25em] select-all">
                  {referralCode}
                </div>
              )}
            </div>
            <button
              onClick={handleCopyCode}
              className="shrink-0 w-11 h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all active:scale-95"
              title="Copy mã"
            >
              {copiedCode ? (
                <Check className="w-4.5 h-4.5 text-emerald-400" />
              ) : (
                <Copy className="w-4.5 h-4.5 text-zinc-400" />
              )}
            </button>
          </div>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-purple-500/80 to-purple-600/80 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-purple-500/20 border border-purple-400/20"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                Đã copy!
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Copy link mời
              </>
            )}
          </button>

          {/* Stats */}
          {myReferrals.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Users className="w-3.5 h-3.5" />
                <span>Đã mời: <span className="font-bold text-foreground">{myReferrals.length}</span></span>
              </div>
              {trackingCount > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-400 font-medium">{trackingCount} đang theo dõi</span>
                </div>
              )}
              {completedCount > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 font-medium">{completedCount} thành công</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CaiDat() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user, refetchUser, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profileData } = useGetThongTinLuong();
  const { data: salaryTiers = [] } = useGetSalaryTiers();
  const updateMutation = useUpdateProfile();

  const handleUpdate = async (field: string, value: string | number | null) => {
    try {
      await updateMutation.mutateAsync({ [field]: value } as any);
      toast.success('Đã cập nhật!');
    } catch (e: any) {
      toast.error('Lỗi khi cập nhật: ' + e.message);
    }
  };

  const handleUpdateName = async (name: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });
      if (error) throw error;
      refetchUser();
      toast.success('Đã cập nhật tên!');
    } catch (e: any) {
      toast.error('Lỗi khi cập nhật tên: ' + e.message);
    }
  };

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
              <div
                className="w-full text-left bg-card/60 backdrop-blur-md border border-white/5 rounded-3xl p-4 flex items-center gap-4 shadow-lg relative overflow-hidden"
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
                  <input
                    type="text"
                    defaultValue={user.name || ''}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value !== user.name) {
                        handleUpdateName(e.target.value);
                      }
                    }}
                    placeholder="Tên của bạn..."
                    className="font-bold text-foreground text-lg w-full bg-transparent border-none outline-none p-0 focus:ring-0 focus:text-primary transition-colors truncate"
                  />
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
              </div>
            )}

            {user && profileData && (
              <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-4 mb-1">Hồ sơ cá nhân</h3>
                <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-sm text-sm">


                  {/* Giới tính */}
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <span className="font-semibold text-foreground/90">Giới tính</span>
                    <select
                      value={profileData?.gioi_tinh || ''}
                      onChange={(e) => handleUpdate('gioi_tinh', e.target.value)}
                      className="bg-transparent border-none outline-none text-muted-foreground text-right appearance-none focus:text-foreground"
                    >
                      <option value="" disabled>Chưa chọn</option>
                      <option value="nam" className="bg-background">Nam</option>
                      <option value="nu" className="bg-background">Nữ</option>
                    </select>
                  </div>

                  {/* Bậc lương */}
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <span className="font-semibold text-foreground/90">Bậc lương</span>
                    <select
                      value={profileData?.bac_luong || ''}
                      onChange={(e) => handleUpdate('bac_luong', e.target.value)}
                      className="bg-transparent border-none outline-none text-muted-foreground text-right appearance-none focus:text-foreground"
                    >
                      <option value="" disabled>Chưa chọn</option>
                      {salaryTiers.map(t => (
                        <option key={t.tier_code} value={t.tier_code} className="bg-background">{t.tier_code}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lương cơ bản */}
                  {profileData?.bac_luong && (
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <span className="font-semibold text-foreground/90">Lương cơ bản</span>
                      <span className="text-muted-foreground text-right">
                        {new Intl.NumberFormat('vi-VN').format(salaryTiers.find(t => t.tier_code === profileData.bac_luong)?.base_salary || 0)} VNĐ
                      </span>
                    </div>
                  )}

                  {/* Ngày vào công ty */}
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <span className="font-semibold text-foreground/90">Ngày vào công ty</span>
                    <input
                      type="date"
                      value={profileData?.ngay_vao_cong_ty || ''}
                      onChange={(e) => handleUpdate('ngay_vao_cong_ty', e.target.value || null)}
                      className="bg-transparent border-none outline-none text-muted-foreground text-right focus:text-foreground [&::-webkit-calendar-picker-indicator]:invert-[0.5]"
                    />
                  </div>

                  {/* Ngày ký hợp đồng */}
                  <div className="flex items-center justify-between p-4">
                    <span className="font-semibold text-foreground/90">Ngày ký hợp đồng</span>
                    <input
                      type="date"
                      value={profileData?.ngay_ky_hop_dong || ''}
                      onChange={(e) => handleUpdate('ngay_ky_hop_dong', e.target.value || null)}
                      className="bg-transparent border-none outline-none text-muted-foreground text-right focus:text-foreground [&::-webkit-calendar-picker-indicator]:invert-[0.5]"
                    />
                  </div>

                </div>
              </motion.div>
            )}

            {/* Referral Card */}
            {user && <ReferralCard />}


            {/* Section 3 (was Section 3, now Section 2) */}
            <motion.div variants={pageItemVariants} className="flex flex-col gap-2">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-4 mb-1">Thông tin</h3>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-sm">

                <button
                  onClick={() => {
                    import('@/lib/push').then(({ requestPushPermission }) => {
                      if (user?.id) {
                        requestPushPermission(user.id).then((success) => {
                          if (success) {
                            toast.success("Đã bật thông báo thành công!");
                          } else {
                            toast.error("Không thể đăng ký nhận thông báo. Bạn có thể đã từ chối quyền hoặc trình duyệt không hỗ trợ.");
                          }
                        });
                      } else {
                        toast.error("Vui lòng đăng nhập trước.");
                      }
                    });
                  }}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors border-b border-white/5 outline-none group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Đăng ký nhận thông báo</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                </button>

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
    </div>
  );
}
