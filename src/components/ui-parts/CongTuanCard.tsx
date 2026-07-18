import React from 'react';
import { format } from 'date-fns';
import { minutesToCong } from '@/lib/work-rules';

export interface WeekGroup {
  weekNum: number;
  startDate: Date;
  endDate: Date;
  isCurrentWeek: boolean;
  isLastWeek: boolean;
  totalCongSp: number;
  totalHoTroPhut: number;
  totalTime: number;
  congDoanStats: Record<string, { so_luong: number; cong_sp: number }>;
}

export interface CongTuanCardProps {
  week: WeekGroup;
  getCongDoanName: (ma: string) => string;
  readOnly?: boolean;
}

export function CongTuanCard({ week, getCongDoanName, readOnly }: CongTuanCardProps) {
  const totalCongDatDuoc = week.totalCongSp + minutesToCong(week.totalHoTroPhut);
  const congMucTieu = minutesToCong(week.totalTime);
  const hieuSoCong = totalCongDatDuoc - congMucTieu;

  return (
    <div className={`bg-card/80 backdrop-blur-md border border-white/5 rounded-3xl flex flex-col shadow-lg overflow-hidden relative ${readOnly ? 'pointer-events-none' : ''}`}>
      {/* Header - compact single row */}
      <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 ${week.isCurrentWeek ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : 'bg-white/5'}`}>

        {/* Left: tên tuần + khoảng ngày */}
        <div className="flex items-center gap-2 min-w-0">
          {week.isCurrentWeek && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />}
          <div className="min-w-0">
            <span className={`text-sm font-bold ${week.isCurrentWeek ? 'text-amber-400' : 'text-foreground/90'}`}>
              {week.isCurrentWeek ? 'Tuần này' : week.isLastWeek ? 'Tuần trước' : `Tuần ${week.weekNum}`}
            </span>
            <span className="text-zinc-500 font-medium text-[11px] ml-2">
              {format(week.startDate, 'dd/MM')} – {format(week.endDate, 'dd/MM')}
            </span>
          </div>
        </div>

        {/* Right: tổng công + delta */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Delta pill */}
          {hieuSoCong !== 0 && (
            hieuSoCong > 0 ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                +{hieuSoCong.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                -{Math.abs(hieuSoCong).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
              </span>
            )
          )}
          {/* Tổng công */}
          <div className="flex items-baseline gap-1 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/20">
            <span className="text-amber-400 font-black text-sm leading-none">
              {totalCongDatDuoc.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
            </span>
            <span className="text-[9px] text-amber-500/70 font-bold uppercase">công</span>
          </div>
        </div>
      </div>

      {/* Content - Danh sách chi tiết */}
      <div className="flex flex-col py-1">
        {Object.entries(week.congDoanStats).map(([ma_cong_doan, stats], i, arr) => (
          <div key={ma_cong_doan} className={`flex justify-between items-center py-3 px-5 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
            <div className="flex flex-col gap-1 flex-1 pr-3">
              <span className="text-amber-500 font-bold text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-wider self-start">
                {ma_cong_doan}
              </span>
              <span className="text-[13px] font-semibold text-foreground/90 line-clamp-2 leading-tight">
                {getCongDoanName(ma_cong_doan)}
              </span>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-zinc-500 font-medium mb-0.5">SL</span>
                <span className="text-foreground font-black text-sm tracking-tight">{stats.so_luong.toLocaleString('vi-VN')}</span>
              </div>
              <div className="w-px h-6 bg-white/10 rounded-full"></div>
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-zinc-500 font-medium mb-0.5">Công SP</span>
                <span className="text-primary font-black text-sm tracking-tight">{stats.cong_sp.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Hỗ trợ */}
        {week.totalHoTroPhut > 0 && (
          <div className="flex justify-between items-center py-3 px-5 border-t border-white/5 border-dashed mt-1">
            <div className="flex flex-col gap-1 flex-1 pr-3">
              <span className="text-purple-400 font-bold text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded-md border border-purple-500/20 uppercase tracking-wider self-start">
                HỖ TRỢ
              </span>
              <span className="text-[13px] font-semibold text-foreground/90 line-clamp-1">Thời gian hổ trợ</span>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-zinc-500 font-medium mb-0.5">Phút</span>
                <span className="text-foreground font-black text-sm tracking-tight">{week.totalHoTroPhut}</span>
              </div>
              <div className="w-px h-6 bg-white/10 rounded-full"></div>
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-zinc-500 font-medium mb-0.5">Công HT</span>
                <span className="text-purple-400 font-black text-sm tracking-tight">{minutesToCong(week.totalHoTroPhut).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
