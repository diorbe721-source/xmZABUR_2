import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useListGames, useListPackages, useCreateCheckout } from "@workspace/api-client-react";
import { AlertTriangle, User, Zap, ChevronLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function GameDetail() {
  const [, params] = useRoute("/games/:gameId");
  const gameId = params?.gameId ? parseInt(params.gameId, 10) : 0;
  const [, setLocation] = useLocation();

  const { data: games, isLoading: loadingGames } = useListGames();
  const { data: packages, isLoading: loadingPackages, error: packagesError } = useListPackages(gameId, { query: { enabled: !!gameId } });
  
  const createCheckout = useCreateCheckout();
  
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [serverOrZone, setServerOrZone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const game = games?.find(g => g.id === gameId);

  // Auto-select first package when loaded
  if (packages && packages.length > 0 && selectedPackageId === null && !loadingPackages) {
    setSelectedPackageId(packages[0].id);
  }

  const handleCheckout = () => {
    if (!selectedPackageId) {
      setError("Please select a top-up package.");
      return;
    }
    if (!playerId.trim()) {
      setError("Please enter your Player ID.");
      return;
    }

    setError(null);
    createCheckout.mutate({
      data: {
        packageId: selectedPackageId,
        playerId,
        serverOrZone: serverOrZone.trim() || null
      }
    }, {
      onSuccess: (result) => {
        window.location.href = result.checkoutUrl;
      },
      onError: () => {
        setError("Failed to create checkout. Please try again.");
      }
    });
  };

  const imageMap: Record<string, string> = {
    'pubg-mobile': '/attached_assets/generated_images/pubg.jpg',
    'mobile-legends': '/attached_assets/generated_images/mobile-legends.jpg',
    'free-fire': '/attached_assets/generated_images/free-fire.jpg',
    'genshin-impact': '/attached_assets/generated_images/genshin.jpg',
    'cod-mobile': '/attached_assets/generated_images/codm.jpg'
  };

  if (loadingGames) {
    return <div className="container mx-auto p-12 text-center text-muted-foreground animate-pulse">Loading game details...</div>;
  }

  if (!game) {
    return (
      <div className="container mx-auto p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Game Not Found</h1>
        <Link href="/games" className="text-primary hover:underline">Back to games</Link>
      </div>
    );
  }

  const imgSrc = imageMap[game.slug] || game.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200';
  const selectedPackage = packages?.find(p => p.id === selectedPackageId);

  return (
    <div className="flex-1 w-full bg-background relative pb-32">
      {/* Hero Header */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <img src={imgSrc} alt={game.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12 flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0">
              <img src={imgSrc} alt={game.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <Link href="/games" className="inline-flex items-center text-sm font-bold text-primary mb-4 hover:underline">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Link>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">{game.name}</h1>
              <p className="text-muted-foreground text-lg mt-2 max-w-2xl">{game.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Step 1: Select Amount */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border border-primary/30">1</div>
                <h2 className="text-2xl font-bold text-white">Select {game.currency} Amount</h2>
              </div>
              
              {loadingPackages ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : packagesError ? (
                <div className="p-8 border border-destructive/20 bg-destructive/10 rounded-xl text-destructive font-medium flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" /> Failed to load packages. Please try again.
                </div>
              ) : packages?.length === 0 ? (
                <div className="p-8 border border-white/5 bg-white/5 rounded-xl text-muted-foreground text-center">
                  No packages currently available for {game.name}.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {packages?.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                          isSelected 
                            ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)] scale-[1.02]" 
                            : "border-white/10 bg-card hover:border-white/30 hover:bg-white/5"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-3 -right-3 bg-primary text-background rounded-full p-1">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        {pkg.isPopular && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Popular
                          </div>
                        )}
                        
                        <div className="text-2xl font-extrabold text-white flex items-center gap-1">
                          {pkg.amount}
                        </div>
                        <div className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">{pkg.currency}</div>
                        
                        {pkg.bonus && (
                          <div className="text-xs font-medium text-emerald-400 mb-2 bg-emerald-400/10 px-2 py-1 rounded-md">
                            + {pkg.bonus} Bonus
                          </div>
                        )}
                        
                        <div className="text-lg font-mono font-medium text-muted-foreground mt-auto pt-2 border-t border-white/10 w-full">
                          ${pkg.price.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Step 2: Player ID */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center border border-primary/30">2</div>
                <h2 className="text-2xl font-bold text-white">Enter Player Details</h2>
              </div>
              
              <div className="bg-card border border-white/10 p-6 md:p-8 rounded-2xl grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label htmlFor="playerId" className="block text-sm font-bold text-white uppercase tracking-wide">
                    Player ID <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="playerId"
                      type="text"
                      placeholder="e.g. 123456789"
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                      className="w-full bg-background border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Your ID is safe with us
                  </p>
                </div>
                
                {/* Optional Server/Zone field based on game requirements */}
                <div className="space-y-3">
                  <label htmlFor="serverOrZone" className="block text-sm font-bold text-white uppercase tracking-wide">
                    Server / Zone ID <span className="text-muted-foreground lowercase normal-case">(if applicable)</span>
                  </label>
                  <input
                    id="serverOrZone"
                    type="text"
                    placeholder="e.g. 1234"
                    value={serverOrZone}
                    onChange={(e) => setServerOrZone(e.target.value)}
                    className="w-full bg-background border border-white/20 rounded-xl px-4 py-4 text-white font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Checkout */}
          <div className="lg:col-span-4">
            <div className="bg-card border border-white/10 rounded-2xl p-6 md:p-8 sticky top-24 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Game</span>
                  <span className="font-bold text-white">{game.name}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-bold text-white">
                    {selectedPackage ? `${selectedPackage.amount} ${selectedPackage.currency}` : "Not selected"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Player ID</span>
                  <span className="font-mono text-white">
                    {playerId || "---"}
                  </span>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-end">
                  <span className="text-muted-foreground font-medium">Total</span>
                  <span className="text-3xl font-mono font-bold text-white">
                    ${selectedPackage ? selectedPackage.price.toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive text-sm font-bold rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={createCheckout.isPending || !selectedPackage}
                className="w-full py-5 bg-primary text-primary-foreground font-black text-lg uppercase tracking-wider rounded-xl hover:glow-primary hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {createCheckout.isPending ? (
                  <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Top Up Now
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Secure Checkout via Whop
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
