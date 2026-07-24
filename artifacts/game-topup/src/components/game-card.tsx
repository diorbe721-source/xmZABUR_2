import { Link } from "wouter";
import type { Game } from "@workspace/api-client-react";
import { ChevronRight } from "lucide-react";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  // If the game doesn't have an explicit imageUrl that works, we can map some defaults based on slug.
  // The generated images are in attached_assets/generated_images/
  const imageMap: Record<string, string> = {
    'pubg-mobile': '/attached_assets/generated_images/pubg.jpg',
    'mobile-legends': '/attached_assets/generated_images/mobile-legends.jpg',
    'free-fire': '/attached_assets/generated_images/free-fire.jpg',
    'genshin-impact': '/attached_assets/generated_images/genshin.jpg',
    'cod-mobile': '/attached_assets/generated_images/codm.jpg'
  };

  const imgSrc = imageMap[game.slug] || game.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800';

  return (
    <Link href={`/games/${game.id}`}>
      <div className="group relative rounded-2xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(0,229,255,0.3)] aspect-[3/4] cursor-pointer">
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={imgSrc} 
            alt={game.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="font-sans font-bold text-xl text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
              {game.name}
            </h3>
            <p className="text-sm text-white/70 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
              Top up {game.currency} <ChevronRight className="w-4 h-4" />
            </p>
          </div>
        </div>

        {/* Popular Badge */}
        {game.isActive && (
          <div className="absolute top-3 right-3 bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">
            Active
          </div>
        )}
      </div>
    </Link>
  );
}
