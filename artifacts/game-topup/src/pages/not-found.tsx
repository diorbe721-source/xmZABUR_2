import { Link } from "wouter";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="text-[12rem] font-mono font-black text-white/5 leading-none select-none relative">
        404
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertTriangle className="w-24 h-24 text-primary" />
        </div>
      </div>
      
      <h1 className="text-4xl font-extrabold text-white mt-8 mb-4">Page Not Found</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved to another server.
      </p>
      
      <Link href="/" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:glow-primary transition-all flex items-center gap-2">
        <Home className="w-5 h-5" /> Back to Base
      </Link>
    </div>
  );
}
