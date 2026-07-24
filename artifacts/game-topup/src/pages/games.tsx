import { useListGames } from "@workspace/api-client-react";
import { GameCard } from "@/components/game-card";
import { Search, Gamepad2, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function Games() {
  const { data: games, isLoading, error } = useListGames();
  const [search, setSearch] = useState("");

  const filteredGames = games?.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.slug.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 flex items-center gap-4">
            <Gamepad2 className="w-10 h-10 text-primary" />
            All Games
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Choose a game to top up. We support the most popular mobile titles with instant delivery and secure checkout.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
          <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">Something went wrong</h3>
          <p className="text-muted-foreground max-w-md">We couldn't load the games catalog. Please check your connection and try again.</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-white/5 bg-card/50 rounded-3xl">
          <Search className="w-16 h-16 text-muted-foreground mb-6 opacity-20" />
          <h3 className="text-2xl font-bold text-white mb-2">No games found</h3>
          <p className="text-muted-foreground">We couldn't find any games matching "{search}".</p>
          <button 
            onClick={() => setSearch("")}
            className="mt-6 text-primary hover:underline font-bold"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
