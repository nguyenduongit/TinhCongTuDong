import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useCreateSanLuong, useUpdateSanLuong, useDeleteSanLuong, useListCongDoan, type CongDoan, type SanLuong } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSanLuongDashboardQueryKey, getListSanLuongQueryKey } from '@/api';
import { CongDoanModal } from './CongDoanModal';
import { format, parseISO, getDay } from 'date-fns';
import { getTodayVNString } from '@/lib/date-utils';
import { getWorkMinutesForDay } from '@/lib/work-rules';
import { SanLuongFormUI, type CongDoanBlock } from './ui-parts/SanLuongFormUI';

/**
 * Theo dõi VisualViewport thực tế của trình duyệt (đã trừ phần bị bàn phím che).
 * Cần thiết vì trên iOS ở chế độ PWA cài màn hình chính (standalone), WebKit KHÔNG
 * tự co layout viewport khi bàn phím mở (bỏ qua cả `interactive-widget` meta lẫn
 * đơn vị `dvh`), mà chỉ tự dịch các phần tử `position: fixed` lên một cách không
 * chính xác. Dùng thẳng VisualViewport API để tự tính chiều cao khả dụng và
 * khoảng bị che bởi bàn phím, rồi gán trực tiếp qua inline style.
 */
function useVisualViewportInsets() {
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const [insets, setInsets] = useState(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    keyboardHeight: 0,
  }));

  useEffect(() => {
    // window.innerHeight (layout viewport) không bị co lại khi bàn phím mở trên
    // iOS standalone PWA, nên dùng nó làm mốc "chiều cao toàn màn hình" ổn định.
    const updateWindowHeight = () => setWindowHeight(window.innerHeight);
    updateWindowHeight();
    window.addEventListener('resize', updateWindowHeight);

    const vv = window.visualViewport;
    if (!vv) return () => window.removeEventListener('resize', updateWindowHeight);

    const update = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInsets({ height: vv.height, keyboardHeight });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', updateWindowHeight);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return { ...insets, windowHeight };
}

export interface SanLuongDrawerProps {
  entry?: SanLuong | null; // Nếu có truyền entry thì là chế độ Edit, ngược lại là Create
  initialDate?: string; // Ngày mặc định khi thêm mới
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SanLuongDrawer({ entry, initialDate, open, onOpenChange }: SanLuongDrawerProps) {
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
  const [thoiGianHoTro, setThoiGianHoTro] = useState('0');

  // Fetch list công đoạn để pre-select item đầu tiên (cho Create Mode)
  const { data: list = [] } = useListCongDoan();

  // Khởi tạo state tùy theo mode
  useEffect(() => {
    if (!open) return;
    
    if (isEditMode && entry) {
      setNgay(entry.ngay);
      setThoiGian(entry.thoi_gian_thuc_hien.toString());
      setThoiGianHoTro((entry as any).thoi_gian_ho_tro?.toString() || '0');
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
      setNgay(initialDate || getTodayVNString());
      setThoiGian('');
      setThoiGianHoTro('0');
      setCongDoanBlocks([
        { id: Date.now().toString(), congDoan: list.length > 0 ? list[0] : null, soLuong: '', phanTram: '100%' }
      ]);
    }
  }, [open, isEditMode, entry, list, initialDate]);

  // Tự động set thời gian mặc định dựa trên ngày chỉ ở Create Mode
  useEffect(() => {
    if (isEditMode || !ngay) return;
    const date = parseISO(ngay);
    const dayOfWeek = getDay(date);
    setThoiGian(getWorkMinutesForDay(dayOfWeek).toString());
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
    if (thoiGian === '' || thoiGian === undefined) return;
    if (!isEditMode && !ngay) return;

    const validBlocks = congDoanBlocks.filter(block => block.congDoan && Number(block.soLuong) > 0);
    const hasHoTro = Number(thoiGianHoTro) > 0;
    const hasThucHien = Number(thoiGian) > 0;

    // Trường hợp đặc biệt: Không có sản lượng, không có TG thực hiện, nhưng có TG hỗ trợ thì vẫn cho phép
    if (validBlocks.length === 0 && !hasHoTro) {
      alert("Vui lòng nhập số lượng sản phẩm hoặc thời gian hỗ trợ.");
      return;
    }

    if (!hasThucHien && !hasHoTro) {
      alert("Vui lòng nhập thời gian thực hiện hoặc thời gian hỗ trợ.");
      return;
    }

    const uniqueKeys = new Set();
    for (const block of validBlocks) {
      const key = `${block.congDoan!.ma_cong_doan}_${block.phanTram}`;
      if (uniqueKeys.has(key)) {
        alert(`Công đoạn "${block.congDoan!.ten_cong_doan}" bị trùng lặp (cùng mã và tỷ lệ). Vui lòng gộp chung số lượng lại thành 1 dòng để tiếp tục!`);
        return;
      }
      uniqueKeys.add(key);
    }

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

  const deleteMutation = useDeleteSanLuong();
  const handleDelete = async () => {
    if (!isEditMode || !entry) return;
    try {
      await deleteMutation.mutateAsync({ id: entry.id });
      queryClient.invalidateQueries({ queryKey: getGetSanLuongDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListSanLuongQueryKey() });
      onOpenChange(false);
    } catch (error: any) {
      alert(error?.response?.data?.error || "Có lỗi xảy ra khi xóa.");
    }
  };

  const { windowHeight, height: viewportHeight, keyboardHeight } = useVisualViewportInsets();
  // Bình thường (bàn phím đóng): cao 85% màn hình để hé lộ nền phía trên.
  // Khi bàn phím mở và phần hiển thị còn lại nhỏ hơn mức đó: chiếm gần hết phần
  // còn lại (chỉ chừa 16px) thay vì tiếp tục lấy 85% của phần đã bị hụt.
  const TOP_GAP_WHEN_CONSTRAINED = 16;
  const drawerHeight = Math.round(
    Math.min(windowHeight * 0.85, viewportHeight - TOP_GAP_WHEN_CONSTRAINED)
  );

  return (
    <>
      <Drawer.Root open={open} onOpenChange={handleDrawerOpenChange} dismissible={!showCongDoanModal}>
        <Drawer.Portal>
          <Drawer.Overlay className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 ${showCongDoanModal ? 'pointer-events-none' : ''}`} />
          <Drawer.Content
            className="bg-background border-t border-border flex flex-col rounded-t-[2rem] fixed left-0 right-0 z-50 mx-auto max-w-[430px] outline-none before:absolute before:top-0 before:left-0 before:right-0 before:h-24 before:bg-gradient-to-b before:from-primary/5 before:to-transparent before:pointer-events-none"
            style={{
              height: `${drawerHeight}px`,
              bottom: `${keyboardHeight}px`,
              transition: 'bottom 0.15s ease-out',
            }}
          >
            <div className="p-4 bg-background rounded-t-[2rem] flex-1 flex flex-col relative min-h-0">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
              
              <Drawer.Title className="text-2xl font-bold text-foreground mb-6 px-2 tracking-tight">
                {isEditMode ? 'Cập nhật sản lượng' : 'Thêm sản lượng'}
              </Drawer.Title>
              
              <SanLuongFormUI 
                readOnly={false}
                readOnlyNgay={isEditMode}
                isPending={isPending}
                isDeleting={deleteMutation.isPending}
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
                onDelete={isEditMode ? handleDelete : undefined}
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
