import { Link, useLocation } from 'wouter';
import { Home, History, BarChart3, Settings, Calculator, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { useAuth } from '@/components/AuthProvider';

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.isAdmin === true;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed bottom-0 w-full max-w-[430px] h-[88px] bg-card/95 backdrop-blur-2xl border-t border-border/80 z-10 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.3)]"
    >
      <div className={cn("grid h-16 px-2", isAdmin ? "grid-cols-5" : "grid-cols-4")}>
        <NavItem href="/" icon={Home} label="Trang chủ" isActive={location === '/'} />
        <NavItem href="/san-luong" icon={History} label="Sản lượng" isActive={location === '/san-luong'} />
        <NavItem href="/cong-tuan" icon={BarChart3} label="Công tuần" isActive={location === '/cong-tuan'} />
        <NavItem href="/cai-dat" icon={Settings} label="Cài đặt" isActive={location === '/cai-dat'} />
        {isAdmin && <NavItem href="/admin" icon={ShieldAlert} label="Admin" isActive={location === '/admin'} isSpecial />}
      </div>
    </motion.div>
  );
}

function NavItem({ href, icon: Icon, label, isActive, isSpecial }: { href: string, icon: any, label: string, isActive: boolean, isSpecial?: boolean }) {
  if (isSpecial) {
    return (
      <Link href={href} className="relative flex flex-col items-center justify-center gap-1 mt-1.5 group">
        <div className={cn(
          "relative flex p-1.5 rounded-xl transition-all duration-300",
          isActive ? "bg-gradient-to-tr from-rose-500 to-orange-500 text-white shadow-[0_4px_16px_rgba(244,63,94,0.5)]" : "text-rose-500/70 bg-rose-500/5 group-hover:text-rose-500 group-hover:bg-rose-500/10"
        )}>
          <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]")} />
        </div>
        <span className={cn(
          "text-[10px] transition-all duration-300",
          isActive ? "font-bold tracking-tight text-rose-500" : "font-semibold opacity-80 text-rose-500/70"
        )}>{label}</span>
      </Link>
    );
  }

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
