import { motion } from 'framer-motion';
import { CalendarDays, Search, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { pageItemVariants } from '@/lib/animations';

interface ToolCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  isPro?: boolean;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  onClick: () => void;
  delay?: number;
}

function ToolCard({
  icon,
  label,
  description,
  isPro,
  accentColor,
  bgColor,
  borderColor,
  glowColor,
  onClick,
}: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative group w-full text-left rounded-3xl p-4 border overflow-hidden',
        'transition-all duration-300 active:scale-[0.97]',
        'hover:shadow-lg',
        bgColor,
        borderColor,
      )}
    >
      {/* Glow on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl blur-xl',
          glowColor,
        )}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm',
              'group-hover:scale-110 transition-transform duration-300',
              accentColor,
            )}
          >
            {icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-bold text-foreground truncate">{label}</span>
              {isPro && (
                <span className="text-[10px] leading-none flex-shrink-0 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
                  💎 Pro
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium leading-tight line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 mt-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
      </div>
    </button>
  );
}

interface HomeToolsGridProps {
  isPro: boolean;
}

export function HomeToolsGrid({ isPro }: HomeToolsGridProps) {
  const [, setLocation] = useLocation();

  const handleProTool = (path: string) => {
    if (isPro) {
      setLocation(path);
    } else {
      toast.error('Chức năng chỉ dành cho tài khoản Pro', { icon: '💎' });
    }
  };

  const tools = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="12" x="2" y="6" rx="2"/>
          <circle cx="12" cy="12" r="2"/>
          <path d="M6 12h.01M18 12h.01"/>
        </svg>
      ),
      label: 'Tính lương',
      description: 'Tính lương thực lĩnh từ sản lượng & công nhật',
      isPro: true,
      accentColor: 'bg-purple-500/15 text-purple-400',
      bgColor: 'bg-purple-500/5 hover:bg-purple-500/10',
      borderColor: 'border-purple-500/15 hover:border-purple-500/30',
      glowColor: 'bg-purple-500/10',
      onClick: () => handleProTool('/cong-cu/tinh-luong'),
    },
    {
      icon: <CalendarDays className="w-5 h-5" />,
      label: 'Dự tính sản lượng',
      description: 'Ước tính sản lượng cần làm đến cuối kỳ',
      isPro: true,
      accentColor: 'bg-emerald-500/15 text-emerald-400',
      bgColor: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      borderColor: 'border-emerald-500/15 hover:border-emerald-500/30',
      glowColor: 'bg-emerald-500/10',
      onClick: () => handleProTool('/cong-cu/du-tinh'),
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: 'Tra cứu định mức',
      description: 'Tìm nhanh định mức sản lượng theo công đoạn',
      isPro: true,
      accentColor: 'bg-amber-500/15 text-amber-400',
      bgColor: 'bg-amber-500/5 hover:bg-amber-500/10',
      borderColor: 'border-amber-500/15 hover:border-amber-500/30',
      glowColor: 'bg-amber-500/10',
      onClick: () => handleProTool('/cong-cu/tra-cuu'),
    },
  ];

  return (
    <motion.div variants={pageItemVariants} className="flex flex-col gap-3">
      {/* Section Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
          <span>⚡</span>
          Công cụ nhanh
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Tool Cards */}
      <div className="flex flex-col gap-2.5">
        {tools.map((tool) => (
          <ToolCard key={tool.label} {...tool} />
        ))}
      </div>

      {/* Hint for free users */}
      {!isPro && (
        <p className="text-center text-[11px] text-muted-foreground/50 font-medium">
          Nâng cấp{' '}
          <span className="text-purple-400 font-bold">Pro 💎</span>
          {' '}để mở khoá tất cả công cụ
        </p>
      )}
    </motion.div>
  );
}
