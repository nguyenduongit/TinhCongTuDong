import { Link, useLocation } from 'wouter';
import { Home, History, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function BottomNav() {
  const [location] = useLocation();

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[88px] bg-card/90 backdrop-blur-xl border-t border-border z-10 pb-safe"
    >
      <div className="grid grid-cols-4 h-16 px-2">
        <NavItem href="/" icon={Home} label="Trang chủ" isActive={location === '/'} />
        <NavItem href="/lich-su" icon={History} label="Lịch sử" isActive={location === '/lich-su'} />
        <NavItem href="/bao-cao" icon={BarChart3} label="Báo cáo" isActive={location === '/bao-cao'} />
        <NavItem href="/cai-dat" icon={Settings} label="Cài đặt" isActive={location === '/cai-dat'} />
      </div>
    </motion.div>
  );
}

function NavItem({ href, icon: Icon, label, isActive }: { href: string, icon: any, label: string, isActive: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center gap-1 transition-colors mt-2",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    )}>
      <Icon className="w-6 h-6" />
      <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>{label}</span>
    </Link>
  );
}
