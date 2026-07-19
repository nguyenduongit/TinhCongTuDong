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
const AdminPage = lazy(() => import('@/pages/admin'));

// Tool Pages
const CongDoanPage = lazy(() => import('@/pages/cong-cu/cong-doan'));
const EstimationPage = lazy(() => import('@/pages/cong-cu/du-tinh'));
const QuotaLookupPage = lazy(() => import('@/pages/cong-cu/tra-cuu'));
const SalaryCalculatorPage = lazy(() => import('@/pages/cong-cu/tinh-luong'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const FullPageLoader = () => (
  <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
    
    <div className="relative z-10 flex flex-col items-center gap-6">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_linear_infinite] shadow-[0_0_20px_rgba(245,158,11,0.3)]" />
        <div className="absolute inset-2 border-4 border-l-amber-500 border-b-amber-500 border-t-transparent border-r-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]" />
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent animate-pulse tracking-wide">
          Đang tải dữ liệu
        </h3>
        <div className="flex gap-1.5 items-center mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    setLocation(`/login${window.location.search}`);
    return null;
  }

  return <Component />;
}

function Router() {


  return (
    <Suspense fallback={<FullPageLoader />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/"><ProtectedRoute component={Home} /></Route>
        <Route path="/san-luong"><ProtectedRoute component={SanLuong} /></Route>
        <Route path="/cong-tuan"><ProtectedRoute component={CongTuan} /></Route>
        <Route path="/cai-dat"><ProtectedRoute component={CaiDat} /></Route>
        <Route path="/admin"><ProtectedRoute component={AdminPage} /></Route>
        
        {/* Tool Routes */}
        <Route path="/cong-cu/cong-doan"><ProtectedRoute component={CongDoanPage} /></Route>
        <Route path="/cong-cu/du-tinh"><ProtectedRoute component={EstimationPage} /></Route>
        <Route path="/cong-cu/tra-cuu"><ProtectedRoute component={QuotaLookupPage} /></Route>
        <Route path="/cong-cu/tinh-luong"><ProtectedRoute component={SalaryCalculatorPage} /></Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { Toaster as SonnerToaster } from 'sonner';
import { InstallPwa } from '@/components/InstallPwa';
import { useState, useEffect as useReactEffect } from 'react';

function App() {
  const [isPwa, setIsPwa] = useState(true);

  useReactEffect(() => {
    const checkIsPwa = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone || 
                           document.referrer.includes('android-app://');
      
      setIsPwa(isStandalone);
    };
    
    checkIsPwa();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsPwa(true);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!isPwa) {
    return <InstallPwa />;
  }

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
