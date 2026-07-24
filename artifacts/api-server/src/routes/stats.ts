import { Router } from "express";
import { db } from "@workspace/db";
import { gamesTable, packagesTable, ordersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const [totalOrdersResult] = await db.select({ count: count() }).from(ordersTable);
  const [activeGamesResult] = await db.select({ count: count() }).from(gamesTable).where(eq(gamesTable.isActive, true));
  const [totalPackagesResult] = await db.select({ count: count() }).from(packagesTable);

  res.json({
    totalOrders: Number(totalOrdersResult?.count ?? 0),
    activeGames: Number(activeGamesResult?.count ?? 0),
    totalPackages: Number(totalPackagesResult?.count ?? 0),
  });
});

export default router;
