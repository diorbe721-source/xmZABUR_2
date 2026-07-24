import { Router } from "express";
import { db } from "@workspace/db";
import { gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/games", async (req, res) => {
  const games = await db.select().from(gamesTable).where(eq(gamesTable.isActive, true));
  res.json(games.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    description: g.description,
    imageUrl: g.imageUrl,
    currency: g.currency,
    isActive: g.isActive,
  })));
});

export default router;
