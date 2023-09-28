import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { RoomState } from "$lib/types";
import { sql } from "drizzle-orm";

export const rooms = sqliteTable("rooms", {
	id: text("id", { length: 128 }).primaryKey(),
	state: text("state", { mode: "json" }).$type<RoomState>(),
	created_at: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
	updated_at: integer("updated_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
});

export const schema = {
	rooms,
};

export default schema;
