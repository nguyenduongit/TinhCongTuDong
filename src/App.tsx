import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth } from '@/components/AuthProvider';

const Home = lazy(() => import('@/pages/home'));
const LichSu = lazy(() => import('@/pages/lich-su'));
const BaoCao = lazy(() => import('@/pages/bao-cao'));
const CaiDat = lazy(() => import('@/pages/cai-dat'));
const Login = lazy(() => import('@/pages/login'));
const HuongDan = lazy(() => import('@/pages/huong-dan'));

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
        <Route path="/lich-su"><ProtectedRoute component={LichSu} /></Route>
        <Route path="/bao-cao"><ProtectedRoute component={BaoCao} /></Route>
        <Route path="/cai-dat"><ProtectedRoute component={CaiDat} /></Route>
        <Route path="/huong-dan"><ProtectedRoute component={HuongDan} /></Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
