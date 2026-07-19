import React from 'react';
import { format } from 'date-fns';
import { minutesToCong } from '@/lib/work-rules';
import { motion } from 'framer-motion';

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
  getCongDoanName: (ma: string) => string | null;
  readOnly?: boolean;
}

export function CongTuanCard({ week, getCongDoanName, readOnly }: CongTuanCardProps) {
  const isCurrentWeek = week.isCurrentWeek;
  const totalCongWeek = week.totalCongSp + minutesToCong(week.totalHoTroPhut);
  const congNhatWeek = minutesToCong(week.totalTime);
  const balance = totalCongWeek - congNhatWeek;
  const isPositive = balance >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card/80 backdrop-blur-md border border-white/5 rounded-[2rem] flex flex-col shadow-lg overflow-hidden relative ${readOnly ? 'pointer-events-none' : ''}`}
    >
      {/* Header Tuần */}
      <div className={`flex items-center px-4 py-4 border-b border-white/5 ${isCurrentWeek ? 'bg-gradient-to-r from-primary/10 to-transparent' : 'bg-white/5'}`}>

        {/* Cột 1: 50% */}
        <div className="w-[45%] flex flex-col gap-0.5 pr-2">
          <div className="flex items-center gap-1.5">
            {isCurrentWeek && <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />}
            <span className={`text-[15px] font-bold truncate ${isCurrentWeek ? 'text-primary' : 'text-foreground/90'}`}>
              Tuần {week.weekNum} {isCurrentWeek}
            </span>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            {format(week.startDate, 'dd/MM')} - {format(week.endDate, 'dd/MM')}
          </span>
        </div>

        {/* Cột 2: 25% */}
        <div className="w-[27.5%] flex flex-col items-center justify-center gap-1 border-l border-white/10 px-1">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest text-center">Tổng công</span>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/20 shadow-inner flex items-center justify-center w-full max-w-[4rem]">
            <span className="text-amber-400 font-black text-[12px] leading-none drop-shadow-md truncate">
              {totalCongWeek.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}
            </span>
          </div>
        </div>

        {/* Cột 3: 25% */}
        <div className="w-[27.5%] flex flex-col items-center justify-center gap-1 border-l border-white/10 px-1">
          <span className={`text-[9px] font-bold uppercase tracking-widest text-center truncate w-full ${balance === 0 ? 'text-zinc-500' : (isPositive ? 'text-emerald-500/70' : 'text-rose-500/70')}`}>
            {balance === 0 ? 'Trạng thái' : (isPositive ? 'Dư công' : 'Thiếu công')}
          </span>
          <div className={`px-2 py-0.5 rounded-md shadow-sm flex items-center justify-center w-full max-w-[4rem] ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            <span className="text-[12px] font-black leading-none truncate">
              {balance !== 0 ? Math.abs(balance).toLocaleString('vi-VN', { maximumFractionDigits: 3 }) : 'Đủ'}
            </span>
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
              {(() => {
                const cdName = getCongDoanName(ma_cong_doan);
                const isMissing = !cdName;
                return (
                  <span className={`text-[13px] font-semibold line-clamp-2 leading-tight ${isMissing ? 'text-rose-400 italic' : 'text-foreground/90'}`}>
                    {isMissing ? `Hãy thêm mã công đoạn ${ma_cong_doan}` : cdName}
                  </span>
                );
              })()}
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
    </motion.div>
  );
}
