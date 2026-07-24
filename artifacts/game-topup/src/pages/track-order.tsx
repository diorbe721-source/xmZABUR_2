import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Hash, ChevronRight, Zap } from "lucide-react";
import { Link } from "wouter";

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [, setLocation] = useLocation();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.replace(/[^0-9]/g, '');
    if (id) {
      setLocation(`/orders/${id}`);
    }
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
      
      <div className="w-full max-w-xl text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Search className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Track Your Order
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter your Order ID below to check the real-time status of your top-up.
        </p>
      </div>

      <form 
        onSubmit={handleTrack}
        className="w-full max-w-xl bg-card border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
        
        <div className="space-y-6 relative z-10">
          <div>
            <label htmlFor="orderId" className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
              Order ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Hash className="h-6 w-6 text-muted-foreground" />
              </div>
              <input
                id="orderId"
                type="text"
                placeholder="e.g. 10425"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-background border border-white/20 rounded-xl pl-14 pr-4 py-5 text-white font-mono text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!orderId.trim()}
            className="w-full py-5 bg-primary text-primary-foreground font-black text-lg uppercase tracking-wider rounded-xl hover:glow-primary hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            Track Status <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </form>

      <div className="mt-16 grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Link href="/games" className="group bg-card/50 border border-white/5 hover:border-white/20 p-6 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/5">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">Make a New Top-up</h3>
            <p className="text-sm text-muted-foreground">Browse our catalog of supported games.</p>
          </div>
        </Link>
        
        <div className="bg-card/50 border border-white/5 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-muted-foreground">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">Lost your ID?</h3>
            <p className="text-sm text-muted-foreground">Check your email or Whop account for the receipt.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
