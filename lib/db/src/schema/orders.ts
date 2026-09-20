import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gamesTable, packagesTable } from "./games";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => gamesTable.id),
  packageId: integer("package_id").notNull().references(() => packagesTable.id),
  playerId: text("player_id").notNull(),
  serverOrZone: text("server_or_zone"),
  status: text("status").notNull().default("pending"),
  checkoutUrl: text("checkout_url"),
  whopCheckoutId: text("whop_checkout_id"),
  // Denormalized for order history display
  gameName: text("game_name"),
  packageName: text("package_name"),
  packageAmount: integer("package_amount"),
  packagePrice: numeric("package_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
5