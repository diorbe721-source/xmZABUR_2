import { Link } from "wouter";
import { Zap, ShieldCheck, Clock, HeadphonesIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/50 pt-16 pb-8 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <span className="font-sans font-extrabold text-xl tracking-tight text-white">
                GAME<span className="text-primary">PAY</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The fastest, most secure way to top up your favorite games in Central Asia. Instant delivery, 24/7 support.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/games" className="text-muted-foreground hover:text-primary transition-colors text-sm">Browse Games</Link></li>
              <li><Link href="/track" className="text-muted-foreground hover:text-primary transition-colors text-sm">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Why Us?</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" /> Instant Delivery
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" /> 100% Secure
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <HeadphonesIcon className="w-5 h-5 text-primary" /> 24/7 Support
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} GamePay. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Placeholder for payment methods */}
            <div className="h-8 w-12 bg-white/5 rounded" />
            <div className="h-8 w-12 bg-white/5 rounded" />
            <div className="h-8 w-12 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </footer>
  );
}
