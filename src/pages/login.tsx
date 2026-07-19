import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Gift } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [refCode, setRefCode] = useState('');
  const [showRefInput, setShowRefInput] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Lưu ref code từ URL vào localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get('ref');
    if (refFromUrl) {
      localStorage.setItem('referral_code', refFromUrl.toUpperCase());
      setRefCode(refFromUrl.toUpperCase());
      setShowRefInput(true);
      setIsLocked(true);
      // Xoá query param khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success('Đã ghi nhận mã giới thiệu!');
    } else {
      // Kiểm tra nếu đã có ref code trong localStorage
      const savedRef = localStorage.getItem('referral_code');
      if (savedRef) {
        setRefCode(savedRef);
        setShowRefInput(true);
        setIsLocked(true);
      }
    }
  }, []);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user && !isLoading) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (user && !isLoading) {
    return null;
  }

  const handleGoogleLogin = async () => {
    // Lưu ref code nhập tay vào localStorage trước khi redirect
    if (refCode.trim()) {
      localStorage.setItem('referral_code', refCode.trim().toUpperCase());
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <div className="w-20 h-20 shadow-[0_8px_30px_rgba(245,158,11,0.2)] rounded-[20px] mx-auto mb-4 bg-background p-1 border border-white/10 overflow-hidden">
            <img src="/icon-192.png" alt="App Logo" className="w-full h-full object-cover rounded-[16px]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Tính Công Tự Động</h1>
          <p className="text-muted-foreground text-sm">
            Đăng nhập để theo dõi sản lượng cá nhân của bạn
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl squircle-2xl p-6 shadow-xl flex flex-col items-center gap-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>

          {/* Referral code section */}
          <div className="w-full flex flex-col items-center gap-2 mt-1">
            {showRefInput ? (
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <Gift className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs text-muted-foreground">Mã giới thiệu</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={refCode}
                    readOnly={isLocked}
                    onChange={(e) => {
                      if (isLocked) return;
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                      setRefCode(val);
                    }}
                    placeholder="VD: ABC123"
                    maxLength={6}
                    className={`w-full h-11 rounded-xl bg-background border border-white/10 text-foreground text-center text-lg font-mono font-bold tracking-[0.3em] px-4 focus:outline-none focus:ring-2 focus:ring-purple-500/40 placeholder:text-zinc-600 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm ${isLocked ? 'opacity-90 cursor-not-allowed select-none' : ''}`}
                  />
                  {refCode && !isLocked && (
                    <button
                      onClick={() => { setRefCode(''); localStorage.removeItem('referral_code'); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-zinc-500 hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRefInput(true)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5" />
                Có mã giới thiệu? Nhập tại đây
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
