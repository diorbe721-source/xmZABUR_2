import { pgTable, serial, text, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  currency: text("currency").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => gamesTable.id),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  bonus: integer("bonus"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  isPopular: boolean("is_popular").notNull().default(false),
  whopPlanId: text("whop_plan_id"),
});

export const insertPackageSchema = createInsertSchema(packagesTable).omit({ id: true });
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packagesTable.$inferSelect;
