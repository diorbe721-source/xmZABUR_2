import { CreditCard, ArrowUpRight, WalletCards } from "lucide-react";
import { Link } from "wouter";

export default function Wallet() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-1 flex-col px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <WalletCards className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">GamePay</p>
          <h1 className="text-4xl font-extrabold text-white">Hamyon</h1>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
        <p className="text-sm text-muted-foreground">Joriy balans</p>
        <p className="mt-2 text-4xl font-extrabold text-white">0 so‘m</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Hamyon va balansni to‘ldirish imkoniyati tez orada qo‘shiladi.
          Hozircha o‘yin paketini tanlab, buyurtma berishingiz mumkin.
        </p>

        <Link
          href="/games"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          O‘yinlarni ko‘rish
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-6 text-muted-foreground">
          To‘lovlar xavfsiz tarzda qayta ishlanadi. Buyurtma holatini Tarix bo‘limidan kuzatishingiz mumkin.
        </p>
      </div>
    </div>
  );
}