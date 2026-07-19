import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Plus, ChevronLeft, Trash2 } from 'lucide-react';
import {
  useListCongDoan,
  useCreateCongDoan,
  useDeleteCongDoan,
  useGetThongTinLuong,
  useUpdateProfile,
  type CongDoan
} from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getListCongDoanQueryKey } from '@/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { CongDoanFormUI, parseQuyCach } from '@/components/ui-parts/CongDoanFormUI';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function CongDoanPage() {
  const [, setLocation] = useLocation();
  const manageMode = true;
  const queryClient = useQueryClient();
  const { data: list = [], isLoading } = useListCongDoan({ query: { enabled: true, queryKey: getListCongDoanQueryKey() } });

  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: profile } = useGetThongTinLuong();
  const updateProfile = useUpdateProfile();

  const createMutation = useCreateCongDoan();
  const deleteMutation = useDeleteCongDoan();

  const filteredList = list.filter(c =>
    c.ten_cong_doan.toLowerCase().includes(search.toLowerCase()) ||
    c.ma_cong_doan.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ma_cong_doan = formData.get('ma_cong_doan') as string;
    const quy_cach = formData.get('quy_cach_sl') ? `${formData.get('quy_cach_sl')}pcs/${formData.get('quy_cach_unit')}` : '';
    const bac_luong = formData.get('bac_luong') as string;
    
    await createMutation.mutateAsync({
      data: {
        ma_cong_doan,
        ten_cong_doan: formData.get('ten_cong_doan') as string,
        dinh_muc: Number(formData.get('dinh_muc')),
        quy_cach,
      }
    });

    if (!profile?.bac_luong && bac_luong) {
      // Lưu lại bậc lương này làm mặc định cho user
      await updateProfile.mutateAsync({
        ngay_vao_cong_ty: profile?.ngay_vao_cong_ty || null,
        ngay_ky_hop_dong: profile?.ngay_ky_hop_dong || null,
        gioi_tinh: profile?.gioi_tinh || null,
        bac_luong,
        menstrual_dates: profile?.menstrual_dates || {}
      });
    }

    queryClient.invalidateQueries({ queryKey: getListCongDoanQueryKey() });
    setIsAdding(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId !== null) {
      try {
        await deleteMutation.mutateAsync({ id: deleteConfirmId });
        queryClient.invalidateQueries({ queryKey: getListCongDoanQueryKey() });
        toast.success("Đã xóa công đoạn");
      } catch (err: any) {
        toast.error(err.message || "Đã xảy ra lỗi khi xóa");
      }
      setDeleteConfirmId(null);
    }
  };

  const handleRowClick = (c: CongDoan) => {
    // No-op for page
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden">
        <div className="w-full max-w-[430px] mx-auto bg-background flex flex-col h-[100dvh] relative">
            
            {/* Background effects */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent blur-[60px] pointer-events-none rounded-full transform -translate-y-1/2" />

            <header className="flex items-center justify-between p-5 border-b border-white/5 relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setLocation('/')}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-muted-foreground border border-white/5 hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  Quản lý công đoạn
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="p-4 border-b border-white/5 shrink-0 relative z-10">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm kiếm mã hoặc tên..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-black/40 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-20 flex flex-col gap-3 relative z-0">
              <AnimatePresence>
                {isAdding && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-2 shrink-0"
                  >
                    <CongDoanFormUI 
                      onSubmit={handleCreate}
                      onCancel={() => setIsAdding(false)}
                      isPending={createMutation.isPending}
                      isEditing={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-black/20 border border-white/5 rounded-3xl p-4 flex items-center justify-between mb-1">
                      <div className="flex-1 min-w-0 pr-4 pl-1 space-y-2">
                        <Skeleton className="h-5 w-3/4 rounded-md bg-white/5" />
                        <Skeleton className="h-4 w-1/2 rounded-md bg-white/5" />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Skeleton className="w-9 h-9 rounded-xl bg-white/5" />
                        <Skeleton className="w-9 h-9 rounded-xl bg-white/5" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredList.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Search className="w-6 h-6 text-zinc-500" />
                  </div>
                  Không tìm thấy công đoạn nào.
                </div>
              ) : (
                filteredList.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className={cn(
                        "bg-card/40 backdrop-blur-sm border border-white/5 rounded-3xl p-4 flex items-center justify-between group transition-all relative overflow-hidden mb-1",
                        !manageMode && "cursor-pointer hover:border-primary/50 hover:bg-card/60 active:scale-[0.98]"
                      )}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0 pr-4 pl-2">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 tracking-wider shadow-sm">
                            {c.ma_cong_doan}
                          </span>
                          <h4 className="font-bold text-foreground truncate text-sm">{c.ten_cong_doan}</h4>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400 font-medium">
                          <span>ĐM: <span className="text-foreground">{c.dinh_muc}</span></span>
                          {c.quy_cach && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-white/20 self-center"></span>
                              <span className="truncate max-w-[150px]">QC: <span className="text-foreground">{c.quy_cach}</span></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <button onClick={() => setDeleteConfirmId(c.id)} disabled={deleteMutation.isPending} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 border border-transparent hover:border-rose-400/20 transition-all">
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                ))
              )}
            </div>
          </div>
          
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-background/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl w-[90%] max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Đang có sản lượng cho công đoạn này. Bạn có thực sự muốn xóa ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-2">
            <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5 hover:text-foreground w-full">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 font-bold w-full m-0">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
