import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Calculator, ArrowRight, Minus, Equal, Package, Clock } from 'lucide-react';
import { getCycleMonthFromDate, getCycleRange, calculateRequiredCongForCycle, getNowVNDateLocal } from '@/lib/date-utils';
import { format, eachDayOfInterval, getDay } from 'date-fns';

export interface HomeProgressCardProps {
  dashboardData: any;
  isLoading: boolean;
  onOpenCalculator: () => void;
}

export function HomeProgressCard({ dashboardData, isLoading, onOpenCalculator }: HomeProgressCardProps) {
  const today = getNowVNDateLocal();
  const { start: cycleStart, end: cycleEnd } = getCycleRange(getCycleMonthFromDate(today));
  
  const stats = dashboardData?.stats;
  const monthEntries = dashboardData?.monthEntries || [];
  
  const congChuan = calculateRequiredCongForCycle(cycleStart, cycleEnd);
  const endCalcDate = today > cycleEnd ? cycleEnd : (today < cycleStart ? cycleStart : today);
  const congHanhChinh = calculateRequiredCongForCycle(cycleStart, endCalcDate);
  
  let ngayNghi = 0;
  if (!isLoading) {
    if (today >= cycleStart) {
      const days = eachDayOfInterval({ start: cycleStart, end: endCalcDate });
      for (const d of days) {
        const dStr = format(d, 'yyyy-MM-dd');
        const log = monthEntries.find((e: any) => e.ngay === dStr);
        if (log && (log.thong_ke_ngay as any)?.is_ngay_nghi) {
          const dayOfWeek = getDay(d);
          if (dayOfWeek >= 1 && dayOfWeek <= 5) ngayNghi += 1;
          else if (dayOfWeek === 6) ngayNghi += 0.5;
        }
      }
    }
  }

  const congNhat = (stats?.month_total_time || 0) / 480;
  const ngayCongConLai = congChuan - congHanhChinh;
  const congMucTieu = congNhat + ngayCongConLai;
  
  const congSp = stats?.month_total_sl || 0;
  const congSpConLai = congMucTieu - congSp;

  const balance = congSp - congNhat;
  const isPositive = balance >= 0;

  return (
    <div className="bg-card border border-border/50 squircle-xl shadow-sm overflow-hidden flex flex-col mb-4">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-sm tracking-tight">Trạng thái kỳ công</h3>
        </div>
        <div className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded-md">
          {format(cycleStart, 'dd/MM')} - {format(cycleEnd, 'dd/MM')}
        </div>
      </div>

      {/* Main Stat: Dư / Thiếu */}
      <div className="pt-6 pb-5 flex flex-col items-center justify-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${isPositive ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent pointer-events-none`} />
        
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">
          {isPositive ? 'Đang dư công' : 'Đang thiếu công'}
        </span>
        <div className="flex items-center gap-3 relative z-10">
          {isPositive ? (
            <TrendingUp className="w-8 h-8 text-emerald-500" strokeWidth={3} />
          ) : (
            <TrendingDown className="w-8 h-8 text-rose-500" strokeWidth={3} />
          )}
          <span className={`text-5xl font-black tracking-tighter ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isLoading ? '-' : Math.abs(balance).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Target Equation - Khung bo góc riêng */}
      <div className="mx-4 mb-6 bg-secondary/30 rounded-2xl border border-border/50 flex items-center justify-between px-5 py-4 shadow-inner">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Công chuẩn</span>
          <span className="text-sm font-bold text-foreground">{isLoading ? '-' : congChuan}</span>
        </div>
        <div className="w-px h-8 bg-border/50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Ngày nghỉ</span>
          <span className="text-sm font-bold text-rose-500">{isLoading ? '-' : ngayNghi}</span>
        </div>
        <div className="w-px h-8 bg-border/50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-primary mb-1">Mục tiêu</span>
          <span className="text-base font-black text-primary">{isLoading ? '-' : congMucTieu.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
        </div>
      </div>

      {/* Progress Grid - Tràn nền, dùng divider */}
      <div className="grid grid-cols-2 divide-x divide-border/50 border-t border-border/50">
        
        {/* Cột Sản Phẩm */}
        <div className="flex flex-col p-5 gap-4">
          <div className="flex items-center gap-2 text-primary">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Sản Phẩm</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Đã đạt</span>
              <span className="text-sm font-bold text-foreground">{isLoading ? '-' : congSp.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Còn lại</span>
              <span className={`text-sm font-bold ${congSpConLai > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isLoading ? '-' : (congSpConLai > 0 ? congSpConLai.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Cột Thời Gian */}
        <div className="flex flex-col p-5 gap-4">
          <div className="flex items-center gap-2 text-blue-500">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Thời Gian</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Công nhật</span>
              <span className="text-sm font-bold text-foreground">{isLoading ? '-' : congNhat.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">Còn lại</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {isLoading ? '-' : ngayCongConLai.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Call to action */}
      <button 
        onClick={onOpenCalculator}
        className="px-4 py-3.5 bg-primary/10 hover:bg-primary/20 border-t border-primary/20 flex items-center justify-between transition-colors outline-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Calculator className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-primary">Dự tính sản lượng cần làm</span>
        </div>
        <ArrowRight className="w-4 h-4 text-primary" />
      </button>
    </div>
  );
}
