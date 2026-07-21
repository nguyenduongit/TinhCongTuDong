import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import {
  useListCongDoan,
  useCreateCongDoan,
  useUpdateCongDoan,
  useDeleteCongDoan,
  useUpdateDinhMucQuyCach,
  type CongDoan
} from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getListCongDoanQueryKey } from '@/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { CongDoanFormUI, parseQuyCach } from './ui-parts/CongDoanFormUI';
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

interface CongDoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (congDoan: CongDoan) => void;
  manageMode?: boolean;
}

export function CongDoanModal({ open, onOpenChange, onSelect, manageMode = false }: CongDoanModalProps) {
  const queryClient = useQueryClient();
  const { data: list = [], isLoading } = useListCongDoan({ query: { enabled: open, queryKey: getListCongDoanQueryKey() } });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const createMutation = useCreateCongDoan();
  const updateMutation = useUpdateCongDoan();
  const deleteMutation = useDeleteCongDoan();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ma_cong_doan = formData.get('ma_cong_doan') as string;
    const quy_cach = formData.get('quy_cach_sl') ? `${formData.get('quy_cach_sl')}pcs/${formData.get('quy_cach_unit')}` : '';

    await createMutation.mutateAsync({
      data: {
        ma_cong_doan,
        ten_cong_doan: formData.get('ten_cong_doan') as string,
        dinh_muc: Number(formData.get('dinh_muc')),
        quy_cach,
      }
    });

    queryClient.invalidateQueries({ queryKey: getListCongDoanQueryKey() });
    setIsAdding(false);
  };

  const handleUpdate = async (id: number, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ma_cong_doan = formData.get('ma_cong_doan') as string;
    const quy_cach = formData.get('quy_cach_sl') ? `${formData.get('quy_cach_sl')}pcs/${formData.get('quy_cach_unit')}` : '';

    await updateMutation.mutateAsync({
      id,
      data: {
        ma_cong_doan,
        ten_cong_doan: formData.get('ten_cong_doan') as string,
        dinh_muc: Number(formData.get('dinh_muc')),
        quy_cach,
      }
    });

    queryClient.invalidateQueries({ queryKey: getListCongDoanQueryKey() });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (deleteConfirmId !== null) {
      await deleteMutation.mutateAsync({ id: deleteConfirmId });
      queryClient.invalidateQueries({ queryKey: getListCongDoanQueryKey() });
      setDeleteConfirmId(null);
    }
  };

  const handleRowClick = (c: CongDoan) => {
    if (!manageMode && onSelect && editingId === null) {
      onSelect(c);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60]" />
        <Dialog.Content className="fixed inset-0 z-[60] flex justify-center sm:items-center sm:p-4">
          <div className="w-full max-w-[430px] bg-background/80 backdrop-blur-xl sm:rounded-[2rem] sm:border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden h-full sm:h-[85vh] relative">
            
            {/* Background effects */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent blur-[60px] pointer-events-none rounded-full transform -translate-y-1/2" />

            <header className="flex items-center justify-between p-5 border-b border-white/5 relative z-10 shrink-0">
              <Dialog.Title className="text-lg font-bold text-foreground tracking-tight">
                {manageMode ? 'Quản lý công đoạn' : 'Chọn công đoạn'}
              </Dialog.Title>
              <div className="flex gap-2">
                <Dialog.Close asChild>
                  <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-muted-foreground border border-white/5 hover:text-foreground hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pb-20 flex flex-col gap-3 relative z-0">
              <AnimatePresence initial={false}>
                {isAdding && (
                  <motion.div
                    key="add-form"
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="shrink-0 overflow-hidden"
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
                    <div key={i} className="bg-black/20 border border-white/5 rounded-3xl p-4 flex items-center justify-between mb-1 shrink-0">
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
              ) : list.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm flex flex-col items-center gap-2 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-zinc-500" />
                  </div>
                  Chưa có công đoạn nào.
                </div>
              ) : (
                list.map(c => (
                  editingId === c.id ? (
                    <div key={c.id} className="mb-1 shrink-0">
                      <CongDoanFormUI 
                        onSubmit={(e) => handleUpdate(c.id, e)}
                        onCancel={() => setEditingId(null)}
                        isPending={updateMutation.isPending}
                        defaultValues={c}
                        isEditing={true}
                      />
                    </div>
                  ) : (
                    <div
                      key={c.id}
                      onClick={() => handleRowClick(c)}
                      className={cn(
                        "bg-card/40 backdrop-blur-sm border border-white/5 rounded-3xl p-4 flex items-center justify-between group transition-all relative overflow-hidden mb-1 shrink-0",
                        !manageMode && editingId === null && "cursor-pointer hover:border-primary/50 hover:bg-card/60 active:scale-[0.98]"
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

                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditingId(c.id)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-400/20 transition-all">
                          <Pencil className="w-4.5 h-4.5" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(c.id)} disabled={deleteMutation.isPending} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 border border-transparent hover:border-rose-400/20 transition-all">
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  )
                ))
              )}

              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-1 shrink-0 w-full flex items-center justify-center gap-2 rounded-3xl border border-dashed border-primary/30 bg-primary/5 text-primary font-bold text-sm py-4 hover:bg-primary/10 hover:border-primary/50 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-4.5 h-4.5" />
                  Thêm công đoạn
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-background/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bạn có chắc chắn muốn xóa công đoạn này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5 hover:text-foreground">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 font-bold">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog.Root>
  );
}
