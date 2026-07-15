import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { Check, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function UpgradeModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user, refetchUser } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleCreatePaymentLink = async () => {
    try {
      setIsUpgrading(true);
      
      const { data, error } = await supabase.functions.invoke('create-payos-link', {
        body: { origin: window.location.origin }
      });

      if (error) {
        throw new Error(error.message || "Không thể tạo link thanh toán");
      }
      
      if (data?.checkoutUrl) {
        // Chuyển hướng người dùng sang trang thanh toán của PayOS
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Lỗi không xác định từ PayOS");
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi kết nối hệ thống thanh toán");
      setIsUpgrading(false);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-background border-t border-border flex flex-col rounded-t-[2rem] mt-24 fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] outline-none">
          <div className="p-6 bg-background rounded-t-[2rem] flex-1 flex flex-col relative min-h-0">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <span className="kim-cuong-tim text-[32px] leading-none drop-shadow-md">&#128142;</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Nâng cấp Pro</h2>
              <p className="text-muted-foreground text-sm">Mở khoá toàn bộ tính năng cao cấp của Tính Công Tự Động trong 90 ngày.</p>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <Check className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Tính toán dự tính sản lượng</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <Check className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Tra cứu định mức công đoạn</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <Check className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Trải nghiệm không giới hạn</span>
              </div>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Giá siêu rẻ (chỉ để test)</p>
              <p className="text-2xl font-black text-foreground mb-1">1.000đ <span className="text-sm font-normal text-muted-foreground">/ 90 ngày</span></p>
            </div>

            <button
              onClick={handleCreatePaymentLink}
              disabled={isUpgrading}
              className="w-full flex items-center justify-center gap-2 p-4 bg-purple-500 hover:bg-purple-600 text-white transition-colors rounded-2xl font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isUpgrading ? 'Đang tạo link thanh toán...' : 'Thanh toán qua PayOS'}
            </button>
            <p className="text-[10px] text-center text-muted-foreground mt-4">Hệ thống sẽ chuyển hướng bạn sang cổng thanh toán an toàn của PayOS.</p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
