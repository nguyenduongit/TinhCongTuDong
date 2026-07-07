import { motion, type Variants } from 'framer-motion';
import { Plus, Home as HomeIcon, History, BarChart3, Settings, Bell, ChevronRight, HardHat, Wallet } from 'lucide-react';
import { Link } from 'wouter';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const fabVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 25,
      delay: 0.4
    }
  }
};

const navVariants: Variants = {
  hidden: { y: 100 },
  show: { 
    y: 0,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30,
      delay: 0.2
    }
  }
};

const recentEntries = [
  { id: 1, worker: "Nguyễn Văn A", hours: 8, project: "Công trình ABC", date: "Hôm nay", amount: "400,000đ" },
  { id: 2, worker: "Trần Thị B", hours: 8, project: "Công trình ABC", date: "Hôm nay", amount: "350,000đ" },
  { id: 3, worker: "Lê Văn C", hours: 4, project: "Biệt thự Cầu Giấy", date: "Hôm qua", amount: "200,000đ" },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30 dark">
      {/* Mobile-first container max-width 430px */}
      <div className="w-full max-w-[430px] relative pb-24 shadow-2xl bg-background overflow-hidden min-h-[100dvh] flex flex-col">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-primary/10 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2" />
        
        <motion.div 
          className="flex-1 px-5 pt-12 flex flex-col gap-8 relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.header variants={itemVariants} className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Thứ Ba, 24 Tháng 10</p>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent">
                Tính Công Tự Động
              </h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
            </button>
          </motion.header>

          {/* Hero Card */}
          <motion.div variants={cardVariants} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative bg-card border border-border/50 rounded-[20px] p-6 shadow-xl overflow-hidden">
              {/* Glass reflection effect */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Tổng chi phí tháng này</span>
                </div>
                <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <span>+12%</span>
                </div>
              </div>
              
              <div className="mb-2">
                <h2 className="text-4xl font-bold text-white tracking-tight">45,800,000<span className="text-2xl text-muted-foreground font-semibold ml-1">đ</span></h2>
              </div>
              
              <div className="flex gap-6 mt-6 pt-5 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Tổng số công</p>
                  <p className="text-lg font-semibold text-white">124 <span className="text-sm text-muted-foreground font-normal">công</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Nhân công</p>
                  <p className="text-lg font-semibold text-white">18 <span className="text-sm text-muted-foreground font-normal">người</span></p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Entries */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Công gần đây</h3>
              <button className="text-sm text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {recentEntries.map((entry, i) => (
                <motion.div 
                  key={entry.id}
                  variants={itemVariants}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border/50 flex-shrink-0">
                    <span className="text-primary font-bold text-lg">{entry.worker.charAt(0)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-white truncate pr-2">{entry.worker}</h4>
                      <span className="text-primary font-semibold text-sm whitespace-nowrap">{entry.hours} giờ</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <HardHat className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{entry.project}</span>
                      </div>
                      <span className="whitespace-nowrap">{entry.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Action Button */}
        <motion.div 
          variants={fabVariants}
          initial="hidden"
          animate="show"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
        >
          <button className="relative group flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
            <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-tr from-amber-500 to-primary flex items-center justify-center text-primary-foreground shadow-[0_8px_32px_rgba(212,168,67,0.4)] border-4 border-background relative active:scale-95 transition-transform">
              <Plus className="w-8 h-8" strokeWidth={2.5} />
            </div>
          </button>
        </motion.div>

        {/* Bottom Navigation */}
        <motion.div 
          variants={navVariants}
          initial="hidden"
          animate="show"
          className="absolute bottom-0 left-0 right-0 h-[88px] bg-card/90 backdrop-blur-xl border-t border-border z-10 pb-safe"
        >
          <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-2">
            <Link href="/" className="flex flex-col items-center justify-center gap-1 text-primary">
              <HomeIcon className="w-6 h-6" />
              <span className="text-[10px] font-semibold">Trang chủ</span>
            </Link>
            <Link href="/history" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <History className="w-6 h-6" />
              <span className="text-[10px] font-medium">Lịch sử</span>
            </Link>
            <Link href="/report" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <BarChart3 className="w-6 h-6" />
              <span className="text-[10px] font-medium">Báo cáo</span>
            </Link>
            <Link href="/settings" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-medium">Cài đặt</span>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
