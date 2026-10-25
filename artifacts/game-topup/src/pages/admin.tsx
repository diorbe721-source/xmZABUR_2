import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { Order } from "@workspace/api-client-react";
import { formatSomFromUsd } from "@/lib/currency";

type AdminGame = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  currency: string;
  isActive: boolean;
  uzpinhubGameId: string | null;
};

type AdminPackage = {
  id: number;
  gameId: number;
  name: string;
  amount: number;
  bonus: number | null;
  price: string;
  currency: string;
  isPopular: boolean;
  uzpinhubProductId: string | null;
};

type AdminStatus = Order["status"];

const statusLabels: Record<AdminStatus, string> = {
  pending: "Kutilmoqda",
  paid: "To'langan",
  processing: "Jarayonda",
  completed: "Bajarildi",
  failed: "Xatolik",
};

const statusStyles: Record<AdminStatus, string> = {
  pending: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  paid: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  processing: "bg-violet-400/10 text-violet-300 border-violet-400/20",
  completed: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  failed: "bg-red-400/10 text-red-300 border-red-400/20",
};

const statusIcons: Record<AdminStatus, typeof Clock3> = {
  pending: Clock3,
  paid: CheckCircle2,
  processing: RefreshCw,
  completed: CheckCircle2,
  failed: XCircle,
};

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "So'rov bajarilmadi");
  return body;
}

export default function Admin() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [dashboardError, setDashboardError] = useState("");

  const [tab, setTab] = useState<"orders" | "catalog">("orders");
  const [games, setGames] = useState<AdminGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [newGame, setNewGame] = useState({ name: "", slug: "", description: "", imageUrl: "", currency: "Diamonds", uzpinhubGameId: "" });
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: "", amount: "", bonus: "", price: "", currency: "Diamonds", isPopular: false, uzpinhubProductId: "" });

  const loadGames = async () => {
    setLoadingGames(true);
    setCatalogError("");
    try {
      const data = await apiRequest<AdminGame[]>("/api/admin/games");
      setGames(data);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setLoadingGames(false);
    }
  };

  const loadPackages = async (gameId: number) => {
    setLoadingPackages(true);
    try {
      const data = await apiRequest<AdminPackage[]>(`/api/admin/packages?gameId=${gameId}`);
      setPackages(data);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setLoadingPackages(false);
    }
  };

  const createGame = async (event: FormEvent) => {
    event.preventDefault();
    setCatalogError("");
    try {
      await apiRequest<AdminGame>("/api/admin/games", {
        method: "POST",
        body: JSON.stringify(newGame),
      });
      setNewGame({ name: "", slug: "", description: "", imageUrl: "", currency: "Diamonds", uzpinhubGameId: "" });
      void loadGames();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "O'yin qo'shilmadi");
    }
  };

  const toggleGameActive = async (game: AdminGame) => {
    try {
      await apiRequest<AdminGame>(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !game.isActive }),
      });
      void loadGames();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Yangilanmadi");
    }
  };

  const deleteGame = async (gameId: number) => {
    if (!confirm("Bu o'yinni va uning barcha paketlarini o'chirishni tasdiqlaysizmi?")) return;
    try {
      await apiRequest(`/api/admin/games/${gameId}`, { method: "DELETE" });
      if (selectedGameId === gameId) setSelectedGameId(null);
      void loadGames();
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "O'chirilmadi");
    }
  };

  const selectGame = (gameId: number) => {
    setSelectedGameId(gameId);
    void loadPackages(gameId);
  };

  const createPackage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGameId) return;
    setCatalogError("");
    try {
      await apiRequest<AdminPackage>("/api/admin/packages", {
        method: "POST",
        body: JSON.stringify({
          gameId: selectedGameId,
          name: newPackage.name,
          amount: Number.parseInt(newPackage.amount, 10),
          bonus: newPackage.bonus ? Number.parseInt(newPackage.bonus, 10) : null,
          price: newPackage.price,
          currency: newPackage.currency,
          isPopular: newPackage.isPopular,
          uzpinhubProductId: newPackage.uzpinhubProductId.trim() || null,
        }),
      });
      setNewPackage({ name: "", amount: "", bonus: "", price: "", currency: "Diamonds", isPopular: false, uzpinhubProductId: "" });
      void loadPackages(selectedGameId);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Paket qo'shilmadi");
    }
  };

  const deletePackage = async (packageId: number) => {
    if (!confirm("Bu paketni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await apiRequest(`/api/admin/packages/${packageId}`, { method: "DELETE" });
      if (selectedGameId) void loadPackages(selectedGameId);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "O'chirilmadi");
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    setDashboardError("");
    try {
      const data = await apiRequest<Order[]>("/api/admin/orders?limit=100");
      setOrders(data);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    apiRequest<{ authenticated: boolean }>("/api/admin/me")
      .then((result) => {
        setAuthenticated(result.authenticated);
        if (result.authenticated) {
          void loadOrders();
          void loadGames();
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    try {
      await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setAuthenticated(true);
      void loadOrders();
      void loadGames();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Parol noto'g'ri");
    }
  };

  const updateStatus = async (orderId: number, status: AdminStatus) => {
    setUpdatingId(orderId);
    setDashboardError("");
    try {
      const updated = await apiRequest<Order>(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      );
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Status yangilanmadi");
    } finally {
      setUpdatingId(null);
    }
  };

  const logout = async () => {
    await apiRequest("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setAuthenticated(false);
    setOrders([]);
  };

  if (checkingAuth) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex-1 min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-card border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Restricted area
          </p>
          <h1 className="text-3xl font-extrabold text-white mb-3">Admin panel</h1>
          <p className="text-muted-foreground mb-8">
            Bu sahifa faqat GamePay egasi uchun. Davom etish uchun admin parolini kiriting.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-bold text-white" htmlFor="admin-password">
              Admin paroli
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-background border border-white/15 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Parolni kiriting"
              required
            />
            {loginError && (
              <p className="text-sm text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {loginError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black hover:glow-primary transition-all"
            >
              Admin panelga kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  const completed = orders.filter((order) => order.status === "completed").length;
  const pending = orders.filter((order) => order.status === "pending").length;
  const revenue = orders
    .filter((order) => order.status !== "failed")
    .reduce((total, order) => total + (order.packagePrice ?? 0), 0);

  return (
    <div className="flex-1 w-full px-4 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Private dashboard
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">Buyurtmalar</h1>
            <p className="text-muted-foreground mt-2">
              Buyurtmalarni ko'ring va to'lov holatini boshqaring.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadOrders()}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOrders ? "animate-spin" : ""}`} /> Yangilash
            </button>
            <button
              onClick={() => void logout()}
              className="px-4 py-2.5 rounded-xl border border-red-400/20 text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Chiqish
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 border-b border-white/10">
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              tab === "orders" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Buyurtmalar
          </button>
          <button
            onClick={() => setTab("catalog")}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              tab === "catalog" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            O'yinlar va paketlar
          </button>
        </div>

        {tab === "orders" && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-white/10 rounded-2xl p-5">
            <p className="text-muted-foreground text-sm">Jami buyurtmalar</p>
            <p className="text-3xl font-mono font-bold text-white mt-2">{orders.length}</p>
          </div>
          <div className="bg-card border border-white/10 rounded-2xl p-5">
            <p className="text-muted-foreground text-sm">Kutilayotganlar</p>
            <p className="text-3xl font-mono font-bold text-amber-300 mt-2">{pending}</p>
          </div>
          <div className="bg-card border border-white/10 rounded-2xl p-5">
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Tushum
            </p>
            <p className="text-2xl font-mono font-bold text-primary mt-2">
              {formatSomFromUsd(revenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{completed} ta bajarilgan</p>
          </div>
        </div>

        {dashboardError && (
          <div className="mb-5 p-4 rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {dashboardError}
          </div>
        )}

        <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Oxirgi buyurtmalar</h2>
            <span className="text-xs text-muted-foreground">Maksimum 100 ta</span>
          </div>
          {loadingOrders && orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3" /> Yuklanmoqda...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Hozircha buyurtmalar yo'q.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-white/5">
                    <th className="px-5 py-4">Buyurtma</th>
                    <th className="px-5 py-4">O'yin / paket</th>
                    <th className="px-5 py-4">Player ID</th>
                    <th className="px-5 py-4">Narx</th>
                    <th className="px-5 py-4">Holat</th>
                    <th className="px-5 py-4">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const Icon = statusIcons[order.status];
                    return (
                      <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="px-5 py-4">
                          <p className="font-mono font-bold text-white">#{order.id}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.createdAt).toLocaleString("uz-UZ")}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-white">{order.gameName || "—"}</p>
                          <p className="text-sm text-muted-foreground">{order.packageName || "—"}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-white">{order.playerId}</td>
                        <td className="px-5 py-4 font-mono font-bold text-primary">
                          {formatSomFromUsd(order.packagePrice)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${statusStyles[order.status]}`}>
                            <Icon className={`w-3.5 h-3.5 ${order.status === "processing" ? "animate-spin" : ""}`} />
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(event) => void updateStatus(order.id, event.target.value as AdminStatus)}
                            className="bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>)}

        {tab === "catalog" && (
          <div className="space-y-8">
            {catalogError && (
              <div className="p-4 rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> {catalogError}
              </div>
            )}

            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">O'yinlar</h2>
                <button
                  onClick={() => void loadGames()}
                  className="px-3 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingGames ? "animate-spin" : ""}`} /> Yangilash
                </button>
              </div>

              <form onSubmit={createGame} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-white/10">
                <input
                  value={newGame.name}
                  onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                  placeholder="Nomi (masalan: Mobile Legends: Bang Bang)"
                  required
                  className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={newGame.slug}
                  onChange={(e) => setNewGame({ ...newGame, slug: e.target.value })}
                  placeholder="Slug (masalan: mobile-legends)"
                  required
                  className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={newGame.description}
                  onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                  placeholder="Tavsif"
                  required
                  className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                value={newGame.imageUrl}
                  onChange={(e) => setNewGame({ ...newGame, imageUrl: e.target.value })}
                  placeholder="Rasm yo'li (masalan: /images/mobile-legends.jpg)"
                  required
                  className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={newGame.currency}
                  onChange={(e) => setNewGame({ ...newGame, currency: e.target.value })}
                  placeholder="Valyuta nomi (masalan: Diamonds)"
                  required
                  className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={newGame.uzpinhubGameId}
                  onChange={(e) => setNewGame({ ...newGame, uzpinhubGameId: e.target.value })}
                  placeholder="UZPINHUB game ID (UUID, optional)"
                  className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:glow-primary transition-all"
                >
                  + O'yin qo'shish
                </button>
              </form>

              {loadingGames && games.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3" /> Yuklanmoqda...
                </div>
              ) : games.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">Hozircha o'yinlar yo'q.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className={`p-5 flex items-center justify-between gap-3 cursor-pointer ${
                        selectedGameId === game.id ? "bg-white/[0.03]" : ""
                      }`}
                      onClick={() => selectGame(game.id)}
                    >
                      <div>
                        <p className="font-bold text-white">{game.name}</p>
                        <p className="text-sm text-muted-foreground">{game.slug} · {game.currency}</p>
                        <p className="text-xs text-muted-foreground">UZPINHUB game ID: {game.uzpinhubGameId || "sozlanmagan"}</p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => void toggleGameActive(game)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                            game.isActive
                              ? "border-emerald-400/20 text-emerald-300 bg-emerald-400/10"
                              : "border-white/10 text-muted-foreground"
                          }`}
                        >
                          {game.isActive ? "Faol" : "Faol emas"}
                        </button>
                        <button
                          onClick={() => void deleteGame(game.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-400/20 text-red-300 hover:bg-red-400/10"
                        >
                          O'chirish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedGameId && (
              <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h2 className="text-lg font-bold text-white">
                    Paketlar — {games.find((g) => g.id === selectedGameId)?.name}
                  </h2>
                </div>

                <form onSubmit={createPackage} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-white/10">
                  <input
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    placeholder="Nomi (masalan: 78 Diamonds)"
                    required
                    className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    value={newPackage.amount}
                    onChange={(e) => setNewPackage({ ...newPackage, amount: e.target.value })}
                    placeholder="Miqdor (masalan: 78)"
                    required
                    className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    value={newPackage.bonus}
                    onChange={(e) => setNewPackage({ ...newPackage, bonus: e.target.value })}
                    placeholder="Bonus (ixtiyoriy)"
                    className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                    placeholder="Narx USD'da (masalan: 1.28)"
                    required
                    className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={newPackage.currency}
                    onChange={(e) => setNewPackage({ ...newPackage, currency: e.target.value })}
                    placeholder="Valyuta yorlig'i (masalan: Diamonds)"
                    required
                    className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={newPackage.uzpinhubProductId}
                    onChange={(e) => setNewPackage({ ...newPackage, uzpinhubProductId: e.target.value })}
                    placeholder="UZPINHUB product ID (UUID, optional)"
                    className="bg-background border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <label className="flex items-center gap-2 text-white text-sm px-2">
                    <input
                      type="checkbox"
                      checked={newPackage.isPopular}
                      onChange={(e) => setNewPackage({ ...newPackage, isPopular: e.target.checked })}
                    />
                    Popular deb belgilash
                  </label>
                  <button
                    type="submit"
                    className="md:col-span-3 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:glow-primary transition-all"
                  >
                    + Paket qo'shish
                  </button>
                </form>

                {loadingPackages ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3" /> Yuklanmoqda...
                  </div>
                ) : packages.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">Hozircha paketlar yo'q.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="p-5 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">
                            {pkg.amount} {pkg.currency} {pkg.bonus ? `+ ${pkg.bonus} bonus` : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pkg.name} · {formatSomFromUsd(parseFloat(pkg.price))} {pkg.isPopular ? "· Popular" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">UZPINHUB product ID: {pkg.uzpinhubProductId || "sozlanmagan"}</p>
                        </div>
                        <button
                          onClick={() => void deletePackage(pkg.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-400/20 text-red-300 hover:bg-red-400/10"
                        >
                          O'chirish
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Link href="/" className="text-muted-foreground hover:text-white text-sm">
            ← Saytga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}