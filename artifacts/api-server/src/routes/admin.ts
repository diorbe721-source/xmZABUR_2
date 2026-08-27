import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
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