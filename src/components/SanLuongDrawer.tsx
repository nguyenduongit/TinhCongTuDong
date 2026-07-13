import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useCreateSanLuong, useUpdateSanLuong, useListCongDoan, type CongDoan, type SanLuong } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongDashboardQueryKey, getListSanLuongQueryKey } from '@/api';
import { CongDoanModal } from './CongDoanModal';
import { format, parseISO, getDay } from 'date-fns';
import { getTodayVNString } from '@/lib/date-utils';
import { SanLuongFormUI, type CongDoanBlock } from './ui-parts/SanLuongFormUI';

export interface SanLuongDrawerProps {
  entry?: SanLuong | null; // Nếu có truyền entry thì là chế độ Edit, ngược lại là Create
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SanLuongDrawer({ entry, open, onOpenChange }: SanLuongDrawerProps) {
  const isEditMode = !!entry;
  
  const queryClient = useQueryClient();
  const createMutation = useCreateSanLuong();
  const updateMutation = useUpdateSanLuong();
  
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

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

  const [ngay, setNgay] = useState(getTodayVNString());
  const [congDoanBlocks, setCongDoanBlocks] = useState<CongDoanBlock[]>([
    { id: '1', congDoan: null, soLuong: '', phanTram: '100%' }
  ]);
  const [thoiGian, setThoiGian] = useState('');
  const [thoiGianHoTro, setThoiGianHoTro] = useState('');

  // Fetch list công đoạn để pre-select item đầu tiên (cho Create Mode)
  const { data: list = [] } = useListCongDoan();

  // Khởi tạo state tùy theo mode
  useEffect(() => {
    if (!open) return;
    
    if (isEditMode && entry) {
      setNgay(entry.ngay);
      setThoiGian(entry.thoi_gian_thuc_hien.toString());
      setThoiGianHoTro((entry as any).thoi_gian_ho_tro?.toString() || '');
      setCongDoanBlocks(entry.chi_tiet.map((ct: any, idx: number) => {
        const cd = list.find(c => c.ma_cong_doan === ct.cong_doan);
        const dinh_muc_goc = cd ? Number(cd.dinh_muc) : 1;
        const phan_tram = Math.round((Number(ct.dinh_muc) / dinh_muc_goc) * 100);
        return {
          id: idx.toString(),
          congDoan: cd || { ma_cong_doan: ct.cong_doan } as any,
          soLuong: ct.so_luong.toString(),
          phanTram: `${phan_tram}%`
        };
      }));
    } else {
      // Create mode
      setNgay(getTodayVNString());
      setCongDoanBlocks([
        { id: Date.now().toString(), congDoan: list.length > 0 ? list[0] : null, soLuong: '', phanTram: '100%' }
      ]);
      setThoiGianHoTro('');
    }
  }, [entry, open, isEditMode, list]);

  // Tự động set thời gian mặc định dựa trên ngày chỉ ở Create Mode
  useEffect(() => {
    if (isEditMode || !ngay) return;
    const date = parseISO(ngay);
    const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (dayOfWeek === 0) {
      setThoiGian('0');
    } else if (dayOfWeek === 6) {
      setThoiGian('240');
    } else {
      setThoiGian('480');
    }
  }, [ngay, isEditMode]);

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
    if (!thoiGian) return;
    if (!isEditMode && !ngay) return;

    const validBlocks = congDoanBlocks.filter(block => block.congDoan && block.soLuong);
    if (validBlocks.length === 0) return;

    const chiTiet = validBlocks.map(block => ({
      cong_doan: block.congDoan!.ma_cong_doan,
      so_luong: Number(block.soLuong),
      phan_tram_dinh_muc: Number(block.phanTram.replace('%', '')) || 100
    }));

    try {
      if (isEditMode && entry) {
        await updateMutation.mutateAsync({
          id: entry.id,
          data: {
            chi_tiet: chiTiet as any,
            thoi_gian_thuc_hien: Number(thoiGian),
            thoi_gian_ho_tro: thoiGianHoTro ? Number(thoiGianHoTro) : 0
          }
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            ngay,
            chi_tiet: chiTiet as any,
            thoi_gian_thuc_hien: Number(thoiGian),
            thoi_gian_ho_tro: thoiGianHoTro ? Number(thoiGianHoTro) : 0
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: getGetSanLuongDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
      
      onOpenChange(false);
    } catch (error: any) {
      if (!isEditMode) {
        alert(error?.response?.data?.error || "Ngày này đã có sản lượng. Vui lòng nhấn vào ngày đó ở Lịch sử để thêm công đoạn thay vì tạo mới.");
      } else {
        alert(error?.response?.data?.error || "Có lỗi xảy ra khi cập nhật.");
      }
    }
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={handleDrawerOpenChange} dismissible={!showCongDoanModal}>
        <Drawer.Portal>
          <Drawer.Overlay className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 ${showCongDoanModal ? 'pointer-events-none' : ''}`} />
          <Drawer.Content className="bg-background border-t border-border flex flex-col rounded-t-[2rem] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] outline-none before:absolute before:top-0 before:left-0 before:right-0 before:h-24 before:bg-gradient-to-b before:from-primary/5 before:to-transparent before:pointer-events-none">
            <div className="p-4 bg-background rounded-t-[2rem] flex-1 flex flex-col relative min-h-0">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
              
              <Drawer.Title className="text-2xl font-bold text-foreground mb-6 px-2 tracking-tight">
                {isEditMode ? 'Cập nhật sản lượng' : 'Thêm sản lượng'}
              </Drawer.Title>
              
              <SanLuongFormUI 
                readOnly={false}
                readOnlyNgay={isEditMode}
                isPending={isPending}
                submitText={isEditMode ? 'Cập nhật' : 'Lưu sản lượng'}
                ngay={ngay}
                congDoanBlocks={congDoanBlocks}
                thoiGian={thoiGian}
                thoiGianHoTro={thoiGianHoTro}
                setNgay={setNgay}
                setThoiGian={setThoiGian}
                setThoiGianHoTro={setThoiGianHoTro}
                openCongDoanModal={openCongDoanModal}
                handleBlockSoLuongChange={handleBlockSoLuongChange}
                handleBlockPhanTramChange={handleBlockPhanTramChange}
                handleRemoveBlock={handleRemoveBlock}
                handleAddBlock={handleAddBlock}
                onSubmit={handleSubmit}
              />
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
