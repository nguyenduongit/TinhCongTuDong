import React from 'react';
import { MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { SanLuong } from '@/api';

export interface SanLuongDayCardProps {
  dateStr: string;
  dateHeader: string;
  items: SanLuong[];
  getCongDoanName: (ma: string) => string;
  getCongDoanDinhMuc?: (ma: string) => number;
  onEdit?: (entry: SanLuong) => void;
  onDelete?: (id: number) => void;
  readOnly?: boolean;
}

export function SanLuongDayCard({
  dateStr,
  dateHeader,
  items,
  getCongDoanName,
  getCongDoanDinhMuc,
  onEdit,
  onDelete,
  readOnly
}: SanLuongDayCardProps) {
  const dayCongSp = items.reduce((s, e) => s + ((e.thong_ke_ngay as any)?.tong_cong_sp || 0), 0);
  const dayCongHoTro = items.reduce((s, e) => s + ((e as any).thoi_gian_ho_tro || 0) / 480, 0);
  const dayTotalCong = dayCongSp + dayCongHoTro;
  
  const dayTime = items.reduce((s, e) => s + (e.thoi_gian_thuc_hien ?? 0) + (e.thoi_gian_ho_tro ?? 0), 0);

  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const startLongPress = (entry: SanLuong) => {
    if (readOnly) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      onEdit?.(entry);
      longPressTimer.current = null;
    }, 500);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border/50 rounded-2xl squircle-xl flex flex-col shadow-sm overflow-hidden ${readOnly ? 'pointer-events-none' : ''}`}
    >
      {/* Ngày header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border/50">
        <span className="text-sm font-bold text-foreground capitalize">
          {dateHeader}
        </span>
        <div className="flex items-center gap-2">
          {dayTotalCong === 0 && (
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-wider">
              Ngày nghỉ
            </span>
          )}
          {dayTime > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">
              <Clock className="w-3 h-3" />
              {dayTime}p
            </span>
          )}
          <div className="flex items-baseline gap-1 bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
            <span className="text-primary font-bold text-sm leading-none">
              {dayTotalCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-primary/80 font-bold uppercase tracking-wider">công</span>
          </div>
        </div>
      </div>

      {/* Các card trong ngày */}
      <div className="flex flex-col">
        {items.map((entry, idx) => {
          const content = (
            <div className="flex flex-col">
              {entry.chi_tiet.map((item, i) => (
                <div key={i} className={`flex items-center justify-between py-3.5 px-4 ${i !== entry.chi_tiet.length - 1 || (entry as any).thoi_gian_ho_tro > 0 ? 'border-b border-border/30' : ''}`}>
                  <div className="flex flex-col gap-1.5 flex-1 pr-2">
                    <span className="text-primary font-bold text-[11px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-wider self-start">
                      {item.cong_doan}
                    </span>
                    <span className="text-sm font-medium text-foreground line-clamp-2">{getCongDoanName(item.cong_doan)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cdDinhMuc = getCongDoanDinhMuc?.(item.cong_doan) || 1;
                      const percent = Math.round((Number(item.dinh_muc) / cdDinhMuc) * 100);
                      if (percent !== 100 && percent > 0) {
                        return (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 font-bold">
                            {percent}%
                          </span>
                        );
                      }
                      return null;
                    })()}
                    <div className="flex flex-col items-end min-w-[3.5rem]">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Số lượng</span>
                      <span className="text-foreground font-bold">{item.so_luong.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(entry as any).thoi_gian_ho_tro > 0 && (
                <div className={`flex items-center justify-between py-3.5 px-4`}>
                  <div className="flex flex-col gap-1.5 flex-1 pr-2">
                    <span className="text-purple-700 dark:text-purple-400 font-bold text-[11px] bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-500/20 uppercase tracking-wider self-start">
                      HỖ TRỢ
                    </span>
                    <span className="text-sm font-medium text-foreground line-clamp-1">Thời gian hỗ trợ</span>
                  </div>
                  <div className="flex flex-col items-end min-w-[3.5rem]">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Tổng phút</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{(entry as any).thoi_gian_ho_tro}</span>
                  </div>
                </div>
              )}
            </div>
          );

          if (readOnly) {
            return (
              <div key={entry.id} className={`flex flex-col ${idx !== items.length - 1 ? 'border-b border-border/50' : ''}`}>
                {content}
              </div>
            );
          }

          return (
            <div
              key={entry.id}
              className={`flex flex-col cursor-pointer select-none active:bg-secondary/30 transition-colors ${idx !== items.length - 1 ? 'border-b border-border/50' : ''}`}
              onTouchStart={() => startLongPress(entry)}
              onTouchEnd={endLongPress}
              onTouchMove={endLongPress}
              onMouseDown={() => startLongPress(entry)}
              onMouseUp={endLongPress}
              onMouseLeave={endLongPress}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!readOnly && !longPressTimer.current) {
                  onEdit?.(entry);
                }
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
