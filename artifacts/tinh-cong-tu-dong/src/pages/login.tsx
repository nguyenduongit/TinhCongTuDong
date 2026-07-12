import { GoogleLogin } from '@react-oauth/google';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/AuthProvider';
import { customFetch } from '@workspace/api-client-react';
import { toast } from 'sonner';

export default function Login() {
  const [, setLocation] = useLocation();
  const { refetchUser } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      await customFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      await refetchUser();
      setLocation('/');
    } catch (err) {
      console.error(err);
      toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl squircle-xl mx-auto flex items-center justify-center mb-4 text-3xl">
            👷
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Tính Công Tự Động</h1>
          <p className="text-muted-foreground text-sm">
            Đăng nhập để theo dõi sản lượng cá nhân của bạn
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl squircle-2xl p-6 shadow-xl flex flex-col items-center gap-4">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              toast.error('Đăng nhập Google thất bại');
            }}
            useOneTap
            theme="filled_black"
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
}
