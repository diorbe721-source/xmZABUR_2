import { Link } from "wouter";
import { ArrowUpRight, UserRound } from "lucide-react";

export default function Profile() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-1 flex-col px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <UserRound className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">GamePay</p>
          <h1 className="text-4xl font-extrabold text-white">Profil</h1>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white">Profil va sozlamalar</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Buyurtmalarni ko‘rish uchun Tarix bo‘limiga, balansni boshqarish uchun esa Hamyon bo‘limiga o‘ting.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/history"
            className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-semibold text-white transition-colors hover:border-primary/40 hover:text-primary"
          >
            Buyurtmalar tarixi
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/wallet"
            className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-semibold text-white transition-colors hover:border-primary/40 hover:text-primary"
          >
            Hamyon
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}