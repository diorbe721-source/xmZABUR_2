import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/shell';
import NotFound from '@/pages/not-found';

// Pages
import Home from '@/pages/home';
import Games from '@/pages/games';
import GameDetail from '@/pages/game-detail';
import OrderStatus from '@/pages/order-status';
import TrackOrder from '@/pages/track-order';
import Admin from '@/pages/admin';
import Wallet from '@/pages/wallet';
import History from '@/pages/history';
import Profile from '@/pages/profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/games" component={Games} />
        <Route path="/games/:gameId" component={GameDetail} />
        <Route path="/orders/:orderId" component={OrderStatus} />
        <Route path="/track" component={TrackOrder} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/history" component={History} />
        <Route path="/profile" component={Profile} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
