import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const leaderboard = sqliteTable("leaderboard", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	nick: text("nick", { length: 100 }).notNull(),
	score: integer("score").notNull(),
	snakeLength: integer("snake_length").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Leaderboard = typeof leaderboard.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboard.$inferInsert;
