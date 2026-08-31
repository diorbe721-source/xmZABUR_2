import { Router, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const MAX_TIMESTAMP_DRIFT_SECONDS = 5 * 60;

type WhopEvent = {
  id?: string;
  type?: string;
  account_id?: string;
  company_id?: string;
  data?: Record<string, unknown>;
};

router.post("/webhooks/whop", async (req: Request, res: Response) => {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body ?? {}));
  const webhookId = req.header("webhook-id");
  const webhookTimestamp = req.header("webhook-timestamp");
  const webhookSignature = req.header("webhook-signature");
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  if (!webhookSecret || !webhookId || !webhookTimestamp || !webhookSignature) {
    res.status(400).json({ error: "Webhook verification headers are missing" });
    return;
  }

  if (!isFreshTimestamp(webhookTimestamp)) {
    res.status(400).json({ error: "Webhook timestamp is too old" });
    return;
  }

  if (!verifySignature(webhookSecret, webhookId, webhookTimestamp, rawBody, webhookSignature)) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  let event: WhopEvent;
  try {
    event = JSON.parse(rawBody.toString("utf8")) as WhopEvent;
  } catch {
    res.status(400).json({ error: "Invalid webhook JSON" });
    return;
  }

  const accountId = event.account_id || event.company_id;
  if (accountId && process.env.WHOP_COMPANY_ID && accountId !== process.env.WHOP_COMPANY_ID) {
    res.status(403).json({ error: "Webhook account does not match this store" });
    return;
  }

  const checkoutConfigurationId = findCheckoutConfigurationId(event.data);
  if (!checkoutConfigurationId) {
    res.json({ received: true, ignored: "No checkout configuration found" });
    return;
  }

  const status = event.type === "payment.succeeded"
    ? "paid"
    : event.type === "payment.failed"
      || event.type === "refund.created"
      || event.type === "refund.updated"
      ? "failed"
      : null;

  if (!status) {
    res.json({ received: true, ignored: `Event ${event.type || "unknown"} is not an order status event` });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.whopCheckoutId, checkoutConfigurationId))
    .returning({ id: ordersTable.id });

  res.json({
    received: true,
    eventId: event.id ?? webhookId,
    orderId: order?.id ?? null,
    status,
  });
});

function isFreshTimestamp(timestamp: string) {
  const timestampSeconds = Number(timestamp);
  return Number.isFinite(timestampSeconds)
    && Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) <= MAX_TIMESTAMP_DRIFT_SECONDS;
}

function verifySignature(
  secret: string,
  webhookId: string,
  timestamp: string,
  body: Buffer,
  signatureHeader: string,
) {
  const secretValue = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(secretValue, "base64");
  } catch {
    return false;
  }

  const signedPayload = Buffer.concat([
    Buffer.from(`${webhookId}.${timestamp}.`),
    body,
  ]);
  const expected = createHmac("sha256", secretBytes).update(signedPayload).digest("base64");

  return signatureHeader.split(" ").some((versionedSignature) => {
    const [version, signature] = versionedSignature.split(",", 2);
    if (version !== "v1" || !signature || signature.length !== expected.length) return false;
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

function findCheckoutConfigurationId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCheckoutConfigurationId(item);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of [
    "checkout_configuration_id",
    "checkoutConfigurationId",
    "checkout_config_id",
  ]) {
    if (typeof record[key] === "string") return record[key];
  }

  for (const key of ["checkout_configuration", "checkoutConfiguration"]) {
    const nested = record[key];
    if (nested && typeof nested === "object") {
      const id = (nested as Record<string, unknown>).id;
      if (typeof id === "string") return id;
    }
  }

  for (const nested of Object.values(record)) {
    const found = findCheckoutConfigurationId(nested);
    if (found) return found;
  }
  return null;
}

export default router;