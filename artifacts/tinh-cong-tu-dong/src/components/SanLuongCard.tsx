import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useListCongDoan, type SanLuong } from '@workspace/api-client-react';
import { getListCongDoanQueryKey } from '@workspace/api-client-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface SanLuongCardProps {
  entry: SanLuong;
  onEdit: (entry: SanLuong) => void;
  onDelete: (id: number) => void;
}

export function SanLuongCard({ entry, onEdit, onDelete }: SanLuongCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: congDoanList = [] } = useListCongDoan({ query: { queryKey: getListCongDoanQueryKey() } });

  const getCongDoanName = (ma: string) => {
    const cd = congDoanList.find(c => c.ma_cong_doan === ma);
    return cd ? cd.ten_cong_doan : ma;
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      setIsDeleting(true);
      onDelete(entry.id);
    }
  };

  const tongCongSp = entry.chi_tiet.reduce((sum, item) => {
    const cd = congDoanList.find(c => c.ma_cong_doan === item.cong_doan);
    const dinhMuc = cd?.dinh_muc && cd.dinh_muc > 0 ? cd.dinh_muc : 1;
    return sum + ((item.so_luong / dinhMuc) * (item.phan_tram_dinh_muc / 100));
  }, 0);

  const thoiGianHoTro = (entry as any).thoi_gian_ho_tro || 0;
  const tongCongHoTro = thoiGianHoTro / 480;
  const tongCong = tongCongSp + tongCongHoTro;

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div 
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col gap-3 shadow-sm relative group mb-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-blue-200/90 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 font-medium">
                {entry.thoi_gian_thuc_hien} phút
              </span>
            </div>
            
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="bg-card border border-border/50 rounded-xl p-1 shadow-2xl z-50 w-36 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                  <DropdownMenu.Item 
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-secondary rounded-lg cursor-pointer"
                    onSelect={() => onEdit(entry)}
                  >
                    <Pencil className="w-4 h-4 text-primary" />
                    Sửa
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-border/50 my-1" />
                  <DropdownMenu.Item 
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive outline-none hover:bg-destructive/10 rounded-lg cursor-pointer"
                    onSelect={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
          
          <div className="flex flex-col border-t border-border/30 pt-1 mt-1">
            {entry.chi_tiet.map((item, index) => (
              <div key={index} className={`flex items-center justify-between py-2.5 ${index !== entry.chi_tiet.length - 1 ? 'border-b border-border/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-primary font-bold text-[11px] uppercase tracking-wider bg-secondary px-2 py-0.5 rounded border border-border/50 self-start mb-1">
                      {item.cong_doan}
                    </span>
                    <span className="text-sm font-medium text-white line-clamp-1">{getCongDoanName(item.cong_doan)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-200/90 text-[13px] font-semibold">
                    SL: {item.so_luong.toLocaleString('vi-VN')}
                  </span>
                  {item.phan_tram_dinh_muc !== 100 && (
                    <span className="text-rose-200/90 text-[10px] px-1 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 font-medium">
                      {item.phan_tram_dinh_muc}%
                    </span>
                  )}
                </div>
              </div>
            ))}
            {thoiGianHoTro > 0 && (
              <div className={`flex items-center justify-between py-2.5 ${entry.chi_tiet.length > 0 ? 'border-t border-border/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-purple-400 font-bold text-[11px] uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 self-start mb-1">
                      HỖ TRỢ
                    </span>
                    <span className="text-sm font-medium text-white line-clamp-1">Thời gian hỗ trợ</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-200/90 text-[13px] font-semibold">
                    {thoiGianHoTro} phút
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <span className="text-xs text-muted-foreground font-medium">
              Tổng cộng: <span className="text-primary font-bold">{tongCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} công</span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
