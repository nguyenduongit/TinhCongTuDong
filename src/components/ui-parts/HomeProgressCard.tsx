import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calculator, ArrowRight, Package, Clock, CheckCircle2, Calendar, Palmtree, Zap } from 'lucide-react';
import { getCycleMonthFromDate, getCycleRange, calculateRequiredCongForCycle, getNowVNDateLocal } from '@/lib/date-utils';
import { format, eachDayOfInterval, getDay } from 'date-fns';

export interface HomeProgressCardProps {
  dashboardData: any;
  isLoading: boolean;
}

export function HomeProgressCard({ dashboardData, isLoading }: HomeProgressCardProps) {
  const today = getNowVNDateLocal();
  const { start: cycleStart, end: cycleEnd } = getCycleRange(getCycleMonthFromDate(today));

  const stats = dashboardData?.stats;
  const monthEntries = dashboardData?.monthEntries || [];

  const congChuan = calculateRequiredCongForCycle(cycleStart, cycleEnd);
  const endCalcDate = today > cycleEnd ? cycleEnd : (today < cycleStart ? cycleStart : today);
  const congHanhChinh = calculateRequiredCongForCycle(cycleStart, endCalcDate);

  let ngayNghi = 0;
  let tongPhutTangCa = 0;

  if (!isLoading) {
    if (today >= cycleStart) {
      const days = eachDayOfInterval({ start: cycleStart, end: endCalcDate });
      for (const d of days) {
        const dStr = format(d, 'yyyy-MM-dd');
        const log = monthEntries.find((e: any) => e.ngay === dStr);

        // Tính ngày nghỉ
        if (log && (log.thong_ke_ngay as any)?.is_ngay_nghi) {
          const dayOfWeek = getDay(d);
          if (dayOfWeek >= 1 && dayOfWeek <= 5) ngayNghi += 1;
          else if (dayOfWeek === 6) ngayNghi += 0.5;
        }

        // Tính tăng ca: ngày nào có tổng phút > phút hành chính quy định
        if (log) {
          const tongPhutThucTe = (log.thoi_gian_thuc_hien || 0) + (log.thoi_gian_ho_tro || 0);
          const dayOfWeek = getDay(d);
          let phutHanhChinhQuyDinh = 0;
          if (dayOfWeek >= 1 && dayOfWeek <= 5) phutHanhChinhQuyDinh = 480;
          else if (dayOfWeek === 6) phutHanhChinhQuyDinh = 240;

          if (tongPhutThucTe > phutHanhChinhQuyDinh) {
            tongPhutTangCa += (tongPhutThucTe - phutHanhChinhQuyDinh);
          }
        }
      }
    }
  }

  const congNhat = (stats?.month_total_time || 0) / 480;
  const ngayCongConLai = congChuan - congHanhChinh;
  const congMucTieuCuoiThang = congNhat + ngayCongConLai; // Chỉ mang tính tham khảo

  const congSp = stats?.month_total_sl || 0;
  const balance = congSp - congNhat; // So sánh thực tế Đã đạt vs Công nhật
  const isPositive = balance >= 0;

  const gioTangCa = Math.floor(tongPhutTangCa / 60);
  const phutTangCaLe = tongPhutTangCa % 60;

  return (
    <div className="bg-card border border-border/60 squircle-xl shadow-xl overflow-hidden flex flex-col relative before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] before:pointer-events-none">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-sm tracking-tight">Năng suất tháng</h3>
        </div>
        <div className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded-md">
          {format(cycleStart, 'dd/MM')} - {format(cycleEnd, 'dd/MM')}
        </div>
      </div>

      {/* Gradient Container cho Main Stat và Nhóm Thực Tế */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${isPositive ? 'from-emerald-500/15 via-emerald-500/5' : 'from-rose-500/15 via-rose-500/5'} to-transparent pointer-events-none`} />

        {/* Main Stat: Dư / Thiếu (So sánh Đã đạt vs Công nhật) */}
        <div className="pt-6 pb-5 flex flex-col items-center justify-center relative z-10">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {isPositive ? 'Đang dư công' : 'Đang thiếu công'}
          </span>
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute right-full mr-3 flex items-center">
              {isPositive ? (
                <TrendingUp className="w-8 h-8 text-emerald-500" strokeWidth={3} />
              ) : (
                <TrendingDown className="w-8 h-8 text-rose-500" strokeWidth={3} />
              )}
            </div>
            <span className={`text-5xl font-black tracking-tighter ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isLoading ? '-' : Math.abs(balance).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Nhóm Thực Tế - 2 thông tin chính hàng dưới số dư/thiếu */}
        <div className="mx-4 mb-5 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 flex items-center py-4 shadow-sm relative z-10">
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-xs uppercase font-bold text-muted-foreground/90">Mục tiêu</span>
            </div>
            <span className="text-xl font-black text-blue-400">{isLoading ? '-' : congNhat.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="w-px h-10 bg-border/60" />
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground/90" />
              <span className="text-xs uppercase font-bold text-muted-foreground/90">Đã đạt</span>
            </div>
            <span className="text-xl font-black text-amber-500">{isLoading ? '-' : congSp.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Nhóm Thông tin phụ - 3 mục tách rời */}
      <div className="grid grid-cols-3 gap-3 px-4 pb-5">
        
        {/* Công chuẩn */}
        <div className="bg-secondary/20 border border-border/50 rounded-xl py-3.5 px-2 flex flex-col items-center text-center overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider whitespace-nowrap">Công chuẩn</span>
          <span className="text-xl font-black text-foreground">{isLoading ? '-' : congChuan}</span>
        </div>

        {/* Ngày nghỉ */}
        <div className="bg-secondary/20 border border-border/50 rounded-xl py-3.5 px-2 flex flex-col items-center text-center overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center mb-2">
            <Palmtree className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider whitespace-nowrap">Ngày nghỉ</span>
          <span className="text-xl font-black text-foreground">{isLoading ? '-' : ngayNghi}</span>
        </div>

        {/* Tăng ca */}
        <div className="bg-secondary/20 border border-border/50 rounded-xl py-3.5 px-2 flex flex-col items-center text-center overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider whitespace-nowrap">Tăng ca</span>
          <span className="text-xl font-black text-foreground">
            {isLoading ? '-' : `${gioTangCa}h${phutTangCaLe > 0 ? `${phutTangCaLe}p` : ''}`}
          </span>
        </div>

      </div>
    </div>
  );
}
