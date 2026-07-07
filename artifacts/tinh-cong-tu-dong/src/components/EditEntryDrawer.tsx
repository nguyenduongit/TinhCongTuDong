import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useUpdateSanLuong, type SanLuong } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongTodayQueryKey, getGetSanLuongStatsQueryKey, getListSanLuongQueryKey } from '@workspace/api-client-react';

interface EditEntryDrawerProps {
  entry: SanLuong | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEntryDrawer({ entry, open, onOpenChange }: EditEntryDrawerProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateSanLuong();
  
  const [soLuong, setSoLuong] = useState('');
  const [thoiGian, setThoiGian] = useState('');

  useEffect(() => {
    if (entry && open) {
      setSoLuong(entry.so_luong.toString());
      setThoiGian(entry.thoi_gian.toString());
    }
  }, [entry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !soLuong || !thoiGian) return;

    await updateMutation.mutateAsync({
      id: entry.id,
      data: {
        so_luong: Number(soLuong),
        thoi_gian: Number(thoiGian)
      }
    });

    queryClient.invalidateQueries({ queryKey: getGetSanLuongTodayQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
    
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
        <Drawer.Content className="bg-background border-t border-border flex flex-col rounded-t-[2rem] mt-24 fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] outline-none">
          <div className="p-4 bg-background rounded-t-[2rem] flex-1 flex flex-col">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
            
            <Drawer.Title className="text-2xl font-bold text-white mb-1 px-2 tracking-tight">Cập nhật sản lượng</Drawer.Title>
            <div className="px-2 mb-6">
              <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {entry?.cong_doan?.ma_cong_doan} - {entry?.cong_doan?.ten_cong_doan}
              </span>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-2 pb-8">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Số lượng</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={soLuong}
                    onChange={e => setSoLuong(e.target.value)}
                    className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-xl font-bold text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Thời gian (phút)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={thoiGian}
                    onChange={e => setThoiGian(e.target.value)}
                    className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-xl font-bold text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4">
                <button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-base font-bold shadow-[0_0_20px_rgba(212,168,67,0.3)] disabled:opacity-50 disabled:shadow-none transition-transform active:scale-[0.98]"
                >
                  {updateMutation.isPending ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
