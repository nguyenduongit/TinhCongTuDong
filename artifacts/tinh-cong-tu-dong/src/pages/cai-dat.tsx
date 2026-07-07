import { useState } from 'react';
import { Settings as SettingsIcon, ChevronRight, Moon, Database, HelpCircle, HardHat, Info } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { CongDoanModal } from '@/components/CongDoanModal';

export default function CaiDat() {
  const [showCongDoanModal, setShowCongDoanModal] = useState(false);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-[430px] relative pb-[120px] bg-background min-h-[100dvh] flex flex-col shadow-2xl">
        
        <div className="absolute top-0 left-0 right-0 h-48 bg-primary/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2" />

        <div className="px-5 pt-12 flex flex-col gap-6 relative z-10 flex-1">
          <header className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Cài đặt</h1>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border/50 text-muted-foreground">
              <SettingsIcon className="w-5 h-5" />
            </div>
          </header>

          <div className="flex flex-col gap-6">
            
            {/* Section 1 */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Dữ liệu</h3>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setShowCongDoanModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors border-b border-border/50 outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Database className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white">Quản lý công đoạn</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors outline-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white">Xuất dữ liệu Excel</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Section 2 */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Giao diện</h3>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="w-full flex items-center justify-between p-4 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Moon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white">Chế độ tối</span>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-primary relative flex items-center px-1">
                    <div className="w-4 h-4 rounded-full bg-background absolute right-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Thông tin</h3>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors border-b border-border/50 outline-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white">Hướng dẫn sử dụng</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="w-full flex items-center justify-between p-4 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Info className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white">Phiên bản</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">1.0.0</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <BottomNav />
      </div>

      <CongDoanModal 
        open={showCongDoanModal} 
        onOpenChange={setShowCongDoanModal} 
        manageMode={true} 
      />
    </div>
  );
}
