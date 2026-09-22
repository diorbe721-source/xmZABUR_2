import { History as HistoryIcon, Search, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-1 flex-col px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <HistoryIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">GamePay</p>
          <h1 className="text-4xl font-extrabold text-white">Tarix</h1>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-card p-6 text-center shadow-2xl">
        <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-5 text-2xl font-bold text-white">Buyurtma tarixini ko‘ring</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Buyurtma raqamingizni kiriting va uning holatini tekshiring.
        </p>
        <Link
          href="/track"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Buyurtmani kuzatish
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}