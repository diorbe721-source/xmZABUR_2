import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";
import { useLocation } from "wouter";

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isAdmin = location === "/admin" || location.startsWith("/admin/");

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen" />
      
      <Navbar />
      <main className="flex-1 flex flex-col z-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-8">
        {children}
      </main>
      <Footer />
      {!isAdmin && <BottomNav />}
    </div>
  );
}
