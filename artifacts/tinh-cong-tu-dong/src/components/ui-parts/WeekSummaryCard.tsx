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
  return (
    <div className={`flex flex-col ${readOnly ? 'pointer-events-none' : ''}`}>
      <div className="flex justify-between items-end mb-3 border-b border-border/50 pb-2">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          {week.isCurrentWeek ? 'Tuần này' : week.isLastWeek ? 'Tuần trước' : `Tuần ${week.weekNum}`} ({format(week.startDate, 'dd/MM')} - {format(week.endDate, 'dd/MM')})
        </h4>
        <div className="flex text-xs font-medium text-muted-foreground gap-3">
          <span className="text-primary font-bold">
            {(week.totalCongSp + week.totalHoTroPhut / 480).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} công
            <span className="text-muted-foreground/60 font-normal mx-1.5">/</span>
            <span className="text-foreground">{(week.totalTime / 480).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>
          </span>
        </div>
      </div>
      
      <div className="flex flex-col bg-card border border-border/50 rounded-xl squircle-lg px-2 shadow-sm">
        {Object.entries(week.congDoanStats).map(([ma_cong_doan, stats], i, arr) => (
          <div key={ma_cong_doan} className={`flex justify-between items-center py-3 px-2 ${i !== arr.length - 1 || week.totalHoTroPhut > 0 ? 'border-b border-border/30' : ''}`}>
            <div className="flex flex-col gap-1.5">
              <span className="text-primary font-bold text-[11px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-wider self-start">
                {ma_cong_doan}
              </span>
              <span className="text-xs font-medium text-foreground line-clamp-1">{getCongDoanName(ma_cong_doan)}</span>
            </div>
            <div className="flex gap-4 text-xs font-medium items-center">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase mb-0.5">SL</span>
                <span className="text-amber-700 dark:text-amber-200/90 font-bold">{stats.so_luong.toLocaleString('vi-VN')}</span>
              </div>
              <div className="w-px h-6 bg-border/50"></div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase mb-0.5">Công SP</span>
                <span className="text-primary font-bold">{stats.cong_sp.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>
              </div>
            </div>
          </div>
        ))}
        {week.totalHoTroPhut > 0 && (
          <div className="flex justify-between items-center py-3 px-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-purple-700 dark:text-purple-400 font-bold text-[11px] bg-purple-100 dark:bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-300 dark:border-purple-500/20 uppercase tracking-wider self-start">
                HỖ TRỢ
              </span>
              <span className="text-xs font-medium text-foreground line-clamp-1">Thời gian hỗ trợ</span>
            </div>
            <div className="flex gap-4 text-xs font-medium items-center">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase mb-0.5">Tổng phút</span>
                <span className="text-purple-800 dark:text-purple-200/90 font-bold">{week.totalHoTroPhut} phút</span>
              </div>
              <div className="w-px h-6 bg-border/50"></div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase mb-0.5">Công HT</span>
                <span className="text-purple-700 dark:text-purple-400 font-bold">{(week.totalHoTroPhut / 480).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
