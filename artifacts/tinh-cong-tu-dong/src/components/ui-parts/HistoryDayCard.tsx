import React from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { SanLuong } from '@workspace/api-client-react';

export interface HistoryDayCardProps {
  dateStr: string;
  dateHeader: string;
  items: SanLuong[];
  getCongDoanName: (ma: string) => string;
  onEdit?: (entry: SanLuong) => void;
  onDelete?: (id: number) => void;
  readOnly?: boolean;
}

export function HistoryDayCard({
  dateStr,
  dateHeader,
  items,
  getCongDoanName,
  onEdit,
  onDelete,
  readOnly
}: HistoryDayCardProps) {
  const dayCongSp = items.reduce((s, e) => s + ((e.thong_ke_ngay as any)?.tong_cong_sp || 0), 0);
  const dayCongHoTro = items.reduce((s, e) => s + ((e as any).thoi_gian_ho_tro || 0) / 480, 0);
  const dayTotalCong = dayCongSp + dayCongHoTro;
  
  const dayTime = items.reduce((s, e) => s + (e.thoi_gian_thuc_hien ?? 0) + (e.thoi_gian_ho_tro ?? 0), 0);

  return (
    <div className={readOnly ? 'pointer-events-none' : ''}>
      {/* Ngày header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-bold text-foreground capitalize">
          {dateHeader}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            {dayTime > 0 && (
              <span className="text-xs text-muted-foreground">
                {dayTime}p
              </span>
            )}
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {dayTotalCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} công
            </span>
          </div>
          
          <div className="flex items-center gap-1 border-l border-border/50 pl-2">
            {!readOnly ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" className="bg-card border border-border/50 rounded-xl squircle-lg p-1 shadow-2xl z-50 w-36 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                    <DropdownMenu.Item 
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-secondary rounded-lg cursor-pointer"
                      onSelect={() => onEdit?.(items[0])}
                    >
                      <Pencil className="w-4 h-4 text-primary" />
                      Sửa
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-border/50 my-1" />
                    <DropdownMenu.Item 
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive outline-none hover:bg-destructive/10 rounded-lg cursor-pointer"
                      onSelect={() => onDelete?.(items[0].id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Các card trong ngày */}
      <div className="flex flex-col gap-2">
        {items.map((entry, idx) => {
          const content = (
            <div className="flex flex-col">
              {entry.chi_tiet.map((item, i) => (
                <div key={i} className={`flex items-center justify-between p-3.5 ${i !== entry.chi_tiet.length - 1 || (entry as any).thoi_gian_ho_tro > 0 ? 'border-b border-border/30' : ''}`}>
                  <div className="flex flex-col">
                    <span className="text-primary font-bold text-[11px] uppercase tracking-wider bg-secondary px-2 py-0.5 rounded border border-border/50 self-start mb-1">
                      {item.cong_doan}
                    </span>
                    <span className="text-sm font-medium text-foreground line-clamp-1">{getCongDoanName(item.cong_doan)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-amber-200/90 text-[13px] font-semibold">
                      SL: {item.so_luong.toLocaleString('vi-VN')}
                    </span>
                    {item.phan_tram_dinh_muc !== 100 && (
                      <span className="text-[10px] text-rose-700 dark:text-rose-200/90 px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 font-medium">
                        {item.phan_tram_dinh_muc}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(entry as any).thoi_gian_ho_tro > 0 && (
                <div className={`flex items-center justify-between p-3.5`}>
                  <div className="flex flex-col">
                    <span className="text-purple-700 dark:text-purple-400 font-bold text-[11px] uppercase tracking-wider bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-500/20 self-start mb-1">
                      HỖ TRỢ
                    </span>
                    <span className="text-sm font-medium text-foreground line-clamp-1">Thời gian hỗ trợ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-800 dark:text-purple-200/90 text-[13px] font-semibold">
                      {(entry as any).thoi_gian_ho_tro} phút
                    </span>
                  </div>
                </div>
              )}
            </div>
          );

          if (readOnly) {
            return (
              <div key={entry.id} className="bg-card border border-border/50 rounded-xl squircle-lg flex flex-col shadow-sm">
                {content}
              </div>
            );
          }

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card border border-border/50 rounded-xl squircle-lg flex flex-col shadow-sm"
            >
              {content}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
