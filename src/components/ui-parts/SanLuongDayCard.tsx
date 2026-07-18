import React from 'react';
import { MoreHorizontal, Pencil, Trash2, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { SanLuong } from '@/api';
import { minutesToCong } from '@/lib/work-rules';

export interface SanLuongDayCardProps {
  dateStr: string;
  dateHeader: string;
  items: SanLuong[];
  getCongDoanName: (ma: string) => string;
  getCongDoanDinhMuc?: (ma: string) => number;
  onEdit?: (entry: SanLuong) => void;
  onDelete?: (id: number) => void;
  readOnly?: boolean;
  onAdd?: (dateStr: string) => void;
  onLeave?: (dateStr: string, loaiNghi: string) => void;
  isSavingLeave?: boolean;
}

export function SanLuongDayCard({
  dateStr,
  dateHeader,
  items,
  getCongDoanName,
  getCongDoanDinhMuc,
  onEdit,
  onDelete,
  onAdd,
  onLeave,
  isSavingLeave,
  readOnly
}: SanLuongDayCardProps) {
  const dayCongSp = items.reduce((s, e) => s + ((e.thong_ke_ngay as any)?.tong_cong_sp || 0), 0);
  const dayCongHoTro = items.reduce((s, e) => s + minutesToCong((e as any).thoi_gian_ho_tro || 0), 0);
  const dayTotalCong = dayCongSp + dayCongHoTro;
  
  const dayTime = items.reduce((s, e) => s + (e.thoi_gian_thuc_hien ?? 0) + (e.thoi_gian_ho_tro ?? 0), 0);
  const isToday = dateHeader.toLowerCase() === 'hôm nay';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card/80 backdrop-blur-md border border-white/5 rounded-3xl flex flex-col shadow-lg overflow-hidden relative ${readOnly ? 'pointer-events-none' : ''}`}
    >
      {/* Ngày header - Glassmorphism style */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b border-white/5 ${isToday ? 'bg-gradient-to-r from-emerald-500/10 to-transparent' : 'bg-white/5'}`}>
        <div className="flex items-center gap-2">
          {isToday && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          <span className={`text-sm font-bold capitalize ${isToday ? 'text-emerald-400' : 'text-foreground/90'}`}>
            {dateHeader}
          </span>
        </div>
        
        <div className="flex items-center gap-2.5">
          {dayTotalCong === 0 && items.length > 0 && (
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-wider">
              Ngày nghỉ
            </span>
          )}
          {dayTime > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-full border border-white/5 shadow-sm">
              <Clock className="w-3 h-3" />
              {dayTime}p
            </span>
          )}
          {dayTotalCong > 0 && (
            <div className="flex items-baseline gap-1 bg-gradient-to-r from-amber-500/20 to-primary/20 px-3 py-1 rounded-full border border-amber-500/20 shadow-inner">
              <span className="text-amber-400 font-black text-sm leading-none">
                {dayTotalCong.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">công</span>
            </div>
          )}
        </div>
      </div>

      {items.length === 0 && !readOnly ? (
        <div className="flex items-center justify-center gap-3 px-5 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isSavingLeave}
                className="flex-1 py-2 rounded-xl border border-border/50 bg-secondary/50 text-muted-foreground text-xs font-bold uppercase tracking-wider hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Nghỉ
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[180px]">
              <DropdownMenuItem onClick={() => onLeave?.(dateStr, 'nghi_phep')}>
                Nghỉ phép năm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLeave?.(dateStr, 'nghi_huong_luong')}>
                Nghỉ hưởng lương
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLeave?.(dateStr, 'nghi_khong_luong')}>
                Nghỉ không lương
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => onAdd?.(dateStr)}
            disabled={isSavingLeave}
            className="flex-1 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            Nhập
          </button>
        </div>
      ) : (
        <div className="flex flex-col py-1">
          {items.map((entry, idx) => {
            const content = (
              <div className="flex flex-col w-full pl-5 pr-2">
                {entry.chi_tiet.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between py-3 ${i !== entry.chi_tiet.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className="flex flex-col gap-1 flex-1 pr-3">
                      <span className="text-amber-500 font-bold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-wider self-start">
                        {item.cong_doan}
                      </span>
                      <span className="text-[13px] font-semibold text-foreground/90 line-clamp-2 leading-tight">
                        {getCongDoanName(item.cong_doan)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cdDinhMuc = getCongDoanDinhMuc?.(item.cong_doan) || 1;
                        const percent = Math.round((Number(item.dinh_muc) / cdDinhMuc) * 100);
                        if (percent !== 100 && percent > 0) {
                          return (
                            <span className="text-[10px] text-rose-400 px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 font-bold">
                              {percent}%
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex flex-col items-end min-w-[3.5rem]">
                        <span className="text-[10px] text-zinc-500 font-medium mb-0.5">SL</span>
                        <span className="text-foreground font-black text-sm tracking-tight">{item.so_luong.toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Giờ hỗ trợ */}
                {(entry as any).thoi_gian_ho_tro > 0 && (
                  <div className="flex items-center justify-between py-3 border-t border-white/5 border-dashed mt-1">
                    <div className="flex flex-col gap-1 flex-1 pr-3">
                      <span className="text-purple-400 font-bold text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 uppercase tracking-wider self-start">
                        HỖ TRỢ
                      </span>
                      <span className="text-[13px] font-semibold text-foreground/90 line-clamp-1">Thời gian phụ trợ</span>
                    </div>
                    <div className="flex flex-col items-end min-w-[3.5rem]">
                      <span className="text-[10px] text-zinc-500 font-medium mb-0.5">Phút</span>
                      <span className="text-purple-400 font-black text-sm tracking-tight">{(entry as any).thoi_gian_ho_tro}</span>
                    </div>
                  </div>
                )}
              </div>
            );

            if (readOnly) {
              return (
                <div key={entry.id} className={`flex ${idx !== items.length - 1 ? 'border-b border-white/5' : ''}`}>
                  {content}
                </div>
              );
            }

            return (
              <div key={entry.id} className={`flex items-stretch group relative ${idx !== items.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex-1 flex" onDoubleClick={() => onEdit?.(entry)}>
                  {content}
                </div>

                {/* Dấu 3 chấm để sửa/xóa */}
                <div className="flex items-center justify-center pr-2 pl-1 border-l border-white/5 my-2 ml-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-white/10 hover:text-foreground transition-colors outline-none focus:ring-2 focus:ring-primary/50">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-2xl border-white/10 bg-zinc-900/95 backdrop-blur-xl p-1">
                      <DropdownMenuItem 
                        onClick={() => onEdit?.(entry)}
                        className="gap-2.5 cursor-pointer rounded-lg py-2 focus:bg-white/10"
                      >
                        <Pencil className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-sm">Sửa công</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn xóa bản ghi này?')) {
                            onDelete?.(entry.id);
                          }
                        }}
                        className="gap-2.5 cursor-pointer rounded-lg py-2 focus:bg-rose-500/20 focus:text-rose-400 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="font-semibold text-sm">Xóa</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
