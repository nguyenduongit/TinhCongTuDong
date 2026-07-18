import { useState, useEffect } from 'react';
import { Download, Upload, PlusSquare, MoreVertical, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export function InstallPwa() {
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDevice('ios');
    } else if (/android/.test(ua)) {
      setDevice('android');
    } else if (!/mobi/i.test(ua)) {
      setDevice('desktop');
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10 flex flex-col items-center text-center"
      >
        <div className="w-24 h-24 mb-8 shadow-[0_8px_30px_rgba(244,63,94,0.3)] rounded-[24px] overflow-hidden bg-background p-1 border border-white/10">
          <img src="/icon-192.png" alt="App Logo" className="w-full h-full object-cover rounded-[20px]" />
        </div>

        <h1 className="text-2xl font-black tracking-tight mb-3 text-foreground">
          Cài đặt Ứng dụng
        </h1>
        <p className="text-muted-foreground mb-10 text-sm leading-relaxed px-4 font-medium">
          Để có trải nghiệm mượt mà, nhận thông báo đẩy và sử dụng offline, vui lòng cài đặt ứng dụng lên màn hình chính.
        </p>

        <div className="w-full bg-card/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 text-left shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          {device === 'ios' ? (
            <div className="flex flex-col gap-5">
              <h3 className="font-bold text-xs text-foreground/70 uppercase tracking-widest mb-1 text-center">Safari (iOS)</h3>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Upload className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-tight"><strong className="text-foreground">Bước 1:</strong> Chạm vào biểu tượng <strong>Chia sẻ</strong> ở thanh công cụ dưới cùng.</p>
              </div>
              <div className="w-px h-6 bg-border ml-5 -my-3" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <PlusSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-tight"><strong className="text-foreground">Bước 2:</strong> Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính"</strong> (Add to Home Screen).</p>
              </div>
            </div>
          ) : device === 'android' ? (
            <div className="flex flex-col gap-5">
              <h3 className="font-bold text-xs text-foreground/70 uppercase tracking-widest mb-1 text-center">Chrome (Android)</h3>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border/50">
                  <MoreVertical className="w-5 h-5 text-foreground" />
                </div>
                <p className="text-sm text-muted-foreground leading-tight"><strong className="text-foreground">Bước 1:</strong> Chạm vào <strong>Menu (3 chấm)</strong> ở góc trên bên phải trình duyệt.</p>
              </div>
              <div className="w-px h-6 bg-border ml-5 -my-3" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Download className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-tight"><strong className="text-foreground">Bước 2:</strong> Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 text-center items-center py-4">
              <Download className="w-12 h-12 text-primary/50 mb-2" />
              <p className="text-sm text-muted-foreground font-medium px-4">
                Bạn đang dùng trình duyệt máy tính. Vui lòng cài đặt ứng dụng dưới dạng PWA thông qua biểu tượng cài đặt trên thanh địa chỉ.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
