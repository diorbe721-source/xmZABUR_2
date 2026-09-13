import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@workspace/db";
import { ordersTable, gamesTable, packagesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();
const ADMIN_COOKIE = "gamepay_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const allowedStatuses = new Set([
  "pending",
  "paid",
  "processing",
  "completed",
  "failed",
]);

function secret() {
  return process.env.SESSION_SECRET || "development-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function makeSession() {
  const payload = `${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return `${payload}.${sign(payload)}`;
}

function readCookie(req: { headers: { cookie?: string } }) {
  const cookies = req.headers.cookie?.split(";").map((item) => item.trim()) ?? [];
  const match = cookies.find((item) => item.startsWith(`${ADMIN_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1)) : null;
}

function isAuthenticated(req: { headers: { cookie?: string } }) {
  const session = readCookie(req);
  if (!session) return false;

  const parts = session.split(".");
  if (parts.length < 3) return false;
  const [timestamp, random, signature] = parts;
  const payload = `${timestamp}.${random}`;
  const expected = sign(payload);
  if (!signature || signature.length !== expected.length) return false;

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  } catch {
    return false;
  }

  return Date.now() - Number(timestamp) < SESSION_TTL_MS;
}

function requireAdmin(req: Parameters<Parameters<typeof router.get>[1]>[0], res: Parameters<Parameters<typeof router.get>[1]>[1], next: () => void) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}

router.post("/admin/login", (req, res) => {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    res.status(503).json({ error: "Admin password is not configured" });
    return;
  }

  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const supplied = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);
  const valid =
    supplied.length === expected.length && timingSafeEqual(supplied, expected);

  if (!valid) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(makeSession())}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}`,
  );
  res.json({ authenticated: true });
});

router.post("/admin/logout", (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
  res.json({ authenticated: false });
});

router.get("/admin/me", (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});

router.get("/admin/orders", requireAdmin, async (req, res) => {
  const requestedLimit = Number.parseInt(String(req.query.limit ?? "100"), 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 100;
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);
  res.json(orders.map(formatOrder));
});

router.patch("/admin/orders/:orderId/status", requireAdmin, async (req, res) => {
  const orderId = Number.parseInt(req.params.orderId, 10);
  const status = typeof req.body?.status === "string" ? req.body.status : "";

  if (!Number.isInteger(orderId) || !allowedStatuses.has(status)) {
    res.status(400).json({ error: "Invalid order ID or status" });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

router.get("/admin/games", requireAdmin, async (_req, res) => {
  const games = await db.select().from(gamesTable).orderBy(gamesTable.id);
  res.json(games);
});

router.post("/admin/games", requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const description = typeof body.description === "string" ? body.description : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
  const currency = typeof body.currency === "string" ? body.currency : "";
  const isActive = body.isActive !== false;

  if (!name || !slug || !description || !imageUrl || !currency) {
    res.status(400).json({ error: "name, slug, description, imageUrl, currency talab qilinadi" });
    return;
  }

  try {
    const [game] = await db
      .insert(gamesTable)
      .values({ name, slug, description, imageUrl, currency, isActive })
      .returning();
    res.status(201).json(game);
  } catch {
    res.status(400).json({ error: "O'yin yaratilmadi (slug band bo'lishi mumkin)" });
  }
});

router.patch("/admin/games/:gameId", requireAdmin, async (req, res) => {
  const gameId = Number.parseInt(req.params.gameId, 10);
  if (!Number.isInteger(gameId)) {
    res.status(400).json({ error: "Noto'g'ri o'yin ID" });
    return;
  }

  const body = req.body ?? {};
  const updates: Partial<typeof gamesTable.$inferInsert> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.slug === "string") updates.slug = body.slug.trim();
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.imageUrl === "string") updates.imageUrl = body.imageUrl;
  if (typeof body.currency === "string") updates.currency = body.currency;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

  const [game] = await db
    .update(gamesTable)
    .set(updates)
    .where(eq(gamesTable.id, gameId))
    .returning();

  if (!game) {
    res.status(404).json({ error: "O'yin topilmadi" });
    return;
  }
  res.json(game);
});

router.delete("/admin/games/:gameId", requireAdmin, async (req, res) => {
  const gameId = Number.parseInt(req.params.gameId, 10);
  if (!Number.isInteger(gameId)) {
    res.status(400).json({ error: "Noto'g'ri o'yin ID" });
    return;
  }
  await db.delete(packagesTable).where(eq(packagesTable.gameId, gameId));
  const [deleted] = await db.delete(gamesTable).where(eq(gamesTable.id, gameId)).returning();
  if (!deleted) {
    res.status(404).json({ error: "O'yin topilmadi" });
    return;
  }
  res.json({ deleted: true });
});

router.get("/admin/packages", requireAdmin, async (req, res) => {
  const gameIdParam = req.query.gameId;
  if (gameIdParam) {
    const gameId = Number.parseInt(String(gameIdParam), 10);
    if (!Number.isInteger(gameId)) {
      res.status(400).json({ error: "Noto'g'ri o'yin ID" });
      return;
    }
    const packages = await db.select().from(packagesTable).where(eq(packagesTable.gameId, gameId));
    res.json(packages);
    return;
  }
  const packages = await db.select().from(packagesTable).orderBy(packagesTable.id);
  res.json(packages);
});

router.post("/admin/packages", requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const gameId = Number.parseInt(String(body.gameId), 10);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const amount = Number.parseInt(String(body.amount), 10);
  const bonus =
    body.bonus === null || body.bonus === undefined || body.bonus === ""
      ? null
      : Number.parseInt(String(body.bonus), 10);
  const price = typeof body.price === "number" ? body.price.toFixed(2) : String(body.price ?? "").trim();
  const currency = typeof body.currency === "string" ? body.currency : "";
  const isPopular = body.isPopular === true;

  if (!Number.isInteger(gameId) || !name || !Number.isInteger(amount) || !price || !currency) {
    res.status(400).json({ error: "gameId, name, amount, price, currency talab qilinadi" });
    return;
  }

  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, gameId)).limit(1);
  if (!game) {
    res.status(404).json({ error: "O'yin topilmadi" });
    return;
  }

  const [pkg] = await db
    .insert(packagesTable)
    .values({ gameId, name, amount, bonus, price, currency, isPopular, whopPlanId: null })
    .returning();
  res.status(201).json(pkg);
});

router.patch("/admin/packages/:packageId", requireAdmin, async (req, res) => {
  const packageId = Number.parseInt(req.params.packageId, 10);
  if (!Number.isInteger(packageId)) {
    res.status(400).json({ error: "Noto'g'ri paket ID" });
    return;
  }

  const body = req.body ?? {};
  const updates: Partial<typeof packagesTable.$inferInsert> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (body.amount !== undefined) updates.amount = Number.parseInt(String(body.amount), 10);
  if (body.bonus !== undefined) {
    updates.bonus = body.bonus === null || body.bonus === "" ? null : Number.parseInt(String(body.bonus), 10);
  }
  if (body.price !== undefined) {
    updates.price = typeof body.price === "number" ? body.price.toFixed(2) : String(body.price);
  }
  if (typeof body.currency === "string") updates.currency = body.currency;
  if (typeof body.isPopular === "boolean") updates.isPopular = body.isPopular;

  const [pkg] = await db
    .update(packagesTable)
    .set(updates)
    .where(eq(packagesTable.id, packageId))
    .returning();

  if (!pkg) {
    res.status(404).json({ error: "Paket topilmadi" });
    return;
  }
  res.json(pkg);
});

router.delete("/admin/packages/:packageId", requireAdmin, async (req, res) => {
  const packageId = Number.parseInt(req.params.packageId, 10);
  if (!Number.isInteger(packageId)) {
    res.status(400).json({ error: "Noto'g'ri paket ID" });
    return;
  }
  const [deleted] = await db.delete(packagesTable).where(eq(packagesTable.id, packageId)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Paket topilmadi" });
    return;
  }
  res.json({ deleted: true });
});

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    gameId: o.gameId,
    packageId: o.packageId,
    playerId: o.playerId,
    serverOrZone: o.serverOrZone ?? null,
    status: o.status,
    checkoutUrl: o.checkoutUrl ?? null,
    whopCheckoutId: o.whopCheckoutId ?? null,
    gameName: o.gameName ?? null,
    packageName: o.packageName ?? null,
    packageAmount: o.packageAmount ?? null,
    packagePrice: o.packagePrice ? parseFloat(o.packagePrice) : null,
    createdAt: o.createdAt.toISOString(),
  };
}

export default router;