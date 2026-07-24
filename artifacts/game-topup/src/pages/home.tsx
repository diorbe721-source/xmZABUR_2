import { useListGames, useGetSiteStats, useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { GameCard } from "@/components/game-card";
import { Zap, Shield, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { data: games, isLoading: loadingGames, error: gamesError } = useListGames();
  const { data: stats, isLoading: loadingStats } = useGetSiteStats();
  const { data: recentOrders } = useListOrders({ limit: 10 });

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2800')] opacity-10 mix-blend-overlay bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="container relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold tracking-wide mb-4 animate-in fade-in slide-in-from-bottom-4">
            <Zap className="w-4 h-4" />
            INSTANT DELIVERY IN CENTRAL ASIA
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white animate-in fade-in slide-in-from-bottom-6 delay-150 duration-700">
            LEVEL UP YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              GAMING EXPERIENCE
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 delay-300 duration-700">
            The fastest, most secure way to buy in-game currency. Trusted by thousands of players. Skip the grind, jump straight into the action.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-10 delay-500 duration-700">
            <Link 
              href="/games" 
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg text-lg hover:scale-105 hover:glow-primary transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" /> Start Topping Up
            </Link>
            <Link 
              href="/track" 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-lg text-lg hover:bg-white/10 transition-colors active:scale-95"
            >
              Track Order
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="border-y border-white/5 bg-white/[0.02] py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center divide-x divide-white/5">
            <div>
              <div className="text-3xl md:text-5xl font-mono font-bold text-white mb-2">
                {loadingStats ? "..." : (stats?.totalOrders.toLocaleString() || "150,000+")}
              </div>
              <div className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Orders Completed</div>
            </div>
            <div>
              <div className="text-3xl md:text-5xl font-mono font-bold text-white mb-2">
                {loadingStats ? "..." : (stats?.activeGames || "5+")}
              </div>
              <div className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Supported Games</div>
            </div>
            <div className="col-span-2 md:col-span-1 border-t border-white/5 md:border-t-0 pt-8 md:pt-0">
              <div className="text-3xl md:text-5xl font-mono font-bold text-white mb-2">
                &lt; 5s
              </div>
              <div className="text-sm font-medium text-muted-foreground tracking-widest uppercase">Average Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Recent Orders Ticker */}
      {recentOrders && recentOrders.length > 0 && (
        <section className="py-4 border-b border-white/5 bg-background overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
          
          <div className="flex gap-8 animate-[marquee_30s_linear_infinite] w-max px-4">
            {[...recentOrders, ...recentOrders].map((order, i) => (
              <div key={`${order.id}-${i}`} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-2 px-5 whitespace-nowrap">
                {order.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <Clock className="w-4 h-4 text-secondary" />
                )}
                <span className="text-sm text-white">
                  User <span className="font-mono text-muted-foreground">{order.playerId.slice(0,3)}***{order.playerId.slice(-2)}</span> 
                  {' '}bought <span className="font-bold text-primary">{order.packageAmount || 'a package'}</span> 
                  {' '}for <span className="font-bold">{order.gameName || 'Game'}</span>
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Games */}
      <section className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Trending Now
            </h2>
            <p className="text-muted-foreground">Top up your favorite games instantly.</p>
          </div>
          <Link href="/games" className="hidden md:flex items-center gap-2 text-primary font-bold hover:glow-primary transition-all px-4 py-2 rounded-lg bg-primary/10">
            View All Games <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingGames ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : gamesError ? (
          <div className="p-8 border border-destructive/20 bg-destructive/10 rounded-xl text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Failed to load games</h3>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {games?.slice(0, 5).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
        
        <div className="mt-8 flex justify-center md:hidden">
          <Link href="/games" className="w-full text-center py-4 rounded-xl bg-white/5 font-bold text-white hover:bg-white/10 transition-colors">
            View All Games
          </Link>
        </div>
      </section>
      
      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-32 h-32 text-primary" />
            </div>
            <Zap className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
            <p className="text-muted-foreground">Your account is topped up seconds after payment completes. No waiting around.</p>
          </div>
          <div className="bg-card border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-32 h-32 text-secondary" />
            </div>
            <Shield className="w-10 h-10 text-secondary mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">100% Secure</h3>
            <p className="text-muted-foreground">Official channels only. Your account safety is our top priority. Zero ban risk.</p>
          </div>
          <div className="bg-card border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-32 h-32 text-primary" />
            </div>
            <TrendingUp className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Best Prices</h3>
            <p className="text-muted-foreground">We offer the most competitive rates in Central Asia with special bonuses on large packages.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

import { ChevronRight } from "lucide-react";
