import { motion } from 'framer-motion';
import type { SanLuongStats } from '@workspace/api-client-react';

interface StatsBarProps {
  stats?: SanLuongStats;
  isLoading?: boolean;
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  // Convert minutes to hours:minutes
  const formatTime = (mins: number) => {
    if (!mins) return '0h';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Số công đoạn" value={isLoading ? '-' : stats?.today_count?.toString() || '0'} />
      <StatCard label="Tổng giờ" value={isLoading ? '-' : formatTime(stats?.today_total_time || 0)} />
      <StatCard label="Tổng SL" value={isLoading ? '-' : (stats?.today_total_sl || 0).toLocaleString()} />
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm"
    >
      <span className="text-xs text-muted-foreground font-medium mb-1 whitespace-nowrap">{label}</span>
      <span className="text-base font-bold text-white tracking-tight">{value}</span>
    </motion.div>
  );
}
