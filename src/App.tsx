import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth } from '@/components/AuthProvider';

const Home = lazy(() => import('@/pages/home'));
const SanLuong = lazy(() => import('@/pages/san-luong'));
const CongTuan = lazy(() => import('@/pages/cong-tuan'));
const CaiDat = lazy(() => import('@/pages/cai-dat'));
const Login = lazy(() => import('@/pages/login'));
const HuongDan = lazy(() => import('@/pages/huong-dan'));
const TinhLuong = lazy(() => import('@/pages/tinh-luong'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary">Đang tải...</div>;
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  return <Component />;
}

function Router() {
  useEffect(() => {
    import('@/lib/onesignal').then(({ initOneSignal }) => {
      initOneSignal().catch(console.error);
    }).catch(console.error);
  }, []);

  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/"><ProtectedRoute component={Home} /></Route>
        <Route path="/san-luong"><ProtectedRoute component={SanLuong} /></Route>
        <Route path="/cong-tuan"><ProtectedRoute component={CongTuan} /></Route>
        <Route path="/cai-dat"><ProtectedRoute component={CaiDat} /></Route>
        <Route path="/huong-dan"><ProtectedRoute component={HuongDan} /></Route>
        <Route path="/tinh-luong"><ProtectedRoute component={TinhLuong} /></Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { Toaster as SonnerToaster } from 'sonner';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
