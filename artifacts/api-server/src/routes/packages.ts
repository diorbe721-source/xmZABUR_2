import { Router } from "express";
import { db } from "@workspace/db";
import { packagesTable, gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/games/:gameId/packages", async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);
  if (isNaN(gameId)) {
    res.status(400).json({ error: "Invalid game ID" });
    return;
  }

  const game = await db.select().from(gamesTable).where(eq(gamesTable.id, gameId)).limit(1);
  if (!game.length) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const packages = await db.select().from(packagesTable).where(eq(packagesTable.gameId, gameId));
  res.json(packages.map((p) => ({
    id: p.id,
    gameId: p.gameId,
    name: p.name,
    amount: p.amount,
    bonus: p.bonus ?? null,
    price: parseFloat(p.price),
    currency: p.currency,
    isPopular: p.isPopular,
  })));
});

export default router;
