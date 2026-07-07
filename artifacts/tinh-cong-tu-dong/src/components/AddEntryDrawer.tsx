import { useState } from 'react';
import { Drawer } from 'vaul';
import { useCreateSanLuong, type CongDoan } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongTodayQueryKey, getGetSanLuongStatsQueryKey, getListSanLuongQueryKey } from '@workspace/api-client-react';
import { CongDoanModal } from './CongDoanModal';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface AddEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEntryDrawer({ open, onOpenChange }: AddEntryDrawerProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateSanLuong();
  
  const [showCongDoanModal, setShowCongDoanModal] = useState(false);
  
  const [selectedCongDoan, setSelectedCongDoan] = useState<CongDoan | null>(null);
  const [ngay, setNgay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [soLuong, setSoLuong] = useState('');
  const [thoiGian, setThoiGian] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCongDoan || !soLuong || !thoiGian || !ngay) return;

    await createMutation.mutateAsync({
      data: {
        ngay,
        cong_doan_id: selectedCongDoan.id,
        so_luong: Number(soLuong),
        thoi_gian: Number(thoiGian)
      }
    });

    queryClient.invalidateQueries({ queryKey: getGetSanLuongTodayQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSanLuongStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
    
    // Reset and close
    setSelectedCongDoan(null);
    setSoLuong('');
    setThoiGian('');
    onOpenChange(false);
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
          <Drawer.Content className="bg-background border-t border-border flex flex-col rounded-t-[2rem] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] outline-none before:absolute before:top-0 before:left-0 before:right-0 before:h-24 before:bg-gradient-to-b before:from-primary/5 before:to-transparent before:pointer-events-none">
            <div className="p-4 bg-background rounded-t-[2rem] flex-1 flex flex-col relative">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
              
              <Drawer.Title className="text-2xl font-bold text-white mb-6 px-2 tracking-tight">Thêm sản lượng</Drawer.Title>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-2 flex-1 overflow-y-auto pb-8">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Ngày</label>
                  <input 
                    type="date" 
                    required
                    value={ngay}
                    onChange={e => setNgay(e.target.value)}
                    className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-base text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all [color-scheme:dark]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Công đoạn</label>
                  <div 
                    onClick={() => setShowCongDoanModal(true)}
                    className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 flex justify-between items-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {selectedCongDoan ? (
                      <div>
                        <div className="text-sm text-primary font-bold mb-0.5">{selectedCongDoan.ma_cong_doan}</div>
                        <div className="text-base text-white font-medium">{selectedCongDoan.ten_cong_doan}</div>
                      </div>
                    ) : (
                      <span className="text-base text-muted-foreground">Chọn công đoạn...</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Số lượng</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={soLuong}
                      onChange={e => setSoLuong(e.target.value)}
                      placeholder="0"
                      className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-xl font-bold text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Thời gian <span className="normal-case font-normal">(phút)</span></label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={thoiGian}
                      onChange={e => setThoiGian(e.target.value)}
                      placeholder="0"
                      className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-xl font-bold text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center"
                    />
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending || !selectedCongDoan}
                    className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-base font-bold shadow-[0_0_20px_rgba(212,168,67,0.3)] disabled:opacity-50 disabled:shadow-none transition-transform active:scale-[0.98]"
                  >
                    {createMutation.isPending ? 'Đang lưu...' : 'Lưu sản lượng'}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {showCongDoanModal && (
        <CongDoanModal 
          open={showCongDoanModal} 
          onOpenChange={setShowCongDoanModal} 
          onSelect={setSelectedCongDoan}
        />
      )}
    </>
  );
}
