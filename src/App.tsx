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


  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/"><ProtectedRoute component={Home} /></Route>
        <Route path="/san-luong"><ProtectedRoute component={SanLuong} /></Route>
        <Route path="/cong-tuan"><ProtectedRoute component={CongTuan} /></Route>
        <Route path="/cai-dat"><ProtectedRoute component={CaiDat} /></Route>
        <Route path="/huong-dan"><ProtectedRoute component={HuongDan} /></Route>
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
