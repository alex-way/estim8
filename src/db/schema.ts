import type { Choice, RoomState } from "$lib/types";
import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id", { length: 36 }).primaryKey(),
	name: text("name", { length: 32 }),
	cardBack: text("card_back", { length: 32 }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(user, ({ many }) => ({
	usersToRoomUser: many(usersToRooms),
}));

export const room = sqliteTable("room", {
	id: text("id", { length: 36 }).primaryKey(),
	name: text("name", { length: 32 }),
	showResults: integer("show_results", { mode: "boolean" }).notNull().default(false),
	selectableChoices: text("selectable_choices", { mode: "json" }).notNull().$type<number[]>(),
	allowSnooping: integer("allow_snooping", { mode: "boolean" }).notNull().default(false),
	allowUnknown: integer("allow_unknown", { mode: "boolean" }).notNull().default(false),
	adminDeviceId: text("admin_device_id", { length: 36 }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const roomRelations = relations(room, ({ many, one }) => ({
	usersToRooms: many(usersToRooms),
	admin: one(user, {
		fields: [room.adminDeviceId],
		references: [user.id],
	}),
}));

export const usersToRooms = sqliteTable(
	"room_user",
	{
		roomId: text("room_id", { length: 36 }).notNull(),
		deviceId: text("device_id", { length: 36 }).notNull(),
		choice: integer("choice", { mode: "number" }).$type<Choice>(),
		isParticipant: integer("is_participant", { mode: "boolean" }).notNull().default(true),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
		removedByAdmin: integer("removed_by_admin", { mode: "boolean" }).notNull().default(false),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.deviceId, table.roomId] }),
	}),
);

export const usersToRoomsRelations = relations(usersToRooms, ({ one }) => ({
	room: one(room, {
		fields: [usersToRooms.roomId],
		references: [room.id],
	}),
	user: one(user, {
		fields: [usersToRooms.deviceId],
		references: [user.id],
	}),
}));

export const schema = { room, user, usersToRooms, roomRelations, usersRelations, usersToRoomsRelations };

export default schema;
