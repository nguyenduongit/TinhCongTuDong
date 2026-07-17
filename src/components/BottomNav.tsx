import { Link, useLocation } from 'wouter';
import { Home, History, BarChart3, Settings, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function BottomNav() {
  const [location] = useLocation();

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed bottom-0 w-full max-w-[430px] h-[88px] bg-card/95 backdrop-blur-2xl border-t border-border/80 z-10 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.3)]"
    >
      <div className="grid grid-cols-5 h-16 px-2">
        <NavItem href="/" icon={Home} label="Trang chủ" isActive={location === '/'} />
        <NavItem href="/san-luong" icon={History} label="Sản lượng" isActive={location === '/san-luong'} />
        <NavItem href="/cong-tuan" icon={BarChart3} label="Công tuần" isActive={location === '/cong-tuan'} />
        <NavItem href="/tinh-luong" icon={Calculator} label="Tính lương" isActive={location === '/tinh-luong'} />
        <NavItem href="/cai-dat" icon={Settings} label="Cài đặt" isActive={location === '/cai-dat'} />
      </div>
    </motion.div>
  );
}

function NavItem({ href, icon: Icon, label, isActive }: { href: string, icon: any, label: string, isActive: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center gap-1 transition-colors mt-2",
      isActive ? "text-primary" : "text-muted-foreground/80 hover:text-foreground"
    )}>
      <Icon className={cn("w-6 h-6", !isActive && "opacity-85")} />
      <span className={cn("text-[10px]", isActive ? "font-bold tracking-tight" : "font-semibold opacity-90")}>{label}</span>
    </Link>
  );
}
