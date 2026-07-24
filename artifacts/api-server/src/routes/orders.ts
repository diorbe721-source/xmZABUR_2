import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/orders", async (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(Math.min(limit, 100));

  res.json(orders.map(formatOrder));
});

router.get("/orders/:orderId", async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  if (isNaN(orderId)) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
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
