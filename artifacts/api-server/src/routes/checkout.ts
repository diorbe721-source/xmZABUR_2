import { Router } from "express";
import { db } from "@workspace/db";
import { packagesTable, gamesTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getWhopClient } from "../lib/whopClient";
import { CreateCheckoutBody } from "@workspace/api-zod";
import { validateUzhubPlayer } from "../lib/uzpinhubClient";

const router = Router();

const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID!;
const WHOP_PRODUCT_ID = "prod_ZLa3Do1mJSl3n";

// Get or create a Whop plan for a given price (in USD dollars)
async function getOrCreatePlan(price: number, packageName: string, packageId: number): Promise<string> {
  // Check if we already have a plan stored
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId)).limit(1);
  if (pkg?.whopPlanId) return pkg.whopPlanId;

  // Create plan via Whop API
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  const resp = await fetch(`https://${hostname}/api/v2/proxy/api/v1/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Replit-Token": token!,
      "Connector-Name": "whop",
    },
    body: JSON.stringify({
      company_id: WHOP_COMPANY_ID,
      product_id: WHOP_PRODUCT_ID,
      initial_price: price,
      currency: "usd",
      billing_period: 0,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to create Whop plan: ${resp.status} ${text}`);
  }

  const plan = await resp.json() as { id: string };
  const planId: string = plan.id;

  // Store the plan ID back on the package
  await db.update(packagesTable).set({ whopPlanId: planId }).where(eq(packagesTable.id, packageId));

  return planId;
}

router.post("/checkout", async (req, res) => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { packageId, playerId, serverOrZone } = parsed.data;

  // Load package and game
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId)).limit(1);
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, pkg.gameId)).limit(1);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const isMlbb = /mobile.?legends|mlbb/i.test(`${game.slug} ${game.name}`);
  if (isMlbb) {
    if (!process.env.UZPINHUB_API_KEY) {
      res.status(503).json({ error: "UZPINHUB is not configured yet" });
      return;
    }
    if (!game.uzpinhubGameId || !pkg.uzpinhubProductId) {
      res.status(503).json({ error: "UZPINHUB game/product mapping is missing; checkout is temporarily disabled" });
      return;
    }
    if (!serverOrZone?.trim()) {
      res.status(400).json({ error: "MLBB Zone/Server ID is required" });
      return;
    }
    try {
      await validateUzhubPlayer(game.uzpinhubGameId, playerId.trim(), serverOrZone.trim());
    } catch {
      res.status(400).json({ error: "Player ID could not be validated. Check the ID and Zone/Server ID, then try again." });
      return;
    }
  }

  const price = parseFloat(pkg.price);

  // Get or create Whop plan
  const planId = await getOrCreatePlan(price, pkg.name, pkg.id);

  // Build redirect URL — use REPLIT_DEV_DOMAIN in dev, REPLIT_DOMAINS in prod
  const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
  const domain = domains?.split(",")[0];

  // Create a temporary order to get the ID for the redirect URL
  const [order] = await db
    .insert(ordersTable)
    .values({
      gameId: game.id,
      packageId: pkg.id,
      playerId,
      serverOrZone: serverOrZone ?? null,
      status: "pending",
      gameName: game.name,
      packageName: pkg.name,
      packageAmount: pkg.amount,
      packagePrice: pkg.price,
    })
    .returning();

  const redirectUrl = domain
    ? `https://${domain}/orders/${order.id}`
    : `http://localhost/orders/${order.id}`;

  // Create Whop checkout configuration
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  const ccResp = await fetch(`https://${hostname}/api/v2/proxy/api/v1/checkout_configurations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Replit-Token": token!,
      "Connector-Name": "whop",
    },
    body: JSON.stringify({
      plan_id: planId,
      redirect_url: redirectUrl,
    }),
  });

  if (!ccResp.ok) {
    const text = await ccResp.text();
    // Rollback: delete the pending order
    await db.delete(ordersTable).where(eq(ordersTable.id, order.id));
    res.status(500).json({ error: `Checkout creation failed: ${text}` });
    return;
  }

  const cc = await ccResp.json() as { purchase_url: string; id: string };
  const checkoutUrl: string = cc.purchase_url;
  const checkoutId: string = cc.id;

  // Update order with checkout info
  await db
    .update(ordersTable)
    .set({ checkoutUrl, whopCheckoutId: checkoutId })
    .where(eq(ordersTable.id, order.id));

  res.status(201).json({ checkoutUrl, orderId: order.id });
});

export default router;
