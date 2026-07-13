import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Plus, X, Pencil, Trash2 } from 'lucide-react';
import {
  useListCongDoan,
  useCreateCongDoan,
  useUpdateCongDoan,
  useDeleteCongDoan,
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

  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const createMutation = useCreateCongDoan();
  const updateMutation = useUpdateCongDoan();
  const deleteMutation = useDeleteCongDoan();

  const filteredList = list.filter(c =>
    c.ten_cong_doan.toLowerCase().includes(search.toLowerCase()) ||
    c.ma_cong_doan.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createMutation.mutateAsync({
      data: {
        ma_cong_doan: formData.get('ma_cong_doan') as string,
        ten_cong_doan: formData.get('ten_cong_doan') as string,
        dinh_muc: Number(formData.get('dinh_muc')),
        quy_cach: formData.get('quy_cach_sl') ? `${formData.get('quy_cach_sl')}pcs/${formData.get('quy_cach_unit')}` : '',
      }
    });
    queryClient.invalidateQueries({ queryKey: getListCongDoanQueryKey() });
    setIsAdding(false);
  };

  const handleUpdate = async (id: number, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateMutation.mutateAsync({
      id,
      data: {
        ma_cong_doan: formData.get('ma_cong_doan') as string,
        ten_cong_doan: formData.get('ten_cong_doan') as string,
        dinh_muc: Number(formData.get('dinh_muc')),
        quy_cach: formData.get('quy_cach_sl') ? `${formData.get('quy_cach_sl')}pcs/${formData.get('quy_cach_unit')}` : '',
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
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]" />
        <Dialog.Content className="fixed inset-0 z-[60] flex justify-center bg-background sm:p-4">
          <div className="w-full max-w-[430px] bg-background sm:rounded-[2rem] sm:border border-border/50 shadow-2xl flex flex-col overflow-hidden h-full sm:h-[90vh] relative sm:top-[5vh]">

            <header className="flex items-center justify-between p-4 border-b border-border/50 bg-card z-10 shrink-0">
              <Dialog.Title className="text-lg font-bold text-foreground tracking-tight">
                {manageMode ? 'Quản lý công đoạn' : 'Chọn công đoạn'}
              </Dialog.Title>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <Dialog.Close asChild>
                  <button className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
            </header>

            <div className="p-4 bg-card border-b border-border/50 shrink-0 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm mã hoặc tên..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-secondary border border-border/50 rounded-xl squircle-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-20 flex flex-col gap-3 relative z-0">
              <AnimatePresence>
                {isAdding && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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
                    <div key={i} className="bg-card border border-border/50 rounded-2xl squircle-xl p-4 flex items-center justify-between mb-1">
                      <div className="flex-1 min-w-0 pr-4 pl-1 space-y-2">
                        <Skeleton className="h-5 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-1/2 rounded-md" />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Skeleton className="w-9 h-9 rounded-xl squircle-lg" />
                        <Skeleton className="w-9 h-9 rounded-xl squircle-lg" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredList.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">Không tìm thấy công đoạn nào.</div>
              ) : (
                filteredList.map(c => (
                  editingId === c.id ? (
                    <div key={c.id} className="mb-1">
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
                        "bg-card border border-border/50 rounded-2xl squircle-xl p-4 flex items-center justify-between group transition-colors relative overflow-hidden mb-1",
                        !manageMode && editingId === null && "cursor-pointer hover:border-primary/50 active:scale-[0.98]"
                      )}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0 pr-4 pl-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 tracking-wider">
                            {c.ma_cong_doan}
                          </span>
                          <h4 className="font-bold text-foreground truncate text-sm">{c.ten_cong_doan}</h4>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                          <span>ĐM: <span className="text-foreground">{c.dinh_muc}</span></span>
                          {c.quy_cach && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border self-center"></span>
                              <span className="truncate max-w-[150px]">QC: <span className="text-foreground">{c.quy_cach}</span></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-card/80 backdrop-blur" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditingId(c.id)} className="w-9 h-9 flex items-center justify-center rounded-xl squircle-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(c.id)} disabled={deleteMutation.isPending} className="w-9 h-9 flex items-center justify-center rounded-xl squircle-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa công đoạn này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog.Root>
  );
}
