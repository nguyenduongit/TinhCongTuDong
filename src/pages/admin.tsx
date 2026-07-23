import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Search, Crown, X, Check, Loader2,
  Calendar, Briefcase, VenusIcon, MarsIcon, User as UserIcon,
  Users, Pencil, Gift, ArrowRight, Trash2,
  Clock, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import {
  useGetAllUsers, useAdminUpdateUserPlan, AdminUser, useAdminDeleteUser,
  useAdminGetReferrals, useAdminGetUserDailyEntries,
  ReferralInfo, DailyEntry,
  useAdminListDinhMuc, useAdminCreateDinhMuc, useAdminUpdateDinhMuc, useAdminDeleteDinhMuc, DinhMuc,
  useUpdateDinhMucQuyCach, useAdminListQuyCachSuggestions
} from '@/api';
import { Input } from '@/components/ui/input';
import { format, addMonths } from 'date-fns';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';
import { getCycleMonthFromDate, getCycleStringFromYearMonth, getNowVNDateLocal } from '@/lib/date-utils';

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Avatar({ src, size, className = '' }: { src?: string | null; size: number; className?: string }) {
  const [error, setError] = useState(false);
  const px = `${size}px`;
  if (src && !error) {
    return (
      <img src={src} alt="avatar" onError={() => setError(true)}
        style={{ width: px, height: px }} className={`rounded-full object-cover shrink-0 ${className}`} />
    );
  }
  return (
    <div style={{ width: px, height: px }} className={`rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${className}`}>
      <UserIcon style={{ width: size * 0.45, height: size * 0.45 }} className="text-primary" />
    </div>
  );
}

function InfoCard({ icon, label, value, className = '' }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`bg-white/5 rounded-xl p-3 flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-zinc-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

// Nhãn theo day_of_week gốc từ DB (0 = CN ... 6 = T7, chuẩn JS getDay())
const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
// Thứ tự hiển thị cột lịch: T2 -> CN
const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// ─── Tab 1: Users ─────────────────────────────────────────────────────────────
function UserModal({ u, onClose }: { u: AdminUser; onClose: () => void }) {
  const meta = u.raw_user_metadata || {};
  const profile = meta.profile || {};
  const currentPlan: 'free' | 'pro' = meta.plan === 'pro' || meta.subscription?.plan === 'pro' ? 'pro' : 'free';
  const currentExpiry = meta.subscription?.expires_at || meta.pro_expires_at || '';

  const [editPlan, setEditPlan] = useState<'free' | 'pro'>(currentPlan);
  const [editExpiry, setEditExpiry] = useState(
    currentExpiry ? currentExpiry.split('T')[0] : format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [saved, setSaved] = useState(false);
  const updateMutation = useAdminUpdateUserPlan();
  const deleteMutation = useAdminDeleteUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const name = meta.full_name || u.email?.split('@')[0] || 'Unknown';

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      targetUserId: u.id,
      plan: editPlan,
      expiresAt: editPlan === 'pro' ? new Date(editExpiry).toISOString() : null,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ targetUserId: u.id });
      onClose();
    } catch (e) {
      alert('Lỗi xóa user: ' + (e as Error).message);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-[430px] bg-card rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-hidden"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
          <X className="w-4 h-4" />
        </button>
        <div className="px-6 pb-28 flex flex-col gap-5 max-h-[85dvh] overflow-y-auto">
          <div className="flex items-center gap-4 pt-2">
            <Avatar src={meta.avatar_url || meta.picture} size={56} />
            <div className="flex flex-col min-w-0">
              <span className="font-black text-foreground text-lg truncate">{name}</span>
              <span className="text-sm text-muted-foreground truncate">{u.email}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<Calendar className="w-4 h-4" />} label="Ngày tạo" value={format(new Date(u.created_at), 'dd/MM/yyyy')} />
            <InfoCard
              icon={profile.gioi_tinh === 'nu' ? <VenusIcon className="w-4 h-4 text-pink-400" /> : <MarsIcon className="w-4 h-4 text-blue-400" />}
              label="Giới tính" value={profile.gioi_tinh === 'nu' ? 'Nữ' : profile.gioi_tinh === 'nam' ? 'Nam' : 'Chưa nhập'} />
            <InfoCard icon={<Briefcase className="w-4 h-4" />} label="Bậc lương" value={profile.bac_luong ? `Bậc ${profile.bac_luong}` : '---'} />
            <InfoCard icon={<Calendar className="w-4 h-4" />} label="Ngày vào làm" value={profile.ngay_vao ? format(new Date(profile.ngay_vao), 'dd/MM/yyyy') : '---'} />
            {currentPlan === 'pro' && currentExpiry && (
              <InfoCard icon={<Crown className="w-4 h-4 text-amber-400" />} label="Hết hạn PRO" value={format(new Date(currentExpiry), 'dd/MM/yyyy')} className="col-span-2" />
            )}
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tùy chỉnh gói</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEditPlan('free')} className={`h-11 rounded-xl text-sm font-bold border transition-all ${editPlan === 'free' ? 'bg-white/10 border-white/20 text-foreground' : 'bg-transparent border-white/5 text-zinc-500'}`}>FREE</button>
              <button onClick={() => setEditPlan('pro')} className={`h-11 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${editPlan === 'pro' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-transparent border-white/5 text-zinc-500'}`}>
                <Crown className="w-3.5 h-3.5" /> PRO
              </button>
            </div>
            <AnimatePresence>
              {editPlan === 'pro' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Ngày hết hạn</label>
                    <input type="date" value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)}
                      className="h-11 w-full rounded-xl bg-black/30 border border-white/10 text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={handleSave} disabled={updateMutation.isPending || saved}
              className="h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 bg-primary text-primary-foreground">
              {saved ? <><Check className="w-4 h-4" /> Đã lưu!</> : updateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Check className="w-4 h-4" /> Lưu thay đổi</>}
            </button>
          </div>

          <div className="h-px bg-white/5 mt-2" />
          
          <div className="flex flex-col gap-2">
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Xóa người dùng này
              </button>
            ) : (
              <div className="flex flex-col gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <p className="text-sm text-rose-200 text-center font-medium">Bạn có chắc chắn muốn xóa vĩnh viễn user này? Toàn bộ dữ liệu của họ sẽ bị xóa sạch.</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-11 rounded-xl text-sm font-bold bg-white/10 text-foreground hover:bg-white/20 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-70 transition-colors"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận xóa'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Modal xem lịch nhập sản lượng của 1 user bất kỳ (chuyển từ tab Referral sang).
// Không còn gắn với kỳ theo dõi referral -- cho phép admin xem theo từng Tháng
// Công (21 -> 20), điều hướng qua lại giữa các tháng.
function UserSanLuongModal({ u, onClose }: { u: AdminUser; onClose: () => void }) {
  const meta = u.raw_user_metadata || {};
  const name = meta.full_name || u.email?.split('@')[0] || 'Unknown';

  const [cycleDate, setCycleDate] = useState<Date>(() => getCycleMonthFromDate(getNowVNDateLocal()));
  const cycleYear = cycleDate.getFullYear();
  const cycleMonth = cycleDate.getMonth() + 1;
  const { cycleStartStr, cycleEndStr } = getCycleStringFromYearMonth(cycleYear, cycleMonth);

  const { data: dailyEntries, isLoading } = useAdminGetUserDailyEntries(u.id, cycleStartStr, cycleEndStr);
  const [selectedDay, setSelectedDay] = useState<DailyEntry | null>(null);

  const goPrevMonth = () => { setSelectedDay(null); setCycleDate(d => addMonths(d, -1)); };
  const goNextMonth = () => { setSelectedDay(null); setCycleDate(d => addMonths(d, 1)); };

  const stats = useMemo(() => {
    if (!dailyEntries) return { total: 0, entered: 0 };
    const relevant = dailyEntries.filter(d => d.is_workday && new Date(d.ngay) <= new Date());
    return { total: relevant.length, entered: relevant.filter(d => d.has_entry).length };
  }, [dailyEntries]);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-[430px] bg-card rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-hidden"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
          <X className="w-4 h-4" />
        </button>

        <div className="px-5 pb-28 flex flex-col gap-5 max-h-[85dvh] overflow-y-auto">
          {/* Header: user info */}
          <div className="flex items-center gap-3 pt-1 pr-8">
            <Avatar src={meta.avatar_url || meta.picture} size={40} />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground truncate">{name}</span>
              <span className="text-[11px] text-zinc-500 truncate">{u.email}</span>
            </div>
          </div>

          {/* Month navigator */}
          <div className="flex items-center justify-between bg-white/5 rounded-2xl p-1.5">
            <button onClick={goPrevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-foreground">Tháng công {cycleMonth}/{cycleYear}</span>
              <span className="text-[10px] text-zinc-500">
                {format(new Date(cycleStartStr), 'dd/MM')} → {format(new Date(cycleEndStr), 'dd/MM/yyyy')}
              </span>
            </div>
            <button onClick={goNextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Simple stat */}
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-zinc-400">Đã nhập sản lượng</span>
            <span className="font-bold text-foreground">{stats.entered}/{stats.total} ngày LV</span>
          </div>

          {/* Calendar Heatmap */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Lịch nhập sản lượng</p>
            {isLoading ? (
              <div className="text-center py-6 text-muted-foreground animate-pulse text-sm">Đang tải...</div>
            ) : (
              <div className="bg-black/20 rounded-2xl border border-white/5 p-3">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAY_HEADERS.map(d => (
                    <div key={d} className="text-center text-[9px] text-zinc-600 font-bold">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    if (!dailyEntries || dailyEntries.length === 0) return null;

                    const firstDow = dailyEntries[0].day_of_week;
                    const firstColIndex = (firstDow + 6) % 7;
                    const paddingCells = Array.from({ length: firstColIndex }, (_, i) => (
                      <div key={`pad-${i}`} className="aspect-[5/4]" />
                    ));

                    const dayCells = dailyEntries.map((entry) => {
                      const dayNum = new Date(entry.ngay).getDate();
                      const isToday = entry.ngay === new Date().toISOString().slice(0, 10);
                      const isFuture = new Date(entry.ngay) > new Date();
                      const isSelected = selectedDay?.ngay === entry.ngay;

                      let bgClass = 'bg-white/5 text-zinc-600'; // default / future
                      let dot = null;

                      if (!isFuture) {
                        if (!entry.is_workday) {
                          bgClass = 'bg-zinc-800/50 text-zinc-600'; // Sunday / off day
                        } else if (entry.has_entry) {
                          bgClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'; // ✅ đã nhập
                          dot = <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-400" />;
                        } else {
                          bgClass = 'bg-rose-500/15 text-rose-400 border-rose-500/25'; // ❌ chưa nhập
                          dot = <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-rose-400" />;
                        }
                      }

                      const ringClass = isSelected
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-background z-10 scale-105'
                        : isToday
                          ? 'ring-1 ring-primary/50'
                          : 'border-transparent';

                      return (
                        <button
                          key={entry.ngay}
                          onClick={() => !isFuture && entry.is_workday ? setSelectedDay(entry) : null}
                          className={`aspect-[5/4] rounded-lg flex flex-col items-center justify-center relative text-[11px] font-bold border transition-all ${bgClass} ${ringClass} ${!isFuture && entry.is_workday ? 'cursor-pointer hover:brightness-125 active:scale-90' : 'cursor-default'}`}
                        >
                          {dayNum}
                          {dot}
                        </button>
                      );
                    });

                    return [...paddingCells, ...dayCells];
                  })()}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
                    <span className="text-[9px] text-zinc-500">Đã nhập</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-rose-500/25 border border-rose-500/35" />
                    <span className="text-[9px] text-zinc-500">Chưa nhập</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800/50" />
                    <span className="text-[9px] text-zinc-500">Nghỉ</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Day Detail */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/5 rounded-2xl border border-white/10 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-[13px] font-bold text-foreground">
                        {format(new Date(selectedDay.ngay), 'dd/MM/yyyy')} ({DOW_LABELS[selectedDay.day_of_week]})
                      </span>
                    </div>
                    <button onClick={() => setSelectedDay(null)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-zinc-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {selectedDay.has_entry ? (
                    <>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-black/20 rounded-xl p-2">
                          <div className="text-[9px] text-zinc-500 font-bold uppercase">Tổng công SP</div>
                          <div className="text-[13px] font-bold text-emerald-400">{Number(selectedDay.total_cong_sp).toFixed(3)}</div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-2">
                          <div className="text-[9px] text-zinc-500 font-bold uppercase">Thời gian</div>
                          <div className="text-[13px] font-bold text-foreground">{selectedDay.total_time} phút</div>
                        </div>
                      </div>

                      {selectedDay.entries.map((entry: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-1 bg-black/10 rounded-xl p-2 border border-white/5">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                            <span>Lần nhập #{idx + 1}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.thoi_gian_thuc_hien}p + {entry.thoi_gian_ho_tro || 0}p HT</span>
                          </div>
                          {Array.isArray(entry.chi_tiet) && entry.chi_tiet.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                              {entry.chi_tiet.map((ct: any, j: number) => (
                                <div key={j} className="flex items-center justify-between text-[11px]">
                                  <span className="text-zinc-400 font-mono">{ct.cong_doan}</span>
                                  <span className="text-foreground font-semibold">SL: {ct.so_luong} → {Number(ct.cong_sp).toFixed(3)} công</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-3 text-rose-400 text-sm font-medium">
                      ❌ Chưa nhập sản lượng ngày này
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Menu hiện ra khi nhấn giữ 1 dòng user: chọn xem Profile hay Sản lượng.
function UserActionSheet({ u, onClose, onSelectProfile, onSelectSanLuong }: {
  u: AdminUser;
  onClose: () => void;
  onSelectProfile: () => void;
  onSelectSanLuong: () => void;
}) {
  const meta = u.raw_user_metadata || {};
  const name = meta.full_name || u.email?.split('@')[0] || 'Unknown';

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-[430px] bg-card rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-hidden pb-8"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <div className="px-5 pt-2 pb-4 flex items-center gap-3 border-b border-white/5">
          <Avatar src={meta.avatar_url || meta.picture} size={40} />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">{name}</span>
            <span className="text-[11px] text-zinc-500 truncate">{u.email}</span>
          </div>
        </div>
        <div className="px-5 pt-3 flex flex-col gap-2">
          <button
            onClick={onSelectProfile}
            className="h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 px-4 text-left hover:bg-white/10 active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <UserIcon className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Profile</span>
              <span className="text-[11px] text-zinc-500">Thông tin, gói Pro, xóa tài khoản</span>
            </div>
          </button>
          <button
            onClick={onSelectSanLuong}
            className="h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 px-4 text-left hover:bg-white/10 active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Sản lượng</span>
              <span className="text-[11px] text-zinc-500">Lịch theo dõi nhập sản lượng theo tháng</span>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UsersTab() {
  const { data: users, isLoading, isError } = useGetAllUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [menuUser, setMenuUser] = useState<AdminUser | null>(null);
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [sanLuongUser, setSanLuongUser] = useState<AdminUser | null>(null);

  // Phát hiện "nhấn giữ" (long-press) bằng sự kiện contextmenu -- trình duyệt
  // di động (Chrome Android, Safari iOS) tự bắn sự kiện này khi người dùng giữ
  // tay trên màn hình đủ lâu, không cần tự viết timer thủ công.
  const handleLongPress = (e: React.MouseEvent, u: AdminUser) => {
    e.preventDefault();
    setMenuUser(u);
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const email = u.email?.toLowerCase() || '';
      const name = u.raw_user_metadata?.full_name?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      return email.includes(term) || name.includes(term);
    });
  }, [users, searchTerm]);

  return (
    <div className="flex flex-col gap-0">
      <div className="px-5 pt-4 pb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Tìm kiếm email, tên..." className="pl-10 h-12 bg-card/40 border-white/5 rounded-2xl"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="px-5 pb-2 text-[11px] text-zinc-500">Nhấn giữ vào một người dùng để xem tùy chọn</div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse px-5">Đang tải...</div>
      ) : isError ? (
        <div className="mx-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-sm text-rose-400">⚠️ Chưa tạo RPC function trên Supabase.</div>
      ) : (
        <>
          <div className="px-5 mb-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Danh sách ({filteredUsers.length})
          </div>
          <div className="grid grid-cols-[40px_1fr_60px] items-center gap-3 px-5 py-2 border-b border-white/5">
            <div />
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tên / Email</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Gói</div>
          </div>
          <div className="divide-y divide-white/5">
            {filteredUsers.map((u, i) => {
              const meta = u.raw_user_metadata || {};
              const plan: 'free' | 'pro' = meta.plan === 'pro' || meta.subscription?.plan === 'pro' ? 'pro' : 'free';
              const name = meta.full_name || u.email?.split('@')[0] || 'Unknown';
              const isAdminUser = meta.isAdmin === true || meta.isAdmin === 'true' || meta.isadmin === true || meta.isadmin === 'true';
              return (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[40px_1fr_60px] items-center gap-3 px-5 py-3 cursor-pointer active:bg-white/5 transition-colors select-none [-webkit-touch-callout:none]"
                  onContextMenu={(e) => handleLongPress(e, u)}>
                  {isAdminUser ? (
                    <div className="relative flex items-center justify-center shrink-0 w-[40px] h-[40px]">
                      {/* Lớp blur phát sáng */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-500 blur-sm opacity-80"
                      />
                      {/* Lớp viền gradient sắc nét */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute inset-[1px] rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-500"
                      />
                      {/* Nền đen bên trong để cắt viền */}
                      <div className="absolute inset-[3px] bg-background rounded-full z-0" />
                      {/* Avatar */}
                      <div className="relative z-10 flex items-center justify-center">
                        <Avatar src={meta.avatar_url || meta.picture} size={34} />
                      </div>
                    </div>
                  ) : (
                    <Avatar src={meta.avatar_url || meta.picture} size={36} />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground text-sm truncate leading-tight">{name}</span>
                    <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">{u.email}</span>
                  </div>
                  <div className="flex justify-end">
                    {plan === 'pro' ? (
                      <div className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase flex items-center gap-1 whitespace-nowrap"><Crown className="w-3 h-3" /> PRO</div>
                    ) : (
                      <div className="bg-white/5 text-zinc-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase whitespace-nowrap">FREE</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {menuUser && (
          <UserActionSheet
            u={menuUser}
            onClose={() => setMenuUser(null)}
            onSelectProfile={() => { setProfileUser(menuUser); setMenuUser(null); }}
            onSelectSanLuong={() => { setSanLuongUser(menuUser); setMenuUser(null); }}
          />
        )}
        {profileUser && <UserModal u={profileUser} onClose={() => setProfileUser(null)} />}
        {sanLuongUser && <UserSanLuongModal u={sanLuongUser} onClose={() => setSanLuongUser(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 4: Referral ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  tracking: { label: 'Đang theo dõi', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  completed: { label: 'Hoàn thành', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  failed: { label: 'Thất bại', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
};

function ReferralTab() {
  const { data: referrals, isLoading, isError } = useAdminGetReferrals();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRefs = useMemo(() => {
    if (!referrals) return [];
    if (!searchTerm) return referrals;
    const term = searchTerm.toLowerCase();
    return referrals.filter(r =>
      r.referrer_name.toLowerCase().includes(term) ||
      r.referee_name.toLowerCase().includes(term) ||
      r.referrer_email.toLowerCase().includes(term) ||
      r.referee_email.toLowerCase().includes(term) ||
      r.referral_code.toLowerCase().includes(term)
    );
  }, [referrals, searchTerm]);

  const stats = useMemo(() => {
    if (!referrals) return { total: 0, tracking: 0, completed: 0, failed: 0 };
    return {
      total: referrals.length,
      tracking: referrals.filter(r => r.status === 'tracking').length,
      completed: referrals.filter(r => r.status === 'completed').length,
      failed: referrals.filter(r => r.status === 'failed').length,
    };
  }, [referrals]);

  return (
    <div className="flex flex-col gap-0">
      {/* Search */}
      <div className="px-5 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Tìm theo tên, email, mã ref..."
            className="pl-10 h-12 bg-card/40 border-white/5 rounded-2xl"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/5 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-foreground">{stats.total}</div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase">Tổng</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-2.5 text-center border border-amber-500/20">
            <div className="text-lg font-black text-amber-400">{stats.tracking}</div>
            <div className="text-[9px] text-amber-400/70 font-bold uppercase">Theo dõi</div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-2.5 text-center border border-emerald-500/20">
            <div className="text-lg font-black text-emerald-400">{stats.completed}</div>
            <div className="text-[9px] text-emerald-400/70 font-bold uppercase">Thành công</div>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-2.5 text-center border border-rose-500/20">
            <div className="text-lg font-black text-rose-400">{stats.failed}</div>
            <div className="text-[9px] text-rose-400/70 font-bold uppercase">Thất bại</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse px-5">Đang tải...</div>
      ) : isError ? (
        <div className="mx-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-sm text-rose-400">
          ⚠️ Chưa tạo RPC function `admin_get_referrals` trên Supabase.
        </div>
      ) : filteredRefs.length === 0 ? (
        <div className="text-center py-10 flex flex-col items-center gap-3 px-5">
          <Gift className="w-10 h-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">Chưa có lượt giới thiệu nào</p>
        </div>
      ) : (
        <>
          <div className="px-5 mb-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Danh sách ({filteredRefs.length})
          </div>

          <div className="divide-y divide-white/5">
            {filteredRefs.map((ref, i) => {
              const statusCfg = STATUS_CONFIG[ref.status] || STATUS_CONFIG.tracking;

              return (
                <motion.div
                  key={ref.referral_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-5 py-3.5"
                >
                  {/* Row: Referrer → Referee + Status */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Avatar src={ref.referrer_avatar} size={28} />
                      <span className="text-xs font-semibold text-foreground truncate">{ref.referrer_name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Avatar src={ref.referee_avatar} size={28} />
                      <span className="text-xs font-semibold text-foreground truncate">{ref.referee_name}</span>
                    </div>
                    <div className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border} uppercase`}>
                      {statusCfg.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Tab 5: Dinh Muc (Định Mức) ────────────────────────────────────────────────
function DinhMucModal({ dm, onClose }: { dm?: DinhMuc; onClose: () => void }) {
  const isEdit = !!dm;
  const createMutation = useAdminCreateDinhMuc();
  const updateMutation = useAdminUpdateDinhMuc();

  const [formData, setFormData] = useState<Partial<DinhMuc>>(dm || {
    product_code: '',
    product_name: '',
    level_1_0: 1,
    level_1_1: 1,
    level_2_0: 1,
    level_2_1: 1,
    level_2_2: 1,
    level_2_5: 1,
    quy_cach: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (isEdit) {
        await updateMutation.mutateAsync(formData as Omit<DinhMuc, 'created_at'>);
      } else {
        await createMutation.mutateAsync(formData as Omit<DinhMuc, 'created_at'>);
      }
      onClose();
    } catch (e) {
      alert('Lỗi lưu định mức: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-[430px] bg-card rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-hidden"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
          <X className="w-4 h-4" />
        </button>
        <div className="px-6 pb-28 pt-4 flex flex-col gap-4 max-h-[85dvh] overflow-y-auto hide-scrollbar">
          <h2 className="text-xl font-bold">{isEdit ? 'Sửa Định Mức' : 'Thêm Định Mức'}</h2>
          
          <div className="space-y-2">
            <span className="text-xs text-zinc-400 font-bold uppercase">Mã Công Đoạn</span>
            <Input 
              value={formData.product_code || ''} 
              onChange={e => setFormData({ ...formData, product_code: e.target.value })} 
              disabled={isEdit}
              placeholder="Ví dụ: 3.1"
              className="bg-black/20"
            />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-zinc-400 font-bold uppercase">Tên Công Đoạn</span>
            <Input 
              value={formData.product_name || ''} 
              onChange={e => setFormData({ ...formData, product_name: e.target.value })} 
              placeholder="Tên công đoạn..."
              className="bg-black/20"
            />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-zinc-400 font-bold uppercase">Quy cách (Tùy chọn)</span>
            <Input 
              value={formData.quy_cach || ''} 
              onChange={e => setFormData({ ...formData, quy_cach: e.target.value })} 
              placeholder="VD: 270pcs/hộp"
              className="bg-black/20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {['1_0', '1_1', '2_0', '2_1', '2_2', '2_5'].map(lvl => (
              <div key={lvl} className="space-y-2">
                <span className="text-xs text-zinc-400 font-bold uppercase">Bậc {lvl.replace('_', '.')}</span>
                <Input 
                  inputMode="decimal"
                  value={String((formData as any)[`level_${lvl}`] || '')} 
                  onChange={e => setFormData({ ...formData, [`level_${lvl}`]: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })} 
                  className="bg-black/20"
                />
              </div>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving || !formData.product_code} className="mt-4 w-full h-12 bg-primary text-primary-foreground font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? 'Lưu Thay Đổi' : 'Tạo Mới')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DuyetQuyCachModal({ onClose }: { onClose: () => void }) {
  const { data: suggestions = [], isLoading } = useAdminListQuyCachSuggestions();
  const updateQc = useUpdateDinhMucQuyCach();

  const handleDuyet = async (productCode: string, quyCach: string) => {
    try {
      await updateQc.mutateAsync({ productCode, quyCach });
    } catch(e) {
      alert('Lỗi: ' + (e as Error).message);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-[430px] bg-card rounded-t-[2rem] border-t border-white/10 shadow-2xl overflow-hidden"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
          <X className="w-4 h-4" />
        </button>
        <div className="px-6 pb-28 pt-4 flex flex-col gap-4 max-h-[85dvh] overflow-y-auto hide-scrollbar">
          <h2 className="text-xl font-bold">Duyệt Quy Cách</h2>
          
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">Không có đề xuất quy cách nào.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {suggestions.map((s, i) => (
                <div key={i} className="bg-black/20 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-black text-amber-500">{s.ma_cong_doan}</span>
                    <span className="text-sm font-semibold text-foreground/80">{s.ten_cong_doan}</span>
                    <span className="text-xs text-primary font-bold mt-1">QC: {s.quy_cach}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDuyet(s.ma_cong_doan, s.quy_cach)} disabled={updateQc.isPending} className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 disabled:opacity-50">
                      {updateQc.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function DinhMucTab() {
  const { data: list = [], isLoading } = useAdminListDinhMuc();
  const deleteMutation = useAdminDeleteDinhMuc();
  
  const [search, setSearch] = useState('');
  const [editingDm, setEditingDm] = useState<DinhMuc | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDuyetModalOpen, setIsDuyetModalOpen] = useState(false);
  
  const { data: suggestions = [] } = useAdminListQuyCachSuggestions();

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(dm => dm.product_code.toLowerCase().includes(s) || dm.product_name.toLowerCase().includes(s));
  }, [list, search]);

  const handleDelete = (code: string) => {
    if (confirm(`Bạn có chắc muốn xóa định mức ${code}?`)) {
      deleteMutation.mutate(code);
    }
  };

  const openEdit = (dm: DinhMuc) => {
    setEditingDm(dm);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingDm(undefined);
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="px-5 flex flex-col gap-5 pb-8 pt-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã / tên công đoạn..." 
            className="pl-9 bg-black/20 border-white/5 rounded-xl h-11"
          />
        </div>
        <button onClick={() => setIsDuyetModalOpen(true)} className="relative h-11 px-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold whitespace-nowrap flex items-center gap-2">
          Duyệt QC
          {suggestions.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
              {suggestions.length}
            </span>
          )}
        </button>
        <button onClick={openCreate} className="h-11 px-4 bg-primary text-primary-foreground rounded-xl font-bold whitespace-nowrap">
          + Thêm
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(dm => (
          <div key={dm.product_code} className="bg-card/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-black text-amber-500">{dm.product_code}</span>
                <span className="text-sm font-semibold">{dm.product_name}</span>
                {dm.quy_cach && <span className="text-xs text-zinc-400 font-medium mt-0.5">QC: {dm.quy_cach}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(dm)} className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(dm.product_code)} disabled={deleteMutation.isPending} className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/20 p-2 rounded-lg flex flex-col items-center"><span className="text-[10px] text-zinc-500 font-bold">1.0</span><span className="text-xs font-bold">{dm.level_1_0}</span></div>
              <div className="bg-black/20 p-2 rounded-lg flex flex-col items-center"><span className="text-[10px] text-zinc-500 font-bold">1.1</span><span className="text-xs font-bold">{dm.level_1_1}</span></div>
              <div className="bg-black/20 p-2 rounded-lg flex flex-col items-center"><span className="text-[10px] text-zinc-500 font-bold">2.0</span><span className="text-xs font-bold">{dm.level_2_0}</span></div>
              <div className="bg-black/20 p-2 rounded-lg flex flex-col items-center"><span className="text-[10px] text-zinc-500 font-bold">2.1</span><span className="text-xs font-bold">{dm.level_2_1}</span></div>
              <div className="bg-black/20 p-2 rounded-lg flex flex-col items-center"><span className="text-[10px] text-zinc-500 font-bold">2.2</span><span className="text-xs font-bold">{dm.level_2_2}</span></div>
              <div className="bg-black/20 p-2 rounded-lg flex flex-col items-center"><span className="text-[10px] text-zinc-500 font-bold">2.5</span><span className="text-xs font-bold">{dm.level_2_5}</span></div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">Không tìm thấy định mức nào.</div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && <DinhMucModal dm={editingDm} onClose={() => setIsModalOpen(false)} />}
        {isDuyetModalOpen && <DuyetQuyCachModal onClose={() => setIsDuyetModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

const TABS = [
  { id: 'users', label: 'User', icon: Users },
  { id: 'referral', label: 'Referral', icon: Gift },
  { id: 'dinhmuc', label: 'Định mức', icon: Briefcase },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('users');

  return (
    <motion.div variants={pageContainerVariants} initial="hidden" animate="show"
      className="pb-32 max-w-[430px] mx-auto min-h-[100dvh] overflow-x-hidden">

      {/* Header with tab bar */}
      <motion.div variants={pageItemVariants} className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 px-5 pt-8 pb-4">
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
          <span className="text-xl font-black text-foreground tracking-tight">Admin</span>
        </div>
        <div className="grid grid-cols-3 px-5 pb-0 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${isActive ? 'text-primary border-primary bg-primary/5' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab content */}
      <motion.div variants={pageItemVariants} key={activeTab}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'referral' && <ReferralTab />}
            {activeTab === 'dinhmuc' && <DinhMucTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <BottomNav />
    </motion.div>
  );
}
