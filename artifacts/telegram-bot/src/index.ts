import { Telegraf, Markup } from "telegraf";
import { db } from "@workspace/db";
import { gamesTable, packagesTable, ordersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi topilmadi");

const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID!;
const WHOP_PRODUCT_ID = "prod_ZLa3Do1mJSl3n";

const bot = new Telegraf(BOT_TOKEN);

// ─── In-memory user state ──────────────────────────────────────────────────
interface UserState {
  step: "awaiting_player_id";
  packageId: number;
  gameName: string;
  packageName: string;
  price: number;
  currency: string;
  gameId: number;
}
const userState = new Map<number, UserState>();

// ─── Whop helpers ──────────────────────────────────────────────────────────
function getWhopHeaders() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;
  return { hostname, token };
}

async function getOrCreatePlan(packageId: number, price: number): Promise<string> {
  const [pkg] = await db
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.id, packageId))
    .limit(1);
  if (pkg?.whopPlanId) return pkg.whopPlanId;

  const { hostname, token } = getWhopHeaders();
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

  if (!resp.ok) throw new Error(`Whop plan yaratilmadi: ${await resp.text()}`);
  const plan = (await resp.json()) as { id: string };
  await db
    .update(packagesTable)
    .set({ whopPlanId: plan.id })
    .where(eq(packagesTable.id, packageId));
  return plan.id;
}

async function createCheckout(packageId: number, playerId: string) {
  const [pkg] = await db
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.id, packageId))
    .limit(1);
  if (!pkg) throw new Error("Paket topilmadi");

  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, pkg.gameId))
    .limit(1);
  if (!game) throw new Error("O'yin topilmadi");

  const price = parseFloat(pkg.price);
  const planId = await getOrCreatePlan(packageId, price);

  // Create pending order first (to get orderId for redirect)
  const [order] = await db
    .insert(ordersTable)
    .values({
      gameId: game.id,
      packageId: pkg.id,
      playerId,
      status: "pending",
      gameName: game.name,
      packageName: pkg.name,
      packageAmount: pkg.amount,
      packagePrice: pkg.price,
    })
    .returning();

  const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
  const domain = domains?.split(",")[0];
  const redirectUrl = domain
    ? `https://${domain}/orders/${order.id}`
    : `http://localhost/orders/${order.id}`;

  const { hostname, token } = getWhopHeaders();
  const ccResp = await fetch(
    `https://${hostname}/api/v2/proxy/api/v1/checkout_configurations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Replit-Token": token!,
        "Connector-Name": "whop",
      },
      body: JSON.stringify({ plan_id: planId, redirect_url: redirectUrl }),
    }
  );

  if (!ccResp.ok) {
    await db.delete(ordersTable).where(eq(ordersTable.id, order.id));
    throw new Error(`Checkout yaratilmadi: ${await ccResp.text()}`);
  }

  const cc = (await ccResp.json()) as { purchase_url: string; id: string };
  await db
    .update(ordersTable)
    .set({ checkoutUrl: cc.purchase_url, whopCheckoutId: cc.id })
    .where(eq(ordersTable.id, order.id));

  return { checkoutUrl: cc.purchase_url, orderId: order.id };
}

// ─── Main menu message ────────────────────────────────────────────────────
function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.webApp("🎮 Open App", "https://zubapin--zaburmlbb.replit.app/")],
    [Markup.button.callback("🎮 O'yinlar ro'yxati", "show_games")],
    [Markup.button.callback("📋 Buyurtmani tekshirish", "check_order")],
  ]);
}

// ─── Commands ─────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const name = ctx.from.first_name || "Foydalanuvchi";
  await ctx.reply(
    `👋 *Salom, ${name}!*\n\n🎮 *GamePay* botiga xush kelibsiz!\n\nO'yin valyutalarini tez va xavfsiz tarzda to'ldiring. Quyida o'yinni tanlang:`,
    { parse_mode: "Markdown", ...mainMenuKeyboard() }
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    `*📖 GamePay Bot — Yordam*\n\n` +
      `/start — Bosh menyu\n` +
      `/status <raqam> — Buyurtma holatini ko'rish\n\n` +
      `*Qanday ishlaydi?*\n` +
      `1️⃣ O'yin tanlang\n` +
      `2️⃣ Paket tanlang\n` +
      `3️⃣ Player ID kiriting\n` +
      `4️⃣ To'lov havolasini oling\n` +
      `5️⃣ To'lovdan so'ng kredit avtomatik qo'shiladi\n`,
    { parse_mode: "Markdown" }
  );
});

bot.command("status", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const orderId = parseInt(args[1] ?? "");
  if (isNaN(orderId)) {
    await ctx.reply(
      "❌ To'g'ri buyurtma raqamini kiriting.\n\nMasalan: `/status 42`",
      { parse_mode: "Markdown" }
    );
    return;
  }
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);
  if (!order) {
    await ctx.reply("❌ Buyurtma topilmadi.");
    return;
  }
  const statusLabel: Record<string, string> = {
    pending: "⏳ Kutilmoqda",
    paid: "✅ To'landi",
    processing: "🔄 Jarayonda",
    completed: "🎉 Bajarildi",
    failed: "❌ Xato",
  };
  await ctx.reply(
    `*📋 Buyurtma #${order.id}*\n\n` +
      `🎮 O'yin: ${order.gameName}\n` +
      `📦 Paket: ${order.packageName}\n` +
      `💰 Narxi: $${order.packagePrice}\n` +
      `👤 Player ID: ${order.playerId}\n` +
      `📌 Holat: *${statusLabel[order.status] ?? order.status}*`,
    { parse_mode: "Markdown" }
  );
});

// ─── Inline button handlers ───────────────────────────────────────────────
bot.action("show_games", async (ctx) => {
  await ctx.answerCbQuery();
  const games = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.isActive, true));
  const buttons = games.map((g) => [
    Markup.button.callback(`🎮 ${g.name}`, `game:${g.id}`),
  ]);
  buttons.push([Markup.button.callback("🔙 Orqaga", "back_start")]);
  await ctx.editMessageText("🎮 *O'yin tanlang:*", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
});

bot.action("check_order", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "📋 Buyurtma raqamingizni yuboring:\n\nMasalan: `/status 42`",
    { parse_mode: "Markdown" }
  );
});

bot.action("back_start", async (ctx) => {
  await ctx.answerCbQuery();
  const name = ctx.from?.first_name || "Foydalanuvchi";
  await ctx.editMessageText(
    `👋 *Salom, ${name}!*\n\n🎮 *GamePay* botiga xush kelibsiz!\n\nO'yin valyutalarini tez va xavfsiz tarzda to'ldiring. Quyida o'yinni tanlang:`,
    { parse_mode: "Markdown", ...mainMenuKeyboard() }
  );
});

// Game selected → show packages
bot.action(/^game:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const gameId = parseInt(ctx.match[1]);
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, gameId))
    .limit(1);
  if (!game) {
    await ctx.reply("❌ O'yin topilmadi.");
    return;
  }

  const packages = await db
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.gameId, gameId));

  const buttons = packages.map((p) => {
    const star = p.isPopular ? "⭐ " : "";
    const bonus = p.bonus ? ` +${p.bonus}` : "";
    return [
      Markup.button.callback(
        `${star}${p.amount}${bonus} ${game.currency} — $${p.price}`,
        `pkg:${p.id}`
      ),
    ];
  });
  buttons.push([Markup.button.callback("🔙 Orqaga", "show_games")]);

  await ctx.editMessageText(
    `*${game.name}*\n\n${game.description}\n\n📦 *Paket tanlang:*`,
    { parse_mode: "Markdown", ...Markup.inlineKeyboard(buttons) }
  );
});

// Package selected → ask for player ID
bot.action(/^pkg:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const packageId = parseInt(ctx.match[1]);
  const [pkg] = await db
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.id, packageId))
    .limit(1);
  if (!pkg) {
    await ctx.reply("❌ Paket topilmadi.");
    return;
  }
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, pkg.gameId))
    .limit(1);

  const chatId = ctx.chat!.id;
  userState.set(chatId, {
    step: "awaiting_player_id",
    packageId: pkg.id,
    gameId: pkg.gameId,
    gameName: game?.name ?? "",
    packageName: pkg.name,
    price: parseFloat(pkg.price),
    currency: pkg.currency,
  });

  const bonus = pkg.bonus ? ` (+${pkg.bonus} bonus)` : "";
  await ctx.editMessageText(
    `✅ *${game?.name}* — ${pkg.amount} ${pkg.currency}${bonus}\n` +
      `💰 Narxi: *$${pkg.price}*\n\n` +
      `👤 *Player ID ni kiriting:*\n` +
      `_Profilingizdagi ID raqamingizni ko'chiring va yuboring_`,
    { parse_mode: "Markdown" }
  );
});

// Status inline button (alert)
bot.action(/^chk:(\d+)$/, async (ctx) => {
  const orderId = parseInt(ctx.match[1]);
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);
  const statusLabel: Record<string, string> = {
    pending: "⏳ Kutilmoqda",
    paid: "✅ To'landi",
    processing: "🔄 Jarayonda",
    completed: "🎉 Bajarildi",
    failed: "❌ Xato",
  };
  const label = order
    ? `Buyurtma #${orderId}: ${statusLabel[order.status] ?? order.status}`
    : "Buyurtma topilmadi";
  await ctx.answerCbQuery(label, { show_alert: true });
});

// ─── Text handler — player ID input ──────────────────────────────────────
bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const state = userState.get(chatId);

  if (!state || state.step !== "awaiting_player_id") {
    await ctx.reply(
      "👋 Boshlash uchun /start buyrug'ini yuboring.",
      Markup.inlineKeyboard([[Markup.button.callback("🏠 Bosh menyu", "back_start")]])
    );
    return;
  }

  const playerId = ctx.message.text.trim();
  if (!playerId || playerId.startsWith("/")) {
    await ctx.reply("❌ Noto'g'ri Player ID. Qaytadan kiriting:");
    return;
  }

  userState.delete(chatId);

  const processingMsg = await ctx.reply("⏳ To'lov havolasi tayyorlanmoqda...");

  try {
    const { checkoutUrl, orderId } = await createCheckout(state.packageId, playerId);
    await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);

    const bonus =
      state.currency !== state.gameName
        ? ` ${state.currency}`
        : ` ${state.currency}`;

    await ctx.reply(
      `🎉 *Buyurtma tayyor!*\n\n` +
        `🎮 O'yin: *${state.gameName}*\n` +
        `📦 Paket: ${state.packageName}\n` +
        `💰 Narxi: *$${state.price}*\n` +
        `👤 Player ID: \`${playerId}\`\n` +
        `🔖 Buyurtma raqami: *#${orderId}*\n\n` +
        `Quyidagi tugmani bosib to'lovni amalga oshiring. To'lovdan so'ng kredit avtomatik qo'shiladi! 🚀`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.url("💳 To'lov qilish", checkoutUrl)],
          [Markup.button.callback(`📋 Holat: #${orderId}`, `chk:${orderId}`)],
          [Markup.button.callback("🏠 Bosh menyu", "back_start")],
        ]),
      }
    );
  } catch (err) {
    console.error("Checkout xatosi:", err);
    try {
      await ctx.telegram.deleteMessage(chatId, processingMsg.message_id);
    } catch {}
    await ctx.reply(
      "❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
      Markup.inlineKeyboard([[Markup.button.callback("🔄 Qayta urinish", "show_games")]])
    );
  }
});

// ─── Launch ───────────────────────────────────────────────────────────────
console.log("🤖 GamePay Telegram bot ishga tushmoqda...");
bot.launch({ dropPendingUpdates: true });
console.log("✅ Bot ishga tushdi! Polling faol.");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
