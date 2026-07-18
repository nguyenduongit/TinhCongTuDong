import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Search, Crown, X, Check, Loader2,
  Calendar, Briefcase, VenusIcon, MarsIcon, User as UserIcon,
  Users, BarChart3, Building2, Pencil
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import {
  useGetAllUsers, useAdminUpdateUserPlan, AdminUser,
  useGetSalaryTiers, SalaryTier,
  useCompanyConfig, useUpdateCompanyConfig,
} from '@/api';
import { CompanyConfig, COMPANY_CONFIG_META } from '@/lib/company-config';
import { Input } from '@/components/ui/input';
import { format, addMonths } from 'date-fns';
import { pageContainerVariants, pageItemVariants } from '@/lib/animations';

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Avatar({ src, size }: { src?: string | null; size: number }) {
  const [error, setError] = useState(false);
  const px = `${size}px`;
  if (src && !error) {
    return (
      <img src={src} alt="avatar" onError={() => setError(true)}
        style={{ width: px, height: px }} className="rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div style={{ width: px, height: px }} className="rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
        </div>
      </motion.div>
    </motion.div>
  );
}

function UsersTab() {
  const { data: users, isLoading, isError } = useGetAllUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

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
      <div className="px-5 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Tìm kiếm email, tên..." className="pl-10 h-12 bg-card/40 border-white/5 rounded-2xl"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

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
              return (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[40px_1fr_60px] items-center gap-3 px-5 py-3 cursor-pointer active:bg-white/5 transition-colors"
                  onClick={() => setSelectedUser(u)}>
                  <Avatar src={meta.avatar_url || meta.picture} size={36} />
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
        {selectedUser && <UserModal u={selectedUser} onClose={() => setSelectedUser(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 2: Bậc lương ─────────────────────────────────────────────────────────
function SalaryTiersTab() {
  const { data: tiers, isLoading } = useGetSalaryTiers();
  const [editTier, setEditTier] = useState<SalaryTier | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  const handleEdit = (t: SalaryTier) => {
    setEditTier(t);
    setEditValue(new Intl.NumberFormat('vi-VN').format(t.base_salary));
  };

  const handleSave = async () => {
    if (!editTier) return;
    setSaving(true);
    const numVal = Number(editValue.replace(/\D/g, ''));
    const { createClient } = await import('@supabase/supabase-js');
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('salary_tiers').update({ base_salary: numVal }).eq('tier_code', editTier.tier_code);
    setSaving(false);
    if (!error) {
      setSavedCode(editTier.tier_code);
      setTimeout(() => setSavedCode(null), 1500);
      setEditTier(null);
    }
  };

  return (
    <div className="px-5 pt-4 flex flex-col gap-3">
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse">Đang tải...</div>
      ) : (
        <>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Bảng bậc lương cơ bản</p>
          <div className="flex flex-col divide-y divide-white/5 bg-card/30 border border-white/5 rounded-2xl overflow-hidden">
            {(tiers ?? []).map((t) => (
              <div key={t.tier_code} className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold text-foreground text-sm">Bậc {t.tier_code}</span>
                <div className="flex items-center gap-3">
                  {savedCode === t.tier_code ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Đã lưu</span>
                  ) : (
                    <span className="text-sm font-bold text-foreground">{new Intl.NumberFormat('vi-VN').format(t.base_salary)} đ</span>
                  )}
                  <button onClick={() => handleEdit(t)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editTier && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditTier(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div className="relative w-full max-w-[430px] bg-card rounded-t-[2rem] border-t border-white/10 p-6 pb-28 flex flex-col gap-4"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center mb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
              <p className="font-bold text-foreground">Chỉnh sửa — Bậc {editTier.tier_code}</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Lương cơ bản (đ)</label>
                <Input value={editValue} inputMode="numeric"
                  onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setEditValue(raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : ''); }}
                  className="h-12 rounded-2xl bg-black/20 border-white/10 text-foreground font-bold" />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Check className="w-4 h-4" /> Lưu</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 3: Company Config ────────────────────────────────────────────────────
const formatConfigValue = (key: keyof CompanyConfig, value: number) => {
  const unit = COMPANY_CONFIG_META[key]?.unit || '';
  if (unit === '%') return `${(value * 100).toFixed(1)}%`;
  if (unit.includes('đ')) return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
  return `${value} ${unit}`;
};

function CompanyTab() {
  const { config, isLoading } = useCompanyConfig();
  const updateMutation = useUpdateCompanyConfig();
  const [editKey, setEditKey] = useState<keyof CompanyConfig | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const handleEdit = (key: keyof CompanyConfig) => {
    setEditKey(key);
    const unit = COMPANY_CONFIG_META[key]?.unit || '';
    setEditValue(unit === '%' ? String((config[key] * 100).toFixed(2)) : String(config[key]));
  };

  const handleSave = async () => {
    if (!editKey) return;
    const unit = COMPANY_CONFIG_META[editKey]?.unit || '';
    const numVal = unit === '%' ? Number(editValue) / 100 : Number(editValue.replace(/\D/g, ''));
    await updateMutation.mutateAsync({ key: editKey, value: numVal });
    setSavedKey(editKey);
    setTimeout(() => setSavedKey(null), 1500);
    setEditKey(null);
  };

  const groups: { label: string; keys: (keyof CompanyConfig)[] }[] = [
    { label: 'Phụ cấp', keys: ['meal_allowance_per_day', 'compliance_allowance'] },
    { label: 'Thưởng', keys: ['loyalty_bonus_per_year', 'skill_bonus_threshold_months', 'skill_bonus_amount'] },
    { label: 'Tăng ca', keys: ['ot_normal_multiplier', 'ot_rest_multiplier'] },
    { label: 'Bảo hiểm', keys: ['insurance_bhxh_rate', 'insurance_bhyt_rate', 'insurance_bhtn_rate'] },
  ];

  return (
    <div className="px-5 pt-4 flex flex-col gap-5">
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse">Đang tải...</div>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{group.label}</p>
            <div className="flex flex-col divide-y divide-white/5 bg-card/30 border border-white/5 rounded-2xl overflow-hidden">
              {group.keys.map((key) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-col min-w-0 flex-1 mr-3">
                    <span className="text-sm font-semibold text-foreground truncate">{COMPANY_CONFIG_META[key].label}</span>
                    {COMPANY_CONFIG_META[key].description && (
                      <span className="text-[10px] text-zinc-500">{COMPANY_CONFIG_META[key].description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {savedKey === key ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Đã lưu</span>
                    ) : (
                      <span className="text-sm font-bold text-foreground">{formatConfigValue(key, config[key])}</span>
                    )}
                    <button onClick={() => handleEdit(key)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editKey && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditKey(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div className="relative w-full max-w-[430px] bg-card rounded-t-[2rem] border-t border-white/10 p-6 pb-28 flex flex-col gap-4"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center mb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
              <p className="font-bold text-foreground">{COMPANY_CONFIG_META[editKey].label}</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Giá trị ({COMPANY_CONFIG_META[editKey].unit})
                </label>
                <Input value={editValue} inputMode="decimal"
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-12 rounded-2xl bg-black/20 border-white/10 text-foreground font-bold" />
                {COMPANY_CONFIG_META[editKey].description && (
                  <p className="text-xs text-zinc-500">{COMPANY_CONFIG_META[editKey].description}</p>
                )}
              </div>
              <button onClick={handleSave} disabled={updateMutation.isPending}
                className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                {updateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Check className="w-4 h-4" /> Lưu</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'users', label: 'User', icon: Users },
  { id: 'salary', label: 'Bậc lương', icon: BarChart3 },
  { id: 'company', label: 'Company', icon: Building2 },
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
            {activeTab === 'salary' && <SalaryTiersTab />}
            {activeTab === 'company' && <CompanyTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <BottomNav />
    </motion.div>
  );
}
