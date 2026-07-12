import React from 'react';
import { format } from 'date-fns';

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

export interface WeekSummaryCardProps {
  week: WeekGroup;
  getCongDoanName: (ma: string) => string;
  readOnly?: boolean;
}

export function WeekSummaryCard({ week, getCongDoanName, readOnly }: WeekSummaryCardProps) {
  const totalCongDatDuoc = week.totalCongSp + week.totalHoTroPhut / 480;
  const congMucTieu = week.totalTime / 480;
  const hieuSoCong = totalCongDatDuoc - congMucTieu;

  return (
    <div className={`flex flex-col ${readOnly ? 'pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3 px-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"></span>
            <h4 className="text-sm font-bold text-foreground">
              {week.isCurrentWeek ? 'Tuần này' : week.isLastWeek ? 'Tuần trước' : `Tuần ${week.weekNum}`}
            </h4>
          </div>
          <span className="text-xs text-muted-foreground font-medium ml-4">
            {format(week.startDate, 'dd/MM')} - {format(week.endDate, 'dd/MM')}
          </span>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-baseline gap-1 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
            <span className="text-primary font-black text-base leading-none">
              {totalCongDatDuoc.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
            </span>
            <span className="text-[10px] text-primary/80 font-bold uppercase tracking-wider">công</span>
          </div>
          
          <div className="flex items-center">
            {hieuSoCong > 0 && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                dư {hieuSoCong.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
              </span>
            )}
            {hieuSoCong < 0 && (
              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                thiếu {Math.abs(hieuSoCong).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col bg-card border border-border/50 rounded-xl squircle-lg shadow-sm">
        {Object.entries(week.congDoanStats).map(([ma_cong_doan, stats], i, arr) => (
          <div key={ma_cong_doan} className={`flex justify-between items-center py-3.5 px-3 ${i !== arr.length - 1 || week.totalHoTroPhut > 0 ? 'border-b border-border/30' : ''}`}>
            <div className="flex flex-col gap-1.5 flex-1 pr-2">
              <span className="text-primary font-bold text-[11px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-wider self-start">
                {ma_cong_doan}
              </span>
              <span className="text-sm font-medium text-foreground line-clamp-2">{getCongDoanName(ma_cong_doan)}</span>
            </div>
            <div className="flex gap-3 text-sm items-center">
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Số lượng</span>
                <span className="text-foreground font-bold">{stats.so_luong.toLocaleString('vi-VN')}</span>
              </div>
              <div className="w-px h-8 bg-border/50"></div>
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Công SP</span>
                <span className="text-primary font-black">{stats.cong_sp.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>
              </div>
            </div>
          </div>
        ))}
        {week.totalHoTroPhut > 0 && (
          <div className="flex justify-between items-center py-3.5 px-3">
            <div className="flex flex-col gap-1.5 flex-1 pr-2">
              <span className="text-purple-700 dark:text-purple-400 font-bold text-[11px] bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-500/20 uppercase tracking-wider self-start">
                HỖ TRỢ
              </span>
              <span className="text-sm font-medium text-foreground line-clamp-1">Thời gian hỗ trợ</span>
            </div>
            <div className="flex gap-3 text-sm items-center">
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Tổng phút</span>
                <span className="text-foreground font-bold">{week.totalHoTroPhut}</span>
              </div>
              <div className="w-px h-8 bg-border/50"></div>
              <div className="flex flex-col items-end min-w-[3.5rem]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">Công HT</span>
                <span className="text-purple-600 dark:text-purple-400 font-black">{(week.totalHoTroPhut / 480).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
