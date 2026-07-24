import { Link } from "wouter";
import { Gamepad2, Search, Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Zap className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
          </div>
          <span className="font-sans font-extrabold text-xl tracking-tight text-white group-hover:text-primary transition-colors">
            GAME<span className="text-primary">PAY</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/games" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            All Games
          </Link>
          <Link href="/track" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            Track Order
          </Link>
          
          <div className="h-4 w-px bg-white/10" />
          
          <Link 
            href="/games" 
            className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:glow-primary transition-all active:scale-95"
          >
            Top Up Now
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-background absolute top-16 left-0 w-full p-4 flex flex-col gap-4 shadow-2xl">
          <Link 
            href="/games" 
            className="p-3 rounded-lg hover:bg-white/5 font-medium"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            All Games
          </Link>
          <Link 
            href="/track" 
            className="p-3 rounded-lg hover:bg-white/5 font-medium"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Track Order
          </Link>
          <Link 
            href="/games" 
            className="p-3 rounded-lg bg-primary text-primary-foreground font-bold text-center mt-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Top Up Now
          </Link>
        </div>
      )}
    </nav>
  );
}
