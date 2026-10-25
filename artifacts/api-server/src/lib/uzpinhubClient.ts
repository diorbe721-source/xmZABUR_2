import { randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, gamesTable, ordersTable, packagesTable } from "@workspace/db";

const API_BASE = (process.env.UZPINHUB_API_BASE_URL || "https://api.uzpinhub.uz/api").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 10_000;
let authenticationBlocked = false;

type ProviderOrderResponse = {
  order_id?: string;
  external_order_id?: string;
  status?: string;
  amount?: string | number;
};

async function providerRequest<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const apiKey = process.env.UZPINHUB_API_KEY;
  if (!apiKey) throw new Error("UZPINHUB_API_KEY is not configured");
  if (authenticationBlocked) {
    throw new Error("UZPINHUB authentication previously failed; verify the API key before retrying");
  }

  const response = await fetch(`${API_BASE}/${path.replace(/^\/+/, "")}`, {
    method,
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    // The provider warns repeated authentication failures may permanently block this IP.
    if (response.status === 401) authenticationBlocked = true;
    // Do not include provider response bodies: they may contain sensitive details.
    throw new Error(`UZPINHUB request failed with HTTP ${response.status}`);
  }
  return await response.json() as T;
}

export async function validateUzhubPlayer(
  providerGameId: string,
  playerId: string,
  serverId: string,
): Promise<{ gamer_name?: string }> {
  return providerRequest("order/topup/check_game_ids", "POST", {
    game_id: providerGameId,
    player_id: playerId,
    server_id: serverId,
  });
}

export function makeUzhubCallbackUrl(): string {
  const token = process.env.UZPINHUB_WEBHOOK_TOKEN;
  if (!token) throw new Error("UZPINHUB_WEBHOOK_TOKEN is not configured");
  const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
  const domain = domains?.split(",")[0]?.trim();
  if (!domain) throw new Error("A public Replit domain is required for the UZPINHUB callback");
  return `https://${domain}/api/webhooks/uzpinhub?token=${encodeURIComponent(token)}`;
}

export async function submitPaidUzhubOrder(orderId: number): Promise<void> {
  // Atomic claim: repeated payment webhooks cannot submit the same order twice.
  const [claimed] = await db
    .update(ordersTable)
    .set({ uzpinhubStatus: "submitting", uzpinhubError: null })
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, "paid"), isNull(ordersTable.uzpinhubStatus)))
    .returning();

  if (!claimed) return;

  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, claimed.gameId)).limit(1);
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, claimed.packageId)).limit(1);
    if (!game?.uzpinhubGameId || !pkg?.uzpinhubProductId) {
      await db.update(ordersTable)
        .set({ uzpinhubStatus: "configuration_error", uzpinhubError: "UZPINHUB game/product mapping is missing" })
        .where(eq(ordersTable.id, orderId));
      return;
    }

    const callbackUrl = makeUzhubCallbackUrl();
    const externalOrderId = `zubapin-${orderId}-${randomUUID()}`;
    const result = await providerRequest<ProviderOrderResponse>("order/topup/buy", "POST", {
      external_order_id: externalOrderId,
      game_product_id: pkg.uzpinhubProductId,
      player_id: claimed.playerId,
      server_id: claimed.serverOrZone || "",
      callback_url: callbackUrl,
    });

    if (!result.order_id) {
      await db.update(ordersTable)
        .set({
          uzpinhubExternalOrderId: externalOrderId,
          uzpinhubStatus: "unknown",
          uzpinhubError: "Provider response did not contain order_id; verify provider dashboard before retrying",
        })
        .where(eq(ordersTable.id, orderId));
      return;
    }

    const providerStatus = typeof result.status === "string" ? result.status : "processing";
    const localStatus = providerStatus === "completed" ? "completed" : providerStatus === "failed" ? "failed" : "processing";
    await db.update(ordersTable)
      .set({
        uzpinhubOrderId: result.order_id,
        uzpinhubExternalOrderId: externalOrderId,
        uzpinhubStatus: providerStatus,
        uzpinhubError: null,
        status: localStatus,
      })
      .where(eq(ordersTable.id, orderId));
  } catch (error) {
    // A timeout can happen after the provider accepted the order. Do not auto-retry
    // an ambiguous submission because it could deliver twice; reconcile manually.
    const message = error instanceof Error ? error.message : "Unknown provider error";
    const safeMessage = message.slice(0, 240);
    await db.update(ordersTable)
      .set({ uzpinhubStatus: "unknown", uzpinhubError: safeMessage })
      .where(eq(ordersTable.id, orderId));
  }
}

export function safeTokenEquals(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function handleUzhubCallback(payload: unknown): Promise<{ received: boolean; ignored?: boolean }> {
  if (!payload || typeof payload !== "object") throw new Error("Invalid webhook payload");
  const data = payload as { order_id?: unknown; status?: unknown };
  if (typeof data.order_id !== "string" || !["processing", "completed", "failed"].includes(String(data.status))) {
    throw new Error("Invalid webhook payload");
  }

  const providerStatus = data.status as "processing" | "completed" | "failed";
  const [order] = await db.select().from(ordersTable)
    .where(eq(ordersTable.uzpinhubOrderId, data.order_id)).limit(1);

  if (!order) return { received: true, ignored: true };

  const localStatus = providerStatus === "completed" ? "completed" : providerStatus === "failed" ? "failed" : "processing";
  await db.update(ordersTable)
    .set({ status: localStatus, uzpinhubStatus: providerStatus, uzpinhubError: null })
    .where(eq(ordersTable.id, order.id));

  return { received: true };
}
