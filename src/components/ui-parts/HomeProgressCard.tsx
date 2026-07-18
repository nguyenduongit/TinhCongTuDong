import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, CheckCircle2, Calendar, Palmtree, Zap, Star } from 'lucide-react';
import { getCycleMonthFromDate, getCycleRange, calculateRequiredCongForCycle, getNowVNDateLocal } from '@/lib/date-utils';
import { getWorkMinutesForDay, minutesToCong } from '@/lib/work-rules';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import { cn } from '@/lib/utils';

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
          let phutHanhChinhQuyDinh = getWorkMinutesForDay(dayOfWeek);

          if (tongPhutThucTe > phutHanhChinhQuyDinh) {
            tongPhutTangCa += (tongPhutThucTe - phutHanhChinhQuyDinh);
          }
        }
      }
    }
  }

  const congNhat = minutesToCong(stats?.month_total_time || 0);
  // const ngayCongConLai = congChuan - congHanhChinh;
  // const congMucTieuCuoiThang = congNhat + ngayCongConLai; // Chỉ mang tính tham khảo

  const congSp = stats?.month_total_sl || 0;
  const balance = congSp - congNhat; // So sánh thực tế Đã đạt vs Công nhật
  const isPositive = balance >= 0;

  const gioTangCa = Math.floor(tongPhutTangCa / 60);
  const phutTangCaLe = tongPhutTangCa % 60;

  const progressPercent = congChuan > 0 ? Math.min((congSp / congChuan) * 100, 100) : 0;
  const targetPercent = congChuan > 0 ? Math.min((congHanhChinh / congChuan) * 100, 100) : 0;
  const leavePercent = congChuan > 0 ? Math.min((ngayNghi / congChuan) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Thẻ Hero: Tiến độ chính (Premium Glass Card) */}
      <div className="relative overflow-hidden rounded-3xl p-5 border border-white/10 shadow-2xl bg-gradient-to-br from-zinc-900 to-zinc-950">
        <div className="absolute top-0 right-0 p-32 bg-primary/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <p className="text-zinc-400 font-medium text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Sản lượng đạt được
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tighter">
                {isLoading ? '-' : congSp.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
              </span>
              <span className="text-zinc-500 font-semibold text-sm">công</span>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm backdrop-blur-md border",
            isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={3} /> : <TrendingDown className="w-3.5 h-3.5" strokeWidth={3} />}
            {isPositive ? '+' : '-'}{Math.abs(balance).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Thanh tiến độ siêu mượt */}
        <div className="space-y-2 relative z-10">
          <div className="relative pt-6">
            {/* Target indicator badge */}
            <div 
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 z-20"
              style={{ left: `${targetPercent}%` }}
            >
              <div className="bg-primary/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-black text-white whitespace-nowrap shadow-lg border border-primary/20">
                Mục tiêu: {congHanhChinh.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
              </div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-primary/90" />
            </div>

            <div className="h-3 w-full bg-zinc-800/80 rounded-full overflow-hidden shadow-inner relative mt-1">
              {/* Leave bar (Right aligned) */}
              {ngayNghi > 0 && (
                <div 
                  className="absolute right-0 top-0 bottom-0 z-0 bg-rose-500/60"
                  style={{ width: `${leavePercent}%` }}
                />
              )}

              {/* Progress bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full relative z-10",
                  isPositive ? "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[2px_0_10px_rgba(52,211,153,0.3)]" : "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[2px_0_10px_rgba(245,158,11,0.3)]"
                )}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full skeleton-shimmer" />
              </motion.div>
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-semibold px-1">
            <span className="text-zinc-500 uppercase tracking-widest">Tiến độ tháng</span>
            <span className="text-zinc-400">{isLoading ? '-' : congChuan} công chuẩn</span>
          </div>
        </div>
      </div>

      {/* Bento Grid: Thông tin phụ */}
      <div className="grid grid-cols-3 gap-3">
        {/* Box 1: Công chuẩn */}
        <div className="bg-card border border-border/50 rounded-3xl p-4 flex flex-col justify-between aspect-square shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2 group-hover:scale-110 transition-transform">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{isLoading ? '-' : congChuan}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Công chuẩn</p>
          </div>
        </div>

        {/* Box 2: Tăng ca */}
        <div className="bg-card border border-border/50 rounded-3xl p-4 flex flex-col justify-between aspect-square shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
          <div className="w-9 h-9 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2 group-hover:scale-110 transition-transform">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xl font-black text-foreground tracking-tight">
              {isLoading ? '-' : `${gioTangCa}h${phutTangCaLe > 0 ? `${phutTangCaLe}p` : ''}`}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Tăng ca</p>
          </div>
        </div>

        {/* Box 3: Ngày nghỉ */}
        <div className="bg-card border border-border/50 rounded-3xl p-4 flex flex-col justify-between aspect-square shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
          <div className="w-9 h-9 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2 group-hover:scale-110 transition-transform">
            <Palmtree className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{isLoading ? '-' : ngayNghi}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày nghỉ</p>
          </div>
        </div>
      </div>
    </div>
  );
}

