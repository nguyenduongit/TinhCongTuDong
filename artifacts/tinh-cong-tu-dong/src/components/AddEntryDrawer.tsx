import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useCreateSanLuong, useListCongDoan, type CongDoan } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongTodayQueryKey, getGetSanLuongStatsQueryKey, getListSanLuongQueryKey } from '@workspace/api-client-react';
import { CongDoanModal } from './CongDoanModal';
import { ChevronRight, Plus, X } from 'lucide-react';
import { format, parseISO, getDay } from 'date-fns';

interface CongDoanBlock {
  id: string;
  congDoan: CongDoan | null;
  soLuong: string;
  phanTram: string;
}

interface AddEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEntryDrawer({ open, onOpenChange }: AddEntryDrawerProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateSanLuong();
  
  const [showCongDoanModal, setShowCongDoanModal] = useState(false);
  const [modalTargetIndex, setModalTargetIndex] = useState<number | null>(null);
  const isModalOpenRef = React.useRef(false);

  const openCongDoanModal = (index: number) => {
    isModalOpenRef.current = true;
    setModalTargetIndex(index);
    setShowCongDoanModal(true);
  };

  const handleCongDoanModalChange = (open: boolean) => {
    setShowCongDoanModal(open);
    if (!open) {
      setTimeout(() => {
        isModalOpenRef.current = false;
        setModalTargetIndex(null);
      }, 100);
    } else {
      isModalOpenRef.current = true;
    }
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (isModalOpenRef.current) return;
    onOpenChange(open);
  };

  const [ngay, setNgay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [congDoanBlocks, setCongDoanBlocks] = useState<CongDoanBlock[]>([
    { id: '1', congDoan: null, soLuong: '', phanTram: '100%' }
  ]);
  const [thoiGian, setThoiGian] = useState('');
  const [thoiGianHoTro, setThoiGianHoTro] = useState('');

  // Tự động set thời gian mặc định dựa trên ngày
  useEffect(() => {
    if (!ngay) return;
    const date = parseISO(ngay);
    const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (dayOfWeek === 0) {
      setThoiGian('0');
    } else if (dayOfWeek === 6) {
      setThoiGian('240');
    } else {
      setThoiGian('480');
    }
  }, [ngay]);

  // Fetch list công đoạn để pre-select item đầu tiên
  const { data: list = [] } = useListCongDoan();

  useEffect(() => {
    if (list.length > 0 && congDoanBlocks.length === 1 && !congDoanBlocks[0].congDoan) {
      setCongDoanBlocks([
        { ...congDoanBlocks[0], congDoan: list[0] }
      ]);
    }
  }, [list]);

  const handleAddBlock = () => {
    setCongDoanBlocks([...congDoanBlocks, { id: Date.now().toString(), congDoan: list.length > 0 ? list[0] : null, soLuong: '', phanTram: '100%' }]);
  };

  const handleRemoveBlock = (id: string) => {
    if (congDoanBlocks.length > 1) {
      setCongDoanBlocks(congDoanBlocks.filter(block => block.id !== id));
    }
  };

  const handleSelectCongDoan = (congDoan: CongDoan) => {
    if (modalTargetIndex !== null) {
      const updatedBlocks = [...congDoanBlocks];
      updatedBlocks[modalTargetIndex].congDoan = congDoan;
      setCongDoanBlocks(updatedBlocks);
    }
  };

  const handleBlockSoLuongChange = (id: string, value: string) => {
    const updatedBlocks = congDoanBlocks.map(block =>
      block.id === id ? { ...block, soLuong: value } : block
    );
    setCongDoanBlocks(updatedBlocks);
  };

  const handleBlockPhanTramChange = (id: string, value: string) => {
    const updatedBlocks = congDoanBlocks.map(block =>
      block.id === id ? { ...block, phanTram: value } : block
    );
    setCongDoanBlocks(updatedBlocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoiGian || !ngay) return;

    const validBlocks = congDoanBlocks.filter(block => block.congDoan && block.soLuong);
    if (validBlocks.length === 0) return;

    // Tạo chi_tiet array từ các block
    const chiTiet = validBlocks.map(block => ({
      cong_doan: block.congDoan!.ma_cong_doan,
      so_luong: Number(block.soLuong),
      phan_tram_dinh_muc: Number(block.phanTram.replace('%', '')) || 100
    }));

    try {
      // Lưu 1 record với cấu trúc mới
      await createMutation.mutateAsync({
        data: {
          ngay,
          chi_tiet: chiTiet as any,
          thoi_gian_thuc_hien: Number(thoiGian),
          thoi_gian_ho_tro: thoiGianHoTro ? Number(thoiGianHoTro) : 0
        }
      });

      queryClient.invalidateQueries({ queryKey: getGetSanLuongTodayQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSanLuongStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
      
      // Reset and close
      setNgay(format(new Date(), 'yyyy-MM-dd'));
      setCongDoanBlocks([{ id: Date.now().toString(), congDoan: null, soLuong: '', phanTram: '100%' }]);
      setThoiGian('');
      setThoiGianHoTro('');
      onOpenChange(false);
    } catch (error: any) {
      alert(error?.response?.data?.error || "Ngày này đã có sản lượng. Vui lòng nhấn vào ngày đó ở Lịch sử để thêm công đoạn thay vì tạo mới.");
    }
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={handleDrawerOpenChange} dismissible={!showCongDoanModal}>
        <Drawer.Portal>
          <Drawer.Overlay className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 ${showCongDoanModal ? 'pointer-events-none' : ''}`} />
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

                <div className="flex flex-col gap-3">
                  {congDoanBlocks.map((block, index) => (
                    <div key={block.id} className="flex gap-2 items-center">
                      <div 
                        onClick={() => openCongDoanModal(index)}
                        className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl px-4 py-3.5 flex justify-center items-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        {block.congDoan ? (
                          <span className="text-base text-primary font-bold">{block.congDoan.ma_cong_doan}</span>
                        ) : (
                          <span className="text-base text-muted-foreground">Công đoạn</span>
                        )}
                      </div>
                      
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={block.soLuong}
                        onChange={e => handleBlockSoLuongChange(block.id, e.target.value)}
                        placeholder="SL"
                        className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl px-3 py-3.5 text-base font-bold text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      
                      <input 
                        type="text" 
                        inputMode="numeric"
                        required
                        value={block.phanTram}
                        onFocus={() => {
                          if (block.phanTram.includes('%')) {
                            handleBlockPhanTramChange(block.id, block.phanTram.replace('%', ''));
                          }
                        }}
                        onBlur={() => {
                          if (block.phanTram && !block.phanTram.includes('%')) {
                            handleBlockPhanTramChange(block.id, block.phanTram + '%');
                          }
                        }}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9%]/g, '');
                          handleBlockPhanTramChange(block.id, val);
                        }}
                        placeholder="%"
                        className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl px-3 py-3.5 text-base font-bold text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center"
                      />
                      
                      {congDoanBlocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(block.id)}
                          className="w-12 h-12 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Thêm công đoạn</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Thời gian thực hiện <span className="normal-case font-normal">(phút)</span></label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={thoiGian}
                    onChange={e => setThoiGian(e.target.value)}
                    placeholder="0"
                    className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-xl font-bold text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Thời gian hỗ trợ <span className="normal-case font-normal">(phút)</span></label>
                  <input 
                    type="number" 
                    min="0"
                    value={thoiGianHoTro}
                    onChange={e => setThoiGianHoTro(e.target.value)}
                    placeholder="0"
                    className="w-full bg-card border border-border/50 rounded-xl px-4 py-3.5 text-xl font-bold text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <div className="mt-auto pt-6">
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending}
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
          onOpenChange={handleCongDoanModalChange} 
          onSelect={handleSelectCongDoan}
        />
      )}
    </>
  );
}
