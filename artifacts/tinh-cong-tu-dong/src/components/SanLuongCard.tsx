import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import type { SanLuong } from '@workspace/api-client-react';
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

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      setIsDeleting(true);
      onDelete(entry.id);
    }
  };

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div 
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm relative group mb-3"
        >
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border/50 flex-shrink-0">
            <span className="text-primary font-bold text-[11px] truncate px-1 max-w-full uppercase tracking-wider">
              {entry.cong_doan?.ma_cong_doan || '??'}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate pr-6 mb-1 text-sm">
              {entry.cong_doan?.ten_cong_doan || 'Công đoạn không xác định'}
            </h4>
            <div className="flex items-center text-[11px] text-muted-foreground gap-2 font-medium">
              <span className="text-amber-200/90 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                SL: {entry.so_luong.toLocaleString()}
              </span>
              <span className="text-blue-200/90 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                {entry.thoi_gian} phút
              </span>
            </div>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none absolute right-2 top-1/2 -translate-y-1/2">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
